# TicketScout AI (MVP)

TicketScout AI is a Node.js + TypeScript agent that discovers football ticket
deals, normalizes total prices, ranks the best offers, and sends Telegram alerts
for new or improved deals.

## Features

- Modular source adapters (`search` + optional Playwright verification).
- Normalized offers with real total prices and confidence scoring.
- Deduplication with price-drop notifications.
- Telegram alerts for new deals or price drops.
- JSON-based persistence for MVP (easy to swap for SQLite later).

## Requirements

- Node.js 18+
- A Telegram bot token + chat ID for notifications.
- (Optional) Ticketmaster API key for the real source adapter.

## Setup

Install dependencies and build:

```bash
npm install
npm run build
```

Create configuration files in the repo root:

### `sources.json`

```json
[
  { "name": "ticketmaster", "enabled": true },
  { "name": "mock", "enabled": true }
]
```

### `queries.json`

```json
[
  {
    "league": "Premier League",
    "team": "Arsenal",
    "maxTotalPrice": 120,
    "quantity": 2
  }
]
```

## Environment Variables

| Variable | Description |
| --- | --- |
| `TELEGRAM_BOT_TOKEN` | Telegram bot token used for notifications. |
| `TELEGRAM_CHAT_ID` | Telegram chat ID where alerts are sent. |
| `TICKETMASTER_API_KEY` | (Optional) Ticketmaster Discovery API key. |

## Running a Scan

```bash
npm run build
npm run scan
```

## Adding a New Source Adapter

1. Create a file in `src/adapters/` implementing the `SourceAdapter` interface.
2. Register the adapter name in `src/adapters/registry.ts`.
3. Add the adapter to `sources.json`.

## Verification Notes

- Playwright runs only during verification of the top 10 cheapest offers.
- Failures trigger a screenshot and log under `artifacts/verification/`.
- If verification is unavailable, offers are still surfaced with lower confidence.
