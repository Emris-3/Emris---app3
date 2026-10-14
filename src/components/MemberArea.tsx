import React, { useState } from 'react';
import { SubscriptionRequest } from '../types/subscription';
import { SUBSCRIPTION_CONFIG, FORMAT_FCFA } from '../utils/constants';
import { 
  Sparkles, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  Download, 
  TrendingUp, 
  FileText, 
  MessageCircle, 
  ExternalLink,
  ShieldCheck,
  RefreshCw,
  Calculator,
  Briefcase,
  Layers,
  AlertCircle,
  BarChart3,
  Search,
  Check,
  FileCheck
} from 'lucide-react';

interface MemberAreaProps {
  subscription: SubscriptionRequest;
  onRenew: () => void;
  onOpenReceipt: () => void;
}

export const MemberArea: React.FC<MemberAreaProps> = ({
  subscription,
  onRenew,
  onOpenReceipt
}) => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'simulator' | 'reports' | 'opportunities'>('dashboard');
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);

  // Financial Simulator State
  const [simRevenue, setSimRevenue] = useState<number>(3500000); // 3.5M FCFA
  const [simFixedCosts, setSimFixedCosts] = useState<number>(1200000); // 1.2M FCFA
  const [simMarginRate, setSimMarginRate] = useState<number>(65); // 65%

  const isTrial = subscription.isTrial || subscription.status === 'trial';

  // Compute days remaining
  const now = new Date();
  const defaultDuration = isTrial ? (SUBSCRIPTION_CONFIG.TRIAL_DAYS || 7) : SUBSCRIPTION_CONFIG.DURATION_DAYS;
  const expiryDate = subscription.expiresAt 
    ? new Date(subscription.expiresAt) 
    : new Date(now.getTime() + 1000 * 60 * 60 * 24 * defaultDuration);
  const diffMs = expiryDate.getTime() - now.getTime();
  const daysRemaining = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));

  const expiryFormatted = expiryDate.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  // Simulator calculations
  const grossMargin = (simRevenue * simMarginRate) / 100;
  const netProfit = grossMargin - simFixedCosts;
  const breakEvenRevenue = simMarginRate > 0 ? (simFixedCosts / (simMarginRate / 100)) : 0;
  const breakEvenDays = simRevenue > 0 ? Math.min(30, Math.round((breakEvenRevenue / simRevenue) * 30)) : 30;
  const riskScore = netProfit > 1000000 ? 'Faible (Excellent)' : netProfit > 300000 ? 'Modéré (Viable)' : 'Élevé (Vigilance)';
  const riskColor = netProfit > 1000000 ? 'text-emerald-600 bg-emerald-50 border-emerald-200' : netProfit > 300000 ? 'text-amber-600 bg-amber-50 border-amber-200' : 'text-rose-600 bg-rose-50 border-rose-200';

  const handleSimulateDownload = (docTitle: string) => {
    setDownloadSuccess(docTitle);
    setTimeout(() => setDownloadSuccess(null), 3500);
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-16">
      
      {/* Premium Unlocked Hero Banner */}
      <div className={`relative overflow-hidden rounded-3xl ${
        isTrial 
          ? 'bg-gradient-to-br from-slate-900 via-sky-950 to-slate-900 border-sky-500/40' 
          : 'bg-gradient-to-br from-slate-900 via-slate-800 to-sky-950 border-slate-700'
      } text-white p-6 sm:p-8 border shadow-xl`}>
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3 max-w-xl">
            <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full ${
              isTrial 
                ? 'bg-amber-500/20 border-amber-500/30 text-amber-300' 
                : 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400'
            } border text-xs font-bold uppercase tracking-wider`}>
              <span className={`w-2 h-2 rounded-full ${isTrial ? 'bg-amber-400' : 'bg-emerald-400'} animate-ping`} />
              <span>{isTrial ? 'Essai Gratuit Actif • 7 Jours' : 'Accès Complet Débloqué • M-Ris 30 Jours'}</span>
            </div>
            
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Application Complète M-Ris • {subscription.userName}
            </h1>
            
            <p className="text-sm text-slate-300 leading-relaxed">
              {isTrial ? (
                <>
                  Votre compte bénéficie de l'accès débloqué pour <strong>7 jours</strong>. Explorez le simulateur financier, les rapports d'analyse sectoriels et le radar d'opportunités d'affaires en Côte d'Ivoire.
                </>
              ) : (
                <>
                  Paiement de <strong>{FORMAT_FCFA(subscription.amount)}</strong> validé auprès de <strong>Béni Amar</strong> via Wave Business. Votre licence complète est active pour 30 jours consécutifs.
                </>
              )}
            </p>
          </div>

          {/* 30-Day or 7-Day Countdown Card */}
          <div className="bg-slate-800/90 backdrop-blur-md rounded-2xl p-5 border border-slate-700/80 shadow-lg shrink-0 min-w-[280px]">
            <div className="flex items-center justify-between text-xs text-slate-400 pb-2 border-b border-slate-700/60">
              <span className="flex items-center gap-1.5 font-medium">
                <Clock className="w-3.5 h-3.5 text-sky-400" />
                Durée d'Accès
              </span>
              <span className={isTrial ? 'text-amber-400 font-semibold' : 'text-emerald-400 font-semibold'}>
                {isTrial ? 'Essai 7 Jours' : '30 Jours Validés'}
              </span>
            </div>

            <div className="py-3 text-center">
              <div className={`text-4xl font-extrabold font-mono-numbers ${isTrial ? 'text-amber-400' : 'text-cyan-400'} tracking-tight`}>
                {daysRemaining} <span className="text-lg font-normal text-slate-300">jours</span>
              </div>
              <div className="text-xs text-slate-400 mt-1">
                restants avant renouvellement
              </div>
            </div>

            <div className="pt-2 border-t border-slate-700/60 space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-300">
                <span className="text-slate-400">Échéance :</span>
                <strong className="text-white font-medium">{expiryFormatted}</strong>
              </div>
              <div className="flex justify-between text-slate-300">
                <span className="text-slate-400">Marchand Wave :</span>
                <span className="font-semibold text-slate-200">Béni Amar</span>
              </div>
              {subscription.receiptImage && (
                <button
                  onClick={onOpenReceipt}
                  className="w-full mt-2 py-1.5 px-3 rounded-lg bg-slate-700/60 hover:bg-slate-700 text-slate-200 text-xs font-medium text-center transition-colors cursor-pointer"
                >
                  Voir mon reçu Wave validé
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Download Alert Toast */}
      {downloadSuccess && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-800 flex items-center justify-between text-xs animate-fadeIn">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Document <strong>« {downloadSuccess} »</strong> prêt et téléchargé avec succès !</span>
          </div>
          <span className="font-bold text-[10px] uppercase bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded">
            Téléchargé
          </span>
        </div>
      )}

      {/* Application Navigation Tabs */}
      <div className="bg-white rounded-2xl p-2 border border-slate-200/90 shadow-xs flex items-center gap-1 overflow-x-auto">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'dashboard'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Indicateurs Marché UEMOA</span>
        </button>

        <button
          onClick={() => setActiveTab('simulator')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'simulator'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Calculator className="w-4 h-4" />
          <span>Simulateur Rentabilité & Risques</span>
        </button>

        <button
          onClick={() => setActiveTab('reports')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'reports'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Rapports & Documents OHADA</span>
        </button>

        <button
          onClick={() => setActiveTab('opportunities')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'opportunities'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Briefcase className="w-4 h-4" />
          <span>Radar Appels d'Offres CI</span>
        </button>
      </div>

      {/* Tab 1: Dashboard UEMOA */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs">
              <span className="text-xs text-slate-500 font-medium">Croissance PIB Côte d'Ivoire</span>
              <div className="text-2xl font-extrabold text-slate-900 font-mono-numbers mt-1">+6.8%</div>
              <span className="text-[11px] text-emerald-600 font-semibold">Tendance haussière 2026</span>
            </div>
            <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs">
              <span className="text-xs text-slate-500 font-medium">Taux Directeur BCEAO</span>
              <div className="text-2xl font-extrabold text-slate-900 font-mono-numbers mt-1">3.50%</div>
              <span className="text-[11px] text-slate-500">Stabilité monétaire</span>
            </div>
            <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs">
              <span className="text-xs text-slate-500 font-medium">Inflation Annuelle UEMOA</span>
              <div className="text-2xl font-extrabold text-slate-900 font-mono-numbers mt-1">2.4%</div>
              <span className="text-[11px] text-emerald-600 font-semibold">Sous l'objectif de 3%</span>
            </div>
            <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs">
              <span className="text-xs text-slate-500 font-medium">Indice Confiance PME</span>
              <div className="text-2xl font-extrabold text-sky-600 font-mono-numbers mt-1">78.4 / 100</div>
              <span className="text-[11px] text-slate-500">Climat d'affaires positif</span>
            </div>
          </div>

          {/* Sector Analysis Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">Agrobusiness</span>
                <span className="text-xs font-semibold text-emerald-600">+14.2%</span>
              </div>
              <h3 className="font-bold text-slate-900 text-sm mb-2">Transformation Cacao & Anacarde</h3>
              <p className="text-xs text-slate-600 leading-relaxed mb-4">
                Augmentation des volumes usinés locaux à San-Pédro et Abidjan. Nouveaux barèmes fiscaux incitatifs.
              </p>
              <button
                onClick={() => handleSimulateDownload("Note de Conjoncture Agro-Industrie")}
                className="w-full py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Télécharger la note sectorielle</span>
              </button>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-sky-700 bg-sky-50 px-2 py-0.5 rounded">Fintech & Mobile</span>
                <span className="text-xs font-semibold text-sky-600">+28.5%</span>
              </div>
              <h3 className="font-bold text-slate-900 text-sm mb-2">Adoption des Paiements Numériques</h3>
              <p className="text-xs text-slate-600 leading-relaxed mb-4">
                Expansion majeure de Wave Business et des passerelles marchandes en Côte d'Ivoire. Flux B2B en hausse.
              </p>
              <button
                onClick={() => handleSimulateDownload("Étude Marché Paiements Numériques CI")}
                className="w-full py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Télécharger l'étude Fintech</span>
              </button>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-purple-700 bg-purple-50 px-2 py-0.5 rounded">BTP & Immobilier</span>
                <span className="text-xs font-semibold text-purple-600">+9.8%</span>
              </div>
              <h3 className="font-bold text-slate-900 text-sm mb-2">Grands Chantiers du Grand Abidjan</h3>
              <p className="text-xs text-slate-600 leading-relaxed mb-4">
                Prolongement du métro urbain, échangeurs et aménagement des zones industrielles de PK24 et Akoupé-Zeudji.
              </p>
              <button
                onClick={() => handleSimulateDownload("Rapport Projets BTP Abidjan")}
                className="w-full py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Télécharger le rapport BTP</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Financial Simulator */}
      {activeTab === 'simulator' && (
        <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-xs space-y-6">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Simulateur Financier de Rentabilité & Risques PME (FCFA)
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Modélisez vos revenus mensuels, votre point mort et évaluez votre niveau de risque selon la méthodologie M-Ris.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">
                Chiffre d'Affaires Mensuel Estimé : <strong className="text-sky-600 font-mono-numbers">{FORMAT_FCFA(simRevenue)}</strong>
              </label>
              <input
                type="range"
                min={500000}
                max={20000000}
                step={250000}
                value={simRevenue}
                onChange={(e) => setSimRevenue(Number(e.target.value))}
                className="w-full accent-sky-600 cursor-pointer"
              />
              <span className="text-[11px] text-slate-400">Min: 500 000 FCFA • Max: 20 000 000 FCFA</span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">
                Charges Fixes Mensuelles : <strong className="text-rose-600 font-mono-numbers">{FORMAT_FCFA(simFixedCosts)}</strong>
              </label>
              <input
                type="range"
                min={200000}
                max={10000000}
                step={100000}
                value={simFixedCosts}
                onChange={(e) => setSimFixedCosts(Number(e.target.value))}
                className="w-full accent-rose-600 cursor-pointer"
              />
              <span className="text-[11px] text-slate-400">Salaires, loyer, taxes, abonnements</span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">
                Taux de Marge Brute : <strong className="text-emerald-600 font-mono-numbers">{simMarginRate}%</strong>
              </label>
              <input
                type="range"
                min={10}
                max={95}
                step={5}
                value={simMarginRate}
                onChange={(e) => setSimMarginRate(Number(e.target.value))}
                className="w-full accent-emerald-600 cursor-pointer"
              />
              <span className="text-[11px] text-slate-400">Marge brute moyenne de votre activité</span>
            </div>
          </div>

          {/* Results Summary Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-slate-100">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
              <span className="text-xs text-slate-500 font-medium">Marge Brute Réalisée</span>
              <div className="text-xl font-extrabold text-slate-900 font-mono-numbers mt-1">
                {FORMAT_FCFA(grossMargin)}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
              <span className="text-xs text-slate-500 font-medium">Bénéfice Net Mensuel</span>
              <div className={`text-xl font-extrabold font-mono-numbers mt-1 ${netProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                {FORMAT_FCFA(netProfit)}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
              <span className="text-xs text-slate-500 font-medium">Seuil de Rentabilité (CA mort)</span>
              <div className="text-xl font-extrabold text-slate-900 font-mono-numbers mt-1">
                {FORMAT_FCFA(Math.round(breakEvenRevenue))}
              </div>
              <span className="text-[11px] text-slate-500 font-mono-numbers">Atteint en J+{breakEvenDays} du mois</span>
            </div>

            <div className={`p-4 rounded-2xl border ${riskColor}`}>
              <span className="text-xs font-medium">Évaluation du Risque M-Ris</span>
              <div className="text-base font-extrabold mt-1">
                {riskScore}
              </div>
              <span className="text-[11px] opacity-80">Calculé en temps réel</span>
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              onClick={() => handleSimulateDownload("Simulation Financière Personnalisée M-Ris")}
              className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-xs transition-colors flex items-center gap-2"
            >
              <FileCheck className="w-4 h-4" />
              <span>Exporter la fiche financière PDF</span>
            </button>
          </div>
        </div>
      )}

      {/* Tab 3: Reports & Documents */}
      {activeTab === 'reports' && (
        <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-xs space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Bibliothèque Juridique, Financière & Fiscale OHADA
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Documents conformes téléchargeables en accès illimité pour les membres M-Ris (Abonnement 35 000 FCFA/mois).
              </p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800">
              Accès Débloqué
            </span>
          </div>

          <div className="divide-y divide-slate-100">
            {[
              {
                title: "Guide Fiscal des PME en Côte d'Ivoire (Régimes Réel & Simplifié)",
                cat: "Fiscalité & Impôts",
                format: "PDF • 42 pages",
                date: "Octobre 2026"
              },
              {
                title: "Contrat Type de Prestation Commerciale & Clause de Confidentialité OHADA",
                cat: "Juridique & Droit des Affaires",
                format: "DOCX / PDF • Édition 2026",
                date: "Septembre 2026"
              },
              {
                title: "Tableau de Bord de Suivi de Trésorerie Journalier & Prévisionnel 12 Mois",
                cat: "Finance & Comptabilité",
                format: "Modèle Excel / CSV",
                date: "Octobre 2026"
              },
              {
                title: "Grille d'Analyse du Risque Fournisseur et Procédure de Recouvrement",
                cat: "Gestion des Risques",
                format: "PDF & Outil d'évaluation",
                date: "Août 2026"
              }
            ].map((doc, idx) => (
              <div key={idx} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
                    <FileText className="w-5 h-5 text-slate-600" />
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-slate-900">{doc.title}</h4>
                    <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                      <span className="text-sky-600 font-medium">{doc.cat}</span>
                      <span>·</span>
                      <span>{doc.format}</span>
                      <span>·</span>
                      <span>{doc.date}</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => handleSimulateDownload(doc.title)}
                  className="px-3.5 py-2 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-800 text-xs font-semibold transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-slate-600" />
                  <span>Télécharger</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 4: Opportunities Radar */}
      {activeTab === 'opportunities' && (
        <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-xs space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Radar d'Appels d'Offres & Opportunités d'Affaires en Côte d'Ivoire
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Opportunités vérifiées et consultations d'entreprises réservées aux abonnés actifs.
              </p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-sky-100 text-sky-800">
              Mis à jour aujourd'hui
            </span>
          </div>

          <div className="space-y-3">
            {[
              {
                title: "Fourniture de Solutions Logicielles de Gestion & ERP pour Réseau Logistique",
                org: "Société d'Investissement Maritime (Abidjan)",
                budget: "25 000 000 FCFA",
                deadline: "30 Novembre 2026",
                badge: "Prioritaire"
              },
              {
                title: "Audit Organisationnel et Cadrage des Procédures Opérationnelles",
                org: "Groupe Agro-Pastoral Régional",
                budget: "18 500 000 FCFA",
                deadline: "15 Novembre 2026",
                badge: "Consultation Ouverte"
              },
              {
                title: "Déploiement d'une Plateforme Marchande & Intégration Wave / Mobile Money",
                org: "Fédération Coopérative Sud-Comoé",
                budget: "12 000 000 FCFA",
                deadline: "20 Novembre 2026",
                badge: "Nouveau"
              }
            ].map((opp, idx) => (
              <div key={idx} className="p-4 rounded-2xl border border-slate-200 hover:border-slate-300 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-sky-100 text-sky-800">
                      {opp.badge}
                    </span>
                    <span className="text-xs text-slate-500">{opp.org}</span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-900">{opp.title}</h4>
                  <div className="flex items-center gap-3 text-xs text-slate-600 font-mono-numbers">
                    <span>Budget : <strong className="text-slate-900">{opp.budget}</strong></span>
                    <span>·</span>
                    <span>Échéance : <strong className="text-rose-600">{opp.deadline}</strong></span>
                  </div>
                </div>

                <a
                  href={`${SUBSCRIPTION_CONFIG.WHATSAPP_URL}?text=${encodeURIComponent(`Bonjour Béni Amar (M-Ris), je suis membre abonné et je souhaite postuler à l'opportunité : ${opp.title}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-colors flex items-center justify-center gap-2 shrink-0"
                >
                  <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Postuler via Support M-Ris</span>
                </a>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Renewal Bar */}
      <div className="bg-slate-100 rounded-2xl p-5 border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h4 className="font-bold text-slate-900 text-sm">
            Prolongation ou renouvellement d'abonnement
          </h4>
          <p className="text-xs text-slate-600">
            Ajoutez 30 jours supplémentaires à votre solde actif à tout moment pour {FORMAT_FCFA(SUBSCRIPTION_CONFIG.AMOUNT_FCFA)} via Wave Business vers Béni Amar.
          </p>
        </div>
        <button
          onClick={onRenew}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs shadow-sm transition-colors shrink-0 cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Gérer / Renouveler l'abonnement</span>
        </button>
      </div>

    </div>
  );
};
