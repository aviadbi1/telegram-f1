# F1-Schedule Bot

This project implements a simple Telegram bot written in TypeScript that
displays the Formula 1 calendar and standings. The bot responds to the
following text commands:

* `/full` – shows the full race schedule for the current season.
* `/next` – shows information about the upcoming race.
* `/drivers` – current driver championship standings.
* `/teams` – current constructor championship standings.

All times are converted to Israel time (Asia/Jerusalem).

## Development

Install the dependencies and compile the TypeScript sources:

```bash
npm install
npm run build
```

Run the bot by providing a Telegram bot token:

```bash
BOT_TOKEN=your_token_here npm start
```
