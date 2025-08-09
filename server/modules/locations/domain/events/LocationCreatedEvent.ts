
export interface LocationCreatedEvent {
  id: string;
  name: string;
  address: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  createdAt: Date;
  createdBy: string;
}
