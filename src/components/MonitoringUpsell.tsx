import { Pressable, StyleSheet, View } from 'react-native';
import { colors, radius, spacing } from '@/theme/tokens';
import { AppText, Card } from './ui';

/**
 * Static upsell card for continuous monitoring (CLAUDE.md §5, MVP item 3).
 * No backend yet — the button is a placeholder. Wired up in Phase 2.
 */
export function MonitoringUpsell() {
  return (
    <Card style={styles.card}>
      <AppText variant="label" mono color={colors.primary} style={styles.kicker}>
        BREACHLY PREMIUM
      </AppText>

      <AppText variant="h2" style={styles.title}>
        Get alerted the moment you’re in a new breach
      </AppText>

      <AppText variant="body" color={colors.textMuted} style={styles.body}>
        A one-off check is a snapshot. New breaches happen constantly. Monitoring
        watches your emails around the clock and pings you the instant something
        changes — so you can act before anyone else does.
      </AppText>

      <View style={styles.bullets}>
        {[
          'Continuous monitoring for all your emails',
          'Instant push alerts on new breaches',
          'Password-reuse & health checks',
        ].map((b) => (
          <View key={b} style={styles.bulletRow}>
            <View style={styles.dot} />
            <AppText variant="small" color={colors.text}>
              {b}
            </AppText>
          </View>
        ))}
      </View>

      <Pressable
        style={({ pressed }) => [styles.cta, pressed && styles.ctaPressed]}
        // Placeholder — paywall wired in Phase 2 (RevenueCat).
        onPress={() => {}}
        accessibilityRole="button"
        accessibilityLabel="Turn on monitoring"
      >
        <AppText variant="bodyStrong" color={colors.onPrimary}>
          Turn on monitoring
        </AppText>
      </Pressable>

      <AppText variant="small" color={colors.textFaint} style={styles.footnote}>
        Coming soon · We never sell your data · Passwords are never sent
      </AppText>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginTop: spacing.lg,
    backgroundColor: colors.cardElevated,
  },
  kicker: {
    marginBottom: spacing.sm,
  },
  title: {
    marginBottom: spacing.sm,
  },
  body: {
    marginBottom: spacing.lg,
  },
  bullets: {
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: radius.pill,
    backgroundColor: colors.safe,
  },
  cta: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  ctaPressed: {
    opacity: 0.85,
  },
  footnote: {
    marginTop: spacing.md,
    textAlign: 'center',
  },
});
