import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Fonts, Radius, Spacing } from '@/constants/theme';

export interface AuthButtonProps {
  provider: 'apple' | 'google';
  title?: string;
  caption?: string;
  onPress?: () => void;
  isLoading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
}

export const AuthButton: React.FC<AuthButtonProps> = ({
  provider,
  title,
  caption,
  onPress,
  isLoading = false,
  disabled = false,
  style,
}) => {
  const isApple = provider === 'apple';
  const defaultTitle = isApple ? 'Continue with Apple' : 'Continue with Google';
  const labelText = title || defaultTitle;

  return (
    <View style={[styles.wrapper, style]}>
      <Pressable
        onPress={onPress}
        disabled={disabled || isLoading}
        accessibilityRole="button"
        accessibilityLabel={labelText}
        accessibilityState={{ busy: isLoading, disabled }}
        style={({ pressed }) => [
          styles.buttonBase,
          isApple ? styles.appleButton : styles.googleButton,
          (disabled || isLoading) && styles.disabled,
          pressed && !disabled && !isLoading && styles.pressed,
        ]}
      >
        {isLoading ? (
          <ActivityIndicator size="small" color={isApple ? '#000000' : Colors.ivoryMist} />
        ) : (
          <View style={styles.buttonRow}>
            {/* Fixed 24px icon slot aligned left */}
            <View style={styles.iconSlot}>
              <Ionicons
                name={isApple ? 'logo-apple' : 'logo-google'}
                size={isApple ? 19 : 17}
                color={isApple ? '#000000' : Colors.ivoryMist}
              />
            </View>

            {/* Centered label */}
            <Text
              style={[
                styles.label,
                isApple ? styles.appleLabel : styles.googleLabel,
              ]}
              numberOfLines={1}
            >
              {labelText}
            </Text>

            {/* Balancing 24px slot for true mathematical centering */}
            <View style={styles.iconSlot} />
          </View>
        )}
      </Pressable>

      {/* Caption strictly BELOW the button, never inside */}
      {caption ? (
        <Text style={styles.captionText}>{caption}</Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
  },
  buttonBase: {
    height: 52,
    borderRadius: Radius.xl,
    paddingLeft: 16,
    paddingRight: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  appleButton: {
    backgroundColor: '#FFFFFF',
  },
  googleButton: {
    backgroundColor: Colors.glassDarkBg,
    borderWidth: 1.5,
    borderColor: 'rgba(251, 244, 227, 0.20)',
  },
  buttonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  iconSlot: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    flex: 1,
    textAlign: 'center',
    fontFamily: Fonts.sansSemiBold,
    fontSize: 15,
  },
  appleLabel: {
    color: '#000000',
  },
  googleLabel: {
    color: Colors.ivoryMist,
  },
  captionText: {
    marginTop: 6,
    textAlign: 'center',
    fontFamily: Fonts.sansRegular,
    fontSize: 11,
    color: Colors.textMuted,
    lineHeight: 16,
    paddingHorizontal: Spacing.sm,
  },
  disabled: {
    opacity: 0.55,
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.985 }],
  },
});
