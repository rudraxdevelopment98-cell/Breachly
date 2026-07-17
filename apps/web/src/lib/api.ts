import type {
  BreachCheckResponse,
  BrokerListing,
} from '@aegis/types';

/**
 * Client for the exposure-service (via the BFF in production). When
 * NEXT_PUBLIC_USE_MOCK is not "false", returns local mock data so the dashboard
 * runs with no backend — mirrors the original Breachly mock convention.
 */
const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK !== 'false';
const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? 'http://localhost:4002';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const isValidEmail = (e: string) => EMAIL_RE.test(e.trim());

export async function checkBreaches(
  emailRaw: string,
): Promise<BreachCheckResponse> {
  const email = emailRaw.trim().toLowerCase();
  if (!isValidEmail(email)) throw new Error('Enter a valid email address.');

  if (USE_MOCK) {
    await new Promise((r) => setTimeout(r, 500));
    return mockBreachResponse(email);
  }

  const res = await fetch(`${API_BASE}/exposure/breach-check`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email }),
  });
  if (!res.ok) throw new Error('The check failed. Please try again.');
  return (await res.json()) as BreachCheckResponse;
}

export async function scanBrokers(): Promise<BrokerListing[]> {
  if (USE_MOCK) {
    await new Promise((r) => setTimeout(r, 400));
    return mockBrokers();
  }
  const res = await fetch(`${API_BASE}/exposure/broker-scan`, {
    method: 'POST',
  });
  if (!res.ok) throw new Error('Broker scan failed.');
  return (await res.json()) as BrokerListing[];
}

// --- mock data (email containing "clear" => no breaches) ---
function mockBreachResponse(email: string): BreachCheckResponse {
  const clear = email.includes('clear');
  const checkedAt = new Date().toISOString();
  return {
    email,
    breached: !clear,
    passwordExposed: !clear,
    checkedAt,
    breaches: clear
      ? []
      : [
          {
            id: 'hibp:Adobe:0',
            source: 'hibp',
            breachName: 'Adobe',
            title: 'Adobe',
            domain: 'adobe.com',
            year: 2013,
            breachDate: '2013-10-04',
            exposedFields: ['Email addresses', 'Passwords', 'Usernames'],
            description:
              'In October 2013, 153M Adobe accounts were breached, exposing emails and encrypted passwords.',
            passwordExposed: true,
            discoveredAt: checkedAt,
          },
          {
            id: 'hibp:LinkedIn:1',
            source: 'hibp',
            breachName: 'LinkedIn',
            title: 'LinkedIn',
            domain: 'linkedin.com',
            year: 2012,
            breachDate: '2012-05-05',
            exposedFields: ['Email addresses', 'Passwords'],
            description:
              'In 2012, LinkedIn was breached; 164M accounts including SHA-1 hashed passwords were exposed.',
            passwordExposed: true,
            discoveredAt: checkedAt,
          },
        ],
  };
}

function mockBrokers(): BrokerListing[] {
  const now = new Date().toISOString();
  return [
    { id: 'b1', brokerName: 'Spokeo', brokerDomain: 'spokeo.com', registry: 'ca_drop', status: 'found', lastCheckedAt: now },
    { id: 'b2', brokerName: 'WhitePages', brokerDomain: 'whitepages.com', registry: 'ca_drop', status: 'opt_out_pending', lastCheckedAt: now },
    { id: 'b3', brokerName: 'Radaris', brokerDomain: 'radaris.com', registry: null, status: 'found', lastCheckedAt: now },
    { id: 'b4', brokerName: 'TruthFinder', brokerDomain: 'truthfinder.com', registry: 'ca_drop', status: 'removed', lastCheckedAt: now },
  ];
}
