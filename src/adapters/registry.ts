import { SourceAdapter } from '../types.js';
import { MockSourceAdapter } from './mockSource.js';
import { TicketmasterSourceAdapter } from './ticketmasterSource.js';

const adapterFactories: Record<string, () => SourceAdapter> = {
  mock: () => new MockSourceAdapter(),
  ticketmaster: () => new TicketmasterSourceAdapter(),
};

export function createAdapter(name: string): SourceAdapter | null {
  const factory = adapterFactories[name];
  return factory ? factory() : null;
}

export function availableAdapters(): string[] {
  return Object.keys(adapterFactories);
}
