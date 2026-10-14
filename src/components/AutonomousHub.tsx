import React, { useState, useEffect } from 'react';
import { 
  Bot, 
  Mail, 
  FileText, 
  Briefcase, 
  Activity, 
  Play, 
  Pause, 
  Sparkles, 
  CheckCircle2, 
  Clock, 
  Send, 
  RefreshCw, 
  Copy, 
  Check, 
  Plus, 
  DollarSign, 
  ArrowUpRight, 
  ShieldCheck, 
  Sliders, 
  ExternalLink,
  ChevronRight,
  TrendingUp,
  AlertCircle,
  FileCheck,
  Award,
  Zap,
  Globe
} from 'lucide-react';
import { 
  AutonomousEmail, 
  AutonomousRedaction, 
  AutonomousFreelanceMission, 
  AutonomousAgentLog,
  AutonomousAgentConfig,
  AutonomousStats,
  RedactionType,
  FreelancePlatform
} from '../types/autonomous';
import { autonomousEngine } from '../services/autonomousService';
import { FORMAT_FCFA } from '../utils/constants';

interface AutonomousHubProps {
  onBackToCompanion?: () => void;
  userEmail?: string;
  userName?: string;
}

export const AutonomousHub: React.FC<AutonomousHubProps> = ({
  onBackToCompanion,
  userEmail = 'camaraesther920@gmail.com',
  userName = 'Camara Esther'
}) => {
  // Engine States
  const [config, setConfig] = useState<AutonomousAgentConfig>(autonomousEngine.getConfig());
  const [emails, setEmails] = useState<AutonomousEmail[]>(autonomousEngine.getEmails());
  const [redactions, setRedactions] = useState<AutonomousRedaction[]>(autonomousEngine.getRedactions());
  const [missions, setMissions] = useState<AutonomousFreelanceMission[]>(autonomousEngine.getMissions());
  const [logs, setLogs] = useState<AutonomousAgentLog[]>(autonomousEngine.getLogs());
  const [stats, setStats] = useState<AutonomousStats>(autonomousEngine.getStats());
  const [isBusy, setIsBusy] = useState<boolean>(autonomousEngine.isBusy());

  // UI Active Subtab
  const [activeTab, setActiveTab] = useState<'emails' | 'redactions' | 'freelance' | 'logs' | 'settings'>('emails');

  // Selected Detail Views
  const [selectedEmail, setSelectedEmail] = useState<AutonomousEmail | null>(emails[0] || null);
  const [selectedRedaction, setSelectedRedaction] = useState<AutonomousRedaction | null>(redactions[0] || null);
  const [selectedMission, setSelectedMission] = useState<AutonomousFreelanceMission | null>(missions[0] || null);

  // Modals & Action Forms
  const [isNewRedactionModalOpen, setIsNewRedactionModalOpen] = useState(false);
  const [isNewMissionModalOpen, setIsNewMissionModalOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // New Redaction Form State
  const [newRedactionTitle, setNewRedactionTitle] = useState('');
  const [newRedactionType, setNewRedactionType] = useState<RedactionType>('article_seo');
  const [newRedactionAudience, setNewRedactionAudience] = useState('Public professionnel et grand public');
  const [newRedactionKeywords, setNewRedactionKeywords] = useState('');
  const [isSubmittingRedaction, setIsSubmittingRedaction] = useState(false);

  // New Freelance Mission Form State
  const [newMissionPlatform, setNewMissionPlatform] = useState<FreelancePlatform>('Malt');
  const [newMissionTitle, setNewMissionTitle] = useState('');
  const [newMissionClient, setNewMissionClient] = useState('');
  const [newMissionBudget, setNewMissionBudget] = useState(120000);
  const [newMissionDesc, setNewMissionDesc] = useState('');
  const [isSubmittingMission, setIsSubmittingMission] = useState(false);

  // Sync with Autonomous Engine
  useEffect(() => {
    const unsubscribe = autonomousEngine.subscribe(() => {
      setConfig({ ...autonomousEngine.getConfig() });
      const currentEmails = autonomousEngine.getEmails();
      const currentRedactions = autonomousEngine.getRedactions();
      const currentMissions = autonomousEngine.getMissions();
      setEmails([...currentEmails]);
      setRedactions([...currentRedactions]);
      setMissions([...currentMissions]);
      setLogs([...autonomousEngine.getLogs()]);
      setStats({ ...autonomousEngine.getStats() });
      setIsBusy(autonomousEngine.isBusy());

      // Update selected items if needed
      setSelectedEmail(prev => prev ? currentEmails.find(e => e.id === prev.id) || currentEmails[0] || null : currentEmails[0] || null);
      setSelectedRedaction(prev => prev ? currentRedactions.find(r => r.id === prev.id) || currentRedactions[0] || null : currentRedactions[0] || null);
      setSelectedMission(prev => prev ? currentMissions.find(m => m.id === prev.id) || currentMissions[0] || null : currentMissions[0] || null);
    });

    return () => unsubscribe();
  }, []);

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handleToggleActive = () => {
    autonomousEngine.toggleActive();
  };

  const handleTriggerCycleNow = async () => {
    await autonomousEngine.runAutonomousCycle();
  };

  const handleSubmitNewRedaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRedactionTitle.trim() || isSubmittingRedaction) return;

    setIsSubmittingRedaction(true);
    const keywordsList = newRedactionKeywords
      .split(',')
      .map(k => k.trim())
      .filter(Boolean);

    const created = await autonomousEngine.createAndWriteRedaction({
      title: newRedactionTitle.trim(),
      type: newRedactionType,
      targetAudience: newRedactionAudience.trim(),
      keywords: keywordsList
    });

    setIsSubmittingRedaction(false);
    setIsNewRedactionModalOpen(false);
    setNewRedactionTitle('');
    setNewRedactionKeywords('');
    setSelectedRedaction(created);
    setActiveTab('redactions');
  };

  const handleSubmitNewMission = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMissionTitle.trim() || isSubmittingMission) return;

    setIsSubmittingMission(true);
    await autonomousEngine.addNewFreelanceProject({
      platform: newMissionPlatform,
      clientName: newMissionClient.trim() || 'Client Vérifié',
      clientCountry: 'Côte d\'Ivoire',
      projectTitle: newMissionTitle.trim(),
      projectDescription: newMissionDesc.trim() || 'Mission freelance de rédaction et stratégie.',
      budget: Number(newMissionBudget) || 50000,
      category: 'Rédaction & Stratégie'
    });

    setIsSubmittingMission(false);
    setIsNewMissionModalOpen(false);
    setNewMissionTitle('');
    setNewMissionClient('');
    setNewMissionDesc('');
    setActiveTab('freelance');
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-950 text-slate-100 pb-16">
      
      {/* Top Agent Master Control Bar */}
      <section className="bg-gradient-to-r from-slate-900 via-indigo-950/70 to-slate-900 border-b border-indigo-900/40 px-4 sm:px-6 lg:px-8 py-5">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          <div className="flex items-center gap-3.5">
            <div className="relative">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-500 via-indigo-600 to-purple-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 text-white font-black text-xl">
                <Bot className="w-6 h-6 animate-pulse" />
              </div>
              {config.isActive && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500 border-2 border-slate-900"></span>
                </span>
              )}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
                  M-Ris Autonome 24h/24
                </h1>
                <span className={`text-[11px] font-extrabold px-2.5 py-0.5 rounded-full border ${
                  config.isActive 
                    ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300' 
                    : 'bg-amber-500/15 border-amber-500/40 text-amber-300'
                }`}>
                  {config.isActive ? '100% ACTIF EN ARRIÈRE-PLAN' : 'EN PAUSE'}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
                Agent d'élite IA dédié à <strong className="text-slate-200">{userName}</strong> : Gestion des emails, rédactions professionnelles et missions freelance.
              </p>
            </div>
          </div>

          {/* Master Action Controls */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={handleTriggerCycleNow}
              disabled={isBusy}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700/80 border border-slate-700 text-xs font-bold text-slate-200 transition-all cursor-pointer disabled:opacity-50 shadow-sm"
              title="Exécute immédiatement les vérifications d'emails, de rédaction et de freelance"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-cyan-400 ${isBusy ? 'animate-spin' : ''}`} />
              <span>{isBusy ? 'Cycle en cours...' : '⚡ Exécuter un cycle'}</span>
            </button>

            <button
              onClick={handleToggleActive}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer shadow-md ${
                config.isActive
                  ? 'bg-rose-600/90 hover:bg-rose-600 text-white shadow-rose-600/20'
                  : 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-black shadow-emerald-500/20'
              }`}
            >
              {config.isActive ? (
                <>
                  <Pause className="w-3.5 h-3.5" />
                  <span>Mettre en pause</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Activer 100% Autonome</span>
                </>
              )}
            </button>

            {onBackToCompanion && (
              <button
                onClick={onBackToCompanion}
                className="px-3 py-2 text-xs font-semibold rounded-xl bg-slate-800/60 hover:bg-slate-800 text-slate-300 border border-slate-700/60 transition-colors cursor-pointer"
              >
                Retour au Chat
              </button>
            )}
          </div>

        </div>
      </section>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        
        {/* Metric Cards Banner */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
          
          {/* Freelance Earnings */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-950/40 via-slate-900 to-slate-900 border border-emerald-500/30 shadow-lg relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1">
                <DollarSign className="w-3.5 h-3.5" />
                Gains Freelance
              </span>
              <span className="text-[10px] font-extrabold text-emerald-400 bg-emerald-500/20 px-1.5 py-0.5 rounded-full border border-emerald-500/30">
                +100% Autonome
              </span>
            </div>
            <div className="mt-2 text-xl sm:text-2xl font-black text-white">
              {FORMAT_FCFA(stats.totalFreelanceGainedFCFA)}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              {stats.totalMissionsWon} missions livrées avec succès
            </p>
          </div>

          {/* Emails Handled */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-cyan-950/40 via-slate-900 to-slate-900 border border-cyan-500/30 shadow-lg relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1">
                <Mail className="w-3.5 h-3.5" />
                Emails Traités
              </span>
              <span className="text-[10px] font-bold text-cyan-400 bg-cyan-500/20 px-1.5 py-0.5 rounded-full">
                Auto-réponse
              </span>
            </div>
            <div className="mt-2 text-xl sm:text-2xl font-black text-white">
              {stats.totalEmailsReplied} / {stats.totalEmailsHandled}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Réponses polies & devis envoyés
            </p>
          </div>

          {/* Redactions Written */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-950/40 via-slate-900 to-slate-900 border border-indigo-500/30 shadow-lg relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1">
                <FileText className="w-3.5 h-3.5" />
                Rédactions & Articles
              </span>
              <span className="text-[10px] font-bold text-indigo-400 bg-indigo-500/20 px-1.5 py-0.5 rounded-full">
                SEO & Formel
              </span>
            </div>
            <div className="mt-2 text-xl sm:text-2xl font-black text-white">
              {stats.totalRedactionsCompleted} Documents
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Articles, lettres & propositions B2B
            </p>
          </div>

          {/* Active Missions */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-950/40 via-slate-900 to-slate-900 border border-amber-500/30 shadow-lg relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1">
                <Briefcase className="w-3.5 h-3.5" />
                Missions en Cours
              </span>
              <span className="text-[10px] font-bold text-amber-400 bg-amber-500/20 px-1.5 py-0.5 rounded-full">
                Upwork / Malt
              </span>
            </div>
            <div className="mt-2 text-xl sm:text-2xl font-black text-white">
              {stats.activeMissionsCount} Projets
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Veille active sur 5 plateformes
            </p>
          </div>

        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 sm:gap-2 border-b border-slate-800 pb-3 overflow-x-auto scrollbar-none">
          <button
            onClick={() => setActiveTab('emails')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'emails'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Mail className="w-4 h-4" />
            <span>Gestion des Emails</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-cyan-900/60 text-cyan-300 font-extrabold">
              {emails.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('redactions')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'redactions'
                ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Atelier Rédaction</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-indigo-900/60 text-indigo-300 font-extrabold">
              {redactions.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('freelance')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'freelance'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Briefcase className="w-4 h-4" />
            <span>Freelance Hub</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-900/60 text-emerald-300 font-extrabold">
              {missions.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('logs')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'logs'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>Logs & Activité Live</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-amber-900/60 text-amber-300 font-extrabold">
              {logs.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'settings'
                ? 'bg-slate-800 text-white border border-slate-700'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>Configuration Autonome</span>
          </button>
        </div>

        {/* TAB 1: GESTION DES EMAILS */}
        {activeTab === 'emails' && (
          <div className="mt-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Email List Column */}
            <div className="lg:col-span-5 space-y-3">
              <div className="flex items-center justify-between pb-2">
                <h3 className="text-sm font-black text-white flex items-center gap-2">
                  <Mail className="w-4 h-4 text-cyan-400" />
                  Boîte de Réception & Tri IA ({emails.length})
                </h3>
                <span className="text-[11px] text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded-full border border-cyan-800/40">
                  Tri & Réponses Auto
                </span>
              </div>

              <div className="space-y-2.5 max-h-[600px] overflow-y-auto pr-1">
                {emails.map(email => {
                  const isSelected = selectedEmail?.id === email.id;
                  const isReplied = email.status === 'replied' || email.reply?.sentAutomatically;

                  return (
                    <div
                      key={email.id}
                      onClick={() => setSelectedEmail(email)}
                      className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-gradient-to-r from-cyan-950/50 to-slate-900 border-cyan-500/60 shadow-md ring-1 ring-cyan-500/40'
                          : 'bg-slate-900/70 hover:bg-slate-900 border-slate-800'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold text-slate-200 truncate">
                          {email.senderName}
                        </span>
                        <div className="flex items-center gap-1.5 shrink-0">
                          {isReplied ? (
                            <span className="text-[10px] font-black text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 px-1.5 py-0.2 rounded-full flex items-center gap-0.5">
                              <CheckCircle2 className="w-3 h-3" />
                              Répondu
                            </span>
                          ) : (
                            <span className="text-[10px] font-black text-amber-400 bg-amber-500/15 border border-amber-500/30 px-1.5 py-0.2 rounded-full">
                              En attente
                            </span>
                          )}
                          <span className="text-[10px] text-slate-400">
                            {new Date(email.receivedAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>

                      <h4 className="text-xs font-bold text-cyan-200 mt-1 truncate">
                        {email.subject}
                      </h4>

                      <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">
                        {email.snippet}
                      </p>

                      <div className="flex items-center gap-1.5 mt-2">
                        <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                          {email.category}
                        </span>
                        {email.importance === 'haute' && (
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
                            Urgent
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Email Viewer & AI Reply Panel */}
            <div className="lg:col-span-7">
              {selectedEmail ? (
                <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
                  
                  {/* Email Header */}
                  <div className="border-b border-slate-800 pb-4">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-extrabold text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded-full border border-cyan-800/40 uppercase tracking-wider">
                        {selectedEmail.category} • Importance {selectedEmail.importance}
                      </span>
                      <span className="text-xs text-slate-400">
                        Reçu le {new Date(selectedEmail.receivedAt).toLocaleString('fr-FR')}
                      </span>
                    </div>

                    <h2 className="text-lg font-black text-white mt-2">
                      {selectedEmail.subject}
                    </h2>

                    <div className="flex items-center gap-2 mt-1.5 text-xs text-slate-300">
                      <span className="font-semibold text-slate-100">{selectedEmail.senderName}</span>
                      <span className="text-slate-400">&lt;{selectedEmail.senderEmail}&gt;</span>
                    </div>
                  </div>

                  {/* Email Body */}
                  <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 text-xs sm:text-sm text-slate-300 whitespace-pre-wrap leading-relaxed max-h-56 overflow-y-auto">
                    {selectedEmail.body}
                  </div>

                  {/* AI Autonomous Reply Section */}
                  <div className="border-t border-slate-800 pt-4">
                    <div className="flex items-center justify-between mb-2.5">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-emerald-400" />
                        <h4 className="text-xs font-black text-white uppercase tracking-wider">
                          Réponse Générée Autonomement par M-Ris
                        </h4>
                      </div>

                      {selectedEmail.reply && (
                        <button
                          onClick={() => handleCopy(selectedEmail.id, selectedEmail.reply!.replyText)}
                          className="flex items-center gap-1 text-[11px] font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-750 px-2.5 py-1 rounded-lg border border-slate-700 transition-colors cursor-pointer"
                        >
                          {copiedId === selectedEmail.id ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                          <span>{copiedId === selectedEmail.id ? 'Copié !' : 'Copier'}</span>
                        </button>
                      )}
                    </div>

                    {selectedEmail.reply ? (
                      <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-950/30 via-slate-950 to-slate-950 border border-emerald-500/30 text-xs sm:text-sm text-slate-200 whitespace-pre-wrap leading-relaxed">
                        {selectedEmail.reply.replyText}

                        <div className="mt-3 pt-3 border-t border-emerald-900/30 flex items-center justify-between text-[11px] text-emerald-400/90">
                          <span className="flex items-center gap-1 font-semibold">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                            {selectedEmail.reply.sentAutomatically ? 'Transmis automatiquement par M-Ris' : 'Brouillon prêt à l\'envoi'}
                          </span>
                          <span className="text-slate-400">
                            {new Date(selectedEmail.reply.generatedAt).toLocaleTimeString('fr-FR')}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="p-6 rounded-xl bg-slate-950 border border-dashed border-slate-800 text-center space-y-3">
                        <p className="text-xs text-slate-400">
                          Cet email n'a pas encore de réponse générée. M-Ris peut y répondre immédiatement avec son intelligence de pointe.
                        </p>
                        <button
                          onClick={() => autonomousEngine.processEmailAutonomously(selectedEmail.id)}
                          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-xs shadow-md cursor-pointer"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>Rédiger et envoyer la réponse IA maintenant</span>
                        </button>
                      </div>
                    )}

                    {selectedEmail.reply && !selectedEmail.reply.sentAutomatically && (
                      <div className="mt-3 flex justify-end">
                        <button
                          onClick={() => autonomousEngine.manualSendEmailReply(selectedEmail.id)}
                          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs transition-colors cursor-pointer"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>Confirmer l'envoi au destinataire</span>
                        </button>
                      </div>
                    )}

                  </div>

                </div>
              ) : (
                <div className="p-12 text-center text-slate-500 bg-slate-900/40 rounded-2xl border border-slate-800">
                  Sélectionnez un email dans la liste pour voir les détails et la réponse automatique.
                </div>
              )}
            </div>

          </div>
        )}

        {/* TAB 2: ATELIER DE RÉDACTION PROFESSIONNELLE */}
        {activeTab === 'redactions' && (
          <div className="mt-6 space-y-6">
            
            {/* Action Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-gradient-to-r from-indigo-950/50 via-slate-900 to-slate-900 border border-indigo-500/30">
              <div>
                <h3 className="text-sm sm:text-base font-black text-white flex items-center gap-2">
                  <FileText className="w-4 h-4 text-indigo-400" />
                  Atelier de Rédaction & Production de Contenus IA
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Articles de blog SEO, lettres administratives, propositions B2B, devis et synthèses rédigés de manière autonome.
                </p>
              </div>

              <button
                onClick={() => setIsNewRedactionModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white text-xs font-black shadow-md shadow-indigo-500/20 cursor-pointer shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>Nouvelle Rédaction sur-mesure</span>
              </button>
            </div>

            {/* Redactions Explorer */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Document List */}
              <div className="lg:col-span-5 space-y-2.5">
                {redactions.map(doc => {
                  const isSelected = selectedRedaction?.id === doc.id;

                  return (
                    <div
                      key={doc.id}
                      onClick={() => setSelectedRedaction(doc)}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-gradient-to-r from-indigo-950/50 to-slate-900 border-indigo-500/60 shadow-md ring-1 ring-indigo-500/40'
                          : 'bg-slate-900/70 hover:bg-slate-900 border-slate-800'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                          {doc.type.replace('_', ' ')}
                        </span>
                        <span className="text-[11px] text-emerald-400 font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          {doc.wordCount} mots
                        </span>
                      </div>

                      <h4 className="text-xs sm:text-sm font-bold text-white mt-2 leading-snug">
                        {doc.title}
                      </h4>

                      <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">
                        {doc.summary}
                      </p>

                      <div className="flex flex-wrap gap-1 mt-2.5">
                        {doc.keywords.slice(0, 3).map((kw, i) => (
                          <span key={i} className="text-[9px] bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded">
                            #{kw}
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Document Reader & Exporter */}
              <div className="lg:col-span-7">
                {selectedRedaction ? (
                  <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
                    
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                      <div>
                        <span className="text-[10px] font-black uppercase text-indigo-400 tracking-wider">
                          {selectedRedaction.type.replace('_', ' ')} • {selectedRedaction.wordCount} mots
                        </span>
                        <h2 className="text-base sm:text-lg font-black text-white mt-1">
                          {selectedRedaction.title}
                        </h2>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleCopy(selectedRedaction.id, selectedRedaction.content)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 border border-slate-700 transition-colors cursor-pointer"
                        >
                          {copiedId === selectedRedaction.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                          <span>{copiedId === selectedRedaction.id ? 'Copié !' : 'Copier tout'}</span>
                        </button>
                      </div>
                    </div>

                    {/* Content Display */}
                    <div className="p-4 sm:p-5 rounded-xl bg-slate-950/70 border border-slate-800/80 text-xs sm:text-sm text-slate-200 font-sans whitespace-pre-wrap leading-relaxed max-h-[520px] overflow-y-auto">
                      {selectedRedaction.content}
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-800">
                      <span>Audience ciblée : <strong>{selectedRedaction.targetAudience}</strong></span>
                      <span>Rédigé de façon 100% autonome par M-Ris</span>
                    </div>

                  </div>
                ) : (
                  <div className="p-12 text-center text-slate-500 bg-slate-900/40 rounded-2xl border border-slate-800">
                    Sélectionnez un document rédigé pour le consulter ou le copier.
                  </div>
                )}
              </div>

            </div>

          </div>
        )}

        {/* TAB 3: FREELANCE HUB & MISSIONS AUTONOMES */}
        {activeTab === 'freelance' && (
          <div className="mt-6 space-y-6">
            
            {/* Header / Freelance Strategy */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-emerald-950/50 via-slate-900 to-slate-900 border border-emerald-500/30">
              <div>
                <div className="flex items-center gap-2">
                  <Briefcase className="w-5 h-5 text-emerald-400" />
                  <h3 className="text-base sm:text-lg font-black text-white">
                    M-Ris Freelance Agency & Business Hub
                  </h3>
                </div>
                <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl">
                  M-Ris surveille en continu <strong>Malt, Upwork, ComeUp et Freelance.ci</strong>, postule avec des propositions gagnantes et produit les livrables finaux pour encaisser les paiements.
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => setIsNewMissionModalOpen(true)}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs shadow-md shadow-emerald-500/20 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Ajouter une mission manuelle</span>
                </button>
              </div>
            </div>

            {/* Freelance Missions Stream */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Missions Cards List */}
              <div className="lg:col-span-5 space-y-3">
                {missions.map(mission => {
                  const isSelected = selectedMission?.id === mission.id;
                  const isPaid = mission.status === 'paid';
                  const isDelivered = mission.status === 'delivered';

                  return (
                    <div
                      key={mission.id}
                      onClick={() => setSelectedMission(mission)}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-gradient-to-r from-emerald-950/50 to-slate-900 border-emerald-500/60 shadow-md ring-1 ring-emerald-500/40'
                          : 'bg-slate-900/70 hover:bg-slate-900 border-slate-800'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-slate-800 text-cyan-300 border border-slate-700">
                          {mission.platform}
                        </span>

                        <span className="text-xs font-black text-emerald-400">
                          {FORMAT_FCFA(mission.budget)}
                        </span>
                      </div>

                      <h4 className="text-xs sm:text-sm font-bold text-white mt-2 leading-snug">
                        {mission.projectTitle}
                      </h4>

                      <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2">
                        <span>Client : {mission.clientName}</span>
                        <span className={`font-bold px-1.5 py-0.2 rounded-full text-[10px] ${
                          isPaid 
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : isDelivered 
                            ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                            : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        }`}>
                          {mission.status === 'paid' ? 'Payé ✓' : mission.status === 'delivered' ? 'Livré' : 'Candidature envoyée'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Mission Details, Winning Proposal & Final Deliverable */}
              <div className="lg:col-span-7">
                {selectedMission ? (
                  <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-5">
                    
                    {/* Header */}
                    <div className="border-b border-slate-800 pb-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-extrabold text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded-full border border-cyan-800/40">
                          Plateforme : {selectedMission.platform}
                        </span>
                        <div className="text-right">
                          <span className="text-base sm:text-lg font-black text-emerald-400">
                            {FORMAT_FCFA(selectedMission.budget)}
                          </span>
                        </div>
                      </div>

                      <h2 className="text-base sm:text-lg font-black text-white mt-2">
                        {selectedMission.projectTitle}
                      </h2>

                      <p className="text-xs text-slate-400 mt-1">
                        Client : <strong className="text-slate-200">{selectedMission.clientName}</strong> ({selectedMission.clientCountry}) • Catégorie : {selectedMission.category}
                      </p>
                    </div>

                    {/* Client Brief */}
                    <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
                      <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                        Cahier des charges client :
                      </h4>
                      <p className="text-xs text-slate-300 leading-relaxed">
                        {selectedMission.projectDescription}
                      </p>
                    </div>

                    {/* Proposal Letter Submitted by M-Ris */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-xs font-black text-white flex items-center gap-1.5 uppercase tracking-wider">
                          <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                          Candidature & Proposition Gagnante (M-Ris)
                        </h4>
                        <button
                          onClick={() => handleCopy('prop-' + selectedMission.id, selectedMission.proposalLetter)}
                          className="flex items-center gap-1 text-[11px] text-slate-300 hover:text-white bg-slate-800 px-2 py-1 rounded-lg border border-slate-700 cursor-pointer"
                        >
                          {copiedId === 'prop-' + selectedMission.id ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                          <span>{copiedId === 'prop-' + selectedMission.id ? 'Copié' : 'Copier'}</span>
                        </button>
                      </div>

                      <div className="p-3.5 rounded-xl bg-gradient-to-br from-cyan-950/20 via-slate-950 to-slate-950 border border-cyan-800/30 text-xs text-slate-200 whitespace-pre-wrap leading-relaxed">
                        {selectedMission.proposalLetter || 'Proposition en cours de préparation par M-Ris...'}
                      </div>
                    </div>

                    {/* Final Deliverable produced autonomously */}
                    {selectedMission.deliverableContent && (
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-xs font-black text-emerald-400 flex items-center gap-1.5 uppercase tracking-wider">
                            <FileCheck className="w-3.5 h-3.5" />
                            Livrable Final Rédigé et Livré par M-Ris
                          </h4>
                          <button
                            onClick={() => handleCopy('deliv-' + selectedMission.id, selectedMission.deliverableContent!)}
                            className="flex items-center gap-1 text-[11px] text-slate-300 hover:text-white bg-slate-800 px-2 py-1 rounded-lg border border-slate-700 cursor-pointer"
                          >
                            {copiedId === 'deliv-' + selectedMission.id ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                            <span>{copiedId === 'deliv-' + selectedMission.id ? 'Copié' : 'Copier livrable'}</span>
                          </button>
                        </div>

                        <div className="p-3.5 rounded-xl bg-gradient-to-br from-emerald-950/20 via-slate-950 to-slate-950 border border-emerald-500/30 text-xs text-slate-200 whitespace-pre-wrap leading-relaxed">
                          {selectedMission.deliverableContent}
                        </div>

                        {selectedMission.clientFeedback && (
                          <div className="mt-3 p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/30 flex items-center gap-2 text-xs text-emerald-300">
                            <Award className="w-4 h-4 shrink-0 text-amber-400" />
                            <span>
                              <strong>Avis Client ({selectedMission.rating}/5 ⭐) :</strong> « {selectedMission.clientFeedback} »
                            </span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Action buttons if not paid */}
                    {selectedMission.status !== 'paid' && (
                      <div className="pt-2 flex justify-end">
                        <button
                          onClick={() => autonomousEngine.deliverMissionAutonomously(selectedMission.id)}
                          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs shadow-md cursor-pointer"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Valider la livraison et encaisser {FORMAT_FCFA(selectedMission.budget)}</span>
                        </button>
                      </div>
                    )}

                  </div>
                ) : (
                  <div className="p-12 text-center text-slate-500 bg-slate-900/40 rounded-2xl border border-slate-800">
                    Sélectionnez une mission freelance pour inspecter la proposition et le travail livré.
                  </div>
                )}
              </div>

            </div>

          </div>
        )}

        {/* TAB 4: LOGS & ACTIVITÉ LIVE */}
        {activeTab === 'logs' && (
          <div className="mt-6 space-y-4">
            <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-900 border border-slate-800">
              <div>
                <h3 className="text-sm font-black text-white flex items-center gap-2">
                  <Activity className="w-4 h-4 text-amber-400" />
                  Journal d'Activité d'Arrière-Plan (Live Daemon Console)
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Visualisez chaque action exécutée par M-Ris en arrière-plan à la seconde près.
                </p>
              </div>

              <span className="text-xs font-mono text-emerald-400 bg-emerald-950/60 px-2.5 py-1 rounded-full border border-emerald-800/40 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                Daemon Running
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800/90 font-mono text-xs space-y-2.5 max-h-[550px] overflow-y-auto">
              {logs.map((log) => {
                const badgeColor = 
                  log.module === 'email' ? 'text-cyan-400 bg-cyan-950/80 border-cyan-800' :
                  log.module === 'freelance' ? 'text-emerald-400 bg-emerald-950/80 border-emerald-800' :
                  log.module === 'redaction' ? 'text-indigo-400 bg-indigo-950/80 border-indigo-800' :
                  'text-amber-400 bg-amber-950/80 border-amber-800';

                return (
                  <div key={log.id} className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800/80 flex items-start gap-2.5">
                    <span className="text-[10px] text-slate-500 whitespace-nowrap pt-0.5">
                      {new Date(log.timestamp).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </span>

                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${badgeColor} whitespace-nowrap`}>
                      {log.module}
                    </span>

                    <p className={`text-xs leading-relaxed ${
                      log.level === 'success' ? 'text-emerald-200' :
                      log.level === 'warn' ? 'text-amber-300' :
                      'text-slate-300'
                    }`}>
                      {log.message}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 5: PARAMÈTRES D'AUTONOMIE */}
        {activeTab === 'settings' && (
          <div className="mt-6 max-w-3xl mx-auto bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
            <div>
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <Sliders className="w-5 h-5 text-cyan-400" />
                Configuration du Moteur 100% Autonome
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Ajustez les privilèges d'autonomie et les fréquences de travail de M-Ris.
              </p>
            </div>

            <div className="space-y-4 border-t border-slate-800 pt-4">
              
              {/* Auto Reply Emails */}
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                <div>
                  <h4 className="text-xs font-bold text-white">Gestion & Réponse Automatique aux Emails</h4>
                  <p className="text-[11px] text-slate-400">M-Ris analyse les emails reçus et génère des réponses courtoises et des devis prêts à l'envoi.</p>
                </div>
                <input
                  type="checkbox"
                  checked={config.autoReplyEmails}
                  onChange={(e) => autonomousEngine.updateConfig({ autoReplyEmails: e.target.checked })}
                  className="w-4 h-4 accent-cyan-500 cursor-pointer"
                />
              </div>

              {/* Auto Redaction */}
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                <div>
                  <h4 className="text-xs font-bold text-white">Production Autonome de Rédactions & Articles SEO</h4>
                  <p className="text-[11px] text-slate-400">Rédige et enrichit la bibliothèque de documents même lorsque vous n'êtes pas devant l'écran.</p>
                </div>
                <input
                  type="checkbox"
                  checked={config.autoDraftArticles}
                  onChange={(e) => autonomousEngine.updateConfig({ autoDraftArticles: e.target.checked })}
                  className="w-4 h-4 accent-cyan-500 cursor-pointer"
                />
              </div>

              {/* Auto Freelance Bidding */}
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                <div>
                  <h4 className="text-xs font-bold text-white">Veille & Candidatures Freelance Automatiques</h4>
                  <p className="text-[11px] text-slate-400">M-Ris détecte les offres sur Malt, Upwork et Freelance.ci et rédige immédiatement une proposition gagnante.</p>
                </div>
                <input
                  type="checkbox"
                  checked={config.autoFreelanceBidding}
                  onChange={(e) => autonomousEngine.updateConfig({ autoFreelanceBidding: e.target.checked })}
                  className="w-4 h-4 accent-cyan-500 cursor-pointer"
                />
              </div>

              {/* Cycle Interval */}
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-white">Cadence de Surveillance en Arrière-Plan</h4>
                  <p className="text-[11px] text-slate-400">Fréquence des vérifications périodiques du moteur.</p>
                </div>
                <select
                  value={config.cycleIntervalSeconds}
                  onChange={(e) => autonomousEngine.updateConfig({ cycleIntervalSeconds: Number(e.target.value) })}
                  className="bg-slate-900 border border-slate-700 text-xs font-bold text-white px-3 py-1.5 rounded-lg cursor-pointer"
                >
                  <option value={15}>Toutes les 15 secondes (Ultra Rapide)</option>
                  <option value={30}>Toutes les 30 secondes (Recommandé)</option>
                  <option value={60}>Toutes les 60 secondes</option>
                </select>
              </div>

              {/* Signature */}
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                <label className="text-xs font-bold text-white block mb-1">Signature Professionnelle de l'Agent</label>
                <input
                  type="text"
                  value={config.signature}
                  onChange={(e) => autonomousEngine.updateConfig({ signature: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 text-xs text-white px-3 py-2 rounded-lg"
                />
              </div>

            </div>
          </div>
        )}

      </div>

      {/* MODAL : Nouvelle Rédaction Sur-Mesure */}
      {isNewRedactionModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-400" />
                Commander une Rédaction à M-Ris
              </h3>
              <button
                onClick={() => setIsNewRedactionModalOpen(false)}
                className="text-slate-400 hover:text-white text-xs font-bold px-2 py-1"
              >
                ✕ Fermer
              </button>
            </div>

            <form onSubmit={handleSubmitNewRedaction} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-300 mb-1">Sujet ou Titre du Document *</label>
                <input
                  type="text"
                  required
                  placeholder="ex: Les 5 avantages de l'agriculture biologique en Côte d'Ivoire"
                  value={newRedactionTitle}
                  onChange={(e) => setNewRedactionTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-300 mb-1">Type de Document</label>
                  <select
                    value={newRedactionType}
                    onChange={(e) => setNewRedactionType(e.target.value as RedactionType)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-white"
                  >
                    <option value="article_seo">Article SEO & Blog</option>
                    <option value="proposition_commerciale">Proposition Commerciale</option>
                    <option value="lettre_pro">Lettre Administrative / Pro</option>
                    <option value="rapport_synthese">Rapport de Synthèse</option>
                    <option value="pitch_vente">Pitch de Vente B2B</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-300 mb-1">Public Cible</label>
                  <input
                    type="text"
                    value={newRedactionAudience}
                    onChange={(e) => setNewRedactionAudience(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">Mots-clés SEO (séparés par virgules)</label>
                <input
                  type="text"
                  placeholder="ex: Abidjan, durabilité, économie verte, rendement"
                  value={newRedactionKeywords}
                  onChange={(e) => setNewRedactionKeywords(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white placeholder-slate-500"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsNewRedactionModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingRedaction}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white font-black shadow-lg cursor-pointer disabled:opacity-50"
                >
                  {isSubmittingRedaction ? 'M-Ris rédige...' : '⚡ Lancer la Rédaction Immédiate'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL : Nouvelle Mission Freelance */}
      {isNewMissionModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-emerald-400" />
                Ajouter une Mission Freelance
              </h3>
              <button
                onClick={() => setIsNewMissionModalOpen(false)}
                className="text-slate-400 hover:text-white text-xs font-bold px-2 py-1"
              >
                ✕ Fermer
              </button>
            </div>

            <form onSubmit={handleSubmitNewMission} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-300 mb-1">Intitulé du Projet *</label>
                <input
                  type="text"
                  required
                  placeholder="ex: Rédaction de 5 fiches produits e-commerce Abidjan"
                  value={newMissionTitle}
                  onChange={(e) => setNewMissionTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white placeholder-slate-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-300 mb-1">Plateforme</label>
                  <select
                    value={newMissionPlatform}
                    onChange={(e) => setNewMissionPlatform(e.target.value as FreelancePlatform)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-white"
                  >
                    <option value="Malt">Malt</option>
                    <option value="Upwork">Upwork</option>
                    <option value="ComeUp">ComeUp / 5euros</option>
                    <option value="Freelance.ci">Freelance.ci</option>
                    <option value="LinkedIn">LinkedIn Direct</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-300 mb-1">Budget (FCFA)</label>
                  <input
                    type="number"
                    step="5000"
                    value={newMissionBudget}
                    onChange={(e) => setNewMissionBudget(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">Nom du Client</label>
                <input
                  type="text"
                  placeholder="ex: Agence Digital Pulse CI"
                  value={newMissionClient}
                  onChange={(e) => setNewMissionClient(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">Description / Besoins du client</label>
                <textarea
                  rows={3}
                  placeholder="Décrivez ce que le client demande..."
                  value={newMissionDesc}
                  onChange={(e) => setNewMissionDesc(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-white placeholder-slate-500"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsNewMissionModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingMission}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black shadow-lg cursor-pointer disabled:opacity-50"
                >
                  {isSubmittingMission ? 'Ajout en cours...' : '⚡ Postuler Automatiquement'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
