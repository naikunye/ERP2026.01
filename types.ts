export enum ProductStatus {
  Draft = 'Draft',
  Active = 'Active',
  Archived = 'Archived'
}

export enum Currency {
  USD = 'USD',
  EUR = 'EUR',
  CNY = 'CNY',
  JPY = 'JPY'
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  description: string;
  price: number;
  currency: Currency;
  stock: number;
  category: string;
  status: ProductStatus;
  imageUrl: string;
  marketplaces: string[];
  lastUpdated: string;
}

export interface DashboardStats {
  totalRevenue: number;
  activeProducts: number;
  pendingOrders: number;
  globalReach: number; // Number of countries
}

export interface ChartDataPoint {
  name: string;
  value: number;
  sales: number;
}
