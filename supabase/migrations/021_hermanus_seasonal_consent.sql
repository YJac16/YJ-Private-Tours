-- 021 — Hermanus Whale Experience (seasonal) + informed consent

-- ---------------------------------------------------------------------------
-- Vehicles: Mercedes display rename (capacity unchanged)
-- ---------------------------------------------------------------------------
UPDATE vehicles
SET
  name = 'Mercedes-Benz GLC 220 Coupe',
  description = 'Premium Experience — luxury comfort and refined private travel'
WHERE slug = 'mercedes';

-- ---------------------------------------------------------------------------
-- Hermanus tour seed (PPP R3,400 so cheapest vehicle R2,500 + PPP = From R5,900)
-- ---------------------------------------------------------------------------
INSERT INTO tours (
  id,
  name,
  description,
  slug,
  duration_label,
  price_per_person_cents,
  base_price_cents,
  additional_guest_price_cents,
  max_guests,
  short_description,
  hero_tagline,
  detailed_description,
  included_items,
  excluded_items,
  perfect_for,
  good_to_know,
  pricing_notes,
  seo_title,
  seo_description,
  seo_image,
  hero_image_url,
  image_url,
  gallery_images,
  admin_meta,
  experience_content
) VALUES (
  '11111111-1111-1111-1111-111111111105',
  'Hermanus Whale Experience',
  'A private land-based Hermanus whale-season journey from Cape Town.',
  'hermanus',
  'Full Day · 8–10 hours',
  340000,
  340000,
  340000,
  5,
  'A Private Whale-Season Journey from Cape Town',
  'Discover Hermanus during whale season with private transport, a qualified local guide and a relaxed day exploring the spectacular Whale Coast.',
  E'This is a PRIVATE, LAND-BASED Hermanus experience from Cape Town during whale season.\n\nThe experience focuses on private transport, a qualified local guide, the scenic Overberg journey, Hermanus sightseeing, the Hermanus coastline, land-based whale viewing during whale season, a flexible private itinerary, and family-friendly Muslim-friendly service.\n\nIMPORTANT: This is NOT a whale-watching boat tour. KhayrCape does NOT operate a whale-watching boat. The boat is NOT included.',
  ARRAY[
    'Private Cape Town pickup and return',
    'Private vehicle of your choice',
    'Qualified local guide/driver',
    'Scenic Overberg journey',
    'Hermanus sightseeing',
    'Land-based whale-season viewing opportunities',
    'Flexible private itinerary',
    'Booking coordination',
    'Family-friendly service',
    'Muslim-friendly service'
  ],
  ARRAY[
    'Whale-watching boat tour',
    'Boat tickets',
    'Boat operator fees',
    'Lunch and meals',
    'Personal purchases',
    'Optional activities',
    'Entrance fees where applicable',
    'Any activity not explicitly included'
  ],
  ARRAY[
    'Whale-season travellers',
    'Families and couples',
    'Nature and coastline lovers',
    'Guests wanting a private Cape Town day trip',
    'Muslim-friendly travellers'
  ],
  ARRAY[
    'Whale season is typically June through October.',
    'Wildlife sightings cannot be guaranteed.',
    'The whale-watching boat experience is not included.',
    'Lunch is not included unless specifically arranged.',
    'Halal-friendly options can be recommended on request.',
    'Your Hermanus Whale Experience includes private transport, qualified guiding and the land-based Hermanus experience.'
  ],
  'From R5,900 per private group (1 guest + cheapest private vehicle). Final price depends on guest count and vehicle. Boat tour not included.',
  'Hermanus Whale Experience from Cape Town | KhayrCape Experiences',
  'Experience Hermanus during whale season with a private day experience from Cape Town, including private transport, a qualified local guide, scenic coastal sightseeing and land-based whale-viewing opportunities.',
  '/chapmans-peak.jpg',
  '/chapmans-peak.jpg',
  '/chapmans-peak.jpg',
  ARRAY['/chapmans-peak.jpg', '/blouberg.JPG', '/muizenberg.jpg', '/clifton.JPG'],
  jsonb_build_object(
    'status', 'active',
    'display_order', 10,
    'featured', true,
    'season', jsonb_build_object(
      'start', jsonb_build_object('m', 6, 'd', 1),
      'end', jsonb_build_object('m', 10, 'd', 31),
      'tz', 'Africa/Johannesburg'
    )
  ),
  jsonb_build_object(
    'timeline', jsonb_build_array(
      jsonb_build_object(
        'title', 'Private Cape Town Pickup',
        'description', 'Private pickup from your selected Cape Town location.',
        'duration', '15–30 min',
        'icon', 'pickup'
      ),
      jsonb_build_object(
        'title', 'Scenic Overberg Journey',
        'description', 'Travel from Cape Town toward Hermanus with a qualified local guide.',
        'duration', '1.5–2 hrs',
        'icon', 'scenic'
      ),
      jsonb_build_object(
        'title', 'Hermanus',
        'description', 'Explore selected Hermanus locations depending on timing, weather and guest preferences — Cliff Path, Gearing''s Point, Old Harbour, waterfront and scenic viewpoints.',
        'duration', 'Flexible',
        'icon', 'coast'
      ),
      jsonb_build_object(
        'title', 'Whale-Season Viewing',
        'description', 'Look for Southern Right Whales and other marine wildlife from suitable land-based viewpoints. Sightings cannot be guaranteed.',
        'duration', 'Flexible',
        'icon', 'whale'
      ),
      jsonb_build_object(
        'title', 'Flexible Stops',
        'description', 'Coffee, lunch stop (not included), shopping, photography and sightseeing as preferred.',
        'duration', 'Flexible',
        'icon', 'relax'
      ),
      jsonb_build_object(
        'title', 'Return to Cape Town',
        'description', 'Private return to your original or preferred drop-off location.',
        'duration', '1.5–2 hrs',
        'icon', 'return'
      )
    ),
    'faqs', jsonb_build_array(
      jsonb_build_object(
        'question', 'When is the Hermanus Whale Experience available?',
        'answer', 'The Hermanus Whale Experience is a seasonal experience available from June through October.'
      ),
      jsonb_build_object(
        'question', 'Are whales guaranteed?',
        'answer', 'No. Whales are wild animals and sightings cannot be guaranteed.'
      ),
      jsonb_build_object(
        'question', 'Is the boat tour included?',
        'answer', 'No. The whale-watching boat experience is not included in the KhayrCape tour price.'
      ),
      jsonb_build_object(
        'question', 'Can KhayrCape arrange a boat?',
        'answer', 'KhayrCape can assist with an enquiry to an external licensed whale-watching operator, subject to operator availability, weather and sea conditions.'
      ),
      jsonb_build_object(
        'question', 'Can I pay for the boat through KhayrCape?',
        'answer', 'No. The boat experience is separate from the KhayrCape booking and is not part of the checkout.'
      ),
      jsonb_build_object(
        'question', 'Is lunch included?',
        'answer', 'Lunch is not included unless specifically stated. Halal-friendly options can be arranged or recommended on request.'
      ),
      jsonb_build_object(
        'question', 'Which vehicle can I choose?',
        'answer', 'Suzuki XL6: up to 5 guests. Toyota Corolla Cross GR Sport: up to 3 guests. Mercedes-Benz GLC 220 Coupe: up to 3 guests (Premium Experience).'
      )
    )
  )
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  slug = EXCLUDED.slug,
  duration_label = EXCLUDED.duration_label,
  price_per_person_cents = EXCLUDED.price_per_person_cents,
  base_price_cents = EXCLUDED.base_price_cents,
  additional_guest_price_cents = EXCLUDED.additional_guest_price_cents,
  max_guests = EXCLUDED.max_guests,
  short_description = EXCLUDED.short_description,
  hero_tagline = EXCLUDED.hero_tagline,
  detailed_description = EXCLUDED.detailed_description,
  included_items = EXCLUDED.included_items,
  excluded_items = EXCLUDED.excluded_items,
  perfect_for = EXCLUDED.perfect_for,
  good_to_know = EXCLUDED.good_to_know,
  pricing_notes = EXCLUDED.pricing_notes,
  seo_title = EXCLUDED.seo_title,
  seo_description = EXCLUDED.seo_description,
  seo_image = EXCLUDED.seo_image,
  hero_image_url = EXCLUDED.hero_image_url,
  image_url = EXCLUDED.image_url,
  gallery_images = EXCLUDED.gallery_images,
  admin_meta = EXCLUDED.admin_meta,
  experience_content = EXCLUDED.experience_content;

-- Also upsert by slug if a different id already exists
UPDATE tours SET
  name = 'Hermanus Whale Experience',
  description = 'A private land-based Hermanus whale-season journey from Cape Town.',
  duration_label = 'Full Day · 8–10 hours',
  price_per_person_cents = 340000,
  max_guests = 5,
  admin_meta = COALESCE(admin_meta, '{}'::jsonb) || jsonb_build_object(
    'status', 'active',
    'display_order', 10,
    'featured', true,
    'season', jsonb_build_object(
      'start', jsonb_build_object('m', 6, 'd', 1),
      'end', jsonb_build_object('m', 10, 'd', 31),
      'tz', 'Africa/Johannesburg'
    )
  )
WHERE slug = 'hermanus'
  AND id <> '11111111-1111-1111-1111-111111111105';

-- ---------------------------------------------------------------------------
-- Informed consent
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS consent_form_versions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  version       TEXT NOT NULL UNIQUE,
  title         TEXT NOT NULL,
  body_html     TEXT NOT NULL,
  effective_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  is_current    BOOLEAN NOT NULL DEFAULT false,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS consent_form_versions_one_current
  ON consent_form_versions ((is_current))
  WHERE is_current = true;

CREATE TABLE IF NOT EXISTS client_consents (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  version_id      UUID NOT NULL REFERENCES consent_form_versions (id) ON DELETE RESTRICT,
  full_name       TEXT NOT NULL,
  email           TEXT NOT NULL,
  phone           TEXT,
  signature_text  TEXT NOT NULL,
  signed_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  ip              TEXT,
  user_agent      TEXT,
  form_payload    JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, version_id)
);

