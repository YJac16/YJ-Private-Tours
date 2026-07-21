import { useState, type Dispatch, type SetStateAction } from 'react'
import { saveAdminPricing, type Tour } from '../../../lib/bookingApi'
import {
  cardClass,
  inputClass,
  labelClass,
  linesToList,
  listToLines,
} from '../adminShared'
import ItineraryBuilder, { type TimelineStop } from './ItineraryBuilder'

type Faq = { question: string; answer: string }

type Props = {
  pin: string
  tours: Tour[]
  setTours: Dispatch<SetStateAction<Tour[]>>
  onSaved: () => void
}

function getFaqs(tour: Tour): Faq[] {
  const faqs = tour.experience_content?.faqs
  return Array.isArray(faqs) ? faqs : []
}

function getTimeline(tour: Tour): TimelineStop[] {
  const timeline = tour.experience_content?.timeline
  return Array.isArray(timeline) ? (timeline as TimelineStop[]) : []
}

export default function ContentTab({ pin, tours, setTours, onSaved }: Props) {
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedId, setSelectedId] = useState(tours[0]?.id ?? '')

  const tour = tours.find((t) => t.id === selectedId) ?? tours[0]

  const updateTour = (id: string, patch: Partial<Tour>) => {
    setTours((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)))
  }

  const patchEc = (id: string, patch: NonNullable<Tour['experience_content']>) => {
    const t = tours.find((x) => x.id === id)
    if (!t) return
    updateTour(id, {
      experience_content: {
        ...(t.experience_content && typeof t.experience_content === 'object'
          ? t.experience_content
          : {}),
        ...patch,
      },
    })
  }

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    try {
      const data = await saveAdminPricing(pin, {
        tours: tours.map((t) => ({
          id: t.id,
          duration_label: t.duration_label ?? null,
          description: t.description ?? null,
          short_description: t.short_description ?? null,
          hero_tagline: t.hero_tagline ?? null,
          detailed_description: t.detailed_description ?? null,
          hero_image_url: t.hero_image_url ?? null,
          image_url: t.image_url ?? null,
          gallery_images: t.gallery_images ?? [],
          included_items: t.included_items ?? [],
          excluded_items: t.excluded_items ?? [],
          perfect_for: t.perfect_for ?? [],
          good_to_know: t.good_to_know ?? [],
          map_embed_url: t.map_embed_url ?? null,
          seo_title: t.seo_title ?? null,
          seo_description: t.seo_description ?? null,
          seo_image: t.seo_image ?? null,
          pricing_notes: t.pricing_notes ?? null,
          experience_content: t.experience_content,
        })),
      })
      setTours(data.tours)
      onSaved()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  if (!tour) {
    return <p className="text-sm text-brand-green/70">No tours loaded.</p>
  }

  const faqs = getFaqs(tour)
  const timeline = getTimeline(tour)

  return (
    <div className="space-y-6">
      {error && (
        <p className="text-sm text-red-800 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      <label className={labelClass}>
        Experience
        <select
          className={inputClass}
          value={tour.id}
          onChange={(e) => setSelectedId(e.target.value)}
        >
          {tours.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
      </label>

      <div className={cardClass}>
        <h2 className="text-lg font-bold text-brand-green">{tour.name}</h2>

        <label className={labelClass}>
          Short description
          <textarea
            rows={2}
            className={`${inputClass} py-2`}
            value={tour.short_description ?? ''}
            onChange={(e) =>
              updateTour(tour.id, { short_description: e.target.value || null })
            }
          />
        </label>

        <label className={labelClass}>
          Hero tagline
          <textarea
            rows={2}
            className={`${inputClass} py-2`}
            value={tour.hero_tagline ?? ''}
            onChange={(e) =>
              updateTour(tour.id, { hero_tagline: e.target.value || null })
            }
          />
        </label>

        <label className={labelClass}>
          Duration label
          <input
            className={inputClass}
            value={tour.duration_label ?? ''}
            onChange={(e) =>
              updateTour(tour.id, { duration_label: e.target.value || null })
            }
          />
        </label>

        <label className={labelClass}>
          Hero image URL
          <input
            className={inputClass}
            value={tour.hero_image_url ?? ''}
            onChange={(e) =>
              updateTour(tour.id, { hero_image_url: e.target.value || null })
            }
          />
        </label>

        <label className={labelClass}>
          Gallery images (one URL per line)
          <textarea
            rows={3}
            className={`${inputClass} py-2 font-mono text-xs`}
            value={listToLines(tour.gallery_images)}
            onChange={(e) =>
              updateTour(tour.id, { gallery_images: linesToList(e.target.value) })
            }
          />
        </label>

        <label className={labelClass}>
          Detailed description
          <textarea
            rows={5}
            className={`${inputClass} py-2`}
            value={tour.detailed_description ?? ''}
            onChange={(e) =>
              updateTour(tour.id, {
                detailed_description: e.target.value || null,
              })
            }
          />
        </label>

        <label className={labelClass}>
          Included (one per line)
          <textarea
            rows={3}
            className={`${inputClass} py-2`}
            value={listToLines(tour.included_items)}
            onChange={(e) =>
              updateTour(tour.id, { included_items: linesToList(e.target.value) })
            }
          />
        </label>

        <label className={labelClass}>
          Excluded (one per line)
          <textarea
            rows={3}
            className={`${inputClass} py-2`}
            value={listToLines(tour.excluded_items)}
            onChange={(e) =>
              updateTour(tour.id, { excluded_items: linesToList(e.target.value) })
            }
          />
        </label>

        <label className={labelClass}>
          Perfect for (one per line)
          <textarea
            rows={3}
            className={`${inputClass} py-2`}
            value={listToLines(tour.perfect_for)}
            onChange={(e) =>
              updateTour(tour.id, { perfect_for: linesToList(e.target.value) })
            }
          />
        </label>

        <label className={labelClass}>
          Good to know (one per line)
          <textarea
            rows={3}
            className={`${inputClass} py-2`}
            value={listToLines(tour.good_to_know)}
            onChange={(e) =>
              updateTour(tour.id, { good_to_know: linesToList(e.target.value) })
            }
          />
        </label>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-brand-green">FAQs</h3>
            <button
              type="button"
              className="rounded-lg bg-brand-gold/90 px-3 py-1.5 text-sm font-semibold text-brand-green"
              onClick={() =>
                patchEc(tour.id, {
                  faqs: [...faqs, { question: '', answer: '' }],
                })
              }
            >
              Add FAQ
            </button>
          </div>
          {faqs.map((faq, i) => (
            <div key={i} className="rounded-lg border border-brand-cream-dark p-3 space-y-2">
              <label className={labelClass}>
                Question
                <input
                  className={inputClass}
                  value={faq.question}
                  onChange={(e) => {
                    const next = faqs.map((f, idx) =>
                      idx === i ? { ...f, question: e.target.value } : f
                    )
                    patchEc(tour.id, { faqs: next })
                  }}
                />
              </label>
              <label className={labelClass}>
                Answer
                <textarea
                  rows={2}
                  className={`${inputClass} py-2`}
                  value={faq.answer}
                  onChange={(e) => {
                    const next = faqs.map((f, idx) =>
                      idx === i ? { ...f, answer: e.target.value } : f
                    )
                    patchEc(tour.id, { faqs: next })
                  }}
                />
              </label>
              <button
                type="button"
                className="text-xs underline text-red-800"
                onClick={() =>
                  patchEc(tour.id, {
                    faqs: faqs.filter((_, idx) => idx !== i),
                  })
                }
              >
                Remove
              </button>
            </div>
          ))}
        </div>

        <label className={labelClass}>
          Map embed URL
          <input
            className={inputClass}
            value={tour.map_embed_url ?? ''}
            onChange={(e) =>
              updateTour(tour.id, { map_embed_url: e.target.value || null })
            }
          />
        </label>

        <label className={labelClass}>
          SEO title
          <input
            className={inputClass}
            value={tour.seo_title ?? ''}
            onChange={(e) =>
              updateTour(tour.id, { seo_title: e.target.value || null })
            }
          />
        </label>

        <label className={labelClass}>
          SEO description
          <textarea
            rows={2}
            className={`${inputClass} py-2`}
            value={tour.seo_description ?? ''}
            onChange={(e) =>
              updateTour(tour.id, { seo_description: e.target.value || null })
            }
          />
        </label>

        <label className={labelClass}>
          SEO image
          <input
            className={inputClass}
            value={tour.seo_image ?? ''}
            onChange={(e) =>
              updateTour(tour.id, { seo_image: e.target.value || null })
            }
          />
        </label>

        <label className={labelClass}>
          Pricing notes
          <textarea
            rows={2}
            className={`${inputClass} py-2`}
            value={tour.pricing_notes ?? ''}
            onChange={(e) =>
              updateTour(tour.id, { pricing_notes: e.target.value || null })
            }
          />
        </label>
      </div>

      <ItineraryBuilder
        stops={timeline}
        onChange={(stops) => patchEc(tour.id, { timeline: stops })}
      />

      <button
        type="button"
        disabled={saving}
        onClick={handleSave}
        className="w-full min-h-12 rounded-lg bg-brand-green text-brand-cream font-semibold disabled:opacity-60"
      >
        {saving ? 'Saving…' : 'Save experience content'}
      </button>
    </div>
  )
}
