import axios from 'axios';
import { FixtureQuery, OfferCandidate, SourceAdapter } from '../types.js';

interface TicketmasterResponse {
  _embedded?: {
    events?: TicketmasterEvent[];
  };
}

interface TicketmasterEvent {
  name: string;
  url: string;
  dates?: {
    start?: {
      dateTime?: string;
    };
  };
  priceRanges?: Array<{
    min?: number;
    max?: number;
    currency?: string;
  }>;
  _embedded?: {
    venues?: Array<{
      city?: { name?: string };
    }>;
  };
}

export class TicketmasterSourceAdapter implements SourceAdapter {
  name = 'ticketmaster';

  async search(query: FixtureQuery): Promise<OfferCandidate[]> {
    const apiKey = process.env.TICKETMASTER_API_KEY;
    if (!apiKey) {
      console.warn('TICKETMASTER_API_KEY missing; Ticketmaster adapter disabled.');
      return [];
    }

    const params = new URLSearchParams({
      apikey: apiKey,
      keyword: [query.team, query.league].filter(Boolean).join(' ') || 'football',
      classificationName: 'Football',
      sort: 'date,asc',
      size: '10',
    });

    if (query.city) {
      params.set('city', query.city);
    }

    if (query.dateFrom) {
      params.set('startDateTime', `${query.dateFrom}T00:00:00Z`);
    }

    if (query.dateTo) {
      params.set('endDateTime', `${query.dateTo}T23:59:59Z`);
    }

    const url = `https://app.ticketmaster.com/discovery/v2/events.json?${params.toString()}`;
    const response = await axios.get<TicketmasterResponse>(url);
    const events = response.data._embedded?.events ?? [];
    const now = new Date().toISOString();

    return events.flatMap(event => {
      const priceRange = event.priceRanges?.[0];
      if (!priceRange?.min) {
        return [];
      }

      const basePrice = priceRange.min;
      const totalPrice = basePrice;
      const currency = priceRange.currency ?? 'USD';
      const city = event._embedded?.venues?.[0]?.city?.name;
      const fixtureText = [event.name, city].filter(Boolean).join(' - ');

      return [
        {
          source: this.name,
          fixtureText,
          eventDate: event.dates?.start?.dateTime,
          url: event.url,
          currency,
          basePrice,
          totalPrice,
          seatInfo: 'Ticketmaster listing',
          quantityAvailable: query.quantity,
          verified: false,
          confidence: 0.45,
          lastSeenAt: now,
          query,
          verificationHints: {
            totalSelector: '[data-testid=\"price-range\"]',
          },
        },
      ];
    });
  }
}
