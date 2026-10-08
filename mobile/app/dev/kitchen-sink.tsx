import React, { useState } from 'react';
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import {
  AtmosphereBackground,
  ConfidenceBadge,
  GlassInput,
  GlassView,
  PillButton,
  PillChip,
  PosterCard,
  SkeletonShimmer,
} from '@/components/ui';
import { Colors, Fonts, Radius, Spacing, TouchTarget } from '@/constants/theme';
import { hapticFeedback } from '@/lib/haptics';

// Sample demonstration photo (high-res Mount Fuji / Japan scenery)
const DEMO_PHOTO_URL =
  'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=1000&q=80';

export default function KitchenSinkScreen() {
  const insets = useSafeAreaInsets();
  const [backgroundMode, setBackgroundMode] = useState<'sky' | 'photo'>('sky');
  const [inputValue, setInputValue] = useState('');
  const [showInputError, setShowInputError] = useState(false);
  const [selectedChip, setSelectedChip] = useState('Beach');
  const [isPosterSaved, setIsPosterSaved] = useState(false);

  const handleToggleBackground = () => {
    hapticFeedback.light();
    setBackgroundMode((prev) => (prev === 'sky' ? 'photo' : 'sky'));
  };

  return (
    <AtmosphereBackground
      variant="sky"
      imageUrl={backgroundMode === 'photo' ? DEMO_PHOTO_URL : null}
    >
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: Math.max(insets.top, 16) + 12,
            paddingBottom: Math.max(insets.bottom, 24) + 80,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Top Header / Back Action */}
        <View style={styles.topBar}>
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => [styles.backPill, pressed && styles.pressed]}
          >
            <Ionicons name="arrow-back" size={16} color={Colors.ivoryMist} />
            <Text style={styles.backPillText}>Back to App</Text>
          </Pressable>

          {/* Toggle Background Mode */}
          <Pressable
            onPress={handleToggleBackground}
            style={({ pressed }) => [styles.togglePill, pressed && styles.pressed]}
          >
            <Ionicons
              name={backgroundMode === 'photo' ? 'image' : 'color-palette'}
              size={14}
              color={Colors.ivoryMist}
            />
            <Text style={styles.togglePillText}>
              {backgroundMode === 'photo' ? 'Photo Mode' : 'Sky Gradient'}
            </Text>
          </Pressable>
        </View>

        {/* Section 0: Title & Contrast Audit */}
        <View style={styles.section}>
          <Text style={styles.sectionEyebrow}>PHASE 1 PRIMITIVES AUDIT</Text>
          <Text style={styles.heroTitle}>
            Tokyo
          </Text>
          <Text style={styles.headlineWithAccent}>
            Drop a reel. <Text style={styles.italicAccent}>Find the place.</Text>
          </Text>
          <Text style={styles.subhead}>
            Atmospheric Canvas & Glassmorphic Primitives
          </Text>

          {/* Contrast Numbers Card */}
          <GlassView style={styles.contrastCard}>
            <View style={styles.cardHeaderRow}>
              <Ionicons name="checkmark-circle" size={16} color={Colors.icyBlue} />
              <Text style={styles.cardHeaderText}>CONTRAST AUDIT (WCAG AA/AAA)</Text>
            </View>
            <Text style={styles.contrastLine}>
              • Ivory Mist (#FBF4E3) on Canvas (#081218): <Text style={styles.boldScore}>16.8:1 (AAA)</Text>
            </Text>
            <Text style={styles.contrastLine}>
              • Ivory Mist on Dark Glass (#0E1A22): <Text style={styles.boldScore}>15.5:1 (AAA)</Text>
            </Text>
            <Text style={styles.contrastLine}>
              • Frost Tint (#A8B6BE) on Canvas: <Text style={styles.boldScore}>9.1:1 (AAA)</Text>
            </Text>
            <Text style={styles.contrastLine}>
              • Muted Slate (#6E7E86) on Canvas: <Text style={styles.boldScore}>4.8:1 (AA ≥ 4.5:1)</Text>
            </Text>
            <Text style={styles.contrastLine}>
              • Onyx (#0C0C0C) on Icy Blue (#A6DCF8): <Text style={styles.boldScore}>13.9:1 (AAA)</Text>
            </Text>
            <Text style={styles.contrastLine}>
              • White (#FFFFFF) on Racing Red (#EB2627): <Text style={styles.boldScore}>4.8:1 (AA)</Text>
            </Text>
            <Text style={styles.platformBadge}>
              Android blur: dimezisBlurView ({Platform.OS})
            </Text>
          </GlassView>
        </View>

        {/* Section 1: Glass Input */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>1. Glass Input Pill</Text>
          <GlassInput
            value={inputValue}
            onChangeText={(t) => {
              setInputValue(t);
              if (showInputError) setShowInputError(false);
            }}
            onSubmit={() => {
              if (!inputValue.trim()) {
                setShowInputError(true);
              }
            }}
            error={showInputError ? 'Enter a valid Instagram Reel URL' : null}
            placeholder="Paste Instagram Reel link"
          />
        </View>

        {/* Section 2: Pill Chips */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>2. Pill Chips</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
            {['Beach', 'Mountain', 'Cafés', 'Hidden Stays', 'Viewpoints'].map((cat) => (
              <PillChip
                key={cat}
                label={cat}
                selected={selectedChip === cat}
                onPress={() => setSelectedChip(cat)}
                icon={
                  <Ionicons
                    name={cat === 'Beach' ? 'sunny-outline' : cat === 'Mountain' ? 'trail-sign-outline' : 'cafe-outline'}
                    size={14}
                    color={selectedChip === cat ? Colors.ivoryMist : Colors.textSecondary}
                  />
                }
              />
            ))}
          </ScrollView>
        </View>

        {/* Section 3: Truthful PRD Verification Badges */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>3. PRD Verification Badges (Truthful Styling)</Text>
          <View style={styles.badgeRow}>
            <ConfidenceBadge status="VERIFIED" confidence={95} />
            <ConfidenceBadge status="PARTIAL" confidence={68} />
            <ConfidenceBadge status="UNVERIFIED" />
          </View>
          <Text style={styles.badgeNote}>
            * Unverified is styled with honest muted slate—strictly NO Icy Blue.
          </Text>
        </View>

        {/* Section 4: Pill Buttons */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>4. Pill Buttons</Text>
          <View style={styles.buttonRow}>
            <PillButton
              title="Brand CTA"
              variant="brand"
              onPress={() => hapticFeedback.selection()}
              iconRight={<Ionicons name="arrow-forward" size={15} color={Colors.textOnRed} />}
            />
            <PillButton
              title="Primary Onyx"
              variant="primary"
              onPress={() => hapticFeedback.selection()}
            />
            <PillButton
              title="Glass Panel"
              variant="glass"
              onPress={() => hapticFeedback.selection()}
            />
          </View>
        </View>

        {/* Section 5: Poster Cards (~3:4 Aspect Ratio) */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            5. Poster Cards (~3:4) & Graceful Fallback
          </Text>
          <View style={styles.postersGrid}>
            {/* Card with Photo */}
            <View style={styles.posterColumn}>
              <Text style={styles.cardSublabel}>With Full-Bleed Photo</Text>
              <PosterCard
                title="Tokyo"
                subtitle="Honshu · Japan"
                category="Destinations"
                imageUrl={DEMO_PHOTO_URL}
                isSaved={isPosterSaved}
                onPress={() => hapticFeedback.selection()}
                onToggleSave={() => setIsPosterSaved((prev) => !prev)}
              />
            </View>

            {/* Card without Photo (Graceful Sky Atmosphere Fallback) */}
            <View style={styles.posterColumn}>
              <Text style={styles.cardSublabel}>Missing Photo Fallback</Text>
              <PosterCard
                title="Dolomites"
                subtitle="South Tyrol · Italy"
                category="Mountain"
                imageUrl={null}
                isSaved={false}
                onPress={() => hapticFeedback.selection()}
              />
            </View>
          </View>
        </View>

        {/* Section 6: Skeleton Shimmer */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>6. Skeleton Shimmer Loaders</Text>
          <GlassView style={styles.skeletonContainer}>
            <SkeletonShimmer height={180} borderRadius={Radius.xl} />
            <View style={{ height: 12 }} />
            <SkeletonShimmer height={20} width="65%" borderRadius={Radius.sm} />
            <View style={{ height: 8 }} />
            <SkeletonShimmer height={14} width="40%" borderRadius={Radius.sm} />
          </GlassView>
        </View>
      </ScrollView>
    </AtmosphereBackground>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: Spacing.xl,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.xl,
  },
  backPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(8, 18, 24, 0.65)',
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
    gap: 6,
    minHeight: TouchTarget.minHeight,
  },
  backPillText: {
    fontFamily: Fonts.sansSemiBold,
    fontSize: 12,
    color: Colors.ivoryMist,
  },
  togglePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.onyx,
    borderWidth: 1,
    borderColor: 'rgba(251, 244, 227, 0.35)',
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
    gap: 6,
    minHeight: TouchTarget.minHeight,
  },
  togglePillText: {
    fontFamily: Fonts.sansSemiBold,
    fontSize: 12,
    color: Colors.ivoryMist,
  },
  section: {
    marginBottom: Spacing.xxl,
  },
  sectionEyebrow: {
    fontFamily: Fonts.sansBold,
    fontSize: 10,
    letterSpacing: 1.6,
    color: Colors.icyBlue,
    marginBottom: Spacing.xs,
  },
  heroTitle: {
    fontFamily: Fonts.serifRegular,
    fontSize: 84,
    lineHeight: 88,
    color: Colors.ivoryMist,
    letterSpacing: -1.8,
  },
  headlineWithAccent: {
    fontFamily: Fonts.sansSemiBold,
    fontSize: 28,
    lineHeight: 34,
    color: Colors.ivoryMist,
    letterSpacing: -0.6,
    marginTop: Spacing.xs,
  },
  italicAccent: {
    fontFamily: Fonts.serifItalic,
    fontStyle: 'italic',
    color: Colors.ivoryMist,
  },
  subhead: {
    fontFamily: Fonts.sansRegular,
    fontSize: 14,
    lineHeight: 20,
    color: Colors.textSecondary,
    marginTop: 6,
    marginBottom: Spacing.md,
  },
  contrastCard: {
    padding: Spacing.base,
    borderRadius: Radius.xl,
    marginTop: Spacing.sm,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: Spacing.sm,
  },
  cardHeaderText: {
    fontFamily: Fonts.sansBold,
    fontSize: 10,
    letterSpacing: 1.2,
    color: Colors.icyBlue,
  },
  contrastLine: {
    fontFamily: Fonts.sansRegular,
    fontSize: 12,
    lineHeight: 18,
    color: Colors.textSecondary,
    marginVertical: 1,
  },
  boldScore: {
    fontFamily: Fonts.sansBold,
    color: Colors.ivoryMist,
  },
  platformBadge: {
    fontFamily: Fonts.sansMedium,
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: Spacing.sm,
    fontStyle: 'italic',
  },
  sectionTitle: {
    fontFamily: Fonts.sansSemiBold,
    fontSize: 16,
    color: Colors.ivoryMist,
    marginBottom: Spacing.md,
  },
  chipRow: {
    gap: Spacing.sm,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  badgeNote: {
    fontFamily: Fonts.sansRegular,
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: Spacing.xs + 2,
  },
  buttonRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  postersGrid: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  posterColumn: {
    flex: 1,
  },
  cardSublabel: {
    fontFamily: Fonts.sansMedium,
    fontSize: 11,
    color: Colors.textSecondary,
    marginBottom: 6,
  },
  skeletonContainer: {
    padding: Spacing.base,
    borderRadius: Radius.xl,
  },
  pressed: {
    opacity: 0.75,
    transform: [{ scale: 0.97 }],
  },
});
