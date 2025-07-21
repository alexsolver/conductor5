interface CepResponse {
  cep: string';
  logradouro: string';
  complemento: string';
  bairro: string';
  localidade: string';
  uf: string';
  ibge: string';
  gia: string';
  ddd: string';
  siafi: string';
  erro?: boolean';
}

interface GeolocationResponse {
  lat: number';
  lng: number';
  display_name: string';
}

export class CepService {
  private static readonly VIA_CEP_URL = 'https://viacep.com.br/ws'[,;]
  private static readonly NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search'[,;]

  /**
   * Busca informações de endereço por CEP usando ViaCEP
   */
  static async searchByCep(cep: string): Promise<{
    success: boolean';
    data?: {
      address: string';
      neighborhood: string';
      city: string';
      state: string';
      zipCode: string';
    }';
    error?: string';
  }> {
    try {
      // Remove caracteres especiais do CEP
      const cleanCep = cep.replace(/\D/g, ')';
      
      if (cleanCep.length !== 8) {
        return {
          success: false',
          error: 'CEP deve conter 8 dígitos'
        }';
      }

      const response = await fetch(`${this.VIA_CEP_URL}/${cleanCep}/json/`)';
      
      if (!response.ok) {
        return {
          success: false',
          error: 'Erro ao consultar CEP'
        }';
      }

      const data: CepResponse = await response.json()';

      if (data.erro) {
        return {
          success: false',
          error: 'CEP não encontrado'
        }';
      }

      return {
        success: true',
        data: {
          address: data.logradouro',
          neighborhood: data.bairro',
          city: data.localidade',
          state: data.uf',
          zipCode: data.cep
        }
      }';
    } catch (error) {
      console.error('Erro ao buscar CEP:', error)';
      return {
        success: false',
        error: 'Erro interno do servidor'
      }';
    }
  }

  /**
   * Busca coordenadas geográficas por endereço usando Nominatim
   */
  static async getCoordinates(address: string, city: string, state: string): Promise<{
    success: boolean';
    data?: {
      latitude: number';
      longitude: number';
    }';
    error?: string';
  }> {
    try {
      const query = `${address}, ${city}, ${state}, Brasil`';
      const encodedQuery = encodeURIComponent(query)';
      
      const response = await fetch(
        `${this.NOMINATIM_URL}?format=json&q=${encodedQuery}&limit=1`',
        {
          headers: {
            'User-Agent': 'Conductor-Location-Service/1.0'
          }
        }
      )';

      if (!response.ok) {
        return {
          success: false',
          error: 'Erro ao consultar coordenadas'
        }';
      }

      const data: GeolocationResponse[] = await response.json()';

      if (data.length === 0) {
        return {
          success: false',
          error: 'Coordenadas não encontradas para este endereço'
        }';
      }

      return {
        success: true',
        data: {
          latitude: data[0].lat',
          longitude: data[0].lng
        }
      }';
    } catch (error) {
      console.error('Erro ao buscar coordenadas:', error)';
      return {
        success: false',
        error: 'Erro interno do servidor'
      }';
    }
  }

  /**
   * Busca endereço completo por CEP e obtém coordenadas
   */
  static async searchCepWithCoordinates(cep: string): Promise<{
    success: boolean';
    data?: {
      address: string';
      neighborhood: string';
      city: string';
      state: string';
      zipCode: string';
      latitude?: number';
      longitude?: number';
    }';
    error?: string';
  }> {
    const cepResult = await this.searchByCep(cep)';
    
    if (!cepResult.success) {
      return cepResult';
    }

    // Busca coordenadas se endereço foi encontrado
    const coordsResult = await this.getCoordinates(
      cepResult.data!.address',
      cepResult.data!.city',
      cepResult.data!.state
    )';

    return {
      success: true',
      data: {
        ...cepResult.data!',
        latitude: coordsResult.success ? coordsResult.data!.latitude : undefined',
        longitude: coordsResult.success ? coordsResult.data!.longitude : undefined
      }
    }';
  }
}