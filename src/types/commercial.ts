export type CommercialChannel = 
  | 'whatsapp' 
  | 'whatsapp_status' 
  | 'facebook_instagram' 
  | 'tiktok_reels' 
  | 'google_ads' 
  | 'sms' 
  | 'email' 
  | 'dm_insta' 
  | 'multi_channel';

export type LeadStatus = 'new' | 'qualified' | 'negotiating' | 'converted' | 'loyal_client';

export type DiscountType = 'percentage' | 'fixed_fcfa';

export type LinkType = 'wave_payment' | 'whatsapp_closing' | 'promo_landing' | 'affiliate_referral' | 'app_download';

export type PromptCategory = 
  | 'closing_rapide' 
  | 'objection_prix' 
  | 'relance_douce' 
  | 'offre_flash' 
  | 'fidelisation_vip' 
  | 'pitch_30s';

export interface CommercialAgentConfig {
  isActive: boolean;
  cycleIntervalSeconds: number; // e.g. 20, 30, 45
  autoLeadNurturing: boolean;
  autoPromoBroadcasting: boolean;
  autoAdOptimization: boolean;
  autoConversionLinks: boolean;
  targetMonthlyRevenueFCFA: number;
  defaultDiscountPercent: number;
  brandName: string;
  ownerPhone: string;
  ownerEmail: string;
}

export interface CommercialPromotion {
  id: string;
  code: string;
  title: string;
  description: string;
  discountType: DiscountType;
  discountValue: number; // % or FCFA
  targetProduct: string;
  startDate: string;
  endDate: string;
  active: boolean;
  usageCount: number;
  maxUses: number;
  channel: CommercialChannel | 'social_media';
  generatedCopy: string;
  directActivationLink: string;
  revenueGeneratedFCFA: number;
}

export interface CommercialAdvertisement {
  id: string;
  campaignName: string;
  channel: CommercialChannel;
  status: 'active' | 'scheduled' | 'draft' | 'completed';
  targetAudience: string;
  headline: string;
  adCopy: string;
  callToAction: string;
  visualPrompt: string;
  trackedLink: string;
  estimatedBudgetFCFA: number;
  impressions: number;
  clicks: number;
  conversions: number;
  revenueGeneratedFCFA: number;
  createdAt: string;
}

export interface CommercialLead {
  id: string;
  name: string;
  contact: string; // phone / WhatsApp / email
  source: string; // WhatsApp, Facebook, TikTok, Site Web, Recommandation
  status: LeadStatus;
  interestScore: number; // 0 to 100
  productInterest: string;
  budgetFCFA: number;
  mainObjection: string;
  lastInteraction: string;
  followUpCount: number;
  assignedPromptId?: string;
  assignedLinkId?: string;
  conversionMessage?: string;
  loyaltyPoints?: number;
  totalSpentFCFA: number;
  notes: string;
  isLoyalClient?: boolean;
}

export interface CommercialLink {
  id: string;
  name: string;
  type: LinkType;
  url: string;
  destination: string;
  codePromo?: string;
  clicksCount: number;
  conversionsCount: number;
  revenueEarnedFCFA: number;
  conversionRate: number; // percentage
  prefilledMessage?: string;
  createdAt: string;
}

export interface CommercialSalesPrompt {
  id: string;
  title: string;
  category: PromptCategory;
  objective: string;
  targetObjection: string;
  promptTemplate: string;
  exampleOutput: string;
  suggestedChannel: CommercialChannel;
  usageCount: number;
  conversionRateScore: number; // 0 to 100
}

export interface CommercialLog {
  id: string;
  timestamp: string;
  actionType: 'promo_created' | 'ad_launched' | 'lead_contacted' | 'lead_converted' | 'link_clicked' | 'prompt_executed' | 'cycle_run';
  title: string;
  details: string;
  amountFCFA?: number;
}

export interface CommercialStats {
  totalRevenueFCFA: number;
  totalLeadsCount: number;
  convertedClientsCount: number;
  loyalClientsCount: number;
  activeCampaignsCount: number;
  activePromotionsCount: number;
  totalClicks: number;
  globalConversionRate: number;
  cyclesRunCount: number;
  lastCycleAt?: string;
}
