import React, { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  TextInput,
  View,
  ViewStyle,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Fonts, Radius, Spacing, TouchTarget } from '@/constants/theme';
import { hapticFeedback } from '@/lib/haptics';

export interface GlassInputProps {
  value: string;
  onChangeText: (text: string) => void;
  onSubmit: () => void;
  onClear?: () => void;
  placeholder?: string;
  error?: string | null;
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}

export const GlassInput: React.FC<GlassInputProps> = ({
  value,
  onChangeText,
  onSubmit,
  onClear,
  placeholder = 'Paste Instagram Reel link',
  error,
  loading = false,
  disabled = false,
  style,
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const hasValue = value.trim().length > 0;
  const isError = Boolean(error);

  const handlePaste = async () => {
    try {
      const text = await Clipboard.getStringAsync();
      if (text) {
        hapticFeedback.light();
        onChangeText(text.trim());
      }
    } catch {
      // Clipboard access unavailable
    }
  };

  const handleClear = () => {
    hapticFeedback.light();
    onChangeText('');
    onClear?.();
  };

  const handleSubmit = () => {
    if (disabled || loading) return;
    hapticFeedback.medium();
    onSubmit();
  };

  return (
    <View style={[styles.wrapper, style]}>
      {/* Translucent Glass Pill Container */}
      <View
        style={[
          styles.container,
          isFocused && styles.containerFocused,
          isError && styles.containerError,
          disabled && styles.disabled,
        ]}
      >
        {/* Left Link Icon */}
        <View style={styles.iconSlot}>
          <Ionicons
            name="link-outline"
            size={18}
            color={isError ? Colors.racingRed : isFocused ? Colors.ivoryMist : Colors.textSecondary}
          />
        </View>

        {/* Text Input Field */}
        <TextInput
          value={value}
          onChangeText={onChangeText}
          onSubmitEditing={handleSubmit}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
          placeholderTextColor={Colors.textMuted}
          editable={!disabled && !loading}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="url"
          returnKeyType="go"
          selectTextOnFocus
          style={styles.input}
          accessible={true}
          accessibilityLabel="Instagram Reel link input"
          accessibilityHint="Paste or type a public Instagram Reel link"
        />

        {/* Right Embedded Actions */}
        <View style={styles.actionsRow}>
          {hasValue ? (
            <>
              {/* Clear button */}
              <Pressable
                onPress={handleClear}
                hitSlop={8}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel="Clear reel link"
                style={({ pressed }) => [styles.clearButton, pressed && styles.pressed]}
              >
                <Ionicons name="close-circle" size={18} color={Colors.textMuted} />
              </Pressable>

              {/* Primary Racing Red Send/Analyze Action */}
              <Pressable
                onPress={handleSubmit}
                disabled={loading || disabled}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel="Analyze reel"
                style={({ pressed }) => [
                  styles.sendButton,
                  loading && styles.sendButtonLoading,
                  pressed && styles.pressed,
                ]}
              >
                {loading ? (
                  <ActivityIndicator size="small" color={Colors.textOnRed} />
                ) : (
                  <Ionicons name="arrow-forward" size={16} color={Colors.textOnRed} />
                )}
              </Pressable>
            </>
          ) : (
            /* Paste button shortcut */
            <Pressable
              onPress={handlePaste}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Paste link from clipboard"
              style={({ pressed }) => [styles.pastePill, pressed && styles.pressed]}
            >
              <Ionicons name="clipboard-outline" size={13} color={Colors.ivoryMist} />
              <Text style={styles.pasteText}>Paste</Text>
            </Pressable>
          )}
        </View>
      </View>

      {/* Inline Contextual Error Tooltip */}
      {isError && (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={14} color={Colors.racingRed} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.glassBg,
    borderRadius: Radius.pill,
    minHeight: 58,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    paddingHorizontal: Spacing.base,
  },
  containerFocused: {
    borderColor: 'rgba(251, 244, 227, 0.45)',
    backgroundColor: 'rgba(14, 26, 34, 0.85)',
  },
  containerError: {
    borderColor: Colors.racingRed,
  },
  disabled: {
    opacity: 0.5,
  },
  iconSlot: {
    marginRight: Spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    flex: 1,
    fontFamily: Fonts.sansRegular,
    fontSize: 14,
    color: Colors.ivoryMist,
    paddingVertical: Spacing.sm,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs + 2,
    marginLeft: Spacing.xs,
  },
  clearButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.racingRed, // Surgical Racing Red primary CTA
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonLoading: {
    opacity: 0.85,
  },
  pastePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(251, 244, 227, 0.08)',
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    gap: 4,
    minHeight: 32,
  },
  pasteText: {
    fontFamily: Fonts.sansSemiBold,
    fontSize: 12,
    color: Colors.ivoryMist,
  },
  pressed: {
    opacity: 0.75,
    transform: [{ scale: 0.96 }],
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: Spacing.xs + 3,
    paddingHorizontal: Spacing.sm,
  },
  errorText: {
    fontFamily: Fonts.sansMedium,
    fontSize: 12,
    color: Colors.racingRed,
    flex: 1,
  },
});

export default GlassInput;
