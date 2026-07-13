type ToastType = 'success' | 'error' | 'info';

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

type Listener = (toasts: Toast[]) => void;
let listeners: Listener[] = [];
let toasts: Toast[] = [];

export const toast = {
  subscribe(listener: Listener) {
    listeners.push(listener);
    // Emit current toasts to the new subscriber
    listener(toasts);
    return () => {
      listeners = listeners.filter((l) => l !== listener);
    };
  },
  show(message: string, type: ToastType = 'info') {
    const id = Math.random().toString(36).substring(2);
    toasts = [...toasts, { id, message, type }];
    listeners.forEach((l) => l(toasts));
    
    // Auto-remove after 4 seconds
    setTimeout(() => {
      toasts = toasts.filter((t) => t.id !== id);
      listeners.forEach((l) => l(toasts));
    }, 4000);
  },
  error(message: string) {
    this.show(message, 'error');
  },
  success(message: string) {
    this.show(message, 'success');
  },
  info(message: string) {
    this.show(message, 'info');
  },
};
