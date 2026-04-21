export interface AdData {
  day: string;
  campaignName: string;
  reach: number;
  impressions: number;
  frequency: number;
  amountSpent: number;
  cpm: number;
  linkClicks: number;
  conversions: number;
  cpa: number;
  cpc: number;
  ctr: number;
}

export interface ReportStats {
  totalSpend: number;
  totalImpressions: number;
  totalClicks: number;
  totalConversions: number;
  avgCpc: number;
  avgCtr: number;
  avgCpa: number;
}
