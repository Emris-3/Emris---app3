import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  Target, 
  Sparkles, 
  Megaphone, 
  Tag, 
  Users, 
  Link as LinkIcon, 
  MessageSquare, 
  Play, 
  Pause, 
  RefreshCw, 
  Copy, 
  Check, 
  Plus, 
  ArrowUpRight, 
  ShieldCheck, 
  Clock, 
  CheckCircle2, 
  Zap, 
  ExternalLink, 
  DollarSign, 
  Award, 
  Sliders, 
  AlertCircle, 
  Eye, 
  Share2, 
  Flame, 
  ChevronRight,
  Filter,
  ArrowRight,
  Bot,
  Radio,
  Send
} from 'lucide-react';
import { 
  CommercialAgentConfig,
  CommercialPromotion,
  CommercialAdvertisement,
  CommercialLead,
  CommercialLink,
  CommercialSalesPrompt,
  CommercialLog,
  CommercialStats,
  CommercialChannel,
  LeadStatus,
  PromptCategory
} from '../types/commercial';
import { commercialEngine } from '../services/commercialService';
import { OFFICIAL_COMMERCIAL_LINKS } from '../services/commercialSeed';
import { FORMAT_FCFA } from '../utils/constants';

interface CommercialAgentHubProps {
  onBackToCompanion?: () => void;
  userEmail?: string;
  userName?: string;
}

