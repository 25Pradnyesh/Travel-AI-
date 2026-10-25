/**
 * Results & Map Fixtures for VAMO Development & Hardening
 *
 * Covers required golden test fixtures:
 * 1. Jeju — specific destination, country deduplication ("Jeju Island, South Korea"), photo & weather enrichment, overview, budget model (KRW + INR).
 * 2. Kyoto — display name ("Kyoto, Japan") and historical weather.
 * 3. Bali — tropical season logic (Dry/Wet season, never spring/autumn), Indonesia.
 * 4. Paris — destination display ("Paris, France") and sourced overview.
 * 5. Sparse destination — omit unsupported facts, tips, weather, and budget sections.
 * 6. Failed-photo destination — fallback works, slideshow frame displays, no stale previous destination image.
 */

import { AnalysisResponse } from '@/types/analysis';

export interface FixtureScenario {
  id: string;
  label: string;
  badge: string;
  description: string;
  data: AnalysisResponse;
  sourceUrl: string;
  primaryPlaceId: string;
  primaryPlaceName: string;
}

export const FIXTURES: Record<string, FixtureScenario> = {
  // -------------------------------------------------------------
  // 1. Golden Regression: Jeju Island, South Korea
  // -------------------------------------------------------------
  jeju: {
    id: 'jeju',
    label: 'Jeju Island (Golden Fixture)',
    badge: 'Golden Master',
    description: 'Golden regression test: Country deduplication, CC hero photo, 5-line Overview, Open-Meteo normals, and transparent KRW/INR budget model.',
    primaryPlaceId: 'openmeteo_jeju_island',
    primaryPlaceName: 'Jeju Island',
    sourceUrl: 'https://www.instagram.com/reel/C8sampleJejuReel/',
    data: {
      success: true,
      best_guess: {
        place_id: 'openmeteo_jeju_island',
        name: 'Jeju Island',
        city: 'Jeju Island',
        region: 'South Korea',
        country: 'South Korea',
        formatted_address: 'Jeju Island, Jeju-do, South Korea',
        latitude: 33.4996,
        longitude: 126.5312,
        rating: 4.8,
        user_ratings_total: 21400,
        confidence: 96,
        confidence_level: 'VERY_HIGH',
        verification_status: 'VERIFIED',
        gemini_confidence: 0.95,
        gemini_reason: 'Identified Hallasan volcanic shield peak and Seongsan Ilchulbong tuff cone.',
        why: 'Volcanic island features matching Jeju UNESCO heritage geopark criteria.',
        types: ['island', 'provincial_capital', 'tourist_attraction'],
        photos: [
          {
            url: 'https://upload.wikimedia.org/wikipedia/commons/c/c6/Jeju_Island.jpg',
            author: 'Jyusin (Wikimedia Commons, CC BY-SA 3.0)',
            photo_tier: 'wikipedia_lead_image',
            width: 3000,
            height: 2000,
          },
        ],
        maps_url: 'https://maps.google.com/?q=Jeju+Island',
        overview: {
          where: 'Island province, South Korea',
          size: '1,848 km²',
          main_city_landmark: 'Jeju City • Hallasan (1,950 m)',
          recognition: 'UNESCO World Heritage Site (2007)',
          climate: 'Humid subtropical • Annual avg 16.2°C • 1,450 mm rain',
        },
      },
      travel_intelligence: {
        category: 'Volcanic Island',
        travel_summary: 'Subtropical volcanic island designated as a UNESCO World Natural Heritage site, celebrated for lava tubes and sunrise peaks.',
        best_season: 'Spring & Autumn',
        recommended_window: 'April–June & September–November',
        recommended_reason: 'Mild temperatures (16°C–23°C) and low rainfall, offering optimal conditions for sightseeing.',
        temperature_range: '16°C–23°C',
        weather_basis: 'based on historical weather',
        weather_source: 'Open-Meteo Historical Weather',
        recommended_trip_days: '3-4 Days',
        season_cards: [
          {
            name: 'Spring',
            months: 'March–May',
            avg_temp_range: '12°C–21°C',
            avg_rainfall: '88 mm/mo',
            description: 'Canola blossoms and cherry trees bloom; comfortable mild weather.',
          },
          {
            name: 'Summer',
            months: 'June–August',
            avg_temp_range: '21°C–29°C',
            avg_rainfall: '235 mm/mo',
            description: 'Warm and humid with lush vegetation and occasional monsoon downpours.',
          },
          {
            name: 'Autumn',
            months: 'September–November',
            avg_temp_range: '14°C–24°C',
            avg_rainfall: '72 mm/mo',
            description: 'Crisp clear skies and silver eulalia grass across volcanic oreum craters.',
          },
          {
            name: 'Winter',
            months: 'December–February',
            avg_temp_range: '3°C–11°C',
            avg_rainfall: '45 mm/mo',
            description: 'Brisk coastal winds with snow dusting Mount Hallasan summit slopes.',
          },
        ],
        budget_model: {
          tiers: {
            budget: {
              name: 'Budget',
              style: 'Hostel / budget guesthouse, street food & local diners, public transit',
              total_usd: 36,
              total_local: 48000,
              total_inr: 3418,
              breakdown_usd: { stay: 16, food: 11, local_transport: 4, activities: 4, buffer: 1 },
              breakdown_local: { stay: 21000, food: 15000, local_transport: 5000, activities: 5000, buffer: 2000 },
              breakdown_inr: { stay: 1519, food: 1044, local_transport: 380, activities: 380, buffer: 95 },
            },
            mid_range: {
              name: 'Mid-range',
              style: '3-star hotel / boutique stay, sit-down local restaurants, mix of taxis & transit',
              total_usd: 94,
              total_local: 124000,
              total_inr: 8924,
              breakdown_usd: { stay: 47, food: 25, local_transport: 9, activities: 7, buffer: 6 },
              breakdown_local: { stay: 62000, food: 33000, local_transport: 12000, activities: 9000, buffer: 8000 },
              breakdown_inr: { stay: 4462, food: 2374, local_transport: 854, activities: 665, buffer: 569 },
            },
            comfortable: {
              name: 'Comfortable',
              style: '4-star / upscale resort, curated dining, private transport & guided activities',
              total_usd: 202,
              total_local: 268000,
              total_inr: 19178,
              breakdown_usd: { stay: 108, food: 50, local_transport: 18, activities: 14, buffer: 12 },
              breakdown_local: { stay: 143000, food: 66000, local_transport: 24000, activities: 19000, buffer: 16000 },
              breakdown_inr: { stay: 10254, food: 4747, local_transport: 1709, activities: 1329, buffer: 1139 },
            },
          },
          local_currency: 'KRW',
          rate_date: '2026-10-23',
          per_person: true,
          accommodation_included: true,
          exclusions: ['International and domestic flights', 'Visas and entry permits'],
          assumed_style: {
            budget: 'Hostel / budget guesthouse, street food & local diners, public transit',
            mid_range: '3-star hotel / boutique stay, sit-down local restaurants, mix of taxis & transit',
            comfortable: '4-star / upscale resort, curated dining, private transport & guided activities',
          },
          disclaimer: 'Estimate from national price levels; not city-specific or live',
          price_level_ratio: 0.72,
          world_bank_indicator: 'PA.NUS.PPPC.RF',
        },
        travel_tips: [
          'Rent a car or use the Jeju Golden Bus, as natural sites like Manjanggul Cave are spread across the island.',
          'Ascend Seongsan Ilchulbong at sunrise for the quintessential crater view over the East China Sea.',
        ],
      },
      nearby_places: [
        {
          place_id: 'jeju_hallasan',
          name: 'Hallasan National Park',
          formatted_address: '1553-85 1100-ro, Jeju-si, Jeju-do',
          latitude: 33.3617,
          longitude: 126.5292,
          rating: 4.8,
          user_ratings_total: 4210,
          distance_km: 15.2,
          category: 'Nature',
          maps_url: 'https://maps.google.com/?q=Hallasan',
          types: ['natural_feature', 'park'],
          photos: [],
        },
      ],
      performance: { total_seconds: 2.14 },
    },
  },

  // -------------------------------------------------------------
  // 2. Kyoto, Japan
  // -------------------------------------------------------------
  kyoto: {
    id: 'kyoto',
    label: 'Kyoto (Japan)',
    badge: 'Temperate City',
    description: 'Validates canonical display name ("Kyoto, Japan"), UNESCO overview, and JPY/INR budget model.',
    primaryPlaceId: 'fixture_kyoto_city',
    primaryPlaceName: 'Kyoto',
    sourceUrl: 'https://www.instagram.com/reel/C8sampleKyotoReel/',
    data: {
      success: true,
      best_guess: {
        place_id: 'fixture_kyoto_city',
        name: 'Kyoto',
        city: 'Kyoto',
        region: 'Kansai',
        country: 'Japan',
        formatted_address: 'Kyoto, Kyoto Prefecture, Japan',
        latitude: 35.0116,
        longitude: 135.7681,
        rating: 4.9,
        user_ratings_total: 62000,
        confidence: 94,
        confidence_level: 'VERY_HIGH',
        verification_status: 'VERIFIED',
        gemini_confidence: 0.94,
        gemini_reason: 'Identified historic Gion Machiya architecture and Kamo River stone banks.',
        why: 'Ancient Japanese capital cultural landmark cluster matching Kyoto historical boundaries.',
        types: ['city', 'locality', 'political'],
        photos: [
          {
            url: 'https://upload.wikimedia.org/wikipedia/commons/6/60/Kinkaku-ji_in_Kyoto.jpg',
            author: 'SixSix (Wikimedia Commons, CC BY-SA 3.0)',
            photo_tier: 'commons_text_search',
          },
        ],
        maps_url: 'https://maps.google.com/?q=Kyoto',
        overview: {
          where: 'City, Japan',
          size: '828 km²',
          main_city_landmark: 'Kyoto • Mount Atago (924 m)',
          recognition: 'Historic Monuments of Ancient Kyoto UNESCO (1994)',
          climate: 'Humid subtropical • Annual avg 15.9°C • 1,520 mm rain',
        },
      },
      travel_intelligence: {
        category: 'Historic City',
        travel_summary: 'Ancient imperial capital of Japan famed for classical Buddhist temples, Zen gardens, and traditional wooden machiya townhouses.',
        best_season: 'Spring & Autumn',
        recommended_window: 'March–May & October–November',
        recommended_reason: 'Mild temperatures (15°C–22°C) and moderate rainfall, perfect for temple walks.',
        temperature_range: '15°C–22°C',
        weather_basis: 'based on historical weather',
        weather_source: 'Open-Meteo Historical Weather',
        recommended_trip_days: '3-4 Days',
        season_cards: [
          {
            name: 'Spring',
            months: 'March–May',
            avg_temp_range: '10°C–22°C',
            avg_rainfall: '115 mm/mo',
            description: 'Cherry blossom season; pleasant weather across historic temple paths.',
          },
          {
            name: 'Autumn',
            months: 'September–November',
            avg_temp_range: '14°C–24°C',
            avg_rainfall: '105 mm/mo',
            description: 'Vibrant autumn foliage (koyo) framed by traditional wooden pavilions.',
          },
        ],
        budget_model: {
          tiers: {
            budget: {
              name: 'Budget',
              style: 'Hostel / budget guesthouse, street food & local diners, public transit',
              total_usd: 39,
              total_local: 5940,
              total_inr: 3703,
              breakdown_usd: { stay: 17, food: 12, local_transport: 4, activities: 4, buffer: 2 },
              breakdown_local: { stay: 2589, food: 1828, local_transport: 609, activities: 609, buffer: 305 },
              breakdown_inr: { stay: 1614, food: 1139, local_transport: 380, activities: 380, buffer: 190 },
            },
            mid_range: {
              name: 'Mid-range',
              style: '3-star hotel / boutique stay, sit-down local restaurants, mix of taxis & transit',
              total_usd: 101,
              total_local: 15382,
              total_inr: 9589,
              breakdown_usd: { stay: 51, food: 27, local_transport: 9, activities: 8, buffer: 6 },
              breakdown_local: { stay: 7767, food: 4112, local_transport: 1371, activities: 1218, buffer: 914 },
              breakdown_inr: { stay: 4842, food: 2563, local_transport: 854, activities: 760, buffer: 570 },
            },
            comfortable: {
              name: 'Comfortable',
              style: '4-star / upscale resort, curated dining, private transport & guided activities',
              total_usd: 218,
              total_local: 33201,
              total_inr: 20697,
              breakdown_usd: { stay: 117, food: 55, local_transport: 20, activities: 16, buffer: 10 },
              breakdown_local: { stay: 17819, food: 8377, local_transport: 3046, activities: 2437, buffer: 1522 },
              breakdown_inr: { stay: 11108, food: 5222, local_transport: 1899, activities: 1519, buffer: 949 },
            },
          },
          local_currency: 'JPY',
          rate_date: '2026-10-23',
          per_person: true,
          accommodation_included: true,
          exclusions: ['International and domestic flights', 'Visas and entry permits'],
          assumed_style: {
            budget: 'Hostel / budget guesthouse, street food & local diners, public transit',
            mid_range: '3-star hotel / boutique stay, sit-down local restaurants, mix of taxis & transit',
            comfortable: '4-star / upscale resort, curated dining, private transport & guided activities',
          },
          disclaimer: 'Estimate from national price levels; not city-specific or live',
          price_level_ratio: 0.78,
          world_bank_indicator: 'PA.NUS.PPPC.RF',
        },
        travel_tips: [
          'Purchase a Hankyu or subway IC card for seamless travel between temple districts.',
          'Start visits to Arashiyama Bamboo Grove before 7:30 AM to experience silence.',
        ],
      },
      nearby_places: [],
      performance: { total_seconds: 1.82 },
    },
  },

  // -------------------------------------------------------------
  // 3. Bali, Indonesia (Tropical Dry / Wet Season Logic)
  // -------------------------------------------------------------
  bali: {
    id: 'bali',
    label: 'Bali (Tropical Dry/Wet Seasons)',
    badge: 'Tropics Aware',
    description: 'Validates tropical season logic (Dry season vs Wet season, never spring/autumn) and Indonesian Rupiah budget.',
    primaryPlaceId: 'fixture_bali_island',
    primaryPlaceName: 'Bali',
    sourceUrl: 'https://www.instagram.com/reel/C8sampleBaliReel/',
    data: {
      success: true,
      best_guess: {
        place_id: 'fixture_bali_island',
        name: 'Bali',
        city: 'Denpasar',
        region: 'Bali',
        country: 'Indonesia',
        formatted_address: 'Bali, Indonesia',
        latitude: -8.3405,
        longitude: 115.0920,
        rating: 4.8,
        user_ratings_total: 54000,
        confidence: 95,
        confidence_level: 'VERY_HIGH',
        verification_status: 'VERIFIED',
        gemini_confidence: 0.95,
        gemini_reason: 'Identified Balinese Hindu temple split gates (candi bentar) and terraced rice paddies.',
        why: 'Tropical island topography and volcanic mountain ridge matching Bali coordinate footprint.',
        types: ['island', 'tourist_attraction'],
        photos: [
          {
            url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e0/Pura_Ulun_Danu_Bratan.jpg/1600px-Pura_Ulun_Danu_Bratan.jpg',
            author: 'Cccefalon (Wikimedia Commons, CC BY-SA 4.0)',
            photo_tier: 'wikidata_p18',
          },
        ],
        maps_url: 'https://maps.google.com/?q=Bali',
        overview: {
          where: 'Island province, Indonesia',
          size: '5,780 km²',
          main_city_landmark: 'Denpasar • Mount Agung (3,142 m)',
          climate: 'Tropical savanna • Annual avg 27.2°C • 1,650 mm rain',
        },
      },
      travel_intelligence: {
        category: 'Tropical Island',
        travel_summary: 'Famed Indonesian island known for its forested volcanic mountains, iconic rice paddies, beaches, and coral reefs.',
        best_season: 'Dry Season (May–October)',
        recommended_window: 'May–September',
        recommended_reason: 'Warm temperatures (24°C–28°C) and minimal rainfall (45 mm/mo), ideal for travel.',
        temperature_range: '24°C–28°C',
        weather_basis: 'based on historical weather',
        weather_source: 'Open-Meteo Historical Weather',
        recommended_trip_days: '5-7 Days',
        season_cards: [
          {
            name: 'Dry Season',
            months: 'May–October',
            avg_temp_range: '24°C–28°C',
            avg_rainfall: '45 mm/mo',
            description: 'Lowest rainfall and sunny skies; optimal conditions for exploring and outdoor activities.',
          },
          {
            name: 'Wet Season',
            months: 'November–April',
            avg_temp_range: '25°C–30°C',
            avg_rainfall: '240 mm/mo',
            description: 'Tropical downpours and lush landscapes; higher humidity with occasional afternoon storms.',
          },
        ],
        budget_model: {
          tiers: {
            budget: {
              name: 'Budget',
              style: 'Hostel / budget guesthouse, street food & local diners, public transit',
              total_usd: 21,
              total_local: 327600,
              total_inr: 1994,
              breakdown_usd: { stay: 9, food: 6, local_transport: 2, activities: 2, buffer: 2 },
              breakdown_local: { stay: 140400, food: 93600, local_transport: 31200, activities: 31200, buffer: 31200 },
              breakdown_inr: { stay: 854, food: 570, local_transport: 190, activities: 190, buffer: 190 },
            },
            mid_range: {
              name: 'Mid-range',
              style: '3-star hotel / boutique stay, sit-down local restaurants, mix of taxis & transit',
              total_usd: 55,
              total_local: 858000,
              total_inr: 5222,
              breakdown_usd: { stay: 27, food: 15, local_transport: 5, activities: 4, buffer: 4 },
              breakdown_local: { stay: 421200, food: 234000, local_transport: 78000, activities: 62400, buffer: 62400 },
              breakdown_inr: { stay: 2563, food: 1424, local_transport: 475, activities: 380, buffer: 380 },
            },
            comfortable: {
              name: 'Comfortable',
              style: '4-star / upscale resort, curated dining, private transport & guided activities',
              total_usd: 118,
              total_local: 1840800,
              total_inr: 11203,
              breakdown_usd: { stay: 63, food: 29, local_transport: 11, activities: 8, buffer: 7 },
              breakdown_local: { stay: 982800, food: 452400, local_transport: 171600, activities: 124800, buffer: 109200 },
              breakdown_inr: { stay: 5981, food: 2753, local_transport: 1044, activities: 760, buffer: 665 },
            },
          },
          local_currency: 'IDR',
          rate_date: '2026-10-23',
          per_person: true,
          accommodation_included: true,
          exclusions: ['International and domestic flights', 'Visas and entry permits'],
          assumed_style: {
            budget: 'Hostel / budget guesthouse, street food & local diners, public transit',
            mid_range: '3-star hotel / boutique stay, sit-down local restaurants, mix of taxis & transit',
            comfortable: '4-star / upscale resort, curated dining, private transport & guided activities',
          },
          disclaimer: 'Estimate from national price levels; not city-specific or live',
          price_level_ratio: 0.42,
          world_bank_indicator: 'PA.NUS.PPPC.RF',
        },
        travel_tips: [
          'Dress respectfully with a sarong and sash when entering any temple grounds.',
          'Rent a scooter only if experienced with Bali traffic and holding an International Driving Permit.',
        ],
      },
      nearby_places: [],
      performance: { total_seconds: 1.95 },
    },
  },

  // -------------------------------------------------------------
  // 4. Paris, France
  // -------------------------------------------------------------
  paris: {
    id: 'paris',
    label: 'Paris (France)',
    badge: 'European Capital',
    description: 'Validates European destination formatting ("Paris, France"), sourced overview, and EUR/INR budget.',
    primaryPlaceId: 'fixture_paris_city',
    primaryPlaceName: 'Paris',
    sourceUrl: 'https://www.instagram.com/reel/C8sampleParisReel/',
    data: {
      success: true,
      best_guess: {
        place_id: 'fixture_paris_city',
        name: 'Paris',
        city: 'Paris',
        region: 'Île-de-France',
        country: 'France',
        formatted_address: 'Paris, Île-de-France, France',
        latitude: 48.8566,
        longitude: 2.3522,
        rating: 4.8,
        user_ratings_total: 98000,
        confidence: 98,
        confidence_level: 'VERY_HIGH',
        verification_status: 'VERIFIED',
        gemini_confidence: 0.98,
        gemini_reason: 'Identified Haussmannian boulevard facades and Seine river bridges.',
        why: 'Eiffel Tower and Seine riverbank UNESCO boundary confirmed.',
        types: ['capital_city', 'locality', 'political'],
        photos: [
          {
            url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4b/La_Tour_Eiffel_vue_de_la_Tour_Saint-Jacques%2C_Paris_ao%C3%BBt_2014_%282%29.jpg/1600px-La_Tour_Eiffel_vue_de_la_Tour_Saint-Jacques%2C_Paris_ao%C3%BBt_2014_%282%29.jpg',
            author: 'DXR (Wikimedia Commons, CC BY-SA 3.0)',
            photo_tier: 'wikidata_p18',
          },
        ],
        maps_url: 'https://maps.google.com/?q=Paris',
        overview: {
          where: 'Capital city, France',
          size: '105 km²',
          main_city_landmark: 'Paris • Montmartre (130 m)',
          recognition: 'Paris, Banks of the Seine UNESCO (1991)',
          climate: 'Temperate oceanic • Annual avg 12.3°C • 650 mm rain',
        },
      },
      travel_intelligence: {
        category: 'Capital City',
        travel_summary: 'Major European city and global center for art, fashion, gastronomy, and culture.',
        best_season: 'Spring & Autumn',
        recommended_window: 'May–June & September–October',
        recommended_reason: 'Mild temperatures (15°C–22°C) and moderate precipitation (55 mm/mo).',
        temperature_range: '15°C–22°C',
        weather_basis: 'based on historical weather',
        weather_source: 'Open-Meteo Historical Weather',
        recommended_trip_days: '4-5 Days',
        season_cards: [
          {
            name: 'Spring',
            months: 'March–May',
            avg_temp_range: '9°C–19°C',
            avg_rainfall: '52 mm/mo',
            description: 'Parks in full bloom and sidewalk café terraces bustling with pleasant afternoon sun.',
          },
          {
            name: 'Autumn',
            months: 'September–November',
            avg_temp_range: '10°C–21°C',
            avg_rainfall: '58 mm/mo',
            description: 'Golden foliage along the Seine and fewer museum queues following peak summer.',
          },
        ],
        budget_model: {
          tiers: {
            budget: {
              name: 'Budget',
              style: 'Hostel / budget guesthouse, street food & local diners, public transit',
              total_usd: 53,
              total_local: 49,
              total_inr: 5032,
              breakdown_usd: { stay: 23, food: 16, local_transport: 5, activities: 5, buffer: 4 },
              breakdown_local: { stay: 21, food: 15, local_transport: 5, activities: 5, buffer: 3 },
              breakdown_inr: { stay: 2184, food: 1519, local_transport: 475, activities: 475, buffer: 379 },
            },
            mid_range: {
              name: 'Mid-range',
              style: '3-star hotel / boutique stay, sit-down local restaurants, mix of taxis & transit',
              total_usd: 137,
              total_local: 126,
              total_inr: 13007,
              breakdown_usd: { stay: 68, food: 37, local_transport: 13, activities: 11, buffer: 8 },
              breakdown_local: { stay: 63, food: 34, local_transport: 12, activities: 10, buffer: 7 },
              breakdown_inr: { stay: 6456, food: 3513, local_transport: 1234, activities: 1044, buffer: 760 },
            },
            comfortable: {
              name: 'Comfortable',
              style: '4-star / upscale resort, curated dining, private transport & guided activities',
              total_usd: 294,
              total_local: 270,
              total_inr: 27912,
              breakdown_usd: { stay: 158, food: 74, local_transport: 26, activities: 21, buffer: 15 },
              breakdown_local: { stay: 145, food: 68, local_transport: 24, activities: 19, buffer: 14 },
              breakdown_inr: { stay: 15001, food: 7026, local_transport: 2468, activities: 1994, buffer: 1423 },
            },
          },
          local_currency: 'EUR',
          rate_date: '2026-10-23',
          per_person: true,
          accommodation_included: true,
          exclusions: ['International and domestic flights', 'Visas and entry permits'],
          assumed_style: {
            budget: 'Hostel / budget guesthouse, street food & local diners, public transit',
            mid_range: '3-star hotel / boutique stay, sit-down local restaurants, mix of taxis & transit',
            comfortable: '4-star / upscale resort, curated dining, private transport & guided activities',
          },
          disclaimer: 'Estimate from national price levels; not city-specific or live',
          price_level_ratio: 1.05,
          world_bank_indicator: 'PA.NUS.PPPC.RF',
        },
        travel_tips: [
          'Purchase Navigo Easy transit passes for cost-effective Metro journeys.',
          'Book Louvre and Musée d’Orsay entry slots online at least two weeks ahead.',
        ],
      },
      nearby_places: [],
      performance: { total_seconds: 1.65 },
    },
  },

  // -------------------------------------------------------------
  // 5. Sparse Destination (Missing Modules Edge Case)
  // -------------------------------------------------------------
  sparse: {
    id: 'sparse',
    label: 'Sparse (Missing Data Case)',
    badge: 'Clean Omission',
    description: 'Minimal fields: name only, no overview lines, no tips, no budget model, no weather. Validates that absent sections are hidden without empty gaps.',
    primaryPlaceId: 'fixture_sparse_place',
    primaryPlaceName: 'Remote Viewpoint',
    sourceUrl: '',
    data: {
      success: true,
      best_guess: {
        place_id: 'fixture_sparse_place',
        name: 'Remote Viewpoint',
        formatted_address: 'Off-grid coordinates',
        latitude: 38.0,
        longitude: -4.0,
        rating: 0,
        user_ratings_total: 0,
        confidence: 45,
        confidence_level: 'LOW',
        verification_status: 'UNVERIFIED',
        gemini_confidence: 0.45,
        gemini_reason: '',
        why: '',
        types: [],
        photos: [],
        maps_url: '',
      },
      travel_intelligence: {},
      nearby_places: [],
    },
  },

  // -------------------------------------------------------------
  // 6. Failed-Photo Destination (Slideshow Fallback Case)
  // -------------------------------------------------------------
  failedPhoto: {
    id: 'failedPhoto',
    label: 'Failed Photo (Slideshow Fallback)',
    badge: 'Fallback Test',
    description: 'Complete travel dossier but empty photos[] array. Validates that the slideshow frame displays immediately and never retains previous destination photo.',
    primaryPlaceId: 'fixture_failed_photo',
    primaryPlaceName: 'Hidden Grotto Sanctuary',
    sourceUrl: 'https://www.instagram.com/reel/C8sampleFailedPhoto/',
    data: {
      success: true,
      best_guess: {
        place_id: 'fixture_failed_photo',
        name: 'Hidden Grotto Sanctuary',
        city: 'Zermatt',
        region: 'Valais',
        country: 'Switzerland',
        formatted_address: 'Zermatt, Valais, Switzerland',
        latitude: 45.9763,
        longitude: 7.7491,
        rating: 4.8,
        user_ratings_total: 1200,
        confidence: 88,
        confidence_level: 'HIGH',
        verification_status: 'VERIFIED',
        gemini_confidence: 0.88,
        gemini_reason: 'Identified alpine glacial grotto.',
        why: 'Glacial valley setting verified against alpine terrain maps.',
        types: ['natural_feature', 'tourist_attraction'],
        photos: [], // Deliberately empty to test graceful fallback
        maps_url: 'https://maps.google.com/?q=Zermatt',
        overview: {
          where: 'Alpine municipality, Switzerland',
          size: '242 km²',
          main_city_landmark: 'Zermatt • Dufourspitze (4,634 m)',
        },
      },
      travel_intelligence: {
        category: 'Alpine Nature',
        travel_summary: 'Remote glacier grotto nestled high above Zermatt valley.',
        best_season: 'June to September',
        recommended_trip_days: '1-2 Days',
        travel_tips: [
          'Wear crampons and insulated footwear when traversing glacial ice caverns.',
        ],
      },
      nearby_places: [],
    },
  },
};
