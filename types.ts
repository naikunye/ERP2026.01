

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

export interface Notification {
    id: string;
    type: 'success' | 'error' | 'info' | 'warning';
    title: string;
    message: string;
}

export interface InventoryLog {
    id: string;
    productId: string;
    type: 'Inbound' | 'Outbound' | 'Adjustment' | 'OrderPlaced';
    quantity: number;
    reason: string;
    timestamp: string;
    operator: string;
}

// --- 增强型变体模型 ---
export interface ProductVariant {
  id: string;
  sku: string;
  name: string; 
  price: number;
  stock: number;
  attributes: Record<string, string>;
  // 覆盖字段
  weightOverride?: number;
  priceOverride?: number;
  fbaFeeOverride?: number;
  adCostOverride?: number;
  returnRateOverride?: number;
}

// --- 物流执行记录模型 ---
export interface ExecutionRecord {
    id: string;
    batchNo: string; // 发货批次号
    method: 'Air' | 'Sea' | 'Rail' | 'Truck';
    carrier: string;
    trackingNos: string[];
    inboundId: string;
    sentQty: number;
    receivedQty: number;
    status: 'In Transit' | 'Delivered' | 'Exception' | 'Received';
    shipDate: string;
    arrivalDate?: string;
    actualShippingRate?: number; // 实际产生的运费单价
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
  lifecycle: 'New' | 'Growth' | 'Stable' | 'Clearance';
  
  // 1. 供应链核心
  supplier?: string;
  moq?: number;
  leadTimeProduction?: number;
  procurementLossRate?: number;
  paymentTerms?: string;
  
  // 2. 包装核心
  unitWeight?: number;
  packageWeight?: number;
  itemsPerBox?: number;
  boxLength?: number;
  boxWidth?: number;
  boxHeight?: number;
  boxWeight?: number;

  // 3. 物流核心
  logistics?: {
      method: 'Air' | 'Sea' | 'Rail' | 'Truck';
      carrier: string;
      shippingRate: number; // RMB/kg
      minWeight: number;
      customsMode: 'DDP' | 'DDU';
      dutyRate: number;
      riskBuffer: number;
      volumetricDivisor: number; // 6000, 7000 etc
      // Add manualChargeableWeight to resolve type errors in RestockModule
      manualChargeableWeight?: number;
      // Also used in RestockModule list view for tracking details
      trackingNo?: string;
  };

  // 4. 运营核心
  platformCommission?: number;
  fbaFee?: number;
  adCostPerUnit?: number;
  returnRate?: number;
  exchangeRate?: number;
  // Add operation specific fields used in RestockModule calculations
  influencerCommission?: number;
  orderFixedFee?: number;
  otherCost?: number;
  dailySales?: number;

  // 5. 变体与记录
  variants?: ProductVariant[];
  executionRecords?: ExecutionRecord[];
  
  // 6. 补货与库存计划 (Used in RestockModule)
  inboundId?: string;
  totalRestockUnits?: number;
  restockCartons?: number;
  variantRestockMap?: Record<string, number>;
  
  // 历史数据暂存
  financials?: any;
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
  status: 'Pending' | 'In Production' | 'In Transit' | 'Customs' | 'Out for Delivery' | 'Delivered' | 'Exception';
  progress: number; 
  weight: number; 
  cartons: number;
  items: ShipmentItem[]; 
  // Add optional field for risk description used in Restock/Dashboard
  riskReason?: string;
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

