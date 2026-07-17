import { StyleSheet, Text, type TextProps, View, type ViewProps } from 'react-native';
import { colors, radius, spacing, type } from '@/theme/tokens';

/** A surface card matching the design tokens. */
export function Card({ style, ...props }: ViewProps) {
  return <View style={[styles.card, style]} {...props} />;
}

/** Thin divider. */
export function Hairline() {
  return <View style={styles.hairline} />;
}

type AppTextProps = TextProps & {
  variant?: keyof typeof type;
  color?: string;
  mono?: boolean;
};

/** Text that defaults to the body style and theme color. */
export function AppText({
  variant = 'body',
  color = colors.text,
  mono = false,
  style,
  ...props
}: AppTextProps) {
  return (
    <Text
      style={[type[variant], { color }, mono && styles.mono, style]}
      {...props}
    />
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.hairline,
    padding: spacing.lg,
  },
  hairline: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.hairline,
    marginVertical: spacing.md,
  },
  mono: {
    fontVariant: ['tabular-nums'],
    letterSpacing: 0.2,
  },
});
