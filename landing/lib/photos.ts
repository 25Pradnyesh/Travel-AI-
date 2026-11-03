export interface HeroPhoto {
  id: string;
  name: string;
  location: string;
  src: string;
  alt: string;
}

export const HERO_PHOTOS: HeroPhoto[] = [
  {
    id: 'rome-colosseum',
    name: 'Colosseum at Sunset',
    location: 'Rome, Italy',
    src: '/photos/rome-colosseum.webp',
    alt: 'Golden hour sunlight warming the ancient arches of the Colosseum in Rome',
  },
  {
    id: 'interlaken-switzerland',
    name: 'Lake Brienz & Bernese Alps',
    location: 'Interlaken, Switzerland',
    src: '/photos/interlaken-switzerland.webp',
    alt: 'Turquoise alpine waters of Lake Brienz with snow-capped Bernese Alps in Interlaken',
  },
  {
    id: 'kyoto-pagoda',
    name: 'Higashiyama & Yasaka Pagoda',
    location: 'Kyoto, Japan',
    src: '/photos/kyoto-pagoda.webp',
    alt: 'Historic tiled streets and Yasaka Pagoda rising over Kyoto at dusk',
  },
  {
    id: 'faroe-islands',
    name: 'Kallur & Ocean Cliffs',
    location: 'Faroe Islands, North Atlantic',
    src: '/photos/faroe-islands.webp',
    alt: 'Emerald green sea cliffs plunging into the North Atlantic ocean in the Faroe Islands',
  },
  {
    id: 'paris-eiffel',
    name: 'Eiffel Tower & Seine',
    location: 'Paris, France',
    src: '/photos/paris-eiffel.webp',
    alt: 'Eiffel Tower reaching into the afternoon Parisian sky overlooking the Seine',
  },
  {
    id: 'rio-de-janeiro',
    name: 'Corcovado & Guanabara Bay',
    location: 'Rio de Janeiro, Brazil',
    src: '/photos/rio-de-janeiro.webp',
    alt: 'Panoramic aerial view of Corcovado, Sugarloaf Mountain, and Guanabara Bay in Rio',
  },
  {
    id: 'arctic-aurora',
    name: 'Arctic Aurora & Fjords',
    location: 'Lofoten, Norway',
    src: '/photos/arctic-aurora.webp',
    alt: 'Emerald ribbons of the Northern Lights shimmering above snowy Arctic peaks and fjords',
  },
  {
    id: 'london-westminster',
    name: 'Palace of Westminster & Big Ben',
    location: 'London, United Kingdom',
    src: '/photos/london-westminster.webp',
    alt: 'Victorian Gothic architecture of the Houses of Parliament and Big Ben along the Thames',
  },
  {
    id: 'sardinia-san-pietro',
    name: 'Isola di San Pietro',
    location: 'Sardinia, Italy',
    src: '/photos/sardinia-san-pietro.webp',
    alt: 'Crystal Mediterranean waters and rugged coastal rocks of San Pietro Island',
  },
  {
    id: 'new-york-manhattan',
    name: 'Manhattan Skyline',
    location: 'New York City, USA',
    src: '/photos/new-york-manhattan.webp',
    alt: 'Manhattan skyscrapers and waterfront bathed in golden late afternoon sun',
  },
  {
    id: 'jeju-island',
    name: 'Seongsan Ilchulbong',
    location: 'Jeju Island, South Korea',
    src: '/photos/jeju-island.webp',
    alt: 'Volcanic tuff cone crater of Seongsan Ilchulbong rising above the East China Sea',
  },
  {
    id: 'giza-pyramids',
    name: 'Great Pyramids of Giza',
    location: 'Cairo, Egypt',
    src: '/photos/giza-pyramids.webp',
    alt: 'Timeless limestone pyramid silhouettes standing above golden Sahara desert sands',
  },
  {
    id: 'norwegian-fjords',
    name: 'Geirangerfjord',
    location: 'Sunnmøre, Norway',
    src: '/photos/norwegian-fjords.webp',
    alt: 'Deep blue glacial fjord waters cutting through dramatic sheer green mountains in Norway',
  },
];
