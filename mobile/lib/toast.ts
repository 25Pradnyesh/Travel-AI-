export type ToastType = 'info' | 'success' | 'warning' | 'error';

export interface ToastItem {
  id: string;
  message: string;
  type?: ToastType;
  duration?: number;
}

export type ToastListener = (toast: ToastItem) => void;
export const toastListeners = new Set<ToastListener>();

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
  toastListeners.forEach((listener) => listener(item));
};

export const toast = {
  info: (message: string, duration?: number) => showToast(message, 'info', duration),
  success: (message: string, duration?: number) => showToast(message, 'success', duration),
  warning: (message: string, duration?: number) => showToast(message, 'warning', duration),
  error: (message: string, duration?: number) => showToast(message, 'error', duration),
  show: showToast,
};
