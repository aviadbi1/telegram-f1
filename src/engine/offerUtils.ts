import { OfferCandidate } from '../types.js';

function normalizeSeat(seatInfo?: string): string {
  return seatInfo ? seatInfo.toLowerCase().replace(/\s+/g, '-') : 'general';
}

function priceBand(totalPrice: number): number {
  if (!Number.isFinite(totalPrice)) {
    return 0;
  }
  return Math.round(totalPrice / 5) * 5;
}

export function buildOfferKey(offer: OfferCandidate): string {
  const band = priceBand(offer.totalPrice);
  return [
    offer.source,
    offer.fixtureText.toLowerCase(),
    normalizeSeat(offer.seatInfo),
    offer.currency,
    band,
  ].join('|');
}
