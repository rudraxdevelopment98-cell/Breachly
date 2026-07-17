import { StyleSheet, View } from 'react-native';
import type { GuidanceStep } from '@/lib/guidance';
import { colors, radius, spacing } from '@/theme/tokens';
import { AppText, Card } from './ui';

/** "Do this now" — numbered, plain-English steps (CLAUDE.md §1, §8). */
export function DoThisNow({ steps }: { steps: GuidanceStep[] }) {
  return (
    <Card style={styles.card}>
      <AppText variant="h2" style={styles.heading}>
        Do this now
      </AppText>

      {steps.map((step, i) => (
        <View key={step.title} style={styles.step}>
          <View style={styles.num}>
            <AppText variant="label" mono color={colors.primary}>
              {i + 1}
            </AppText>
          </View>
          <View style={styles.stepBody}>
            <AppText variant="bodyStrong">{step.title}</AppText>
            <AppText
              variant="small"
              color={colors.textMuted}
              style={styles.detail}
            >
              {step.detail}
            </AppText>
          </View>
        </View>
      ))}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginTop: spacing.lg,
  },
  heading: {
    marginBottom: spacing.lg,
  },
  step: {
    flexDirection: 'row',
    marginBottom: spacing.lg,
  },
  num: {
    width: 26,
    height: 26,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  stepBody: {
    flex: 1,
  },
  detail: {
    marginTop: spacing.xs,
  },
});
