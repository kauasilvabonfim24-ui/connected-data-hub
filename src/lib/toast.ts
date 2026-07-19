type ToastType = 'success' | 'error'

interface Toast {
  id: string
  message: string
  type: ToastType
}

type Listener = (toasts: Toast[]) => void

let toasts: Toast[] = []
const listeners = new Set<Listener>()

function notify() {
  listeners.forEach((listener) => listener([...toasts]))
}

export const toast = {
  success(message: string, options?: { id?: string }) {
    const id = options?.id || Math.random().toString(36).substring(2, 9)
    // Remove if duplicate id
    toasts = toasts.filter((t) => t.id !== id)
    toasts.push({ id, message, type: 'success' })
    notify()
    setTimeout(() => this.dismiss(id), 4000)
  },

  error(message: string, options?: { id?: string }) {
    const id = options?.id || Math.random().toString(36).substring(2, 9)
    // Remove if duplicate id
    toasts = toasts.filter((t) => t.id !== id)
    toasts.push({ id, message, type: 'error' })
    notify()
    setTimeout(() => this.dismiss(id), 4000)
  },

  dismiss(id: string) {
    toasts = toasts.filter((t) => t.id !== id)
    notify()
  },

  subscribe(listener: Listener) {
    listeners.add(listener)
    listener([...toasts])
    return () => {
      listeners.delete(listener)
    }
  }
}

export default toast