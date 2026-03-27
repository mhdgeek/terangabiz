'use client'
import { useState, useEffect, createContext, useContext, useCallback, ReactNode } from 'react'

interface ToastItem { id: number; msg: string; type: 'ok' | 'err' | 'info' }

const ToastCtx = createContext<{ show: (msg: string, type?: 'ok' | 'err' | 'info') => void }>({ show: () => {} })

let globalShow: ((msg: string, type?: 'ok' | 'err' | 'info') => void) | null = null

export function useToast() { return useContext(ToastCtx) }
export const toast = {
  ok: (msg: string) => globalShow?.(msg, 'ok'),
  err: (msg: string) => globalShow?.(msg, 'err'),
  info: (msg: string) => globalShow?.(msg, 'info'),
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const show = useCallback((msg: string, type: 'ok' | 'err' | 'info' = 'ok') => {
    const id = Date.now()
    setToasts(p => [...p, { id, msg, type }])
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 3200)
  }, [])

  useEffect(() => { globalShow = show }, [show])

  return (
    <ToastCtx.Provider value={{ show }}>
      {children}
      <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {toasts.map(t => (
          <div key={t.id} className={`toast toast-${t.type}`}>{t.msg}</div>
        ))}
      </div>
    </ToastCtx.Provider>
  )
}

export default function Toast() { return null }
