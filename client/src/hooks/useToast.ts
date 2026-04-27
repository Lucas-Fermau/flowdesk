import { useCallback, useEffect, useState } from 'react';

export type ToastVariant = 'success' | 'error' | 'info';

export interface Toast {
  id: number;
  message: string;
  variant: ToastVariant;
}

let nextId = 1;
const listeners = new Set<(toasts: Toast[]) => void>();
let store: Toast[] = [];

function publish() {
  for (const l of listeners) l(store);
}

export const toast = {
  show(message: string, variant: ToastVariant = 'info') {
    const id = nextId++;
    store = [...store, { id, message, variant }];
    publish();
    setTimeout(() => {
      store = store.filter((t) => t.id !== id);
      publish();
    }, 3500);
  },
  success: (m: string) => toast.show(m, 'success'),
  error: (m: string) => toast.show(m, 'error'),
  info: (m: string) => toast.show(m, 'info'),
};

export function useToasts() {
  const [toasts, setToasts] = useState<Toast[]>(store);
  useEffect(() => {
    const l = (next: Toast[]) => setToasts(next);
    listeners.add(l);
    return () => {
      listeners.delete(l);
    };
  }, []);
  const dismiss = useCallback((id: number) => {
    store = store.filter((t) => t.id !== id);
    publish();
  }, []);
  return { toasts, dismiss };
}
