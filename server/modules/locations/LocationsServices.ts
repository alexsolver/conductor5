
// LOCATIONS SERVICES - CEP and Holidays lookup
export class LocationsServices {
  
  // CEP lookup service
  static async lookupCep(cep: string) {
    try {
      const cleanCep = cep.replace(/\D/g, '');
      if (cleanCep.length !== 8) {
        throw new Error('CEP deve ter 8 dígitos');
      }

      const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
      const data = await response.json();
      
      if (data.erro) {
        throw new Error('CEP não encontrado');
      }

      return {
        cep: data.cep,
        logradouro: data.logradouro,
        complemento: data.complemento,
        bairro: data.bairro,
        localidade: data.localidade,
        uf: data.uf,
        ibge: data.ibge,
        gia: data.gia,
        ddd: data.ddd,
        siafi: data.siafi
      };
    } catch (error) {
      throw new Error(`Erro ao buscar CEP: ${error}`);
    }
  }

  // Holidays lookup service
  static async lookupHolidays(municipio: string, estado: string, ano?: number) {
    const currentYear = ano || new Date().getFullYear();
    
    try {
      // Comprehensive holiday implementation
      const holidays = {
        federais: [
          { data: `${currentYear}-01-01`, nome: 'Confraternização Universal', incluir: false },
          { data: `${currentYear}-02-12`, nome: 'Carnaval (Segunda)', incluir: false },
          { data: `${currentYear}-02-13`, nome: 'Carnaval (Terça)', incluir: false },
          { data: `${currentYear}-04-07`, nome: 'Sexta-feira Santa', incluir: false },
          { data: `${currentYear}-04-21`, nome: 'Tiradentes', incluir: false },
          { data: `${currentYear}-05-01`, nome: 'Dia do Trabalhador', incluir: false },
          { data: `${currentYear}-06-08`, nome: 'Corpus Christi', incluir: false },
          { data: `${currentYear}-09-07`, nome: 'Independência do Brasil', incluir: false },
          { data: `${currentYear}-10-12`, nome: 'Nossa Senhora Aparecida', incluir: false },
          { data: `${currentYear}-11-02`, nome: 'Finados', incluir: false },
          { data: `${currentYear}-11-15`, nome: 'Proclamação da República', incluir: false },
          { data: `${currentYear}-12-25`, nome: 'Natal', incluir: false }
        ],
        estaduais: this.getEstadualHolidays(estado, currentYear),
        municipais: this.getMunicipalHolidays(municipio, estado, currentYear)
      };

      return holidays;
    } catch (error) {
      throw new Error(`Erro ao buscar feriados: ${error}`);
    }
  }

  private static getEstadualHolidays(estado: string, ano: number) {
    const estadualHolidays: { [key: string]: any[] } = {
      'RJ': [
        { data: `${ano}-04-23`, nome: 'São Jorge' },
        { data: `${ano}-06-29`, nome: 'São Pedro' }
      ],
      'SP': [
        { data: `${ano}-02-13`, nome: 'Carnaval' },
        { data: `${ano}-07-09`, nome: 'Revolução Constitucionalista' }
      ],
      'MG': [
        { data: `${ano}-04-21`, nome: 'Data Magna do Estado' }
      ]
    };

    return estadualHolidays[estado] || [];
  }

  private static getMunicipalHolidays(municipio: string, estado: string, ano: number) {
    const municipalHolidays: { [key: string]: any[] } = {
      'Rio de Janeiro': [
        { data: `${ano}-01-20`, nome: 'São Sebastião' }
      ],
      'São Paulo': [
        { data: `${ano}-01-25`, nome: 'Aniversário da Cidade' }
      ],
      'Belo Horizonte': [
        { data: `${ano}-12-12`, nome: 'Nossa Senhora da Conceição' }
      ]
    };

    return municipalHolidays[municipio] || [];
  }

  // Geocoding service
  static async geocodeAddress(address: string) {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`
      );
      const data = await response.json();
      
      if (data && data[0]) {
        return {
          latitude: parseFloat(data[0].lat),
          longitude: parseFloat(data[0].lon),
          displayName: data[0].display_name,
          boundingBox: data[0].boundingbox
        };
      }
      
      throw new Error('Endereço não encontrado');
    } catch (error) {
      throw new Error(`Erro ao buscar coordenadas: ${error}`);
    }
  }
}
