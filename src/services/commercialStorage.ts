import { 
  CommercialAgentConfig,
  CommercialPromotion,
  CommercialAdvertisement,
  CommercialLead,
  CommercialLink,
  CommercialSalesPrompt,
  CommercialLog,
  CommercialStats
} from '../types/commercial';
import { 
  initialCommercialConfig,
  initialPromotions,
  initialAdvertisements,
  initialLeads,
  initialLinks,
  initialSalesPrompts,
  initialCommercialLogs
} from './commercialSeed';

const STORAGE_KEYS = {
  CONFIG: 'mris_commercial_config_v5',
  PROMOTIONS: 'mris_commercial_promotions_v5',
  ADS: 'mris_commercial_ads_v5',
  LEADS: 'mris_commercial_leads_v5',
  LINKS: 'mris_commercial_links_v5',
  PROMPTS: 'mris_commercial_prompts_v5',
  LOGS: 'mris_commercial_logs_v5'
};

export const ALLOWED_COMMERCIAL_URLS = [
  'https://wa.me/message/RGXYT5LWDCTAM1',
  'https://www.tiktok.com/@tisanebeniamar1?_r=1&_t=ZS-98DUrsnRQvc',
  'https://pay.wave.com/m/M_ci_Xs2kjjsivE5V/c/ci/'
];

export const isAllowedCommercialUrl = (url: string): boolean => {
  if (!url) return false;
  if (ALLOWED_COMMERCIAL_URLS.includes(url)) return true;
  if (typeof window !== 'undefined' && (url === window.location.origin || url.startsWith(window.location.origin))) return true;
  if (url.includes('m-ris') || url.includes('localhost') || url.includes('run.app')) return true;
  return false;
};

const isClient = typeof window !== 'undefined';

export function loadCommercialConfig(): CommercialAgentConfig {
  if (!isClient) return initialCommercialConfig;
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CONFIG);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Error loading commercial config:', e);
  }
  return initialCommercialConfig;
}

export function saveCommercialConfig(config: CommercialAgentConfig): void {
  if (!isClient) return;
  try {
    localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(config));
  } catch (e) {
    console.error('Error saving commercial config:', e);
  }
}

export function loadCommercialPromotions(): CommercialPromotion[] {
  if (!isClient) return initialPromotions;
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PROMOTIONS);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Error loading commercial promotions:', e);
  }
  return initialPromotions;
}

export function saveCommercialPromotions(promotions: CommercialPromotion[]): void {
  if (!isClient) return;
  try {
    localStorage.setItem(STORAGE_KEYS.PROMOTIONS, JSON.stringify(promotions));
  } catch (e) {
    console.error('Error saving commercial promotions:', e);
  }
}

export function loadCommercialAdvertisements(): CommercialAdvertisement[] {
  if (!isClient) return initialAdvertisements;
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.ADS);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Error loading commercial ads:', e);
  }
  return initialAdvertisements;
}

export function saveCommercialAdvertisements(ads: CommercialAdvertisement[]): void {
  if (!isClient) return;
  try {
    localStorage.setItem(STORAGE_KEYS.ADS, JSON.stringify(ads));
  } catch (e) {
    console.error('Error saving commercial ads:', e);
  }
}

export function loadCommercialLeads(): CommercialLead[] {
  if (!isClient) return initialLeads;
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.LEADS);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Error loading commercial leads:', e);
  }
  return initialLeads;
}

export function saveCommercialLeads(leads: CommercialLead[]): void {
  if (!isClient) return;
  try {
    localStorage.setItem(STORAGE_KEYS.LEADS, JSON.stringify(leads));
  } catch (e) {
    console.error('Error saving commercial leads:', e);
  }
}

export function loadCommercialLinks(): CommercialLink[] {
  if (!isClient) return initialLinks;
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.LINKS);
    if (raw) {
      const parsed: CommercialLink[] = JSON.parse(raw);
      const filtered = parsed.filter(l => isAllowedCommercialUrl(l.url));
      if (filtered.length > 0) return filtered;
    }
  } catch (e) {
    console.error('Error loading commercial links:', e);
  }
  return initialLinks;
}

export function saveCommercialLinks(links: CommercialLink[]): void {
  if (!isClient) return;
  try {
    localStorage.setItem(STORAGE_KEYS.LINKS, JSON.stringify(links));
  } catch (e) {
    console.error('Error saving commercial links:', e);
  }
}

export function loadCommercialPrompts(): CommercialSalesPrompt[] {
  if (!isClient) return initialSalesPrompts;
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PROMPTS);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Error loading commercial prompts:', e);
  }
  return initialSalesPrompts;
}

export function saveCommercialPrompts(prompts: CommercialSalesPrompt[]): void {
  if (!isClient) return;
  try {
    localStorage.setItem(STORAGE_KEYS.PROMPTS, JSON.stringify(prompts));
  } catch (e) {
    console.error('Error saving commercial prompts:', e);
  }
}

export function loadCommercialLogs(): CommercialLog[] {
  if (!isClient) return initialCommercialLogs;
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.LOGS);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Error loading commercial logs:', e);
  }
  return initialCommercialLogs;
}

export function saveCommercialLogs(logs: CommercialLog[]): void {
  if (!isClient) return;
  try {
    localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(logs.slice(0, 100)));
  } catch (e) {
    console.error('Error saving commercial logs:', e);
  }
}

export function calculateCommercialStats(
  promotions: CommercialPromotion[],
  ads: CommercialAdvertisement[],
  leads: CommercialLead[],
  links: CommercialLink[],
  logs: CommercialLog[],
  cyclesCount: number = 0
): CommercialStats {
  const convertedCount = leads.filter(l => l.status === 'converted' || l.status === 'loyal_client').length;
  const loyalCount = leads.filter(l => l.status === 'loyal_client' || l.isLoyalClient).length;

  // RÈGLE STRICTE : Ne jamais inventer, simuler ou gonfler les montants ou le chiffre d'affaires
  // Le chiffre d'affaires ne comptabilise que les montants officiellement validés (0 FCFA si aucun paiement réel confirmé)
  const revenueFromLinks = links.reduce((sum, l) => sum + (l.revenueEarnedFCFA || 0), 0);
  const revenueFromLeads = leads.reduce((sum, l) => sum + (l.totalSpentFCFA || 0), 0);
  const totalRevenue = revenueFromLinks + revenueFromLeads;

  const totalClicks = links.reduce((sum, l) => sum + (l.clicksCount || 0), 0) + 
                     ads.reduce((sum, a) => sum + (a.clicks || 0), 0);

  const globalConversionRate = leads.length > 0 
    ? Math.round((convertedCount / leads.length) * 100) 
    : 0;

  const lastCycleLog = logs.find(l => l.actionType === 'cycle_run');

  return {
    totalRevenueFCFA: totalRevenue,
    totalLeadsCount: leads.length,
    convertedClientsCount: convertedCount,
    loyalClientsCount: loyalCount,
    activeCampaignsCount: ads.filter(a => a.status === 'active').length,
    activePromotionsCount: promotions.filter(p => p.active).length,
    totalClicks,
    globalConversionRate,
    cyclesRunCount: cyclesCount || logs.filter(l => l.actionType === 'cycle_run').length,
    lastCycleAt: lastCycleLog ? lastCycleLog.timestamp : ''
  };
}
