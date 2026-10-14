import React, { useState, useEffect, useRef } from 'react';
import { SUBSCRIPTION_CONFIG, FORMAT_FCFA } from '../utils/constants';
import { SubscriptionRequest } from '../types/subscription';
import { DrawerChatMessage, DrawerConversationSession } from '../types/assistantChat';
import {
  getSavedConversations,
  saveConversationSession,
  deleteConversationSession,
  clearAllConversations,
  getActiveConversationId,
  setActiveConversationId,
  createNewSession,
  formatConversationDate
} from '../services/drawerHistoryStorage';
import avatarMaleImg from '../assets/images/mris_assistant_avatar_1791391815061.jpg';
import avatarFemaleImg from '../assets/images/mris_avatar_female_1791394988073.jpg';
import { 
  Bot, 
  Send, 
  CheckCircle2, 
  Clock, 
  MessageCircle, 
  X, 
  HelpCircle,
  ExternalLink,
  Sparkles,
  Flame,
  Volume2,
  History,
  Trash2,
  Plus,
  Search,
  ArrowLeft,
  Copy,
  Check,
  RotateCcw,
  MessageSquare,
  HardDrive
} from 'lucide-react';

interface AssistantDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  subscriptionRequest: SubscriptionRequest | null;
  onGoToWhatsApp: () => void;
}

