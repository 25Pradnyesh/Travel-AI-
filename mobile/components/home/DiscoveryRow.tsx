import React from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { hapticFeedback } from '@/lib/haptics';

export interface ExampleReel {
  label: string;
  url: string;
}

export interface DiscoveryRowProps {
  exampleReels: ExampleReel[];
  onSelectExample: (url: string) => void;
}

const DISCOVERY_CATEGORIES = [
  'Hidden beaches',
  'Mountain stays',
  'Cafés',
  'Viewpoints',
  'Hotels',
  'Restaurants',
];

export const DiscoveryRow: React.FC<DiscoveryRowProps> = ({
  exampleReels,
  onSelectExample,
}) => {
  return (
    <View style={styles.container}>
      {/* Category Discovery Horizon */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>DISCOVER</Text>
        <Text style={styles.sectionCaption}>Resolves any travel scenery</Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoryScroll}
      >
        {DISCOVERY_CATEGORIES.map((category) => (
          <View key={category} style={styles.categoryChip}>
            {/* Controlled Icy Blue Accent Dot */}
            <View style={styles.accentDot} />
            <Text style={styles.categoryText}>{category}</Text>
          </View>
        ))}
      </ScrollView>

      {/* Demo / Sample Reels */}
      {exampleReels.length > 0 && (
        <View style={styles.sampleSection}>
          <Text style={styles.sampleHeader}>OR TRY A SAMPLE REEL</Text>
          <View style={styles.sampleRow}>
            {exampleReels.map((item) => (
              <Pressable
                key={item.label}
                onPress={() => {
                  hapticFeedback.selection();
                  onSelectExample(item.url);
                }}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel={`Try ${item.label}`}
                style={({ pressed }) => [
                  styles.sampleChip,
                  pressed && styles.sampleChipPressed,
                ]}
              >
                <Ionicons name="play-outline" size={13} color={Colors.onyx} />
                <Text style={styles.sampleChipText}>{item.label}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: Spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl, // 24px editorial horizontal padding
    marginBottom: Spacing.sm,
  },
  sectionTitle: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '700',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    color: 'rgba(12, 12, 12, 0.50)',
  },
  sectionCaption: {
    fontSize: 11,
    color: 'rgba(12, 12, 12, 0.40)',
    fontWeight: '400',
  },
  categoryScroll: {
    paddingHorizontal: Spacing.xl, // 24px editorial horizontal padding
    gap: Spacing.sm,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.ivoryMist,
    borderWidth: 1,
    borderColor: 'rgba(12, 12, 12, 0.12)',
    borderRadius: Radius.md + 4,
    paddingHorizontal: Spacing.md,
    paddingVertical: 7,
  },
  accentDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.icyBlue, // Icy Blue #A6DCF8 controlled accent
    marginRight: 6,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.onyx,
  },
  sampleSection: {
    marginTop: Spacing.lg,
    paddingHorizontal: Spacing.xl,
  },
  sampleHeader: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: 'rgba(12, 12, 12, 0.45)',
    marginBottom: Spacing.xs + 3,
  },
  sampleRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  sampleChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(12, 12, 12, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(12, 12, 12, 0.14)',
    borderRadius: Radius.md + 2,
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
  },
  sampleChipPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.97 }],
  },
  sampleChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.onyx,
    marginLeft: 6,
  },
});

export default DiscoveryRow;
