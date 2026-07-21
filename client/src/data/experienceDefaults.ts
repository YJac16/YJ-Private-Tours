import type { ExperienceContent } from '../lib/experienceTypes'

const sharedFaqs = (duration: string): ExperienceContent['faqs'] => [
  {
    question: 'How long is the experience?',
    answer: `This experience typically lasts ${duration}. Exact timing can flex slightly with traffic, photo stops, and your preferred pace.`,
  },
  {
    question: 'Where do you collect guests?',
    answer:
      'We collect guests from hotels, Airbnbs, cruise terminals, and selected Cape Town locations. Share your pickup details when booking.',
  },
  {
    question: 'Can the itinerary be customised?',
    answer:
      'Yes. Every Khayr Cape Experience is private, so we can adjust stops and pacing to suit your interests, mobility, and schedule.',
  },
  {
    question: 'What should I bring?',
    answer:
      'Comfortable walking shoes, a light jacket, sun protection, and your camera. We provide complimentary bottled water in the vehicle.',
  },
  {
    question: 'Are entrance fees included?',
    answer:
      'Entrance fees, meals, and personal purchases are not included unless stated otherwise. Your guide will advise on optional tickets before or during the experience.',
  },
  {
    question: 'Is this a private experience?',
    answer:
      'Yes. All Khayr Cape Experiences are private and personalised — no large groups and no shared coaches.',
  },
]

