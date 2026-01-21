import { OfferCandidate, ScoredOffer } from '../types.js';

const WEIGHT_PRICE = 0.7;
const WEIGHT_CONFIDENCE = 0.3;

function seatQualityBonus(seatInfo?: string): number {
  if (!seatInfo) {
    return 0;
  }
  const normalized = seatInfo.toLowerCase();
  if (normalized.includes('lower')) {
    return 0.05;
  }
  if (normalized.includes('vip')) {
    return 0.08;
  }
  return 0.01;
}

export function scoreOffer(offer: OfferCandidate): ScoredOffer {
  const priceScore = offer.totalPrice > 0 ? 1 / offer.totalPrice : 0;
  const score =
    priceScore * WEIGHT_PRICE +
    offer.confidence * WEIGHT_CONFIDENCE +
    seatQualityBonus(offer.seatInfo);

  return { offer, score };
}
