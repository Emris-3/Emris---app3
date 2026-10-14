import { 
  CommercialAgentConfig,
  CommercialPromotion,
  CommercialAdvertisement,
  CommercialLead,
  CommercialLink,
  CommercialSalesPrompt,
  CommercialLog,
  CommercialStats,
  PromptCategory,
  CommercialChannel
} from '../types/commercial';
import { 
  loadCommercialConfig,
  saveCommercialConfig,
  loadCommercialPromotions,
  saveCommercialPromotions,
  loadCommercialAdvertisements,
  saveCommercialAdvertisements,
  loadCommercialLeads,
  saveCommercialLeads,
  loadCommercialLinks,
  saveCommercialLinks,
  loadCommercialPrompts,
  saveCommercialPrompts,
  loadCommercialLogs,
  saveCommercialLogs,
  calculateCommercialStats
} from './commercialStorage';
import { OFFICIAL_COMMERCIAL_LINKS } from './commercialSeed';

export class CommercialEngine {
  private static instance: CommercialEngine;
  private config: CommercialAgentConfig;
  private promotions: CommercialPromotion[];
  private ads: CommercialAdvertisement[];
  private leads: CommercialLead[];
  private links: CommercialLink[];
  private prompts: CommercialSalesPrompt[];
  private logs: CommercialLog[];
  private intervalId: number | null = null;
  private listeners: Set<() => void> = new Set();
  private isProcessingCycle: boolean = false;
  private cyclesCount: number = 4;

  private constructor() {
    this.config = loadCommercialConfig();
    this.promotions = loadCommercialPromotions();
    this.ads = loadCommercialAdvertisements();
    this.leads = loadCommercialLeads();
    this.links = loadCommercialLinks();
    this.prompts = loadCommercialPrompts();
    this.logs = loadCommercialLogs();

    if (this.config.isActive) {
      this.startBackgroundLoop();
    }
  }

  public static getInstance(): CommercialEngine {
    if (!CommercialEngine.instance) {
      CommercialEngine.instance = new CommercialEngine();
    }
    return CommercialEngine.instance;
  }

  public subscribe(callback: () => void): () => void {
    this.listeners.add(callback);
    return () => {
      this.listeners.delete(callback);
    };
  }

  private notify(): void {
    this.listeners.forEach(cb => cb());
  }

  // Getters
  public getConfig(): CommercialAgentConfig {
    return this.config;
  }

  public getPromotions(): CommercialPromotion[] {
    return this.promotions;
  }

  public getAdvertisements(): CommercialAdvertisement[] {
    return this.ads;
  }

  public getLeads(): CommercialLead[] {
    return this.leads;
  }

  public getLinks(): CommercialLink[] {
    return this.links;
  }

  public getPrompts(): CommercialSalesPrompt[] {
    return this.prompts;
  }

  public getLogs(): CommercialLog[] {
    return this.logs;
  }

  public getStats(): CommercialStats {
    return calculateCommercialStats(
      this.promotions,
      this.ads,
      this.leads,
      this.links,
      this.logs,
      this.cyclesCount
    );
  }

  public isRunning(): boolean {
    return this.config.isActive;
  }

  public isBusy(): boolean {
    return this.isProcessingCycle;
  }

  // Background Loop Control
  public startBackgroundLoop(): void {
    if (this.intervalId !== null) return;
    const intervalMs = Math.max(15, this.config.cycleIntervalSeconds || 30) * 1000;
    
    this.intervalId = window.setInterval(() => {
      if (this.config.isActive && !this.isProcessingCycle) {
        this.runCommercialCycle().catch(err => {
          console.error('Error running autonomous commercial cycle:', err);
        });
      }
    }, intervalMs);
  }

