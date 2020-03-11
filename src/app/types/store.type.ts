export interface store {
  name: string;
  location: { lat: number, lng: number};
  address: string;
  brand?: string;
  storeNumber?: string;
  City: string;
  State: string;
  Country: string;
  Postcode: string;
  ownership?: string;
  phoneNumber?: string;
  distance?: number;
}
