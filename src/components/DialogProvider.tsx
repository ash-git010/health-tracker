import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react'

export interface ConfirmOptions {
  title: string
  message?: string
  confirmLabel?: string
  cancelLabel?: string
  destructive?: boolean
}

export interface PromptOptions {
  title: string
  message?: string
  initial?: string
  placeholder?: string
  confirmLabel?: string
}

type DialogState =
  | { kind: 'confirm'; options: ConfirmOptions }
  | { kind: 'prompt'; options: PromptOptions }
  | null

interface DialogContextValue {
  confirm: (options: ConfirmOptions) => Promise<boolean>
  prompt: (options: PromptOptions) => Promise<string | null>
}

const DialogContext = createContext<DialogContextValue | null>(null)

export function DialogProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<DialogState>(null)
  const [value, setValue] = useState('')
  const resolver = useRef<((result: unknown) => void) | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const confirm = useCallback((options: ConfirmOptions) => {
    setState({ kind: 'confirm', options })
    return new Promise<boolean>((resolve) => {
      resolver.current = resolve as (result: unknown) => void
    })
  }, [])

  const prompt = useCallback((options: PromptOptions) => {
    setValue(options.initial ?? '')
    setState({ kind: 'prompt', options })
    return new Promise<string | null>((resolve) => {
      resolver.current = resolve as (result: unknown) => void
    })
  }, [])

  const settle = useCallback((result: boolean | string | null) => {
    resolver.current?.(result)
    resolver.current = null
    setState(null)
    setValue('')
  }, [])

  const cancel = useCallback(() => {
    settle(state?.kind === 'prompt' ? null : false)
  }, [settle, state])

  useEffect(() => {
    if (!state) return

    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.preventDefault()
        cancel()
      }
    }

    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [state, cancel])

  useEffect(() => {
    if (state?.kind === 'prompt') {
      const handle = setTimeout(() => inputRef.current?.focus(), 60)
      return () => clearTimeout(handle)
    }
  }, [state])

  return (
    <DialogContext.Provider value={{ confirm, prompt }}>
      {children}

      {state && (
        <div className="dialog-backdrop" onClick={cancel} role="presentation">
          <div
            className="dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="dialog-title"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="dialog-title" className="dialog-title">
              {state.options.title}
            </h2>

            {state.options.message && (
              <p className="dialog-message">{state.options.message}</p>
            )}

            {state.kind === 'prompt' && (
              <input
                ref={inputRef}
                type="text"
                value={value}
                placeholder={state.options.placeholder}
                onChange={(e) => setValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && value.trim()) settle(value.trim())
                }}
                style={{ marginBottom: '1rem' }}
              />
            )}

            <div className="dialog-actions">
              <button className="btn btn-ghost grow" onClick={cancel}>
                {state.kind === 'confirm'
                  ? (state.options.cancelLabel ?? 'Cancel')
                  : 'Cancel'}
              </button>

              {state.kind === 'confirm' ? (
                <button
                  className={`btn grow ${state.options.destructive ? 'btn-destructive' : 'btn-primary'}`}
                  onClick={() => settle(true)}
                >
                  {state.options.confirmLabel ?? 'Confirm'}
                </button>
              ) : (
                <button
                  className="btn btn-primary grow"
                  disabled={!value.trim()}
                  onClick={() => settle(value.trim())}
                >
                  {state.options.confirmLabel ?? 'Save'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </DialogContext.Provider>
  )
}

export function useConfirm() {
  const ctx = useContext(DialogContext)
  if (!ctx) throw new Error('useConfirm must be used inside DialogProvider')
  return ctx.confirm
}

export function usePrompt() {
  const ctx = useContext(DialogContext)
  if (!ctx) throw new Error('usePrompt must be used inside DialogProvider')
  return ctx.prompt
}