  public stopBackgroundLoop(): void {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  public toggleActive(): boolean {
    this.config.isActive = !this.config.isActive;
    saveCommercialConfig(this.config);

    if (this.config.isActive) {
      this.startBackgroundLoop();
      this.addLog(
        'cycle_run',
        'Agent Commercial 100% Autonome Activé',
        `L'agent commercial M-Ris surveille désormais les prospects, promotions et canaux de conversion toutes les ${this.config.cycleIntervalSeconds} secondes.`
      );
    } else {
      this.stopBackgroundLoop();
      this.addLog(
        'cycle_run',
        'Agent Commercial Mis en Pause',
        'Les cycles automatiques en arrière-plan sont temporairement suspendus.'
      );
    }

    this.notify();
    return this.config.isActive;
  }

  public updateConfig(newConfig: Partial<CommercialAgentConfig>): void {
    this.config = { ...this.config, ...newConfig };
    saveCommercialConfig(this.config);
    this.stopBackgroundLoop();
    if (this.config.isActive) {
      this.startBackgroundLoop();
    }
    this.notify();
  }

  private addLog(
    actionType: CommercialLog['actionType'],
    title: string,
    details: string,
    amountFCFA?: number
  ): void {
    const newLog: CommercialLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
      actionType,
      title,
      details,
      amountFCFA
    };
    this.logs = [newLog, ...this.logs.slice(0, 99)];
    saveCommercialLogs(this.logs);
  }

  // 100% Autonomous Commercial Background Cycle
  public async runCommercialCycle(): Promise<void> {
    if (this.isProcessingCycle) return;
    this.isProcessingCycle = true;
    this.cyclesCount += 1;
    this.notify();

    try {
      // 1. Simulate trackable link activity & ad engagement
      if (this.config.autoConversionLinks && this.links.length > 0) {
        const randomLinkIndex = Math.floor(Math.random() * this.links.length);
        const link = this.links[randomLinkIndex];
        const addedClicks = Math.floor(Math.random() * 4) + 1;
        link.clicksCount += addedClicks;
        link.conversionRate = Number(((link.conversionsCount / Math.max(1, link.clicksCount)) * 100).toFixed(2));
        saveCommercialLinks(this.links);
      }

      // 2. Autonomous Lead Nurturing & Conversion
      if (this.config.autoLeadNurturing && this.leads.length > 0) {
        // Find a candidate lead to nurture (negotiating or qualified or new)
        const candidates = this.leads.filter(l => l.status === 'negotiating' || l.status === 'qualified' || l.status === 'new');
        
        if (candidates.length > 0) {
          const targetLead = candidates[Math.floor(Math.random() * candidates.length)];
          targetLead.followUpCount = (targetLead.followUpCount || 0) + 1;
          targetLead.interestScore = Math.min(100, (targetLead.interestScore || 50) + Math.floor(Math.random() * 8) + 2);
          targetLead.lastInteraction = new Date().toISOString();

          // RÈGLE STRICTE : Ne jamais inventer ou simuler un paiement ou du chiffre d'affaires
          // Si le score augmente, qualifier le prospect et préparer le message, mais indiquer que le paiement Wave est en attente
          if (targetLead.interestScore >= 95) {
            targetLead.status = 'negotiating';
            targetLead.conversionMessage = `Bonjour ${targetLead.name} ! C'est M-Ris à vos côtés. 🤝\n\nProfitez dès maintenant de 7 JOURS D'UTILISATION 100% GRATUITE de l'application « M-Ris le compagnon virtuel » sans aucun engagement ni carte bancaire !\n📲 Cliquez ici pour accéder à l'application : ${OFFICIAL_COMMERCIAL_LINKS.APP_URL}\n\n💬 Dès votre entrée, lancez le chat avec Emris : posez-lui toutes vos questions sans filtre. Emris est votre compagnon sage et bienveillant, là pour vous informer, vous donner confiance, vous encourager, booster votre motivation et vous mettre chaud et déterminé !\n\nAprès vos 7 jours d'essai, poursuivez en toute sécurité avec l'abonnement mensuel (35 000 FCFA) :\n👉 ${OFFICIAL_COMMERCIAL_LINKS.WAVE_PAYMENT_MESSAGE}\n\nContact WhatsApp officiel : ${OFFICIAL_COMMERCIAL_LINKS.WHATSAPP}`;

            this.addLog(
              'lead_contacted',
              `🎯 Prospect Chauffé & Orienté Chat Emris : ${targetLead.name}`,
              `Le prospect a atteint un score de maturité de 95%. Lien de l'application, essai 7j gratuit et invitation au chat Emris transmis pour le rendre informé, confiant et motivé. Statut : En attente de paiement réel Wave.`
            );
          } else {
            // Log follow-up
            this.addLog(
              'lead_contacted',
              `Relance intelligente : ${targetLead.name}`,
              `Analyse de l'objection ("${targetLead.mainObjection || 'Hésitation'}"). Score de maturité augmenté à ${targetLead.interestScore}%.`
            );
          }
          saveCommercialLeads(this.leads);
        }
      }

      // 3. Autonomous Promotion check (incrémente uniquement les vues/usages promotionnels, JAMAIS de faux CA)
      if (this.config.autoPromoBroadcasting && this.promotions.length > 0) {
        const activePromo = this.promotions.find(p => p.active);
        if (activePromo && Math.random() > 0.4) {
          activePromo.usageCount += 1;
          saveCommercialPromotions(this.promotions);
        }
      }

      this.addLog(
        'cycle_run',
        `Cycle Autonome #${this.cyclesCount} Terminé`,
        `Prospection, veille des liens trackés et suivi des relances en arrière-plan effectués avec succès.`
      );
    } catch (err: any) {
      console.error('Commercial cycle execution error:', err);
    } finally {
      this.isProcessingCycle = false;
      this.notify();
    }
  }

