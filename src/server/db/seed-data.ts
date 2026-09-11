/**
 * Eventora — DEMO / SEED DATASET
 * ==============================
 *
 * ⚠️  EVERYTHING IN THIS FILE IS FICTIONAL DEMONSTRATION DATA.
 *
 * The countries, cities and venues are real places, but every event listing,
 * price, schedule, capacity, review and user account below was written for this
 * project. Eventora does not integrate with any ticketing provider and makes no
 * claim to represent real availability. No data here was scraped from, or is
 * synchronised with, any third-party service.
 *
 * The dataset exists so that `npm run db:seed` produces an application that
 * looks and behaves like a finished product on first run.
 */

import type { Motif } from '@/lib/covers';

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

export interface SeedCategory {
  name: string;
  slug: string;
  /** lucide-react icon name */
  icon: string;
  motif: Motif;
  description: string;
}

export interface SeedVenue {
  name: string;
  address: string;
  latitude: number;
  longitude: number;
}

export interface SeedEvent {
  title: string;
  /** category slug */
  category: string;
  /** index into the parent city's `venues` array */
  venue: number;
  /** price in MAJOR units of the country's currency */
  price: number;
  durationMinutes: number;
  minAge?: number;
  featured?: boolean;
  tags: string[];
  summary: string;
  description: string;
}

export interface SeedCity {
  name: string;
  slug: string;
  timezone: string;
  latitude: number;
  longitude: number;
  blurb: string;
  venues: SeedVenue[];
  events: SeedEvent[];
}

export interface SeedCountry {
  name: string;
  code: string;
  slug: string;
  currency: string;
  flagEmoji: string;
  cities: SeedCity[];
}

/* -------------------------------------------------------------------------- */
/* Categories                                                                 */
/* -------------------------------------------------------------------------- */

export const CATEGORIES: SeedCategory[] = [
  {
    name: 'Entertainment',
    slug: 'entertainment',
    icon: 'Sparkles',
    motif: 'entertainment',
    description: 'Shows, comedy, theatre and nightlife you can book in an evening.',
  },
  {
    name: 'Concerts & Live Music',
    slug: 'concerts',
    icon: 'Music',
    motif: 'concerts',
    description: 'Arena tours, intimate gigs and open-air sessions.',
  },
  {
    name: 'Outdoor Activities',
    slug: 'outdoor',
    icon: 'Mountain',
    motif: 'outdoor',
    description: 'Hikes, deserts, trails and everything under open sky.',
  },
  {
    name: 'Marine Activities',
    slug: 'marine',
    icon: 'Waves',
    motif: 'marine',
    description: 'Sailing, diving, paddling and days spent on the water.',
  },
  {
    name: 'Cultural',
    slug: 'cultural',
    icon: 'Landmark',
    motif: 'cultural',
    description: 'Museums, heritage sites and guided walks through a city’s history.',
  },
  {
    name: 'Sports',
    slug: 'sports',
    icon: 'Trophy',
    motif: 'sports',
    description: 'Matchdays, track time, courts and competitive fixtures.',
  },
  {
    name: 'Experiences',
    slug: 'experiences',
    icon: 'Compass',
    motif: 'experiences',
    description: 'Food trails, viewpoints and one-off things you tell people about.',
  },
  {
    name: 'Workshops & Sessions',
    slug: 'workshops',
    icon: 'Palette',
    motif: 'workshops',
    description: 'Hands-on classes led by people who do it for a living.',
  },
  {
    name: 'Family',
    slug: 'family',
    icon: 'Users',
    motif: 'family',
    description: 'Built for all ages, with the practical details up front.',
  },
  {
    name: 'Local Events',
    slug: 'local',
    icon: 'MapPin',
    motif: 'local',
    description: 'Markets, festivals and neighbourhood happenings.',
  },
];

/* -------------------------------------------------------------------------- */
/* Countries → cities → venues → events                                       */
/* -------------------------------------------------------------------------- */

