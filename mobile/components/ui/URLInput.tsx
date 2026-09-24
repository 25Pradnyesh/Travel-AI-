import React, { useState } from 'react';
import {
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
import { Colors, Radius, Spacing, TouchTarget, Typography } from '@/constants/theme';
import { hapticFeedback } from '@/lib/haptics';

export interface URLInputProps {
  value: string;
  onChangeText: (text: string) => void;
  onSubmit?: () => void;
  placeholder?: string;
  error?: string;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  onClear?: () => void;
}

export const URLInput: React.FC<URLInputProps> = ({
  value,
  onChangeText,
  onSubmit,
  placeholder = 'Paste Instagram Reel URL...',
  error,
  disabled = false,
  style,
  onClear,
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
      // Clipboard access rejected or empty
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
    <View style={[styles.wrapper, style]}>
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
        <View style={styles.iconContainer}>
          <Ionicons
            name="link"
            size={18}
            color={isError ? Colors.error : isFocused ? Colors.textPrimary : Colors.textMuted}
          />
        </View>

        <TextInput
          value={value}
          onChangeText={onChangeText}
          onSubmitEditing={onSubmit}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
          placeholderTextColor={Colors.textMuted}
          editable={!disabled}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="url"
          returnKeyType="go"
          selectTextOnFocus
          style={[styles.input, isError && styles.inputError]}
          accessible={true}
          accessibilityLabel="Instagram Reel URL Input"
          accessibilityHint="Type or paste a public Instagram Reel link"
        />

        <View style={styles.actionRow}>
          {hasValue ? (
            <Pressable
              onPress={handleClear}
              hitSlop={8}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Clear input"
              style={({ pressed }) => [styles.clearButton, pressed && styles.pressed]}
            >
              <Ionicons name="close-circle" size={18} color={Colors.textMuted} />
            </Pressable>
          ) : (
            <Pressable
              onPress={handlePaste}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Paste from clipboard"
              style={({ pressed }) => [styles.pasteButton, pressed && styles.pressed]}
            >
              <Ionicons name="clipboard-outline" size={14} color={Colors.textSecondary} />
              <Text style={styles.pasteText}>Paste</Text>
            </Pressable>
          )}
        </View>
      </View>

      {isError && (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={14} color={Colors.error} />
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
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    paddingHorizontal: Spacing.md,
    minHeight: 52,
    borderWidth: 1,
  },
  containerNormal: {
    borderColor: Colors.borderSubtle,
  },
  containerFocused: {
    borderColor: Colors.borderFocus,
  },
  containerError: {
    borderColor: Colors.error,
  },
  disabled: {
    opacity: 0.6,
  },
  iconContainer: {
    marginRight: Spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    flex: 1,
    ...Typography.body,
    fontSize: 14,
    color: Colors.textPrimary,
    paddingVertical: Spacing.sm,
  },
  inputError: {
    color: Colors.error,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: Spacing.xs,
  },
  clearButton: {
    minWidth: TouchTarget.minWidth / 1.5,
    minHeight: TouchTarget.minHeight / 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pasteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs + 2,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    backgroundColor: Colors.surfaceSubtle,
  },
  pasteText: {
    ...Typography.caption,
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginLeft: Spacing.xs,
  },
  pressed: {
    opacity: 0.6,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.xs + 2,
    paddingHorizontal: Spacing.xs,
  },
  errorText: {
    ...Typography.bodySmall,
    color: Colors.error,
    fontSize: 12,
    fontWeight: '500',
    marginLeft: Spacing.xs,
  },
});

export default URLInput;
