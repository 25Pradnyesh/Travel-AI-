import React, { useEffect, useRef } from 'react';
import {
  Animated,
  DimensionValue,
  StyleProp,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { Radius } from '@/constants/theme';

export interface SkeletonShimmerProps {
  width?: DimensionValue;
  height?: DimensionValue;
  borderRadius?: number;
  style?: StyleProp<ViewStyle>;
}

export const SkeletonShimmer: React.FC<SkeletonShimmerProps> = ({
  width = '100%',
  height = 20,
  borderRadius = Radius.md,
  style,
}) => {
  const opacityAnim = useRef(new Animated.Value(0.40)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacityAnim, {
          toValue: 0.92,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0.40,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [opacityAnim]);

  return (
    <Animated.View
      style={[
        styles.skeleton,
        {
          width,
          height,
          borderRadius,
          opacity: opacityAnim,
        },
        style,
      ]}
    />
  );
};

const styles = StyleSheet.create({
  skeleton: {
    // High-visibility bone color visible over both light sky gradient and dark photo scrims
    backgroundColor: 'rgba(251, 244, 227, 0.24)',
    borderWidth: 1,
    borderColor: 'rgba(251, 244, 227, 0.35)',
  },
});

export default SkeletonShimmer;
