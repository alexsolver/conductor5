
/**
 * Componentes de localização para o template builder
 */

import React, { useState, useEffect, useRef } from 'react'
import { Input } from '../../ui/input'
import { Button } from '../../ui/button'
import { Label } from '../../ui/label'
import { Badge } from '../../ui/badge'
import { Card, CardContent } from '../../ui/card'
import { Alert, AlertDescription } from '../../ui/alert'
import { 
// import { useLocalization } from '@/hooks/useLocalization';
  MapPin, 
  Navigation, 
  Search, 
  CheckCircle,
  AlertCircle,
  Loader2,
  Globe,
  Target
} from 'lucide-react'

interface LocationData {
  address?: string
  latitude?: number
  longitude?: number
  city?: string
  state?: string
  country?: string
  postalCode?: string
  accuracy?: number
}

interface LocationFieldProps {
  field: any
  value?: LocationData
  onChange?: (value: LocationData) => void
  disabled?: boolean
}

export const LocationField: React.FC<LocationFieldProps> = ({
  // Localization temporarily disabled

  field,
  value = {},
  onChange,
  disabled = false
}) => {
  const [locationData, setLocationData] = useState<LocationData>(value)
  const [isSearching, setIsSearching] = useState(false)
  const [isGettingLocation, setIsGettingLocation] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [suggestions, setSuggestions] = useState<any[]>([])
  
  const searchTimeoutRef = useRef<NodeJS.Timeout>()

  // Geocodificação usando API pública (OpenStreetMap Nominatim)
  const searchAddress = async (query: string) => {
    if (!query.trim()) return

    setIsSearching(true)
    setError(null)

    try {
      const response = await fetch(
        "&limit=5&addressdetails=1`
      )
      
      if (!response.ok) throw new Error('Erro na busca de endereço')
      
      const results = await response.json()
      
      const formattedSuggestions = results.map((result: any) => ({
        display_name: result.display_name,
        latitude: parseFloat(result.lat),
        longitude: parseFloat(result.lon),
        address: result.display_name,
        city: result.address?.city || result.address?.town || result.address?.village,
        state: result.address?.state,
        country: result.address?.country,
        postalCode: result.address?.postcode
      }))
      
      setSuggestions(formattedSuggestions)
    } catch (err) {
      setError('Erro ao buscar endereços. Tente novamente.')
      console.error('Geocoding error:', err)
    } finally {
      setIsSearching(false)
    }
  }

  // Busca com debounce
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }

    if (searchQuery.length > 2) {
      searchTimeoutRef.current = setTimeout(() => {
        searchAddress(searchQuery)
      }, 500)
    } else {
      setSuggestions([])
    }

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }
    }
  }, [searchQuery])

  // Obter localização atual do usuário
  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocalização não é suportada pelo navegador')
      return
    }

    setIsGettingLocation(true)
    setError(null)

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude, accuracy } = position.coords
        
        try {
          // Reverse geocoding para obter endereço
          const response = await fetch(
            "&addressdetails=1`
          )
          
          if (response.ok) {
            const result = await response.json()
            const newLocationData: LocationData = {
              latitude,
              longitude,
              accuracy,
              address: result.display_name,
              city: result.address?.city || result.address?.town || result.address?.village,
              state: result.address?.state,
              country: result.address?.country,
              postalCode: result.address?.postcode
            }
            
            setLocationData(newLocationData)
            onChange?.(newLocationData)
            setSearchQuery(result.display_name || '')
          }
        } catch (err) {
          console.error('Reverse geocoding error:', err)
          // Mesmo sem endereço, salvar coordenadas
          const newLocationData: LocationData = {
            latitude,
            longitude,
            accuracy
          }
          setLocationData(newLocationData)
          onChange?.(newLocationData)
        }
        
        setIsGettingLocation(false)
      },
      (error) => {
        setError("
        setIsGettingLocation(false)
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // 5 minutos
      }
    )
  }

  // Selecionar sugestão
  const selectSuggestion = (suggestion: LocationData) => {
    setLocationData(suggestion)
    onChange?.(suggestion)
    setSearchQuery(suggestion.address || '')
    setSuggestions([])
  }

  // Limpar localização
  const clearLocation = () => {
    const emptyLocation: LocationData = {}
    setLocationData(emptyLocation)
    onChange?.(emptyLocation)
    setSearchQuery('')
    setSuggestions([])
    setError(null)
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">
          {field.label}
          {field.isRequired && <span className="text-red-500 ml-1">*</span>}
        </Label>
        
        <div className="flex items-center gap-1">
          <Badge variant="secondary" className="text-xs">
            <MapPin className="w-3 h-3 mr-1" />
            Localização
          </Badge>
        </div>
      </div>

      {field.description && (
        <p className="text-xs text-gray-500">{field.description}</p>
      )}

      {/* Busca de endereço */}
      <div className="relative">
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder='[TRANSLATION_NEEDED]'
              className="pl-10"
              disabled={disabled}
            />
            {isSearching && (
              <Loader2 className="absolute right-3 top-2.5 w-4 h-4 animate-spin text-blue-500" />
            )}
          </div>
          
          <Button
            type="button"
            variant="outline"
            onClick={getCurrentLocation}
            disabled={disabled || isGettingLocation}
          >
            {isGettingLocation ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Navigation className="w-4 h-4" />
            )}
          </Button>
        </div>

        {/* Sugestões de endereço */}
        {suggestions.length > 0 && (
          <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-y-auto">
            {suggestions.map((suggestion, index) => (
              <button
                key={index}
                type="button"
                className="w-full px-3 py-2 text-left hover:bg-gray-100 border-b border-gray-100 last:border-b-0"
                onClick={() => selectSuggestion(suggestion)}
              >
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">
                      {suggestion.address}
                    </p>
                    <p className="text-xs text-gray-500">
                      {suggestion.city && ", "
                      {suggestion.state} - {suggestion.country}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Informações da localização selecionada */}
      {(locationData.latitude || locationData.address) && (
        <Card className="bg-green-50 border-green-200">
          <CardContent className="p-3">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-sm font-medium text-green-800">
                    Localização definida
                  </p>
                  
                  {locationData.address && (
                    <p className="text-xs text-green-700">
                      📍 {typeof locationData.address === 'string' 
                          ? locationData.address 
                          : typeof locationData.address === 'object' 
                            ? Object.values(locationData.address).filter(Boolean).join(', ')
                            : String(locationData.address)}
                    </p>
                  )}
                  
                  {locationData.latitude && locationData.longitude && (
                    <p className="text-xs text-green-600 font-mono">
                      🌐 {locationData.latitude.toFixed(6)}, {locationData.longitude.toFixed(6)}
                    </p>
                  )}
                  
                  {locationData.accuracy && (
                    <p className="text-xs text-green-600">
                      🎯 Precisão: ±{Math.round(locationData.accuracy)}m
                    </p>
                  )}
                </div>
              </div>
              
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={clearLocation}
                className="text-green-700 hover:text-green-800"
              >
                ✕
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Erro */}
      {error && (
        <Alert className="border-red-200 bg-red-50">
          <AlertCircle className="w-4 h-4 text-red-600" />
          <AlertDescription className="text-red-700 text-xs">
            {error}
          </AlertDescription>
        </Alert>
      )}

      {/* Campos de entrada manual */}
      {field.allowManualEntry && (
        <div className="grid grid-cols-2 gap-2 pt-2 border-t">
          <div>
            <Label className="text-xs">Latitude</Label>
            <Input
              type="number"
              step="any"
              value={locationData.latitude || ''}
              onChange={(e) => {
                const newData = { ...locationData, latitude: parseFloat(e.target.value) || undefined }
                setLocationData(newData)
                onChange?.(newData)
              }}
              placeholder="Ex: -23.550520"
              className="h-8 text-xs"
              disabled={disabled}
            />
          </div>
          
          <div>
            <Label className="text-xs">Longitude</Label>
            <Input
              type="number"
              step="any"
              value={locationData.longitude || ''}
              onChange={(e) => {
                const newData = { ...locationData, longitude: parseFloat(e.target.value) || undefined }
                setLocationData(newData)
                onChange?.(newData)
              }}
              placeholder="Ex: -46.633308"
              className="h-8 text-xs"
              disabled={disabled}
            />
          </div>
        </div>
      )}
    </div>
  )
}

export default LocationField
