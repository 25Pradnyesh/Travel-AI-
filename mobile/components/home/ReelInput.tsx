import React, { useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Radius, Spacing, TouchTarget } from '@/constants/theme';
import { hapticFeedback } from '@/lib/haptics';

export interface ReelInputProps {
  value: string;
  onChangeText: (text: string) => void;
  onSubmit?: () => void;
  onClear?: () => void;
  error?: string;
  disabled?: boolean;
}

export const ReelInput: React.FC<ReelInputProps> = ({
  value,
  onChangeText,
  onSubmit,
  onClear,
  error,
  disabled = false,
}) => {
  const [isFocused, setIsFocused] = useState(false);

  const handlePaste = async () => {
    try {
      const text = await Clipboard.getStringAsync();
      if (text) {
        hapticFeedback.light();
        onChangeText(text.trim());
      }
    } catch {
      // Clipboard access rejected or unavailable
    }
  };

  const handleClear = () => {
    hapticFeedback.light();
    onChangeText('');
    onClear?.();
  };

  const hasValue = value.length > 0;
  const isError = Boolean(error);

  return (
    <View style={styles.wrapper}>
      {/* Label / Input Header */}
      <View style={styles.headerRow}>
        <Text style={styles.inputLabel}>REEL LINK</Text>
        {isFocused && (
          <Text style={styles.activeIndicator}>READY</Text>
        )}
      </View>

      {/* Tactile Input Container */}
      <View
        style={[
          styles.container,
          isError
            ? styles.containerError
            : isFocused
            ? styles.containerFocused
            : styles.containerNormal,
          disabled && styles.disabled,
        ]}
      >
        {/* Monochromatic Link Icon */}
        <View style={styles.iconContainer}>
          <Ionicons
            name="link-outline"
            size={18}
            color={
              isError
                ? Colors.racingRed
                : isFocused
                ? Colors.onyx
                : 'rgba(12, 12, 12, 0.40)'
            }
          />
        </View>

        {/* Text Input */}
        <TextInput
          value={value}
          onChangeText={onChangeText}
          onSubmitEditing={onSubmit}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder="Paste Instagram Reel link"
          placeholderTextColor="rgba(12, 12, 12, 0.35)"
          editable={!disabled}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="url"
          returnKeyType="go"
          selectTextOnFocus
          style={[styles.input, isError && styles.inputError]}
          accessible={true}
          accessibilityLabel="Instagram Reel link input"
          accessibilityHint="Paste or type an Instagram Reel link to analyze"
        />

        {/* Inline Actions */}
        <View style={styles.actionContainer}>
          {hasValue ? (
            <Pressable
              onPress={handleClear}
              hitSlop={10}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Clear reel link"
              style={({ pressed }) => [styles.clearButton, pressed && styles.pressed]}
            >
              <Ionicons name="close-circle" size={18} color="rgba(12, 12, 12, 0.45)" />
            </Pressable>
          ) : (
            <Pressable
              onPress={handlePaste}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Paste reel link from clipboard"
              style={({ pressed }) => [styles.pasteButton, pressed && styles.pressed]}
            >
              <Ionicons name="clipboard-outline" size={13} color={Colors.onyx} />
              <Text style={styles.pasteText}>Paste</Text>
            </Pressable>
          )}
        </View>
      </View>

      {/* Inline Contextual Error */}
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
    paddingHorizontal: Spacing.xl, // 24px editorial padding
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs + 2,
  },
  inputLabel: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: 'rgba(12, 12, 12, 0.50)',
  },
  activeIndicator: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    color: Colors.onyx,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.ivoryMist,
    borderRadius: Radius.lg + 4, // 12-14px refined radius
    paddingHorizontal: Spacing.base,
    minHeight: 56, // Generous touch target
    borderWidth: 1.5,
  },
  containerNormal: {
    borderColor: 'rgba(12, 12, 12, 0.16)', // Crisp subtle Onyx border
  },
  containerFocused: {
    borderColor: Colors.onyx, // Confident solid Onyx focus state
  },
  containerError: {
    borderColor: Colors.racingRed, // Controlled Racing Red accent
  },
  disabled: {
    opacity: 0.5,
  },
  iconContainer: {
    marginRight: Spacing.sm + 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    flex: 1,
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '400',
    color: Colors.onyx,
    paddingVertical: Spacing.md,
  },
  inputError: {
    color: Colors.onyx,
  },
  actionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: Spacing.xs,
  },
  clearButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pasteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm + 2,
    paddingVertical: Spacing.xs + 2,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: 'rgba(12, 12, 12, 0.14)',
    backgroundColor: 'rgba(12, 12, 12, 0.04)',
  },
  pasteText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.onyx,
    marginLeft: 4,
  },
  pressed: {
    opacity: 0.65,
    transform: [{ scale: 0.96 }],
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.xs + 3,
    paddingHorizontal: 2,
    gap: 6,
  },
  errorText: {
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 16,
    color: Colors.racingRed,
    flex: 1,
  },
});

export default ReelInput;
