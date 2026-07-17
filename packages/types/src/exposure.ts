/** exposure-service contracts (aegis §6, §9). */

export interface BreachRecord {
  id: string;
  source: string; // e.g. "hibp"
  breachName: string;
  title: string;
  domain: string;
  year: number | null;
  breachDate: string | null;
  exposedFields: string[]; // e.g. ["Email addresses", "Passwords"]
  description: string;
  passwordExposed: boolean;
  discoveredAt: string;
}

export interface BreachCheckResponse {
  email: string;
  breached: boolean;
  breaches: BreachRecord[];
  passwordExposed: boolean;
  checkedAt: string;
}

/** Lifecycle of a listing on a data-broker / people-search site. */
export type BrokerListingStatus =
  | 'found'
  | 'opt_out_pending'
  | 'removed'
  | 'reappeared';

export interface BrokerListing {
  id: string;
  brokerName: string;
  brokerDomain: string;
  /** Which deletion registry can action this, if any (e.g. "ca_drop"). */
  registry: string | null;
  status: BrokerListingStatus;
  lastCheckedAt: string;
}

export type OptOutStatus =
  | 'draft'
  | 'awaiting_confirmation'
  | 'submitted'
  | 'confirmed'
  | 'failed';

export interface OptOutRequest {
  id: string;
  listingId: string;
  status: OptOutStatus;
  submittedAt: string | null;
  confirmationRef: string | null;
}

/** A pluggable deletion-registry adapter (aegis §9 "registry adapter" pattern). */
export interface RegistryAdapter {
  /** Stable key, e.g. "ca_drop". */
  key: string;
  displayName: string;
  /** Does this registry cover the given broker? */
  covers(brokerDomain: string): boolean;
  /** Submit an opt-out; returns a confirmation reference. */
  submitOptOut(input: {
    listingId: string;
    subject: { email: string };
  }): Promise<{ confirmationRef: string; status: OptOutStatus }>;
}
