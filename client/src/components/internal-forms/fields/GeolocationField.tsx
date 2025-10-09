import { useState, useEffect } from 'react';
import { MapPin, Loader2, Navigation } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import { LatLng } from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface GeolocationFieldProps {
  value?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  onChange: (value: { latitude: number; longitude: number; address?: string }) => void;
  required?: boolean;
  allowManualEntry?: boolean;
  autoDetect?: boolean;
  showMap?: boolean;
  mapZoom?: number;
  allowMarkerDrag?: boolean;
}

interface ViaCEPResponse {
  cep: string;
  logradouro: string;
  complemento: string;
  bairro: string;
  localidade: string;
  uf: string;
  erro?: boolean;
}

function DraggableMarker({ position, onPositionChange }: { 
  position: [number, number]; 
  onPositionChange: (lat: number, lng: number) => void;
}) {
  useMapEvents({
    click(e) {
      onPositionChange(e.latlng.lat, e.latlng.lng);
    },
  });

  return <Marker position={position} draggable={true} eventHandlers={{
    dragend: (e) => {
      const marker = e.target;
      const position = marker.getLatLng();
      onPositionChange(position.lat, position.lng);
    },
  }} />;
}

export default function GeolocationField({
  value,
  onChange,
  required = false,
  allowManualEntry = true,
  autoDetect = true,
  showMap = true,
  mapZoom = 15,
  allowMarkerDrag = true,
}: GeolocationFieldProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [cep, setCep] = useState('');
  const [address, setAddress] = useState(value?.address || '');
  const [position, setPosition] = useState<[number, number]>(
    value ? [value.latitude, value.longitude] : [-15.7942, -47.8822] // Default: Brasília
  );

  // Auto-detect geolocation on mount if enabled
  useEffect(() => {
    if (autoDetect && !value && navigator.geolocation) {
      handleAutoDetect();
    }
  }, []);

  const handleAutoDetect = () => {
    if (!navigator.geolocation) {
      toast({
        title: 'Geolocalização não suportada',
        description: 'Seu navegador não suporta geolocalização',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        
        setPosition([lat, lng]);
        
        // Try to get address from coordinates (reverse geocoding via Nominatim - free)
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`
          );
          const data = await response.json();
          const addr = data.display_name || 'Endereço não encontrado';
          setAddress(addr);
          
          onChange({
            latitude: lat,
            longitude: lng,
            address: addr,
          });
        } catch (error) {
          onChange({
            latitude: lat,
            longitude: lng,
          });
        }
        
        setLoading(false);
        toast({
          title: 'Localização detectada',
          description: 'Sua localização foi capturada com sucesso',
        });
      },
      (error) => {
        setLoading(false);
        toast({
          title: 'Erro ao detectar localização',
          description: 'Não foi possível obter sua localização. Tente inserir o CEP.',
          variant: 'destructive',
        });
      }
    );
  };

  const handleCepSearch = async () => {
    const cleanCep = cep.replace(/\D/g, '');
    
    if (cleanCep.length !== 8) {
      toast({
        title: 'CEP inválido',
        description: 'Digite um CEP válido com 8 dígitos',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      // Search address via ViaCEP
      const viaCepResponse = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
      
      if (!viaCepResponse.ok) {
        throw new Error('ViaCEP service unavailable');
      }

      const viaCepData: ViaCEPResponse = await viaCepResponse.json();

      if (viaCepData.erro) {
        throw new Error('CEP não encontrado');
      }

      const fullAddress = `${viaCepData.logradouro}, ${viaCepData.bairro}, ${viaCepData.localidade} - ${viaCepData.uf}`;
      setAddress(fullAddress);

      // Geocode address to get coordinates (Nominatim - free)
      const geocodeResponse = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(fullAddress)}&format=json&limit=1`
      );
      const geocodeData = await geocodeResponse.json();

      if (geocodeData.length > 0) {
        const lat = parseFloat(geocodeData[0].lat);
        const lng = parseFloat(geocodeData[0].lon);
        
        setPosition([lat, lng]);
        onChange({
          latitude: lat,
          longitude: lng,
          address: fullAddress,
        });

        toast({
          title: 'Endereço encontrado',
          description: fullAddress,
        });
      } else {
        throw new Error('Não foi possível geocodificar o endereço');
      }
    } catch (error) {
      toast({
        title: 'Erro ao buscar CEP',
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleMapClick = (lat: number, lng: number) => {
    if (!allowMarkerDrag) return;
    
    setPosition([lat, lng]);
    onChange({
      latitude: lat,
      longitude: lng,
      address,
    });
  };

  const formatCep = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 5) return numbers;
    return `${numbers.slice(0, 5)}-${numbers.slice(5, 8)}`;
  };

  return (
    <div className="space-y-4" data-testid="field-geolocation">
      {/* Auto-detect button */}
      {autoDetect && (
        <Button
          type="button"
          variant="outline"
          onClick={handleAutoDetect}
          disabled={loading}
          className="w-full"
          data-testid="button-auto-detect-location"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Navigation className="h-4 w-4 mr-2" />
          )}
          Detectar localização automaticamente
        </Button>
      )}

      {/* Manual CEP entry */}
      {allowManualEntry && (
        <div className="flex gap-2">
          <div className="flex-1">
            <Label>CEP</Label>
            <Input
              type="text"
              placeholder="00000-000"
              value={cep}
              onChange={(e) => setCep(formatCep(e.target.value))}
              maxLength={9}
              data-testid="input-cep"
            />
          </div>
          <div className="flex items-end">
            <Button
              type="button"
              onClick={handleCepSearch}
              disabled={loading}
              data-testid="button-search-cep"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <MapPin className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      )}

      {/* Address display */}
      {address && (
        <Card className="p-3 bg-muted">
          <p className="text-sm" data-testid="text-address">
            <MapPin className="h-4 w-4 inline mr-2" />
            {address}
          </p>
        </Card>
      )}

      {/* Coordinates display */}
      {value && (
        <div className="text-sm text-muted-foreground" data-testid="text-coordinates">
          Coordenadas: {value.latitude.toFixed(6)}, {value.longitude.toFixed(6)}
        </div>
      )}

      {/* Interactive map */}
      {showMap && (
        <div className="border rounded-lg overflow-hidden" style={{ height: '300px' }}>
          <MapContainer
            center={position}
            zoom={mapZoom}
            style={{ height: '100%', width: '100%' }}
            data-testid="map-container"
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <DraggableMarker 
              position={position} 
              onPositionChange={handleMapClick}
            />
          </MapContainer>
        </div>
      )}

      {required && !value && (
        <p className="text-sm text-destructive">Este campo é obrigatório</p>
      )}
    </div>
  );
}
