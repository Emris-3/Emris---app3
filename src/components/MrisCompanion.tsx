import React, { useState, useEffect, useRef } from 'react';
import { SubscriptionRequest } from '../types/subscription';
import { SUBSCRIPTION_CONFIG, FORMAT_FCFA } from '../utils/constants';
import avatarMaleImg from '../assets/images/mris_assistant_avatar_1791391815061.jpg';
import avatarFemaleImg from '../assets/images/mris_avatar_female_1791394988073.jpg';
import { 
  Sparkles, 
  Send, 
  Volume2, 
  VolumeX, 
  Smile, 
  Heart, 
  Coffee, 
  RefreshCw, 
  User, 
  Clock, 
  MessageCircle,
  HelpCircle,
  Lightbulb,
  Copy,
  Check,
  Flame,
  Laugh,
  Shield,
  Bot,
  Zap,
  ArrowRight,
  GraduationCap,
  Target,
  ChevronDown,
  Layers,
  X,
  ExternalLink,
  ChevronUp,
  Mic,
  MicOff,
  Brain,
  Search,
  ShieldCheck,
  CheckCircle2,
  Compass
} from 'lucide-react';

interface MrisCompanionProps {
  subscription: SubscriptionRequest;
  onRenew: () => void;
  onOpenReceipt?: () => void;
  onOpenAutonomous?: () => void;
  onOpenLanguages?: () => void;
  onOpenCommercial?: () => void;
}

interface ChatEntry {
  id: string;
  sender: 'mris' | 'user';
  text: string;
  timestamp: string;
  moodTag?: string;
  reflection?: string;
  researchSources?: string[];
  isResearched?: boolean;
}

import { getAntiRepetitiveGreeting, generateConcreteEmrisReply, generateConcreteEmrisReplyWithResearch } from '../utils/emrisConcreteBrain';

// Générateur d'accueils dynamiques anti-répétition garantis
const generateEmrisDynamicGreeting = (userName: string, gender: 'male' | 'female', _mood: string = 'En forme'): string => {
  return getAntiRepetitiveGreeting(userName, gender);
};

