/**
 * VAMO Mobile — Reusable Photo Credit Component
 *
 * Rules:
 * - Bundled/default photos show NO credit pill anywhere.
 * - Credit pills appear ONLY for remote photos whose license requires attribution
 *   (e.g., Wikimedia: author + license, or Google Places contributors).
 * - Fixed slot bottom-left above the safe area, max ~60% width, one line with ellipsis,
 *   11px typography, dark glass styling.
 * - Sits cleanly above footers, buttons, and floating tab bars without overlapping.
 */

import React from 'react';
import {
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Fonts, Radius, Spacing } from '@/constants/theme';
import { useAtmosphere } from '@/context/AtmosphereContext';

export interface PhotoCreditProps {
  /** Explicit attribution string override */
  author?: string | null;
  /** Custom bottom distance in points (e.g. to clear floating bottom tab bars or buttons) */
  bottomOffset?: number;
  /** Custom style override */
  style?: StyleProp<ViewStyle>;
}

export const PhotoCredit: React.FC<PhotoCreditProps> = ({
  author: explicitAuthor,
  bottomOffset,
  style,
}) => {
  const insets = useSafeAreaInsets();
  const { activeAuthor, isDestinationActive } = useAtmosphere();

  const author = explicitAuthor !== undefined ? explicitAuthor : activeAuthor;

  // RULE: Only render if an author is present AND it's an active destination/remote photo
  // Bundled photos never show a credit pill
  if (!author || author.trim().length === 0 || (!explicitAuthor && !isDestinationActive)) {
    return null;
  }

  const cleanAuthor = author.trim().replace(/^photo:\s*/i, '');
  const calculatedBottom = bottomOffset !== undefined ? bottomOffset : insets.bottom + 12;

  return (
    <View
      style={[
        styles.container,
        { bottom: calculatedBottom },
        style,
      ]}
      pointerEvents="none"
    >
      <View style={styles.glassPill}>
        <Text style={styles.creditText} numberOfLines={1} ellipsizeMode="tail">
          Photo: {cleanAuthor}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: Spacing.base,
    maxWidth: '60%',
    zIndex: 85,
  },
  glassPill: {
    backgroundColor: 'rgba(8, 14, 18, 0.82)',
    borderWidth: 1,
    borderColor: 'rgba(251, 244, 227, 0.14)',
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.sm + 2,
    paddingVertical: 3.5,
    justifyContent: 'center',
  },
  creditText: {
    fontFamily: Fonts.sansRegular,
    fontSize: 11,
    lineHeight: 14,
    color: 'rgba(251, 244, 227, 0.85)',
    letterSpacing: 0.2,
  },
});

export default PhotoCredit;
