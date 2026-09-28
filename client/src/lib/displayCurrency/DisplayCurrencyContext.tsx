import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { defaultDisplayCurrencyFromLocales } from './localeDefault'
import { readStoredDisplayCurrency, writeStoredDisplayCurrency } from './storage'
import type { DisplayCurrencyCode, EcbRatesSnapshot } from './types'
import { formatApproxLine } from './fxMath'

type DisplayCurrencyContextValue = {
  currency: DisplayCurrencyCode
  setCurrency: (code: DisplayCurrencyCode) => void
  rates: EcbRatesSnapshot | null
  ratesReady: boolean
  approxLineForZarCents: (cents: number) => string | null
  showFxDisclaimer: boolean
}

const DisplayCurrencyContext = createContext<DisplayCurrencyContextValue | null>(
  null
)

function resolveInitialCurrency(): DisplayCurrencyCode {
  if (typeof window === 'undefined') return 'USD'
  return (
    readStoredDisplayCurrency() ??
    defaultDisplayCurrencyFromLocales(navigator.languages)
  )
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
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { rates?: EcbRatesSnapshot | null } | null) => {
        if (cancelled) return
        if (data?.rates) setRates(data.rates)
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

  const approxLineForZarCents = useCallback(
    (cents: number) => formatApproxLine(cents, currency, rates),
    [currency, rates]
  )

  const showFxDisclaimer =
    currency !== 'ZAR' &&
    Boolean(
      rates?.perEur.ZAR &&
        rates.perEur[currency] &&
        rates.perEur[currency] > 0
    )

  const value = useMemo(
    () => ({
      currency,
      setCurrency,
      rates,
      ratesReady,
      approxLineForZarCents,
      showFxDisclaimer,
    }),
    [currency, setCurrency, rates, ratesReady, approxLineForZarCents, showFxDisclaimer]
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
