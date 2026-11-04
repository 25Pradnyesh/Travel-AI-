export interface HeroPhoto {
  id: string;
  name: string;
  location: string;
  src: string;
  alt: string;
  width: number;
  height: number;
  objectPosition?: string;
}

export const HERO_PHOTOS: HeroPhoto[] = [
  {
    id: 'giza-pyramids',
    name: 'Elephants in the River',
    location: 'Wildlife Sanctuary',
    src: '/photos/giza-pyramids.webp',
    alt: 'Elephants bathing peacefully in a flowing river surrounded by lush tropical greenery',
    width: 734,
    height: 413,
    objectPosition: 'center 50%',
  },
  {
    id: 'norwegian-fjords',
    name: 'Geirangerfjord & Cliffs',
    location: 'Sunnmøre, Norway',
    src: '/photos/norwegian-fjords.webp',
    alt: 'Deep blue glacial fjord waters cutting through dramatic sheer green mountains in Norway',
    width: 735,
    height: 490,
    objectPosition: 'center 45%',
  },
  {
    id: 'faroe-islands',
    name: 'Kallur & Ocean Cliffs',
    location: 'Faroe Islands, North Atlantic',
    src: '/photos/faroe-islands.webp',
    alt: 'Emerald green sea cliffs plunging into the North Atlantic ocean in the Faroe Islands',
    width: 736,
    height: 490,
    objectPosition: 'center 40%',
  },
  {
    id: 'jeju-island',
    name: 'Seongsan Ilchulbong',
    location: 'Jeju Island, South Korea',
    src: '/photos/jeju-island.webp',
    alt: 'Volcanic tuff cone crater of Seongsan Ilchulbong rising above the turquoise sea in Jeju',
    width: 735,
    height: 490,
    objectPosition: 'center 45%',
  },
  {
    id: 'ladakh-himalayas',
    name: 'Himalayan Pass & Stupa',
    location: 'Ladakh, India',
    src: '/photos/ladakh-himalayas.webp',
    alt: 'Panoramic vista of a high-altitude Himalayan mountain road leading to a Buddhist stupa under deep blue sky in Ladakh',
    width: 1308,
    height: 736,
    objectPosition: 'center 50%',
  },
  {
    id: 'moorea-island',
    name: 'Moorea Lagoon & Peaks',
    location: 'Moorea, French Polynesia',
    src: '/photos/moorea-island.webp',
    alt: 'Pristine turquoise lagoon water fringed by palm trees and dramatic volcanic mountain spires on Moorea',
    width: 736,
    height: 420,
    objectPosition: 'center 45%',
  },
  {
    id: 'paris-eiffel',
    name: 'Eiffel Tower & Seine',
    location: 'Paris, France',
    src: '/photos/paris-eiffel.webp',
    alt: 'Eiffel Tower reaching into the Parisian afternoon sky overlooking the Seine river',
    width: 735,
    height: 490,
    objectPosition: 'center 30%',
  },
  {
    id: 'rio-de-janeiro',
    name: 'Corcovado & Guanabara Bay',
    location: 'Rio de Janeiro, Brazil',
    src: '/photos/rio-de-janeiro.webp',
    alt: 'Panoramic aerial view of Corcovado, Sugarloaf Mountain, and Guanabara Bay in Rio de Janeiro',
    width: 735,
    height: 490,
    objectPosition: 'center 30%',
  },
  {
    id: 'swiss-alps',
    name: 'Swiss Alpine Summits',
    location: 'Bernese Oberland, Switzerland',
    src: '/photos/swiss-alps.webp',
    alt: 'Majestic snow-capped alpine peaks and ridges towering over alpine valleys in Switzerland',
    width: 735,
    height: 490,
    objectPosition: 'center 40%',
  },
  {
    id: 'arctic-aurora',
    name: 'Arctic Aurora & Fjords',
    location: 'Lofoten, Norway',
    src: '/photos/arctic-aurora.webp',
    alt: 'Emerald ribbons of the Northern Lights shimmering above snowy Arctic peaks and fjords',
    width: 735,
    height: 413,
    objectPosition: 'center 35%',
  },
];
