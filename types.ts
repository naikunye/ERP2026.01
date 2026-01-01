
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

// 库存流水记录 (核心实战功能)
export interface InventoryLog {
    id: string;
    productId: string;
    type: 'Inbound' | 'Outbound' | 'Adjustment';
    quantity: number; // 正数增加，负数减少
    reason: string; // e.g., "PO-20231001 采购入库", "SH-001 发货扣减"
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
  price: number;
  currency: Currency;
  stock: number; // 当前可用库存
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

// 货件内容详情 (实战级：必须包含数量)
export interface ShipmentItem {
    skuId: string;
    skuCode: string; // Snapshot for display
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
  
  // 关联的 SKU 详情 (不再是简单的 ID 数组)
  items: ShipmentItem[]; 
  
  // Advanced Logistics Fields
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
