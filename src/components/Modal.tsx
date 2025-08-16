import React, { useEffect } from 'react'

type ModalProps = {
  open: boolean
  onClose: () => void
  title?: React.ReactNode
  children: React.ReactNode
  footer?: React.ReactNode
}

export default function Modal({ open, onClose, title, children, footer }: ModalProps) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
    >
      {/* Dimmer */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      {/* Dialog */}
      <div className="relative w-full max-w-2xl rounded-2xl bg-white shadow-lg overflow-hidden">
        {/* Sticky Header */}
        <div className="px-4 py-3 border-b sticky top-0 bg-white z-10 flex items-center justify-between">
          <div className="font-semibold">{title}</div>
          <button
            onClick={onClose}
            className="rounded-lg border px-2 py-1 text-sm hover:bg-slate-50"
            aria-label="Close"
            title="Close"
          >×</button>
        </div>

        {/* Scroll-Body */}
        <div className="p-4 max-h-[70vh] overflow-auto">
          {children}
        </div>

        {/* Sticky Footer */}
        {footer && (
          <div className="px-4 py-3 border-t bg-slate-50 sticky bottom-0 flex items-center justify-end gap-2">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}