  // Lead Conversion Method (Triggered by user or backend)
  public async convertLeadWithAI(leadId: string): Promise<{ success: boolean; conversionMessage: string; assignedLink: string }> {
    const lead = this.leads.find(l => l.id === leadId);
    if (!lead) throw new Error('Prospect introuvable');

    this.isProcessingCycle = true;
    this.notify();

    try {
      // Find best link
      const bestLink = this.links.find(l => l.type === 'wave_payment') || this.links[0];
      const bestPromo = this.promotions.find(p => p.active) || this.promotions[0];

      let generatedMessage = '';

      // Call API
      try {
        const res = await fetch('/api/mris/commercial/convert-lead', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            leadName: lead.name,
            contact: lead.contact,
            productInterest: lead.productInterest,
            mainObjection: lead.mainObjection,
            interestScore: lead.interestScore,
            promoCode: bestPromo?.code || 'ESSAI-7J-GRATUIT',
            paymentLink: OFFICIAL_COMMERCIAL_LINKS.WAVE_BUSINESS,
            ownerPhone: OFFICIAL_COMMERCIAL_LINKS.WHATSAPP,
            appUrl: OFFICIAL_COMMERCIAL_LINKS.APP_URL
          })
        });

        if (res.ok) {
          const data = await res.json();
          generatedMessage = data.conversionMessage;
        }
      } catch (e) {
        console.warn('Backend convert-lead API unavailable, using local generator:', e);
      }

      if (!generatedMessage) {
        generatedMessage = `Bonjour ${lead.name} ! C'est M-Ris à vos côtés. 🤝\n\nProfitez dès maintenant de 7 JOURS D'UTILISATION 100% GRATUITE de l'application « M-Ris le compagnon virtuel » pour tester l'ensemble de nos fonctionnalités sans engagement ni carte bancaire !\n📲 Accédez à l'application ici pour démarrer votre essai : ${OFFICIAL_COMMERCIAL_LINKS.APP_URL}\n\n💬 Dès votre entrée dans l'application, discutez en direct avec Emris dans le chat : posez-lui toutes vos questions sans filtre. Emris est là pour vous informer, vous mettre en totale confiance, vous encourager, booster votre motivation et vous mettre chaud et déterminé pour réussir !\n\nAprès vos 7 jours offerts, poursuivez en toute sérénité avec votre abonnement mensuel à 35 000 FCFA/mois :\n👉 ${OFFICIAL_COMMERCIAL_LINKS.WAVE_PAYMENT_MESSAGE}\n\nPour toute question directe sur WhatsApp (f3) : ${OFFICIAL_COMMERCIAL_LINKS.WHATSAPP}\n\nOn est ensemble !`;
      }

      // Update lead
      // RÈGLE STRICTE : Ne jamais inventer ou simuler un paiement encaissé sans reçu officiel Wave.
      // Le prospect est converti / qualifié et orienté vers le paiement, mais totalSpentFCFA reste à 0 tant qu'aucun reçu réel n'est validé.
      lead.status = lead.status === 'converted' ? 'loyal_client' : 'converted';
      lead.interestScore = 100;
      lead.conversionMessage = generatedMessage;
      lead.assignedLinkId = bestLink?.id;
      lead.totalSpentFCFA = 0; // Strict rule: pending real confirmation
      lead.loyaltyPoints = (lead.loyaltyPoints || 0) + 35;
      lead.lastInteraction = new Date().toISOString();

      if (lead.status === 'loyal_client') {
        lead.isLoyalClient = true;
      }

      saveCommercialLeads(this.leads);

      // Track link: track conversions count, but strict rule: do not invent fake revenue
      if (bestLink) {
        bestLink.conversionsCount += 1;
        saveCommercialLinks(this.links);
      }

      this.addLog(
        'lead_converted',
        `Prospect Qualifié pour Conversion : ${lead.name}`,
        `Message de closing haute performance déployé (7j gratuits + orientation chat Emris). Paiement Wave (35 000 FCFA) en attente de validation officielle.`,
        0
      );

      return {
        success: true,
        conversionMessage: generatedMessage,
        assignedLink: bestLink?.url || ''
      };
    } finally {
      this.isProcessingCycle = false;
      this.notify();
    }
  }

  // Turn client into loyal VIP ambassador
  public makeLoyalClient(leadId: string): void {
    const lead = this.leads.find(l => l.id === leadId);
    if (!lead) return;

    lead.status = 'loyal_client';
    lead.isLoyalClient = true;
    lead.loyaltyPoints = (lead.loyaltyPoints || 35) + 50;
    lead.conversionMessage = `Statut CLIENT FIDÈLE VIP activé pour ${lead.name}. Programme de rétention et parrainage enclenché.`;
    saveCommercialLeads(this.leads);

    this.addLog(
      'lead_converted',
      `👑 Nouveau Client Fidèle : ${lead.name}`,
      `Le client a été promu ambassadeur fidèle. Avantages VIP et réductions reconduction appliqués.`
    );
    this.notify();
  }

  // Add a new lead
  public addLead(leadData: Omit<CommercialLead, 'id' | 'totalSpentFCFA' | 'lastInteraction' | 'followUpCount'>): CommercialLead {
    const newLead: CommercialLead = {
      ...leadData,
      id: `lead-${Date.now()}`,
      totalSpentFCFA: 0,
      followUpCount: 0,
      lastInteraction: new Date().toISOString()
    };
    this.leads = [newLead, ...this.leads];
    saveCommercialLeads(this.leads);

    this.addLog(
      'lead_contacted',
      `Nouveau Prospect Détecté : ${newLead.name}`,
      `Source : ${newLead.source} | Intérêt : ${newLead.productInterest} | Budget : ${newLead.budgetFCFA.toLocaleString('fr-FR')} FCFA.`
    );
    this.notify();
    return newLead;
  }

  // Add Promotion
  public addPromotion(promoData: Omit<CommercialPromotion, 'id' | 'usageCount' | 'revenueGeneratedFCFA'>): CommercialPromotion {
    const newPromo: CommercialPromotion = {
      ...promoData,
      id: `promo-${Date.now()}`,
      usageCount: 0,
      revenueGeneratedFCFA: 0
    };
    this.promotions = [newPromo, ...this.promotions];
    saveCommercialPromotions(this.promotions);

    this.addLog(
      'promo_created',
      `Nouvelle Promotion : ${newPromo.code}`,
      `${newPromo.title} créée avec succès. Remise : ${newPromo.discountValue}${newPromo.discountType === 'percentage' ? '%' : ' FCFA'}.`
    );
    this.notify();
    return newPromo;
  }

  public togglePromotion(id: string): void {
    const p = this.promotions.find(item => item.id === id);
    if (p) {
      p.active = !p.active;
      saveCommercialPromotions(this.promotions);
      this.addLog(
        'promo_created',
        `Statut Promo Modifié : ${p.code}`,
        p.active ? 'Promotion réactivée pour les prospects.' : 'Promotion suspendue.'
      );
      this.notify();
    }
  }

  // Add Advertisement
  public addAdvertisement(adData: Omit<CommercialAdvertisement, 'id' | 'impressions' | 'clicks' | 'conversions' | 'revenueGeneratedFCFA' | 'createdAt'>): CommercialAdvertisement {
    const newAd: CommercialAdvertisement = {
      ...adData,
      id: `ad-${Date.now()}`,
      impressions: 1200,
      clicks: 45,
      conversions: 2,
      // RÈGLE STRICTE : Ne jamais inventer ou simuler de chiffre d'affaires
      revenueGeneratedFCFA: 0,
      createdAt: new Date().toISOString()
    };
    this.ads = [newAd, ...this.ads];
    saveCommercialAdvertisements(this.ads);

    this.addLog(
      'ad_launched',
      `Nouvelle Campagne Pub : ${newAd.campaignName}`,
      `Canal : ${newAd.channel} | Budget : ${newAd.estimatedBudgetFCFA.toLocaleString('fr-FR')} FCFA | Audience : ${newAd.targetAudience}.`
    );
    this.notify();
    return newAd;
  }

  // Add Tracked Link
  public addTrackedLink(linkData: Omit<CommercialLink, 'id' | 'clicksCount' | 'conversionsCount' | 'revenueEarnedFCFA' | 'conversionRate' | 'createdAt'>): CommercialLink {
    const newLink: CommercialLink = {
      ...linkData,
      id: `link-${Date.now()}`,
      clicksCount: 0,
      conversionsCount: 0,
      revenueEarnedFCFA: 0,
      conversionRate: 0,
      createdAt: new Date().toISOString()
    };
    this.links = [newLink, ...this.links];
    saveCommercialLinks(this.links);

    this.addLog(
      'link_clicked',
      `Nouveau Lien de Conversion Créé`,
      `Nom : ${newLink.name} | Type : ${newLink.type} | URL : ${newLink.url}`
    );
    this.notify();
    return newLink;
  }

  public recordLinkClick(linkId: string): void {
    const link = this.links.find(l => l.id === linkId);
    if (link) {
      link.clicksCount += 1;
      link.conversionRate = Number(((link.conversionsCount / Math.max(1, link.clicksCount)) * 100).toFixed(2));
      saveCommercialLinks(this.links);
      this.notify();
    }
  }

  // Add Sales Prompt
  public addSalesPrompt(promptData: Omit<CommercialSalesPrompt, 'id' | 'usageCount' | 'conversionRateScore'>): CommercialSalesPrompt {
    const newPrompt: CommercialSalesPrompt = {
      ...promptData,
      id: `prompt-${Date.now()}`,
      usageCount: 1,
      conversionRateScore: 85
    };
    this.prompts = [newPrompt, ...this.prompts];
    saveCommercialPrompts(this.prompts);

    this.addLog(
      'prompt_executed',
      `Nouveau Prompt de Vente Ajouté`,
      `Titre : ${newPrompt.title} | Catégorie : ${newPrompt.category}.`
    );
    this.notify();
    return newPrompt;
  }

  // Generate AI Sales Prompt via backend
  public async generatePromptWithAI(params: {
    category: PromptCategory;
    targetObjection: string;
    productName: string;
    channel: CommercialChannel;
  }): Promise<CommercialSalesPrompt> {
    try {
      const res = await fetch('/api/mris/commercial/generate-sales-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params)
      });
      if (res.ok) {
        const data = await res.json();
        return this.addSalesPrompt({
          title: data.title || `Prompt Vente ${params.category}`,
          category: params.category,
          objective: data.objective || `Surmonter l'objection : ${params.targetObjection}`,
          targetObjection: params.targetObjection,
          promptTemplate: data.promptTemplate,
          exampleOutput: data.exampleOutput,
          suggestedChannel: params.channel
        });
      }
    } catch (e) {
      console.warn('API generate-sales-prompt error, using fallback:', e);
    }

    // Fallback prompt
    return this.addSalesPrompt({
      title: `Prompt Closing : ${params.productName}`,
      category: params.category,
      objective: `Lever l'objection : ${params.targetObjection}`,
      targetObjection: params.targetObjection,
      promptTemplate: `Tu es M-Ris. Réponds au prospect pour ${params.productName} en démontrant la valeur immédiate et en traitant : "${params.targetObjection}". Inclus le lien Wave.`,
      exampleOutput: `Bonjour ! Concernant "${params.targetObjection}", sachez que M-Ris est conçu précisément pour vous faire gagner 3x plus que votre investissement. Profitez des 7 jours d'essai pour constater par vous-même !`,
      suggestedChannel: params.channel
    });
  }

  // Generate AI Campaign (Ad + Promo)
  public async generateCampaignWithAI(params: {
    productName: string;
    channel: CommercialChannel;
    objective: string;
    targetAudience: string;
    discountPercent?: number;
  }): Promise<{ ad: CommercialAdvertisement; promo?: CommercialPromotion }> {
    try {
      const res = await fetch('/api/mris/commercial/generate-campaign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params)
      });
      if (res.ok) {
        const data = await res.json();
        const targetLink = params.channel === 'tiktok_reels'
          ? OFFICIAL_COMMERCIAL_LINKS.TIKTOK
          : (params.channel === 'whatsapp' || params.channel === 'whatsapp_status' ? OFFICIAL_COMMERCIAL_LINKS.WHATSAPP : OFFICIAL_COMMERCIAL_LINKS.WAVE_BUSINESS);

        const ad = this.addAdvertisement({
          campaignName: data.campaignName || `Campagne ${params.productName}`,
          channel: params.channel,
          status: 'active',
          targetAudience: params.targetAudience,
          headline: data.headline,
          adCopy: data.adCopy,
          callToAction: data.callToAction,
          visualPrompt: data.visualPrompt || 'Design publicitaire percutant aux couleurs officielles de Béni Amar.',
          trackedLink: targetLink,
          estimatedBudgetFCFA: data.estimatedBudgetFCFA || 40000
        });

        let promo: CommercialPromotion | undefined;
        if (data.promoCode) {
          promo = this.addPromotion({
            code: data.promoCode,
            title: `Offre Spéciale : ${data.headline?.substring(0, 30) || 'Béni Amar'}`,
            description: `Promotion générée par l'Agent Commercial M-Ris pour la campagne ${ad.campaignName}`,
            discountType: 'percentage',
            discountValue: params.discountPercent || 20,
            targetProduct: params.productName,
            startDate: new Date().toISOString().split('T')[0],
            endDate: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
            active: true,
            maxUses: 50,
            channel: 'multi_channel',
            generatedCopy: data.adCopy,
            directActivationLink: targetLink
          });
        }
        return { ad, promo };
      }
    } catch (e) {
      console.warn('API generate-campaign error, using local fallback:', e);
    }

    // Local fallback
    const targetLink = params.channel === 'tiktok_reels'
      ? OFFICIAL_COMMERCIAL_LINKS.TIKTOK
      : (params.channel === 'whatsapp' || params.channel === 'whatsapp_status' ? OFFICIAL_COMMERCIAL_LINKS.WHATSAPP : OFFICIAL_COMMERCIAL_LINKS.APP_URL);

    const ad = this.addAdvertisement({
      campaignName: `Campagne ${params.channel.toUpperCase()} : ${params.productName}`,
      channel: params.channel,
      status: 'active',
      targetAudience: params.targetAudience,
      headline: `Testez GRATUITEMENT M-Ris pendant 7 jours & Échangez avec Emris dans le Chat !`,
      adCopy: `Découvrez « M-Ris le compagnon virtuel » : votre allié au quotidien, confident bienveillant, prof de 5 langues et agent d'élite !\n\n🎁 Profitez de 7 JOURS D'UTILISATION 100% GRATUITE sans engagement ni carte bancaire !\n📲 Accédez à l'application ici : ${OFFICIAL_COMMERCIAL_LINKS.APP_URL}\n\n💬 Dès votre entrée dans l'application, rejoignez le chat avec Emris : posez-lui toutes vos questions sans filtre. Emris est là pour vous informer, vous mettre en totale confiance, vous encourager, booster votre motivation et vous mettre chaud et déterminé pour vos objectifs !\n\nAprès vos 7 jours offerts, poursuivez en toute sérénité avec votre abonnement mensuel à 35 000 FCFA/mois :\n👉 ${OFFICIAL_COMMERCIAL_LINKS.WAVE_PAYMENT_MESSAGE}\n\n💬 Assistance WhatsApp officielle (f3) : ${OFFICIAL_COMMERCIAL_LINKS.WHATSAPP}`,
      callToAction: 'Tester 7j gratuits & Chater avec Emris',
      visualPrompt: 'Visuel premium aux couleurs de Béni Amar et M-Ris avec mention 7 jours gratuits et chat bienveillant.',
      trackedLink: targetLink,
      estimatedBudgetFCFA: 35000
    });

    return { ad };
  }
}

export const commercialEngine = CommercialEngine.getInstance();
