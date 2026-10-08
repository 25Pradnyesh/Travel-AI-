import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Radius, Spacing } from '@/constants/theme';

export interface DestinationIdentityProps {
  name: string;
  locationSubtitle?: string;
  category?: string;
  confidence?: number;
  verificationStatus?: string;
}

export const DestinationIdentity: React.FC<DestinationIdentityProps> = ({
  name,
  locationSubtitle,
  category,
  confidence,
  verificationStatus,
}) => {
  // Translate confidence / verification into human-readable editorial text
  const confidenceLabel = React.useMemo(() => {
    if (verificationStatus === 'VERIFIED') return 'Verified Location';
    if (confidence && confidence >= 80) return 'High Confidence';
    if (confidence && confidence >= 50) return 'Identified Match';
    if (verificationStatus === 'PARTIAL') return 'Likely Match';
    return 'Location Identified';
  }, [confidence, verificationStatus]);

  return (
    <View style={styles.container}>
      {/* Restrained "WE FOUND IT" Discovery Moment */}
      <View style={styles.statusRow}>
        <View style={styles.weFoundItPill}>
          <View style={styles.redDot} />
          <Text style={styles.weFoundItText}>WE FOUND IT</Text>
        </View>

        {confidenceLabel && (
          <View style={styles.confidencePill}>
            <Text style={styles.confidenceText}>{confidenceLabel.toUpperCase()}</Text>
          </View>
        )}
      </View>

      {/* Prominent Editorial Destination Name */}
      <Text style={styles.nameText} numberOfLines={3}>
        {name}
      </Text>

      {/* City, Region, Country Location Hierarchy */}
      {locationSubtitle ? (
        <View style={styles.locationRow}>
          <Ionicons name="location-outline" size={16} color={Colors.onyx} style={styles.pinIcon} />
          <Text style={styles.locationText} numberOfLines={2}>
            {locationSubtitle}
          </Text>
        </View>
      ) : null}

      {/* Category Tag */}
      {category ? (
        <View style={styles.categoryRow}>
          <View style={styles.categoryBadge}>
            <View style={styles.categoryDot} />
            <Text style={styles.categoryText}>{category}</Text>
          </View>
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.xl, // 24px horizontal padding
    marginBottom: Spacing.lg,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  weFoundItPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(235, 38, 39, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(235, 38, 39, 0.20)',
    borderRadius: Radius.full,
    paddingHorizontal: 8,
    paddingVertical: 3,
    gap: 5,
  },
  redDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.racingRed, // Racing Red #EB2627 signature accent
  },
  weFoundItText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2,
    color: Colors.racingRed,
  },
  confidencePill: {
    backgroundColor: 'rgba(166, 220, 248, 0.25)', // Icy Blue #A6DCF8 subtle surface
    borderWidth: 1,
    borderColor: 'rgba(166, 220, 248, 0.50)',
    borderRadius: Radius.full,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  confidenceText: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1,
    color: Colors.onyx,
  },
  nameText: {
    fontSize: 32,
    lineHeight: 38,
    fontWeight: '800',
    letterSpacing: -0.8,
    color: Colors.onyx,
    marginBottom: 6,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 5,
    marginTop: 2,
  },
  pinIcon: {
    marginTop: 2,
  },
  locationText: {
    fontSize: 15,
    lineHeight: 22,
    color: 'rgba(12, 12, 12, 0.65)',
    fontWeight: '500',
    flex: 1,
  },
  categoryRow: {
    marginTop: Spacing.sm,
    flexDirection: 'row',
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(12, 12, 12, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(12, 12, 12, 0.12)',
    borderRadius: Radius.full,
    paddingHorizontal: 10,
    paddingVertical: 4,
    gap: 6,
  },
  categoryDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: Colors.icyBlue, // Icy Blue accent
  },
  categoryText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.onyx,
    letterSpacing: 0.3,
  },
});

export default DestinationIdentity;
