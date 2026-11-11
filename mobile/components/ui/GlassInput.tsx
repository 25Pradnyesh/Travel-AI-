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
import { Colors, Fonts, Radius, Spacing } from '@/constants/theme';
import { hapticFeedback } from '@/lib/haptics';
import { extractInstagramUrl } from '@/lib/utils';
import { logTap } from '@/lib/dev/tap-logger';

export interface GlassInputProps {
  value: string;
  onChangeText: (text: string) => void;
  onSubmit: () => void;
  onClear?: () => void;
  onError?: (error: string) => void;
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
  onError,
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
    logTap('GlassInput:Paste');
    try {
      const text = await Clipboard.getStringAsync();
      if (text) {
        hapticFeedback.light();
        const extracted = extractInstagramUrl(text);
        if (extracted) {
          onChangeText(extracted);
        } else {
          // Do NOT insert the junk, show inline error under the pill
          onError?.('No valid Instagram link found in pasted text.');
        }
      }
    } catch {
      // Clipboard access unavailable
    }
  };

  const handleClear = () => {
    logTap('GlassInput:Clear');
    hapticFeedback.light();
    onChangeText('');
    onClear?.();
  };

  const handleSubmit = () => {
    logTap('GlassInput:Submit', { hasValue });
    if (disabled || loading) return;
    hapticFeedback.medium();
    onSubmit();
  };

  return (
    <View style={[styles.wrapper, style]}>
      {/* Translucent Glass Pill Container — Fixed 58px height, borderRadius 29, no vertical growth */}
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

        {/* Text Input Field — Single line, no vertical growth, text clipped with ellipsis */}
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
          multiline={false}
          numberOfLines={1}
          maxLength={300}
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

      {/* Inline Contextual Error Slot under the pill — Reserved 22px height to guarantee zero layout jump */}
      <View style={styles.errorSlot}>
        {isError && error ? (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle-outline" size={13} color={Colors.racingRed} />
            <Text style={styles.errorText} numberOfLines={1} ellipsizeMode="tail">
              {error}
            </Text>
          </View>
        ) : null}
      </View>
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
    borderRadius: 29, // Fixed 29, NEVER 999
    height: 58, // Fixed 58px height, NO vertical growth
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    paddingHorizontal: Spacing.base,
    overflow: 'hidden',
  },
  containerFocused: {
    borderColor: 'rgba(251, 244, 227, 0.45)',
    backgroundColor: 'rgba(14, 26, 34, 0.85)',
  },
  containerError: {
    borderColor: Colors.racingRed, // Thin red border on the SAME pill
    borderWidth: 1,
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
    paddingVertical: 0,
    height: 58,
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
  errorSlot: {
    height: 22,
    marginTop: 4,
    justifyContent: 'center',
    paddingHorizontal: Spacing.sm,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  errorText: {
    fontFamily: Fonts.sansMedium,
    fontSize: 12,
    color: Colors.racingRed,
    flex: 1,
  },
});

export default GlassInput;