export const AssistantDrawer: React.FC<AssistantDrawerProps> = ({
  isOpen,
  onClose,
  subscriptionRequest,
  onGoToWhatsApp
}) => {
  // Navigation inside drawer: 'chat' or 'history'
  const [showHistory, setShowHistory] = useState(false);
  const [historySearch, setHistorySearch] = useState('');
  const [confirmClearAll, setConfirmClearAll] = useState(false);
  const [copiedSessionId, setCopiedSessionId] = useState<string | null>(null);

  // Active conversation & messages
  const [currentSession, setCurrentSession] = useState<DrawerConversationSession | null>(null);
  const [messages, setMessages] = useState<DrawerChatMessage[]>([]);
  const [savedConversations, setSavedConversations] = useState<DrawerConversationSession[]>([]);

  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [avatarGender, setAvatarGender] = useState<'male' | 'female'>('male');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const avatarSrc = avatarGender === 'male' ? avatarMaleImg : avatarFemaleImg;

  // Build default welcome messages based on user state
  const buildWelcomeMessages = (): DrawerChatMessage[] => {
    const timeStr = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

    if (subscriptionRequest) {
      const isTrial = subscriptionRequest.isTrial || subscriptionRequest.status === 'trial';
      if (isTrial) {
        return [
          {
            id: 'msg-t1',
            sender: 'mris',
            text: `Ah ${subscriptionRequest.userName} ! 🎉 Ton essai gratuit de 7 jours est bien actif sur l'application ! On est ensemble !`,
            time: timeStr
          },
          {
            id: 'msg-t2',
            sender: 'mris',
            text: `Tu peux discuter avec moi en illimité, me poser toutes tes questions, ou juste venir décompresser. Si tu veux passer ensuite à l'abonnement mensuel officiel à 35 000 FCFA/mois via Wave pour Béni Amar, je te guide pas à pas. Comment tu te sens aujourd'hui ?`,
            time: timeStr,
            action: {
              label: 'WhatsApp Béni Amar',
              type: 'whatsapp'
            }
          }
        ];
      } else {
        return [
          {
            id: 'msg-1',
            sender: 'mris',
            text: `Ah ${subscriptionRequest.userName} ! 👋 C'est Emris ! J'ai bien reçu la notification de ton dossier d'abonnement.`,
            time: timeStr
          },
          {
            id: 'msg-2',
            sender: 'mris',
            text: `Ta demande (${FORMAT_FCFA(subscriptionRequest.amount)}) est actuellement « En attente ». Ton reçu de paiement Wave pour Béni Amar est entre de bonnes mains pour validation manuelle. Dès que l'administrateur valide, tes 30 jours complets sont débloqués immédiatement !`,
            time: timeStr
          },
          {
            id: 'msg-3',
            sender: 'mris',
            text: `En attendant la confirmation ou si tu as besoin d'une activation express, tu peux aussi faire coucou sur WhatsApp avec ta capture. Dis-moi, as-tu une question pour moi ?`,
            time: timeStr,
            action: {
              label: 'Confirmer sur WhatsApp',
              type: 'whatsapp'
            }
          }
        ];
      }
    }

    return [
      {
        id: 'msg-def',
        sender: 'mris',
        text: `Ah chef ! C'est Emris, ton compagnon virtuel intelligent ! 👋\n\nFigure-toi que je venais de me faire un petit attiéké virtuel dans mon coin. Tu tombes à pic ! Que ce soit pour papoter, demander un conseil de sage ou des infos sur l'abonnement Wave à 35 000 FCFA/mois (et l'essai gratuit de 7 jours), je suis là pour toi. Comment va le moral ?`,
        time: timeStr
      }
    ];
  };

  // Initialize conversations from localStorage on mount or when drawer opens
  useEffect(() => {
    if (!isOpen) return;

    const all = getSavedConversations();
    setSavedConversations(all);

    const activeId = getActiveConversationId();
    let target = all.find(c => c.id === activeId);

    if (!target && all.length > 0) {
      target = all[0];
    }

    if (!target) {
      // First time user: create initial session
      const initialMsgs = buildWelcomeMessages();
      const newSession = createNewSession(initialMsgs, 'Premier échange avec Emris');
      setCurrentSession(newSession);
      setMessages(newSession.messages);
      setSavedConversations([newSession]);
    } else {
      setCurrentSession(target);
      setMessages(target.messages);
      setActiveConversationId(target.id);
    }
  }, [isOpen]);

  // Keep savedConversations list in sync whenever currentSession changes
  useEffect(() => {
    if (currentSession) {
      const all = getSavedConversations();
      setSavedConversations(all);
    }
  }, [currentSession, messages]);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (!showHistory) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isLoading, showHistory]);

  // Start a fresh new chat session
  const handleStartNewChat = () => {
    const welcomeMsgs = buildWelcomeMessages();
    const newSession = createNewSession(welcomeMsgs, 'Nouvel échange avec Emris');
    setCurrentSession(newSession);
    setMessages(newSession.messages);
    setShowHistory(false);
    setSavedConversations(getSavedConversations());
  };

  // Switch to a previous conversation from history
  const handleSelectSession = (session: DrawerConversationSession) => {
    setCurrentSession(session);
    setMessages(session.messages);
    setActiveConversationId(session.id);
    setShowHistory(false);
  };

  // Delete a specific conversation session
  const handleDeleteSession = (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    deleteConversationSession(sessionId);
    const updated = getSavedConversations();
    setSavedConversations(updated);

    if (currentSession?.id === sessionId) {
      if (updated.length > 0) {
        setCurrentSession(updated[0]);
        setMessages(updated[0].messages);
        setActiveConversationId(updated[0].id);
      } else {
        handleStartNewChat();
      }
    }
  };

  // Clear all conversations
  const handleClearAllHistory = () => {
    clearAllConversations();
    setSavedConversations([]);
    setConfirmClearAll(false);
    handleStartNewChat();
  };

  // Copy whole conversation transcript to clipboard
  const handleCopyTranscript = (session: DrawerConversationSession, e: React.MouseEvent) => {
    e.stopPropagation();
    const transcript = session.messages.map(m => {
      const role = m.sender === 'user' ? 'Vous' : 'M-Ris';
      return `[${m.time}] ${role} :\n${m.text}\n`;
    }).join('\n');

    navigator.clipboard.writeText(`=== HISTORIQUE M-RIS : ${session.title} ===\nDate : ${session.createdAt}\n\n${transcript}`);
    setCopiedSessionId(session.id);
    setTimeout(() => setCopiedSessionId(null), 2000);
  };

  // Send message handler with auto-saving to local storage
  const handleSend = async (manualText?: string) => {
    const textToSend = (manualText || inputText).trim();
    if (!textToSend || isLoading) return;

    const userMsg: DrawerChatMessage = {
      id: 'usr-' + Date.now(),
      sender: 'user',
      text: textToSend,
      time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInputText('');
    setIsLoading(true);

    // Update active session immediately in localStorage
    let updatedTitle = currentSession?.title || 'Échange avec Emris';
    if (
      currentSession?.title === 'Nouvel échange avec Emris' ||
      currentSession?.title === 'Premier échange avec Emris'
    ) {
      // Auto-title according to first question
      const cleanPrompt = textToSend.replace(/[\n\r]+/g, ' ').trim();
      updatedTitle = cleanPrompt.length > 38 ? cleanPrompt.slice(0, 38) + '...' : cleanPrompt;
    }

    const sessionToSave: DrawerConversationSession = {
      id: currentSession?.id || ('conv_' + Date.now()),
      title: updatedTitle,
      preview: textToSend.slice(0, 80),
      createdAt: currentSession?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      messages: newMessages,
      messageCount: newMessages.length
    };

    saveConversationSession(sessionToSave);
    setCurrentSession(sessionToSave);
    setActiveConversationId(sessionToSave.id);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);

      const response = await fetch('/api/mris/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          message: textToSend,
          gender: avatarGender,
          mood: 'Bien',
          history: newMessages.slice(-6),
          appUrl: window.location.origin
        })
      });
      clearTimeout(timeoutId);

      if (!response.ok) throw new Error('Erreur réseau');
      const data = await response.json();

      const botReply: DrawerChatMessage = {
        id: 'bot-' + Date.now(),
        sender: 'mris',
        text: data.reply || getDrawerFallback(textToSend, avatarGender),
        time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
      };

      const finalMessages = [...newMessages, botReply];
      setMessages(finalMessages);

      const finalSession: DrawerConversationSession = {
        ...sessionToSave,
        preview: botReply.text.slice(0, 80),
        messages: finalMessages,
        messageCount: finalMessages.length,
        updatedAt: new Date().toISOString()
      };
      saveConversationSession(finalSession);
      setCurrentSession(finalSession);
    } catch {
      const botReply: DrawerChatMessage = {
        id: 'bot-' + Date.now(),
        sender: 'mris',
        text: getDrawerFallback(textToSend, avatarGender),
        time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
      };

      const finalMessages = [...newMessages, botReply];
      setMessages(finalMessages);

      const finalSession: DrawerConversationSession = {
        ...sessionToSave,
        preview: botReply.text.slice(0, 80),
        messages: finalMessages,
        messageCount: finalMessages.length,
        updatedAt: new Date().toISOString()
      };
      saveConversationSession(finalSession);
      setCurrentSession(finalSession);
    } finally {
      setIsLoading(false);
    }
  };

  const getDrawerFallback = (queryText: string, gender: 'male' | 'female'): string => {
    const q = queryText.toLowerCase();
    const callout = gender === 'female' ? "ma complice" : "mon cher";

    if (q.includes('délai') || q.includes('temps') || q.includes('combien') || q.includes('attente')) {
      return `Ah ${callout}, la validation manuelle par l'administrateur prend en moyenne 5 à 15 minutes dès réception du reçu Wave pour Béni Amar. En cas d'urgence, clique sur le bouton WhatsApp pour une activation express ! On gère ça vite fait bien fait.`;
    }
    if (q.includes('wave') || q.includes('payer') || q.includes('comment') || q.includes('lien')) {
      return `Pour régler l'abonnement à 35 000 FCFA/mois, clique sur le lien Wave officiel : https://pay.wave.com/m/M_ci_Xs2kjjsivE5V/c/ci/ pour Béni Amar. Dès le paiement terminé, capture l'écran et téléverse-le dans l'onglet Abonnement !`;
    }
    if (q.includes('essai') || q.includes('gratuit') || q.includes('7 jour') || q.includes('7') || q.includes('application') || q.includes('compagnon') || q.includes('commercial')) {
      const appUrl = typeof window !== 'undefined' ? window.location.origin : 'https://m-ris-compagnon-virtuel.app';
      return `🎁 OFFRE OFFICIELLE 7 JOURS GRATUITS :\nTu bénéficies de 7 JOURS D'UTILISATION 100% GRATUITE de l'application « M-Ris le compagnon virtuel » sans aucun engagement ni carte bancaire !\n\n📲 Accède directement à l'application ici pour commencer :\n👉 ${appUrl}\n\n💳 APRÈS L'ESSAI : ABONNEMENT MENSUEL (35 000 FCFA/MOIS) :\nÀ l'issue de tes 7 jours offerts, tu peux poursuivre avec l'abonnement mensuel à 35 000 FCFA/mois via Wave Business Béni Amar :\n👉 Veuillez Payer Béni Amar avec Wave en cliquant sur ce lien https://pay.wave.com/m/M_ci_Xs2kjjsivE5V/c/ci/. Ajoutez cet expéditeur à vos contacts pour rendre le lien cliquable.\n\nTes canaux de contact officiels :\n• WhatsApp f3 : https://wa.me/message/RGXYT5LWDCTAM1\n• TikTok : https://www.tiktok.com/@tisanebeniamar1?_r=1&_t=ZS-98DUrsnRQvc\n\nOn est ensemble !`;
    }
    if (q.includes('bonjour') || q.includes('salut') || q.includes('coucou') || q.includes('c\'est comment')) {
      return `Salut ${callout} ! On est ensemble. Pose-moi directement ta question ou exprime ton besoin, je te réponds avec précision et clarté !`;
    }
    if (q.includes('fatigué') || q.includes('triste') || q.includes('dur') || q.includes('stress')) {
      return `Je t'écoute avec attention, ${callout}. Explique-moi ce qui t'arrive ou la difficulté que tu rencontres, et on regarde tout de suite les solutions concrètes ensemble.`;
    }
    return `On est ensemble, ${callout} ! J'ai bien reçu ta demande : « ${queryText} ». Je suis à ton entière disposition pour t'apporter des détails précis, une démarche étape par étape ou un conseil adapté.`;
  };

  if (!isOpen) return null;

  // Filtered saved conversations for history list
  const filteredConversations = savedConversations.filter(c => {
    if (!historySearch.trim()) return true;
    const q = historySearch.toLowerCase();
    return (
      c.title.toLowerCase().includes(q) ||
      c.preview.toLowerCase().includes(q) ||
      c.messages.some(m => m.text.toLowerCase().includes(q))
    );
  });

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex justify-end bg-slate-950/60 backdrop-blur-xs animate-fadeIn">
      <div className="w-full sm:max-w-md md:max-w-lg bg-white h-full shadow-2xl flex flex-col border-l border-slate-200">
        
        {/* Main Drawer Header */}
        <div className="bg-slate-900 text-white p-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="relative">
              <img
                src={avatarSrc}
                alt="Assistant Emris"
                className="w-10 h-10 rounded-full object-cover border-2 border-cyan-400"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
              <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 border-2 border-slate-900" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="font-bold text-sm text-white">Emris le Compagnon</h3>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 font-semibold">En direct</span>
              </div>
              <p className="text-[11px] text-slate-400">Sage, psychologue complice & soutien Wave</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Gender Toggle */}
            <div className="bg-slate-800 rounded-lg p-0.5 flex text-[10px] font-bold border border-slate-700">
              <button
                onClick={() => setAvatarGender('male')}
                className={`px-1.5 py-0.5 rounded cursor-pointer transition-colors ${avatarGender === 'male' ? 'bg-cyan-500 text-slate-950' : 'text-slate-400 hover:text-white'}`}
                title="Avatar masculin"
              >
                👦
              </button>
              <button
                onClick={() => setAvatarGender('female')}
                className={`px-1.5 py-0.5 rounded cursor-pointer transition-colors ${avatarGender === 'female' ? 'bg-cyan-500 text-slate-950' : 'text-slate-400 hover:text-white'}`}
                title="Avatar féminin"
              >
                👧
              </button>
            </div>

            {/* History Toggle Button */}
            <button
              onClick={() => {
                setShowHistory(prev => !prev);
                setConfirmClearAll(false);
              }}
              className={`relative p-1.5 rounded-lg transition-colors cursor-pointer ${
                showHistory
                  ? 'bg-cyan-500 text-slate-950 font-bold shadow-xs'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
              title="Historique des conversations sauvegardées localement"
            >
              <History className="w-5 h-5" />
              {savedConversations.length > 0 && !showHistory && (
                <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 rounded-full bg-cyan-400 text-slate-950 text-[9px] font-black flex items-center justify-center shadow-xs">
                  {savedConversations.length}
                </span>
              )}
            </button>

            {/* Close Drawer Button */}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              title="Fermer le tiroir"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ================================================================ */}
        {/* VIEW 1: HISTORY DRAWER VIEW                                      */}
        {/* ================================================================ */}
        {showHistory ? (
          <div className="flex-1 flex flex-col bg-slate-50 overflow-hidden">
            {/* History View Sub-header */}
            <div className="p-3.5 bg-white border-b border-slate-200 flex items-center justify-between gap-2 shadow-xs">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowHistory(false)}
                  className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer flex items-center gap-1 text-xs font-semibold"
                  title="Revenir à la conversation active"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Retour au chat</span>
                </button>
              </div>

              <button
                onClick={handleStartNewChat}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs shadow-xs transition-all cursor-pointer"
                title="Démarrer une nouvelle discussion"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Nouveau</span>
              </button>
            </div>

            {/* History Search Bar & Info */}
            <div className="p-3 bg-white border-b border-slate-100 space-y-2">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={historySearch}
                  onChange={(e) => setHistorySearch(e.target.value)}
                  placeholder="Rechercher dans vos échanges passés..."
                  className="w-full pl-9 pr-8 py-1.5 text-xs bg-slate-100 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500 text-slate-900"
                />
                {historySearch && (
                  <button
                    onClick={() => setHistorySearch('')}
                    className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600 text-xs cursor-pointer"
                  >
                    ×
                  </button>
                )}
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-500 px-1">
                <div className="flex items-center gap-1.5 text-cyan-800 font-medium">
                  <HardDrive className="w-3 h-3 text-cyan-600" />
                  <span>Sauvegardé localement ({savedConversations.length})</span>
                </div>
                {savedConversations.length > 0 && (
                  confirmClearAll ? (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={handleClearAllHistory}
                        className="text-rose-600 hover:text-rose-700 font-bold underline cursor-pointer"
                      >
                        Confirmer ?
                      </button>
                      <button
                        onClick={() => setConfirmClearAll(false)}
                        className="text-slate-400 hover:text-slate-600 cursor-pointer ml-1"
                      >
                        Annuler
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmClearAll(true)}
                      className="text-slate-400 hover:text-rose-600 flex items-center gap-1 transition-colors cursor-pointer"
                      title="Effacer tout l'historique local"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Tout effacer</span>
                    </button>
                  )
                )}
              </div>
            </div>

            {/* Conversations List */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
              {filteredConversations.length === 0 ? (
                <div className="text-center py-12 px-4 bg-white rounded-2xl border border-dashed border-slate-300 my-4">
                  <div className="w-12 h-12 rounded-full bg-cyan-50 text-cyan-600 flex items-center justify-center mx-auto mb-3">
                    <History className="w-6 h-6" />
                  </div>
                  <h4 className="font-bold text-sm text-slate-800 mb-1">
                    {historySearch ? 'Aucun résultat trouvé' : 'Aucun échange sauvegardé'}
                  </h4>
                  <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed mb-4">
                    {historySearch 
                      ? `Aucune conversation ne correspond à « ${historySearch} ». Essayez un autre mot-clé.`
                      : "Discutez avec Emris dans le tiroir. Tous vos messages et réponses seront automatiquement conservés ici sur votre appareil !"}
                  </p>
                  <button
                    onClick={handleStartNewChat}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Démarrer une conversation</span>
                  </button>
                </div>
              ) : (
                filteredConversations.map((conv) => {
                  const isActive = conv.id === currentSession?.id;
                  const isCopied = copiedSessionId === conv.id;

                  return (
                    <div
                      key={conv.id}
                      onClick={() => handleSelectSession(conv)}
                      className={`group p-3.5 rounded-2xl border transition-all cursor-pointer relative ${
                        isActive
                          ? 'bg-cyan-50/60 border-cyan-400 ring-2 ring-cyan-400/20 shadow-xs'
                          : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-xs'
                      }`}
                    >
                      {/* Top row of card */}
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <div className="flex items-center gap-1.5 flex-1 min-w-0">
                          <MessageSquare className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-cyan-600' : 'text-slate-400'}`} />
                          <h4 className="font-bold text-xs text-slate-900 truncate">
                            {conv.title}
                          </h4>
                        </div>
                        {isActive && (
                          <span className="shrink-0 px-2 py-0.5 rounded-full bg-cyan-500 text-slate-950 font-black text-[9px] uppercase tracking-wide">
                            En cours
                          </span>
                        )}
                      </div>

                      {/* Snippet preview */}
                      <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed mb-2.5 font-normal">
                        {conv.preview || 'Discussion enregistrée'}
                      </p>

                      {/* Card Footer: Date, message count and action icons */}
                      <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[11px] text-slate-400">
                        <div className="flex items-center gap-2">
                          <span className="flex items-center gap-1 text-slate-500">
                            <Clock className="w-3 h-3 text-slate-400" />
                            <span>{formatConversationDate(conv.updatedAt)}</span>
                          </span>
                          <span className="text-slate-300">•</span>
                          <span className="font-medium text-slate-500">{conv.messageCount} messages</span>
                        </div>

                        <div className="flex items-center gap-1">
                          {/* Copy button */}
                          <button
                            onClick={(e) => handleCopyTranscript(conv, e)}
                            className="p-1 rounded-md hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                            title="Copier la transcription de cet échange"
                          >
                            {isCopied ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>

                          {/* Delete button */}
                          <button
                            onClick={(e) => handleDeleteSession(conv.id, e)}
                            className="p-1 rounded-md hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                            title="Supprimer cet échange de l'historique"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Bottom info banner in History View */}
            <div className="p-2.5 bg-white border-t border-slate-200 text-center">
              <p className="text-[11px] text-slate-500">
                🔒 Vos conversations restent privées et stockées uniquement sur votre navigateur.
              </p>
            </div>
          </div>
        ) : (
          /* ================================================================ */
          /* VIEW 2: NORMAL ACTIVE CHAT VIEW                                 */
          /* ================================================================ */
          <div className="flex-1 flex flex-col overflow-hidden">
            
            {/* Conversation Session Header Bar */}
            <div className="bg-slate-100/80 border-b border-slate-200/80 px-3.5 py-2 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 min-w-0">
                <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                <span className="font-semibold text-slate-800 truncate text-[11px]">
                  {currentSession?.title || 'Échange avec Emris'}
                </span>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={handleStartNewChat}
                  className="px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-[11px] font-medium flex items-center gap-1 transition-colors cursor-pointer"
                  title="Ouvrir une nouvelle discussion sans effacer les précédentes"
                >
                  <Plus className="w-3 h-3 text-cyan-600" />
                  <span>Nouveau</span>
                </button>
                <button
                  onClick={() => setShowHistory(true)}
                  className="px-2 py-0.5 rounded-md bg-cyan-50 border border-cyan-200 text-cyan-800 hover:bg-cyan-100 text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
                  title="Voir tous les précédents échanges"
                >
                  <History className="w-3 h-3 text-cyan-600" />
                  <span>Historique ({savedConversations.length})</span>
                </button>
              </div>
            </div>

            {/* Status Callout if request is active */}
            {subscriptionRequest && (
              <div className="bg-amber-50 border-b border-amber-200/80 px-4 py-2.5 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-amber-800">
                  <Clock className="w-4 h-4 text-amber-600 animate-spin" />
                  <span>Statut : <strong className="font-bold text-amber-900">{subscriptionRequest.isTrial ? 'Essai 7 Jours' : 'En attente Wave'}</strong></span>
                </div>
                <span className="font-mono-numbers font-semibold text-amber-900">
                  {subscriptionRequest.isTrial ? 'Gratuit (7j)' : `${FORMAT_FCFA(subscriptionRequest.amount)}`}
                </span>
              </div>
            )}

            {/* Messages Container */}
            <div className="flex-1 min-h-0 overflow-y-auto chat-scroll overscroll-contain p-4 space-y-3.5 bg-slate-50/50">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-xs ${
                      msg.sender === 'user'
                        ? 'bg-gradient-to-r from-sky-600 to-blue-600 text-white rounded-br-none'
                        : 'bg-white text-slate-800 border border-slate-200/70 rounded-bl-none'
                    }`}
                  >
                    <p className="whitespace-pre-line">{msg.text}</p>
                    {msg.action && (
                      <div className="mt-3 pt-2.5 border-t border-slate-100">
                        <button
                          onClick={() => {
                            if (msg.action?.type === 'whatsapp' || onGoToWhatsApp) {
                              onGoToWhatsApp();
                            }
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition-colors cursor-pointer"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                          <span>{msg.action.label}</span>
                        </button>
                      </div>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1 px-1 font-mono-numbers">
                    {msg.time}
                  </span>
                </div>
              ))}

              {isLoading && (
                <div className="flex items-center gap-2 text-xs text-slate-500 italic p-2 bg-white rounded-xl border border-slate-200/60 w-fit">
                  <span className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse" />
                  <span>Emris réfléchit avec sagesse et bienveillance...</span>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Quick Suggestion Chips */}
            <div className="p-2.5 bg-white border-t border-slate-100 flex items-center gap-1.5 overflow-x-auto text-xs text-slate-600 no-scrollbar">
              <span className="text-[11px] text-slate-400 shrink-0 font-medium pl-1">Exemples :</span>
              <button
                onClick={() => handleSend("M-Ris, informe sur les 7 jours d'utilisation gratuit de l'application « M-Ris le compagnon virtuel » avant de passer à l'abonnement mensuel et donne le lien de l'application.")}
                className="shrink-0 px-2.5 py-1 rounded-full bg-sky-50 hover:bg-sky-100 text-sky-900 text-xs transition-colors cursor-pointer font-bold border border-sky-200"
              >
                🎁 7 Jours Gratuits & Abonnement
              </button>
              <button
                onClick={() => handleSend("Donne-moi mes liens officiels exclusifs (Application M-Ris, WhatsApp f3, TikTok et Wave Business Béni Amar).")}
                className="shrink-0 px-2.5 py-1 rounded-full bg-amber-50 hover:bg-amber-100 text-amber-900 text-xs transition-colors cursor-pointer font-bold border border-amber-200"
              >
                🔐 Liens Officiels M-Ris
              </button>
              <button
                onClick={() => handleSend("Donne-moi mon lien Wave Business officiel pour Béni Amar avec la formule exacte.")}
                className="shrink-0 px-2.5 py-1 rounded-full bg-cyan-50 hover:bg-cyan-100 text-cyan-800 text-xs transition-colors cursor-pointer font-medium"
              >
                🌊 Lien Wave Business
              </button>
              <button
                onClick={() => handleSend("Donne-moi mon lien WhatsApp officiel f3 pour échanger avec mes prospects.")}
                className="shrink-0 px-2.5 py-1 rounded-full bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs transition-colors cursor-pointer font-medium"
              >
                📲 WhatsApp f3
              </button>
              <button
                onClick={() => handleSend("Donne-moi mon lien TikTok officiel @tisanebeniamar1.")}
                className="shrink-0 px-2.5 py-1 rounded-full bg-pink-50 hover:bg-pink-100 text-pink-800 text-xs transition-colors cursor-pointer font-medium"
              >
                🎵 TikTok Officiel
              </button>
              <button
                onClick={() => handleSend("Rédige un message de closing avec mon lien Wave pour convertir un prospect hésitant.")}
                className="shrink-0 px-2.5 py-1 rounded-full bg-purple-50 hover:bg-purple-100 text-purple-800 text-xs transition-colors cursor-pointer font-medium"
              >
                🎯 Closing Prospect
              </button>
            </div>

            {/* Input box */}
            <div className="shrink-0 p-3 bg-white border-t border-slate-200 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSend();
                }}
                className="flex items-center gap-2"
              >
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Écris à Emris, ton ami sûr..."
                  className="flex-1 px-3.5 py-2 text-sm bg-slate-100 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-900"
                />
                <button
                  type="submit"
                  disabled={!inputText.trim() || isLoading}
                  className="p-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>

          </div>
        )}

      </div>
    </div>
  );
};
