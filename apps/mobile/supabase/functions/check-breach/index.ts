// Supabase Edge Function: check-breach
//
// The app POSTs { email } here. This function calls Have I Been Pwned's
// `breachedaccount` endpoint using the HIBP secret key (stored server-side
// ONLY, via `supabase secrets set HIBP_API_KEY=...`), then returns a clean,
// minimal JSON list of breaches. See CLAUDE.md §6 — the mobile app NEVER
// holds the key and NEVER calls HIBP directly.
//
// Deploy:   supabase functions deploy check-breach
// Secret:   supabase secrets set HIBP_API_KEY=xxxxxxxx
//
// deno-lint-ignore-file no-explicit-any

const HIBP_API_KEY = Deno.env.get('HIBP_API_KEY') ?? '';
const HIBP_BASE = 'https://haveibeenpwned.com/api/v3';
const USER_AGENT = 'Breachly-App';

const CORS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  });
}

/** Strip HTML tags from HIBP descriptions for clean plain-text display. */
function stripHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .trim();
}

const PASSWORD_CLASSES = ['Passwords', 'Password hints'];

interface HibpBreach {
  Name: string;
  Title: string;
  Domain: string;
  BreachDate: string;
  Description: string;
  DataClasses: string[];
  IsSensitive: boolean;
  IsVerified: boolean;
  LogoPath: string;
}

function cleanBreach(b: HibpBreach) {
  const year = b.BreachDate ? Number(b.BreachDate.slice(0, 4)) : null;
  return {
    name: b.Name,
    title: b.Title || b.Name,
    domain: b.Domain ?? '',
    year: Number.isFinite(year) ? year : null,
    breachDate: b.BreachDate ?? null,
    dataClasses: Array.isArray(b.DataClasses) ? b.DataClasses : [],
    description: b.Description ? stripHtml(b.Description) : '',
    isSensitive: Boolean(b.IsSensitive),
    isVerified: Boolean(b.IsVerified),
    logoPath: b.LogoPath ?? null,
  };
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS });
  }

  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405);
  }

  if (!HIBP_API_KEY) {
    return json({ error: 'Server not configured' }, 500);
  }

  let email = '';
  try {
    const body = await req.json();
    email = String(body?.email ?? '').trim().toLowerCase();
  } catch {
    return json({ error: 'Invalid request body' }, 400);
  }

  if (!EMAIL_RE.test(email)) {
    return json({ error: 'Invalid email' }, 400);
  }

  // truncateResponse=false gives us full breach metadata in one call.
  const url =
    `${HIBP_BASE}/breachedaccount/${encodeURIComponent(email)}` +
    `?truncateResponse=false`;

  let hibpRes: Response;
  try {
    hibpRes = await fetch(url, {
      headers: {
        'hibp-api-key': HIBP_API_KEY,
        'user-agent': USER_AGENT,
      },
    });
  } catch {
    return json({ error: 'Upstream request failed' }, 502);
  }

  // 404 = no breaches found. This is a clean result, not an error.
  if (hibpRes.status === 404) {
    return json({ breached: false, breaches: [], passwordExposed: false });
  }

  if (hibpRes.status === 429) {
    return json({ error: 'Rate limited, try again shortly' }, 429);
  }

  if (!hibpRes.ok) {
    return json({ error: 'Lookup failed' }, 502);
  }

  let raw: HibpBreach[];
  try {
    raw = (await hibpRes.json()) as HibpBreach[];
  } catch {
    return json({ error: 'Bad upstream response' }, 502);
  }

  const breaches = (raw ?? []).map(cleanBreach);
  const passwordExposed = breaches.some((b) =>
    b.dataClasses.some((c) => PASSWORD_CLASSES.includes(c)),
  );

  return json({
    breached: breaches.length > 0,
    breaches,
    passwordExposed,
  });
});