CREATE INDEX IF NOT EXISTS idx_client_consents_user_id ON client_consents (user_id);
CREATE INDEX IF NOT EXISTS idx_client_consents_version_id ON client_consents (version_id);

ALTER TABLE consent_form_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_consents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone read current consent form" ON consent_form_versions;
CREATE POLICY "Anyone read current consent form"
  ON consent_form_versions FOR SELECT
  USING (is_current = true OR EXISTS (
    SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'
  ));

DROP POLICY IF EXISTS "Clients read own consents" ON client_consents;
CREATE POLICY "Clients read own consents"
  ON client_consents FOR SELECT
  USING (
    auth.uid() = user_id
    OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

DROP POLICY IF EXISTS "Clients insert own consents" ON client_consents;
CREATE POLICY "Clients insert own consents"
  ON client_consents FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Seed v1 form (lawyer review recommended)
INSERT INTO consent_form_versions (id, version, title, body_html, is_current, effective_at)
VALUES (
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaa0001',
  'v1-2026',
  'Informed Consent & Assumption of Risk — KhayrCape Experiences',
  $html$
<p>By signing this Informed Consent Form, I acknowledge that I am voluntarily participating in a private touring experience organised by KhayrCape Experiences (“KhayrCape”).</p>
<p><strong>Nature of the experience.</strong> Tours involve private road travel, walking, sightseeing, photography stops, coastal viewpoints, and other activities that may include uneven surfaces, stairs, weather exposure, traffic, wildlife viewing from land, and optional stops chosen by guests.</p>
<p><strong>Assumption of risk.</strong> I understand that touring carries inherent risks of personal injury, illness, property damage or loss, including but not limited to slips, trips, falls, vehicle-related incidents, weather-related hazards, and interactions with the natural environment. Wildlife sightings (including whales and other marine life) cannot be guaranteed.</p>
<p><strong>Health & fitness.</strong> I confirm that I (and any minors in my care) are fit to participate, have disclosed relevant medical conditions where appropriate, and will follow reasonable safety instructions from the guide/driver.</p>
<p><strong>Minors.</strong> If booking for minors, I confirm I am a parent/guardian or authorised adult and accept responsibility for their supervision and safety.</p>
<p><strong>Third-party activities.</strong> Optional activities not operated by KhayrCape (including any external whale-watching boat operator, restaurants, attractions, or entrance venues) are separate. KhayrCape does not operate whale-watching boats and does not sell boat tickets. Any boat enquiry assistance is subject to external operator availability, weather and sea conditions.</p>
<p><strong>Liability.</strong> To the fullest extent permitted by applicable South African law, I release and hold harmless KhayrCape, its owners, guides, drivers and agents from claims arising from my participation, except where caused by gross negligence or wilful misconduct as determined by a competent court.</p>
<p><strong>Insurance.</strong> I understand that I am responsible for obtaining personal travel/medical insurance if desired.</p>
<p><strong>Photography & POPIA.</strong> I consent to KhayrCape processing my personal information for booking, safety, and operational purposes in line with the Privacy Policy, and understand that incidental photography may occur during tours.</p>
<p><strong>Binding effect.</strong> This consent applies to all future KhayrCape bookings under my account until a new consent version is published and requires re-signature.</p>
<p>I have read and understood this form and sign it voluntarily.</p>
$html$,
  true,
  now()
)
ON CONFLICT (version) DO UPDATE SET
  title = EXCLUDED.title,
  body_html = EXCLUDED.body_html,
  is_current = EXCLUDED.is_current,
  effective_at = EXCLUDED.effective_at;
