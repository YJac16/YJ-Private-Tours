import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { resolveDisplayCurrencyPreference } from './resolveDisplayCurrency'
import { writeStoredDisplayCurrency } from './storage'
import type { DisplayCurrencyCode, EcbRatesSnapshot } from './types'
import {
  formatApproxLine,
  fxRatesAvailable,
  parseFxRatesApiBody,
  shouldShowFxDisclaimer,
} from './ecbParse'

type DisplayCurrencyContextValue = {
  currency: DisplayCurrencyCode
  setCurrency: (code: DisplayCurrencyCode) => void
  rates: EcbRatesSnapshot | null
  ratesReady: boolean
  fxRatesAvailable: boolean
  approxLineForZarCents: (cents: number) => string | null
  showFxDisclaimer: boolean
}

const DisplayCurrencyContext = createContext<DisplayCurrencyContextValue | null>(
  null
)

function resolveInitialCurrency(): DisplayCurrencyCode {
  if (typeof window === 'undefined') return 'USD'
  return resolveDisplayCurrencyPreference(navigator.languages)
}

export function DisplayCurrencyProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrencyState] = useState<DisplayCurrencyCode>(
    resolveInitialCurrency
  )
  const [rates, setRates] = useState<EcbRatesSnapshot | null>(null)
  const [ratesReady, setRatesReady] = useState(false)

  useEffect(() => {
    let cancelled = false
    const controller = new AbortController()
    const timeout = window.setTimeout(() => controller.abort(), 8_000)

    fetch('/api/fx-rates', { signal: controller.signal })
      .then(async (res) => {
        if (!res.ok) return null
        try {
          return await res.json()
        } catch {
          return null
        }
      })
      .then((data: unknown) => {
        if (cancelled) return
        setRates(parseFxRatesApiBody(data))
      })
      .catch(() => {
        /* ZAR-only display */
      })
      .finally(() => {
        if (!cancelled) setRatesReady(true)
        window.clearTimeout(timeout)
      })

    return () => {
      cancelled = true
      controller.abort()
      window.clearTimeout(timeout)
    }
  }, [])

  const setCurrency = useCallback((code: DisplayCurrencyCode) => {
    setCurrencyState(code)
    writeStoredDisplayCurrency(code)
  }, [])

  const ratesOk = fxRatesAvailable(rates)

  const approxLineForZarCents = useCallback(
    (cents: number) =>
      ratesOk ? formatApproxLine(cents, currency, rates) : null,
    [currency, rates, ratesOk]
  )

  const showFxDisclaimer = shouldShowFxDisclaimer(currency, rates) && ratesOk

  const value = useMemo(
    () => ({
      currency,
      setCurrency,
      rates,
      ratesReady,
      fxRatesAvailable: ratesOk,
      approxLineForZarCents,
      showFxDisclaimer,
    }),
    [currency, setCurrency, rates, ratesReady, ratesOk, approxLineForZarCents, showFxDisclaimer]
  )

  return (
    <DisplayCurrencyContext.Provider value={value}>
      {children}
    </DisplayCurrencyContext.Provider>
  )
}

export function useDisplayCurrency(): DisplayCurrencyContextValue {
  const ctx = useContext(DisplayCurrencyContext)
  if (!ctx) {
    throw new Error('useDisplayCurrency must be used within DisplayCurrencyProvider')
  }
  return ctx
}
