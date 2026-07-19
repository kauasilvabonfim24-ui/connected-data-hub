"use client";

import { useEffect, useState } from 'react'
import { toast } from '@/lib/toast'
import { CheckCircle2, XCircle, X } from 'lucide-react'

interface ToastItem {
  id: string
  message: string
  type: 'success' | 'error'
}

export default function ToastProvider() {
  const [items, setItems] = useState<ToastItem[]>([])

  useEffect(() => {
    return toast.subscribe((toasts) => {
      setItems(toasts)
    })
  }, [])

  if (items.length === 0) return null

  return (
    <div className="fixed right-4 top-4 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none">
      {items.map((item) => (
        <div
          key={item.id}
          className="flex items-start gap-3 rounded-xl border border-surface-border bg-white p-4 shadow-lg pointer-events-auto animate-in slide-in-from-top-4 duration-200"
        >
          {item.type === 'success' ? (
            <CheckCircle2 className="h-5 w-5 shrink-0 text-ia" />
          ) : (
            <XCircle className="h-5 w-5 shrink-0 text-rose-600" />
          )}
          <div className="flex-1 text-sm font-medium text-ink leading-snug">
            {item.message}
          </div>
          <button
            onClick={() => toast.dismiss(item.id)}
            className="text-ink-soft hover:text-ink transition shrink-0"
          >
            <X size={15} />
          </button>
        </div>
      ))}
    </div>
  )
}