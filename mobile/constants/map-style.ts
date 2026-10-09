/**
 * VAMO — Dark Leaning Muted Map Style for Google Maps (Android)
 *
 * Muted, dark-leaning palette matching VAMO Atmosphere:
 * - Canvas & Land: Deep Onyx-Teal tones (#0A151D, #081218)
 * - Water: Deep aquatic teal (#061017)
 * - Roads: Subtle muted slate arteries (#15232D, #1C2E3B)
 * - Typography & Labels: Muted readable slate (#768A96)
 * - POIs: Stripped of generic bright colored pins
 */

export const DARK_MUTED_MAP_STYLE = [
  {
    elementType: 'geometry',
    stylers: [{ color: '#0A151D' }],
  },
  {
    elementType: 'labels.text.fill',
    stylers: [{ color: '#7E929E' }],
  },
  {
    elementType: 'labels.text.stroke',
    stylers: [{ color: '#081218' }, { weight: 2 }],
  },
  {
    featureType: 'administrative',
    elementType: 'geometry',
    stylers: [{ color: '#1B2E3B' }],
  },
  {
    featureType: 'administrative.country',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#253E4E' }],
  },
  {
    featureType: 'administrative.province',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#1E3342' }],
  },
  {
    featureType: 'landscape',
    elementType: 'geometry',
    stylers: [{ color: '#0B1720' }],
  },
  {
    featureType: 'poi',
    elementType: 'geometry',
    stylers: [{ color: '#0E1D28' }],
  },
  {
    featureType: 'poi',
    elementType: 'labels',
    stylers: [{ visibility: 'off' }],
  },
  {
    featureType: 'poi.park',
    elementType: 'geometry',
    stylers: [{ color: '#0C1C24' }],
  },
  {
    featureType: 'road',
    elementType: 'geometry',
    stylers: [{ color: '#142531' }],
  },
  {
    featureType: 'road',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#687B86' }],
  },
  {
    featureType: 'road.arterial',
    elementType: 'geometry',
    stylers: [{ color: '#182C3A' }],
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry',
    stylers: [{ color: '#213A4D' }],
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#142633' }],
  },
  {
    featureType: 'transit',
    elementType: 'geometry',
    stylers: [{ color: '#11222E' }],
  },
  {
    featureType: 'transit.station',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#6F8491' }],
  },
  {
    featureType: 'water',
    elementType: 'geometry',
    stylers: [{ color: '#050D13' }],
  },
  {
    featureType: 'water',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#4D6472' }],
  },
];
