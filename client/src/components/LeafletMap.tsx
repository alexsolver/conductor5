import React, { useEffect, useRef, useState, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, Navigation, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
// import { useLocalization } from '@/hooks/useLocalization';

// Fix for default markers in Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjUiIGhlaWdodD0iNDEiIHZpZXdCb3g9IjAgMCAyNSA0MSIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEyLjUgMEMxOS40MDM2IDAgMjUgNS41OTY0NCAyNSAxMi41QzI1IDE5LjQwMzYgMTkuNDAzNiAyNSAxMi41IDI1QzUuNTk2NDQgMjUgMCAxOS40MDM2IDAgMTIuNUMwIDUuNTk2NDQgNS41OTY0NCAwIDEyLjUgMFoiIGZpbGw9IiNERjQ0NEEiLz4KPHBhdGggZD0iTTEyLjUgNUMxNS44MTM3IDUgMTguNSA3LjY4NjI5IDE4LjUgMTFDMTguNSAxNC4zMTM3IDE1LjgxMzcgMTcgMTIuNSAxN0M5LjE4NjI5IDE3IDYuNSAxNC4zMTM3IDYuNSAxMUM2LjUgNy42ODYyOSA5LjE4NjI5IDUgMTIuNSA1WiIgZmlsbD0id2hpdGUiLz4KPHBhdGggZD0iTTEyLjUgMjVMMTIuNSA0MSIgc3Ryb2tlPSIjREY0NDRBIiBzdHJva2Utd2lkdGg9IjIiLz4KPC9zdmc+',
  iconUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjUiIGhlaWdodD0iNDEiIHZpZXdCb3g9IjAgMCAyNSA0MSIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEyLjUgMEMxOS40MDM2IDAgMjUgNS41OTY0NCAyNSAxMi41QzI1IDE5LjQwMzYgMTkuNDAzNiAyNSAxMi41IDI1QzUuNTk2NDQgMjUgMCAxOS40MDM2IDAgMTIuNUMwIDUuNTk2NDQgNS41OTY0NCAwIDEyLjUgMFoiIGZpbGw9IiNERjQ0NEEiLz4KPHBhdGggZD0iTTEyLjUgNUMxNS44MTM3IDUgMTguNSA3LjY4NjI5IDE4LjUgMTFDMTguNSAxNC4zMTM3IDE1LjgxMzcgMTcgMTIuNSAxN0M5LjE4NjI5IDE3IDYuNSAxNC4zMTM3IDYuNSAxMUM2LjUgNy42ODYyOSA5LjE4NjI5IDUgMTIuNSA1WiIgZmlsbD0id2hpdGUiLz4KPHBhdGggZD0iTTEyLjUgMjVMMTIuNSA0MSIgc3Ryb2tlPSIjREY0NDRBIiBzdHJva2Utd2lkdGg9IjIiLz4KPC9zdmc+',
  shadowUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDEiIGhlaWdodD0iNDEiIHZpZXdCb3g9IjAgMCA0MSA0MSIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGVsbGlwc2UgY3g9IjIwLjUiIGN5PSIyMC41IiByeD0iMjAuNSIgcnk9IjIwLjUiIGZpbGw9ImJsYWNrIiBmaWxsLW9wYWNpdHk9IjAuMyIvPgo8L3N2Zz4K',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

interface LeafletMapProps {
  initialLat: number;
  initialLng: number;
  addressData?: {
    address?: string;
    number?: string;
    neighborhood?: string;
    city?: string;
    state?: string;
    zipCode?: string;
  };
  onLocationSelect: (lat: number, lng: number) => void;
}

interface SearchResult {
  display_name: string;
  lat: string;
  lon: string;
}

export function LeafletMap({
  // Localization temporarily disabled
 initialLat, initialLng, addressData, onLocationSelect }: LeafletMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [mapKey, setMapKey] = useState(0); // Force re-render key
  const { toast } = useToast();

  // Clean up function
  const cleanupMap = useCallback(() => {
    try {
      if (markerRef.current) {
        markerRef.current.remove();
        markerRef.current = null;
      }
      if (mapInstanceRef.current) {
        mapInstanceRef.current.off();
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    } catch (error) {
      console.warn('Cleanup error:', error);
    }
  }, []);

  // Initialize map
  useEffect(() => {
    if (!mapRef.current) return;

    // Clean up any existing map
    cleanupMap();

    let mounted = true;

    const initMap = () => {
      if (!mapRef.current || !mounted) return;

      try {
        // Create map instance
        const map = L.map(mapRef.current, {
          preferCanvas: true,
          zoomControl: true,
          attributionControl: true,
          fadeAnimation: false,
          zoomAnimation: false,
          markerZoomAnimation: false
        }).setView([initialLat, initialLng], 13);

        // Add tile layer
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors',
          maxZoom: 19,
          minZoom: 3
        }).addTo(map);

        // Add click handler
        map.on('click', (e) => {
          if (!mounted) return;
          const { lat, lng } = e.latlng;
          updateMarker(lat, lng);
          onLocationSelect(lat, lng);
        });

        mapInstanceRef.current = map;

        // Add initial marker
        updateMarker(initialLat, initialLng);

        // Force map to resize
        setTimeout(() => {
          if (mapInstanceRef.current && mounted) {
            mapInstanceRef.current.invalidateSize();
          }
        }, 100);
      } catch (error) {
        console.error('Map initialization error:', error);
      }
    };

    // Initialize with delay
    const timeoutId = setTimeout(initMap, 200);

    return () => {
      mounted = false;
      clearTimeout(timeoutId);
      cleanupMap();
    };
  }, [mapKey, initialLat, initialLng, cleanupMap]);

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

  const updateMarker = useCallback((lat: number, lng: number) => {
    if (!mapInstanceRef.current) return;

    try {
      // Remove existing marker
      if (markerRef.current) {
        mapInstanceRef.current.removeLayer(markerRef.current);
        markerRef.current = null;
      }

      // Add new marker
      const marker = L.marker([lat, lng], {
        riseOnHover: true
      })
        .addTo(mapInstanceRef.current)
        .bindPopup("
        .openPopup();

      markerRef.current = marker;
    } catch (error) {
      console.error('Marker update error:', error);
    }
  }, []);

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
      // Try local cities first
      const localResult = searchLocalCities(searchQuery);
      if (localResult) {
        const lat = localResult.lat;
        const lng = localResult.lng;
        
        updateMarker(lat, lng);
        onLocationSelect(lat, lng);
        
        if (mapInstanceRef.current) {
          mapInstanceRef.current.setView([lat, lng], 15);
        }
        
        toast({
          title: "Local encontrado",
          description: " - Coordenadas da cidade`
        });
        return;
      }

      // Try external API
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      
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
        
        updateMarker(lat, lng);
        onLocationSelect(lat, lng);
        
        if (mapInstanceRef.current) {
          mapInstanceRef.current.setView([lat, lng], 16);
        }
        
        toast({
          title: "Local encontrado",
          description: bestResult.display_name || 'Localização encontrada'
        });
      } else {
        toast({
          title: '[TRANSLATION_NEEDED]',
          description: "Não foi possível encontrar o endereço. Tente ser mais específico.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.warn('[TRANSLATION_NEEDED]', error);
      
      toast({
        title: '[TRANSLATION_NEEDED]',
        description: '[TRANSLATION_NEEDED]',
        variant: "destructive"
      });
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
        
        updateMarker(lat, lng);
        onLocationSelect(lat, lng);
        
        if (mapInstanceRef.current) {
          mapInstanceRef.current.setView([lat, lng], 16);
        }
        
        toast({
          title: "Localização atual",
          description: "
        });
      },
      (error) => {
        console.error('Geolocation error:', error.message || error);
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

  // Local city database
  const searchLocalCities = (query: string) => {
    const cities = [
      { name: 'São Paulo, SP', lat: -23.5505, lng: -46.6333, keywords: ['sao paulo', 'sp', 'sampa'] },
      { name: 'Rio de Janeiro, RJ', lat: -22.9068, lng: -43.1729, keywords: ['rio de janeiro', 'rj', 'rio'] },
      { name: 'Brasília, DF', lat: -15.7942, lng: -47.8825, keywords: ['brasilia', 'df', 'bsb'] },
      { name: 'Belo Horizonte, MG', lat: -19.9191, lng: -43.9378, keywords: ['belo horizonte', 'mg', 'bh'] },
      { name: 'Fortaleza, CE', lat: -3.7172, lng: -38.5433, keywords: ['fortaleza', 'ce'] },
      { name: 'Salvador, BA', lat: -12.9714, lng: -38.5014, keywords: ['salvador', 'ba'] },
      { name: 'Curitiba, PR', lat: -25.4284, lng: -49.2733, keywords: ['curitiba', 'pr'] },
      { name: 'Recife, PE', lat: -8.0476, lng: -34.8770, keywords: ['recife', 'pe'] },
      { name: 'Porto Alegre, RS', lat: -30.0346, lng: -51.2177, keywords: ['porto alegre', 'rs', 'poa'] },
      { name: 'Manaus, AM', lat: -3.1190, lng: -60.0217, keywords: ['manaus', 'am'] },
      { name: 'Osasco, SP', lat: -23.5329, lng: -46.7916, keywords: ['osasco'] },
      { name: 'Guarulhos, SP', lat: -23.4538, lng: -46.5333, keywords: ['guarulhos'] },
      { name: 'Campinas, SP', lat: -22.9099, lng: -47.0626, keywords: ['campinas'] },
      { name: 'Santos, SP', lat: -23.9618, lng: -46.3322, keywords: ['santos'] },
      { name: 'São Bernardo do Campo, SP', lat: -23.6914, lng: -46.5646, keywords: ['sao bernardo', 'bernardo'] }
    ];

    const queryLower = query.toLowerCase();
    
    for (const city of cities) {
      if (city.keywords.some(keyword => queryLower.includes(keyword))) {
        return city;
      }
    }
    
    return null;
  };

  // Force reset if we get errors
  const resetMap = () => {
    setMapKey(prev => prev + 1);
  };

  return (
    <div className="w-full space-y-4>
      {/* Search Controls */}
      <div className="flex gap-2>
        <div className="flex-1>
          <Input
            placeholder='[TRANSLATION_NEEDED]'
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && searchLocation()}
          />
        </div>
        <Button
          onClick={searchLocation}
          disabled={isSearching}
          size="default"
        >
          <Search className="h-4 w-4 mr-2" />
          {isSearching ? 'Buscando...' : 'Encontrar'}
        </Button>
        <Button
          onClick={getCurrentLocation}
          variant="outline"
          size="default"
        >
          <Navigation className="h-4 w-4 mr-2" />
          Minha Localização
        </Button>
        <Button
          onClick={resetMap}
          variant="outline"
          size="sm"
          title="Recarregar mapa"
        >
          ↻
        </Button>
      </div>

      {/* Map Container */}
      <div className="relative border rounded-lg overflow-hidden>
        <div
          key={mapKey}
          ref={mapRef}
          className="w-full h-96"
          style={{ minHeight: '384px' }}
        />
        
        {/* Instructions overlay */}
        <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-sm rounded-lg p-3 shadow-lg border z-[1000]>
          <p className="text-sm text-gray-700 flex items-center font-medium>
            <MapPin className="h-4 w-4 mr-2 text-red-500" />
            Clique no mapa para selecionar uma localização
          </p>
        </div>
      </div>
    </div>
  );
}