export const MrisCompanion: React.FC<MrisCompanionProps> = ({
  subscription,
  onRenew,
  onOpenReceipt,
  onOpenAutonomous,
  onOpenLanguages,
  onOpenCommercial
}) => {
  // Avatar personalization (boy or girl)
  const [avatarGender, setAvatarGender] = useState<'male' | 'female'>('male');
  
  // Mood tracking
  const [currentMood, setCurrentMood] = useState<string>('En forme');
  const [isMoodModalOpen, setIsMoodModalOpen] = useState(false);
  const [isModulesModalOpen, setIsModulesModalOpen] = useState(false);
  const [isWisdomModalOpen, setIsWisdomModalOpen] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);

  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [thinkingStep, setThinkingStep] = useState(0);
  const [expandedReflectionIds, setExpandedReflectionIds] = useState<Record<string, boolean>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [voiceToast, setVoiceToast] = useState<{ message: string; type: 'info' | 'error' | 'success' } | null>(null);
  const isListeningRef = useRef(false);
  const recognitionRef = useRef<any>(null);
  const activeUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const speechKeepAliveRef = useRef<any>(null);
  const [showScrollBottomBtn, setShowScrollBottomBtn] = useState(false);

  // Gestion des étapes de réflexion et recherche d'Emris
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

  const toggleReflection = (id: string) => {
    setExpandedReflectionIds(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Chat conversation avec salutation dynamique non-répétitive
  const [messages, setMessages] = useState<ChatEntry[]>(() => [
    {
      id: 'init-' + Date.now(),
      sender: 'mris',
      text: generateEmrisDynamicGreeting(subscription.userName, 'male', 'En forme'),
      timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    }
  ]);

  // Nouvelle conversation fraîche avec accueil renouvelé
  const handleNewConversation = () => {
    if (messages.length > 1 && !window.confirm('Commencer une nouvelle discussion avec Emris ?')) {
      return;
    }
    const freshGreeting = generateEmrisDynamicGreeting(subscription.userName, avatarGender, currentMood);
    setMessages([
      {
        id: 'msg-' + Date.now(),
        sender: 'mris',
        text: freshGreeting,
        timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
      }
    ]);
    setInputText('');
  };

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Smooth scroll to bottom on new messages
  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior, block: 'end' });
  };

  useEffect(() => {
    scrollToBottom('smooth');
  }, [messages, isLoading]);

  // Pre-load voices on component mount & handle speech cleanup on unmount
  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.getVoices();
        window.speechSynthesis.onvoiceschanged = () => {
          try { window.speechSynthesis.getVoices(); } catch {}
        };
      } catch {}
    }

    return () => {
      if (speechKeepAliveRef.current) clearInterval(speechKeepAliveRef.current);
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        try { window.speechSynthesis.cancel(); } catch {}
      }
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch {}
      }
    };
  }, []);

  // Handle user scroll detection for "Scroll to bottom" button
  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
    const distanceToBottom = scrollHeight - scrollTop - clientHeight;
    setShowScrollBottomBtn(distanceToBottom > 160);
  };

  // Days remaining calculation
  const isTrial = subscription.isTrial || subscription.status === 'trial';
  const now = new Date();
  const defaultDuration = isTrial ? (SUBSCRIPTION_CONFIG.TRIAL_DAYS || 7) : SUBSCRIPTION_CONFIG.DURATION_DAYS;
  const expiryDate = subscription.expiresAt 
    ? new Date(subscription.expiresAt) 
    : new Date(now.getTime() + 1000 * 60 * 60 * 24 * defaultDuration);
  const daysRemaining = Math.max(0, Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));

  const avatarSrc = avatarGender === 'male' ? avatarMaleImg : avatarFemaleImg;
  const avatarName = avatarGender === 'male' ? 'M-Ris (Ton Frère Sûr)' : 'M-Ris (Ta Sœur Complice)';

  // Send message
  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text || isLoading) return;

    const userEntry: ChatEntry = {
      id: 'usr-' + Date.now(),
      sender: 'user',
      text: text,
      timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
      moodTag: currentMood
    };

    setMessages(prev => [...prev, userEntry]);
    setInputText('');
    setIsLoading(true);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);

      const response = await fetch('/api/mris/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          message: text,
          gender: avatarGender,
          mood: currentMood,
          history: messages.slice(-6),
          appUrl: window.location.origin,
          userName: subscription.userName
        })
      });
      clearTimeout(timeoutId);

      const data = await response.json();
      const localResearched = generateConcreteEmrisReplyWithResearch({
        message: text,
        gender: avatarGender,
        userName: subscription.userName,
        mood: currentMood,
        appUrl: window.location.origin
      });
      
      const botEntry: ChatEntry = {
        id: 'bot-' + Date.now(),
        sender: 'mris',
        text: data.reply || localResearched.reply,
        timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
        reflection: data.reflection || localResearched.reflection,
        researchSources: data.researchSources || localResearched.researchSources,
        isResearched: true
      };
      setMessages(prev => [...prev, botEntry]);
    } catch (err) {
      // Direct concrete empathetic fallback avec réflexion préalable et recherches factuelles
      const localResearched = generateConcreteEmrisReplyWithResearch({
        message: text,
        gender: avatarGender,
        userName: subscription.userName,
        mood: currentMood,
        appUrl: typeof window !== 'undefined' ? window.location.origin : undefined
      });
      const botEntry: ChatEntry = {
        id: 'bot-' + Date.now(),
        sender: 'mris',
        text: localResearched.reply,
        timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
        reflection: localResearched.reflection,
        researchSources: localResearched.researchSources,
        isResearched: true
      };
      setMessages(prev => [...prev, botEntry]);
    } finally {
      setIsLoading(false);
    }
  };

  const getLocalFallback = (text: string, gender: 'male' | 'female', mood: string): string => {
    return generateConcreteEmrisReply({
      message: text,
      gender,
      userName: subscription.userName,
      mood,
      appUrl: typeof window !== 'undefined' ? window.location.origin : undefined
    });
  };

  // Arrêt de la dictée vocale
  const stopVoiceDictation = () => {
    isListeningRef.current = false;
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch {}
      try { recognitionRef.current.abort(); } catch {}
    }
    setIsListening(false);
  };

  // Voice Synthesis (TTS) - Haute compatibilité (Chrome, iOS Safari, Android, Edge)
  const speakText = (text: string, msgId?: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      setVoiceToast({
        message: "La synthèse vocale n'est pas supportée par ce navigateur. Utilisez Chrome ou Safari.",
        type: 'error'
      });
      setTimeout(() => setVoiceToast(null), 4000);
      return;
    }

    // Toggle arrêt si on reclique sur le même message en cours de lecture
    if (speakingId === msgId && isSpeaking) {
      if (speechKeepAliveRef.current) clearInterval(speechKeepAliveRef.current);
      try { window.speechSynthesis.cancel(); } catch {}
      setIsSpeaking(false);
      setSpeakingId(null);
      activeUtteranceRef.current = null;
      return;
    }

    if (speechKeepAliveRef.current) clearInterval(speechKeepAliveRef.current);

    // Annuler toute lecture précédente
    try {
      window.speechSynthesis.cancel();
    } catch {}

    // Nettoyage sécurisé du texte à prononcer
    let clean = text
      .replace(/https?:\/\/[^\s]+/g, 'le lien')
      .replace(/[*_#`~[\]()]/g, ' ')
      .replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]/g, '')
      .replace(/\s+/g, ' ')
      .trim();

    if (!clean) return;

    // Délai nécessaire de 60ms pour laisser Chrome/Safari vider la file après cancel()
    setTimeout(() => {
      try {
        const utterance = new SpeechSynthesisUtterance(clean);
        activeUtteranceRef.current = utterance;
        (window as any)._activeUtterance = utterance; // Empêche le ramasse-miettes V8 de couper le son

        utterance.lang = 'fr-FR';
        utterance.rate = 1.0;
        utterance.pitch = 1.0;

        // Sélection d'une voix française disponible
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
          setIsSpeaking(true);
          setSpeakingId(msgId || 'active');
          setVoiceToast({
            message: "🔊 Emris lit sa réponse à haute voix...",
            type: 'info'
          });
          setTimeout(() => setVoiceToast(null), 3000);

          // Keep-alive sécurisé : ne coupe pas la voix sur iOS, relance seulement si suspendu
          if (speechKeepAliveRef.current) clearInterval(speechKeepAliveRef.current);
          speechKeepAliveRef.current = setInterval(() => {
            if (!window.speechSynthesis.speaking) {
              clearInterval(speechKeepAliveRef.current);
            } else if (window.speechSynthesis.paused) {
              try { window.speechSynthesis.resume(); } catch {}
            }
          }, 5000);
        };

        utterance.onend = () => {
          if (speechKeepAliveRef.current) clearInterval(speechKeepAliveRef.current);
          setIsSpeaking(false);
          setSpeakingId(null);
          activeUtteranceRef.current = null;
        };

        utterance.onerror = (e) => {
          if (speechKeepAliveRef.current) clearInterval(speechKeepAliveRef.current);
          setIsSpeaking(false);
          setSpeakingId(null);
          activeUtteranceRef.current = null;
          if (e.error !== 'interrupted' && e.error !== 'canceled') {
            console.warn('Speech synthesis error:', e.error);
          }
        };

        if (window.speechSynthesis.paused) {
          window.speechSynthesis.resume();
        }

        window.speechSynthesis.speak(utterance);
      } catch (err) {
        console.error('Failed to speak text:', err);
        setIsSpeaking(false);
        setSpeakingId(null);
      }
    }, 60);
  };

  // Exposer la fonction speakText globalement pour conformité stricte avec la demande
  if (typeof window !== 'undefined') {
    (window as any).speakText = speakText;
  }

  const handleSpeak = (text: string, msgId?: string) => {
    speakText(text, msgId);
  };

  // Speech Recognition (STT) - Reconnaissance vocale directe et conforme mobiles/PC
  const startVoiceDictation = () => {
    const SpeechRecClass = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecClass) {
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      setVoiceToast({
        message: isMobile 
          ? "Ce navigateur ne supporte pas la reconnaissance vocale. Ouvrez le chat dans Google Chrome ou Safari !"
          : "La reconnaissance vocale nécessite un navigateur compatible comme Google Chrome, Safari ou Edge.",
        type: 'error'
      });
      setTimeout(() => setVoiceToast(null), 6000);
      return;
    }

    if (isListeningRef.current) {
      stopVoiceDictation();
      return;
    }

    try {
      const recognition = new SpeechRecClass();
      recognitionRef.current = recognition;
      recognition.lang = 'fr-FR';
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        isListeningRef.current = true;
        setIsListening(true);
        setVoiceToast({
          message: "🎙️ Micro actif ! Parlez clairement maintenant...",
          type: 'success'
        });
        setTimeout(() => setVoiceToast(null), 3000);
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
        console.warn('SpeechRecognition error:', event.error);
        stopVoiceDictation();
        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
          setVoiceToast({
            message: "🎙️ Accès au micro refusé. Veuillez autoriser le microphone dans votre navigateur.",
            type: 'error'
          });
        } else if (event.error === 'no-speech') {
          setVoiceToast({
            message: "🎙️ Aucune parole détectée. Rapprochez-vous du micro et réessayez.",
            type: 'info'
          });
        } else if (event.error === 'network') {
          setVoiceToast({
            message: "🎙️ Connexion internet requise pour la reconnaissance vocale.",
            type: 'error'
          });
        } else if (event.error !== 'aborted') {
          setVoiceToast({
            message: `🎙️ Reconnaissance interrompue (${event.error}).`,
            type: 'info'
          });
        }
        setTimeout(() => setVoiceToast(null), 4500);
      };

      recognition.onend = () => {
        isListeningRef.current = false;
        setIsListening(false);
      };

      // Appel direct et synchrone dans le geste utilisateur (requis par iOS Safari & Android Chrome)
      recognition.start();
    } catch (err) {
      console.error('Error starting speech recognition:', err);
      stopVoiceDictation();
      setVoiceToast({
        message: "Impossible de démarrer le micro. Vérifiez les autorisations de votre appareil.",
        type: 'error'
      });
      setTimeout(() => setVoiceToast(null), 4000);
    }
  };

  const handleCopy = async (id: string, text: string) => {
    let success = false;
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        success = true;
      }
    } catch {
      // Fallback below
    }

    if (!success) {
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
        success = document.execCommand('copy');
        document.body.removeChild(textArea);
      } catch (e) {
        console.error('Copy fallback error:', e);
      }
    }

    if (success) {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2200);
    }
  };

  const moodList = [
    { label: 'En forme', emoji: '😊' },
    { label: 'Un peu fatigué', emoji: '😴' },
    { label: 'Stressé / Cogite', emoji: '🤯' },
    { label: 'Triste ou Dépassé', emoji: '😔' },
    { label: 'Enjaillé / En joie', emoji: '🥳' }
  ];

  return (
    <div className="h-full w-full flex flex-col bg-slate-950 text-slate-100 overflow-hidden relative">
      
      {/* ========================================================================= */}
      {/* 1. TOP HEADER: Slim, responsive, rich in controls without wasting height */}
      {/* ========================================================================= */}
      <header className="shrink-0 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 z-30 px-3 py-2 sm:px-6 sm:py-2.5">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-3">
          
          {/* Avatar, Identity & Status */}
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="relative shrink-0 flex items-center justify-center">
              <div 
                className={`absolute -inset-1 rounded-2xl bg-cyan-400/20 blur-xs transition-all pointer-events-none ${
                  isLoading ? 'animate-avatar-thinking' : 'animate-avatar-ring'
                }`}
                aria-hidden="true"
              />
              <img
                src={avatarSrc}
                alt={avatarName}
                className={`relative w-10 h-10 sm:w-11 sm:h-11 rounded-2xl object-cover border-2 border-cyan-400 shadow-md transition-transform ${
                  isLoading ? 'animate-avatar-thinking' : 'animate-avatar-breathe'
                }`}
              />
              <span 
                className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-slate-900 transition-colors ${
                  isLoading ? 'bg-cyan-400 animate-ping' : 'bg-emerald-500'
                }`} 
                title="En direct avec toi" 
              />
              <span 
                className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-slate-900 ${
                  isLoading ? 'bg-cyan-400' : 'bg-emerald-500'
                }`} 
              />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="font-extrabold text-sm sm:text-base text-white tracking-tight truncate">
                  {avatarGender === 'male' ? 'Emris' : 'Emris'}
                </h2>
                <span className="shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  {isTrial ? `Essai 7j (${daysRemaining}j)` : `Actif 30j (${daysRemaining}j)`}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 truncate flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block shrink-0 animate-pulse" />
                <span>Sage & psychologue complice</span>
                <span className="hidden sm:inline text-slate-500">•</span>
                <span className="hidden sm:inline text-amber-300 font-medium">« On est ensemble »</span>
                <span className="hidden md:inline text-slate-500">•</span>
                <span className="hidden md:inline-flex items-center gap-1 text-cyan-300 font-medium">
                  <Brain className="w-3 h-3 text-cyan-400" />
                  <span>Réflexion & Recherches sans imaginer</span>
                </span>
              </p>
            </div>
          </div>

          {/* Controls: Gender toggle, Quick Modules & Mood */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            
            {/* Desktop Direct Module Badges */}
            <div className="hidden lg:flex items-center gap-1.5">
              {onOpenLanguages && (
                <button
                  onClick={onOpenLanguages}
                  className="px-2.5 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
                  title="Ouvrir l'Espace Prof de Langues"
                >
                  <GraduationCap className="w-3.5 h-3.5" />
                  <span>5 Langues</span>
                </button>
              )}

              {onOpenAutonomous && (
                <button
                  onClick={onOpenAutonomous}
                  className="px-2.5 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-cyan-500/30 text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
                  title="Ouvrir M-Ris Autonome (Emails, Redaction, Freelance)"
                >
                  <Bot className="w-3.5 h-3.5" />
                  <span>Autonome</span>
                </button>
              )}

              {onOpenCommercial && (
                <button
                  onClick={onOpenCommercial}
                  className="px-2.5 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-emerald-500/30 text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
                  title="Ouvrir le Hub Commercial 100% Autonome"
                >
                  <Target className="w-3.5 h-3.5" />
                  <span>Commercial</span>
                </button>
              )}
            </div>

            {/* Modules Popover Button (Mobile + Tablets) */}
            <button
              onClick={() => setIsModulesModalOpen(true)}
              className="lg:hidden p-2 sm:px-2.5 sm:py-1.5 rounded-xl bg-slate-800/90 hover:bg-slate-800 text-cyan-300 border border-slate-700 text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
              title="Modules (Langues, Autonome, Commercial)"
            >
              <Layers className="w-4 h-4 text-cyan-400" />
              <span className="hidden sm:inline">Modules</span>
            </button>

            {/* Gender Toggle 👦 / 👧 */}
            <div className="bg-slate-800 p-0.5 rounded-xl border border-slate-700 flex items-center">
              <button
                onClick={() => setAvatarGender('male')}
                className={`px-2 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  avatarGender === 'male'
                    ? 'bg-cyan-500 text-slate-950 shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Avatar Frère Sûr"
              >
                👦<span className="hidden sm:inline ml-1 text-[11px]">Frère</span>
              </button>
              <button
                onClick={() => setAvatarGender('female')}
                className={`px-2 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  avatarGender === 'female'
                    ? 'bg-cyan-500 text-slate-950 shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Avatar Sœur Complice"
              >
                👧<span className="hidden sm:inline ml-1 text-[11px]">Sœur</span>
              </button>
            </div>

            {/* Mood Pill Button */}
            <button
              onClick={() => setIsMoodModalOpen(true)}
              className="px-2.5 py-1 rounded-xl bg-slate-800/90 hover:bg-slate-800 text-slate-200 border border-slate-700 text-xs font-semibold transition-all cursor-pointer flex items-center gap-1"
              title="Changer ton humeur"
            >
              <Smile className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">{currentMood}</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {/* Wisdom / Petit Coin Button */}
            <button
              onClick={() => setIsWisdomModalOpen(true)}
              className="p-2 rounded-xl bg-slate-800/90 hover:bg-slate-800 text-amber-300 border border-slate-700 text-xs transition-all cursor-pointer"
              title="Le Petit Coin Sagesse & Humour"
            >
              <Coffee className="w-4 h-4" />
            </button>

            {/* New Conversation Button */}
            <button
              onClick={handleNewConversation}
              className="p-2 sm:px-2.5 sm:py-1.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-300 hover:text-cyan-300 border border-slate-700 text-xs font-semibold transition-all cursor-pointer flex items-center gap-1"
              title="Commencer une nouvelle discussion avec un accueil renouvelé"
            >
              <RefreshCw className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden md:inline text-[11px]">Nouveau</span>
            </button>
          </div>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* 2. CHAT CONVERSATION VIEWPORT: Fills 100% of remaining available space     */}
      {/* ========================================================================= */}
      <div 
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 min-h-0 w-full overflow-y-auto chat-scroll overscroll-contain relative px-3 py-4 sm:px-6 sm:py-6"
      >
        <div className="max-w-4xl mx-auto flex flex-col space-y-4">
          
          {/* Welcome Intro Header Card inside Chat Flow */}
          <div className="text-center py-2 px-4 mb-2">
            <span className="text-[11px] font-mono-numbers text-slate-500 bg-slate-900/80 px-3 py-1 rounded-full border border-slate-800 inline-block">
              🔒 Échange chiffré & bienveillant • Session personnelle avec Emris
            </span>
          </div>

          {/* Messages Stream */}
          {messages.map((entry) => {
            const isUser = entry.sender === 'user';

            return (
              <div
                key={entry.id}
                className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} group transition-all`}
              >
                <div className={`flex items-end gap-2.5 max-w-[92%] sm:max-w-[82%] ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
                  
                  {/* Bot Avatar Icon */}
                  {!isUser && (
                    <img
                      src={avatarSrc}
                      alt="Emris"
                      className="w-8 h-8 rounded-full object-cover border border-cyan-400 shrink-0 mb-1 shadow-sm"
                    />
                  )}

                  {/* Message Bubble */}
                  <div
                    className={`rounded-2xl px-4 py-3 sm:px-5 sm:py-3.5 text-sm sm:text-[15px] leading-relaxed shadow-sm transition-all ${
                      isUser
                        ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-br-none shadow-cyan-600/10'
                        : 'bg-slate-900/90 text-slate-100 border border-slate-800 rounded-bl-none'
                    }`}
                  >
                    <p className="whitespace-pre-line leading-relaxed">{entry.text}</p>

                    {/* Instant de réflexion & Recherches factuelles menées par Emris */}
                    {!isUser && (entry.reflection || (entry.researchSources && entry.researchSources.length > 0)) && (
                      <div className="mt-3 pt-2.5 border-t border-slate-800/90">
                        <button
                          onClick={() => toggleReflection(entry.id)}
                          className="w-full flex items-center justify-between gap-2 px-3 py-1.5 rounded-xl bg-slate-950/70 hover:bg-slate-800/80 text-[11px] font-semibold text-cyan-300 border border-cyan-500/25 transition-all cursor-pointer group"
                          title="Voir l'instant de réflexion et les recherches factuelles d'Emris"
                        >
                          <div className="flex items-center gap-1.5 min-w-0">
                            <Brain className="w-3.5 h-3.5 text-cyan-400 shrink-0 group-hover:rotate-12 transition-transform" />
                            <span className="truncate">Instant de réflexion & Recherches</span>
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shrink-0">
                              ✨ Vérifié sans imaginer
                            </span>
                          </div>
                          {expandedReflectionIds[entry.id] ? (
                            <ChevronUp className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          ) : (
                            <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          )}
                        </button>

                        {expandedReflectionIds[entry.id] && (
                          <div className="mt-2.5 p-3 rounded-xl bg-slate-950 border border-slate-800/90 text-xs space-y-2.5 animate-fadeIn">
                            {entry.reflection && (
                              <div>
                                <div className="text-[10px] font-bold uppercase tracking-wider text-cyan-400 mb-1 flex items-center gap-1">
                                  <Brain className="w-3 h-3 text-cyan-400" />
                                  <span>Analyse & Réflexion préalable :</span>
                                </div>
                                <p className="text-slate-300 text-[12px] leading-relaxed italic bg-slate-900/60 p-2 rounded-lg border border-slate-800/60">
                                  "{entry.reflection}"
                                </p>
                              </div>
                            )}

                            {entry.researchSources && entry.researchSources.length > 0 && (
                              <div>
                                <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 mb-1 flex items-center gap-1">
                                  <Search className="w-3 h-3 text-emerald-400" />
                                  <span>Repères & Pistes vérifiés sur le terrain :</span>
                                </div>
                                <ul className="space-y-1.5 pl-1">
                                  {entry.researchSources.map((source, sIdx) => (
                                    <li key={sIdx} className="text-slate-300 text-[11px] flex items-start gap-1.5 bg-slate-900/40 p-1.5 rounded-lg border border-slate-800/40">
                                      <span className="text-emerald-400 font-bold shrink-0 mt-0.5">•</span>
                                      <span>{source}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            <div className="pt-2 border-t border-slate-800/80 flex items-center gap-1.5 text-[10px] text-slate-400 font-medium">
                              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                              <span>Garantie Emris : Zéro hallucination, réponse ancrée dans le réel et les faits concrets.</span>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Metadata & Actions */}
                <div className={`flex items-center gap-2 mt-1 px-1 text-[11px] text-slate-500 font-mono-numbers ${isUser ? 'pr-1' : 'pl-11'}`}>
                  <span>{entry.timestamp}</span>
                  {!isUser && (
                    <>
                      <span>·</span>
                      <button
                        onClick={() => speakText(entry.text, entry.id)}
                        className={`transition-all flex items-center gap-1 cursor-pointer px-1.5 py-0.5 rounded ${
                          speakingId === entry.id
                            ? 'text-cyan-400 font-bold bg-cyan-500/20 scale-105'
                            : 'hover:text-cyan-400 text-slate-400'
                        }`}
                        title={speakingId === entry.id ? "Arrêter la lecture" : "Écouter la réponse à haute voix"}
                      >
                        {speakingId === entry.id ? (
                          <>
                            <VolumeX className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
                            <span className="text-cyan-400 font-bold">Lecture...</span>
                          </>
                        ) : (
                          <>
                            <Volume2 className="w-3.5 h-3.5" />
                            <span>Écouter</span>
                          </>
                        )}
                      </button>
                    </>
                  )}
                  <span>·</span>
                  <button
                    onClick={() => handleCopy(entry.id, entry.text)}
                    className={`transition-all cursor-pointer flex items-center gap-1 px-1.5 py-0.5 rounded ${
                      copiedId === entry.id
                        ? 'text-emerald-400 font-bold bg-emerald-500/10 scale-105'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                    title="Copier le message dans le presse-papier"
                    aria-label="Copier le message"
                  >
                    {copiedId === entry.id ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                        <span className="text-emerald-400 font-bold">Copié !</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copier</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}

          {/* Loading Indicator avec étapes de réflexion et recherche */}
          {isLoading && (
            <div className="flex flex-col gap-2 py-2 pl-1 animate-fadeIn max-w-[95%] sm:max-w-[85%]">
              <div className="flex items-start gap-2.5">
                <div className="relative shrink-0 mt-1">
                  <img
                    src={avatarSrc}
                    alt="Emris"
                    className="w-8 h-8 rounded-full object-cover border-2 border-cyan-400 animate-pulse shadow-md"
                  />
                  <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
                </div>

                <div className="flex-1 bg-slate-900/95 border border-cyan-500/30 rounded-2xl rounded-bl-none p-3.5 shadow-xl space-y-3">
                  {/* Header de réflexion */}
                  <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-2">
                    <div className="flex items-center gap-1.5">
                      <Brain className="w-4 h-4 text-cyan-400 animate-pulse" />
                      <span className="font-bold text-xs text-white">Instant de réflexion & Recherches d'Emris</span>
                    </div>
                    <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                      Étape {thinkingStep + 1}/4
                    </span>
                  </div>

                  {/* 4 Étapes de réflexion et recherche factuelle */}
                  <div className="space-y-2 text-xs">
                    {/* Étape 1 */}
                    <div className={`flex items-start gap-2 transition-all ${thinkingStep >= 0 ? 'text-white' : 'text-slate-500'}`}>
                      <div className="shrink-0 mt-0.5">
                        {thinkingStep > 0 ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <span className="w-3.5 h-3.5 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin inline-block" />
                        )}
                      </div>
                      <div>
                        <p className="font-semibold text-[11px] leading-tight">Instant de réflexion & Analyse du besoin</p>
                        <p className="text-[10px] text-slate-400">Cadrage de la demande et identification des enjeux réels</p>
                      </div>
                    </div>

                    {/* Étape 2 */}
                    <div className={`flex items-start gap-2 transition-all ${thinkingStep >= 1 ? 'text-white' : 'text-slate-500'}`}>
                      <div className="shrink-0 mt-0.5">
                        {thinkingStep > 1 ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        ) : thinkingStep === 1 ? (
                          <span className="w-3.5 h-3.5 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin inline-block" />
                        ) : (
                          <span className="w-3.5 h-3.5 rounded-full border border-slate-700 inline-block" />
                        )}
                      </div>
                      <div>
                        <p className="font-semibold text-[11px] leading-tight">Recherche factuelle & Données du terrain</p>
                        <p className="text-[10px] text-slate-400">Consultation des repères de marché et connaissances pratiques</p>
                      </div>
                    </div>

                    {/* Étape 3 */}
                    <div className={`flex items-start gap-2 transition-all ${thinkingStep >= 2 ? 'text-white' : 'text-slate-500'}`}>
                      <div className="shrink-0 mt-0.5">
                        {thinkingStep > 2 ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        ) : thinkingStep === 2 ? (
                          <span className="w-3.5 h-3.5 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin inline-block" />
                        ) : (
                          <span className="w-3.5 h-3.5 rounded-full border border-slate-700 inline-block" />
                        )}
                      </div>
                      <div>
                        <p className="font-semibold text-[11px] leading-tight">Filtre de rigueur & Anti-hallucination</p>
                        <p className="text-[10px] text-slate-400">Élimination des suppositions et validation sans imaginer</p>
                      </div>
                    </div>

                    {/* Étape 4 */}
                    <div className={`flex items-start gap-2 transition-all ${thinkingStep >= 3 ? 'text-white' : 'text-slate-500'}`}>
                      <div className="shrink-0 mt-0.5">
                        {thinkingStep >= 3 ? (
                          <span className="w-3.5 h-3.5 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin inline-block" />
                        ) : (
                          <span className="w-3.5 h-3.5 rounded-full border border-slate-700 inline-block" />
                        )}
                      </div>
                      <div>
                        <p className="font-semibold text-[11px] leading-tight">Synthèse concrète & directe</p>
                        <p className="text-[10px] text-slate-400">Rédaction des étapes précises et directement applicables</p>
                      </div>
                    </div>
                  </div>

                  {/* Barre de progression */}
                  <div className="w-full bg-slate-800 rounded-full h-1 overflow-hidden">
                    <div 
                      className="bg-gradient-to-r from-cyan-500 to-emerald-400 h-1 transition-all duration-500 rounded-full"
                      style={{ width: `${Math.min(100, (thinkingStep + 1) * 25)}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Bottom Anchor Ref */}
          <div ref={messagesEndRef} className="h-2" />
        </div>
      </div>

      {/* Floating Scroll to Bottom Button */}
      {showScrollBottomBtn && (
        <button
          onClick={() => scrollToBottom('smooth')}
          className="absolute bottom-24 right-5 sm:right-8 z-30 p-2.5 rounded-full bg-cyan-600 hover:bg-cyan-500 text-white shadow-xl border border-cyan-400 transition-all cursor-pointer animate-bounce"
          title="Faire défiler vers le bas"
        >
          <ChevronDown className="w-5 h-5" />
        </button>
      )}

      {/* ========================================================================= */}
      {/* 3. PINNED BOTTOM INPUT BAR: Strictly visible, never masks messages        */}
      {/* ========================================================================= */}
      <footer className="shrink-0 z-30 bg-slate-900/95 backdrop-blur-xl border-t border-slate-800/90 shadow-2xl px-3 pt-2 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-6 sm:pt-3">
        <div className="max-w-4xl mx-auto flex flex-col space-y-2">
          
          {/* Quick Suggestions Chips Bar (Collapsible) */}
          {showSuggestions && (
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar text-xs py-0.5">
              <span className="text-[11px] font-semibold text-slate-400 shrink-0 flex items-center gap-1">
                <Lightbulb className="w-3 h-3 text-amber-400" />
                <span>Suggestions :</span>
              </span>

              {[
                "🎓 Donne-moi un devoir d'anglais niveau intermédiaire",
                "🇨🇳 Comment s'entraîner aux tons et Pinyin en chinois ?",
                "🇰🇷 Explique-moi les particules 은/는 et 이/가 en coréen",
                "🇪🇸 Quelle est la différence entre ser et estar en espagnol ?",
                "🇩🇪 Comment fonctionnent les cas (Akkusativ / Dativ) en allemand ?",
                "J'ai besoin de vider mon sac...",
                "Fais-moi rire un peu !",
                "Tu fais quoi dans ton petit coin ?"
              ].map((promptText, i) => (
                <button
                  key={i}
                  onClick={() => handleSendMessage(promptText)}
                  className="shrink-0 px-3 py-1 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs font-medium transition-colors cursor-pointer whitespace-nowrap"
                >
                  {promptText}
                </button>
              ))}

              <button
                onClick={() => setShowSuggestions(false)}
                className="text-[10px] text-slate-500 hover:text-slate-300 ml-1 shrink-0 p-1"
                title="Masquer les suggestions pour agrandir le chat"
              >
                ✕
              </button>
            </div>
          )}

          {/* Expired Paywall Banner or Standard Input Form */}
          {daysRemaining <= 0 ? (
            <div className="p-3.5 bg-amber-950/80 border border-amber-500/40 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-amber-200">
              <div className="flex items-center gap-2.5">
                <Clock className="w-5 h-5 text-amber-400 shrink-0" />
                <div>
                  <strong className="block font-bold text-white">Ton essai gratuit de 7 jours est arrivé à terme !</strong>
                  <span className="text-amber-300/90 text-[11px]">
                    Pour continuer à échanger avec Emris sans interruption, souscris à l'abonnement complet (35 000 FCFA/mois via Wave).
                  </span>
                </div>
              </div>
              <button
                onClick={onRenew}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 font-black text-xs shrink-0 shadow-md cursor-pointer transition-all"
              >
                💳 S'abonner via Wave (35 000 F)
              </button>
            </div>
          ) : (
            <>
              {/* Voice Notification / Helper Toast */}
              {voiceToast && (
                <div className={`px-4 py-2.5 rounded-xl flex items-center justify-between text-xs animate-fadeIn shadow-lg border transition-all ${
                  voiceToast.type === 'error'
                    ? 'bg-rose-950/95 border-rose-500/60 text-rose-200'
                    : voiceToast.type === 'success'
                    ? 'bg-emerald-950/95 border-emerald-500/60 text-emerald-200'
                    : 'bg-cyan-950/95 border-cyan-500/60 text-cyan-200'
                }`}>
                  <span className="font-medium leading-relaxed">{voiceToast.message}</span>
                  <button
                    type="button"
                    onClick={() => setVoiceToast(null)}
                    className="ml-2 text-slate-400 hover:text-white font-bold text-xs p-1 cursor-pointer"
                  >
                    ✕
                  </button>
                </div>
              )}

              {/* Active voice dictation banner */}
              {isListening && (
                <div className="px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-rose-950/90 to-amber-950/90 border border-rose-500/60 text-rose-200 flex items-center justify-between text-xs animate-fadeIn shadow-lg">
                  <div className="flex items-center gap-2.5">
                    <span className="relative flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500" />
                    </span>
                    <span className="font-semibold text-rose-200">Reconnaissance vocale active : dictez votre message...</span>
                  </div>
                  <button
                    type="button"
                    onClick={stopVoiceDictation}
                    className="px-2.5 py-1 rounded bg-rose-900/80 hover:bg-rose-800 text-rose-200 font-bold text-xs cursor-pointer transition-colors"
                  >
                    Arrêter
                  </button>
                </div>
              )}

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage();
                }}
                className="flex items-center gap-2"
              >
                {/* Toggle Suggestions button */}
                {!showSuggestions && (
                  <button
                    type="button"
                    onClick={() => setShowSuggestions(true)}
                    className="p-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-amber-300 border border-slate-700 transition-colors shrink-0 cursor-pointer"
                    title="Afficher les suggestions rapides"
                  >
                    <Lightbulb className="w-4 h-4" />
                  </button>
                )}

                {/* Microphone Dictation Button (SpeechRecognition) */}
                <button
                  type="button"
                  onClick={startVoiceDictation}
                  className={`p-3 sm:p-3.5 rounded-2xl border transition-all cursor-pointer shrink-0 ${
                    isListening
                      ? 'bg-rose-600 border-rose-500 text-white shadow-lg shadow-rose-600/40 animate-pulse scale-105'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-cyan-400 border-slate-700'
                  }`}
                  title={isListening ? "Arrêter la dictée vocale" : "Dicter ma question au micro (SpeechRecognition)"}
                  aria-label="Reconnaissance vocale par microphone"
                >
                  {isListening ? (
                    <MicOff className="w-5 h-5 text-white" />
                  ) : (
                    <Mic className="w-5 h-5" />
                  )}
                </button>

                {/* Text Input avec support vocal sans interruption de focus */}
                <input
                  type="text"
                  value={inputText}
                  onKeyDown={(e) => {
                    // Si l'utilisateur commence à taper manuellement au clavier, arrêter la dictée vocale
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
                  placeholder={isListening ? "Écoute en cours... Dictez librement" : "Confie-toi à Emris (ou dicte au micro)..."}
                  className={`flex-1 px-4 py-3 sm:py-3.5 text-sm sm:text-base font-sans bg-slate-900 text-white placeholder-slate-400 border rounded-2xl focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all shadow-inner ${
                    isListening ? 'border-rose-400 ring-2 ring-rose-500/30' : 'border-slate-700/80'
                  }`}
                />

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={!inputText.trim() || isLoading}
                  className="p-3 sm:p-3.5 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-lg shadow-cyan-500/20 cursor-pointer shrink-0"
                  title="Envoyer le message"
                >
                  <Send className="w-5 h-5" />
                </button>
              </form>
            </>
          )}

        </div>
      </footer>

      {/* ========================================================================= */}
      {/* 4. MODALS: Modules, Mood & Wisdom (Keeping all features without clutter)   */}
      {/* ========================================================================= */}

      {/* Modules Hub Modal */}
      {isModulesModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-base text-white flex items-center gap-2">
                <Layers className="w-5 h-5 text-cyan-400" />
                <span>Modules & Espaces M-Ris</span>
              </h3>
              <button
                onClick={() => setIsModulesModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-400">
              Accédez directement à vos agents autonomes et professeurs intelligents en un clic :
            </p>

            <div className="space-y-3">
              {onOpenLanguages && (
                <button
                  onClick={() => {
                    setIsModulesModalOpen(false);
                    onOpenLanguages();
                  }}
                  className="w-full text-left p-3.5 rounded-2xl bg-slate-950 hover:bg-slate-800 border border-amber-500/30 transition-all cursor-pointer flex items-center justify-between group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-300 flex items-center justify-center shrink-0">
                      <GraduationCap className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-white group-hover:text-amber-300 transition-colors">
                        🎓 Professeur de 5 Langues
                      </h4>
                      <p className="text-[11px] text-slate-400">
                        Anglais, Espagnol, Allemand, Coréen, Chinois avec devoirs notés sur 20.
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-amber-300 group-hover:translate-x-0.5 transition-all" />
                </button>
              )}

              {onOpenAutonomous && (
                <button
                  onClick={() => {
                    setIsModulesModalOpen(false);
                    onOpenAutonomous();
                  }}
                  className="w-full text-left p-3.5 rounded-2xl bg-slate-950 hover:bg-slate-800 border border-cyan-500/30 transition-all cursor-pointer flex items-center justify-between group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-300 flex items-center justify-center shrink-0">
                      <Bot className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-white group-hover:text-cyan-300 transition-colors">
                        🤖 M-Ris Agent Autonome 24h/24
                      </h4>
                      <p className="text-[11px] text-slate-400">
                        Emails triés, rédactions professionnelles & missions freelance en arrière-plan.
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-cyan-300 group-hover:translate-x-0.5 transition-all" />
                </button>
              )}

              {onOpenCommercial && (
                <button
                  onClick={() => {
                    setIsModulesModalOpen(false);
                    onOpenCommercial();
                  }}
                  className="w-full text-left p-3.5 rounded-2xl bg-slate-950 hover:bg-slate-800 border border-emerald-500/30 transition-all cursor-pointer flex items-center justify-between group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center shrink-0">
                      <Target className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-white group-hover:text-emerald-300 transition-colors">
                        🎯 Agent Commercial 100% Autonome
                      </h4>
                      <p className="text-[11px] text-slate-400">
                        Promotions, publicités multi-canaux & closing prospects via Wave.
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-emerald-300 group-hover:translate-x-0.5 transition-all" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Mood Selector Modal */}
      {isMoodModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-base text-white flex items-center gap-2">
                <Heart className="w-5 h-5 text-rose-500" />
                <span>Ton Humeur du Moment</span>
              </h3>
              <button
                onClick={() => setIsMoodModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-400">
              Indique à Emris comment tu te sens pour qu'il adapte son ton et son écoute :
            </p>

            <div className="grid grid-cols-1 gap-2">
              {moodList.map((m) => (
                <button
                  key={m.label}
                  onClick={() => {
                    setCurrentMood(m.label);
                    setIsMoodModalOpen(false);
                  }}
                  className={`px-4 py-3 rounded-xl font-bold text-xs transition-all flex items-center justify-between cursor-pointer ${
                    currentMood === m.label
                      ? 'bg-cyan-500 text-slate-950 font-black shadow-md'
                      : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-base">{m.emoji}</span>
                    <span>{m.label}</span>
                  </div>
                  {currentMood === m.label && <Check className="w-4 h-4 text-slate-950" />}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Wisdom & Petit Coin Modal */}
      {isWisdomModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-base text-white flex items-center gap-2">
                <Coffee className="w-5 h-5 text-amber-400" />
                <span>Le Petit Coin Attiéké Virtuel & Sagesse</span>
              </h3>
              <button
                onClick={() => setIsWisdomModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              <div className="p-4 rounded-2xl bg-slate-950 border border-amber-500/30">
                <span className="font-bold text-amber-300 block mb-1">🐟 Attiéké & Poisson Braisé Virtuel :</span>
                <p className="text-slate-300 leading-relaxed">
                  « Dans mon petit coin, l'attiéké virtuel ne refroidit jamais ! Prendre soin de soi, c'est aussi s'accorder un moment simple sans pression ni jugement. »
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950 border border-cyan-500/30">
                <span className="font-bold text-cyan-300 block mb-1">💡 Posture Psychologue & Maïeutique :</span>
                <p className="text-slate-300 leading-relaxed">
                  Emris ne te juge jamais. Toutes tes émotions sont valides. Ensemble, on décortique les nœuds pour que tu trouves tes propres réponses lumineuses.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950 border border-emerald-500/30">
                <span className="font-bold text-emerald-300 block mb-1">🛡️ Licence & Confidentialité :</span>
                <p className="text-slate-300 leading-relaxed">
                  {isTrial ? "Essai gratuit de 7 jours actif sans carte bancaire." : "Abonnement mensuel de 30 jours actif."} Renouvellement à {FORMAT_FCFA(SUBSCRIPTION_CONFIG.AMOUNT_FCFA)}/mois via Wave Business vers Béni Amar.
                </p>
              </div>
            </div>

            <div className="pt-2 text-right">
              <button
                onClick={() => setIsWisdomModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs"
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
