# Telegram Serverless Contact Bot

A serverless contact & feedback bot built on the [tgcloud](https://tgcloud.ai) platform. Allows users to message the bot owner directly, with support for all media types, stickers, reply routing, user bans, dynamic welcome messages, and broadcasting.

---

## Features

- **Direct Forwarding**: Forwards incoming messages (text, photos, videos, stickers, voice notes, files) directly to the owner.
- **Bi-directional Replies**: The owner replies directly to any forwarded message in Telegram, and the bot routes the reply back to the sender.
- **Media & Sticker Support**: Native support for copying all message types between owner and users.
- **User Ban System**: Reply `/ban` to any forwarded message to block a user from contacting you; reply `/unban` to restore access.
- **Customizable Welcome Message**: Change the `/start` greeting dynamically using `/setstart <text>` without redeploying.
- **User Analytics**: `/stats` command provides live counts of registered, active, and banned users.
- **Broadcast System**: Send announcements to all registered users via `/broadcast <text>` or reply `/broadcast` to any media/file.
- **Zero Chat Clutter**: Operates cleanly without receipt/acknowledgment message spam.

> ⚠️ **Important**: This bot runs on Telegram's serverless platform (`tgcloud`). Deployment is **only possible if your Telegram account has Serverless access enabled**. If your account does not have serverless access, you will need to request/obtain access first.

## Getting Started

### 1. Prerequisites
- Node.js (>= 18)
- A Telegram account with **Serverless access**
- A Telegram bot created via [@BotFather](https://t.me/BotFather)

### 2. Installation
Clone the repository and install the development dependencies:
```bash
git clone <your-repo-url>
cd <repo-folder>
npm install
```

### 3. Link Your Bot
Link this local project to your Telegram bot:
```bash
npx tgcloud login
```
Paste your access token from the **CLI access** in the **Serverless** menu inside [@BotFather](https://t.me/BotFather) when prompted.

### 4. Deploy Database & Code
Run the migration to create the tables in the cloud database, then push the handlers:
```bash
npx tgcloud migrate --yes
npx tgcloud push
```

### 5. Set Your Owner ID
1. Open your bot on Telegram and send `/start`.
2. The bot will automatically reply with your numeric Telegram User ID.
3. Open `tgcloud/lib/config.js` and set your ID:
   ```javascript
   export const OWNER_ID = 123456789; // Replace with your ID
   ```
4. Deploy the config update:
   ```bash
   npx tgcloud push
   ```

---

## Owner Commands

| Command | Action |
|---|---|
| `Reply to message` | Copies your text, photo, file, or sticker directly to that user |
| `Reply /ban` | Bans the user who sent the message from contacting you |
| `Reply /unban` | Unbans the user |
| `/setstart <text>` | Updates the `/start` greeting for new users in real time |
| `/stats` | Displays total, active, and banned user counts |
| `/broadcast <text>` | Sends a text message to all registered active users |
| `Reply /broadcast` | Broadcasts the replied media/file/sticker to all users |

---

## Project Structure

```
├── tgcloud/
│   ├── handlers/
│   │   └── message.js    # Telegram message routing and commands
│   ├── lib/
│   │   └── config.js     # Bot owner configuration
│   └── schema.js         # SQLite database schema (users, replies, settings)
├── tgcloud.jsonc         # tgcloud project configuration
└── package.json          # Project scripts and dependencies
```

---

## License
MIT
