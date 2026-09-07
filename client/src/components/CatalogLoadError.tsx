type Props = {
  message: string
  onRetry: () => void
  className?: string
}

/** Shared fallback when /api/catalog fails or times out. */
export default function CatalogLoadError({
  message,
  onRetry,
  className = '',
}: Props) {
  return (
    <div
      className={`rounded-xl border border-red-200 bg-red-50 px-4 py-4 text-center space-y-3 ${className}`}
      role="alert"
    >
      <p className="text-sm text-red-800">{message}</p>
      <button
        type="button"
        onClick={onRetry}
        className="inline-flex min-h-10 items-center justify-center rounded-lg bg-brand-green px-4 py-2 text-sm font-semibold text-brand-cream hover:bg-brand-green-dark"
      >
        Try again
      </button>
    </div>
  )
}
