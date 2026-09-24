import React from 'react';
import {
  Pressable,
  StyleProp,
  StyleSheet,
  TextInput,
  View,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Radius, Spacing, TouchTarget, Typography } from '@/constants/theme';

export interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  onClear?: () => void;
  style?: StyleProp<ViewStyle>;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChangeText,
  placeholder = 'Search destinations, places...',
  onClear,
  style,
}) => {
  const hasValue = value.length > 0;

  const handleClear = () => {
    onChangeText('');
    onClear?.();
  };

  return (
    <View style={[styles.container, style]}>
      <Ionicons name="search" size={18} color={Colors.textMuted} style={styles.searchIcon} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={Colors.textMuted}
        autoCorrect={false}
        returnKeyType="search"
        style={styles.input}
        accessible={true}
        accessibilityLabel={placeholder}
        accessibilityRole="search"
      />
      {hasValue && (
        <Pressable
          onPress={handleClear}
          hitSlop={8}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Clear search text"
          style={styles.clearButton}
        >
          <Ionicons name="close-circle" size={16} color={Colors.textMuted} />
        </Pressable>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    borderRadius: Radius.xl,
    paddingHorizontal: Spacing.md,
    minHeight: 46,
  },
  searchIcon: {
    marginRight: Spacing.sm,
  },
  input: {
    flex: 1,
    ...Typography.body,
    fontSize: 14,
    color: Colors.textPrimary,
    paddingVertical: Spacing.xs,
  },
  clearButton: {
    minWidth: TouchTarget.minWidth / 1.5,
    minHeight: TouchTarget.minHeight / 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default SearchBar;
