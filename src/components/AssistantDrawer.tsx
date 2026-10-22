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
import { getAntiRepetitiveGreeting, generateConcreteEmrisReply, generateConcreteEmrisReplyWithResearch } from '../utils/emrisConcreteBrain';
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
  VolumeX,
  Mic,
  MicOff,
  History,
  Trash2,
  Plus,
  Search,
  ArrowLeft,
  Copy,
  Check,
  RotateCcw,
  MessageSquare,
  HardDrive,
  Brain,
  ShieldCheck,
  ChevronDown,
  ChevronUp
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

  // Dynamic interactive copy-to-clipboard state
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const [copiedChatAll, setCopiedChatAll] = useState(false);
  const [copyToast, setCopyToast] = useState<string | null>(null);

  // Voice Synthesis (TTS) & Speech Recognition (STT)
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  const isListeningRef = useRef(false);
  const recognitionRef = useRef<any>(null);

  // Active conversation & messages
  const [currentSession, setCurrentSession] = useState<DrawerConversationSession | null>(null);
  const [messages, setMessages] = useState<DrawerChatMessage[]>([]);
  const [savedConversations, setSavedConversations] = useState<DrawerConversationSession[]>([]);

  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [thinkingStep, setThinkingStep] = useState(0);
  const [expandedReflectionIds, setExpandedReflectionIds] = useState<Record<string, boolean>>({});
  const [avatarGender, setAvatarGender] = useState<'male' | 'female'>('male');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const toggleReflection = (id: string) => {
    setExpandedReflectionIds(prev => ({ ...prev, [id]: !prev[id] }));
  };

  useEffect(() => {
    let timer: any;
    if (isLoading) {
      setThinkingStep(0);
      const s1 = setTimeout(() => setThinkingStep(1), 750);
      const s2 = setTimeout(() => setThinkingStep(2), 1900);
      const s3 = setTimeout(() => setThinkingStep(3), 3100);
      timer = () => {
        clearTimeout(s1);
        clearTimeout(s2);
        clearTimeout(s3);
      };
    } else {
      setThinkingStep(0);
    }
    return () => {
      if (timer) timer();
    };
  }, [isLoading]);

  const avatarSrc = avatarGender === 'male' ? avatarMaleImg : avatarFemaleImg;

  // Build default welcome messages based on user state with guaranteed non-repetitive greetings
  const buildWelcomeMessages = (forceDynamicGreeting = false): DrawerChatMessage[] => {
    const timeStr = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    const dynamicGreeting = getAntiRepetitiveGreeting(subscriptionRequest?.userName, avatarGender);

    return [
      {
        id: 'msg-dynamic-' + Date.now(),
        sender: 'mris',
        text: dynamicGreeting,
        time: timeStr
      }
    ];
  };

  // Initialize conversations from localStorage on mount or when drawer opens
  useEffect(() => {
    if (!isOpen) {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch {}
      }
      setSpeakingMessageId(null);
      setIsListening(false);
      return;
    }

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

  // Start a fresh new chat session with guaranteed non-repetitive greeting
  const handleStartNewChat = () => {
    const welcomeMsgs = buildWelcomeMessages(true);
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

  // Robust clipboard copy with fallback
  const copyToClipboard = async (text: string): Promise<boolean> => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        return true;
      }
    } catch (err) {
      console.warn('Clipboard API error, fallback triggered:', err);
    }

    try {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      textArea.setAttribute('readonly', '');
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      const success = document.execCommand('copy');
      document.body.removeChild(textArea);
      return success;
    } catch (fallbackErr) {
      console.error('Copy fallback failed:', fallbackErr);
      return false;
    }
  };

  // Copy individual message text to clipboard with dynamic interactive feedback
  const handleCopyMessage = async (msgId: string, text: string) => {
    const success = await copyToClipboard(text);
    if (success) {
      setCopiedMessageId(msgId);
      setCopyToast('Texte copié dans le presse-papier !');
      setTimeout(() => {
        setCopiedMessageId((prev) => (prev === msgId ? null : prev));
      }, 2200);
      setTimeout(() => {
        setCopyToast((prev) => (prev === 'Texte copié dans le presse-papier !' ? null : prev));
      }, 2500);
    }
  };

  // Copy entire active chat conversation
  const handleCopyCurrentChat = async () => {
    if (messages.length === 0) return;
    const title = currentSession?.title || 'Échange avec Emris';
    const transcript = messages.map(m => {
      const senderName = m.sender === 'user' ? 'Vous' : 'Emris';
      return `[${m.time}] ${senderName} :\n${m.text}\n`;
    }).join('\n');

    const fullTranscript = `=== CONVERSATION EMRIS : ${title} ===\nDate : ${new Date().toLocaleDateString('fr-FR')}\n\n${transcript}`;
    const success = await copyToClipboard(fullTranscript);
    if (success) {
      setCopiedChatAll(true);
      setCopyToast('Discussion complète copiée !');
      setTimeout(() => setCopiedChatAll(false), 2200);
      setTimeout(() => {
        setCopyToast((prev) => (prev === 'Discussion complète copiée !' ? null : prev));
      }, 2500);
    }
  };

  // Copy whole conversation transcript to clipboard
  const handleCopyTranscript = async (session: DrawerConversationSession, e: React.MouseEvent) => {
    e.stopPropagation();
    const transcript = session.messages.map(m => {
      const role = m.sender === 'user' ? 'Vous' : 'M-Ris';
      return `[${m.time}] ${role} :\n${m.text}\n`;
    }).join('\n');

    await copyToClipboard(`=== HISTORIQUE M-RIS : ${session.title} ===\nDate : ${session.createdAt}\n\n${transcript}`);
    setCopiedSessionId(session.id);
    setTimeout(() => setCopiedSessionId(null), 2000);
  };

  // Voice Synthesis (TTS) using Web Speech API window.speechSynthesis
  const speakText = (text: string, msgId?: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      setCopyToast("La synthèse vocale n'est pas supportée par ce navigateur.");
      setTimeout(() => setCopyToast(null), 3000);
      return;
    }

    if (speakingMessageId === msgId && window.speechSynthesis.speaking) {
      try { window.speechSynthesis.cancel(); } catch {}
      setSpeakingMessageId(null);
      return;
    }

    try {
      window.speechSynthesis.cancel();
    } catch {}

    let cleanText = text
      .replace(/https?:\/\/[^\s]+/g, 'le lien')
      .replace(/[*_#`~[\]()]/g, ' ')
      .replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]/g, '')
      .replace(/\s+/g, ' ')
      .trim();

    if (!cleanText) return;

    setTimeout(() => {
      try {
        const utterance = new SpeechSynthesisUtterance(cleanText);
        (window as any)._activeUtteranceDrawer = utterance;
        utterance.lang = 'fr-FR';
        utterance.rate = 1.0;
        utterance.pitch = 1.0;

        try {
          const voices = window.speechSynthesis.getVoices();
          if (voices && voices.length > 0) {
            const frVoice = voices.find(v => v.lang && (v.lang === 'fr-FR' || v.lang.toLowerCase().startsWith('fr')));
            if (frVoice) {
              utterance.voice = frVoice;
            }
          }
        } catch {}

        utterance.onstart = () => {
          setSpeakingMessageId(msgId || 'active');
        };

        utterance.onend = () => {
          setSpeakingMessageId(null);
        };

        utterance.onerror = (e) => {
          setSpeakingMessageId(null);
          if (e.error !== 'interrupted' && e.error !== 'canceled') {
            console.warn('Speech synthesis error in drawer:', e.error);
          }
        };

        if (window.speechSynthesis.paused) {
          window.speechSynthesis.resume();
        }

        window.speechSynthesis.speak(utterance);
      } catch (err) {
        console.error('Failed to speak text in drawer:', err);
        setSpeakingMessageId(null);
      }
    }, 60);
  };

  // Arrêt strict de la dictée vocale
  const stopVoiceDictation = () => {
    isListeningRef.current = false;
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch {}
      try { recognitionRef.current.abort(); } catch {}
    }
    setIsListening(false);
  };

  // Speech Recognition (STT) direct et synchrone
  const startVoiceDictation = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      setCopyToast(isMobile
        ? "Ce navigateur ne supporte pas le micro. Ouvrez le site dans Chrome ou Safari !"
        : "La reconnaissance vocale nécessite Google Chrome, Safari ou Microsoft Edge.");
      setTimeout(() => setCopyToast(null), 5000);
      return;
    }

    if (isListeningRef.current) {
      stopVoiceDictation();
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;
      recognition.lang = 'fr-FR';
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        isListeningRef.current = true;
        setIsListening(true);
        setCopyToast("🎙️ Micro actif ! Parlez clairement...");
        setTimeout(() => setCopyToast(null), 2500);
      };

      recognition.onresult = (event: any) => {
        if (!isListeningRef.current) return;
        let transcript = '';
        for (let i = 0; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        if (transcript) {
          setInputText(transcript);
        }
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition error:', event.error);
        stopVoiceDictation();
        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
          setCopyToast("Accès au microphone refusé. Autorisez le micro dans les paramètres du navigateur.");
        } else if (event.error === 'no-speech') {
          setCopyToast("Aucune parole détectée. Rapprochez-vous du micro et réessayez.");
        } else if (event.error !== 'aborted') {
          setCopyToast("Dictée interrompue (" + event.error + ")");
        }
        setTimeout(() => setCopyToast(null), 3500);
      };

      recognition.onend = () => {
        isListeningRef.current = false;
        setIsListening(false);
      };

      recognition.start();
    } catch (err) {
      console.error('Recognition start failed:', err);
      stopVoiceDictation();
      setCopyToast("Impossible de démarrer le micro.");
      setTimeout(() => setCopyToast(null), 3000);
    }
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
      const timeoutId = setTimeout(() => controller.abort(), 30000);

      const response = await fetch('/api/mris/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          message: textToSend,
          gender: avatarGender,
          mood: 'Bien',
          history: newMessages.slice(-6),
          appUrl: window.location.origin,
          userName: subscriptionRequest?.userName
        })
      });
      clearTimeout(timeoutId);

      if (!response.ok) throw new Error('Erreur réseau');
      const data = await response.json();
      const localResearched = generateConcreteEmrisReplyWithResearch({
        message: textToSend,
        gender: avatarGender,
        userName: subscriptionRequest?.userName,
        appUrl: window.location.origin
      });

      const botReply: DrawerChatMessage = {
        id: 'bot-' + Date.now(),
        sender: 'mris',
        text: data.reply || localResearched.reply,
        time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
        reflection: data.reflection || localResearched.reflection,
        researchSources: data.researchSources || localResearched.researchSources,
        isResearched: true
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
      const localResearched = generateConcreteEmrisReplyWithResearch({
        message: textToSend,
        gender: avatarGender,
        userName: subscriptionRequest?.userName,
        appUrl: typeof window !== 'undefined' ? window.location.origin : undefined
      });
      const botReply: DrawerChatMessage = {
        id: 'bot-' + Date.now(),
        sender: 'mris',
        text: localResearched.reply,
        time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
        reflection: localResearched.reflection,
        researchSources: localResearched.researchSources,
        isResearched: true
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
    return generateConcreteEmrisReply({
      message: queryText,
      gender,
      userName: subscriptionRequest?.userName,
      appUrl: typeof window !== 'undefined' ? window.location.origin : undefined
    });
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
            {/* Emris Avatar with breathing animation and responsive glow */}
            <div className="relative flex items-center justify-center">
              {/* Subtle ambient breathing halo ring */}
              <div 
                className={`absolute -inset-1 rounded-full bg-cyan-400/25 blur-xs transition-all pointer-events-none ${
                  isLoading ? 'animate-avatar-thinking' : 'animate-avatar-ring'
                }`}
                aria-hidden="true"
              />
              
              <img
                src={avatarSrc}
                alt="Assistant Emris"
                className={`relative w-10 h-10 rounded-full object-cover border-2 border-cyan-400 shadow-sm transition-all ${
                  isLoading ? 'animate-avatar-thinking' : 'animate-avatar-breathe'
                }`}
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
              
              {/* Responsive live status beacon */}
              <span 
                className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-slate-900 transition-colors ${
                  isLoading ? 'bg-cyan-400 animate-ping' : 'bg-emerald-500'
                }`} 
              />
              <span 
                className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-slate-900 ${
                  isLoading ? 'bg-cyan-400' : 'bg-emerald-500'
                }`} 
                title={isLoading ? 'Emris est en train de répondre...' : 'Emris est en direct et disponible'}
              />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="font-bold text-sm text-white">Emris le Compagnon</h3>
                <span className={`text-[10px] px-1.5 py-0.2 rounded font-semibold transition-colors ${
                  isLoading ? 'bg-cyan-500/30 text-cyan-200 animate-pulse' : 'bg-cyan-500/20 text-cyan-300'
                }`}>
                  {isLoading ? 'Réfléchit...' : 'En direct'}
                </span>
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
          <div className="flex-1 flex flex-col overflow-hidden relative">
            
            {/* Dynamic Interactive Copy Floating Toast Notification */}
            {copyToast && (
              <div className="pointer-events-none absolute top-12 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-3.5 py-1.5 bg-slate-900/95 text-white rounded-full shadow-xl border border-cyan-400/40 text-xs font-semibold animate-fadeIn backdrop-blur-xs">
                <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>{copyToast}</span>
              </div>
            )}

            {/* Conversation Session Header Bar */}
            <div className="bg-slate-100/80 border-b border-slate-200/80 px-3.5 py-2 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 min-w-0">
                <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                <span className="font-semibold text-slate-800 truncate text-[11px]">
                  {currentSession?.title || 'Échange avec Emris'}
                </span>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                {/* Dynamic Button: Copy Entire Conversation */}
                <button
                  onClick={handleCopyCurrentChat}
                  className={`px-2 py-0.5 rounded-md border text-[11px] font-medium flex items-center gap-1 transition-all cursor-pointer ${
                    copiedChatAll
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-700 font-bold scale-105'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                  title="Copier toute la discussion en cours dans le presse-papier"
                >
                  {copiedChatAll ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-600" />
                      <span>Copié !</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3 text-cyan-600" />
                      <span>Copier tout</span>
                    </>
                  )}
                </button>

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
                  className={`flex gap-2.5 ${msg.sender === 'user' ? 'justify-end' : 'justify-start items-start'}`}
                >
                  {msg.sender === 'mris' && (
                    <div className="relative shrink-0 pt-0.5" title="Emris le Compagnon">
                      <img
                        src={avatarSrc}
                        alt="Emris"
                        className="w-7 h-7 rounded-full object-cover border border-cyan-400 animate-avatar-breathe shadow-xs"
                      />
                      <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-500 border border-white" />
                    </div>
                  )}
                  <div className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'} max-w-[85%]`}>
                    <div
                      className={`relative w-full rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-xs transition-all ${
                        msg.sender === 'user'
                          ? 'bg-gradient-to-r from-sky-600 to-blue-600 text-white rounded-br-none'
                          : 'bg-white text-slate-800 border border-slate-200/70 rounded-tl-none hover:border-slate-300'
                      }`}
                    >
                      <p className="whitespace-pre-line">{msg.text}</p>
                      
                      {/* Instant de réflexion & Recherches factuelles menées par Emris */}
                      {msg.sender === 'mris' && (msg.reflection || (msg.researchSources && msg.researchSources.length > 0)) && (
                        <div className="mt-2.5 pt-2 border-t border-slate-100">
                          <button
                            onClick={() => toggleReflection(msg.id)}
                            className="w-full flex items-center justify-between gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 hover:bg-slate-100 text-[10px] font-semibold text-cyan-800 border border-cyan-200 transition-all cursor-pointer group"
                            title="Consulter l'instant de réflexion et les recherches factuelles d'Emris"
                          >
                            <div className="flex items-center gap-1.5 min-w-0">
                              <Brain className="w-3 h-3 text-cyan-600 shrink-0 group-hover:rotate-12 transition-transform" />
                              <span className="truncate">Réflexion & Recherches</span>
                              <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 font-bold shrink-0">
                                ✨ Sans imaginer
                              </span>
                            </div>
                            {expandedReflectionIds[msg.id] ? (
                              <ChevronUp className="w-3 h-3 text-slate-400 shrink-0" />
                            ) : (
                              <ChevronDown className="w-3 h-3 text-slate-400 shrink-0" />
                            )}
                          </button>

                          {expandedReflectionIds[msg.id] && (
                            <div className="mt-2 p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs space-y-2 animate-fadeIn text-left">
                              {msg.reflection && (
                                <div>
                                  <div className="text-[9px] font-bold uppercase tracking-wider text-cyan-700 mb-0.5 flex items-center gap-1">
                                    <Brain className="w-2.5 h-2.5 text-cyan-600" />
                                    <span>Réflexion préalable :</span>
                                  </div>
                                  <p className="text-slate-600 text-[11px] leading-relaxed italic bg-white p-1.5 rounded border border-slate-200/80">
                                    "{msg.reflection}"
                                  </p>
                                </div>
                              )}

                              {msg.researchSources && msg.researchSources.length > 0 && (
                                <div>
                                  <div className="text-[9px] font-bold uppercase tracking-wider text-emerald-700 mb-0.5 flex items-center gap-1">
                                    <Search className="w-2.5 h-2.5 text-emerald-600" />
                                    <span>Repères de terrain vérifiés :</span>
                                  </div>
                                  <ul className="space-y-1">
                                    {msg.researchSources.map((source, sIdx) => (
                                      <li key={sIdx} className="text-slate-600 text-[10px] flex items-start gap-1">
                                        <span className="text-emerald-600 font-bold">•</span>
                                        <span>{source}</span>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}

                              <div className="pt-1.5 border-t border-slate-200 flex items-center gap-1 text-[9px] text-slate-500 font-medium">
                                <ShieldCheck className="w-3 h-3 text-emerald-600 shrink-0" />
                                <span>Garantie : Zéro invention, ancrage réel vérifié.</span>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Action buttons embedded in message */}
                      {(msg.action || msg.text.includes('pay.wave.com')) && (
                        <div className="mt-3 pt-2.5 border-t border-slate-100 flex flex-wrap items-center gap-2">
                          {msg.action && (
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
                          )}

                          {msg.text.includes('pay.wave.com') && (
                            <button
                              onClick={() => handleCopyMessage('wave-url-' + msg.id, 'https://pay.wave.com/m/M_ci_Xs2kjjsivE5V/c/ci/')}
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer border ${
                                copiedMessageId === 'wave-url-' + msg.id
                                  ? 'bg-emerald-50 border-emerald-300 text-emerald-700 font-bold'
                                  : 'bg-sky-50 hover:bg-sky-100 text-sky-800 border-sky-200'
                              }`}
                              title="Copier le lien Wave officiel"
                            >
                              {copiedMessageId === 'wave-url-' + msg.id ? (
                                <>
                                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                                  <span>Lien Wave copié !</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3.5 h-3.5 text-sky-600" />
                                  <span>Copier le lien Wave</span>
                                </>
                              )}
                            </button>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Message Footer: Timestamp, Speaker Button & Interactive Dynamic Copy Button */}
                    <div className="flex items-center gap-1.5 mt-1 px-1">
                      <span className="text-[10px] text-slate-400 font-mono-numbers">
                        {msg.time}
                      </span>
                      <span className="text-slate-300 text-[10px]">•</span>

                      {/* Small speaker button (Haut-parleur) */}
                      <button
                        onClick={() => speakText(msg.text, msg.id)}
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium transition-all cursor-pointer ${
                          speakingMessageId === msg.id
                            ? 'bg-cyan-100 text-cyan-800 border border-cyan-300 font-bold shadow-xs scale-105'
                            : 'text-slate-400 hover:text-cyan-700 hover:bg-slate-200/60'
                        }`}
                        title={speakingMessageId === msg.id ? "Arrêter la lecture" : "Écouter ce message à haute voix"}
                        aria-label="Lecture vocale du message"
                      >
                        {speakingMessageId === msg.id ? (
                          <>
                            <VolumeX className="w-3.5 h-3.5 text-cyan-700 animate-pulse" />
                            <span className="text-cyan-700">Lecture...</span>
                          </>
                        ) : (
                          <>
                            <Volume2 className="w-3.5 h-3.5 text-slate-400" />
                            <span>Écouter</span>
                          </>
                        )}
                      </button>

                      <span className="text-slate-300 text-[10px]">•</span>
                      
                      {/* Dynamic Interactive Clickable Copy Button */}
                      <button
                        onClick={() => handleCopyMessage(msg.id, msg.text)}
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium transition-all cursor-pointer ${
                          copiedMessageId === msg.id
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-300 font-bold scale-105 shadow-xs'
                            : 'text-slate-400 hover:text-slate-800 hover:bg-slate-200/60'
                        }`}
                        title="Copier ce message dans le presse-papier"
                        aria-label="Copier le message dans le presse-papier"
                      >
                        {copiedMessageId === msg.id ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
                            <span className="text-emerald-700">Copié !</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5 text-slate-400 hover:text-cyan-600" />
                            <span>Copier</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="p-3 bg-white rounded-2xl border border-cyan-400/40 shadow-md space-y-2.5 max-w-[92%] animate-fadeIn">
                  <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2">
                    <div className="flex items-center gap-1.5">
                      <div className="relative shrink-0">
                        <img
                          src={avatarSrc}
                          alt="Emris en réflexion"
                          className="w-6 h-6 rounded-full object-cover border border-cyan-400 animate-avatar-thinking"
                        />
                        <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                      </div>
                      <span className="font-bold text-xs text-slate-800">Instant de réflexion & Recherches</span>
                    </div>
                    <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-cyan-50 text-cyan-800 border border-cyan-200">
                      Étape {thinkingStep + 1}/4
                    </span>
                  </div>

                  <div className="space-y-1.5 text-[11px]">
                    <div className={`flex items-start gap-1.5 ${thinkingStep >= 0 ? 'text-slate-800 font-semibold' : 'text-slate-400'}`}>
                      {thinkingStep > 0 ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                      ) : (
                        <span className="w-3 h-3 rounded-full border-2 border-cyan-500 border-t-transparent animate-spin inline-block shrink-0 mt-0.5" />
                      )}
                      <span>1. Analyse méthodique de votre demande</span>
                    </div>

                    <div className={`flex items-start gap-1.5 ${thinkingStep >= 1 ? 'text-slate-800 font-semibold' : 'text-slate-400'}`}>
                      {thinkingStep > 1 ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                      ) : thinkingStep === 1 ? (
                        <span className="w-3 h-3 rounded-full border-2 border-cyan-500 border-t-transparent animate-spin inline-block shrink-0 mt-0.5" />
                      ) : (
                        <span className="w-3 h-3 rounded-full border border-slate-300 inline-block shrink-0 mt-0.5" />
                      )}
                      <span>2. Recherches factuelles & repères de terrain</span>
                    </div>

                    <div className={`flex items-start gap-1.5 ${thinkingStep >= 2 ? 'text-slate-800 font-semibold' : 'text-slate-400'}`}>
                      {thinkingStep > 2 ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                      ) : thinkingStep === 2 ? (
                        <span className="w-3 h-3 rounded-full border-2 border-cyan-500 border-t-transparent animate-spin inline-block shrink-0 mt-0.5" />
                      ) : (
                        <span className="w-3 h-3 rounded-full border border-slate-300 inline-block shrink-0 mt-0.5" />
                      )}
                      <span>3. Filtre de rigueur (validation sans imaginer)</span>
                    </div>

                    <div className={`flex items-start gap-1.5 ${thinkingStep >= 3 ? 'text-slate-800 font-semibold' : 'text-slate-400'}`}>
                      {thinkingStep >= 3 ? (
                        <span className="w-3 h-3 rounded-full border-2 border-cyan-500 border-t-transparent animate-spin inline-block shrink-0 mt-0.5" />
                      ) : (
                        <span className="w-3 h-3 rounded-full border border-slate-300 inline-block shrink-0 mt-0.5" />
                      )}
                      <span>4. Synthèse concrète & directement applicable</span>
                    </div>
                  </div>

                  <div className="w-full bg-slate-100 rounded-full h-1 overflow-hidden">
                    <div 
                      className="bg-gradient-to-r from-cyan-500 to-emerald-500 h-1 transition-all duration-500 rounded-full"
                      style={{ width: `${Math.min(100, (thinkingStep + 1) * 25)}%` }}
                    />
                  </div>
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

            {/* Input box with Microphone Dictation */}
            <div className="shrink-0 p-3 bg-white border-t border-slate-200 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
              {/* Active voice dictation status indicator */}
              {isListening && (
                <div className="mb-2 px-3 py-1.5 rounded-xl bg-gradient-to-r from-rose-50 to-amber-50 border border-rose-200/80 text-rose-700 flex items-center justify-between text-xs animate-fadeIn shadow-xs">
                  <div className="flex items-center gap-2">
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-600" />
                    </span>
                    <span className="font-semibold text-rose-800">Dictée vocale active : parlez naturellement...</span>
                  </div>
                  <button
                    type="button"
                    onClick={startVoiceDictation}
                    className="text-rose-600 hover:text-rose-900 font-bold text-[11px] underline cursor-pointer"
                  >
                    Arrêter
                  </button>
                </div>
              )}

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSend();
                }}
                className="flex items-center gap-2"
              >
                {/* Microphone Button (SpeechRecognition) */}
                <button
                  type="button"
                  onClick={startVoiceDictation}
                  className={`p-2.5 rounded-xl border transition-all cursor-pointer shrink-0 ${
                    isListening
                      ? 'bg-rose-500 border-rose-600 text-white shadow-md shadow-rose-500/30 scale-105 animate-pulse'
                      : 'bg-slate-100 hover:bg-slate-200/80 text-slate-600 hover:text-cyan-700 border-slate-200'
                  }`}
                  title={isListening ? "Arrêter la dictée vocale" : "Dicter ma question au micro (SpeechRecognition)"}
                  aria-label="Reconnaissance vocale par microphone"
                >
                  {isListening ? (
                    <MicOff className="w-4 h-4 text-white" />
                  ) : (
                    <Mic className="w-4 h-4 text-slate-600 hover:text-cyan-600" />
                  )}
                </button>

                <input
                  type="text"
                  value={inputText}
                  onKeyDown={(e) => {
                    if (isListeningRef.current && e.key !== 'Shift' && e.key !== 'Control' && e.key !== 'Alt') {
                      stopVoiceDictation();
                    }
                  }}
                  onChange={(e) => {
                    setInputText(e.target.value);
                  }}
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="sentences"
                  spellCheck={false}
                  data-gramm="false"
                  data-enable-grammarly="false"
                  placeholder={isListening ? "Écoute en direct... Votre parole s'affiche ici" : "Écris ou dicte à Emris, ton ami sûr..."}
                  className={`flex-1 px-3.5 py-2 text-sm font-sans bg-slate-100 border rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-900 transition-all ${
                    isListening ? 'border-rose-300 ring-2 ring-rose-200 bg-rose-50/20' : 'border-slate-200'
                  }`}
                />
                <button
                  type="submit"
                  disabled={!inputText.trim() || isLoading}
                  className="p-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer shrink-0"
                  title="Envoyer le message"
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
