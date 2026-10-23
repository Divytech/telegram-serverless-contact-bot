import { api, db } from 'sdk';
import { eq } from 'sdk/db';
import { users, replies, settings } from '../schema.js';
import { OWNER_ID } from '../lib/config.js';

export default async function (message) {
  if (!message?.chat?.id) return;

  // Unconfigured owner notice
  if (!OWNER_ID) {
    const id = message.from?.id ?? message.chat.id;
    await api.sendMessage({
      chat_id: message.chat.id,
      text: `⚠️ <b>Owner ID not set</b>\nYour Telegram ID is: <code>${id}</code>\n\nSet <code>export const OWNER_ID = ${id};</code> in <code>tgcloud/lib/config.js</code> and run <code>npm run deploy</code>.`,
      parse_mode: 'HTML',
    });
    return;
  }

  // Owner commands & replies
  if (message.chat.id === OWNER_ID) {
    if (message.text === '/stats') {
      const total = await db.$count(users);
      const banned = await db.$count(users, eq(users.isBanned, true));
      await api.sendMessage({
        chat_id: OWNER_ID,
        text: `📊 <b>Bot Statistics</b>\n\n• Total users: <b>${total}</b>\n• Active users: <b>${total - banned}</b>\n• Banned users: <b>${banned}</b>`,
        parse_mode: 'HTML',
      });
      return;
    }

    if (message.text?.startsWith('/setstart')) {
      const newStart = message.text.replace('/setstart', '').trim();
      if (!newStart) {
        await api.sendMessage({
          chat_id: OWNER_ID,
          text: 'Usage: <code>/setstart &lt;new welcome message&gt;</code>',
          parse_mode: 'HTML',
        });
        return;
      }
      await db.insert(settings).values({
        key: 'start_message',
        value: newStart,
      }).onConflictDoUpdate({
        target: settings.key,
        set: { value: newStart },
      }).run();

      await api.sendMessage({
        chat_id: OWNER_ID,
        text: '✓ Start message updated.',
        reply_parameters: { message_id: message.message_id },
      });
      return;
    }

    if (message.text?.startsWith('/broadcast')) {
      const text = message.text.replace('/broadcast', '').trim();
      if (!text && !message.reply_to_message) {
        await api.sendMessage({ chat_id: OWNER_ID, text: 'Usage: /broadcast <text> or reply /broadcast to media.' });
        return;
      }
      const allUsers = await db.select({ chatId: users.chatId, isBanned: users.isBanned }).from(users).all();
      let sent = 0;
      for (const u of allUsers) {
        if (u.chatId === OWNER_ID || u.isBanned) continue;
        try {
          if (message.reply_to_message) {
            await api.copyMessage({ chat_id: u.chatId, from_chat_id: OWNER_ID, message_id: message.reply_to_message.message_id });
          } else {
            await api.sendMessage({ chat_id: u.chatId, text });
          }
          sent++;
        } catch {}
      }
      await api.sendMessage({ chat_id: OWNER_ID, text: `✓ Broadcast sent to ${sent} active users.` });
      return;
    }

    if (message.reply_to_message) {
      const target = await db.select().from(replies)
        .where(eq(replies.ownerMessageId, message.reply_to_message.message_id))
        .get();

      if (target) {
        if (message.text === '/ban') {
          await db.update(users).set({ isBanned: true }).where(eq(users.chatId, target.userChatId)).run();
          await api.sendMessage({ chat_id: OWNER_ID, text: '✓ User has been banned.', reply_parameters: { message_id: message.message_id } });
          return;
        }

        if (message.text === '/unban') {
          await db.update(users).set({ isBanned: false }).where(eq(users.chatId, target.userChatId)).run();
          await api.sendMessage({ chat_id: OWNER_ID, text: '✓ User has been unbanned.', reply_parameters: { message_id: message.message_id } });
          return;
        }

        try {
          await api.copyMessage({
            chat_id: target.userChatId,
            from_chat_id: OWNER_ID,
            message_id: message.message_id,
            reply_parameters: { message_id: target.userMessageId },
          });
        } catch {
          await api.copyMessage({
            chat_id: target.userChatId,
            from_chat_id: OWNER_ID,
            message_id: message.message_id,
          });
        }
        return;
      }
    }

    if (message.text === '/start') {
      await api.sendMessage({
        chat_id: OWNER_ID,
        text: '👋 Owner console active.\n\n• Reply to forwarded messages to answer users (supports text, media & stickers).\n• Reply <code>/ban</code> to ban a user; <code>/unban</code> to unban.\n• <code>/setstart &lt;text&gt;</code> — update user welcome message.\n• <code>/stats</code> — show user metrics.\n• <code>/broadcast &lt;text&gt;</code> — announcement.',
        parse_mode: 'HTML',
      });
      return;
    }
    return;
  }

  // User flow: check ban
  const existingUser = await db.select({ isBanned: users.isBanned })
    .from(users)
    .where(eq(users.chatId, message.chat.id))
    .get();

  if (existingUser?.isBanned) {
    await api.sendMessage({ chat_id: message.chat.id, text: '⛔ You are banned from sending messages to the owner.' });
    return;
  }

  if (message.from) {
    await db.insert(users).values({
      tgId: message.from.id,
      chatId: message.chat.id,
      username: message.from.username ?? null,
      firstName: message.from.first_name ?? null,
    }).onConflictDoUpdate({
      target: users.tgId,
      set: { chatId: message.chat.id, username: message.from.username ?? null, firstName: message.from.first_name ?? null },
    }).run();
  }

  if (message.text === '/start') {
    const custom = await db.select({ value: settings.value }).from(settings).where(eq(settings.key, 'start_message')).get();
    await api.sendMessage({
      chat_id: message.chat.id,
      text: custom?.value ?? '👋 Send any message, media, or sticker here to reach the owner.',
    });
    return;
  }

  try {
    const forwarded = await api.forwardMessage({
      chat_id: OWNER_ID,
      from_chat_id: message.chat.id,
      message_id: message.message_id,
    });

    await db.insert(replies).values({
      ownerMessageId: forwarded.message_id,
      userChatId: message.chat.id,
      userMessageId: message.message_id,
    }).run();
  } catch (err) {
    console.error('Failed to forward message:', err);
  }
}
