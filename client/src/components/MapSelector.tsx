import React from 'react';
import { LeafletMap } from './LeafletMap';

interface MapSelectorProps {
  initialLat: number;
  initialLng: number;
  addressData?: {
    address?: string;
    number?: string;
    neighborhood?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  };
  onLocationSelect: (lat: number, lng: number) => void;
}

function MapSelector({ initialLat, initialLng, addressData, onLocationSelect }: MapSelectorProps) {
  return (
    <LeafletMap
      initialLat={initialLat}
      initialLng={initialLng}
      addressData={addressData}
      onLocationSelect={onLocationSelect}
    />
  );
}

export default MapSelector;