export type Tour = {
  id: string
  title: string
  briefDescription: string
  fullDescription: string
  itinerary: string[]
  duration: string
  price: string
  image: string
}

export const tours: Tour[] = [
  {
    id: 'cape-peninsula',
    title: 'Cape Peninsula Private Tour (Half-Day)',
    briefDescription: 'Scenic drive along the peninsula with iconic views, beaches, and optional penguin colony visit.',
    fullDescription: "Experience the best of the Cape Peninsula on this relaxed half-day private tour. Travel in comfort with your own guide along one of the world's most scenic coastlines. Take in dramatic cliffs, pristine beaches, and optional visits to the famous penguin colony at Boulders Beach. The pace is yours—we can stop for photos, refreshments, or simply to take in the view.",
    itinerary: [
      'Hotel or agreed pickup in Cape Town',
      'Scenic drive along the Atlantic seaboard (Sea Point, Clifton, Camps Bay)',
      'Optional stop at Boulders Beach penguin colony',
      'Cape Point Nature Reserve — dramatic cliffs and ocean views',
      'Optional visit to the Cape of Good Hope',
      "Chapman's Peak Drive (if time and route allow)",
      'Return to Cape Town with drop-off at your location',
    ],
    duration: 'Half-day (approx. 4–5 hours)',
    price: 'Price on request',
    image: '/cape-point.jpg',
  },
  {
    id: 'bo-kaap',
    title: 'Bo-Kaap & Cultural Heritage Tour',
    briefDescription: 'Explore the colourful Bo-Kaap and discover Cape Malay heritage and culture.',
    fullDescription: "Discover the history and culture of the Bo-Kaap, one of Cape Town's most distinctive neighbourhoods. Learn about Cape Malay heritage, the legacy of the area's residents, and the stories behind the famous colourful houses. This private tour is paced for you and can include walking, photo stops, and optional visits to a local spice shop or museum.",
    itinerary: [
      'Hotel or agreed pickup in Cape Town',
      'Introduction to Bo-Kaap and its history',
      'Walking through the colourful streets with photo opportunities',
      'Visit to the Bo-Kaap Museum (if open and of interest)',
      'Optional stop at a local spice or craft shop',
      'View of Table Mountain and city from the district',
      'Return to your accommodation or drop-off in the city',
    ],
    duration: 'Half-day (approx. 3–4 hours)',
    price: 'Price on request',
    image: '/bo-kaap.jpg',
  },
  {
    id: 'winelands',
    title: 'Cape Winelands Tour (Halal-friendly options)',
    briefDescription: 'Visit the winelands with halal-friendly stops and scenic drives. Family-friendly and flexible.',
    fullDescription: 'Enjoy a full-day private tour of the Cape Winelands with a focus on halal-friendly options and non-alcoholic experiences. Take in the mountains and vineyards, with stops for scenery, lunch (halal where possible), and optional activities such as grape juice tastings or farm visits. The itinerary is flexible to suit your preferences and pace.',
    itinerary: [
      'Hotel or agreed pickup in Cape Town',
      'Scenic drive to the Winelands (Stellenbosch, Franschhoek, or Paarl)',
      'Mountain and vineyard views with photo stops',
      'Halal-friendly lunch stop (we can suggest options in advance)',
      'Optional: non-alcoholic grape juice or tea tastings at a farm',
      'Optional: stroll through a historic town or garden',
      'Return to Cape Town with drop-off at your location',
    ],
    duration: 'Full day (approx. 6–8 hours)',
    price: 'Price on request',
    image: '/winelands.jpg',
  },
]
