import { useId, useState, type ReactNode } from 'react'
import { HiOutlineEye, HiOutlineEyeOff } from 'react-icons/hi'

type PasswordFieldProps = {
  label: ReactNode
  value: string
  onChange: (value: string) => void
  autoComplete?: string
  required?: boolean
  minLength?: number
  id?: string
  name?: string
  labelClassName?: string
  inputClassName?: string
}

const defaultLabelClass = 'block text-sm text-brand-green'
const defaultInputClass =
  'w-full min-h-12 rounded-lg border border-brand-cream-dark px-3 pr-12 text-brand-green'

export default function PasswordField({
  label,
  value,
  onChange,
  autoComplete = 'current-password',
  required,
  minLength,
  id,
  name,
  labelClassName = defaultLabelClass,
  inputClassName = defaultInputClass,
}: PasswordFieldProps) {
  const generatedId = useId()
  const inputId = id ?? generatedId
  const [visible, setVisible] = useState(false)

  return (
    <div className={labelClassName}>
      <label htmlFor={inputId} className="block">
        {label}
      </label>
      <div className="relative mt-1">
        <input
          id={inputId}
          name={name}
          type={visible ? 'text' : 'password'}
          required={required}
          minLength={minLength}
          value={value}
          autoComplete={autoComplete}
          onChange={(e) => onChange(e.target.value)}
          className={inputClassName}
          style={{ paddingRight: '3rem' }}
        />
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => setVisible((current) => !current)}
          aria-label={visible ? 'Hide password' : 'Show password'}
          aria-pressed={visible}
          aria-controls={inputId}
          className="absolute inset-y-0 right-0 flex w-12 items-center justify-center text-brand-green/70 hover:text-brand-green"
        >
          {visible ? (
            <HiOutlineEyeOff className="h-5 w-5" aria-hidden />
          ) : (
            <HiOutlineEye className="h-5 w-5" aria-hidden />
          )}
        </button>
      </div>
    </div>
  )
}
