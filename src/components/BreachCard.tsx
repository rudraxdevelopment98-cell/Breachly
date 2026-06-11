import { StyleSheet, View } from 'react-native';
import type { Breach } from '@/types';
import { colors, radius, spacing } from '@/theme/tokens';
import { AppText, Card } from './ui';

const PASSWORD_HINTS = ['password', 'password hint'];

function leakedPassword(breach: Breach): boolean {
  return breach.dataClasses.some((c) =>
    PASSWORD_HINTS.some((h) => c.toLowerCase().includes(h)),
  );
}

/** A single breach: name, year, and what leaked (CLAUDE.md §5). */
export function BreachCard({ breach }: { breach: Breach }) {
  const hasPassword = leakedPassword(breach);

  return (
    <Card style={styles.card}>
      <View style={styles.headerRow}>
        <View style={styles.titleCol}>
          <AppText variant="bodyStrong">{breach.title || breach.name}</AppText>
          {breach.domain ? (
            <AppText variant="small" color={colors.textFaint} mono>
              {breach.domain}
            </AppText>
          ) : null}
        </View>
        {breach.year ? (
          <AppText variant="label" mono color={colors.textMuted}>
            {breach.year}
          </AppText>
        ) : null}
      </View>

      {breach.description ? (
        <AppText variant="small" color={colors.textMuted} style={styles.desc}>
          {breach.description}
        </AppText>
      ) : null}

      <View style={styles.tags}>
        {breach.dataClasses.map((dc) => {
          const danger = PASSWORD_HINTS.some((h) =>
            dc.toLowerCase().includes(h),
          );
          return (
            <View
              key={dc}
              style={[
                styles.tag,
                danger && { borderColor: colors.exposed },
              ]}
            >
              <AppText
                variant="label"
                color={danger ? colors.exposed : colors.textMuted}
              >
                {dc}
              </AppText>
            </View>
          );
        })}
      </View>

      {hasPassword ? (
        <AppText variant="small" color={colors.exposed} style={styles.warn}>
          A password was exposed in this breach.
        </AppText>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  titleCol: {
    flex: 1,
    paddingRight: spacing.md,
  },
  desc: {
    marginTop: spacing.sm,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  tag: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.hairline,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    backgroundColor: colors.cardElevated,
  },
  warn: {
    marginTop: spacing.md,
  },
});
