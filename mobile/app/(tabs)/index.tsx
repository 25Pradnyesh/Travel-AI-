import React, { useState } from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Button, TopBar, URLInput } from '@/components/ui';
import { Colors, Radius, Spacing, Typography } from '@/constants/theme';
import { validateReelUrl } from '@/lib/utils';
import { hapticFeedback } from '@/lib/haptics';

const EXAMPLE_REELS = [
  {
    label: 'Alpine Lakes Reel',
    url: 'https://www.instagram.com/reel/C8xyzExample1/',
  },
  {
    label: 'Coastal Retreat Reel',
    url: 'https://www.instagram.com/reel/C9abcExample2/',
  },
];

export default function AnalyzeScreen() {
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleTextChange = (text: string) => {
    setUrl(text);
    if (error) setError('');
  };

  const handleClear = () => {
    setUrl('');
    setError('');
  };

  const handleAnalyze = () => {
    Keyboard.dismiss();
    const trimmed = url.trim();
    const validation = validateReelUrl(trimmed);

    if (!validation.isValid) {
      hapticFeedback.medium();
      setError(validation.error || 'Enter a valid public Instagram Reel URL.');
      return;
    }

    hapticFeedback.light();
    setError('');
    setIsSubmitting(true);

    // Transition to structural processing route
    setTimeout(() => {
      setIsSubmitting(false);
      router.push({
        pathname: '/analyze/processing',
        params: { url: trimmed },
      });
    }, 200);
  };

  const handleSelectExample = (exampleUrl: string) => {
    hapticFeedback.selection();
    setUrl(exampleUrl);
    setError('');
  };

  return (
    <View style={styles.screen}>
      <TopBar
        brandTitle="Travel AI"
        rightAction={
          <View style={styles.statusPill}>
            <View style={styles.statusDot} />
            <Text style={styles.statusText}>Engine Ready</Text>
          </View>
        }
      />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
          >
            {/* Editorial Heading */}
            <View style={styles.heroSection}>
              <Text style={styles.eyebrow}>TRAVEL INTELLIGENCE</Text>
              <Text style={styles.headline}>Let's explore this reel.</Text>
              <Text style={styles.description}>
                Paste any public Instagram travel reel to resolve real-world destinations,
                verified coordinates, and curated travel intelligence.
              </Text>
            </View>

            {/* Input Card Container */}
            <View style={styles.inputCard}>
              <URLInput
                value={url}
                onChangeText={handleTextChange}
                onSubmit={handleAnalyze}
                onClear={handleClear}
                error={error}
                placeholder="Paste Instagram Reel (e.g. instagram.com/reel/...)"
              />

              <View style={styles.ctaContainer}>
                <Button
                  title="Analyze this reel"
                  onPress={handleAnalyze}
                  variant="primary"
                  size="md"
                  loading={isSubmitting}
                  iconRight={
                    <Ionicons name="arrow-forward" size={16} color={Colors.canvas} />
                  }
                  accessibilityLabel="Analyze this reel button"
                  accessibilityHint="Submits Reel URL for geographic resolution"
                />
              </View>

              <Text style={styles.inputHint}>
                Supports public Instagram Reels featuring travel content
              </Text>
            </View>

            {/* Try an Example */}
            <View style={styles.exampleSection}>
              <Text style={styles.exampleTitle}>OR TRY A DEMO REEL</Text>
              <View style={styles.exampleRow}>
                {EXAMPLE_REELS.map((item) => (
                  <Pressable
                    key={item.label}
                    onPress={() => handleSelectExample(item.url)}
                    style={({ pressed }) => [
                      styles.exampleChip,
                      pressed && styles.exampleChipPressed,
                    ]}
                    accessibilityRole="button"
                    accessibilityLabel={`Use ${item.label}`}
                  >
                    <Ionicons name="play-circle-outline" size={14} color={Colors.textSecondary} />
                    <Text style={styles.exampleChipText}>{item.label}</Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Multimodal Intelligence Capabilities */}
            <View style={styles.capabilitiesContainer}>
              <Text style={styles.capabilitiesHeader}>MULTIMODAL INTELLIGENCE PIPELINE</Text>

              <View style={styles.capabilityRow}>
                <View style={styles.capabilityIconWrapper}>
                  <Ionicons name="film-outline" size={16} color={Colors.surfaceDark} />
                </View>
                <View style={styles.capabilityTextWrapper}>
                  <Text style={styles.capabilityTitle}>Video Ingestion & OCR</Text>
                  <Text style={styles.capabilityDescription}>
                    Inspects video frames, on-screen text, audio transcripts, and caption clues.
                  </Text>
                </View>
              </View>

              <View style={styles.capabilityRow}>
                <View style={styles.capabilityIconWrapper}>
                  <Ionicons name="compass-outline" size={16} color={Colors.surfaceDark} />
                </View>
                <View style={styles.capabilityTextWrapper}>
                  <Text style={styles.capabilityTitle}>Geographic Resolution</Text>
                  <Text style={styles.capabilityDescription}>
                    Resolves real coordinates and points of interest via Google Places directory.
                  </Text>
                </View>
              </View>

              <View style={styles.capabilityRow}>
                <View style={styles.capabilityIconWrapper}>
                  <Ionicons name="sparkles-outline" size={16} color={Colors.surfaceDark} />
                </View>
                <View style={styles.capabilityTextWrapper}>
                  <Text style={styles.capabilityTitle}>Curated Travel Briefing</Text>
                  <Text style={styles.capabilityDescription}>
                    Synthesizes optimal seasons, daily expenses, and local travel advice.
                  </Text>
                </View>
              </View>
            </View>
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.canvas,
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.huge,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm + 2,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.full,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: Radius.full,
    backgroundColor: Colors.verified,
    marginRight: Spacing.xs,
  },
  statusText: {
    ...Typography.caption,
    fontSize: 10,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  heroSection: {
    marginBottom: Spacing.xl,
  },
  eyebrow: {
    ...Typography.label,
    fontSize: 10,
    color: Colors.textMuted,
    marginBottom: Spacing.xs,
  },
  headline: {
    ...Typography.display,
    fontSize: 30,
    lineHeight: 36,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  description: {
    ...Typography.body,
    fontSize: 14,
    lineHeight: 21,
    color: Colors.textSecondary,
  },
  inputCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.xxl,
    padding: Spacing.base,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    marginBottom: Spacing.lg,
  },
  ctaContainer: {
    marginTop: Spacing.md,
  },
  inputHint: {
    ...Typography.caption,
    fontSize: 11,
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: Spacing.md,
  },
  exampleSection: {
    marginBottom: Spacing.xl,
  },
  exampleTitle: {
    ...Typography.label,
    fontSize: 10,
    color: Colors.textMuted,
    marginBottom: Spacing.sm,
  },
  exampleRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  exampleChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 3,
  },
  exampleChipPressed: {
    opacity: 0.75,
    transform: [{ scale: 0.96 }],
  },
  exampleChipText: {
    ...Typography.bodySmall,
    fontSize: 12,
    fontWeight: '500',
    color: Colors.textSecondary,
    marginLeft: Spacing.xs,
  },
  capabilitiesContainer: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.xxl,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    padding: Spacing.base,
  },
  capabilitiesHeader: {
    ...Typography.label,
    fontSize: 9,
    color: Colors.textMuted,
    marginBottom: Spacing.md,
  },
  capabilityRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  capabilityIconWrapper: {
    width: 32,
    height: 32,
    borderRadius: Radius.md,
    backgroundColor: Colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
    marginTop: 2,
  },
  capabilityTextWrapper: {
    flex: 1,
  },
  capabilityTitle: {
    ...Typography.h3,
    fontSize: 14,
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  capabilityDescription: {
    ...Typography.bodySmall,
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 17,
  },
});
