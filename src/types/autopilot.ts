export type SegmentType = 'KIWIFY_GLOBAL' | 'SHOPIFY_US' | 'TIKTOK_SHOP' | 'ADS_SCALE';

export interface ApiCredentialData {
  id: string;
  provider: string;
  apiKey: string;
  accountId: string | null;
  pixelId: string | null;
  webhookSecret: string | null;
  isVerified: boolean;
  accountName: string | null;
  currency: string | null;
  lastTestedAt: string | null;
  updatedAt: string;
}

export interface ProductData {
  id: string;
  title: string;
  sourceUrl: string;
  segment: string;
  rawScrapedText: string;
  costUsd: number;
  priceUsd: number;
  orderBumpUsd: number;
  shippingUsd: number;
  gatewayFeePercent: number;
  gatewayFeeFixedUsd: number;
  breakevenCpaUsd: number;
  breakevenRoas: number;
  targetCpaUsd: number;
  avatarProfileJson: string;
  painPointsJson: string;
  uniqueMechanism: string;
  creatives?: CreativeData[];
  campaigns?: CampaignData[];
  sales?: SaleData[];
  createdAt: string;
}

export interface CreativeData {
  id: string;
  productId: string;
  product?: ProductData;
  angle: string;
  hookEn: string;
  bodyEn: string;
  ctaEn: string;
  metaPrimaryText: string;
  metaHeadline: string;
  googleHeadlinesJson: string;
  orderBumpCopyEn: string;
  translationPt: string;
  audioFilePath: string | null;
  videoFilePath: string | null;
  tiktokPublishId: string | null;
  metaCreativeId: string | null;
  status: string;
  createdAt: string;
}

export interface CampaignData {
  id: string;
  productId: string | null;
  product?: ProductData | null;
  platform: string;
  externalCampaignId: string | null;
  externalAdSetId: string;
  name: string;
  dailyBudgetUsd: number;
  spendUsd: number;
  impressions: number;
  clicks: number;
  videoP25Watched: number;
  hookRate: number;
  ctr: number;
  purchases: number;
  revenueUsd: number;
  cpaUsd: number;
  roas: number;
  status: string;
  lastSyncedAt: string;
}

export interface SaleData {
  id: string;
  productId: string | null;
  product?: ProductData | null;
  platform: string;
  externalOrderId: string;
  customerEmailHash: string | null;
  customerCountry: string;
  grossUsd: number;
  gatewayFeeUsd: number;
  netUsd: number;
  exchangeRateBrl: number;
  netBrl: number;
  capiSent: boolean;
  status: string;
  createdAt: string;
}

export interface AutomationLogData {
  id: string;
  module: string;
  action: string;
  targetId: string | null;
  httpStatus: number | null;
  detailsJson: string;
  createdAt: string;
}

export interface ExchangeInfo {
  rate: number;
  bid: number;
  ask: number;
  high: number;
  low: number;
  pctChange: number;
  source: string;
  timestamp: string;
}

export interface ActivationStep {
  id: number;
  weight: number;
  label: string;
  completed: boolean;
  tabIndex: number;
}

export interface SystemStatusData {
  progressPercent: number;
  steps: ActivationStep[];
  cronState: {
    isCronActive: boolean;
    schedule: string;
    lastRunAt: string | null;
  };
  exchange: ExchangeInfo;
  counts: {
    products: number;
    creatives: number;
    campaigns: number;
    sales: number;
  };
  financials: {
    grossUsd: number;
    gatewayFeeUsd: number;
    netUsd: number;
    netBrl: number;
    totalAdSpendUsd: number;
    totalAdRevenueUsd: number;
    totalAdPurchases: number;
  };
  credentials: ApiCredentialData[];
  recentLogs: AutomationLogData[];
}
