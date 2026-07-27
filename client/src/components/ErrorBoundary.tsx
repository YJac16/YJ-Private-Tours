import { Component, type ErrorInfo, type ReactNode } from 'react'

type Props = { children: ReactNode }
type State = { hasError: boolean }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('App ErrorBoundary:', error, info.componentStack)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-brand-cream-light text-brand-green px-4">
          <p className="text-center font-semibold text-lg">
            Something went wrong
          </p>
          <p className="text-center text-sm text-brand-green/80 max-w-md">
            Reload the page to continue. If you were signing in, try again after
            the refresh.
          </p>
          <button
            type="button"
            onClick={() => window.location.assign('/')}
            className="min-h-11 px-5 rounded-lg bg-brand-green text-brand-cream font-semibold"
          >
            Go home
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
