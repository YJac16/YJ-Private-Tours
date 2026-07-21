import { useState } from 'react'
import { cardClass, inputClass, labelClass } from '../adminShared'

export type TimelineStop = {
  title: string
  description: string
  duration?: string
  icon?: string
  image?: string
  arrival_time?: string
  lat?: number
  lng?: number
}

type Props = {
  stops: TimelineStop[]
  onChange: (stops: TimelineStop[]) => void
}

const emptyStop = (): TimelineStop => ({
  title: '',
  description: '',
  duration: '',
  arrival_time: '',
  image: '',
  icon: '',
})

export default function ItineraryBuilder({ stops, onChange }: Props) {
  const [dragIndex, setDragIndex] = useState<number | null>(null)

  const update = (index: number, patch: Partial<TimelineStop>) => {
    const next = stops.map((s, i) => (i === index ? { ...s, ...patch } : s))
    onChange(next)
  }

  const remove = (index: number) => {
    onChange(stops.filter((_, i) => i !== index))
  }

  const duplicate = (index: number) => {
    const copy = { ...stops[index], title: `${stops[index].title || 'Stop'} (copy)` }
    const next = [...stops]
    next.splice(index + 1, 0, copy)
    onChange(next)
  }

  const add = () => onChange([...stops, emptyStop()])

  const onDragStart = (index: number) => setDragIndex(index)

  const onDrop = (index: number) => {
    if (dragIndex == null || dragIndex === index) {
      setDragIndex(null)
      return
    }
    const next = [...stops]
    const [moved] = next.splice(dragIndex, 1)
    next.splice(index, 0, moved)
    onChange(next)
    setDragIndex(null)
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-brand-green">Itinerary stops</h3>
        <button
          type="button"
          onClick={add}
          className="rounded-lg bg-brand-green px-3 py-2 text-sm font-semibold text-brand-cream"
        >
          Add stop
        </button>
      </div>

      {stops.length === 0 && (
        <p className="text-sm text-brand-green/70">No stops yet. Add the first stop.</p>
      )}

      {stops.map((stop, index) => (
        <div
          key={index}
          draggable
          onDragStart={() => onDragStart(index)}
          onDragOver={(e) => e.preventDefault()}
          onDrop={() => onDrop(index)}
          className={`${cardClass} cursor-grab active:cursor-grabbing ${
            dragIndex === index ? 'opacity-60 ring-2 ring-brand-gold' : ''
          }`}
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-brand-gold">
              Stop {index + 1} · drag to reorder
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => duplicate(index)}
                className="text-xs underline text-brand-green/80"
              >
                Duplicate
              </button>
              <button
                type="button"
                onClick={() => remove(index)}
                className="text-xs underline text-red-800"
              >
                Delete
              </button>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            <label className={labelClass}>
              Title
              <input
                className={inputClass}
                value={stop.title}
                onChange={(e) => update(index, { title: e.target.value })}
              />
            </label>
            <label className={labelClass}>
              Duration
              <input
                className={inputClass}
                value={stop.duration ?? ''}
                onChange={(e) => update(index, { duration: e.target.value })}
                placeholder="e.g. 45 min"
              />
            </label>
            <label className={labelClass}>
              Arrival time
              <input
                className={inputClass}
                value={stop.arrival_time ?? ''}
                onChange={(e) => update(index, { arrival_time: e.target.value })}
                placeholder="e.g. 09:30"
              />
            </label>
            <label className={labelClass}>
              Icon
              <input
                className={inputClass}
                value={stop.icon ?? ''}
                onChange={(e) => update(index, { icon: e.target.value })}
                placeholder="e.g. mountain"
              />
            </label>
            <label className={`${labelClass} sm:col-span-2`}>
              Image URL
              <input
                className={inputClass}
                value={stop.image ?? ''}
                onChange={(e) => update(index, { image: e.target.value })}
              />
            </label>
            <label className={`${labelClass} sm:col-span-2`}>
              Description
              <textarea
                rows={3}
                className={`${inputClass} py-2`}
                value={stop.description}
                onChange={(e) => update(index, { description: e.target.value })}
              />
            </label>
            <label className={labelClass}>
              Latitude
              <input
                type="number"
                step="any"
                className={inputClass}
                value={stop.lat ?? ''}
                onChange={(e) =>
                  update(index, {
                    lat: e.target.value === '' ? undefined : Number(e.target.value),
                  })
                }
              />
            </label>
            <label className={labelClass}>
              Longitude
              <input
                type="number"
                step="any"
                className={inputClass}
                value={stop.lng ?? ''}
                onChange={(e) =>
                  update(index, {
                    lng: e.target.value === '' ? undefined : Number(e.target.value),
                  })
                }
              />
            </label>
          </div>
        </div>
      ))}
    </div>
  )
}
