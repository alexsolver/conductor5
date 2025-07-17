import { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, MapPin, Crosshair } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

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

interface SearchResult {
  display_name: string;
  lat: string;
  lon: string;
  importance: number;
}

function MapSelector({ initialLat, initialLng, addressData, onLocationSelect }: MapSelectorProps) {
  const [selectedLat, setSelectedLat] = useState(initialLat);
  const [selectedLng, setSelectedLng] = useState(initialLng);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [hasInitialized, setHasInitialized] = useState(false);
  const mapRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Initialize search query with address data if available
  useEffect(() => {
    if (addressData && !hasInitialized) {
      const addressParts = [
        addressData.address,
        addressData.number,
        addressData.neighborhood,
        addressData.city,
        addressData.state
      ].filter(Boolean);
      
      if (addressParts.length > 0) {
        const fullAddress = addressParts.join(', ');
        setSearchQuery(fullAddress);
        setHasInitialized(true);
        
        // Try local search for the city
        if (addressData.city) {
          const localResult = searchLocalCities(addressData.city);
          if (localResult) {
            setSelectedLat(localResult.lat);
            setSelectedLng(localResult.lng);
          }
        }
      }
    }
  }, [addressData, hasInitialized]);

  // Search for locations using local lookup first, then API fallback
  const searchLocationByQuery = async (query: string) => {
    if (!query.trim()) return;

    setIsSearching(true);
    try {
      // First try local city lookup for common Brazilian cities
      const localResult = searchLocalCities(query);
      if (localResult) {
        setSelectedLat(localResult.lat);
        setSelectedLng(localResult.lng);
        
        toast({
          title: "Local encontrado",
          description: `${localResult.name} - Coordenadas aproximadas`
        });
        return;
      }

      // If no local match, try external API with timeout
      console.log('Tentando busca externa para:', query);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      const searchUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&countrycodes=br&addressdetails=1`;
      
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
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const results: SearchResult[] = await response.json();
      console.log('Resultados da busca externa:', results);
      
      if (results.length > 0) {
        const bestResult = results[0];
        const lat = parseFloat(bestResult.lat);
        const lng = parseFloat(bestResult.lon);
        
        if (isNaN(lat) || isNaN(lng)) {
          throw new Error('Coordenadas inválidas recebidas');
        }
        
        setSelectedLat(lat);
        setSelectedLng(lng);
        
        toast({
          title: "Local encontrado",
          description: bestResult.display_name || 'Localização encontrada'
        });
      } else {
        toast({
          title: "Nenhum resultado",
          description: "Não foi possível encontrar o endereço. Tente uma busca mais específica ou clique no mapa.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.warn('Erro na busca externa:', error);
      
      toast({
        title: "Erro na busca",
        description: "Erro ao conectar com o serviço de busca. Tente novamente ou clique no mapa para selecionar manualmente.",
        variant: "destructive"
      });
    } finally {
      setIsSearching(false);
    }
  };

  // Local city database for common Brazilian locations
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

  const searchLocation = () => searchLocationByQuery(searchQuery);

  // Get current location using browser geolocation
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
        
        setSelectedLat(lat);
        setSelectedLng(lng);
        
        toast({
          title: "Localização atual obtida",
          description: `Lat: ${lat.toFixed(6)}, Lng: ${lng.toFixed(6)}`
        });
      },
      (error) => {
        console.error('Erro ao obter localização:', error.message || error);
        toast({
          title: "Erro na geolocalização",
          description: "Não foi possível obter sua localização atual.",
          variant: "destructive"
        });
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      }
    );
  };

  const handleMapClick = (event: React.MouseEvent<HTMLDivElement>) => {
    const rect = mapRef.current?.getBoundingClientRect();
    if (!rect) return;

    // Calculate relative position in the map
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    // Convert to lat/lng (simplified calculation for demo)
    // In a real implementation, you'd use proper map projection calculations
    const mapWidth = rect.width;
    const mapHeight = rect.height;
    
    // Simple linear mapping for demonstration (Brazil bounds approximately)
    const minLat = -35;
    const maxLat = 5;
    const minLng = -75;
    const maxLng = -30;
    
    const lat = maxLat - (y / mapHeight) * (maxLat - minLat);
    const lng = minLng + (x / mapWidth) * (maxLng - minLng);
    
    setSelectedLat(lat);
    setSelectedLng(lng);
  };

  const handleConfirmSelection = () => {
    onLocationSelect(selectedLat, selectedLng);
  };

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="flex gap-2">
        <div className="flex-1 flex gap-2">
          <Input
            placeholder="Buscar endereço ou local..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && searchLocation()}
          />
          <Button
            type="button"
            variant="outline"
            onClick={searchLocation}
            disabled={isSearching}
          >
            <Search className="h-4 w-4" />
          </Button>
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={getCurrentLocation}
        >
          <Crosshair className="h-4 w-4 mr-2" />
          Minha Localização
        </Button>
      </div>

      {/* Map Container */}
      <div className="relative border rounded-lg overflow-hidden bg-gradient-to-br from-blue-50 to-green-50">
        <div
          ref={mapRef}
          className="w-full h-96 cursor-crosshair relative"
          onClick={handleMapClick}
          style={{
            backgroundImage: `
              linear-gradient(90deg, rgba(59, 130, 246, 0.1) 1px, transparent 1px),
              linear-gradient(180deg, rgba(59, 130, 246, 0.1) 1px, transparent 1px),
              linear-gradient(135deg, #dbeafe 25%, transparent 25%, transparent 75%, #dbeafe 75%, #dbeafe),
              linear-gradient(45deg, #dcfce7 25%, transparent 25%, transparent 75%, #dcfce7 75%, #dcfce7)
            `,
            backgroundSize: '20px 20px, 20px 20px, 80px 80px, 80px 80px',
            backgroundPosition: '0 0, 0 0, 0 0, 40px 40px'
          }}
        >
          {/* Coordinate grid */}
          <div className="absolute inset-0 opacity-30">
            <svg className="w-full h-full">
              <defs>
                <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#6b7280" strokeWidth="0.5"/>
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />
            </svg>
          </div>

          {/* Brasil outline simulation */}
          <div className="absolute inset-4 opacity-20">
            <svg viewBox="0 0 400 400" className="w-full h-full">
              <path
                d="M50 150 C50 120, 80 100, 120 110 L180 120 C220 125, 250 140, 280 160 L320 180 C340 190, 350 210, 340 240 L330 280 C325 320, 300 340, 270 350 L200 360 C160 365, 120 350, 100 320 L80 280 C70 250, 60 200, 50 150 Z"
                fill="#10b981"
                stroke="#059669"
                strokeWidth="2"
              />
            </svg>
          </div>

          {/* Selected location marker */}
          <div
            className="absolute transform -translate-x-1/2 -translate-y-full z-20 transition-all duration-300"
            style={{
              left: `${Math.max(5, Math.min(95, ((selectedLng + 75) / 45) * 100))}%`,
              top: `${Math.max(5, Math.min(95, ((5 - selectedLat) / 40) * 100))}%`
            }}
          >
            <div className="relative">
              <MapPin className="h-8 w-8 text-red-500 drop-shadow-lg animate-bounce" />
              <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-4 h-4 bg-red-500 rounded-full opacity-30 animate-ping"></div>
            </div>
          </div>

          {/* Instructions overlay */}
          <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-sm rounded-lg p-3 shadow-lg border">
            <p className="text-sm text-gray-700 flex items-center font-medium">
              <MapPin className="h-4 w-4 mr-2 text-red-500" />
              Clique no mapa para selecionar uma localização
            </p>
          </div>

          {/* Compass */}
          <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-sm rounded-lg p-2 shadow-lg border">
            <div className="w-8 h-8 flex items-center justify-center">
              <div className="w-6 h-6 border-2 border-gray-400 rounded-full flex items-center justify-center">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
              </div>
            </div>
            <p className="text-xs text-center mt-1 text-gray-600">N</p>
          </div>
        </div>
      </div>

      {/* Coordinates Display */}
      <div className="flex gap-4 text-sm text-gray-600">
        <div className="flex items-center gap-2">
          <span className="font-medium">Latitude:</span>
          <span className="font-mono">{selectedLat.toFixed(6)}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-medium">Longitude:</span>
          <span className="font-mono">{selectedLng.toFixed(6)}</span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            setSelectedLat(initialLat);
            setSelectedLng(initialLng);
          }}
        >
          Resetar
        </Button>
        <Button
          type="button"
          onClick={handleConfirmSelection}
        >
          Confirmar Localização
        </Button>
      </div>
    </div>
  );
}

export default MapSelector;