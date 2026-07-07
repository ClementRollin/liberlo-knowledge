import { ref } from 'vue'

export type ToastType = 'success' | 'error' | 'warning' | 'info'

export interface Toast {
  id: string
  type: ToastType
  message: string
}

const toasts = ref<Toast[]>([])

export function useToast() {
  function addToast(type: ToastType, message: string) {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2)}`
    toasts.value.push({ id, type, message })
    setTimeout(() => removeToast(id), 4000)
  }

  function removeToast(id: string) {
    const index = toasts.value.findIndex((t) => t.id === id)
    if (index !== -1) toasts.value.splice(index, 1)
  }

  return {
    toasts,
    success: (message: string) => addToast('success', message),
    error: (message: string) => addToast('error', message),
    warning: (message: string) => addToast('warning', message),
    info: (message: string) => addToast('info', message),
    removeToast,
  }
}