export const COUNTRIES: SeedCountry[] = [
  /* ======================================================================== */
  {
    name: 'Kuwait',
    code: 'KW',
    slug: 'kuwait',
    currency: 'KWD',
    flagEmoji: '🇰🇼',
    cities: [
      {
        name: 'Kuwait City',
        slug: 'kuwait-city',
        timezone: 'Asia/Kuwait',
        latitude: 29.3759,
        longitude: 47.9774,
        blurb:
          'A Gulf capital where a restored 18th-century souq sits ten minutes from a waterfront of glass towers — and most of what is worth doing happens after sunset.',
        venues: [
          {
            name: 'Marina Crescent Amphitheatre',
            address: 'Marina Crescent, Arabian Gulf Street, Salmiya-side waterfront',
            latitude: 29.3405,
            longitude: 48.0664,
          },
          {
            name: 'Al Shaheed Park',
            address: 'Soor Street, Al Sharq, Kuwait City',
            latitude: 29.3667,
            longitude: 47.9908,
          },
          {
            name: 'Souq Sharq Marina',
            address: 'Arabian Gulf Street, Sharq, Kuwait City',
            latitude: 29.3846,
            longitude: 48.0004,
          },
          {
            name: 'Sadu House',
            address: 'Arabian Gulf Street, Qibla, Kuwait City',
            latitude: 29.3729,
            longitude: 47.9905,
          },
          {
            name: 'Kabd Nature Reserve',
            address: 'Kabd, Al Farwaniyah Governorate',
            latitude: 29.0806,
            longitude: 47.6,
          },
          {
            name: 'Souq Al Mubarakiya',
            address: 'Abdullah Al Salem Street, Qibla, Kuwait City',
            latitude: 29.3775,
            longitude: 47.9825,
          },
          {
            name: 'The Scientific Center',
            address: 'Arabian Gulf Street, Salmiya',
            latitude: 29.3477,
            longitude: 48.0752,
          },
        ],
        events: [
          {
            title: 'Marina Waves: Arabic Indie Night',
            category: 'concerts',
            venue: 0,
            price: 12,
            durationMinutes: 180,
            featured: true,
            tags: ['live music', 'outdoor', 'evening'],
            summary:
              'Four Gulf indie acts on an open-air stage with the marina behind them, running from sunset until late.',
            description:
              'A standing show on the Marina Crescent terrace, programmed around the region’s newer Arabic-language indie and alternative acts rather than the arena circuit. Doors open an hour before the first set so you can eat along the crescent first; the stage faces the water, so arrive early if you want the rail. Sound curfew is midnight and the show runs regardless of weather unless the venue announces otherwise.',
          },
          {
            title: 'Al Shaheed Park Night Walk & Museum Tour',
            category: 'cultural',
            venue: 1,
            price: 6,
            durationMinutes: 120,
            tags: ['guided', 'museum', 'walking'],
            summary:
              'A guided evening loop of the park’s memorial gardens, ending inside the Habitat and Memorial museums.',
            description:
              'Kuwait’s largest urban park was built over the old city wall line, and this walk uses that as its thread — from the surviving gate through the planted terraces to the two underground museums. The guide covers the 1961 wall demolition, the invasion-era memorial and the park’s ecology in roughly equal measure. Paths are paved and step-free throughout.',
          },
          {
            title: 'Failaka Island Heritage Day Trip',
            category: 'experiences',
            venue: 2,
            price: 28,
            durationMinutes: 480,
            featured: true,
            tags: ['island', 'day trip', 'ferry', 'archaeology'],
            summary:
              'Ferry out to Failaka for the Hellenistic ruins, the abandoned village and lunch by the shore.',
            description:
              'A full-day crossing to the island that holds Kuwait’s only Greek-era settlement, the temple site at Ikaros, and a village left largely as it was in 1990. The price covers the return ferry, ground transport on the island and a seated lunch. Bring a hat and closed shoes — most of the walking is on unshaded, uneven ground.',
          },
          {
            title: 'Kuwait Bay Sunset Dhow Cruise',
            category: 'marine',
            venue: 2,
            price: 18,
            durationMinutes: 150,
            featured: true,
            tags: ['sunset', 'boat', 'skyline'],
            summary:
              'Two and a half hours on a restored wooden dhow, timed so the towers light up as you turn back.',
            description:
              'The boat leaves Souq Sharq an hour before sunset, runs out past the Kuwait Towers and the Green Island breakwater, then holds position in the bay for the light. Arabic coffee, dates and a cold mezze are served on the upper deck. Capacity is deliberately kept below the vessel limit so everyone gets a seat with a view.',
          },
          {
            title: 'Sadu House Weaving Workshop',
            category: 'workshops',
            venue: 3,
            price: 15,
            durationMinutes: 180,
            tags: ['craft', 'heritage', 'small group'],
            summary:
              'Learn the Bedouin al-Sadu warp-faced weave from resident artisans, and leave with the piece you made.',
            description:
              'Al-Sadu is on UNESCO’s intangible heritage list, and this session is taught inside the courtyard house that has documented it since 1980. You will be shown the loom setup, the geometric motif vocabulary and what each pattern traditionally signified, then work a small band of your own. All materials are included and no prior experience is assumed.',
          },
          {
            title: 'Desert Stargazing at Kabd Reserve',
            category: 'outdoor',
            venue: 4,
            price: 14,
            durationMinutes: 240,
            tags: ['astronomy', 'desert', 'night'],
            summary:
              'A dark-sky night an hour from the city, with telescopes, a guide and a fire to sit around.',
            description:
              'Kabd is one of the few protected areas close enough to Kuwait City to reach after work and dark enough to see the Milky Way from. Two Dobsonian telescopes are set up for the session and the guide works through what is actually visible that night rather than a fixed script. Transport from a central meeting point is included; desert nights drop sharply, so bring a jacket.',
          },
          {
            title: 'Grand Mosque Guided Architecture Tour',
            category: 'cultural',
            venue: 5,
            price: 0,
            durationMinutes: 90,
            tags: ['free', 'architecture', 'guided'],
            summary:
              'A free official tour of the state mosque, covering the calligraphy programme and the 21-metre dome.',
            description:
              'Run by the mosque’s own visitor department, this walk-through covers the main prayer hall, the Amiri suite and the courtyard, with attention to the Andalusian-influenced plasterwork and the Kufic inscription band. Modest dress is required and abayas are provided at the door. Booking is free but a place must be reserved because group sizes are capped.',
          },
          {
            title: 'Indoor Karting Grand Prix',
            category: 'sports',
            venue: 6,
            price: 22,
            durationMinutes: 90,
            minAge: 14,
            tags: ['racing', 'competitive', 'indoor'],
            summary:
              'A timed three-heat race format on an indoor circuit, with qualifying, final and a podium.',
            description:
              'Not an open session — you are entered into a structured grid with practice, qualifying and a fifteen-lap final scored across the field. Karts are electric and speed-limited by class, and full safety equipment is provided. Minimum height 150 cm; closed shoes required.',
          },
          {
            title: 'Family Day at the Scientific Center',
            category: 'family',
            venue: 6,
            price: 9,
            durationMinutes: 300,
            tags: ['aquarium', 'kids', 'indoor'],
            summary:
              'Aquarium, discovery hall and an IMAX screening on one ticket, valid for the whole day.',
            description:
              'The Gulf’s largest aquarium is arranged as three biomes — desert, coastal and open sea — and this ticket covers all of them plus the hands-on Discovery Place and one large-format film. Strollers are fine throughout and there is a quiet room off the main hall. Peak crowding is between 16:00 and 19:00 on weekends.',
          },
          {
            title: 'Mubarakiya Food Trail',
            category: 'experiences',
            venue: 5,
            price: 20,
            durationMinutes: 180,
            featured: true,
            tags: ['food', 'walking', 'souq'],
            summary:
              'Eight tastings through the old souq, from machboos to the spice lanes and a final tea stop.',
            description:
              'A walking tour of Kuwait’s oldest market led by someone who buys there weekly, stopping at a working bakery, the dates and nuts row, a seventy-year-old grill house and the fish market at the far end. Portions add up to a full meal, and dietary requirements can be handled if you note them at booking. Evenings are cooler and the souq is busier — which is the point.',
          },
        ],
      },
      {
        name: 'Salmiya',
        slug: 'salmiya',
        timezone: 'Asia/Kuwait',
        latitude: 29.3339,
        longitude: 48.0757,
        blurb:
          'Kuwait’s densest waterfront district — a long corniche, the country’s biggest aquarium, and more places to eat per block than anywhere else in the Gulf.',
        venues: [
          {
            name: 'Salmiya Corniche',
            address: 'Arabian Gulf Street, Salmiya',
            latitude: 29.3405,
            longitude: 48.0664,
          },
          {
            name: 'Marina Mall Rooftop',
            address: 'Marina Mall, Arabian Gulf Street, Salmiya',
            latitude: 29.3419,
            longitude: 48.0679,
          },
          {
            name: 'Al Bida’a Beach',
            address: 'Al Bida’a, Salmiya waterfront',
            latitude: 29.3213,
            longitude: 48.0894,
          },
        ],
        events: [
          {
            title: 'Corniche Sunrise Yoga',
            category: 'outdoor',
            venue: 0,
            price: 5,
            durationMinutes: 60,
            tags: ['wellness', 'sunrise', 'beginner friendly'],
            summary:
              'A 45-minute vinyasa flow on the grass strip facing the Gulf, finishing before the heat arrives.',
            description:
              'Held at first light on the shaded lawn section of the corniche, with mats available if you would rather not carry one. The sequence is deliberately accessible — every posture is offered with a seated or standing alternative. Sessions run year-round and move indoors to a nearby studio only in sandstorm conditions.',
          },
          {
            title: 'Rooftop Comedy Night',
            category: 'entertainment',
            venue: 1,
            price: 11,
            durationMinutes: 120,
            minAge: 16,
            tags: ['comedy', 'nightlife', 'english'],
            summary:
              'Four stand-ups on a rooftop stage — a regional headliner plus three shorter opening sets.',
            description:
              'An English-language night that leans on the Gulf’s growing circuit rather than flying in a single name. Seating is cabaret-style and unreserved, so early arrivals get the front. Material is aimed at an adult audience; the venue enforces a 16+ door policy.',
          },
          {
            title: 'Aquarium Behind-the-Scenes',
            category: 'family',
            venue: 0,
            price: 16,
            durationMinutes: 120,
            tags: ['kids', 'educational', 'small group'],
            summary:
              'Go above the tanks with a marine biologist — feed prep, quarantine pools and the filtration deck.',
            description:
              'A small-group tour of the working side of the aquarium that visitors never see: the food kitchen, the reserve tanks and the life-support plant that keeps 100+ species alive. The biologist leading it answers questions the whole way, which children tend to have a lot of. Groups are capped at twelve and closed shoes are required on the service decks.',
          },
          {
            title: 'Kite Surfing Beginner Session',
            category: 'marine',
            venue: 2,
            price: 32,
            durationMinutes: 180,
            minAge: 12,
            tags: ['watersports', 'lesson', 'equipment included'],
            summary:
              'A first three-hour lesson covering kite control, water relaunch and body dragging.',
            description:
              'Kuwait’s shallow, flat-water bay is close to ideal for learning, and this session uses a trainer kite on the beach before anything goes on the water. Equipment, harness and impact vest are all provided. You need to be a confident swimmer; the instructor ratio is one to two.',
          },
        ],
      },
      {
        name: 'Al Ahmadi',
        slug: 'al-ahmadi',
        timezone: 'Asia/Kuwait',
        latitude: 29.0769,
        longitude: 48.0838,
        blurb:
          'A purpose-built oil town from the 1940s with British garden-city street planning — and the open desert starting where the hedges stop.',
        venues: [
          {
            name: 'Kuwait Oil Company Heritage Museum',
            address: 'Ahmadi Township, Al Ahmadi',
            latitude: 29.0776,
            longitude: 48.0823,
          },
          {
            name: 'Ahmadi Public Gardens',
            address: 'Mid Ahmadi, Al Ahmadi',
            latitude: 29.0805,
            longitude: 48.0759,
          },
          {
            name: 'Wafra Desert Camp',
            address: 'Wafra Road, southern desert',
            latitude: 28.6392,
            longitude: 47.9314,
          },
        ],
        events: [
          {
            title: 'Oil Heritage Museum Guided Visit',
            category: 'cultural',
            venue: 0,
            price: 4,
            durationMinutes: 90,
            tags: ['museum', 'industrial history', 'guided'],
            summary:
              'The story of the Burgan field and how a company town reshaped a country, told in one hour.',
            description:
              'A guided run through the exhibition covering the 1938 discovery, the drilling technology of the period and the 1991 well fires. The guides are frequently retired company engineers, which makes the technical rooms considerably more interesting than the labels alone. Photography is permitted except in the archive room.',
          },
          {
            title: 'Ahmadi Gardens Photography Walk',
            category: 'outdoor',
            venue: 1,
            price: 8,
            durationMinutes: 150,
            tags: ['photography', 'golden hour', 'beginner friendly'],
            summary:
              'A late-afternoon walk through the mid-century township with a photographer, ending at golden hour.',
            description:
              'Ahmadi’s low bungalows, hedged avenues and 1950s signage make it the most photogenic townscape in Kuwait, and this walk works through composition, light and street etiquette as it goes. Any camera works, phone included. The route is roughly three kilometres on flat pavement.',
          },
          {
            title: 'Desert 4x4 Dune Experience',
            category: 'outdoor',
            venue: 2,
            price: 26,
            durationMinutes: 300,
            minAge: 8,
            featured: true,
            tags: ['4x4', 'desert', 'dinner included'],
            summary:
              'Dune driving in the southern desert with a licensed guide, then dinner at a permanent camp.',
            description:
              'Vehicles run in a convoy with a lead and sweep driver, on a route chosen for the day’s sand conditions rather than a fixed track. The camp stop includes a grilled dinner, Arabic coffee and time by the fire once the light goes. Tyre pressure, recovery gear and a first-aid kit are carried by every vehicle.',
          },
        ],
      },
    ],
  },

  /* ======================================================================== */
  {
    name: 'United Arab Emirates',
    code: 'AE',
    slug: 'united-arab-emirates',
    currency: 'AED',
    flagEmoji: '🇦🇪',
    cities: [
      {
        name: 'Dubai',
        slug: 'dubai',
        timezone: 'Asia/Dubai',
        latitude: 25.2048,
        longitude: 55.2708,
        blurb:
          'The Gulf’s events capital — a creek-side old town, a desert an hour out, and a calendar that never really stops.',
        venues: [
          {
            name: 'Dubai Marina Yacht Club',
            address: 'Dubai Marina, Dubai',
            latitude: 25.0805,
            longitude: 55.1403,
          },
          {
            name: 'Al Marmoom Desert Conservation Reserve',
            address: 'Al Qudra Road, Dubai',
            latitude: 24.8,
            longitude: 55.4,
          },
          {
            name: 'Burj Khalifa — At The Top',
            address: '1 Sheikh Mohammed bin Rashid Blvd, Downtown Dubai',
            latitude: 25.1972,
            longitude: 55.2744,
          },
          {
            name: 'Alserkal Avenue',
            address: 'Street 8, Al Quoz 1, Dubai',
            latitude: 25.1417,
            longitude: 55.2295,
          },
          {
            name: 'Dubai Opera',
            address: 'Sheikh Mohammed bin Rashid Blvd, Downtown Dubai',
            latitude: 25.1949,
            longitude: 55.2721,
          },
          {
            name: 'Kite Beach',
            address: 'Jumeirah 3, Dubai',
            latitude: 25.1682,
            longitude: 55.2101,
          },
          {
            name: 'Dubai Creek — Deira Side',
            address: 'Baniyas Road, Deira, Dubai',
            latitude: 25.2653,
            longitude: 55.3094,
          },
          {
            name: 'Global Village',
            address: 'Sheikh Mohammed Bin Zayed Road, Dubai',
            latitude: 25.0697,
            longitude: 55.3095,
          },
        ],
        events: [
          {
            title: 'Marina Yacht Sunset Cruise',
            category: 'marine',
            venue: 0,
            price: 249,
            durationMinutes: 150,
            featured: true,
            tags: ['yacht', 'sunset', 'canapés'],
            summary:
              'A shared-charter sail out of the marina into open water, timed for the skyline at last light.',
            description:
              'A 55-foot cruiser leaves the yacht club two hours before sunset, runs past Ain Dubai and the Palm’s western crescent, then holds offshore for the light. Canapés and soft drinks are included and there is space to swim off the stern platform on calm evenings. Shared boarding means you are on board with other guests, not a private charter.',
          },
          {
            title: 'Desert Safari with Bedouin Dinner',
            category: 'outdoor',
            venue: 1,
            price: 195,
            durationMinutes: 360,
            featured: true,
            tags: ['desert', 'dinner', 'hotel pickup'],
            summary:
              'Afternoon dune drive through a conservation reserve, then a camp dinner under the stars.',
            description:
              'This one runs inside Al Marmoom, a protected reserve, which means a lower vehicle density and actual wildlife — oryx and gazelle are routinely seen on the drive in. The camp evening covers a grilled buffet, falconry demonstration and live music, with the option to skip the dune bashing if motion sickness is a concern. Hotel pickup across Dubai is included.',
          },
          {
            title: 'Burj Khalifa Sky Level Access',
            category: 'experiences',
            venue: 2,
            price: 379,
            durationMinutes: 90,
            tags: ['viewpoint', 'skip the line', 'indoor'],
            summary: 'Levels 124, 125 and the Sky lounge on 148, with a timed entry slot.',
            description:
              'A timed ticket to the observation decks including the 555-metre Sky level, which is a separate lift and a considerably quieter floor than the ones below. Sunset slots sell out earliest and carry a premium; the last hour before closing is the calmest. Entry is from the lower ground of Dubai Mall.',
          },
          {
            title: 'Alserkal Avenue Gallery Night',
            category: 'cultural',
            venue: 3,
            price: 0,
            durationMinutes: 180,
            tags: ['free', 'art', 'galleries'],
            summary:
              'A free evening walk through the warehouse arts district, taking in five current shows.',
            description:
              'Alserkal is a converted marble factory compound that now holds most of the city’s serious contemporary galleries. On these evenings the spaces stay open late, several with the artist present, and this booking simply reserves you a place on the guided loop between them. No art background is assumed and there is nothing to buy.',
          },
          {
            title: 'Dubai Opera: Classical Arabian Nights',
            category: 'concerts',
            venue: 4,
            price: 320,
            durationMinutes: 135,
            tags: ['orchestra', 'seated', 'formal'],
            summary:
              'A full orchestral programme of Arabic classical repertoire, arranged for a Western symphony ensemble.',
            description:
              'A seated evening in the dhow-shaped hall, pairing Mohammed Abdel Wahab and Riad Al Sunbati arrangements with a contemporary Emirati commission in the second half. Reserved seating by tier; the price shown is for the grand tier. Doors close at the bell and latecomers are seated only at the interval.',
          },
          {
            title: 'Kite Beach Sunrise Paddleboard',
            category: 'marine',
            venue: 5,
            price: 120,
            durationMinutes: 90,
            tags: ['paddleboard', 'sunrise', 'beginner friendly'],
            summary:
              'A guided dawn paddle along the Jumeirah shoreline with the Burj Al Arab in view the whole way.',
            description:
              'The water is flattest and the beach emptiest in the first hour after sunrise, which is when this runs. Boards, paddles and leashes are provided, and the guide covers stance and turning on the sand before you go out. You should be comfortable swimming in open water; the route stays within the marked swimming zone.',
          },
          {
            title: 'Old Dubai Creek Food Walk',
            category: 'experiences',
            venue: 6,
            price: 165,
            durationMinutes: 210,
            featured: true,
            tags: ['food', 'abra crossing', 'walking'],
            summary:
              'Seven tastings across Deira and Bur Dubai, with a traditional abra crossing in the middle.',
            description:
              'Starts in the spice and gold souqs, crosses the creek by wooden abra for one dirham, and finishes in the Iranian and South Indian kitchens of Bur Dubai. Portions are generous enough to replace dinner. The route is about two and a half kilometres, mostly flat, with a lot of standing.',
          },
          {
            title: 'Indoor Skydiving Flight',
            category: 'sports',
            venue: 7,
            price: 240,
            durationMinutes: 75,
            minAge: 5,
            tags: ['adrenaline', 'indoor', 'instructor led'],
            summary:
              'Two one-minute flights in a vertical wind tunnel, with gear and instruction included.',
            description:
              'Each flight is roughly the free-fall time of a real skydive, in a glass tunnel with an instructor in the airflow with you throughout. The session covers a briefing, kit-up, both flights and a debrief. Weight and health restrictions apply and are listed at check-in.',
          },
          {
            title: 'Global Village Family Pass',
            category: 'family',
            venue: 7,
            price: 25,
            durationMinutes: 300,
            tags: ['kids', 'markets', 'seasonal'],
            summary:
              'Entry to the seasonal culture park — 27 country pavilions, street food and nightly shows.',
            description:
              'A single entry ticket covering all pavilions, the stunt arena and the main stage programme, valid for the whole evening. Rides and food are paid separately inside. Weeknights are markedly quieter than Thursday to Saturday; the park runs October to April only.',
          },
          {
            title: 'Arabic Calligraphy Masterclass',
            category: 'workshops',
            venue: 3,
            price: 180,
            durationMinutes: 150,
            tags: ['craft', 'small group', 'materials included'],
            summary:
              'Learn the Diwani script from a working calligrapher, and leave with a finished piece.',
            description:
              'A studio session covering the qalam reed pen, ink preparation and the proportional system that governs Arabic letterforms, worked through the Diwani hand. You will write your own name and one short phrase on archival paper to take away. No Arabic reading ability is needed — the class is taught bilingually.',
          },
          {
            title: 'Comedy at The Junction',
            category: 'entertainment',
            venue: 3,
            price: 95,
            durationMinutes: 120,
            minAge: 18,
            tags: ['comedy', 'black box', 'english'],
            summary:
              'A 100-seat black-box room, four comics, and material that would not survive a bigger venue.',
            description:
              'The Junction is Dubai’s independent fringe theatre, and its comedy nights run closer to the bone than the hotel circuit does. Unreserved seating, bar open before and after, no photography during sets. Strictly 18+.',
          },
        ],
      },
      {
        name: 'Abu Dhabi',
        slug: 'abu-dhabi',
        timezone: 'Asia/Dubai',
        latitude: 24.4539,
        longitude: 54.3773,
        blurb:
          'The federal capital — museum-quarter ambitions on Saadiyat, a Formula 1 circuit on Yas, and mangrove channels you can paddle at dawn.',
        venues: [
          {
            name: 'Louvre Abu Dhabi',
            address: 'Saadiyat Cultural District, Abu Dhabi',
            latitude: 24.5339,
            longitude: 54.3981,
          },
          {
            name: 'Yas Marina Circuit',
            address: 'Yas Island, Abu Dhabi',
            latitude: 24.4672,
            longitude: 54.6031,
          },
          {
            name: 'Eastern Mangroves',
            address: 'Eastern Mangroves Promenade, Abu Dhabi',
            latitude: 24.4477,
            longitude: 54.4363,
          },
          {
            name: 'Corniche Beach',
            address: 'Corniche Road, Abu Dhabi',
            latitude: 24.4764,
            longitude: 54.3313,
          },
          {
            name: 'Qasr Al Hosn',
            address: 'Al Hosn, Sheikh Rashid Bin Saeed Street, Abu Dhabi',
            latitude: 24.4816,
            longitude: 54.3547,
          },
        ],
        events: [
          {
            title: 'Louvre Abu Dhabi Curator Tour',
            category: 'cultural',
            venue: 0,
            price: 130,
            durationMinutes: 120,
            featured: true,
            tags: ['museum', 'guided', 'architecture'],
            summary:
              'A curator-led route through the chronological galleries, plus time under the dome.',
            description:
              'The museum is hung chronologically rather than by civilisation, which is the whole argument of the building — and this tour follows that thread from the earliest funerary objects to the modern rooms. It ends outside under Jean Nouvel’s 7,850-tonne dome for the "rain of light" effect, best in the last two hours of daylight. Entry is included.',
          },
          {
            title: 'Yas Marina Circuit Track Day',
            category: 'sports',
            venue: 1,
            price: 550,
            durationMinutes: 180,
            minAge: 18,
            tags: ['motorsport', 'driving', 'licence required'],
            summary:
              'Drive the F1 layout yourself in a prepared performance car, with an instructor alongside.',
            description:
              'Sessions run on the full 5.28 km Grand Prix configuration under circuit control, with a classroom briefing, sighting laps and three timed runs. An instructor is in the passenger seat throughout. A valid manual or automatic driving licence held for at least one year is required at check-in.',
          },
          {
            title: 'Mangrove Kayak Expedition',
            category: 'marine',
            venue: 2,
            price: 165,
            durationMinutes: 120,
            minAge: 10,
            tags: ['kayak', 'wildlife', 'guided'],
            summary:
              'Paddle the tidal channels of the national park at dawn, when the herons are feeding.',
            description:
              'The eastern mangroves are a protected wetland inside the city, and the narrow channels are only passable around high tide — which is why departure times shift daily. Sit-on-top kayaks, paddles and buoyancy aids are provided, and the guide is a trained naturalist. Expect flamingos in winter months and herons year-round.',
          },
          {
            title: 'Corniche Family Beach Festival',
            category: 'family',
            venue: 3,
            price: 40,
            durationMinutes: 300,
            tags: ['beach', 'kids', 'weekend'],
            summary:
              'Blue-flag beach access with a supervised kids’ zone, inflatables and evening entertainment.',
            description:
              'A day pass for the managed section of the Corniche with lifeguard cover, shaded seating and a fenced play area for under-tens. The afternoon programme includes sandcastle sessions and a small stage. Showers, changing rooms and a family prayer room are on site.',
          },
          {
            title: 'Qasr Al Hosn Storytelling Evening',
            category: 'cultural',
            venue: 4,
            price: 55,
            durationMinutes: 90,
            tags: ['heritage', 'evening', 'family friendly'],
            summary:
              'Oral histories of the fort and the pearl-diving economy, told in its own courtyard after dark.',
            description:
              'Abu Dhabi’s oldest standing building was a watchtower over the freshwater well before it was a palace, and this evening uses its courtyard for narrated oral history — pearl diving seasons, the collapse of the trade in the 1930s and what followed. Told in Arabic with English translation. Floor cushions and chairs are both available.',
          },
        ],
      },
      {
        name: 'Sharjah',
        slug: 'sharjah',
        timezone: 'Asia/Dubai',
        latitude: 25.3463,
        longitude: 55.4209,
        blurb:
          'The UAE’s cultural emirate — a serious art foundation, restored heritage quarters and a mountain coastline on the other side.',
        venues: [
          {
            name: 'Sharjah Art Foundation',
            address: 'Al Mureijah Square, Sharjah',
            latitude: 25.3573,
            longitude: 55.3856,
          },
          {
            name: 'Al Noor Island',
            address: 'Khalid Lagoon, Sharjah',
            latitude: 25.3323,
            longitude: 55.3833,
          },
          {
            name: 'Khor Fakkan Corniche',
            address: 'Khor Fakkan, East Coast',
            latitude: 25.3392,
            longitude: 56.3522,
          },
        ],
        events: [
          {
            title: 'Sharjah Art Foundation Walk',
            category: 'cultural',
            venue: 0,
            price: 0,
            durationMinutes: 120,
            tags: ['free', 'contemporary art', 'guided'],
            summary:
              'A free guided route through the foundation’s courtyard galleries and current commissions.',
            description:
              'The foundation occupies a block of restored and newly built houses around Al Mureijah Square, and the work inside is genuinely international — this is the organisation behind the Sharjah Biennial. The guide covers the current programme and the restoration approach in equal measure. Admission and the tour are both free; booking reserves the slot.',
          },
          {
            title: 'Al Noor Island Butterfly Evening',
            category: 'family',
            venue: 1,
            price: 50,
            durationMinutes: 120,
            tags: ['kids', 'gardens', 'evening'],
            summary:
              'The butterfly house and the illuminated sculpture park, on an island in the lagoon.',
            description:
              'A landscaped island reached by footbridge, holding a climate-controlled butterfly house with around 500 free-flying specimens plus a light-art trail that switches on at dusk. The loop is short and fully accessible. Butterflies are most active before sunset, so an early slot is worth it if that is the draw.',
          },
          {
            title: 'Khor Fakkan Coastal Hike',
            category: 'outdoor',
            venue: 2,
            price: 90,
            durationMinutes: 240,
            minAge: 12,
            tags: ['hiking', 'mountains', 'transport included'],
            summary:
              'A guided ridge walk above the Gulf of Oman, finishing at the waterfall amphitheatre.',
            description:
              'Sharjah’s east-coast exclave sits between the Hajar mountains and a deep-water bay, and this route climbs the lower ridge for the view down over both. About 7 km with 350 m of ascent on rocky ground — moderate rather than hard, but not flat. Transport from Sharjah city and two litres of water per person are included.',
          },
        ],
      },
    ],
  },

  /* ======================================================================== */
  {
    name: 'Saudi Arabia',
    code: 'SA',
    slug: 'saudi-arabia',
    currency: 'SAR',
    flagEmoji: '🇸🇦',
    cities: [
      {
        name: 'Riyadh',
        slug: 'riyadh',
        timezone: 'Asia/Riyadh',
        latitude: 24.7136,
        longitude: 46.6753,
        blurb:
          'A capital rebuilding its evening economy at speed — mud-brick Diriyah on one side, a season-long entertainment calendar on the other.',
        venues: [
          {
            name: 'At-Turaif District, Diriyah',
            address: 'Diriyah, Riyadh',
            latitude: 24.7337,
            longitude: 46.5757,
          },
          {
            name: 'Riyadh Season Arena',
            address: 'Boulevard City, Riyadh',
            latitude: 24.7742,
            longitude: 46.6115,
          },
          {
            name: 'Edge of the World (Jebel Fihrayn)',
            address: 'Tuwaiq Escarpment, 90 km north-west of Riyadh',
            latitude: 24.9667,
            longitude: 45.9833,
          },
          {
            name: 'Boulevard City',
            address: 'Hittin District, Riyadh',
            latitude: 24.7737,
            longitude: 46.6108,
          },
          {
            name: 'Wadi Namar Lake',
            address: 'Wadi Namar, southern Riyadh',
            latitude: 24.5389,
            longitude: 46.6478,
          },
          {
            name: 'Kingdom Centre Sky Bridge',
            address: 'King Fahd Road, Al Olaya, Riyadh',
            latitude: 24.7118,
            longitude: 46.6745,
          },
          {
            name: 'Riyadh Padel Club',
            address: 'Al Yasmin District, Riyadh',
            latitude: 24.8281,
            longitude: 46.6392,
          },
          {
            name: 'Riyadh Zoo',
            address: 'Al Malaz, Riyadh',
            latitude: 24.6667,
            longitude: 46.7333,
          },
        ],
        events: [
          {
            title: 'Diriyah At-Turaif Heritage Night',
            category: 'cultural',
            venue: 0,
            price: 75,
            durationMinutes: 150,
            featured: true,
            tags: ['unesco', 'guided', 'evening'],
            summary:
              'A guided evening through the mud-brick capital of the first Saudi state, lit after dark.',
            description:
              'At-Turaif is a UNESCO World Heritage site and the ancestral seat of the Al Saud, built in the distinctive Najdi style — thick earthen walls, triangular ventilation openings, no ornament that is not structural. The evening route takes in Salwa Palace and the restored mosque with a guide who covers the 1818 siege. Paths are compacted earth with some gentle gradients.',
          },
          {
            title: 'Riyadh Season Arena Concert',
            category: 'concerts',
            venue: 1,
            price: 250,
            durationMinutes: 180,
            featured: true,
            tags: ['arena', 'headline', 'seated'],
            summary:
              'A headline arena night from the winter season programme, with reserved tiered seating.',
            description:
              'The season’s main arena hosts a rotating bill of regional and international headliners across the winter months. This is a reserved-seat ticket in the middle tier, with clear sightlines to the main stage. Doors open two hours early and the surrounding boulevard has enough food to make an evening of it.',
          },
          {
            title: 'Edge of the World Sunset Trek',
            category: 'outdoor',
            venue: 2,
            price: 190,
            durationMinutes: 420,
            minAge: 12,
            featured: true,
            tags: ['hiking', '4x4 transfer', 'sunset'],
            summary:
              'Drive out to the Tuwaiq escarpment, walk the rim, and watch the sun drop off the cliff edge.',
            description:
              'The last stretch to Jebel Fihrayn is unmade track, so transport is by 4x4 from a central Riyadh meeting point — roughly ninety minutes each way. The walk along the escarpment is about 4 km on rock with unprotected drops; sensible shoes are non-negotiable. Dinner is served from the vehicles after sunset before the drive back.',
          },
          {
            title: 'Boulevard City Night Pass',
            category: 'entertainment',
            venue: 3,
            price: 60,
            durationMinutes: 300,
            tags: ['nightlife', 'family friendly', 'seasonal'],
            summary:
              'Entry to the seasonal entertainment district — zones, street performance and a nightly show.',
            description:
              'A general-admission pass to the walkable zone district, which covers the outdoor stages, the fountain show and the walking streets. Individual attractions and restaurants are ticketed separately inside. It is busiest after 21:00, which is also when the programming is at its best.',
          },
          {
            title: 'Saudi Coffee Roasting Workshop',
            category: 'workshops',
            venue: 3,
            price: 140,
            durationMinutes: 120,
            tags: ['coffee', 'craft', 'tasting'],
            summary:
              'Roast, grind and brew qahwa the Najdi way — cardamom, saffron, and the etiquette that goes with it.',
            description:
              'Saudi coffee is a lightly roasted, spiced brew that has almost nothing in common with an espresso, and this session starts from green beans in a pan. You will work through roast levels, the cardamom-to-saffron ratio and how the dallah and finjan are actually used in a majlis. Beans to take home are included.',
          },
          {
            title: 'Wadi Namar Kayaking Morning',
            category: 'marine',
            venue: 4,
            price: 95,
            durationMinutes: 120,
            minAge: 10,
            tags: ['kayak', 'lake', 'beginner friendly'],
            summary:
              'Flat-water paddling on the dam lake south of the city, before the day heats up.',
            description:
              'Wadi Namar’s dam has created a sheltered lake with a waterfall at one end, and it is the closest paddling water to central Riyadh. Single and double sit-on-top kayaks are provided along with buoyancy aids. The route is a slow 3 km loop with a stop under the falls; no experience needed.',
          },
          {
            title: 'Kingdom Tower Sky Bridge',
            category: 'experiences',
            venue: 5,
            price: 69,
            durationMinutes: 60,
            tags: ['viewpoint', 'skyline', 'timed entry'],
            summary:
              'The 99th-floor bridge across the top of the Kingdom Centre, at 300 metres.',
            description:
              'A timed-entry ticket to the suspended sky bridge spanning the tower’s inverted arch, with a full 360° view over Riyadh through floor-to-ceiling glass. Two lifts get you up in under a minute. Sunset slots are the busiest by a wide margin; the hour after dark is quieter and the city reads better lit.',
          },
          {
            title: 'Padel Open Court Tournament',
            category: 'sports',
            venue: 6,
            price: 110,
            durationMinutes: 180,
            minAge: 14,
            tags: ['padel', 'competitive', 'racket provided'],
            summary:
              'A social americano-format tournament — rotating partners, everyone plays every round.',
            description:
              'Americano format means you swap partners each round and score individually, so it works whether you arrive alone or with someone. Rackets and balls are provided; courts are covered and air-conditioned. Grouped by self-declared level so beginners are not fed to club players.',
          },
          {
            title: 'Riyadh Zoo Family Day',
            category: 'family',
            venue: 7,
            price: 30,
            durationMinutes: 240,
            tags: ['kids', 'animals', 'outdoor'],
            summary:
              'Day entry with the keeper-talk schedule and the train loop included.',
            description:
              'A full-day family ticket covering all enclosures, the scheduled keeper talks and the perimeter train. Mornings are considerably cooler and the animals more active; most of the site is shaded but not all of it. Strollers can be hired at the gate.',
          },
        ],
      },
      {
        name: 'Jeddah',
        slug: 'jeddah',
        timezone: 'Asia/Riyadh',
        latitude: 21.4858,
        longitude: 39.1925,
        blurb:
          'The Red Sea port and gateway to Makkah — coral-stone merchant houses in Al Balad, and reef diving twenty minutes offshore.',
        venues: [
          {
            name: 'Al Balad Historic District',
            address: 'Al Balad, Jeddah',
            latitude: 21.4833,
            longitude: 39.1867,
          },
          {
            name: 'Obhur Creek Dive Centre',
            address: 'North Obhur, Jeddah',
            latitude: 21.7167,
            longitude: 39.0833,
          },
          {
            name: 'Jeddah Corniche',
            address: 'Corniche Road, Jeddah',
            latitude: 21.5833,
            longitude: 39.1,
          },
          {
            name: 'Jeddah Fish Market',
            address: 'Al Bawadi, Jeddah',
            latitude: 21.5,
            longitude: 39.17,
          },
          {
            name: 'Jeddah Karting Circuit',
            address: 'Corniche Circuit area, Jeddah',
            latitude: 21.6319,
            longitude: 39.1044,
          },
        ],
        events: [
          {
            title: 'Al Balad Old Town Heritage Walk',
            category: 'cultural',
            venue: 0,
            price: 80,
            durationMinutes: 150,
            featured: true,
            tags: ['unesco', 'walking', 'architecture'],
            summary:
              'Coral-stone tower houses, carved rawasheen balconies and the merchant history behind them.',
            description:
              'Al Balad is a UNESCO site whose houses were built from Red Sea coral block and topped with the wooden lattice screens that gave Jeddah its skyline for four centuries. The walk covers Naseef House, the restored souq lanes and the ongoing conservation work. Late afternoon is best — the light suits the stone and the heat has broken.',
          },
          {
            title: 'Red Sea Reef Snorkelling Trip',
            category: 'marine',
            venue: 1,
            price: 320,
            durationMinutes: 300,
            minAge: 10,
            featured: true,
            tags: ['snorkelling', 'boat', 'equipment included'],
            summary:
              'Boat out to two fringing reef sites — some of the most intact coral in the world.',
            description:
              'The Red Sea’s reefs sit close to shore here and have escaped most of the bleaching seen elsewhere, so the coral cover is genuinely exceptional. Two sites are visited with a surface interval and lunch on board. Mask, snorkel, fins and a flotation vest are provided; you must be able to swim confidently.',
          },
          {
            title: 'Corniche Kite Festival',
            category: 'family',
            venue: 2,
            price: 25,
            durationMinutes: 240,
            tags: ['kids', 'outdoor', 'seasonal'],
            summary:
              'A kite-making tent, an open flying field and a competition round in the late afternoon.',
            description:
              'Held on the open corniche lawns where the onshore breeze is reliable, this is a build-and-fly afternoon rather than a spectator event — every ticket includes a kite kit and help assembling it. There is a judged round at 17:00 for anyone who wants it. Shade tents and water stations are set up along the field.',
          },
          {
            title: 'Fish Market to Table Cooking Class',
            category: 'workshops',
            venue: 3,
            price: 210,
            durationMinutes: 240,
            tags: ['cooking', 'market tour', 'meal included'],
            summary:
              'Buy the catch at the market with a chef, then cook sayadiyah and grilled hammour with it.',
            description:
              'Starts at the fish market at the working hour, choosing hammour, shrimp and whatever came in that morning, with the chef explaining how to judge freshness. The kitchen session covers sayadiyah rice, a Hijazi spice base and open-flame grilling. You eat what you cook, and the recipes go home with you.',
          },
          {
            title: 'Street Circuit Karting',
            category: 'sports',
            venue: 4,
            price: 130,
            durationMinutes: 90,
            minAge: 14,
            tags: ['racing', 'competitive', 'outdoor'],
            summary:
              'Timed sessions on an outdoor circuit beside the Corniche Grand Prix layout.',
            description:
              'Two practice runs and a timed final with live positions on the board, on a technical outdoor layout with real elevation change. Karts are 270cc four-strokes, considerably quicker than an indoor mall track. Helmets and suits are provided; minimum height 155 cm.',
          },
        ],
      },
      {
        name: 'AlUla',
        slug: 'alula',
        timezone: 'Asia/Riyadh',
        latitude: 26.6167,
        longitude: 37.9167,
        blurb:
          'A sandstone valley in the north-west holding Saudi Arabia’s first UNESCO site — Nabataean tombs, an oasis, and a mirrored concert hall in the desert.',
        venues: [
          {
            name: 'Hegra Archaeological Site',
            address: 'Hegra (Mada’in Salih), AlUla',
            latitude: 26.7917,
            longitude: 37.9542,
          },
          {
            name: 'Elephant Rock (Jabal AlFil)',
            address: 'AlUla valley, north of AlUla town',
            latitude: 26.7333,
            longitude: 37.9833,
          },
          {
            name: 'AlUla Oasis Trail',
            address: 'AlUla Old Town oasis, AlUla',
            latitude: 26.6167,
            longitude: 37.9167,
          },
          {
            name: 'Maraya Concert Hall',
            address: 'Ashar Valley, AlUla',
            latitude: 26.6333,
            longitude: 37.9,
          },
        ],
        events: [
          {
            title: 'Hegra Archaeological Site Tour',
            category: 'cultural',
            venue: 0,
            price: 155,
            durationMinutes: 180,
            featured: true,
            tags: ['unesco', 'archaeology', 'guided'],
            summary:
              'The Nabataean necropolis — 111 rock-cut tombs, most with their façades still sharp.',
            description:
              'Hegra was the southern city of the same kingdom that built Petra, and its tombs are in better condition because far fewer people have walked past them. The guided route covers four tomb clusters including the freestanding Qasr al-Farid, with a rawi — a local storyteller-guide — throughout. Site access is by shuttle only and independent entry is not permitted.',
          },
          {
            title: 'Elephant Rock Stargazing Dinner',
            category: 'experiences',
            venue: 1,
            price: 340,
            durationMinutes: 240,
            featured: true,
            tags: ['stargazing', 'dinner', 'desert'],
            summary:
              'Dinner in the sand hollows beneath the rock, then a guided sky session once it is fully dark.',
            description:
              'The natural amphitheatre around Jabal AlFil is set with low seating and fire pits, and dinner is served there before the lights go down for the astronomy portion. AlUla’s sky is exceptionally dark and the guide runs a telescope alongside a naked-eye tour. Warm layers matter — the valley loses its heat fast after sunset.',
          },
          {
            title: 'AlUla Oasis Cycling Trail',
            category: 'outdoor',
            venue: 2,
            price: 120,
            durationMinutes: 150,
            minAge: 12,
            tags: ['cycling', 'oasis', 'bike included'],
            summary:
              'An easy ride through 2.3 million date palms on the shaded oasis path.',
            description:
              'The oasis trail runs the length of the valley floor under continuous palm canopy, past farm plots that have been worked for centuries and the mud-brick ruins of AlUla Old Town. Flat, unpaved but smooth, and shaded for most of its length. Bikes, helmets and water are included.',
          },
          {
            title: 'Maraya: Desert Sessions',
            category: 'concerts',
            venue: 3,
            price: 420,
            durationMinutes: 120,
            tags: ['seated', 'mirrored venue', 'acoustic'],
            summary:
              'An acoustic set inside the world’s largest mirrored building, seated for 500.',
            description:
              'Maraya is clad entirely in mirror glass so that it reflects the sandstone canyon around it and effectively disappears from a distance — the interior is a properly engineered 500-seat hall. Programming leans acoustic and cross-cultural. Reserved seating; the venue is a 20-minute drive from AlUla town and shuttles run before and after.',
          },
        ],
      },
    ],
  },

  /* ======================================================================== */
  {
    name: 'United Kingdom',
    code: 'GB',
    slug: 'united-kingdom',
    currency: 'GBP',
    flagEmoji: '🇬🇧',
    cities: [
      {
        name: 'London',
        slug: 'london',
        timezone: 'Europe/London',
        latitude: 51.5074,
        longitude: -0.1278,
        blurb:
          'Forty theatres in one square mile, free national museums, and a river that still works as a way to get around.',
        venues: [
          {
            name: 'Sondheim Theatre',
            address: 'Shaftesbury Avenue, Soho, London W1D',
            latitude: 51.5117,
            longitude: -0.1327,
          },
          {
            name: 'Westminster Pier',
            address: 'Victoria Embankment, London SW1A',
            latitude: 51.5013,
            longitude: -0.1236,
          },
          {
            name: 'Camden Assembly',
            address: '49 Chalk Farm Road, Camden, London NW1',
            latitude: 51.5416,
            longitude: -0.1485,
          },
          {
            name: 'The British Museum',
            address: 'Great Russell Street, Bloomsbury, London WC1B',
            latitude: 51.5194,
            longitude: -0.127,
          },
          {
            name: 'Hampstead Heath Ponds',
            address: 'Millfield Lane, Hampstead, London N6',
            latitude: 51.5673,
            longitude: -0.1607,
          },
          {
            name: 'Borough Market',
            address: '8 Southwark Street, London SE1',
            latitude: 51.5055,
            longitude: -0.0912,
          },
          {
            name: 'Hackney Clay Studio',
            address: 'Mare Street, Hackney, London E8',
            latitude: 51.5416,
            longitude: -0.0553,
          },
          {
            name: 'Emirates Stadium',
            address: 'Hornsey Road, Holloway, London N7',
            latitude: 51.5549,
            longitude: -0.1084,
          },
          {
            name: 'Science Museum',
            address: 'Exhibition Road, South Kensington, London SW7',
            latitude: 51.4978,
            longitude: -0.1745,
          },
          {
            name: 'The Comedy Store',
            address: '1a Oxendon Street, Soho, London SW1Y',
            latitude: 51.5098,
            longitude: -0.1338,
          },
        ],
        events: [
          {
            title: 'West End Musical — Premium Seats',
            category: 'entertainment',
            venue: 0,
            price: 89,
            durationMinutes: 165,
            featured: true,
            tags: ['theatre', 'reserved seating', 'evening'],
            summary:
              'Stalls seating for a long-running West End production, including the interval.',
            description:
              'A reserved premium stalls ticket for one of Shaftesbury Avenue’s established productions, rows E to L where the sound mix is designed to sit. Running time includes a twenty-minute interval. Latecomers are held until a suitable break, which in this show is around fifteen minutes in.',
          },
          {
            title: 'Thames Sunset River Cruise',
            category: 'marine',
            venue: 1,
            price: 32,
            durationMinutes: 90,
            tags: ['river', 'sunset', 'commentary'],
            summary:
              'Westminster to Greenwich and back at dusk, with live commentary along the way.',
            description:
              'A covered-deck sailing downriver past the South Bank, the Tower and Canary Wharf, turning at Greenwich as the buildings light up. Commentary is live rather than recorded, which makes a difference. Open upper deck available in dry weather; a bar is on board.',
          },
          {
            title: 'Camden Live Music Crawl',
            category: 'concerts',
            venue: 2,
            price: 26,
            durationMinutes: 240,
            minAge: 18,
            tags: ['live music', 'multi venue', 'nightlife'],
            summary:
              'Four Camden venues in one night, with entry covered and a guide who knows the bookers.',
            description:
              'Camden still runs the densest small-venue circuit in Britain, and this crawl covers four rooms in one evening — typically a basement, a pub back room, a mid-size stage and one late one. Entry to all four is included; drinks are not. Line-ups are confirmed by email 48 hours ahead.',
          },
          {
            title: 'British Museum Highlights Tour',
            category: 'cultural',
            venue: 3,
            price: 38,
            durationMinutes: 150,
            tags: ['museum', 'guided', 'indoor'],
            summary:
              'The Rosetta Stone, the Parthenon sculptures and the Sutton Hoo hoard, with the arguments included.',
            description:
              'A guided route through the collection’s most significant objects that does not skip the contested-provenance question — the Parthenon marbles and the Benin bronzes are both addressed directly rather than walked past. Museum entry is free; this covers the guide and a reserved timed slot. Roughly 2.5 km of walking indoors.',
          },
          {
            title: 'Hampstead Heath Wild Swim',
            category: 'outdoor',
            venue: 4,
            price: 18,
            durationMinutes: 90,
            minAge: 16,
            tags: ['swimming', 'cold water', 'guided'],
            summary:
              'A supervised open-water swim in the Heath ponds, with a cold-water briefing first.',
            description:
              'The Hampstead ponds have been swum in continuously since the 1860s and are lifeguarded year-round. This session includes a cold-water acclimatisation briefing, a supervised swim and a hot drink afterwards, which in February is not a luxury. You must be able to swim 50 m unaided; water temperature is posted daily and can be under 6 °C in winter.',
          },
          {
            title: 'Borough Market Food Tour',
            category: 'experiences',
            venue: 5,
            price: 65,
            durationMinutes: 180,
            featured: true,
            tags: ['food', 'walking', 'tastings'],
            summary:
              'Nine tastings across a thousand-year-old market, from raw milk cheese to a Kentish cider stop.',
            description:
              'Borough has been a food market on roughly this site since the eleventh century, and this tour works through the producers rather than the resellers — a cheesemonger’s cellar, a whole-animal butcher, a bakery and a spice merchant among them. Enough food to count as lunch. Vegetarian routes are available with notice.',
          },
          {
            title: 'Pottery Throwing Workshop',
            category: 'workshops',
            venue: 6,
            price: 75,
            durationMinutes: 180,
            tags: ['ceramics', 'beginner friendly', 'firing included'],
            summary:
              'Three hours at the wheel with a ceramicist — throw, trim, and have two pieces fired.',
            description:
              'A properly hands-on introduction: centring, opening, pulling walls, and the trimming that most beginner classes skip. You choose two pieces to be glazed and fired, ready for collection or posting in about three weeks. Aprons and all materials are provided; wear something you do not mind ruining.',
          },
          {
            title: 'Premier League Stadium Tour',
            category: 'sports',
            venue: 7,
            price: 30,
            durationMinutes: 120,
            tags: ['football', 'self guided', 'family friendly'],
            summary:
              'Dressing rooms, tunnel and pitchside at a 60,000-seat Premier League ground.',
            description:
              'A self-guided audio tour with access to the home and away dressing rooms, the players’ tunnel, the directors’ box and the pitch perimeter, plus the club museum. Audio is available in nine languages. Not available on matchdays or the day before European fixtures.',
          },
          {
            title: 'Science Museum Family Explorer Day',
            category: 'family',
            venue: 8,
            price: 22,
            durationMinutes: 300,
            tags: ['kids', 'hands on', 'indoor'],
            summary:
              'Wonderlab access plus an IMAX film — the hands-on galleries, on a day ticket.',
            description:
              'Museum entry is free, but Wonderlab — the interactive gallery with the friction slides, the chemistry bar and the live demonstrations — is ticketed, and this covers it along with one large-format film. Best suited to ages 5 to 13. Free timed entry to the rest of the museum is included in the same slot.',
          },
          {
            title: 'Soho Improv Comedy Night',
            category: 'entertainment',
            venue: 9,
            price: 24,
            durationMinutes: 120,
            minAge: 18,
            tags: ['comedy', 'improv', 'unreserved'],
            summary:
              'Long-form improv built from audience suggestions — no two shows are the same.',
            description:
              'A basement room in Soho running a house team plus one guest ensemble, working entirely from suggestions taken at the top of the show. Unreserved seating, doors an hour before. Front rows are talked to; sit further back if that is not for you.',
          },
        ],
      },
      {
        name: 'Manchester',
        slug: 'manchester',
        timezone: 'Europe/London',
        latitude: 53.4808,
        longitude: -2.2426,
        blurb:
          'Two of the biggest football clubs in the world, a music scene that keeps producing, and the Peak District forty minutes out.',
        venues: [
          {
            name: 'Northern Quarter',
            address: 'Stevenson Square, Manchester M1',
            latitude: 53.4831,
            longitude: -2.2331,
          },
          {
            name: 'Etihad Stadium',
            address: 'Ashton New Road, Manchester M11',
            latitude: 53.4831,
            longitude: -2.2004,
          },
          {
            name: 'Deansgate Live',
            address: 'Deansgate, Manchester M3',
            latitude: 53.4784,
            longitude: -2.2503,
          },
          {
            name: 'Edale Trailhead',
            address: 'Edale, Peak District National Park',
            latitude: 53.3667,
            longitude: -1.8167,
          },
        ],
        events: [
          {
            title: 'Northern Quarter Street Art Tour',
            category: 'cultural',
            venue: 0,
            price: 16,
            durationMinutes: 120,
            tags: ['street art', 'walking', 'photography'],
            summary:
              'The murals, the artists behind them, and why the council stopped painting over them.',
            description:
              'The Northern Quarter’s walls turn over constantly, so this walk changes with them — it covers the commissioned pieces, the tolerated ones and the ongoing tension between the two. The guide is part of the local scene rather than a script reader. About 2 km, mostly flat, cobbles in places.',
          },
          {
            title: 'Matchday Hospitality Experience',
            category: 'sports',
            venue: 1,
            price: 165,
            durationMinutes: 300,
            featured: true,
            tags: ['football', 'hospitality', 'premier league'],
            summary:
              'A Premier League fixture with a pre-match meal, padded seat and a former player in the room.',
            description:
              'Arrival three hours before kick-off for a three-course meal in the hospitality lounge, a guest appearance and Q&A from a club legend, then a padded seat on the halfway line. The lounge stays open after the final whistle. Fixture dates move for broadcast; you are notified as soon as they are confirmed.',
          },
          {
            title: 'Indie Live at Deansgate',
            category: 'concerts',
            venue: 2,
            price: 21,
            durationMinutes: 180,
            minAge: 16,
            tags: ['live music', 'standing', 'local acts'],
            summary:
              'Three Manchester bands on a 400-capacity stage, the way most of the famous ones started.',
            description:
              'A standing show built around the city’s current guitar scene — the venue books ahead of the curve rather than behind it, which is the reason to go. Doors 19:00, headline around 21:15. Cloakroom available; the room gets warm.',
          },
          {
            title: 'Peak District Guided Hike',
            category: 'outdoor',
            venue: 3,
            price: 42,
            durationMinutes: 420,
            minAge: 14,
            tags: ['hiking', 'transport included', 'moderate'],
            summary:
              'Kinder Scout from Edale — the moorland plateau where the right to roam was won.',
            description:
              'A guided full-day circuit up Jacob’s Ladder onto the Kinder plateau and back down Grindsbrook, roughly 14 km with 550 m of ascent. The guide covers the 1932 mass trespass that eventually produced Britain’s national park legislation. Return coach from central Manchester is included; proper boots and waterproofs are essential, not optional.',
          },
        ],
      },
      {
        name: 'Edinburgh',
        slug: 'edinburgh',
        timezone: 'Europe/London',
        latitude: 55.9533,
        longitude: -3.1883,
        blurb:
          'A medieval old town stacked on a volcanic ridge, an extinct volcano you can climb before breakfast, and the world’s largest arts festival every August.',
        venues: [
          {
            name: 'Old Town Closes',
            address: 'Royal Mile, Edinburgh EH1',
            latitude: 55.9497,
            longitude: -3.1897,
          },
          {
            name: "Arthur's Seat",
            address: 'Holyrood Park, Edinburgh EH8',
            latitude: 55.9444,
            longitude: -3.1617,
          },
          {
            name: 'Scotch Whisky Vaults',
            address: 'Blair Street, Old Town, Edinburgh EH1',
            latitude: 55.9497,
            longitude: -3.1875,
          },
          {
            name: 'Edinburgh Castle',
            address: 'Castlehill, Edinburgh EH1',
            latitude: 55.9486,
            longitude: -3.1999,
          },
        ],
        events: [
          {
            title: 'Old Town Ghost Walk',
            category: 'entertainment',
            venue: 0,
            price: 19,
            durationMinutes: 90,
            minAge: 12,
            tags: ['evening', 'walking', 'underground'],
            summary:
              'The closes and the underground vaults after dark, with the plague history to match.',
            description:
              'A theatrical but historically grounded walk through the narrow closes off the Royal Mile and down into the eighteenth-century vaults beneath South Bridge. The vaults are genuinely cold and unlit beyond the guide’s lantern. Not recommended for anyone claustrophobic or under twelve.',
          },
          {
            title: "Arthur's Seat Sunrise Climb",
            category: 'outdoor',
            venue: 1,
            price: 15,
            durationMinutes: 120,
            tags: ['hiking', 'sunrise', 'city views'],
            summary:
              'Up the extinct volcano in the dark and onto the summit for first light over the Forth.',
            description:
              'A 251-metre climb from Holyrood on a guided route that avoids the eroded direct path, timed to reach the top fifteen minutes before sunrise. It is steep, uneven and exposed at the top — this is a hill walk, not a stroll. Head torches and a flask of coffee at the summit are included.',
          },
          {
            title: 'Whisky Tasting Masterclass',
            category: 'workshops',
            venue: 2,
            price: 55,
            durationMinutes: 120,
            minAge: 18,
            tags: ['whisky', 'tasting', 'guided'],
            summary:
              'Six drams across five regions, and a framework for telling them apart.',
            description:
              'A structured tasting through Speyside, Islay, Highland, Lowland and Campbeltown, with a cask-strength bottling at the end. The session covers mash, cask influence and why peat is regional rather than universal. Held in a stone vault under the Old Town; a light food pairing is included.',
          },
          {
            title: 'Castle & Royal Mile Heritage Tour',
            category: 'cultural',
            venue: 3,
            price: 44,
            durationMinutes: 180,
            featured: true,
            tags: ['castle', 'guided', 'skip the line'],
            summary:
              'Timed castle entry plus a guided walk down the Royal Mile to Holyrood.',
            description:
              'Starts inside the castle with the Crown Jewels and the Stone of Destiny, then walks the full mile downhill through the old town to the palace gates, covering the Reformation, the 1707 Union and the closes on the way. Castle admission and a reserved entry slot are included. Mostly downhill but on cobbles throughout.',
          },
        ],
      },
    ],
  },

  /* ======================================================================== */
  {
    name: 'Spain',
    code: 'ES',
    slug: 'spain',
    currency: 'EUR',
    flagEmoji: '🇪🇸',
    cities: [
      {
        name: 'Barcelona',
        slug: 'barcelona',
        timezone: 'Europe/Madrid',
        latitude: 41.3874,
        longitude: 2.1686,
        blurb:
          'Modernista architecture, a working beach fifteen minutes from the Gothic quarter, and a city that eats late by design.',
        venues: [
          {
            name: 'Sagrada Família',
            address: 'Carrer de Mallorca 401, Barcelona',
            latitude: 41.4036,
            longitude: 2.1744,
          },
          {
            name: 'Port Olímpic',
            address: 'Moll de Mestral, Barcelona',
            latitude: 41.3877,
            longitude: 2.1969,
          },
          {
            name: 'Palau Dalmases',
            address: 'Carrer de Montcada 20, El Born, Barcelona',
            latitude: 41.3852,
            longitude: 2.1815,
          },
          {
            name: 'Montjuïc',
            address: 'Parc de Montjuïc, Barcelona',
            latitude: 41.3641,
            longitude: 2.1587,
          },
          {
            name: 'Cooking Studio Gràcia',
            address: 'Carrer Gran de Gràcia, Barcelona',
            latitude: 41.4022,
            longitude: 2.1553,
          },
          {
            name: 'Barri Gòtic',
            address: 'Plaça Reial, Barcelona',
            latitude: 41.3797,
            longitude: 2.1751,
          },
          {
            name: 'Spotify Camp Nou',
            address: "Carrer d'Arístides Maillol, Barcelona",
            latitude: 41.3809,
            longitude: 2.1228,
          },
          {
            name: 'Park Güell',
            address: "Carrer d'Olot, Barcelona",
            latitude: 41.4145,
            longitude: 2.1527,
          },
          {
            name: 'Razzmatazz',
            address: 'Carrer dels Almogàvers 122, Barcelona',
            latitude: 41.3977,
            longitude: 2.1913,
          },
        ],
        events: [
          {
            title: 'Sagrada Família Skip-the-Line Tour',
            category: 'cultural',
            venue: 0,
            price: 49,
            durationMinutes: 105,
            featured: true,
            tags: ['gaudí', 'skip the line', 'guided'],
            summary:
              'Guided entry to Gaudí’s basilica, with the structural logic explained rather than admired.',
            description:
              'The interesting thing about the Sagrada Família is not that it is ornate but that the geometry is load-bearing — hyperboloid vaults and catenary arches doing the work flying buttresses do elsewhere. This tour makes that legible, covering the Nativity and Passion façades and the nave. Timed entry included; tower access is a separate ticket.',
          },
          {
            title: 'Barceloneta Catamaran Sunset Sail',
            category: 'marine',
            venue: 1,
            price: 42,
            durationMinutes: 120,
            featured: true,
            tags: ['sailing', 'sunset', 'drink included'],
            summary:
              'Two hours under sail off the city beaches, with the Collserola ridge behind the skyline.',
            description:
              'A large catamaran leaves Port Olímpic in the late afternoon and sails along the coast under wind where conditions allow rather than motoring the whole way. Netting up front, shade aft, one drink included. Swimming stops are offered from June to September.',
          },
          {
            title: 'Flamenco at Palau Dalmases',
            category: 'entertainment',
            venue: 2,
            price: 35,
            durationMinutes: 75,
            tags: ['flamenco', 'intimate venue', 'baroque palace'],
            summary:
              'A four-piece tablao in the baroque courtyard of a seventeenth-century palace, seating fifty.',
            description:
              'Cante, guitar, palmas and one dancer, performed a few metres from the front row in a room with the acoustics to carry it unamplified. This is a tablao rather than a theatre show — shorter, harder and considerably less polished for tourists. A drink is included; arrive twenty minutes early for the good seats.',
          },
          {
            title: 'Montjuïc Sunrise Hike & Breakfast',
            category: 'outdoor',
            venue: 3,
            price: 28,
            durationMinutes: 150,
            tags: ['hiking', 'sunrise', 'breakfast included'],
            summary:
              'Up through the terraced gardens to the castle for sunrise over the port, then breakfast.',
            description:
              'A gentle 3 km ascent through the Mossèn Cinto and Laribal gardens to the castle terrace, arriving for first light over the container port and the sea beyond. The route is paved and stepped throughout. Breakfast — coffee, pa amb tomàquet and pastries — is served at the top.',
          },
          {
            title: 'Paella & Sangria Cooking Class',
            category: 'workshops',
            venue: 4,
            price: 68,
            durationMinutes: 210,
            featured: true,
            tags: ['cooking', 'market visit', 'meal included'],
            summary:
              'A market run, then a proper socarrat-bottomed paella cooked over a flat burner.',
            description:
              'Begins with a walk through a neighbourhood market for the seafood and vegetables, then a hands-on session covering sofrito, the rice-to-stock ratio and how to get the caramelised socarrat crust without burning the pan. Sangria is made alongside. You eat the result with wine at a shared table.',
          },
          {
            title: 'Gothic Quarter Tapas Crawl',
            category: 'experiences',
            venue: 5,
            price: 58,
            durationMinutes: 180,
            minAge: 18,
            tags: ['food', 'wine', 'walking'],
            summary:
              'Four bars in the old town, chosen for what locals order rather than what tourists do.',
            description:
              'A guided route through the Barri Gòtic hitting a vermuteria, a Basque pintxo bar, an old-school bodega and one modern kitchen, with a drink paired at each. The guide explains the ordering conventions, which are not obvious and which most visitors get wrong. Roughly 1.5 km of walking on flat cobbles.',
          },
          {
            title: 'Camp Nou Stadium Experience',
            category: 'sports',
            venue: 6,
            price: 45,
            durationMinutes: 150,
            tags: ['football', 'museum', 'self guided'],
            summary:
              'The club museum, the trophy room and pitchside access at Europe’s largest stadium.',
            description:
              'A self-guided route through the museum’s trophy collection and multimedia rooms, out to the stands and down to the pitch perimeter and press area. Sections may be closed during the ongoing redevelopment, and this is flagged at booking. Allow longer than the stated time if you read every case.',
          },
          {
            title: 'Park Güell Family Discovery Trail',
            category: 'family',
            venue: 7,
            price: 26,
            durationMinutes: 120,
            tags: ['kids', 'gaudí', 'outdoor'],
            summary:
              'Timed entry to the monumental zone with a puzzle trail built for children.',
            description:
              'Park Güell was designed as a housing estate that never sold, which is why it looks like a fairy tale rather than a suburb — good material for children. The included trail booklet sets tasks at the mosaic bench, the hypostyle hall and the dragon stair. Timed entry to the monumental zone is included; the surrounding park is free.',
          },
          {
            title: 'Razzmatazz Indie Night',
            category: 'concerts',
            venue: 8,
            price: 24,
            durationMinutes: 300,
            minAge: 18,
            tags: ['nightlife', 'multi room', 'late'],
            summary:
              'Five rooms, five genres, one wristband — and nothing really starts before one.',
            description:
              'Barcelona’s largest club runs five distinct rooms on separate programming, from the main indie stage to a techno floor upstairs. One entry covers all of them and you can move freely. Doors at midnight and the main room fills around 01:30, which is normal here rather than late.',
          },
        ],
      },
      {
        name: 'Madrid',
        slug: 'madrid',
        timezone: 'Europe/Madrid',
        latitude: 40.4168,
        longitude: -3.7038,
        blurb:
          'The Prado, the Reina Sofía and the Thyssen within one kilometre of each other — and a rooftop culture that runs until the small hours.',
        venues: [
          {
            name: 'Museo del Prado',
            address: 'Calle de Ruiz de Alarcón 23, Madrid',
            latitude: 40.4138,
            longitude: -3.6921,
          },
          {
            name: 'Parque del Retiro',
            address: 'Plaza de la Independencia 7, Madrid',
            latitude: 40.4153,
            longitude: -3.6844,
          },
          {
            name: 'Santiago Bernabéu',
            address: 'Avenida de Concha Espina 1, Madrid',
            latitude: 40.4531,
            longitude: -3.6883,
          },
          {
            name: 'Malasaña Rooftop',
            address: 'Calle de Fuencarral, Malasaña, Madrid',
            latitude: 40.4256,
            longitude: -3.7025,
          },
        ],
        events: [
          {
            title: 'Prado Museum Masterpieces Tour',
            category: 'cultural',
            venue: 0,
            price: 52,
            durationMinutes: 150,
            featured: true,
            tags: ['museum', 'guided', 'skip the line'],
            summary:
              'Velázquez, Goya and Bosch in two and a half hours, with the politics behind each.',
            description:
              'A guided route built around Las Meninas, the Black Paintings and The Garden of Earthly Delights, treating them as arguments rather than objects — court propaganda, private despair and moral instruction respectively. Skip-the-line entry included. Photography is not permitted anywhere in the galleries.',
          },
          {
            title: 'Retiro Park Rowing & Picnic',
            category: 'family',
            venue: 1,
            price: 30,
            durationMinutes: 150,
            tags: ['kids', 'boating', 'picnic included'],
            summary:
              'An hour on the lake in a rowing boat, then a packed picnic under the trees.',
            description:
              'The Retiro’s artificial lake sits beneath the Alfonso XII colonnade and rowing on it is a Madrid Sunday institution. This includes an hour’s boat hire for up to four people and a prepared picnic to eat afterwards on the lawns. Boats are stable and children are welcome; life jackets are provided for under-tens.',
          },
          {
            title: 'Santiago Bernabéu Stadium Tour',
            category: 'sports',
            venue: 2,
            price: 40,
            durationMinutes: 120,
            tags: ['football', 'museum', 'self guided'],
            summary:
              'The rebuilt Bernabéu, the trophy hall and the panoramic walkway around the roof.',
            description:
              'A self-guided route through the redeveloped stadium taking in the trophy room, the dressing rooms, the tunnel and the new 360° roof walkway. The trophy hall alone justifies the ticket if you follow the sport at all. Closed or reduced on matchdays; check before booking.',
          },
          {
            title: 'Malasaña Rooftop Live Sessions',
            category: 'concerts',
            venue: 3,
            price: 27,
            durationMinutes: 180,
            minAge: 18,
            tags: ['rooftop', 'live music', 'sunset'],
            summary:
              'Two acoustic sets on a Malasaña rooftop, starting as the sun goes down.',
            description:
              'A small rooftop with a hard capacity of 120, programming Spanish singer-songwriters and one guest act per night. The first set starts at sunset and the second runs into the dark. Standing and limited bar seating; one drink is included with entry.',
          },
        ],
      },
      {
        name: 'Valencia',
        slug: 'valencia',
        timezone: 'Europe/Madrid',
        latitude: 39.4699,
        longitude: -0.3763,
        blurb:
          'A riverbed turned into a nine-kilometre park, the birthplace of paella, and a lagoon just south where the rice actually grows.',
        venues: [
          {
            name: 'Ciutat de les Arts i les Ciències',
            address: 'Avinguda del Professor López Piñero 7, Valencia',
            latitude: 39.4545,
            longitude: -0.3527,
          },
          {
            name: 'Albufera Natural Park',
            address: 'El Palmar, Valencia',
            latitude: 39.335,
            longitude: -0.3325,
          },
          {
            name: 'Jardí del Túria',
            address: 'Turia Gardens, Valencia',
            latitude: 39.4771,
            longitude: -0.3745,
          },
          {
            name: 'Horchatería Santa Catalina',
            address: 'Plaça de Santa Caterina 6, Valencia',
            latitude: 39.4747,
            longitude: -0.3757,
          },
        ],
        events: [
          {
            title: 'City of Arts & Sciences Day Pass',
            category: 'family',
            venue: 0,
            price: 44,
            durationMinutes: 360,
            featured: true,
            tags: ['kids', 'science', 'aquarium'],
            summary:
              'Science museum, Oceanogràfic aquarium and the hemisphere cinema on one combined ticket.',
            description:
              'Calatrava’s complex holds Europe’s largest aquarium alongside a genuinely hands-on science museum, and this combined ticket covers both plus one film in the IMAX dome. Realistically a full day — the aquarium alone takes three hours. The site is fully step-free and stroller-friendly.',
          },
          {
            title: 'Albufera Sunset Boat & Rice Fields',
            category: 'marine',
            venue: 1,
            price: 34,
            durationMinutes: 180,
            tags: ['boat', 'sunset', 'rice fields'],
            summary:
              'A flat-bottomed boat across the lagoon at golden hour, through the paddies paella came from.',
            description:
              'The Albufera is a freshwater lagoon separated from the sea by a sandbar, ringed by the rice fields that supply Valencian paella. Traditional albuferenc boats run slow crossings at sunset, when the water goes completely still and the light is the reason people come. Includes a stop in El Palmar village.',
          },
          {
            title: 'Turia Gardens Cycling Tour',
            category: 'outdoor',
            venue: 2,
            price: 25,
            durationMinutes: 180,
            tags: ['cycling', 'bike included', 'easy'],
            summary:
              'Ride the old riverbed end to end — nine kilometres of park with no traffic on it.',
            description:
              'After the 1957 flood the Turia was diverted and its bed turned into a continuous park through the middle of the city, which makes it the easiest urban ride in Spain. The route runs from the Bioparc to the City of Arts, stopping at the Palau de la Música and the Gulliver playground. Bikes, helmets and water included; entirely flat.',
          },
          {
            title: 'Horchata & Fartons Tasting',
            category: 'experiences',
            venue: 3,
            price: 18,
            durationMinutes: 60,
            tags: ['food', 'local speciality', 'short'],
            summary:
              'The tiger-nut drink Valencia actually runs on, tasted properly with the pastry it belongs to.',
            description:
              'Horchata is pressed from chufa tiger nuts grown just north of the city and is nothing like the rice version sold elsewhere. This short session covers the growing, the pressing and the difference between fresh and pasteurised, tasted alongside the fartons made for dipping. Held in a hundred-year-old horchatería opposite the market.',
          },
        ],
      },
    ],
  },
];

