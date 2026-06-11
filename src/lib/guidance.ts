import type { CheckResult } from '@/types';

/**
 * "Do this now" guidance — plain-English, active-voice steps tailored to what
 * actually leaked. This is the credibility layer (CLAUDE.md §1, §8): correct,
 * reassuring, no jargon.
 */

export interface GuidanceStep {
  title: string;
  detail: string;
}

function leakedAny(result: CheckResult, needles: string[]): boolean {
  const haystack = result.breaches
    .flatMap((b) => b.dataClasses)
    .join(' ')
    .toLowerCase();
  return needles.some((n) => haystack.includes(n.toLowerCase()));
}

export function buildGuidance(result: CheckResult): GuidanceStep[] {
  if (!result.breached) {
    return [
      {
        title: 'Turn on two-factor authentication',
        detail:
          'Even with no breaches found, 2FA is the single best protection. Add it to your email and bank first.',
      },
      {
        title: 'Use a password manager',
        detail:
          'Unique passwords for every account mean one leak can never unlock the rest.',
      },
      {
        title: 'Keep watching',
        detail:
          'New breaches happen all the time. Turn on monitoring to get alerted the moment your email shows up in a new one.',
      },
    ];
  }

  const steps: GuidanceStep[] = [];

  if (result.passwordExposed) {
    steps.push({
      title: 'Change your password now',
      detail:
        'Your password was in at least one breach. Change it everywhere you used it — start with email and banking. Make each new one unique.',
    });
  } else {
    steps.push({
      title: 'Change passwords as a precaution',
      detail:
        'No passwords were leaked here, but update the password on any affected account to be safe — especially if you reused it.',
    });
  }

  steps.push({
    title: 'Turn on two-factor authentication',
    detail:
      'A leaked password alone won’t be enough to get in. Add 2FA to your email and bank first.',
  });

  if (leakedAny(result, ['credit card', 'bank', 'financial'])) {
    steps.push({
      title: 'Watch your bank and card statements',
      detail:
        'Financial details were exposed. Check recent transactions and tell your bank if anything looks wrong.',
    });
  }

  if (leakedAny(result, ['security question'])) {
    steps.push({
      title: 'Reset your security questions',
      detail:
        'Your security answers leaked. Change them — and avoid answers that can be found online.',
    });
  }

  steps.push({
    title: 'Watch for scam emails',
    detail:
      'Leaked emails get targeted. Be wary of urgent messages asking you to log in or pay — go to the site directly instead of tapping links.',
  });

  return steps;
}
