
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

export type Theme = 'neon' | 'ivory' | 'midnight';

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

// SKU 变体结构
export interface ProductVariant {
  id: string;
  sku: string;
  name: string; // e.g., "Blue / L"
  price: number;
  stock: number;
  attributes: Record<string, string>; // { color: "Blue", size: "L" }
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
  
  // Enhanced Fields for Restock Module
  inboundId?: string; // 入库单号
  dailySales?: number; // 日均销量
  restockDate?: string; // 建议补货日期
  
  // Real ERP Data Fields
  logistics?: LogisticsInfo;
  financials?: FinancialInfo;
  
  // Variant Support
  hasVariants?: boolean;
  variants?: ProductVariant[];
  
  // AI SEO Data
  seoTitle?: string;
  seoKeywords?: string[];
  marketingHook?: string;
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
  
  // Advanced Logistics Fields
  vesselName?: string;
  voyageNo?: string;
  containerNo?: string;
  sealNo?: string;
  customsStatus?: 'Cleared' | 'Held' | 'Inspection' | 'Pending';
  customsBroker?: string;
  podName?: string; // Proof of Delivery signature
  podTime?: string;
  lastUpdate?: string; // Last event timestamp
}

export interface Influencer {
    id: string;
    name: string;
    handle: string; // e.g., @username
    platform: 'TikTok' | 'Instagram' | 'YouTube';
    followers: number;
    engagementRate: number; // %
    region: string;
    category: string;
    status: 'Contacted' | 'Sample Sent' | 'Content Live' | 'Paid' | 'Negotiating';
    avatarUrl: string;
    cost: number; // Collaboration fee
    gmv: number; // Generated Sales
    roi: number;
    sampleSku: string; // SKU sent
}

export interface Transaction {
    id: string;
    date: string;
    type: 'Revenue' | 'Expense';
    category: string; // Changed from strict union to string for flexibility
    amount: number;
    description: string;
    status: 'Cleared' | 'Pending';
}

export interface Task {
  id: string;
  title: string;
  desc: string;
  priority: 'High' | 'Medium' | 'Low';
  status: 'Todo' | 'In Progress' | 'Review' | 'Done';
  assignee: string; // Avatar URL or Initials
  dueDate: string;
  tags: string[];
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
