
export interface CreateLocationDTO {
  name: string;
  address: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  description?: string;
}

export interface LocationResponseDTO {
  id: string;
  name: string;
  address: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  description?: string;
  createdAt: string;
}
