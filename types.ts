
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

// 核心物流数据结构
export interface LogisticsInfo {
  method: 'Air' | 'Sea' | 'Rail';
  carrier: string;
  trackingNo: string;
  status: 'In Production' | 'In Transit' | 'Customs' | 'Delivered' | 'Pending' | 'Exception';
  etd?: string;
  eta?: string;
  origin: string;
  destination: string;
}

// 核心财务数据结构
export interface FinancialInfo {
  costOfGoods: number; // 采购成本
  shippingCost: number; // 头程运费
  otherCost: number; // 杂费 (贴标/包装)
  sellingPrice: number; // 售价
  platformFee: number; // 平台佣金
  adCost: number; // 广告预算
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  description: string;
  price: number; // 这里通常指售价，但在 financials 里有更详细的定义
  currency: Currency;
  stock: number;
  category: string;
  status: ProductStatus;
  imageUrl: string;
  marketplaces: string[];
  lastUpdated: string;
  note?: string;
  supplier?: string;
  
  // Real ERP Data Fields
  logistics?: LogisticsInfo;
  financials?: FinancialInfo;
}

export interface Shipment {
  id: string;
  trackingNo: string;
  carrier: string; 
  method: 'Air' | 'Sea' | 'Rail' | 'Truck';
  origin: string;
  destination: string;
  etd: string; 
  eta: string; 
  status: 'Pending' | 'In Transit' | 'Customs' | 'Out for Delivery' | 'Delivered' | 'Exception';
  progress: number; 
  weight: number; 
  cartons: number;
  riskReason?: string;
  // 关联的 SKU IDs
  skuIds: string[]; 
}

export interface DashboardStats {
  totalRevenue: number;
  activeProducts: number;
  pendingOrders: number;
  globalReach: number;
}

export interface ChartDataPoint {
  name: string;
  value: number;
  sales: number;
}
