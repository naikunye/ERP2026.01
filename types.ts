
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

export type Theme = 'neon' | 'ivory' | 'midnight' | 'sunset' | 'forest' | 'nebula';

// 全局通知类型
export interface Notification {
    id: string;
    type: 'success' | 'error' | 'info' | 'warning';
    title: string;
    message: string;
}

// 库存流水记录
export interface InventoryLog {
    id: string;
    productId: string;
    type: 'Inbound' | 'Outbound' | 'Adjustment' | 'OrderPlaced';
    quantity: number;
    reason: string;
    timestamp: string;
    operator: string;
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
  costOfGoods: number; 
  shippingCost: number; 
  otherCost: number; 
  sellingPrice: number; 
  platformFee: number; 
  adCost: number; 
}

// SKU 变体结构
export interface ProductVariant {
  id: string;
  sku: string;
  name: string; 
  price: number;
  stock: number;
  attributes: Record<string, string>; 
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
  note?: string;
  supplier?: string;
  
  inboundId?: string; 
  dailySales?: number; 
  restockDate?: string; 
  
  logistics?: LogisticsInfo;
  financials?: FinancialInfo;
  
  hasVariants?: boolean;
  variants?: ProductVariant[];
  
  seoTitle?: string;
  seoKeywords?: string[];
  marketingHook?: string;
}

export interface ShipmentItem {
    skuId: string;
    skuCode: string; 
    quantity: number;
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
  items: ShipmentItem[]; 
  vesselName?: string;
  voyageNo?: string;
  containerNo?: string;
  sealNo?: string;
  customsStatus?: 'Cleared' | 'Held' | 'Inspection' | 'Pending';
  customsBroker?: string;
  podName?: string; 
  podTime?: string;
  lastUpdate?: string; 
}

export interface Influencer {
    id: string;
    name: string;
    handle: string; 
    platform: 'TikTok' | 'Instagram' | 'YouTube';
    followers: number;
    engagementRate: number; 
    region: string;
    category: string;
    status: 'Contacted' | 'Sample Sent' | 'Content Live' | 'Paid' | 'Negotiating';
    avatarUrl: string;
    cost: number; 
    gmv: number; 
    roi: number;
    sampleSku: string; 
}

export interface Transaction {
    id: string;
    date: string;
    type: 'Revenue' | 'Expense';
    category: string; 
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
  assignee: string; 
  dueDate: string;
  tags: string[];
}

export interface Competitor {
    id: string;
    asin: string;
    brand: string;
    name: string;
    price: number;
    priceHistory: { date: string; price: number }[];
    rating: number;
    reviewCount: number;
    imageUrl: string;
    dailySalesEst: number;
    keywords: string[];
    lastUpdate: string;
    status: string;
}

export interface CustomerMessage {
    id: string;
    platform: string;
    customerName: string;
    subject: string;
    content: string;
    timestamp: string;
    status: string;
    sentiment: string;
    orderId?: string;
    aiDraft?: string;
}
