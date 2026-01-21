import axios from 'axios';
import { NotificationResult, OfferCandidate } from '../types.js';

export interface TelegramConfig {
  token: string;
  chatId: string;
}

function formatConfidence(confidence: number): string {
  if (confidence >= 0.75) {
    return 'High';
  }
  if (confidence >= 0.45) {
    return 'Medium';
  }
  return 'Low';
}

export function formatTelegramAlert(offer: OfferCandidate): string {
  const dateText = offer.eventDate ? offer.eventDate.split('T')[0] : 'TBD';
  const seatText = offer.seatInfo ?? 'General';

  return [
    '⚽ New Ticket Deal Found',
    '',
    `Match: ${offer.fixtureText}`,
    `Date: ${dateText}`,
    `Source: ${offer.source}`,
    `Price: ${offer.currency} ${offer.totalPrice.toFixed(2)} (total)`,
    `Seats: ${seatText}`,
    `Confidence: ${formatConfidence(offer.confidence)}`,
    '',
    `Link: ${offer.url}`,
  ].join('\n');
}

export async function sendTelegramAlert(
  config: TelegramConfig,
  offer: OfferCandidate,
): Promise<NotificationResult> {
  const message = formatTelegramAlert(offer);
  const url = `https://api.telegram.org/bot${config.token}/sendMessage`;

  await axios.post(url, {
    chat_id: config.chatId,
    text: message,
  });

  return { sent: true };
}
