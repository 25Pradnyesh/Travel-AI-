import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Fonts, Radius, Spacing } from '@/constants/theme';
import { useDemoMode } from '@/lib/demo/demo-mode';
import { hapticFeedback } from '@/lib/haptics';
import { DemoScenarioSheet } from './DemoScenarioSheet';
import { logTap } from '@/lib/dev/tap-logger';

interface DemoModePillProps {
  compact?: boolean;
}

export const DemoModePill: React.FC<DemoModePillProps> = ({ compact = false }) => {
  const { isDemoMode, activeScenario } = useDemoMode();
  const [sheetVisible, setSheetVisible] = useState(false);

  if (!isDemoMode) {
    return null;
  }

  const handlePress = () => {
    logTap('DemoModePill:Press', { scenario: activeScenario.name });
    hapticFeedback.light();
    setSheetVisible(true);
  };

  return (
    <>
      <Pressable
        onPress={handlePress}
        hitSlop={6}
        accessible={true}
        accessibilityRole="button"
        accessibilityLabel={`Demo mode active for ${activeScenario.name}. Tap to choose scenario.`}
        style={({ pressed }) => [
          styles.container,
          compact && styles.compactContainer,
          pressed && styles.pressed,
        ]}
      >
        <Text style={styles.text}>Demo mode</Text>
        {!compact && (
          <Text style={styles.scenarioTag}>· {activeScenario.name}</Text>
        )}
        <Ionicons
          name="chevron-down"
          size={10}
          color="#f6d365"
          style={styles.chevron}
        />
      </Pressable>

      <DemoScenarioSheet
        visible={sheetVisible}
        onClose={() => setSheetVisible(false)}
      />
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 25, 34, 0.85)',
    borderWidth: 1,
    borderColor: 'rgba(232, 168, 56, 0.40)',
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.sm + 2,
    paddingVertical: 4,
    gap: 5,
  },
  compactContainer: {
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  pressed: {
    opacity: 0.75,
    transform: [{ scale: 0.98 }],
  },
  text: {
    fontFamily: Fonts.sansMedium,
    fontSize: 11,
    color: '#f6d365',
    letterSpacing: 0.2,
  },
  scenarioTag: {
    fontFamily: Fonts.sansRegular,
    fontSize: 10,
    color: 'rgba(251, 244, 227, 0.65)',
  },
  chevron: {
    opacity: 0.7,
    marginLeft: 1,
  },
});
