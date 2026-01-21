import { availableAdapters, createAdapter } from '../adapters/registry.js';
import { loadRuntimeConfig } from '../config.js';
import { buildOfferKey } from '../engine/offerUtils.js';
import { sendTelegramAlert } from '../notifications/telegramNotifier.js';
import { scoreOffer } from '../scoring/scorer.js';
import { StateStore } from '../storage/stateStore.js';
import { OfferCandidate, OfferRecord } from '../types.js';
import { verifyWithPlaywright, writeVerificationErrorLog } from '../verification/playwrightVerifier.js';

const VERIFICATION_LIMIT = 10;

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function shouldNotify(offer: OfferCandidate, record: OfferRecord | undefined): boolean {
  const belowMax = offer.query.maxTotalPrice
    ? offer.totalPrice <= offer.query.maxTotalPrice
    : true;
  if (!record) {
    return belowMax;
  }
  return offer.totalPrice < record.totalPrice;
}

function updateRecordFromOffer(record: OfferRecord | undefined, offer: OfferCandidate): OfferRecord {
  const now = new Date().toISOString();
  const key = record?.key ?? buildOfferKey(offer);
  const priceHistory = record?.priceHistory ?? [];
  const lastPrice = priceHistory.at(-1)?.totalPrice;
  if (lastPrice !== offer.totalPrice) {
    priceHistory.push({ totalPrice: offer.totalPrice, seenAt: now });
  }

  return {
    ...(record ?? {}),
    ...offer,
    key,
    lastSeenAt: offer.lastSeenAt,
    priceHistory,
  };
}

export async function runScan(): Promise<void> {
  const config = await loadRuntimeConfig();
  const enabledSources = config.sources.filter(source => source.enabled);
  const adapters = enabledSources
    .map(source => createAdapter(source.name))
    .filter((adapter): adapter is NonNullable<typeof adapter> => Boolean(adapter));

  const missingAdapters = enabledSources.filter(
    source => !availableAdapters().includes(source.name),
  );

  if (missingAdapters.length > 0) {
    console.warn(
      `Unknown adapters in sources.json: ${missingAdapters.map(source => source.name).join(', ')}`,
    );
  }

  if (adapters.length === 0) {
    console.warn('No adapters enabled. Update sources.json to enable sources.');
    return;
  }

  const offers: OfferCandidate[] = [];

  for (const query of config.queries) {
    for (const adapter of adapters) {
      try {
        const results = await adapter.search(query);
        offers.push(...results);
      } catch (error) {
        console.error(`Source ${adapter.name} failed`, error);
      }
      await sleep(250);
    }
  }

  const sortedOffers = [...offers].sort((a, b) => a.totalPrice - b.totalPrice);
  const topOffers = sortedOffers.slice(0, VERIFICATION_LIMIT);

  for (const offer of topOffers) {
    const adapter = adapters.find(candidate => candidate?.name === offer.source);
    if (adapter?.verify) {
      try {
        const verified = await adapter.verify(offer);
        Object.assign(offer, verified);
      } catch (error) {
        console.error(`Verification failed for ${offer.url}`, error);
      }
      continue;
    }

    if (offer.verificationHints) {
      const result = await verifyWithPlaywright(offer);
      if (!result.verified && result.error) {
        await writeVerificationErrorLog(offer, result.error);
      }
    }
  }

  const scored = sortedOffers.map(scoreOffer).sort((a, b) => b.score - a.score);
  console.log('Top deals:');
  for (const entry of scored.slice(0, 5)) {
    console.log(`${entry.offer.fixtureText} (${entry.offer.source}) -> ${entry.score.toFixed(4)}`);
  }

  const store = new StateStore();
  const state = await store.load();
  const telegramToken = process.env.TELEGRAM_BOT_TOKEN;
  const telegramChatId = process.env.TELEGRAM_CHAT_ID;

  for (const offer of sortedOffers) {
    const key = buildOfferKey(offer);
    const existing = state.offers.find(record => record.key === key);
    const shouldAlert = shouldNotify(offer, existing);
    const updatedRecord = updateRecordFromOffer(existing, offer);

    if (shouldAlert && telegramToken && telegramChatId) {
      try {
        await sendTelegramAlert({ token: telegramToken, chatId: telegramChatId }, offer);
        updatedRecord.lastNotifiedAt = new Date().toISOString();
        console.log(`Alert sent for ${offer.fixtureText}`);
      } catch (error) {
        console.error(`Failed to send Telegram alert for ${offer.fixtureText}`, error);
      }
    }

    if (existing) {
      Object.assign(existing, updatedRecord);
    } else {
      state.offers.push(updatedRecord);
    }
  }

  await store.save(state);
}