export const EXPERIENCE_DEFAULTS: Record<string, ExperienceContent> = {
  city: {
    display_name: 'Cape Town City & Culture Experience',
    short_description:
      'A private introduction to Cape Town’s colourful heritage, viewpoints, and historic city centre.',
    hero_tagline:
      'Discover Bo-Kaap, Signal Hill, and the city’s cultural heart with a registered local guide.',
    detailed_description:
      'This private city experience is designed for travellers who want to understand Cape Town beyond the postcard views. With a registered professional tourist guide, you explore Bo-Kaap’s Cape Malay heritage, panoramic Signal Hill viewpoints, historic gardens, and iconic civic landmarks at a comfortable pace.\n\nUnlike large coach tours, every stop is flexible. Families, elderly travellers, and first-time visitors can linger for photos, ask questions, and skip what does not interest them. The experience is fully private — just your group, your guide, and a comfortable air-conditioned vehicle with hotel or Airbnb pickup and drop-off.',
    hero_image: '/bo-kaap.jpg',
    gallery_images: [
      '/bo-kaap.jpg',
      '/campsbay.JPG',
      '/Table Mountain.jpg',
      '/cape-point.jpg',
    ],
    timeline: [
      {
        title: 'Pickup',
        description:
          'Collection from your hotel, Airbnb, cruise terminal, or preferred pickup location within Cape Town.',
        duration: '15–20 min',
        icon: 'pickup',
      },
      {
        title: 'Bo-Kaap',
        description:
          "Walk through Cape Town’s colourful Cape Malay neighbourhood. Discover local history and enjoy a relaxed photography stop.",
        duration: '35–45 min',
        icon: 'culture',
        image: '/bo-kaap.jpg',
      },
      {
        title: 'Signal Hill',
        description:
          'Panoramic views across the city bowl, harbour, and toward Robben Island and Table Mountain. Ideal photography opportunities.',
        duration: '20–30 min',
        icon: 'viewpoint',
        image: '/Table Mountain.jpg',
      },
      {
        title: "Company's Garden",
        description:
          'Stroll through historic gardens near Parliament — a calm green pause in the heart of the city.',
        duration: '25–35 min',
        icon: 'garden',
      },
      {
        title: 'Historic City Drive',
        description:
          'Guided commentary past City Hall, Grand Parade, District Six, and the Castle of Good Hope.',
        duration: '25–35 min',
        icon: 'city',
      },
      {
        title: 'V&A Waterfront',
        description:
          'Optional harbour stroll, shopping, coffee stop, and photography before returning.',
        duration: '30–45 min',
        icon: 'harbour',
        image: '/campsbay.JPG',
      },
      {
        title: 'Return',
        description:
          'Drop-off back at your hotel, Airbnb, cruise terminal, or original pickup location.',
        duration: '15–20 min',
        icon: 'return',
      },
    ],
    included: [
      'Private Transport',
      'Registered Professional Tourist Guide',
      'Air-Conditioned Vehicle',
      'Hotel / Airbnb Pickup & Drop-off',
      'Complimentary Bottled Water',
      'Flexible Itinerary',
      'Photography Stops',
      'Local Recommendations',
    ],
    excluded: [
      'Entrance Fees',
      'Meals',
      'Drinks',
      'Personal Purchases',
      'Optional Gratuities',
    ],
    perfect_for: [
      'Couples',
      'Families',
      'Friends',
      'Solo Travellers',
      'Cruise Ship Guests',
      'Business Travellers',
      'International Visitors',
    ],
    good_to_know: [
      'Comfortable walking shoes recommended.',
      'Bring a light jacket.',
      'Weather dependent viewpoints.',
      'Private experience — your group only.',
      'Suitable for all ages.',
      'Pickup available from hotels, Airbnbs, cruise terminals and selected Cape Town locations.',
    ],
    faqs: sharedFaqs('3–4 hours'),
    map_embed_url:
      'https://maps.google.com/maps?q=Bo-Kaap,+Cape+Town&t=&z=13&ie=UTF8&iwloc=&output=embed',
    seo_title: 'Cape Town City & Culture Experience | Khayr Cape Experiences',
    seo_description:
      'Private Cape Town city tour with Bo-Kaap, Signal Hill, historic landmarks, and hotel pickup. Book online with Khayr Cape Experiences.',
    seo_image: '/bo-kaap.jpg',
    pricing_notes:
      'Guest rate plus private vehicle fee selected during booking.',
    duration_label: '3–4 hours',
  },

  peninsula: {
    display_name: 'Cape Peninsula Experience',
    short_description:
      'Scenic coastal cliffs, Cape Point drama, and Atlantic beauty on a private peninsula journey.',
    hero_tagline:
      'Chapman’s Peak, Cape Point, and ocean vistas — privately guided at your pace.',
    detailed_description:
      'The Cape Peninsula Experience is for guests who want the coastline’s signature drama without the rush of a crowded coach. Travel privately along Chapman’s Peak, stand at Cape Point, and enjoy flexible photo stops where the Atlantic meets dramatic cliffs.\n\nYour registered guide shapes the day around your energy — ideal for couples, families, and visitors wanting a scenic, unhurried introduction to the peninsula. Pickup and drop-off are included, with a comfortable air-conditioned vehicle throughout.',
    hero_image: '/cape-point.jpg',
    gallery_images: [
      '/cape-point.jpg',
      '/campsbay.JPG',
      '/Table Mountain.jpg',
      '/bo-kaap.jpg',
    ],
    timeline: [
      {
        title: 'Pickup',
        description:
          'Collection from your hotel, Airbnb, cruise terminal, or preferred Cape Town pickup point.',
        duration: '20–30 min',
        icon: 'pickup',
      },
      {
        title: "Chapman's Peak",
        description:
          'One of the world’s great coastal drives — sweeping ocean views and memorable photo stops.',
        duration: '30–40 min',
        icon: 'coast',
        image: '/campsbay.JPG',
      },
      {
        title: 'Cape Point',
        description:
          'Dramatic cliffs, lighthouse views, and time to explore at a comfortable pace.',
        duration: '60–90 min',
        icon: 'viewpoint',
        image: '/cape-point.jpg',
      },
      {
        title: 'Penguin Colony (Optional)',
        description:
          'Optional stop to see African penguins when timing and tickets allow.',
        duration: '30–45 min',
        icon: 'wildlife',
      },
      {
        title: 'Coastal Return',
        description:
          'Scenic return toward Cape Town with flexible coffee or viewpoint stops.',
        duration: '45–60 min',
        icon: 'coast',
      },
      {
        title: 'Return',
        description:
          'Drop-off at your hotel, Airbnb, cruise terminal, or original pickup location.',
        duration: '20–30 min',
        icon: 'return',
      },
    ],
    included: [
      'Private Transport',
      'Registered Professional Tourist Guide',
      'Air-Conditioned Vehicle',
      'Hotel / Airbnb Pickup & Drop-off',
      'Complimentary Bottled Water',
      'Flexible Itinerary',
      'Photography Stops',
      'Local Recommendations',
    ],
    excluded: [
      'Cape Point Entrance Fees',
      'Penguin Colony Tickets',
      'Meals',
      'Drinks',
      'Personal Purchases',
      'Optional Gratuities',
    ],
    perfect_for: [
      'Couples',
      'Families',
      'Friends',
      'Solo Travellers',
      'Cruise Ship Guests',
      'Photography Enthusiasts',
      'International Visitors',
    ],
    good_to_know: [
      'Comfortable walking shoes recommended.',
      'Bring a light jacket — Cape Point can be windy.',
      'Weather and traffic can affect timing.',
      'Private experience — your group only.',
      'Suitable for most ages; some walking at Cape Point.',
      'Pickup available from hotels, Airbnbs, cruise terminals and selected Cape Town locations.',
    ],
    faqs: sharedFaqs('3.5–4.5 hours (express) or longer by request'),
    map_embed_url:
      'https://maps.google.com/maps?q=Cape+Point,+South+Africa&t=&z=11&ie=UTF8&iwloc=&output=embed',
    seo_title: 'Cape Peninsula Experience | Khayr Cape Experiences',
    seo_description:
      'Private Cape Peninsula tour with Chapman’s Peak and Cape Point. Flexible pacing, hotel pickup, and online booking.',
    seo_image: '/cape-point.jpg',
    pricing_notes:
      'Guest rate plus private vehicle fee selected during booking. Park fees extra.',
    duration_label: '3.5–4.5 hours',
  },

  sunset: {
    display_name: 'Ocean Sunset Experience',
    short_description:
      'Golden-hour Atlantic Seaboard views, Camps Bay light, and relaxed sunset photography.',
    hero_tagline:
      'Watch the Atlantic turn gold — a private late-afternoon coastal experience.',
    detailed_description:
      'The Ocean Sunset Experience is a shorter, atmospheric private outing along Cape Town’s Atlantic Seaboard. Designed for couples, friends, and cruise guests with limited time, it focuses on viewpoints, Camps Bay ambience, and unhurried photography as the light softens.\n\nYour guide times the route for the best available sunset conditions, while keeping the experience flexible and comfortable. No large groups — just a private vehicle, registered guide, and a memorable end to the day.',
    hero_image: '/campsbay.JPG',
    gallery_images: [
      '/campsbay.JPG',
      '/Table Mountain.jpg',
      '/bo-kaap.jpg',
      '/cape-point.jpg',
    ],
    timeline: [
      {
        title: 'Pickup',
        description:
          'Afternoon collection from your hotel, Airbnb, cruise terminal, or preferred location.',
        duration: '15–20 min',
        icon: 'pickup',
      },
      {
        title: 'Atlantic Seaboard',
        description:
          'Scenic drive along the coastline with stops for views and photographs.',
        duration: '30–40 min',
        icon: 'coast',
        image: '/campsbay.JPG',
      },
      {
        title: 'Camps Bay & Sunset Viewpoints',
        description:
          'Golden-hour light over Camps Bay and nearby viewpoints — timed for atmosphere and photography.',
        duration: '45–60 min',
        icon: 'sunset',
        image: '/Table Mountain.jpg',
      },
      {
        title: 'Optional Coffee Stop',
        description:
          'Optional short pause for coffee or a harbour moment before returning.',
        duration: '20–30 min',
        icon: 'cafe',
      },
      {
        title: 'Return',
        description:
          'Drop-off at your accommodation, cruise terminal, or original pickup point.',
        duration: '15–20 min',
        icon: 'return',
      },
    ],
    included: [
      'Private Transport',
      'Registered Professional Tourist Guide',
      'Air-Conditioned Vehicle',
      'Hotel / Airbnb Pickup & Drop-off',
      'Complimentary Bottled Water',
      'Flexible Itinerary',
      'Photography Stops',
      'Local Recommendations',
    ],
    excluded: [
      'Entrance Fees',
      'Meals',
      'Drinks',
      'Personal Purchases',
      'Optional Gratuities',
    ],
    perfect_for: [
      'Couples',
      'Friends',
      'Solo Travellers',
      'Cruise Ship Guests',
      'Honeymooners',
      'International Visitors',
    ],
    good_to_know: [
      'Bring a light jacket for evening breeze.',
      'Sunset timing varies by season.',
      'Weather dependent viewpoints.',
      'Private experience — your group only.',
      'Suitable for all ages.',
      'Pickup available from hotels, Airbnbs, cruise terminals and selected Cape Town locations.',
    ],
    faqs: sharedFaqs('2–3 hours'),
    map_embed_url:
      'https://maps.google.com/maps?q=Camps+Bay,+Cape+Town&t=&z=13&ie=UTF8&iwloc=&output=embed',
    seo_title: 'Ocean Sunset Experience | Khayr Cape Experiences',
    seo_description:
      'Private Atlantic Seaboard sunset experience in Cape Town with Camps Bay viewpoints and hotel pickup.',
    seo_image: '/campsbay.JPG',
    pricing_notes:
      'Guest rate plus private vehicle fee selected during booking.',
    duration_label: '2–3 hours',
  },

  winelands: {
    display_name: 'Halal-Friendly Winelands Experience',
    short_description:
      'Scenic Stellenbosch and Franschhoek landscapes with halal-aware pacing and private comfort.',
    hero_tagline:
      'Mountain valleys, vineyard scenery, and flexible halal-friendly stops — privately guided.',
    detailed_description:
      'This private winelands experience focuses on scenery, culture, and comfortable pacing rather than rushed tasting rooms. Ideal for Muslim-friendly travellers, families, and guests who want beautiful landscapes with thoughtful stop recommendations.\n\nYour registered guide shares local insight across Stellenbosch / Franschhoek vistas while adapting the day to your preferences. Every Khayr Cape Experience remains private and personalised — no shared groups, with hotel or Airbnb pickup and an air-conditioned vehicle throughout.',
    hero_image: '/winelands.jpg',
    gallery_images: [
      '/winelands.jpg',
      '/cape-point.jpg',
      '/bo-kaap.jpg',
      '/campsbay.JPG',
    ],
    timeline: [
      {
        title: 'Pickup',
        description:
          'Morning collection from your hotel, Airbnb, or preferred Cape Town location.',
        duration: '30–45 min',
        icon: 'pickup',
      },
      {
        title: 'Winelands Arrival',
        description:
          'Enter the mountain valleys with scenic viewpoints and photography stops.',
        duration: '30–40 min',
        icon: 'viewpoint',
        image: '/winelands.jpg',
      },
      {
        title: 'Stellenbosch / Franschhoek Highlights',
        description:
          'Guided scenic exploration with flexible cultural and landscape stops suited to your group.',
        duration: '2–3 hours',
        icon: 'culture',
      },
      {
        title: 'Halal-Friendly Pause',
        description:
          'Time for a halal-aware meal or refreshment stop based on availability and preference.',
        duration: '45–60 min',
        icon: 'cafe',
      },
      {
        title: 'Scenic Return',
        description:
          'Relaxed drive back toward Cape Town with optional final viewpoint stops.',
        duration: '45–60 min',
        icon: 'coast',
      },
      {
        title: 'Return',
        description:
          'Drop-off at your hotel, Airbnb, cruise terminal, or original pickup location.',
        duration: '30–45 min',
        icon: 'return',
      },
    ],
    included: [
      'Private Transport',
      'Registered Professional Tourist Guide',
      'Air-Conditioned Vehicle',
      'Hotel / Airbnb Pickup & Drop-off',
      'Complimentary Bottled Water',
      'Flexible Itinerary',
      'Photography Stops',
      'Halal-Aware Local Recommendations',
    ],
    excluded: [
      'Wine Tastings',
      'Entrance Fees',
      'Meals',
      'Drinks',
      'Personal Purchases',
      'Optional Gratuities',
    ],
    perfect_for: [
      'Families',
      'Couples',
      'Friends',
      'Muslim-Friendly Travellers',
      'International Visitors',
      'Business Travellers',
    ],
    good_to_know: [
      'Comfortable walking shoes recommended.',
      'Bring a light jacket.',
      'Weather dependent scenic stops.',
      'Private experience — your group only.',
      'Suitable for all ages.',
      'Pickup available from hotels, Airbnbs, cruise terminals and selected Cape Town locations.',
      'Halal dining options depend on day and availability — your guide will advise.',
    ],
    faqs: sharedFaqs('5–6 hours'),
    map_embed_url:
      'https://maps.google.com/maps?q=Stellenbosch+Winelands&t=&z=11&ie=UTF8&iwloc=&output=embed',
    seo_title: 'Halal-Friendly Winelands Experience | Khayr Cape Experiences',
    seo_description:
      'Private Stellenbosch and Franschhoek winelands experience with halal-aware options, hotel pickup, and flexible pacing.',
    seo_image: '/winelands.jpg',
    pricing_notes:
      'Guest rate plus private vehicle fee selected during booking.',
    duration_label: '5–6 hours',
  },
}