export const CommercialAgentHub: React.FC<CommercialAgentHubProps> = ({
  onBackToCompanion,
  userEmail = 'camaraesther920@gmail.com',
  userName = 'Camara Esther'
}) => {
  // Engine States
  const [config, setConfig] = useState<CommercialAgentConfig>(commercialEngine.getConfig());
  const [promotions, setPromotions] = useState<CommercialPromotion[]>(commercialEngine.getPromotions());
  const [ads, setAds] = useState<CommercialAdvertisement[]>(commercialEngine.getAdvertisements());
  const [leads, setLeads] = useState<CommercialLead[]>(commercialEngine.getLeads());
  const [links, setLinks] = useState<CommercialLink[]>(commercialEngine.getLinks());
  const [prompts, setPrompts] = useState<CommercialSalesPrompt[]>(commercialEngine.getPrompts());
  const [logs, setLogs] = useState<CommercialLog[]>(commercialEngine.getLogs());
  const [stats, setStats] = useState<CommercialStats>(commercialEngine.getStats());
  const [isBusy, setIsBusy] = useState<boolean>(commercialEngine.isBusy());

  // UI Tabs: 'overview' | 'promotions' | 'ads' | 'leads' | 'links' | 'prompts'
  const [activeTab, setActiveTab] = useState<'overview' | 'promotions' | 'ads' | 'leads' | 'links' | 'prompts'>('overview');

  // Modals & form state
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isNewPromoModalOpen, setIsNewPromoModalOpen] = useState(false);
  const [isNewAdModalOpen, setIsNewAdModalOpen] = useState(false);
  const [isNewLeadModalOpen, setIsNewLeadModalOpen] = useState(false);
  const [isNewLinkModalOpen, setIsNewLinkModalOpen] = useState(false);
  const [isGeneratePromptModalOpen, setIsGeneratePromptModalOpen] = useState(false);
  const [selectedLeadForConversion, setSelectedLeadForConversion] = useState<CommercialLead | null>(null);
  const [conversionModalResult, setConversionModalResult] = useState<{ message: string; link: string } | null>(null);
  const [campaignWhatsAppModal, setCampaignWhatsAppModal] = useState<CommercialAdvertisement | null>(null);

  // New Promotion Form
  const [newPromoCode, setNewPromoCode] = useState('');
  const [newPromoTitle, setNewPromoTitle] = useState('');
  const [newPromoDiscount, setNewPromoDiscount] = useState(20);
  const [newPromoProduct, setNewPromoProduct] = useState('Abonnement Mensuel M-Ris (35 000 FCFA)');

  // New Ad Form
  const [newAdChannel, setNewAdChannel] = useState<CommercialChannel>('whatsapp');
  const [newAdProduct, setNewAdProduct] = useState('Abonnement M-Ris 35 000 FCFA');
  const [newAdAudience, setNewAdAudience] = useState('Commerçants, cadres et entrepreneurs à Abidjan');
  const [isSubmittingAd, setIsSubmittingAd] = useState(false);

  // New Lead Form
  const [newLeadName, setNewLeadName] = useState('');
  const [newLeadContact, setNewLeadContact] = useState('');
  const [newLeadSource, setNewLeadSource] = useState('WhatsApp');
  const [newLeadObjection, setNewLeadObjection] = useState('');

  // New Link Form
  const [newLinkName, setNewLinkName] = useState('');
  const [newLinkUrl, setNewLinkUrl] = useState('');
  const [newLinkType, setNewLinkType] = useState<'wave_payment' | 'whatsapp_closing' | 'promo_landing'>('wave_payment');

  // Prompt Generator Form
  const [genPromptCategory, setGenPromptCategory] = useState<PromptCategory>('closing_rapide');
  const [genPromptObjection, setGenPromptObjection] = useState('Hésite sur le prix de 35 000 FCFA');
  const [isGeneratingPrompt, setIsGeneratingPrompt] = useState(false);

  // Filter for leads
  const [leadStatusFilter, setLeadStatusFilter] = useState<'all' | LeadStatus>('all');

  // Subscribe to engine changes
  useEffect(() => {
    const unsubscribe = commercialEngine.subscribe(() => {
      setConfig({ ...commercialEngine.getConfig() });
      setPromotions([...commercialEngine.getPromotions()]);
      setAds([...commercialEngine.getAdvertisements()]);
      setLeads([...commercialEngine.getLeads()]);
      setLinks([...commercialEngine.getLinks()]);
      setPrompts([...commercialEngine.getPrompts()]);
      setLogs([...commercialEngine.getLogs()]);
      setStats({ ...commercialEngine.getStats() });
      setIsBusy(commercialEngine.isBusy());
    });
    return () => unsubscribe();
  }, []);

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handleToggleAutonomy = () => {
    commercialEngine.toggleActive();
  };

  const handleRunCycleNow = async () => {
    await commercialEngine.runCommercialCycle();
  };

  const handleConvertLead = async (lead: CommercialLead) => {
    setSelectedLeadForConversion(lead);
    const res = await commercialEngine.convertLeadWithAI(lead.id);
    setConversionModalResult({
      message: res.conversionMessage,
      link: res.assignedLink
    });
  };

  const handlePromoteLoyal = (leadId: string) => {
    commercialEngine.makeLoyalClient(leadId);
  };

  const handleCreatePromo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPromoCode.trim() || !newPromoTitle.trim()) return;

    commercialEngine.addPromotion({
      code: newPromoCode.trim().toUpperCase(),
      title: newPromoTitle.trim(),
      description: `Offre exclusive créée par l'Agent Commercial M-Ris.`,
      discountType: 'percentage',
      discountValue: newPromoDiscount,
      targetProduct: newPromoProduct,
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0],
      active: true,
      maxUses: 50,
      channel: 'multi_channel',
      generatedCopy: `🔥 Offre Spéciale M-Ris : Profitez de -${newPromoDiscount}% avec le code ${newPromoCode.toUpperCase()} !`,
      directActivationLink: `https://wa.me/message/RGXYT5LWDCTAM1?text=Activation%20avec%20le%20code%20${newPromoCode.toUpperCase()}`
    });

    setNewPromoCode('');
    setNewPromoTitle('');
    setIsNewPromoModalOpen(false);
  };

  const handleGenerateAdWithAI = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmittingAd) return;
    setIsSubmittingAd(true);

    try {
      const result = await commercialEngine.generateCampaignWithAI({
        productName: newAdProduct,
        channel: newAdChannel,
        objective: 'Conversion immédiate et acquisition clients fidèles',
        targetAudience: newAdAudience,
        discountPercent: 20
      });
      setIsNewAdModalOpen(false);
      if (result && result.ad) {
        setCampaignWhatsAppModal(result.ad);
      }
    } finally {
      setIsSubmittingAd(false);
    }
  };

  const handleCreateLead = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLeadName.trim()) return;

    commercialEngine.addLead({
      name: newLeadName.trim(),
      contact: newLeadContact.trim() || '+225 07 00 00 00 00',
      source: newLeadSource,
      status: 'new',
      interestScore: 65,
      productInterest: 'Abonnement Mensuel M-Ris (35 000 FCFA)',
      budgetFCFA: 35000,
      mainObjection: newLeadObjection.trim() || 'Hésitation initiale sur l\'activation',
      notes: 'Prospect enregistré pour conversion automatique.'
    });

    setNewLeadName('');
    setNewLeadContact('');
    setNewLeadObjection('');
    setIsNewLeadModalOpen(false);
  };

  const handleCreateLink = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLinkName.trim() || !newLinkUrl.trim()) return;

    commercialEngine.addTrackedLink({
      name: newLinkName.trim(),
      type: newLinkType,
      url: newLinkUrl.trim(),
      destination: 'Portail de conversion et validation Wave',
      prefilledMessage: 'Paiement abonnement sécurisé Wave'
    });

    setNewLinkName('');
    setNewLinkUrl('');
    setIsNewLinkModalOpen(false);
  };

  const handleGenerateSalesPrompt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isGeneratingPrompt) return;
    setIsGeneratingPrompt(true);

    try {
      await commercialEngine.generatePromptWithAI({
        category: genPromptCategory,
        targetObjection: genPromptObjection,
        productName: 'Abonnement Mensuel M-Ris (35 000 FCFA)',
        channel: 'whatsapp'
      });
      setIsGeneratePromptModalOpen(false);
    } finally {
      setIsGeneratingPrompt(false);
    }
  };

  const filteredLeads = leads.filter(l => {
    if (leadStatusFilter === 'all') return true;
    return l.status === leadStatusFilter;
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-20">
      
      {/* Top Hero Banner with Live Engine Status */}
      <div className="bg-gradient-to-r from-slate-950 via-indigo-950 to-slate-900 border-b border-indigo-900/40 px-4 sm:px-6 lg:px-8 py-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-20 w-80 h-80 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          
          {/* Title & Autonomous Badge */}
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-cyan-500 via-indigo-600 to-emerald-500 p-0.5 shadow-xl shadow-cyan-500/20 shrink-0">
              <div className="w-full h-full bg-slate-900 rounded-[14px] flex items-center justify-center">
                <Target className="w-7 h-7 text-cyan-400" />
              </div>
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2.5 mb-1.5">
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-2">
                  <span>M-Ris Agent Commercial</span>
                  <span className="text-cyan-400">100% Autonome</span>
                </h1>
                
                {/* Autonomy Badge */}
                <div className={`px-3 py-1 rounded-full text-xs font-black flex items-center gap-1.5 border shadow-sm ${
                  config.isActive
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 animate-pulse'
                    : 'bg-slate-800 text-slate-400 border-slate-700'
                }`}>
                  <span className={`w-2 h-2 rounded-full ${config.isActive ? 'bg-emerald-400' : 'bg-slate-500'}`} />
                  <span>{config.isActive ? 'Actif en Arrière-Plan (24h/24)' : 'Mode Autonome en Pause'}</span>
                </div>
              </div>

              <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
                Votre closer & stratège d'élite : il gère vos <strong className="text-white">promotions</strong>, diffuse vos <strong className="text-white">publicités</strong>, et convertit activement vos <strong className="text-white">prospects en clients fidèles</strong> à travers des liens trackés et des prompts haute conversion.
              </p>
            </div>
          </div>

          {/* Controls: Toggle Switch & Manual Trigger */}
          <div className="flex flex-wrap items-center gap-3 bg-slate-900/90 p-3 rounded-2xl border border-slate-800 shadow-lg">
            
            <button
              onClick={handleToggleAutonomy}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                config.isActive
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-400 shadow-md shadow-emerald-600/30'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
              }`}
            >
              {config.isActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              <span>{config.isActive ? '100% Autonome : ON' : 'Activer l\'Autonomie'}</span>
            </button>

            <button
              onClick={handleRunCycleNow}
              disabled={isBusy}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                isBusy
                  ? 'bg-slate-800 text-slate-500 border-slate-700 cursor-not-allowed'
                  : 'bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white border-cyan-400 shadow-md'
              }`}
            >
              <RefreshCw className={`w-4 h-4 ${isBusy ? 'animate-spin text-cyan-300' : ''}`} />
              <span>{isBusy ? 'Cycle en cours...' : 'Exécuter un Cycle Maintenant'}</span>
            </button>

            {onBackToCompanion && (
              <button
                onClick={onBackToCompanion}
                className="px-3 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Retour Compagnon
              </button>
            )}
          </div>
        </div>

        {/* Global Performance Counters */}
        <div className="max-w-7xl mx-auto grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5 mt-6">
          
          <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-3.5 shadow-sm">
            <span className="text-[11px] font-semibold text-slate-400 block mb-1">Chiffre d'Affaires</span>
            <div className="text-base sm:text-lg font-black text-emerald-400">
              {stats.totalRevenueFCFA.toLocaleString('fr-FR')} F
            </div>
            <span className="text-[10px] text-emerald-500/80 font-medium flex items-center gap-1 mt-0.5">
              <TrendingUp className="w-3 h-3" /> {stats.totalRevenueFCFA === 0 ? 'En attente validation Wave' : 'Reçus Wave validés'}
            </span>
            <span className="text-[9px] text-slate-500 block mt-0.5">
              🛡️ Règle : 0 FCFA simulé
            </span>
          </div>

          <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-3.5 shadow-sm">
            <span className="text-[11px] font-semibold text-slate-400 block mb-1">Prospects Suivis</span>
            <div className="text-base sm:text-lg font-black text-white">
              {stats.totalLeadsCount} leads
            </div>
            <span className="text-[10px] text-cyan-400 font-medium">Pipeline actif 24h</span>
          </div>

          <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-3.5 shadow-sm">
            <span className="text-[11px] font-semibold text-slate-400 block mb-1">Clients Fidèles VIP</span>
            <div className="text-base sm:text-lg font-black text-amber-300 flex items-center gap-1">
              <Award className="w-4 h-4 text-amber-400" />
              <span>{stats.loyalClientsCount}</span>
            </div>
            <span className="text-[10px] text-amber-400/80 font-medium">Récurrent & ambassadeurs</span>
          </div>

          <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-3.5 shadow-sm">
            <span className="text-[11px] font-semibold text-slate-400 block mb-1">Taux de Conversion</span>
            <div className="text-base sm:text-lg font-black text-cyan-400">
              {stats.globalConversionRate}%
            </div>
            <span className="text-[10px] text-cyan-500/80 font-medium">Closing optimisé</span>
          </div>

          <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-3.5 shadow-sm">
            <span className="text-[11px] font-semibold text-slate-400 block mb-1">Promotions Actives</span>
            <div className="text-base sm:text-lg font-black text-purple-400">
              {stats.activePromotionsCount} codes
            </div>
            <span className="text-[10px] text-purple-400/80 font-medium">Ventes flash en cours</span>
          </div>

          <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-3.5 shadow-sm">
            <span className="text-[11px] font-semibold text-slate-400 block mb-1">Cycles Exécutés</span>
            <div className="text-base sm:text-lg font-black text-indigo-400">
              #{stats.cyclesRunCount}
            </div>
            <span className="text-[10px] text-indigo-400/80 font-medium">Arrière-plan permanent</span>
          </div>
        </div>

        {/* WhatsApp Direct Communication Strip for Esther */}
        <div className="max-w-7xl mx-auto mt-6 bg-gradient-to-r from-emerald-950/80 via-slate-900 to-teal-950 border border-emerald-500/40 rounded-3xl p-5 shadow-xl">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/30">
                <MessageSquare className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                    Liaison WhatsApp Officielle
                  </span>
                  <span className="text-xs text-emerald-300 font-mono">
                    wa.me/message/RGXYT5LWDCTAM1
                  </span>
                </div>
                <h3 className="font-extrabold text-sm sm:text-base text-white mt-1">
                  Pourquoi vous ne receviez pas de message automatique sur WhatsApp ?
                </h3>
                <p className="text-xs text-slate-300 mt-0.5 leading-relaxed max-w-3xl">
                  Les navigateurs web ne peuvent pas transmettre silencieusement de message privé sur un compte WhatsApp sans action de clic. M-Ris intègre désormais un bouton de transmission instantanée pré-formaté pour chaque campagne publicitaire, promotion et prospect.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
              <a
                href={`https://wa.me/message/RGXYT5LWDCTAM1?text=${encodeURIComponent('Bonjour Camara Esther ! Test de transmission WhatsApp réussi. M-Ris est bien connecté à votre compte officiel pour diffuser les campagnes publicitaires.')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-all flex items-center gap-1.5 cursor-pointer hover:scale-105"
              >
                <Radio className="w-3.5 h-3.5" />
                <span>Tester ma Réception WhatsApp</span>
              </a>

              {ads.length > 0 && (
                <a
                  href={`https://wa.me/message/RGXYT5LWDCTAM1?text=${encodeURIComponent(`📢 NOUVELLE CAMPAGNE M-RIS : ${ads[0].campaignName}\n\nAccroche : « ${ads[0].headline} »\n\nTexte publicitaire :\n${ads[0].adCopy}\n\nLien de conversion : ${ads[0].trackedLink}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-emerald-500/30 font-bold text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Envoyer la dernière publicité</span>
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        
        {/* Navigation Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-slate-800 no-scrollbar">
          
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'overview'
                ? 'bg-gradient-to-r from-cyan-500 to-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            <span>Tableau de Bord & Live Activity</span>
          </button>

          <button
            onClick={() => setActiveTab('promotions')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'promotions'
                ? 'bg-gradient-to-r from-purple-500 to-pink-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Tag className="w-4 h-4" />
            <span>Promotions & Ventes Flash ({promotions.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('ads')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'ads'
                ? 'bg-gradient-to-r from-blue-500 to-cyan-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Megaphone className="w-4 h-4" />
            <span>Publicités Multi-Canaux ({ads.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('leads')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'leads'
                ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Pipeline Prospects & Fidélisation ({leads.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('links')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'links'
                ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <LinkIcon className="w-4 h-4" />
            <span>Liens de Conversion Trackés ({links.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('prompts')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'prompts'
                ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>Prompts de Vente & Closing ({prompts.length})</span>
          </button>
        </div>

        {/* ========================================================================= */}
        {/* TAB 1: OVERVIEW & LIVE ACTIVITY */}
        {/* ========================================================================= */}
        {activeTab === 'overview' && (
          <div className="mt-6 space-y-6">

            {/* Exclusive Official Links & 7-Day Free Trial Offer Banner */}
            <div className="bg-gradient-to-r from-amber-950/40 via-slate-900 to-sky-950/40 border border-amber-500/30 rounded-3xl p-6 shadow-xl relative overflow-hidden">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-300 shrink-0">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-white flex items-center gap-2">
                      <span>Offre Officielle : 7 Jours Gratuits puis Abonnement Mensuel</span>
                      <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        Certifié 100%
                      </span>
                    </h3>
                    <p className="text-xs text-slate-300 mt-0.5">
                      L'Agent Commercial M-Ris informe obligatoirement sur les <strong>7 jours d'utilisation 100% gratuite</strong> de l'application « M-Ris le compagnon virtuel » avant de passer à l'abonnement mensuel (35 000 FCFA/mois via Wave Business Béni Amar).
                    </p>
                  </div>
                </div>
              </div>

              {/* 7-Day Free Trial Highlight Bar */}
              <div className="mb-4 bg-sky-950/50 border border-sky-500/30 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-sky-200">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <strong className="text-white text-sm">7 Jours d'Utilisation Gratuite de « M-Ris le compagnon virtuel »</strong>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-400/20 text-amber-300 border border-amber-400/30">Sans Carte Bancaire</span>
                  </div>
                  <p className="text-slate-300 leading-relaxed">
                    Testez toutes les fonctionnalités (compagnon bienveillant, prof de 5 langues avec exercices & devoirs, agent commercial autonome) gratuitement pendant 7 jours avant le passage à l'abonnement mensuel de 35 000 FCFA/mois.
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleCopy('app-link-copy', OFFICIAL_COMMERCIAL_LINKS.APP_URL)}
                    className="px-3.5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-md"
                  >
                    {copiedId === 'app-link-copy' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedId === 'app-link-copy' ? 'Lien Copié !' : 'Copier Lien Application'}</span>
                  </button>
                  <a
                    href={OFFICIAL_COMMERCIAL_LINKS.APP_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold transition-colors flex items-center gap-1.5"
                    title="Ouvrir l'application"
                  >
                    <span>Ouvrir</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                {/* 1. Lien Application M-Ris */}
                <div className="bg-slate-950/80 p-3.5 rounded-2xl border border-sky-500/30 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] font-bold text-sky-400 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                        <span>M-Ris le compagnon virtuel</span>
                      </span>
                      <span className="text-[10px] text-amber-400 font-mono font-bold">7j Offerts</span>
                    </div>
                    <div className="font-mono text-xs text-white truncate bg-slate-900 p-2 rounded-xl border border-slate-800/80 mb-3">
                      {OFFICIAL_COMMERCIAL_LINKS.APP_URL}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 pt-2 border-t border-slate-800/60">
                    <button
                      onClick={() => handleCopy('official-app', OFFICIAL_COMMERCIAL_LINKS.APP_URL)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 text-xs font-bold transition-all cursor-pointer"
                    >
                      {copiedId === 'official-app' ? <Check className="w-3.5 h-3.5 text-sky-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedId === 'official-app' ? 'Copié !' : 'Copier'}</span>
                    </button>
                    <a
                      href={OFFICIAL_COMMERCIAL_LINKS.APP_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
                      title="Ouvrir l'application"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>

                {/* 2. WhatsApp */}
                <div className="bg-slate-950/80 p-3.5 rounded-2xl border border-slate-800 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] font-bold text-emerald-400 flex items-center gap-1.5">
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>WhatsApp Officiel (f3)</span>
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">f3</span>
                    </div>
                    <div className="font-mono text-xs text-white truncate bg-slate-900 p-2 rounded-xl border border-slate-800/80 mb-3">
                      {OFFICIAL_COMMERCIAL_LINKS.WHATSAPP}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 pt-2 border-t border-slate-800/60">
                    <button
                      onClick={() => handleCopy('official-wa', OFFICIAL_COMMERCIAL_LINKS.WHATSAPP)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-xs font-bold transition-all cursor-pointer"
                    >
                      {copiedId === 'official-wa' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedId === 'official-wa' ? 'Copié !' : 'Copier'}</span>
                    </button>
                    <a
                      href={OFFICIAL_COMMERCIAL_LINKS.WHATSAPP}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
                      title="Ouvrir WhatsApp"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>

                {/* 3. TikTok */}
                <div className="bg-slate-950/80 p-3.5 rounded-2xl border border-slate-800 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] font-bold text-pink-400 flex items-center gap-1.5">
                        <Flame className="w-3.5 h-3.5" />
                        <span>TikTok Officiel</span>
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">@tisanebeniamar1</span>
                    </div>
                    <div className="font-mono text-xs text-white truncate bg-slate-900 p-2 rounded-xl border border-slate-800/80 mb-3">
                      {OFFICIAL_COMMERCIAL_LINKS.TIKTOK}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 pt-2 border-t border-slate-800/60">
                    <button
                      onClick={() => handleCopy('official-tt', OFFICIAL_COMMERCIAL_LINKS.TIKTOK)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-pink-500/20 hover:bg-pink-500/30 text-pink-300 text-xs font-bold transition-all cursor-pointer"
                    >
                      {copiedId === 'official-tt' ? <Check className="w-3.5 h-3.5 text-pink-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedId === 'official-tt' ? 'Copié !' : 'Copier'}</span>
                    </button>
                    <a
                      href={OFFICIAL_COMMERCIAL_LINKS.TIKTOK}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
                      title="Ouvrir TikTok"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>

                {/* 4. Wave Business */}
                <div className="bg-slate-950/80 p-3.5 rounded-2xl border border-slate-800 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] font-bold text-cyan-400 flex items-center gap-1.5">
                        <Zap className="w-3.5 h-3.5" />
                        <span>Wave Business (Béni Amar)</span>
                      </span>
                      <span className="text-[10px] text-cyan-400 font-mono font-bold">35 000 F/mois</span>
                    </div>
                    <div className="font-mono text-xs text-white truncate bg-slate-900 p-2 rounded-xl border border-slate-800/80 mb-3">
                      {OFFICIAL_COMMERCIAL_LINKS.WAVE_BUSINESS}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 pt-2 border-t border-slate-800/60">
                    <button
                      onClick={() => handleCopy('official-wb-msg', OFFICIAL_COMMERCIAL_LINKS.WAVE_PAYMENT_MESSAGE)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 text-xs font-bold transition-all cursor-pointer"
                      title="Copier le message complet de paiement"
                    >
                      {copiedId === 'official-wb-msg' ? <Check className="w-3.5 h-3.5 text-cyan-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedId === 'official-wb-msg' ? 'Copié !' : 'Copier Formule'}</span>
                    </button>
                    <a
                      href={OFFICIAL_COMMERCIAL_LINKS.WAVE_BUSINESS}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
                      title="Ouvrir Wave"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              </div>

              {/* Exact Wave Formula Box */}
              <div className="mt-4 bg-slate-950 p-3.5 rounded-2xl border border-cyan-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-300">
                <div className="flex-1">
                  <span className="text-cyan-400 font-bold block mb-0.5">💬 Formule de paiement Wave officielle Béni Amar (Abonnement Mensuel 35 000 FCFA) :</span>
                  <span className="font-medium text-slate-200">{OFFICIAL_COMMERCIAL_LINKS.WAVE_PAYMENT_MESSAGE}</span>
                </div>
                <button
                  onClick={() => handleCopy('wave-full-formula', OFFICIAL_COMMERCIAL_LINKS.WAVE_PAYMENT_MESSAGE)}
                  className="px-3.5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 cursor-pointer shadow-md"
                >
                  {copiedId === 'wave-full-formula' ? <Check className="w-3.5 h-3.5 text-white" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedId === 'wave-full-formula' ? 'Copié !' : 'Copier la formule'}</span>
                </button>
              </div>
            </div>
            
            {/* Quick Actions Bar */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-wrap items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Flame className="w-5 h-5 text-amber-400" />
                  <span>Opérations Commerciales Rapides</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Lancez de nouvelles campagnes, générez des codes promotionnels ou convertissez vos prospects en un clic.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  onClick={() => setIsNewPromoModalOpen(true)}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 text-xs font-bold transition-all cursor-pointer"
                >
                  <Tag className="w-3.5 h-3.5" />
                  <span>+ Nouvelle Promo</span>
                </button>

                <button
                  onClick={() => setIsNewAdModalOpen(true)}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/30 text-xs font-bold transition-all cursor-pointer"
                >
                  <Megaphone className="w-3.5 h-3.5" />
                  <span>+ Pub Multi-Canal (IA)</span>
                </button>

                <button
                  onClick={() => setIsNewLeadModalOpen(true)}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 text-xs font-bold transition-all cursor-pointer"
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>+ Ajouter Prospect</span>
                </button>

                <button
                  onClick={() => setIsGeneratePromptModalOpen(true)}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-xs font-bold transition-all cursor-pointer"
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>Générer Prompt Vente IA</span>
                </button>
              </div>
            </div>

            {/* Split Grid: Live Autonomous Activity & Top Deals */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Left Column (2 spans): Activity Logs in Real Time */}
              <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-2.5">
                    <div className="w-3 h-3 rounded-full bg-cyan-400 animate-ping" />
                    <h3 className="font-bold text-white text-base">Journal d'Activité Commerciale en Direct</h3>
                  </div>
                  <span className="text-xs text-slate-400 font-medium">Mise à jour en temps réel</span>
                </div>

                <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                  {logs.length === 0 ? (
                    <div className="text-center py-12 px-4 rounded-2xl bg-slate-950/40 border border-slate-800/60">
                      <Bot className="w-9 h-9 text-slate-600 mx-auto mb-2.5 opacity-60" />
                      <p className="text-sm font-bold text-slate-300">Journal d'activité vierge</p>
                      <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                        Les logs d'actions commerciales (conversions, campagnes, clics) s'inscriront ici au fur et à mesure des cycles réels.
                      </p>
                    </div>
                  ) : (
                    logs.map((log) => (
                      <div 
                        key={log.id}
                        className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-4 flex items-start justify-between gap-3 hover:border-slate-700 transition-all"
                      >
                        <div className="flex items-start gap-3">
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                            log.actionType === 'lead_converted' ? 'bg-emerald-500/20 text-emerald-400' :
                            log.actionType === 'promo_created' ? 'bg-purple-500/20 text-purple-400' :
                            log.actionType === 'ad_launched' ? 'bg-cyan-500/20 text-cyan-400' :
                            log.actionType === 'link_clicked' ? 'bg-amber-500/20 text-amber-400' :
                            'bg-indigo-500/20 text-indigo-400'
                          }`}>
                            {log.actionType === 'lead_converted' ? <CheckCircle2 className="w-4 h-4" /> :
                             log.actionType === 'promo_created' ? <Tag className="w-4 h-4" /> :
                             log.actionType === 'ad_launched' ? <Megaphone className="w-4 h-4" /> :
                             log.actionType === 'link_clicked' ? <LinkIcon className="w-4 h-4" /> :
                             <Bot className="w-4 h-4" />}
                          </div>

                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-sm text-white">{log.title}</span>
                              {log.amountFCFA && (
                                <span className="text-[11px] font-black px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                  +{log.amountFCFA.toLocaleString('fr-FR')} FCFA
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-slate-300 mt-1 leading-relaxed">{log.details}</p>
                            <span className="text-[10px] text-slate-500 mt-1 block">
                              {new Date(log.timestamp).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })} • Cycle autonome
                            </span>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Right Column: Key Focus Leads & Active Flash Sales */}
              <div className="space-y-6">
                
                {/* Hot Leads card */}
                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-white text-sm flex items-center gap-2">
                      <Zap className="w-4 h-4 text-amber-400" />
                      <span>Prospects Chauds Prioritaires</span>
                    </h3>
                    <button 
                      onClick={() => setActiveTab('leads')}
                      className="text-[11px] text-cyan-400 hover:underline font-bold"
                    >
                      Voir tous
                    </button>
                  </div>

                  <div className="space-y-3">
                    {leads.length === 0 ? (
                      <div className="text-center py-6 px-3 rounded-2xl bg-slate-950/40 border border-slate-800/60">
                        <Users className="w-7 h-7 text-slate-600 mx-auto mb-2 opacity-60" />
                        <p className="text-xs font-bold text-slate-400">Aucun prospect enregistré</p>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          Les leads qualifiés s'afficheront ici automatiquement.
                        </p>
                      </div>
                    ) : (
                      leads.slice(0, 3).map((lead) => (
                        <div key={lead.id} className="bg-slate-950/60 border border-slate-800 rounded-xl p-3.5">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-sm text-white">{lead.name}</span>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300">
                              {lead.interestScore}% score
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400 mt-1 truncate">{lead.mainObjection || lead.productInterest}</p>
                          
                          <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-800/80">
                            <span className="text-[10px] text-slate-500">{lead.source}</span>
                            <button
                              onClick={() => handleConvertLead(lead)}
                              className="px-2.5 py-1 rounded-lg bg-emerald-600/30 hover:bg-emerald-600 text-emerald-300 hover:text-white text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1"
                            >
                              <Zap className="w-3 h-3" />
                              <span>Convertir IA</span>
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Direct Wave Payment Link Widget */}
                <div className="bg-gradient-to-tr from-cyan-950/60 to-indigo-950/60 border border-cyan-500/30 rounded-3xl p-6 shadow-md">
                  <div className="flex items-center gap-2.5 mb-2">
                    <div className="w-8 h-8 rounded-xl bg-cyan-500/20 text-cyan-300 flex items-center justify-center">
                      <LinkIcon className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white">Lien Wave de Closing Direct</h4>
                      <span className="text-[10px] text-cyan-300 font-medium">35 000 FCFA / mois</span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-300 mt-2 mb-3">
                    Partagez ce lien directement sur WhatsApp ou SMS pour encaisser sans aucune friction technique :
                  </p>

                  <div className="bg-slate-900/90 border border-slate-800 p-2.5 rounded-xl flex items-center justify-between gap-2">
                    <span className="text-xs text-cyan-300 truncate font-mono">{OFFICIAL_COMMERCIAL_LINKS.WAVE_BUSINESS}</span>
                    <button
                      onClick={() => handleCopy('quick-wave', OFFICIAL_COMMERCIAL_LINKS.WAVE_PAYMENT_MESSAGE)}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors shrink-0 cursor-pointer"
                      title="Copier le message Wave officiel"
                    >
                      {copiedId === 'quick-wave' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

              </div>
            </div>

          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: PROMOTIONS & FLASH SALES */}
        {/* ========================================================================= */}
        {activeTab === 'promotions' && (
          <div className="mt-6 space-y-6">
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Tag className="w-5 h-5 text-purple-400" />
                  <span>Gestion des Promotions & Ventes Flash</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  L'agent M-Ris injecte automatiquement ces offres dans les relances et campagnes pour maximiser les conversions.
                </p>
              </div>

              <button
                onClick={() => setIsNewPromoModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all shadow-md shadow-purple-600/30 cursor-pointer self-start sm:self-auto"
              >
                <Plus className="w-4 h-4" />
                <span>Créer une Promotion</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {promotions.map((promo) => (
                <div 
                  key={promo.id}
                  className={`bg-slate-900 border rounded-3xl p-5 shadow-sm transition-all flex flex-col justify-between ${
                    promo.active ? 'border-purple-500/40' : 'border-slate-800 opacity-70'
                  }`}
                >
                  <div>
                    {/* Header: Code & Status */}
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-mono text-sm font-black px-3 py-1 rounded-xl bg-purple-500/20 text-purple-300 border border-purple-500/30 tracking-wider">
                        {promo.code}
                      </span>

                      <button
                        onClick={() => commercialEngine.togglePromotion(promo.id)}
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold cursor-pointer transition-colors ${
                          promo.active 
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' 
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {promo.active ? 'En Ligne' : 'Désactivé'}
                      </button>
                    </div>

                    <h4 className="font-bold text-base text-white">{promo.title}</h4>
                    <p className="text-xs text-slate-300 mt-1 line-clamp-2">{promo.description}</p>

                    {/* Promo Stats */}
                    <div className="grid grid-cols-2 gap-2 my-4 bg-slate-950/60 p-3 rounded-2xl border border-slate-800">
                      <div>
                        <span className="text-[10px] text-slate-500 block">Avantage</span>
                        <span className="text-sm font-black text-purple-400">
                          {promo.discountType === 'percentage' ? `-${promo.discountValue}%` : `-${promo.discountValue.toLocaleString('fr-FR')} F`}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 block">Utilisations</span>
                        <span className="text-sm font-black text-white">
                          {promo.usageCount} / {promo.maxUses}
                        </span>
                      </div>
                    </div>

                    {/* Copy text preview */}
                    <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-[11px] text-slate-300 mb-4 leading-relaxed">
                      "{promo.generatedCopy}"
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-3 border-t border-slate-800">
                    <button
                      onClick={() => handleCopy(promo.id, promo.directActivationLink)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-colors cursor-pointer"
                    >
                      {copiedId === promo.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedId === promo.id ? 'Copié !' : 'Copier Lien Promo'}</span>
                    </button>

                    <a
                      href={promo.directActivationLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 transition-colors"
                      title="Tester l'ouverture WhatsApp"
                    >
                      <Share2 className="w-4 h-4" />
                    </a>
                  </div>

                </div>
              ))}
            </div>

          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: ADVERTISEMENTS MULTI-CHANNEL */}
        {/* ========================================================================= */}
        {activeTab === 'ads' && (
          <div className="mt-6 space-y-6">
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Megaphone className="w-5 h-5 text-cyan-400" />
                  <span>Publicités & Campagnes Multi-Canaux</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Textes de vente, scripts TikTok, formats Meta et messages de diffusion optimisés par Gemini.
                </p>
              </div>

              <button
                onClick={() => setIsNewAdModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white text-xs font-bold transition-all shadow-md shadow-cyan-600/30 cursor-pointer self-start sm:self-auto"
              >
                <Sparkles className="w-4 h-4" />
                <span>Générer Campagne avec IA</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {ads.map((ad) => (
                <div key={ad.id} className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-sm flex flex-col justify-between">
                  <div>
                    {/* Channel badge & performance */}
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[11px] font-black uppercase px-2.5 py-1 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                        {ad.channel.replace('_', ' ')}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300">
                        {ad.conversions} ventes
                      </span>
                    </div>

                    <h4 className="font-bold text-base text-white">{ad.campaignName}</h4>
                    <p className="text-xs text-cyan-400 font-semibold mt-1">« {ad.headline} »</p>

                    {/* Copy */}
                    <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 text-xs text-slate-300 my-4 whitespace-pre-line leading-relaxed max-h-48 overflow-y-auto">
                      {ad.adCopy}
                    </div>

                    {/* Audience & CTA */}
                    <div className="text-[11px] text-slate-400 space-y-1 mb-4">
                      <div><strong className="text-slate-300">Audience :</strong> {ad.targetAudience}</div>
                      <div><strong className="text-slate-300">Appel à l'action :</strong> {ad.callToAction}</div>
                    </div>

                    {/* Metrics */}
                    <div className="grid grid-cols-3 gap-2 bg-slate-950/70 p-2.5 rounded-xl border border-slate-800 text-center mb-4">
                      <div>
                        <span className="text-[10px] text-slate-500 block">Vues</span>
                        <span className="text-xs font-bold text-white">{ad.impressions.toLocaleString('fr-FR')}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 block">Clics</span>
                        <span className="text-xs font-bold text-cyan-300">{ad.clicks}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 block">CA Encaissé</span>
                        <span className="text-xs font-bold text-emerald-400">
                          {ad.revenueGeneratedFCFA === 0 ? '0 F (En attente)' : `${ad.revenueGeneratedFCFA.toLocaleString('fr-FR')} F`}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="flex items-center gap-2 pt-3 border-t border-slate-800">
                    <button
                      onClick={() => handleCopy(ad.id, `${ad.headline}\n\n${ad.adCopy}\n\n👉 ${ad.callToAction} : ${ad.trackedLink}`)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-colors cursor-pointer"
                    >
                      {copiedId === ad.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedId === ad.id ? 'Copié !' : 'Copier'}</span>
                    </button>

                    <a
                      href={`https://wa.me/message/RGXYT5LWDCTAM1?text=${encodeURIComponent(`📢 CAMPAGNE M-RIS : ${ad.campaignName}\n\nAccroche : ${ad.headline}\n\nTexte publicitaire :\n${ad.adCopy}\n\nLien suivi : ${ad.trackedLink}`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors shadow-sm"
                      title="Transmettre cette publicité sur mon compte WhatsApp officiel"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>WhatsApp</span>
                    </a>
                  </div>

                </div>
              ))}
            </div>

          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 4: LEADS PIPELINE & LOYALTY */}
        {/* ========================================================================= */}
        {activeTab === 'leads' && (
          <div className="mt-6 space-y-6">
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Users className="w-5 h-5 text-emerald-400" />
                  <span>Pipeline des Prospects & Clients Fidèles</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Suivi personnalisé, traitement des objections et conversion automatique en abonnés fidèles.
                </p>
              </div>

              <div className="flex items-center gap-2.5">
                <button
                  onClick={() => setIsNewLeadModalOpen(true)}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-md shadow-emerald-600/30 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Ajouter un Prospect</span>
                </button>
              </div>
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {[
                { id: 'all', label: 'Tous' },
                { id: 'new', label: 'Nouveaux' },
                { id: 'qualified', label: 'Qualifiés' },
                { id: 'negotiating', label: 'En Négociation' },
                { id: 'converted', label: 'Convertis' },
                { id: 'loyal_client', label: '👑 Clients Fidèles VIP' }
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setLeadStatusFilter(f.id as any)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                    leadStatusFilter === f.id
                      ? 'bg-slate-100 text-slate-950 shadow-sm'
                      : 'bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* Leads List */}
            <div className="space-y-4">
              {filteredLeads.map((lead) => (
                <div 
                  key={lead.id}
                  className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-5 hover:border-slate-700 transition-all"
                >
                  {/* Lead Info */}
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2.5 mb-2">
                      <span className="font-black text-base text-white">{lead.name}</span>
                      <span className="text-xs text-slate-400 font-mono bg-slate-950 px-2 py-0.5 rounded-lg border border-slate-800">
                        {lead.contact}
                      </span>
                      <span className="text-xs text-slate-400">via {lead.source}</span>

                      {/* Status badge */}
                      <span className={`text-[11px] font-black px-2.5 py-0.5 rounded-full ${
                        lead.status === 'loyal_client' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' :
                        lead.status === 'converted' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' :
                        lead.status === 'negotiating' ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40' :
                        lead.status === 'qualified' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' :
                        'bg-slate-800 text-slate-400'
                      }`}>
                        {lead.status === 'loyal_client' ? '👑 Client Fidèle VIP' :
                         lead.status === 'converted' ? '✅ Client Converti' :
                         lead.status === 'negotiating' ? '⏳ En Négociation' :
                         lead.status === 'qualified' ? '🔥 Qualifié' : 'Nouveau'}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs mt-2">
                      <div className="text-slate-300">
                        <span className="text-slate-500">Intérêt : </span>
                        <strong>{lead.productInterest}</strong>
                      </div>
                      <div className="text-slate-300">
                        <span className="text-slate-500">Objection détectée : </span>
                        <span className="text-rose-300 font-medium">{lead.mainObjection || 'Aucune objection majeure'}</span>
                      </div>
                    </div>

                    {lead.conversionMessage && (
                      <div className="mt-3 bg-slate-950 p-3 rounded-2xl border border-slate-800 text-xs text-slate-300 leading-relaxed">
                        <strong className="text-cyan-400 block mb-1">Dernier message de closing M-Ris :</strong>
                        {lead.conversionMessage}
                      </div>
                    )}
                  </div>

                  {/* Actions Column */}
                  <div className="flex flex-wrap lg:flex-col items-stretch gap-2 shrink-0">
                    
                    <button
                      onClick={() => handleConvertLead(lead)}
                      disabled={isBusy}
                      className="flex-1 lg:flex-initial flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-black shadow-md cursor-pointer transition-all"
                    >
                      <Zap className="w-4 h-4" />
                      <span>{lead.status === 'converted' || lead.status === 'loyal_client' ? 'Relancer / Fideliser IA' : '⚡ Convertir avec M-Ris IA'}</span>
                    </button>

                    {lead.status !== 'loyal_client' && (
                      <button
                        onClick={() => handlePromoteLoyal(lead.id)}
                        className="flex-1 lg:flex-initial flex items-center justify-center gap-1 px-3 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 text-xs font-bold transition-all cursor-pointer"
                      >
                        <Award className="w-3.5 h-3.5" />
                        <span>Passer Client Fidèle VIP</span>
                      </button>
                    )}

                    {lead.conversionMessage && (
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleCopy(lead.id, lead.conversionMessage!)}
                          className="flex-1 p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors flex items-center justify-center gap-1 cursor-pointer text-xs"
                          title="Copier le message"
                        >
                          {copiedId === lead.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                          <span>{copiedId === lead.id ? 'Copié' : 'Copier'}</span>
                        </button>

                        <a
                          href={`https://wa.me/message/RGXYT5LWDCTAM1?text=${encodeURIComponent(lead.conversionMessage!)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 px-2.5 rounded-xl bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-300 border border-emerald-500/40 transition-colors flex items-center justify-center gap-1 text-xs font-bold"
                          title="Transmettre sur mon WhatsApp"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span>WhatsApp</span>
                        </a>
                      </div>
                    )}

                  </div>

                </div>
              ))}
            </div>

          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 5: CONVERSION TRACKED LINKS */}
        {/* ========================================================================= */}
        {activeTab === 'links' && (
          <div className="mt-6 space-y-6">
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <LinkIcon className="w-5 h-5 text-amber-400" />
                  <span>Vos Liens Officiels Exclusifs (Application M-Ris, WhatsApp, TikTok & Wave)</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  L'agent commercial M-Ris informe sur les 7 jours gratuits de « M-Ris le compagnon virtuel » et oriente vers l'abonnement mensuel Wave Business (35 000 FCFA/mois).
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-sky-400 bg-sky-500/10 border border-sky-500/30 px-3 py-1.5 rounded-xl flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>7 Jours Gratuits + Abonnement Wave</span>
                </span>
              </div>
            </div>

            {/* Trial and Wave Notice Banner */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Application 7 Days Free Trial Notice */}
              <div className="bg-sky-950/40 border border-sky-500/30 rounded-2xl p-4 flex flex-col justify-between gap-2 text-xs text-slate-300">
                <div>
                  <strong className="text-sky-400 block mb-0.5 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>Application « M-Ris le compagnon virtuel » (7 Jours Gratuits) :</span>
                  </strong>
                  <span className="text-slate-300">7 jours d'accès complet sans carte bancaire pour tester toutes les fonctionnalités avant l'abonnement mensuel.</span>
                </div>
                <div className="flex items-center gap-2 pt-2 border-t border-sky-900/40">
                  <button
                    onClick={() => handleCopy('app-link-tab', OFFICIAL_COMMERCIAL_LINKS.APP_URL)}
                    className="flex-1 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold transition-all text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
                  >
                    {copiedId === 'app-link-tab' ? <Check className="w-3.5 h-3.5 text-white" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedId === 'app-link-tab' ? 'Copié !' : 'Copier Lien Application'}</span>
                  </button>
                  <a
                    href={OFFICIAL_COMMERCIAL_LINKS.APP_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
                    title="Ouvrir l'application"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>

              {/* Wave Notice Banner */}
              <div className="bg-cyan-950/40 border border-cyan-500/30 rounded-2xl p-4 flex flex-col justify-between gap-2 text-xs text-slate-300">
                <div>
                  <strong className="text-cyan-400 block mb-0.5">🌊 Formule Wave Business Béni Amar (Abonnement 35 000 FCFA) :</strong>
                  <span className="text-slate-300">{OFFICIAL_COMMERCIAL_LINKS.WAVE_PAYMENT_MESSAGE}</span>
                </div>
                <div className="pt-2 border-t border-cyan-900/40">
                  <button
                    onClick={() => handleCopy('wave-full-instructions', OFFICIAL_COMMERCIAL_LINKS.WAVE_PAYMENT_MESSAGE)}
                    className="w-full py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold transition-all text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
                  >
                    {copiedId === 'wave-full-instructions' ? <Check className="w-3.5 h-3.5 text-white" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedId === 'wave-full-instructions' ? 'Formule Copiée !' : 'Copier Formule Wave'}</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {links.map((link) => (
                <div key={link.id} className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-sm flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[11px] font-black uppercase px-2.5 py-1 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        {link.type.replace('_', ' ')}
                      </span>
                      {link.codePromo && (
                        <span className="font-mono text-xs font-bold text-purple-300 bg-purple-500/20 px-2 py-0.5 rounded-lg">
                          {link.codePromo}
                        </span>
                      )}
                    </div>

                    <h4 className="font-bold text-base text-white">{link.name}</h4>
                    <p className="text-xs text-slate-400 mt-1">{link.destination}</p>

                    {/* URL bar */}
                    <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 font-mono text-xs text-amber-300 my-3 break-all">
                      {link.url}
                    </div>

                    {/* Pre-filled Message / Instruction if available */}
                    {link.prefilledMessage && (
                      <div className="bg-slate-950/70 p-2.5 rounded-xl border border-slate-800 text-[11px] text-slate-300 mb-3 leading-relaxed">
                        <strong className="text-slate-400 block text-[10px] uppercase mb-0.5">Instruction / Message associé :</strong>
                        {link.prefilledMessage}
                      </div>
                    )}

                    {/* Performance metrics */}
                    <div className="grid grid-cols-3 gap-2 bg-slate-950/60 p-3 rounded-2xl border border-slate-800 text-center mb-4">
                      <div>
                        <span className="text-[10px] text-slate-500 block">Clics</span>
                        <span className="text-sm font-black text-white">{link.clicksCount}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 block">Taux</span>
                        <span className="text-sm font-black text-amber-400">{link.conversionRate}%</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 block">Encaissé Wave</span>
                        <span className="text-xs font-black text-emerald-400">
                          {link.revenueEarnedFCFA === 0 ? '0 F (En attente)' : `${link.revenueEarnedFCFA.toLocaleString('fr-FR')} F`}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-2 pt-3 border-t border-slate-800">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          handleCopy(link.id, link.url);
                          commercialEngine.recordLinkClick(link.id);
                        }}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-colors cursor-pointer"
                      >
                        {copiedId === link.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedId === link.id ? 'Lien Copié !' : 'Copier le Lien'}</span>
                      </button>

                      <a
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => commercialEngine.recordLinkClick(link.id)}
                        className="p-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 transition-colors"
                        title="Tester le lien"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </div>

                    {link.prefilledMessage && (
                      <button
                        onClick={() => handleCopy(`msg-${link.id}`, link.prefilledMessage!)}
                        className="w-full flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-300 text-[11px] font-medium border border-slate-800 transition-colors cursor-pointer"
                      >
                        {copiedId === `msg-${link.id}` ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-slate-400" />}
                        <span>{copiedId === `msg-${link.id}` ? 'Message Copié !' : 'Copier le Message Complet'}</span>
                      </button>
                    )}
                  </div>

                </div>
              ))}
            </div>

          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 6: SALES PROMPTS & CLOSING AI */}
        {/* ========================================================================= */}
        {activeTab === 'prompts' && (
          <div className="mt-6 space-y-6">
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-indigo-400" />
                  <span>Prompts de Vente, Closing & Traitement des Objections</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  La bibliothèque de prompts d'élite utilisée par M-Ris pour désamorcer les doutes et conclure les ventes.
                </p>
              </div>

              <button
                onClick={() => setIsGeneratePromptModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-md shadow-indigo-600/30 cursor-pointer self-start sm:self-auto"
              >
                <Sparkles className="w-4 h-4" />
                <span>Générer un Nouveau Prompt IA</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {prompts.map((p) => (
                <div key={p.id} className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-sm flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[11px] font-black uppercase px-2.5 py-1 rounded-xl bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                        {p.category.replace('_', ' ')}
                      </span>
                      <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-lg">
                        Score {p.conversionRateScore}% succès
                      </span>
                    </div>

                    <h4 className="font-bold text-base text-white">{p.title}</h4>
                    <p className="text-xs text-slate-300 font-medium mt-1">🎯 Objectif : {p.objective}</p>

                    {/* Template box */}
                    <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 text-xs text-indigo-200 font-mono my-3 leading-relaxed whitespace-pre-line">
                      {p.promptTemplate}
                    </div>

                    {/* Example output */}
                    <div className="bg-slate-950/60 p-3 rounded-2xl border border-slate-800 text-xs text-slate-300 leading-relaxed">
                      <strong className="text-amber-400 block mb-1">Exemple de réplique générée :</strong>
                      « {p.exampleOutput} »
                    </div>
                  </div>

                  {/* Copy */}
                  <div className="pt-3 border-t border-slate-800 mt-4 flex items-center gap-2">
                    <button
                      onClick={() => handleCopy(p.id, p.promptTemplate)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-colors cursor-pointer"
                    >
                      {copiedId === p.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedId === p.id ? 'Prompt Copié !' : 'Copier le Prompt'}</span>
                    </button>

                    <button
                      onClick={() => handleCopy(`ex-${p.id}`, p.exampleOutput)}
                      className="py-2 px-3 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-xs font-bold transition-colors cursor-pointer"
                    >
                      <span>Copier Réplique</span>
                    </button>
                  </div>

                </div>
              ))}
            </div>

          </div>
        )}

      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: NEW PROMO */}
      {/* ========================================================================= */}
      {isNewPromoModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
              <Tag className="w-5 h-5 text-purple-400" />
              <span>Créer une Offre Promotionnelle</span>
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              L'offre sera automatiquement injectée par M-Ris dans les réponses et relances.
            </p>

            <form onSubmit={handleCreatePromo} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Code Promo (ex: WAVE-FLASH-25)</label>
                <input
                  type="text"
                  required
                  placeholder="CODE-PROMO"
                  value={newPromoCode}
                  onChange={(e) => setNewPromoCode(e.target.value.toUpperCase())}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono uppercase text-sm focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Titre de la Promotion</label>
                <input
                  type="text"
                  required
                  placeholder="Vente Flash Weekend Abidjan"
                  value={newPromoTitle}
                  onChange={(e) => setNewPromoTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Remise en % ({newPromoDiscount}%)</label>
                <input
                  type="range"
                  min="5"
                  max="50"
                  step="5"
                  value={newPromoDiscount}
                  onChange={(e) => setNewPromoDiscount(Number(e.target.value))}
                  className="w-full accent-purple-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsNewPromoModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-md cursor-pointer"
                >
                  Activer la Promotion
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: NEW AD (AI POWERED) */}
      {/* ========================================================================= */}
      {isNewAdModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-lg w-full shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-cyan-400" />
              <span>Générer une Campagne Multi-Canal avec IA</span>
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Gemini va concevoir le texte publicitaire, l'accroche, le ciblage et le lien de conversion en FCFA.
            </p>

            <form onSubmit={handleGenerateAdWithAI} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Canal de diffusion</label>
                <select
                  value={newAdChannel}
                  onChange={(e) => setNewAdChannel(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-cyan-500"
                >
                  <option value="whatsapp">Statuts & Broadcast WhatsApp</option>
                  <option value="facebook_instagram">Meta (Facebook & Instagram Ads)</option>
                  <option value="tiktok_reels">Script Vidéo TikTok & Reels (30s)</option>
                  <option value="google_ads">Google Ads & Réseau Recherche</option>
                  <option value="sms">SMS Marketing Direct</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Produit ou Offre</label>
                <input
                  type="text"
                  value={newAdProduct}
                  onChange={(e) => setNewAdProduct(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Audience Cible</label>
                <input
                  type="text"
                  value={newAdAudience}
                  onChange={(e) => setNewAdAudience(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsNewAdModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingAd}
                  className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold shadow-md flex items-center gap-2 cursor-pointer"
                >
                  {isSubmittingAd ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                  <span>{isSubmittingAd ? 'Génération IA en cours...' : 'Générer avec Gemini'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: NEW LEAD */}
      {/* ========================================================================= */}
      {isNewLeadModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
              <Users className="w-5 h-5 text-emerald-400" />
              <span>Ajouter un Prospect dans le Pipeline</span>
            </h3>

            <form onSubmit={handleCreateLead} className="space-y-4 mt-4">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Nom du Prospect</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Kouamé Jean-Luc"
                  value={newLeadName}
                  onChange={(e) => setNewLeadName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Téléphone / WhatsApp</label>
                <input
                  type="text"
                  placeholder="+225 07 00 00 00 00"
                  value={newLeadContact}
                  onChange={(e) => setNewLeadContact(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Objection ou Hésitation principale</label>
                <input
                  type="text"
                  placeholder="Ex: Veut tester avant de payer, hésite sur Wave"
                  value={newLeadObjection}
                  onChange={(e) => setNewLeadObjection(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsNewLeadModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md cursor-pointer"
                >
                  Enregistrer le Prospect
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: NEW LINK */}
      {/* ========================================================================= */}
      {isNewLinkModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
              <LinkIcon className="w-5 h-5 text-amber-400" />
              <span>Créer un Lien de Conversion Tracké</span>
            </h3>

            <form onSubmit={handleCreateLink} className="space-y-4 mt-4">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Nom du Lien</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Lien Wave Promo 28 000 FCFA"
                  value={newLinkName}
                  onChange={(e) => setNewLinkName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">URL Complète</label>
                <input
                  type="url"
                  required
                  placeholder="https://wave.com/pay/..."
                  value={newLinkUrl}
                  onChange={(e) => setNewLinkUrl(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-amber-500 font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Type de Lien</label>
                <select
                  value={newLinkType}
                  onChange={(e) => setNewLinkType(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-amber-500"
                >
                  <option value="wave_payment">Paiement Wave Direct</option>
                  <option value="whatsapp_closing">WhatsApp Closing Automatique</option>
                  <option value="promo_landing">Page Promotionnelle Remisée</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsNewLinkModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold shadow-md cursor-pointer"
                >
                  Créer et Suivre le Lien
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 5: GENERATE SALES PROMPT */}
      {/* ========================================================================= */}
      {isGeneratePromptModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-400" />
              <span>Générer un Prompt de Vente avec IA</span>
            </h3>

            <form onSubmit={handleGenerateSalesPrompt} className="space-y-4 mt-4">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Catégorie du Prompt</label>
                <select
                  value={genPromptCategory}
                  onChange={(e) => setGenPromptCategory(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-indigo-500"
                >
                  <option value="closing_rapide">Closing Éclair / Décision Rapide</option>
                  <option value="objection_prix">Désarmer l'Objection Prix (35 000 FCFA)</option>
                  <option value="relance_douce">Relance Bienveillante sans Pression</option>
                  <option value="offre_flash">Offre Flash & Urgence</option>
                  <option value="fidelisation_vip">Fidélisation VIP & Réabonnement</option>
                  <option value="pitch_30s">Pitch Flash 30 Secondes</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Objection ou Obstacle ciblé</label>
                <input
                  type="text"
                  required
                  value={genPromptObjection}
                  onChange={(e) => setGenPromptObjection(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsGeneratePromptModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isGeneratingPrompt}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md flex items-center gap-2 cursor-pointer"
                >
                  {isGeneratingPrompt ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                  <span>{isGeneratingPrompt ? 'Création...' : 'Générer le Prompt'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 6: LEAD CONVERSION RESULT */}
      {/* ========================================================================= */}
      {conversionModalResult && selectedLeadForConversion && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-emerald-500/40 rounded-3xl p-6 max-w-lg w-full shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-lg font-black text-white">
                  Conversion Déployée avec M-Ris !
                </h3>
                <span className="text-xs text-emerald-400 font-bold">
                  Prospect : {selectedLeadForConversion.name} • Statut Client Payant Validé
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-300 mb-3">
              M-Ris a composé le message de closing personnalisé intégrant le traitement d'objection et le lien de paiement direct Wave :
            </p>

            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 text-xs text-slate-200 whitespace-pre-line leading-relaxed max-h-56 overflow-y-auto mb-3">
              {conversionModalResult.message}
            </div>

            {/* Direct WhatsApp transmission button */}
            <div className="mb-4">
              <a
                href={`https://wa.me/message/RGXYT5LWDCTAM1?text=${encodeURIComponent(conversionModalResult.message)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black shadow-lg flex items-center justify-center gap-2 transition-transform hover:scale-[1.01] cursor-pointer"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Transmettre ce message sur mon compte WhatsApp (RGXYT5LWDCTAM1)</span>
              </a>
              <span className="text-[10px] text-emerald-400/80 text-center block mt-1">
                ✓ Cliquez pour ouvrir immédiatement votre conversation WhatsApp avec le message de closing pré-rempli
              </span>
            </div>

            <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
              <button
                onClick={() => handleCopy('conv-res', conversionModalResult.message)}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-colors cursor-pointer"
              >
                {copiedId === 'conv-res' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                <span>{copiedId === 'conv-res' ? 'Message Copié !' : 'Copier le Message'}</span>
              </button>

              <button
                onClick={() => {
                  setConversionModalResult(null);
                  setSelectedLeadForConversion(null);
                }}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black shadow-md cursor-pointer"
              >
                Parfait, Terminé
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 7: CAMPAGNE PUBLICITAIRE GÉNÉRÉE -> TRANSMISSION WHATSAPP DIRECTE */}
      {/* ========================================================================= */}
      {campaignWhatsAppModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-cyan-500/40 rounded-3xl p-6 max-w-lg w-full shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center shrink-0">
                <Sparkles className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-lg font-black text-white">
                  Nouvelle Publicité Générée par M-Ris !
                </h3>
                <span className="text-xs text-cyan-400 font-bold">
                  Prête pour diffusion sur votre compte WhatsApp officiel
                </span>
              </div>
            </div>

            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 text-xs text-slate-200 whitespace-pre-line leading-relaxed max-h-56 overflow-y-auto mb-4">
              <div className="font-bold text-cyan-300 mb-1">📢 {campaignWhatsAppModal.headline}</div>
              <p className="mt-1">{campaignWhatsAppModal.adCopy}</p>
              <div className="mt-2 text-slate-400 font-mono text-[11px]">👉 Lien : {campaignWhatsAppModal.trackedLink}</div>
            </div>

            {/* Direct WhatsApp transmission button to Esther */}
            <div className="mb-4">
              <a
                href={`https://wa.me/message/RGXYT5LWDCTAM1?text=${encodeURIComponent(`📢 NOUVELLE CAMPAGNE M-RIS : ${campaignWhatsAppModal.campaignName}\n\nAccroche : « ${campaignWhatsAppModal.headline} »\n\nTexte publicitaire :\n${campaignWhatsAppModal.adCopy}\n\nLien de conversion : ${campaignWhatsAppModal.trackedLink}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3.5 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black shadow-lg flex items-center justify-center gap-2 transition-transform hover:scale-[1.01] cursor-pointer"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Transmettre Immédiatement sur mon WhatsApp (RGXYT5LWDCTAM1)</span>
              </a>
              <span className="text-[10px] text-emerald-400/80 text-center block mt-1.5">
                ✓ Ouvre WhatsApp Web / Mobile avec le texte publicitaire et le lien tracké pré-remplis
              </span>
            </div>

            <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
              <button
                onClick={() => handleCopy('ad-modal-res', `${campaignWhatsAppModal.headline}\n\n${campaignWhatsAppModal.adCopy}\n\n${campaignWhatsAppModal.trackedLink}`)}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-colors cursor-pointer"
              >
                {copiedId === 'ad-modal-res' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                <span>{copiedId === 'ad-modal-res' ? 'Copié !' : 'Copier'}</span>
              </button>

              <button
                onClick={() => setCampaignWhatsAppModal(null)}
                className="px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-black shadow-md cursor-pointer"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
