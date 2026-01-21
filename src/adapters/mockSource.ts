import { OfferCandidate, OfferVerified, FixtureQuery, SourceAdapter } from '../types.js';

function buildFixtureText(query: FixtureQuery): string {
  if (query.team) {
    return `${query.team} vs Rival`;
  }
  if (query.league) {
    return `${query.league} Match`;
  }
  return 'Sample Fixture';
}

export class MockSourceAdapter implements SourceAdapter {
  name = 'mock';

  async search(query: FixtureQuery): Promise<OfferCandidate[]> {
    const now = new Date().toISOString();
    const basePrice = 75 + Math.floor(Math.random() * 20);
    const fees = 8;
    const totalPrice = basePrice + fees;

    return [
      {
        source: this.name,
        fixtureText: buildFixtureText(query),
        eventDate: query.dateFrom ?? now,
        url: 'https://example.com/mock-offer',
        currency: 'EUR',
        basePrice,
        fees,
        totalPrice,
        seatInfo: 'Lower Tier',
        quantityAvailable: query.quantity ?? 2,
        verified: false,
        confidence: 0.3,
        lastSeenAt: now,
        query,
        verificationHints: {
          totalSelector: '.total-price',
        },
      },
    ];
  }

  async verify(offer: OfferCandidate): Promise<OfferVerified> {
    return {
      ...offer,
      verified: true,
      confidence: Math.min(1, offer.confidence + 0.2),
    };
  }
}