/* -------------------------------------------------------------------------- */
/* Demo accounts                                                              */
/* -------------------------------------------------------------------------- */

export const DEMO_ACCOUNTS = {
  admin: {
    email: 'admin@eventora.demo',
    password: 'Admin!2345',
    fullName: 'Amina Al-Rashid',
    phone: '+965 9000 1122',
  },
  customer: {
    email: 'demo@eventora.demo',
    password: 'Demo!2345',
    fullName: 'Yousef Al-Sabah',
    phone: '+965 9000 3344',
  },
} as const;

/** Additional accounts that exist only to author the demo reviews. */
export const REVIEWER_NAMES = [
  'Layla Haddad',
  'Tom Whitfield',
  'Núria Serra',
  'Faisal Al-Otaibi',
  'Priya Raman',
  'Mateo Álvarez',
  'Hessa Al-Mutairi',
  'James Okonkwo',
  'Sofia Marchetti',
  'Omar Benali',
];

export const REVIEW_COMMENTS = [
  'Exactly as described. The guide clearly does this because they enjoy it, not because it is a job.',
  'Booked on short notice and it was the highlight of the trip. Would do it again.',
  'Well organised and it started on time, which matters more than people admit.',
  'Good value for what you get. The small group size makes a real difference.',
  'Genuinely better than the equivalent I did in another city. No notes.',
  'Worth the early start. Get the earliest slot you can and beat the crowds.',
  'Solid experience. It ran slightly over, which nobody minded.',
  'A friend recommended it and I understand why. Bring water and comfortable shoes.',
  'The organisers handled a last-minute change well and kept everyone informed.',
  'Not a tourist-trap version of this — you can tell the difference immediately.',
  'Took the family and all three ages were happy, which almost never happens.',
  'The best two hours of our weekend. Book the sunset slot if you can.',
];