export function getDefaultExperience(slug: string): ExperienceContent | null {
  return EXPERIENCE_DEFAULTS[slug] || null
}

export function mergeExperienceContent(
  slug: string,
  override?: Partial<ExperienceContent> | null
): ExperienceContent | null {
  const base = getDefaultExperience(slug)
  if (!base && !override) return null
  if (!base) {
    return {
      display_name: override?.display_name || 'Experience',
      short_description: override?.short_description || '',
      hero_tagline: override?.hero_tagline || '',
      detailed_description: override?.detailed_description || '',
      hero_image: override?.hero_image || '',
      gallery_images: override?.gallery_images || [],
      timeline: override?.timeline || [],
      included: override?.included || [],
      excluded: override?.excluded || [],
      perfect_for: override?.perfect_for || [],
      good_to_know: override?.good_to_know || [],
      faqs: override?.faqs || [],
      map_embed_url: override?.map_embed_url || '',
      seo_title: override?.seo_title || '',
      seo_description: override?.seo_description || '',
      seo_image: override?.seo_image || '',
      pricing_notes: override?.pricing_notes || '',
      duration_label: override?.duration_label || '',
    }
  }
  if (!override) return base
  return {
    ...base,
    ...override,
    gallery_images: override.gallery_images?.length
      ? override.gallery_images
      : base.gallery_images,
    timeline: override.timeline?.length ? override.timeline : base.timeline,
    included: override.included?.length ? override.included : base.included,
    excluded: override.excluded?.length ? override.excluded : base.excluded,
    perfect_for: override.perfect_for?.length
      ? override.perfect_for
      : base.perfect_for,
    good_to_know: override.good_to_know?.length
      ? override.good_to_know
      : base.good_to_know,
    faqs: override.faqs?.length ? override.faqs : base.faqs,
  }
}
