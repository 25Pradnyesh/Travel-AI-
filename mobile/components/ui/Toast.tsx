import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  Animated,
  Easing,
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Fonts, Radius, Spacing } from '@/constants/theme';
import { hapticFeedback } from '@/lib/haptics';

export type ToastType = 'info' | 'success' | 'warning' | 'error';

export interface ToastItem {
  id: string;
  message: string;
  type?: ToastType;
  duration?: number;
}

type ToastListener = (toast: ToastItem) => void;
const listeners = new Set<ToastListener>();

let toastCounter = 0;

/**
 * Dispatch a toast notification to the global toast queue.
 */
export const showToast = (message: string, type: ToastType = 'info', duration?: number) => {
  const item: ToastItem = {
    id: `toast_${Date.now()}_${++toastCounter}`,
    message,
    type,
    duration: duration ?? (type === 'error' ? 5000 : 3200),
  };
  listeners.forEach((listener) => listener(item));
};

export const toast = {
  info: (message: string, duration?: number) => showToast(message, 'info', duration),
  success: (message: string, duration?: number) => showToast(message, 'success', duration),
  warning: (message: string, duration?: number) => showToast(message, 'warning', duration),
  error: (message: string, duration?: number) => showToast(message, 'error', duration),
  show: showToast,
};

export interface ToastProps {
  message: string;
  type?: ToastType;
  onDismiss?: () => void;
  style?: StyleProp<ViewStyle>;
}

/**
 * Standalone Toast Presentation Component
 */
export const Toast: React.FC<ToastProps> = ({
  message,
  type = 'info',
  onDismiss,
  style,
}) => {
  const getIcon = () => {
    switch (type) {
      case 'success':
        return <Ionicons name="checkmark-circle" size={17} color={Colors.verified} />;
      case 'warning':
        return <Ionicons name="warning" size={17} color={Colors.partial} />;
      case 'error':
        return <Ionicons name="alert-circle" size={17} color={Colors.error} />;
      default:
        return <Ionicons name="information-circle" size={17} color={Colors.icyBlue} />;
    }
  };

  return (
    <Pressable
      onPress={() => {
        hapticFeedback.light();
        onDismiss?.();
      }}
      accessible={true}
      accessibilityRole="alert"
      accessibilityLiveRegion="assertive"
      accessibilityLabel={`${type} notification: ${message}`}
      style={({ pressed }) => [
        styles.toastCard,
        styles[type],
        pressed && styles.pressed,
        style,
      ]}
    >
      <View style={styles.iconContainer}>{getIcon()}</View>
      <Text style={styles.messageText} numberOfLines={2}>
        {message}
      </Text>
      {onDismiss && (
        <Ionicons
          name="close"
          size={14}
          color={Colors.textMuted}
          style={styles.closeIcon}
        />
      )}
    </Pressable>
  );
};

/**
 * GlobalToast Manager
 *
 * Mounts at the root app layout.
 * Listens for toast events, maintains an in-order queue, and animates
 * a single frosted dark pill down directly below the status bar.
 */
export const GlobalToast: React.FC = () => {
  const insets = useSafeAreaInsets();
  const [currentToast, setCurrentToast] = useState<ToastItem | null>(null);
  const queueRef = useRef<ToastItem[]>([]);
  const isPresentingRef = useRef(false);
  const dismissTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const translateY = useRef(new Animated.Value(-100)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  const dismissCurrent = useCallback(() => {
    if (dismissTimerRef.current) {
      clearTimeout(dismissTimerRef.current);
      dismissTimerRef.current = null;
    }

    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -100,
        duration: 220,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setCurrentToast(null);
      isPresentingRef.current = false;
      // Process next item in queue if available
      if (queueRef.current.length > 0) {
        const next = queueRef.current.shift()!;
        presentToast(next);
      }
    });
  }, [opacity, translateY]);

  const presentToast = useCallback(
    (item: ToastItem) => {
      isPresentingRef.current = true;
      setCurrentToast(item);

      // Announce to screen readers
      AccessibilityInfo.announceForAccessibility(
        `${item.type || 'info'}: ${item.message}`
      );

      translateY.setValue(-100);
      opacity.setValue(0);

      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          tension: 80,
          friction: 10,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();

      const duration = item.duration ?? (item.type === 'error' ? 5000 : 3200);
      dismissTimerRef.current = setTimeout(() => {
        dismissCurrent();
      }, duration);
    },
    [dismissCurrent, opacity, translateY]
  );

  useEffect(() => {
    const handleNewToast = (item: ToastItem) => {
      if (!isPresentingRef.current) {
        presentToast(item);
      } else {
        // Enqueue if a toast is already actively displayed
        queueRef.current.push(item);
      }
    };

    listeners.add(handleNewToast);
    return () => {
      listeners.delete(handleNewToast);
      if (dismissTimerRef.current) {
        clearTimeout(dismissTimerRef.current);
      }
    };
  }, [presentToast]);

  if (!currentToast) return null;

  return (
    <View
      style={[
        styles.globalWrapper,
        {
          top: Math.max(insets.top, 16) + Spacing.sm,
        },
      ]}
      pointerEvents="box-none"
    >
      <Animated.View
        style={{
          transform: [{ translateY }],
          opacity,
          width: '100%',
          alignItems: 'center',
        }}
      >
        <Toast
          message={currentToast.message}
          type={currentToast.type}
          onDismiss={dismissCurrent}
        />
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  globalWrapper: {
    position: 'absolute',
    left: Spacing.base,
    right: Spacing.base,
    zIndex: 9999,
    alignItems: 'center',
  },
  toastCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    paddingVertical: 11,
    minHeight: 46,
    borderRadius: Radius.pill,
    backgroundColor: 'rgba(8, 18, 24, 0.94)',
    borderWidth: 1,
    borderColor: 'rgba(251, 244, 227, 0.18)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 14,
    elevation: 8,
    maxWidth: 420,
    width: '100%',
  },
  iconContainer: {
    marginRight: Spacing.sm + 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  messageText: {
    flex: 1,
    fontFamily: Fonts.sansMedium,
    fontSize: 13,
    lineHeight: 18,
    color: Colors.ivoryMist,
  },
  closeIcon: {
    marginLeft: Spacing.sm,
    padding: 2,
  },
  info: {
    borderColor: 'rgba(166, 220, 248, 0.35)',
  },
  success: {
    borderColor: 'rgba(166, 220, 248, 0.45)',
  },
  warning: {
    borderColor: 'rgba(229, 168, 102, 0.45)',
  },
  error: {
    borderColor: 'rgba(235, 38, 39, 0.50)',
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
});

export default Toast;
