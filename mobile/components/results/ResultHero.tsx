import React, { useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Radius, Spacing } from '@/constants/theme';

export interface ResultHeroProps {
  imageUrl?: string;
  destinationName: string;
  photoCount?: number;
}

export const ResultHero: React.FC<ResultHeroProps> = React.memo(({
  imageUrl,
  destinationName,
  photoCount = 0,
}) => {
  const [hasError, setHasError] = useState(false);

  const hasValidImage = Boolean(imageUrl) && !hasError;

  return (
    <View style={styles.container}>
      <View style={styles.imageFrame}>
        {hasValidImage ? (
          <Image
            source={{ uri: imageUrl }}
            style={styles.image}
            resizeMode="cover"
            onError={() => setHasError(true)}
            accessible={true}
            accessibilityLabel={`Photography of ${destinationName}`}
          />
        ) : (
          <View style={styles.placeholderContainer}>
            <View style={styles.placeholderIconWrapper}>
              <Ionicons name="image-outline" size={32} color={Colors.onyx} />
            </View>
            <Text style={styles.placeholderText}>Destination Photography</Text>
            <Text style={styles.placeholderSubtext}>{destinationName}</Text>
          </View>
        )}

        {/* Minimal Photo Count Indicator */}
        {hasValidImage && photoCount > 1 && (
          <View style={styles.photoCountBadge}>
            <Ionicons name="camera-outline" size={12} color={Colors.ivoryMist} />
            <Text style={styles.photoCountText}>1 of {photoCount}</Text>
          </View>
        )}
      </View>
    </View>
  );
});

ResultHero.displayName = 'ResultHero';

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.xl, // 24px horizontal padding
    marginBottom: Spacing.lg,
  },
  imageFrame: {
    width: '100%',
    aspectRatio: 16 / 11,
    borderRadius: Radius.xxl + 4, // 20px refined corner radius
    overflow: 'hidden',
    backgroundColor: 'rgba(12, 12, 12, 0.05)',
    borderWidth: 1.5,
    borderColor: 'rgba(12, 12, 12, 0.12)',
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholderContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(12, 12, 12, 0.03)',
    padding: Spacing.lg,
  },
  placeholderIconWrapper: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: 'rgba(12, 12, 12, 0.12)',
    backgroundColor: Colors.ivoryMist,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  placeholderText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.onyx,
    letterSpacing: 0.2,
  },
  placeholderSubtext: {
    fontSize: 12,
    color: 'rgba(12, 12, 12, 0.50)',
    marginTop: 2,
  },
  photoCountBadge: {
    position: 'absolute',
    bottom: Spacing.md,
    right: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(12, 12, 12, 0.75)', // Onyx translucent badge
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.sm + 2,
    paddingVertical: 4,
    gap: 4,
  },
  photoCountText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.ivoryMist,
  },
});

export default ResultHero;
