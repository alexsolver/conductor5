import React, { useState, useRef, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import { Search, Navigation, Plus, Minus, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import L from 'leaflet';
// import { useLocalization } from '@/hooks/useLocalization';

// Fix for default markers in React Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface LeafletMapSelectorProps {
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

interface SearchResult {
  display_name: string;
  lat: string;
  lon: string;
  boundingbox: [string, string, string, string];
}

// Component to handle map clicks
function MapClickHandler({
  // Localization temporarily disabled
 onLocationSelect }: { onLocationSelect: (lat: number, lng: number) => void }) {
  useMapEvents({
    click: (e) => {
      const { lat, lng } = e.latlng;
      onLocationSelect(lat, lng);
    },
  });
  return null;
}

// Component to control map programmatically
function MapController({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  
  useEffect(() => {
    map.setView(center, zoom);
  }, [map, center, zoom]);
  
  return null;
}

export default function LeafletMapSelector({ initialLat, initialLng, addressData, onLocationSelect }: LeafletMapSelectorProps) {
  const [selectedLat, setSelectedLat] = useState(initialLat);
  const [selectedLng, setSelectedLng] = useState(initialLng);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [mapCenter, setMapCenter] = useState<[number, number]>([initialLat, initialLng]);
  const [zoomLevel, setZoomLevel] = useState(10);
  const [searchResult, setSearchResult] = useState<string>('');
  const mapRef = useRef<L.Map | null>(null);
  const { toast } = useToast();

  // Initialize search query with address data
  useEffect(() => {
    if (addressData) {
      const addressParts = [
        addressData.address,
        addressData.number,
        addressData.neighborhood,
        addressData.city,
        addressData.state
      ].filter(Boolean);
      
      if (addressParts.length > 0) {
        setSearchQuery(addressParts.join(', '));
      }
    }
  }, [addressData]);

  const handleLocationSelect = (lat: number, lng: number) => {
    setSelectedLat(lat);
    setSelectedLng(lng);
    setMapCenter([lat, lng]);
    setZoomLevel(16); // Zoom closer when location is selected
    onLocationSelect(lat, lng);
  };

  const searchLocation = async () => {
    if (!searchQuery.trim()) {
      toast({
        title: "Campo vazio",
        description: "Digite um endereço para buscar",
        variant: "destructive"
      });
      return;
    }

    setIsSearching(true);
    try {
      // Search using Nominatim API
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);
      
      const searchUrl = "&limit=5&countrycodes=br&addressdetails=1`;
      
      const response = await fetch(searchUrl, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'LocationApp/1.0',
          'Accept': 'application/json',
          'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8'
        }
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error("
      }

      const results: SearchResult[] = await response.json();
      
      if (results.length > 0) {
        const bestResult = results[0];
        const lat = parseFloat(bestResult.lat);
        const lng = parseFloat(bestResult.lon);
        
        if (isNaN(lat) || isNaN(lng)) {
          throw new Error('Coordenadas inválidas recebidas');
        }
        
        handleLocationSelect(lat, lng);
        setSearchResult(bestResult.display_name || 'Localização encontrada');
        
        toast({
          title: "Local encontrado",
          description: bestResult.display_name || 'Localização encontrada'
        });
      } else {
        toast({
          title: "Local não encontrado",
          description: "Tente uma busca mais específica ou use uma cidade conhecida",
          variant: "destructive"
        });
      }
    } catch (error: any) {
      console.error('[TRANSLATION_NEEDED]', error);
      
      if (error.name === 'AbortError') {
        toast({
          title: "Tempo esgotado",
          description: "A busca demorou muito. Tente novamente.",
          variant: "destructive"
        });
      } else {
        toast({
          title: '[TRANSLATION_NEEDED]',
          description: "Não foi possível buscar o endereço. Verifique sua conexão.",
          variant: "destructive"
        });
      }
    } finally {
      setIsSearching(false);
    }
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast({
        title: "Geolocalização não suportada",
        description: "Seu navegador não suporta geolocalização.",
        variant: "destructive"
      });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        
        handleLocationSelect(lat, lng);
        setSearchResult('Localização atual (GPS)');
        
        toast({
          title: "Localização atual",
          description: "
        });
      },
      (error) => {
        console.error('[TRANSLATION_NEEDED]', error.message || error);
        toast({
          title: '[TRANSLATION_NEEDED]',
          description: "Não foi possível obter sua localização atual.",
          variant: "destructive"
        });
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  const resetView = () => {
    setMapCenter([-15.7942, -47.8825]); // Brasília center
    setZoomLevel(6);
    setSearchResult('');
    setSearchQuery('');
  };

  return (
    <div className="w-full space-y-4">
      {/* Search Controls */}
      <div className="flex gap-2">
        <div className="flex-1">
          <Input
            placeholder="Digite um endereço completo..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                searchLocation();
              }
            }}
          />
        </div>
        <Button
          type="button"
          onClick={searchLocation}
          disabled={isSearching}
          size="default"
        >
          <Search className="h-4 w-4 mr-2" />
          {isSearching ? 'Buscando...' : 'Encontrar'}
        </Button>
        <Button
          type="button"
          onClick={getCurrentLocation}
          variant="outline"
          size="default"
        >
          <Navigation className="h-4 w-4 mr-2" />
          GPS
        </Button>
        <Button
          type="button"
          onClick={resetView}
          variant="outline"
          size="default"
        >
          <RotateCcw className="h-4 w-4 mr-2" />
          Reset
        </Button>
      </div>

      {/* Map Container */}
      <div className="relative border rounded-lg overflow-hidden" style={{ height: '400px' }}>
        <MapContainer
          center={mapCenter}
          zoom={zoomLevel}
          style={{ height: '100%', width: '100%' }}
          ref={mapRef}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          <MapController center={mapCenter} zoom={zoomLevel} />
          <MapClickHandler onLocationSelect={handleLocationSelect} />
          
          <Marker position={[selectedLat, selectedLng]}>
            <Popup>
              <div className="text-center">
                <p className="font-medium">Localização Selecionada</p>
                <p className="text-sm text-gray-600">
                  Lat: {selectedLat.toFixed(6)}<br />
                  Lng: {selectedLng.toFixed(6)}
                </p>
                {searchResult && (
                  <p className="text-sm text-gray-500 mt-1">{searchResult}</p>
                )}
              </div>
            </Popup>
          </Marker>
        </MapContainer>
        
        {/* Map Controls Overlay */}
        <div className="absolute top-4 right-4 z-[1000] flex flex-col gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setZoomLevel(prev => Math.min(prev + 2, 18))}
            className="w-8 h-8 p-0 bg-white/95 hover:bg-white shadow-md"
          >
            <Plus className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setZoomLevel(prev => Math.max(prev - 2, 3))}
            className="w-8 h-8 p-0 bg-white/95 hover:bg-white shadow-md"
          >
            <Minus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Location Info */}
      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Localização Selecionada
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Latitude: {selectedLat.toFixed(6)} | Longitude: {selectedLng.toFixed(6)}
        </p>
        {searchResult && (
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            <span className="font-medium">Encontrado:</span> {String(searchResult)}
          </p>
        )}
        <div className="flex items-center gap-2 mt-2">
          <span className="text-xs text-gray-500">Zoom: {zoomLevel}</span>
          <span className="text-xs text-gray-500">|</span>
          <span className="text-xs text-gray-500">
            Centro: {mapCenter[0].toFixed(2)}, {mapCenter[1].toFixed(2)}
          </span>
        </div>
        <p className="text-xs text-gray-500 mt-1">
          💡 Clique no mapa para selecionar uma localização ou use a busca acima
        </p>
      </div>
    </div>
  );
}