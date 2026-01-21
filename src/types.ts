export type ISODate = string;

export interface FixtureQuery {
  league?: string;
  team?: string;
  city?: string;
  dateFrom?: ISODate;
  dateTo?: ISODate;
  quantity?: number;
  maxTotalPrice?: number;
}

export interface VerificationHints {
  priceSelector?: string;
  feeSelector?: string;
  totalSelector?: string;
}

export interface OfferCandidate {
  source: string;
  fixtureText: string;
  eventDate?: ISODate;
  url: string;
  currency: string;
  basePrice: number;
  fees?: number;
  totalPrice: number;
  seatInfo?: string;
  quantityAvailable?: number;
  verified: boolean;
  confidence: number;
  lastSeenAt: ISODate;
  query: FixtureQuery;
  verificationHints?: VerificationHints;
}

export interface OfferVerified extends OfferCandidate {
  verified: true;
}

export interface SourceAdapter {
  name: string;
  search(query: FixtureQuery): Promise<OfferCandidate[]>;
  verify?(offer: OfferCandidate): Promise<OfferVerified>;
}

export interface ScoredOffer {
  offer: OfferCandidate;
  score: number;
}

export interface PricePoint {
  totalPrice: number;
  seenAt: ISODate;
}

export interface OfferRecord extends OfferCandidate {
  key: string;
  lastNotifiedAt?: ISODate;
  priceHistory: PricePoint[];
}

export interface StoredState {
  offers: OfferRecord[];
}

export interface NotificationResult {
  sent: boolean;
  reason?: string;
}
