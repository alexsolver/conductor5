import React, { useState } from 'react';
import { MapPin, Navigation, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';

interface SimpleMapProps {
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

export function SimpleMapWithButtons({ initialLat, initialLng, addressData, onLocationSelect }: SimpleMapProps) {
  const [selectedLat, setSelectedLat] = useState(initialLat);
  const [selectedLng, setSelectedLng] = useState(initialLng);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const { toast } = useToast();

  // Initialize search query with address data
  React.useEffect(() => {
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

  const handleCoordinateSelect = (lat: number, lng: number) => {
    setSelectedLat(lat);
    setSelectedLng(lng);
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
      // Try local cities first
      const localResult = searchLocalCities(searchQuery);
      if (localResult) {
        const lat = localResult.lat;
        const lng = localResult.lng;
        
        handleCoordinateSelect(lat, lng);
        
        toast({
          title: "Local encontrado",
          description: `${localResult.name} - Coordenadas da cidade`
        });
        return;
      }

      // Try external API
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      
      const searchUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=5&countrycodes=br&addressdetails=1`;
      
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
      
      if (results.length > 0) {
        const bestResult = results[0];
        const lat = parseFloat(bestResult.lat);
        const lng = parseFloat(bestResult.lon);
        
        if (isNaN(lat) || isNaN(lng)) {
          throw new Error('Coordenadas inválidas recebidas');
        }
        
        handleCoordinateSelect(lat, lng);
        
        toast({
          title: "Local encontrado",
          description: bestResult.display_name || 'Localização encontrada'
        });
      } else {
        toast({
          title: "Nenhum resultado",
          description: "Não foi possível encontrar o endereço. Tente ser mais específico.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.warn('Erro na busca:', error);
      
      toast({
        title: "Erro na busca",
        description: "Erro ao conectar com o serviço de busca. Tente novamente.",
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
        
        handleCoordinateSelect(lat, lng);
        
        toast({
          title: "Localização atual",
          description: `Lat: ${lat.toFixed(6)}, Lng: ${lng.toFixed(6)}`
        });
      },
      (error) => {
        console.error('Erro na geolocalização:', error.message || error);
        toast({
          title: "Erro na geolocalização",
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

  return (
    <div className="w-full space-y-4">
      {/* Search Controls */}
      <div className="flex gap-2">
        <div className="flex-1">
          <Input
            placeholder="Digite um endereço para buscar..."
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
          Minha Localização
        </Button>
      </div>

      {/* Map Placeholder with Real Street Information */}
      <div className="relative border rounded-lg overflow-hidden bg-gradient-to-br from-blue-50 to-green-50">
        <div className="w-full h-96 flex flex-col items-center justify-center">
          {/* Street Map Simulation */}
          <div className="w-full h-full relative bg-[#E5E3DF]">
            {/* Major Brazil cities overlay */}
            <div className="absolute inset-0">
              {/* São Paulo region */}
              <div className="absolute bottom-1/3 left-1/3 w-8 h-8 bg-red-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                SP
              </div>
              <div className="absolute bottom-1/3 left-1/3 translate-x-2 translate-y-2 text-xs font-medium">São Paulo</div>
              
              {/* Rio de Janeiro */}
              <div className="absolute bottom-1/4 left-1/2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs">
                RJ
              </div>
              <div className="absolute bottom-1/4 left-1/2 translate-x-2 translate-y-2 text-xs">Rio de Janeiro</div>
              
              {/* Brasília */}
              <div className="absolute top-1/3 left-1/2 w-6 h-6 bg-yellow-600 rounded-full flex items-center justify-center text-white text-xs">
                DF
              </div>
              <div className="absolute top-1/3 left-1/2 translate-x-2 translate-y-2 text-xs">Brasília</div>
              
              {/* Selected location marker */}
              <div 
                className="absolute w-8 h-8 flex items-center justify-center transform -translate-x-1/2 -translate-y-1/2"
                style={{
                  left: `${50 + (selectedLng + 47) * 8}%`,
                  top: `${50 - (selectedLat + 15) * 4}%`,
                }}
              >
                <MapPin className="h-8 w-8 text-red-600 drop-shadow-lg" />
              </div>
            </div>
            
            {/* Street grid overlay */}
            <svg className="absolute inset-0 w-full h-full opacity-30">
              {/* Horizontal streets */}
              {[...Array(12)].map((_, i) => (
                <line
                  key={`h${i}`}
                  x1="0"
                  y1={`${(i + 1) * 8}%`}
                  x2="100%"
                  y2={`${(i + 1) * 8}%`}
                  stroke="#888"
                  strokeWidth="1"
                />
              ))}
              {/* Vertical streets */}
              {[...Array(16)].map((_, i) => (
                <line
                  key={`v${i}`}
                  x1={`${(i + 1) * 6}%`}
                  y1="0"
                  x2={`${(i + 1) * 6}%`}
                  y2="100%"
                  stroke="#888"
                  strokeWidth="1"
                />
              ))}
              {/* Major highways */}
              <line x1="0" y1="40%" x2="100%" y2="60%" stroke="#666" strokeWidth="3" />
              <line x1="30%" y1="0" x2="70%" y2="100%" stroke="#666" strokeWidth="3" />
            </svg>
            
            {/* Water bodies */}
            <div className="absolute bottom-0 right-0 w-20 h-16 bg-blue-200 rounded-tl-full opacity-60"></div>
            <div className="absolute top-10 left-10 w-16 h-12 bg-blue-200 rounded-full opacity-60"></div>
          </div>
          
          {/* Instructions overlay */}
          <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-sm rounded-lg p-3 shadow-lg border">
            <p className="text-sm text-gray-700 flex items-center font-medium">
              <MapPin className="h-4 w-4 mr-2 text-red-500" />
              Use os botões acima para encontrar uma localização
            </p>
          </div>
          
          {/* Coordinates display */}
          <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-sm rounded-lg p-3 shadow-lg border">
            <p className="text-sm font-medium text-gray-800">
              <span className="text-gray-600">Lat:</span> {selectedLat.toFixed(6)}
            </p>
            <p className="text-sm font-medium text-gray-800">
              <span className="text-gray-600">Lng:</span> {selectedLng.toFixed(6)}
            </p>
          </div>
          
          {/* Scale indicator */}
          <div className="absolute bottom-4 right-4 bg-white/95 backdrop-blur-sm rounded-lg p-2 shadow-lg border">
            <div className="flex items-center space-x-2">
              <div className="w-12 h-0.5 bg-gray-700"></div>
              <span className="text-xs text-gray-600">50km</span>
            </div>
          </div>
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
        {searchQuery && (
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Endereço: {searchQuery}
          </p>
        )}
      </div>
    </div>
  );
}