export interface Channel {
  id: string;
  name: string;
  logo: string;
  streamUrl: string;
  isLive: boolean;
  category: string;
  description?: string;
  number?: string;
  country?: string;
  countryFlag?: string;
  language?: string;
  quality?: string;
  isFeatured?: boolean;
}
