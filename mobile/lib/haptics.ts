/**
 * Travel AI — Native Tactile Feedback Utility
 *
 * Safe wrapper around expo-haptics with platform guards for web/simulators.
 */

import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';

export const hapticFeedback = {
  light: async () => {
    if (Platform.OS === 'web') return;
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {
      // Ignore unsupported devices
    }
  },

  medium: async () => {
    if (Platform.OS === 'web') return;
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {
      // Ignore unsupported devices
    }
  },

  selection: async () => {
    if (Platform.OS === 'web') return;
    try {
      await Haptics.selectionAsync();
    } catch {
      // Ignore unsupported devices
    }
  },

  success: async () => {
    if (Platform.OS === 'web') return;
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      // Ignore unsupported devices
    }
  },
};
