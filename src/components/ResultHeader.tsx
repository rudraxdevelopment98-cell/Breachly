import { StyleSheet, View } from 'react-native';
import type { CheckResult } from '@/types';
import { colors, radius, spacing } from '@/theme/tokens';
import { AppText } from './ui';

/**
 * The headline verdict. Calm by design (CLAUDE.md §8): mint for clear,
 * amber for exposed. Red is reserved for genuinely severe cases.
 */
export function ResultHeader({ result }: { result: CheckResult }) {
  const clear = !result.breached;
  const count = result.breaches.length;
  const accent = clear ? colors.safe : colors.exposed;

  return (
    <View style={styles.wrap}>
      <View style={[styles.badge, { borderColor: accent }]}>
        <AppText variant="label" mono color={accent}>
          {clear ? 'NO BREACHES FOUND' : `${count} BREACH${count === 1 ? '' : 'ES'}`}
        </AppText>
      </View>

      <AppText variant="h1" style={styles.title}>
        {clear ? 'You’re looking clear' : 'Your email was exposed'}
      </AppText>

      <AppText variant="body" color={colors.textMuted} style={styles.sub}>
        {clear
          ? 'This email wasn’t found in any known breach. That’s good — here’s how to keep it that way.'
          : result.passwordExposed
            ? 'Your email — and at least one password — turned up in known breaches. Don’t panic. Work through the steps below.'
            : 'Your email turned up in known breaches. No passwords were leaked here, but it’s worth taking the steps below.'}
      </AppText>

      <AppText variant="small" mono color={colors.textFaint} style={styles.email}>
        {result.email}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'flex-start',
  },
  badge: {
    borderWidth: 1,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    marginBottom: spacing.md,
  },
  title: {
    marginBottom: spacing.sm,
  },
  sub: {
    marginBottom: spacing.md,
  },
  email: {
    opacity: 0.9,
  },
});
