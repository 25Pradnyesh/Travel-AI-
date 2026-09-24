import React, { useState } from 'react';
import {
  Image,
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Radius, Shadows, Spacing, Typography } from '@/constants/theme';

export interface ImageCardProps {
  imageUrl?: string;
  title: string;
  subtitle?: string;
  badge?: React.ReactNode;
  photoCount?: number;
  onPress?: () => void;
  aspectRatio?: number;
  style?: StyleProp<ViewStyle>;
}

export const ImageCard: React.FC<ImageCardProps> = React.memo(({
  imageUrl,
  title,
  subtitle,
  badge,
  photoCount,
  onPress,
  aspectRatio = 16 / 10,
  style,
}) => {
  const [imageError, setImageError] = useState(false);

  React.useEffect(() => {
    setImageError(false);
  }, [imageUrl]);

  const imageSource = React.useMemo(() => {
    return imageUrl ? { uri: imageUrl } : undefined;
  }, [imageUrl]);

  const content = (
    <View style={[styles.container, { aspectRatio }, style]}>
      {imageSource && !imageError ? (
        <Image
          source={imageSource}
          style={styles.image}
          resizeMode="cover"
          onError={() => setImageError(true)}
        />
      ) : (
        <View style={styles.placeholder}>
          <Ionicons name="image-outline" size={36} color={Colors.textMuted} />
          <Text style={styles.placeholderText}>Destination Imagery</Text>
        </View>
      )}

      {/* Dark Scrim Overlay for Legibility */}
      <View style={styles.overlay} />

      {/* Top Bar inside Card */}
      <View style={styles.topContainer}>
        {badge ? <View>{badge}</View> : <View />}
        {photoCount != null && photoCount > 1 && (
          <View style={styles.counterBadge}>
            <Ionicons name="camera-outline" size={12} color="#FFF" style={styles.cameraIcon} />
            <Text style={styles.counterText}>1 / {photoCount}</Text>
          </View>
        )}
      </View>

      {/* Bottom Text Content */}
      <View style={styles.bottomContainer}>
        {subtitle && (
          <View style={styles.subtitleRow}>
            <Ionicons name="location-sharp" size={12} color="rgba(255, 255, 255, 0.85)" />
            <Text style={styles.subtitleText} numberOfLines={1}>
              {subtitle.toUpperCase()}
            </Text>
          </View>
        )}
        <Text style={styles.titleText} numberOfLines={2}>
          {title}
        </Text>
      </View>
    </View>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        accessible={true}
        accessibilityRole="button"
        accessibilityLabel={`${title}, ${subtitle || ''}`}
        style={({ pressed }) => [pressed && styles.pressed]}
      >
        {content}
      </Pressable>
    );
  }

  return content;
});

ImageCard.displayName = 'ImageCard';

const styles = StyleSheet.create({
  container: {
    width: '100%',
    borderRadius: Radius.xxl,
    overflow: 'hidden',
    backgroundColor: Colors.surfaceDark,
    position: 'relative',
    ...Shadows.card,
  },
  image: {
    ...StyleSheet.absoluteFill,
  },
  placeholder: {
    ...StyleSheet.absoluteFill,
    backgroundColor: Colors.surfaceSubtle,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  placeholderText: {
    ...Typography.caption,
    color: Colors.textMuted,
    marginTop: Spacing.xs,
  },
  overlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
  },
  topContainer: {
    position: 'absolute',
    top: Spacing.md,
    left: Spacing.md,
    right: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 2,
  },
  counterBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: Radius.md,
  },
  cameraIcon: {
    marginRight: 4,
  },
  counterText: {
    ...Typography.mono,
    fontSize: 10,
    color: '#FFF',
    fontWeight: '600',
  },
  bottomContainer: {
    position: 'absolute',
    bottom: Spacing.md,
    left: Spacing.md,
    right: Spacing.md,
    zIndex: 2,
  },
  subtitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  subtitleText: {
    ...Typography.label,
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.9)',
    marginLeft: 4,
  },
  titleText: {
    ...Typography.h1,
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.4)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  pressed: {
    opacity: 0.92,
    transform: [{ scale: 0.99 }],
  },
});

export default ImageCard;
