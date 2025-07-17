import { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, MapPin, Crosshair } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface MapSelectorProps {
  initialLat: number;
  initialLng: number;
  onLocationSelect: (lat: number, lng: number) => void;
}

interface SearchResult {
  display_name: string;
  lat: string;
  lon: string;
  importance: number;
}

function MapSelector({ initialLat, initialLng, onLocationSelect }: MapSelectorProps) {
  const [selectedLat, setSelectedLat] = useState(initialLat);
  const [selectedLng, setSelectedLng] = useState(initialLng);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const mapRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Search for locations using Nominatim API
  const searchLocation = async () => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=5&countrycodes=br&addressdetails=1`
      );
      
      if (!response.ok) {
        throw new Error('Falha na busca');
      }

      const results: SearchResult[] = await response.json();
      
      if (results.length > 0) {
        const bestResult = results[0];
        const lat = parseFloat(bestResult.lat);
        const lng = parseFloat(bestResult.lon);
        
        setSelectedLat(lat);
        setSelectedLng(lng);
        
        toast({
          title: "Local encontrado",
          description: bestResult.display_name
        });
      } else {
        toast({
          title: "Nenhum resultado",
          description: "Não foi possível encontrar o local pesquisado.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Erro na busca:', error);
      toast({
        title: "Erro na busca",
        description: "Erro ao buscar localização. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsSearching(false);
    }
  };

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
        console.error('Erro ao obter localização:', error);
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
      <div className="relative">
        <div
          ref={mapRef}
          className="w-full h-96 bg-gray-100 border rounded-lg cursor-crosshair relative overflow-hidden"
          onClick={handleMapClick}
          style={{
            backgroundImage: 'url(data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBmaWxsPSIjRjNGNEY2Ii8+CjxyZWN0IHg9IjAiIHk9IjAiIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCIgZmlsbD0iI0U1RTdFQiIvPgo8cmVjdCB4PSIyMCIgeT0iMjAiIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCIgZmlsbD0iI0U1RTdFQiIvPgo8L3N2Zz4K)',
            backgroundSize: '40px 40px'
          }}
        >
          {/* Grid overlay */}
          <div className="absolute inset-0 opacity-20">
            <div className="grid grid-cols-10 grid-rows-10 h-full w-full">
              {Array.from({ length: 100 }, (_, i) => (
                <div key={i} className="border border-gray-300"></div>
              ))}
            </div>
          </div>

          {/* Selected location marker */}
          <div
            className="absolute transform -translate-x-1/2 -translate-y-full z-10"
            style={{
              left: `${((selectedLng + 75) / 45) * 100}%`,
              top: `${((5 - selectedLat) / 40) * 100}%`
            }}
          >
            <MapPin className="h-8 w-8 text-red-500 drop-shadow-lg" />
          </div>

          {/* Instructions overlay */}
          <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg p-3 shadow-md">
            <p className="text-sm text-gray-700 flex items-center">
              <MapPin className="h-4 w-4 mr-2 text-red-500" />
              Clique no mapa para selecionar uma localização
            </p>
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