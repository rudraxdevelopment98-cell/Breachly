import { useMutation } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CheckBreachError, checkBreach, isValidEmail } from '@/api/checkBreach';
import { BreachCard } from '@/components/BreachCard';
import { DoThisNow } from '@/components/DoThisNow';
import { MonitoringUpsell } from '@/components/MonitoringUpsell';
import { ResultHeader } from '@/components/ResultHeader';
import { AppText } from '@/components/ui';
import { buildGuidance } from '@/lib/guidance';
import { colors, radius, spacing } from '@/theme/tokens';

export default function CheckScreen() {
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState('');
  const [touched, setTouched] = useState(false);

  const mutation = useMutation({
    mutationFn: (value: string) => checkBreach(value),
  });

  const result = mutation.data;
  const guidance = useMemo(
    () => (result ? buildGuidance(result) : []),
    [result],
  );

  const trimmed = email.trim();
  const showInvalid = touched && trimmed.length > 0 && !isValidEmail(trimmed);
  const canSubmit = isValidEmail(trimmed) && !mutation.isPending;

  const onCheck = () => {
    setTouched(true);
    if (!isValidEmail(trimmed)) return;
    mutation.mutate(trimmed);
  };

  const errorMessage =
    mutation.error instanceof CheckBreachError
      ? mutation.error.message
      : mutation.isError
        ? 'Something went wrong. Please try again.'
        : null;

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={styles.flex}
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + spacing.xl, paddingBottom: insets.bottom + spacing.xxl },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        {/* Brand + intro */}
        <AppText variant="label" mono color={colors.primary}>
          BREACHLY
        </AppText>
        <AppText variant="h1" style={styles.h1}>
          Has your email been leaked?
        </AppText>
        <AppText variant="body" color={colors.textMuted} style={styles.intro}>
          Check your email against known data breaches. Free, private, and your
          password is never sent.
        </AppText>

        {/* Input */}
        <View style={styles.inputWrap}>
          <TextInput
            value={email}
            onChangeText={setEmail}
            onBlur={() => setTouched(true)}
            onSubmitEditing={onCheck}
            placeholder="you@example.com"
            placeholderTextColor={colors.textFaint}
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="email"
            keyboardType="email-address"
            returnKeyType="search"
            inputMode="email"
            style={[styles.input, showInvalid && styles.inputError]}
            accessibilityLabel="Email address"
          />
          {showInvalid ? (
            <AppText variant="small" color={colors.exposed} style={styles.hint}>
              Enter a valid email address.
            </AppText>
          ) : null}
        </View>

        <Pressable
          onPress={onCheck}
          disabled={!canSubmit}
          style={({ pressed }) => [
            styles.button,
            !canSubmit && styles.buttonDisabled,
            pressed && canSubmit && styles.buttonPressed,
          ]}
          accessibilityRole="button"
          accessibilityLabel="Check this email"
        >
          {mutation.isPending ? (
            <ActivityIndicator color={colors.onPrimary} />
          ) : (
            <AppText variant="bodyStrong" color={colors.onPrimary}>
              Check
            </AppText>
          )}
        </Pressable>

        {/* Error state */}
        {errorMessage ? (
          <View style={styles.errorBox}>
            <AppText variant="small" color={colors.severe}>
              {errorMessage}
            </AppText>
          </View>
        ) : null}

        {/* Result */}
        {result ? (
          <View style={styles.results}>
            <ResultHeader result={result} />

            {result.breached ? (
              <View style={styles.breachList}>
                <AppText
                  variant="label"
                  mono
                  color={colors.textFaint}
                  style={styles.sectionLabel}
                >
                  WHERE YOU SHOWED UP
                </AppText>
                {result.breaches.map((b) => (
                  <BreachCard key={b.name} breach={b} />
                ))}
              </View>
            ) : null}

            <DoThisNow steps={guidance} />
            <MonitoringUpsell />
          </View>
        ) : (
          // Idle: still show the upsell so the value prop is always visible.
          <View style={styles.results}>
            <MonitoringUpsell />
          </View>
        )}

        <AppText variant="small" color={colors.textFaint} style={styles.footer}>
          Breachly never stores your password. Breach data via Have I Been Pwned.
        </AppText>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: colors.base,
  },
  content: {
    paddingHorizontal: spacing.lg,
  },
  h1: {
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
  },
  intro: {
    marginBottom: spacing.xl,
  },
  inputWrap: {
    marginBottom: spacing.md,
  },
  input: {
    backgroundColor: colors.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.hairline,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    color: colors.text,
    fontSize: 16,
  },
  inputError: {
    borderColor: colors.exposed,
  },
  hint: {
    marginTop: spacing.sm,
    marginLeft: spacing.xs,
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
  },
  buttonDisabled: {
    opacity: 0.4,
  },
  buttonPressed: {
    opacity: 0.85,
  },
  errorBox: {
    marginTop: spacing.lg,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.severe,
    backgroundColor: 'rgba(255, 107, 107, 0.08)',
  },
  results: {
    marginTop: spacing.xl,
  },
  breachList: {
    marginTop: spacing.xl,
  },
  sectionLabel: {
    marginBottom: spacing.md,
  },
  footer: {
    marginTop: spacing.xxl,
    textAlign: 'center',
  },
});
