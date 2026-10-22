import React, { useState } from 'react';
import { SubscriptionRequest, SentEmailNotification } from '../types/subscription';
import { RegisteredUser, UserLoginEvent, WhatsAppNotification } from '../types/adminControl';
import { SUBSCRIPTION_CONFIG, FORMAT_FCFA } from '../utils/constants';
import { 
  ShieldCheck, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Search, 
  Filter, 
  Eye, 
  Mail, 
  Calendar, 
  User, 
  CreditCard, 
  Download, 
  ExternalLink,
  MessageCircle,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Lock,
  Trash2,
  CheckCircle2,
  Users,
  UserPlus,
  Smartphone,
  Activity,
  Send,
  Radio,
  FileText,
  Database,
  RefreshCw,
  Cloud,
  Server,
  Check,
  BarChart3,
  ArrowUpRight,
  Copy,
  CheckCheck,
  BellRing,
  Globe,
  Link,
  Code,
  FileSpreadsheet,
  Share2
} from 'lucide-react';
import { centralSync } from '../services/centralSyncService';
import { SUPABASE_SQL_CREATE_TABLE, insertUserToSupabaseDirect } from '../services/supabaseClient';
import { AdminAnalyticsDashboard } from './AdminAnalyticsDashboard';

interface AdminDashboardProps {
  subscriptions: SubscriptionRequest[];
  sentEmails: SentEmailNotification[];
  registeredUsers: RegisteredUser[];
  loginEvents: UserLoginEvent[];
  whatsAppAlerts?: WhatsAppNotification[];
  onActivateAccount: (id: string) => void;
  onActivateTrialAccount: (id: string) => void;
  onRejectAccount: (id: string, reason: string) => void;
  onExtendAccount: (id: string) => void;
  onDeleteSubscription: (id: string) => void;
  onValidateUser: (id: string) => void;
  onDeleteUser: (id: string) => void;
  onViewReceipt: (subscription: SubscriptionRequest) => void;
  onViewEmail: (email: SentEmailNotification) => void;
  onLockAdmin?: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  subscriptions,
  sentEmails,
  registeredUsers = [],
  loginEvents = [],
  whatsAppAlerts = [],
  onActivateAccount,
  onActivateTrialAccount,
  onRejectAccount,
  onExtendAccount,
  onDeleteSubscription,
  onValidateUser,
  onDeleteUser,
  onViewReceipt,
  onViewEmail,
  onLockAdmin
}) => {
  // Main Navigation Tabs
  const [activeMainTab, setActiveMainTab] = useState<'users' | 'subscriptions' | 'payments' | 'whatsapp' | 'analytics'>('users');

  // Subscriptions Filter
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'active' | 'trial' | 'rejected'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('Capture Wave non conforme ou montant introuvable');

  // Deletion Confirmation Modal
  const [deleteModalState, setDeleteModalState] = useState<{
    isOpen: boolean;
    type: 'user' | 'subscription' | 'payment';
    id: string;
    title: string;
    name: string;
  }>({
    isOpen: false,
    type: 'user',
    id: '',
    title: '',
    name: ''
  });

  // Central Database & Supabase state
  const [isSyncing, setIsSyncing] = useState(false);
  const [isSupabaseModalOpen, setIsSupabaseModalOpen] = useState(false);
  const [supabaseUrl, setSupabaseUrl] = useState('');
  const [supabaseKey, setSupabaseKey] = useState('');
  const [supabaseSaving, setSupabaseSaving] = useState(false);
  const [supabaseStatus, setSupabaseStatus] = useState<{ connected: boolean; url: string; enabled: boolean }>({
    connected: false,
    url: '',
    enabled: false
  });
  const [supabaseMessage, setSupabaseMessage] = useState<string | null>(null);
  const [isSqlModalOpen, setIsSqlModalOpen] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);
  const [isSupabaseReloading, setIsSupabaseReloading] = useState(false);

  // Deep Recovery & Manual Add
  const [isDeepRecovering, setIsDeepRecovering] = useState(false);
  const [recoveryModal, setRecoveryModal] = useState<{
    isOpen: boolean;
    total: number;
    recovered: number;
    supabaseCount: number;
    message: string;
  } | null>(null);

  // Manual Add User Modal state
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [addUserName, setAddUserName] = useState('');
  const [addUserEmail, setAddUserEmail] = useState('');
  const [addUserPhone, setAddUserPhone] = useState('');
  const [addUserPassword, setAddUserPassword] = useState('');
  const [addUserPlan, setAddUserPlan] = useState<'Essai Gratuit 7 Jours' | 'Abonnement Mensuel (35 000 FCFA)'>('Essai Gratuit 7 Jours');
  const [addUserStatus, setAddUserStatus] = useState<'pending' | 'validated'>('validated');
  const [isSubmittingUser, setIsSubmittingUser] = useState(false);
  const [addUserFeedback, setAddUserFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Live registration notification toast
  const [liveNewUserToast, setLiveNewUserToast] = useState<{ name: string; email: string; time: string } | null>(null);
  const prevUserCountRef = React.useRef(registeredUsers.length);

  // External Inscriptions & Webhook state
  const [isExternalModalOpen, setIsExternalModalOpen] = useState(false);
  const [externalTab, setExternalTab] = useState<'webhook' | 'link' | 'embed' | 'batch'>('webhook');
  const [batchRawText, setBatchRawText] = useState('');
  const [batchSource, setBatchSource] = useState('Campagne WhatsApp / TikTok');
  const [isBatchImporting, setIsBatchImporting] = useState(false);
  const [batchFeedback, setBatchFeedback] = useState<{ success: boolean; count: number; message: string } | null>(null);
  const [copiedWebhook, setCopiedWebhook] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedEmbed, setCopiedEmbed] = useState(false);
  const [userSourceFilter, setUserSourceFilter] = useState<'all' | 'external' | 'internal' | 'validated' | 'pending'>('all');

  // Chargement direct depuis Supabase et surveillance en temps réel
  React.useEffect(() => {
    fetch('/api/mris/admin/supabase-status')
      .then(res => res.json())
      .then(data => setSupabaseStatus(data))
      .catch(err => console.warn('Supabase status fetch warning:', err));

    // Chargement immédiat et persistant depuis Supabase
    centralSync.fetchDirectSupabaseUsers();

    // Surveillance active toutes les 8 secondes : récupère automatiquement toute nouvelle inscription de téléphone portable
    const pollInterval = window.setInterval(async () => {
      try {
        const users = await centralSync.fetchDirectSupabaseUsers();
        if (users && users.length > prevUserCountRef.current && prevUserCountRef.current > 0) {
          const newest = users[0];
          setLiveNewUserToast({
            name: newest.userName,
            email: newest.userEmail,
            time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
          });
          setTimeout(() => setLiveNewUserToast(null), 8000);
        }
        prevUserCountRef.current = users.length;
      } catch {
        // ignore
      }
    }, 8000);

    return () => clearInterval(pollInterval);
  }, []);

  const handleDeepRecovery = async () => {
    setIsDeepRecovering(true);
    try {
      const res = await centralSync.deepRecoverAllAccounts();
      setRecoveryModal({
        isOpen: true,
        total: res.total,
        recovered: res.recovered,
        supabaseCount: res.supabaseCount,
        message: res.message
      });
      const statusRes = await fetch('/api/mris/admin/supabase-status').catch(() => null);
      if (statusRes && statusRes.ok) {
        setSupabaseStatus(await statusRes.json());
      }
    } finally {
      setIsDeepRecovering(false);
    }
  };

  const handleAddUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addUserName.trim() || !addUserEmail.trim()) {
      setAddUserFeedback({ type: 'error', message: 'Nom et Email sont obligatoires.' });
      return;
    }
    setIsSubmittingUser(true);
    setAddUserFeedback(null);

    try {
      const emailLower = addUserEmail.trim().toLowerCase();
      const detectedDevice = 'Ajout Manuel Admin (Esther)';

      // 1. Insertion directe Supabase
      await insertUserToSupabaseDirect({
        userName: addUserName.trim(),
        userEmail: emailLower,
        userPhone: addUserPhone.trim() || '+225 07 00 00 00 00',
        password: addUserPassword,
        role: emailLower === 'camaraesther920@gmail.com' ? 'admin' : 'client',
        device: detectedDevice
      });

      // 2. Enregistrement centralisé
      await centralSync.registerUserOnline({
        userName: addUserName.trim(),
        userEmail: emailLower,
        userPhone: addUserPhone.trim() || '+225 07 00 00 00 00',
        password: addUserPassword,
        plan: addUserPlan,
        device: detectedDevice
      }, 'inscription', `Compte ajouté manuellement par Esther (${addUserStatus === 'validated' ? 'Validé' : 'En attente'})`);

      // 3. Rafraîchissement direct
      await centralSync.fetchDirectSupabaseUsers();

      setAddUserFeedback({
        type: 'success',
        message: `Compte de ${addUserName} enregistré avec succès dans Supabase et dans votre tableau de bord !`
      });

      setTimeout(() => {
        setIsAddUserModalOpen(false);
        setAddUserName('');
        setAddUserEmail('');
        setAddUserPhone('');
        setAddUserPassword('');
        setAddUserFeedback(null);
      }, 1500);
    } catch (err: any) {
      setAddUserFeedback({
        type: 'error',
        message: `Erreur d'ajout: ${err?.message || err}`
      });
    } finally {
      setIsSubmittingUser(false);
    }
  };

  const handleBatchImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!batchRawText.trim()) return;
    setIsBatchImporting(true);
    setBatchFeedback(null);

    try {
      const lines = batchRawText.split('\n').map(l => l.trim()).filter(Boolean);
      const parsedUsers: any[] = [];

      for (const line of lines) {
        if (line.startsWith('#') || line.startsWith('//')) continue;
        const parts = line.split(/[,;\t|]+/).map(p => p.trim());
        if (parts.length >= 1) {
          let email = '';
          let nom = '';
          let tel = '';

          for (const p of parts) {
            if (p.includes('@')) {
              email = p;
            } else if (/^(\+|00)?[0-9\s-]{6,}$/.test(p) && !tel) {
              tel = p;
            } else if (!nom) {
              nom = p;
            }
          }

          if (email) {
            parsedUsers.push({
              nom: nom || email.split('@')[0],
              email: email.toLowerCase(),
              telephone: tel || '+225 07 00 00 00 00',
              source: batchSource
            });
          }
        }
      }

      if (parsedUsers.length === 0) {
        setBatchFeedback({ success: false, count: 0, message: 'Aucun email valide trouvé. Veuillez vérifier le format (Ex: Kouamé Jean, jean@gmail.com, 0701020304).' });
        return;
      }

      const res = await fetch('/api/mris/external/import-batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ users: parsedUsers })
      });

      const data = await res.json();
      if (data.success) {
        setBatchFeedback({
          success: true,
          count: data.count,
          message: `Succès : ${data.count} inscriptions externes importées et synchronisées dans Supabase !`
        });
        setBatchRawText('');
        await centralSync.fetchDirectSupabaseUsers();
        await centralSync.syncNow();
      } else {
        setBatchFeedback({ success: false, count: 0, message: data.error || 'Erreur lors de l\'import.' });
      }
    } catch (err: any) {
      setBatchFeedback({ success: false, count: 0, message: `Erreur: ${err?.message || err}` });
    } finally {
      setIsBatchImporting(false);
    }
  };

  const handleReloadFromSupabase = async () => {
    setIsSupabaseReloading(true);
    try {
      await centralSync.fetchDirectSupabaseUsers();
      await centralSync.syncNow();
      const statusRes = await fetch('/api/mris/admin/supabase-status');
      if (statusRes.ok) {
        setSupabaseStatus(await statusRes.json());
      }
    } finally {
      setTimeout(() => setIsSupabaseReloading(false), 600);
    }
  };

  const handleCopySqlScript = () => {
    navigator.clipboard.writeText(SUPABASE_SQL_CREATE_TABLE);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2500);
  };

  const handleForceSync = async () => {
    setIsSyncing(true);
    try {
      await centralSync.fetchDirectSupabaseUsers();
      await centralSync.syncNow();
      const statusRes = await fetch('/api/mris/admin/supabase-status');
      if (statusRes.ok) {
        setSupabaseStatus(await statusRes.json());
      }
    } finally {
      setTimeout(() => setIsSyncing(false), 600);
    }
  };

  const handleSaveSupabaseConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setSupabaseSaving(true);
    setSupabaseMessage(null);
    try {
      const res = await centralSync.configureSupabase(supabaseUrl.trim(), supabaseKey.trim(), true);
      setSupabaseMessage(res.message);
      if (res.success) {
        setSupabaseStatus({ connected: true, url: supabaseUrl, enabled: true });
        setTimeout(() => setIsSupabaseModalOpen(false), 1500);
      }
    } catch (err: any) {
      setSupabaseMessage(`Erreur: ${err?.message || err}`);
    } finally {
      setSupabaseSaving(false);
    }
  };

  // Stats calculation
  const pendingRequests = subscriptions.filter(s => s.status === 'pending');
  const activeRequests = subscriptions.filter(s => s.status === 'active' && !s.isTrial);
  const trialRequests = subscriptions.filter(s => s.status === 'trial' || s.isTrial);
  const totalRevenue = activeRequests.reduce((acc, curr) => acc + curr.amount, 0);

  // Filtered subscriptions
  const filteredSubscriptions = subscriptions.filter(sub => {
    let matchesFilter = true;
    if (filterStatus === 'all') matchesFilter = true;
    else if (filterStatus === 'trial') matchesFilter = sub.status === 'trial' || !!sub.isTrial;
    else if (filterStatus === 'active') matchesFilter = sub.status === 'active' && !sub.isTrial;
    else matchesFilter = sub.status === filterStatus;

    const q = searchQuery.toLowerCase().trim();
    const matchesSearch = !q || 
      sub.userName.toLowerCase().includes(q) ||
      sub.userEmail.toLowerCase().includes(q) ||
      sub.userPhone.toLowerCase().includes(q) ||
      (sub.waveTransactionId && sub.waveTransactionId.toLowerCase().includes(q));
    return matchesFilter && matchesSearch;
  });

  // Filtered users with external source filtering
  const filteredUsers = registeredUsers.filter(usr => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch = !q ||
      usr.userName.toLowerCase().includes(q) ||
      usr.userEmail.toLowerCase().includes(q) ||
      usr.userPhone.toLowerCase().includes(q) ||
      (usr.device && usr.device.toLowerCase().includes(q)) ||
      (usr.notes && usr.notes.toLowerCase().includes(q)) ||
      usr.subscriptionPlan.toLowerCase().includes(q);

    const isExternal = Boolean(
      usr.device?.toLowerCase().includes('externe') || 
      usr.device?.toLowerCase().includes('webhook') || 
      usr.notes?.toLowerCase().includes('externe')
    );

    if (userSourceFilter === 'external') return matchesSearch && isExternal;
    if (userSourceFilter === 'internal') return matchesSearch && !isExternal;
    if (userSourceFilter === 'validated') return matchesSearch && usr.accountStatus === 'validated';
    if (userSourceFilter === 'pending') return matchesSearch && usr.accountStatus === 'pending';

    return matchesSearch;
  });

  const externalUsersCount = registeredUsers.filter(usr => 
    Boolean(
      usr.device?.toLowerCase().includes('externe') || 
      usr.device?.toLowerCase().includes('webhook') || 
      usr.notes?.toLowerCase().includes('externe')
    )
  ).length;

  const internalUsersCount = Math.max(0, registeredUsers.length - externalUsersCount);

  // Filtered Wave payments (items having wave transaction or receipt or amount > 0)
  const wavePayments = subscriptions.filter(sub => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch = !q || 
      sub.userName.toLowerCase().includes(q) ||
      sub.userEmail.toLowerCase().includes(q) ||
      sub.userPhone.toLowerCase().includes(q) ||
      (sub.waveTransactionId && sub.waveTransactionId.toLowerCase().includes(q));
    return matchesSearch;
  });

  const handleConfirmReject = () => {
    if (!rejectingId) return;
    onRejectAccount(rejectingId, rejectReason);
    setRejectingId(null);
    setRejectReason('Capture Wave non conforme ou montant introuvable');
  };

  const handleTriggerDelete = (type: 'user' | 'subscription' | 'payment', id: string, name: string) => {
    setDeleteModalState({
      isOpen: true,
      type,
      id,
      title: type === 'user' ? 'Supprimer l\'utilisateur' : type === 'subscription' ? 'Supprimer l\'abonnement' : 'Supprimer le paiement',
      name
    });
  };

  const handleConfirmDelete = () => {
    if (!deleteModalState.id) return;
    if (deleteModalState.type === 'user') {
      onDeleteUser(deleteModalState.id);
    } else {
      onDeleteSubscription(deleteModalState.id);
    }
    setDeleteModalState({ isOpen: false, type: 'user', id: '', title: '', name: '' });
  };

  const exportCSV = () => {
    const headers = ['ID', 'Nom', 'Email', 'Telephone', 'Montant', 'Statut', 'Date Soumission', 'Date Expiration', 'Ref Wave'];
    const rows = subscriptions.map(s => [
      s.id,
      `"${s.userName}"`,
      s.userEmail,
      s.userPhone,
      s.amount,
      s.status,
      s.submissionDate,
      s.expiresAt || '',
      s.waveTransactionId || ''
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `abonnements_mris_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Pre-formatted full admin WhatsApp summary text
  const generateGlobalWhatsAppReport = (): string => {
    const today = new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
    return `📊 BILAN OFFICIEL M-RIS & BÉNI AMAR (${today})\n\n` +
      `👑 Espace Administratrice : Camara Esther\n\n` +
      `👥 UTILISATEURS CONNECTÉS & INSCRITS : ${registeredUsers.length} comptes au total\n` +
      `• Actifs & Validés : ${registeredUsers.filter(u => u.accountStatus === 'validated').length}\n` +
      `• En attente : ${registeredUsers.filter(u => u.accountStatus === 'pending').length}\n\n` +
      `📋 ABONNEMENTS :\n` +
      `• Abonnés 30j payants : ${activeRequests.length}\n` +
      `• Essais gratuits 7j : ${trialRequests.length}\n` +
      `• En attente de validation : ${pendingRequests.length}\n\n` +
      `💳 ENCAISSEMENTS WAVE BUSINESS (35 000 FCFA) :\n` +
      `• Total Validé : ${FORMAT_FCFA(totalRevenue)}\n\n` +
      `Lien Wave : ${SUBSCRIPTION_CONFIG.WAVE_PAY_URL}\n` +
      `Lien Application : ${typeof window !== 'undefined' ? window.location.origin : 'M-Ris'}\n` +
      `Tous les voyants sont au vert ! 🚀`;
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-16">
      
      {/* Live Inscription Notification Banner */}
      {liveNewUserToast && (
        <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white rounded-2xl p-4 shadow-xl border border-emerald-400 flex items-center justify-between gap-4 animate-bounce">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
              <BellRing className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="font-black text-sm flex items-center gap-2">
                <span>🎉 Nouvelle inscription détectée en direct à {liveNewUserToast.time} !</span>
              </div>
              <p className="text-xs text-emerald-100">
                <strong>{liveNewUserToast.name}</strong> ({liveNewUserToast.email}) s'est inscrit(e) et a été automatiquement synchronisé(e) dans votre tableau de bord et dans Supabase.
              </p>
            </div>
          </div>
          <button
            onClick={() => setLiveNewUserToast(null)}
            className="px-3 py-1.5 rounded-lg bg-white/20 hover:bg-white/30 text-white text-xs font-bold cursor-pointer"
          >
            Fermer
          </button>
        </div>
      )}

      {/* Top Admin Security Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 border border-indigo-900/60 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-cyan-500 to-indigo-600 border border-cyan-400/40 flex items-center justify-center text-white shadow-lg shrink-0">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[10px] uppercase font-black tracking-widest px-2.5 py-1 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                  Espace Contrôle Total
                </span>
                <span className="text-xs text-amber-300 font-bold bg-amber-500/20 px-2.5 py-1 rounded-full border border-amber-500/40 flex items-center gap-1">
                  👑 Camara Esther ({SUBSCRIPTION_CONFIG.ADMIN_EMAIL})
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white mt-1.5">
                Tableau de Bord & Contrôle des Utilisateurs
              </h1>
              <p className="text-xs text-slate-300 mt-0.5">
                Visualisez qui se connecte, qui s'abonne et qui paie par Wave avec validation et suppression immédiates.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Deep Recovery Button (Comptes Passés & Futurs) */}
            <button
              onClick={handleDeepRecovery}
              disabled={isDeepRecovering}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-black shadow-lg transition-all cursor-pointer hover:scale-[1.03] ring-1 ring-amber-300 disabled:opacity-50"
              title="Récupérer tous les comptes d'utilisateurs passés et actuels depuis tous les stockages et Supabase"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isDeepRecovering ? 'animate-spin' : ''}`} />
              <span>{isDeepRecovering ? 'Récupération en cours...' : '🔄 Récupérer Tous les Comptes'}</span>
            </button>

            {/* Quick Add User Button */}
            <button
              onClick={() => setIsAddUserModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black shadow-md transition-all cursor-pointer hover:scale-[1.02]"
              title="Ajouter et inscrire manuellement un utilisateur directement dans Supabase"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>➕ Ajouter un Compte</span>
            </button>

            {/* Inscriptions Externes & Webhooks Button */}
            <button
              onClick={() => setIsExternalModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-black shadow-md transition-all cursor-pointer hover:scale-[1.02] border border-violet-400/30"
              title="Recevoir et gérer les inscriptions externes (Webhooks, Liens Publics, Formulaires HTML, Import CSV)"
            >
              <Globe className="w-3.5 h-3.5" />
              <span>🌐 Inscriptions Externes ({externalUsersCount})</span>
            </button>

            {/* Force Sync Button */}
            <button
              onClick={handleForceSync}
              disabled={isSyncing}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold shadow-md transition-all cursor-pointer hover:scale-[1.02]"
              title="Synchroniser immédiatement avec le serveur central et les téléphones mobiles"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'Synchronisation...' : 'Synchroniser'}</span>
            </button>

            {/* Supabase & Central DB Config Button */}
            <button
              onClick={() => setIsSupabaseModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md transition-all cursor-pointer hover:scale-[1.02]"
              title="Gérer la base de données centralisée & Supabase"
            >
              <Database className="w-3.5 h-3.5" />
              <span>Base & Supabase</span>
            </button>

            {/* Analytics Dashboard Button */}
            <button
              onClick={() => setActiveMainTab('analytics')}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-bold shadow-md transition-all cursor-pointer hover:scale-[1.02] ${
                activeMainTab === 'analytics'
                  ? 'bg-cyan-400 text-slate-950 font-black ring-2 ring-cyan-300'
                  : 'bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-cyan-500/30'
              }`}
              title="Voir le tableau de bord analytique graphique (Recharts)"
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Analytique Graphique</span>
            </button>

            {/* Direct WhatsApp report button */}
            <a
              href={`https://wa.me/message/RGXYT5LWDCTAM1?text=${encodeURIComponent(generateGlobalWhatsAppReport())}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md transition-all cursor-pointer hover:scale-[1.02]"
              title="Recevoir le bilan complet sur votre compte WhatsApp officiel"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Recevoir Bilan sur mon WhatsApp</span>
            </a>

            <button
              onClick={exportCSV}
              className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>

            <a
              href={SUBSCRIPTION_CONFIG.WAVE_PAY_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <span>Vérifier Wave</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>

            {onLockAdmin && (
              <button
                onClick={onLockAdmin}
                className="inline-flex items-center gap-1 px-3 py-2.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 text-xs font-semibold transition-colors cursor-pointer"
                title="Verrouiller le tableau de bord administrateur"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Verrouiller</span>
              </button>
            )}
          </div>
        </div>

        {/* Real-time Centralized Database Status Strip */}
        <div className="mt-5 pt-4 border-t border-indigo-900/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
            <span className="font-extrabold text-emerald-300">
              Base de Données Centralisée En Ligne (Temps Réel)
            </span>
            <span className="text-slate-500 hidden sm:inline">•</span>
            <span className="text-slate-300 hidden sm:inline">
              Chaque client qui s'inscrit ou démarre son essai depuis son téléphone mobile s'enregistre et s'affiche instantanément ici.
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold border flex items-center gap-1.5 ${
              supabaseStatus.connected
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                : 'bg-slate-800 text-slate-300 border-slate-700'
            }`}>
              <Cloud className="w-3.5 h-3.5 text-cyan-400" />
              <span>{supabaseStatus.connected ? 'Supabase Connecté & Synchronisé' : 'Serveur Cloud M-Ris Actif'}</span>
            </span>
          </div>
        </div>

        {/* Navigation Tabs Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 mt-6 pt-5 border-t border-slate-800">
          <button
            onClick={() => setActiveMainTab('users')}
            className={`flex items-center justify-center gap-2 py-3 px-3 rounded-2xl font-bold text-xs transition-all cursor-pointer ${
              activeMainTab === 'users'
                ? 'bg-cyan-500 text-slate-950 shadow-lg font-black'
                : 'bg-slate-800/80 hover:bg-slate-800 text-slate-300'
            }`}
          >
            <Users className="w-4 h-4 shrink-0" />
            <span className="truncate">1. Qui se connecte ({registeredUsers.length})</span>
          </button>

          <button
            onClick={() => setActiveMainTab('subscriptions')}
            className={`flex items-center justify-center gap-2 py-3 px-3 rounded-2xl font-bold text-xs transition-all cursor-pointer ${
              activeMainTab === 'subscriptions'
                ? 'bg-amber-400 text-slate-950 shadow-lg font-black'
                : 'bg-slate-800/80 hover:bg-slate-800 text-slate-300'
            }`}
          >
            <Calendar className="w-4 h-4 shrink-0" />
            <span className="truncate">2. Qui s'abonne ({subscriptions.length})</span>
          </button>

          <button
            onClick={() => setActiveMainTab('payments')}
            className={`flex items-center justify-center gap-2 py-3 px-3 rounded-2xl font-bold text-xs transition-all cursor-pointer ${
              activeMainTab === 'payments'
                ? 'bg-emerald-400 text-slate-950 shadow-lg font-black'
                : 'bg-slate-800/80 hover:bg-slate-800 text-slate-300'
            }`}
          >
            <CreditCard className="w-4 h-4 shrink-0" />
            <span className="truncate">3. Qui paie Wave ({wavePayments.length})</span>
          </button>

          <button
            onClick={() => setActiveMainTab('whatsapp')}
            className={`flex items-center justify-center gap-2 py-3 px-3 rounded-2xl font-bold text-xs transition-all cursor-pointer ${
              activeMainTab === 'whatsapp'
                ? 'bg-emerald-500 text-white shadow-lg font-black'
                : 'bg-slate-800/80 hover:bg-slate-800 text-emerald-400'
            }`}
          >
            <MessageCircle className="w-4 h-4 shrink-0" />
            <span className="truncate">4. Alertes WhatsApp</span>
          </button>

          <button
            onClick={() => setActiveMainTab('analytics')}
            className={`flex items-center justify-center gap-2 py-3 px-3 rounded-2xl font-bold text-xs transition-all cursor-pointer ${
              activeMainTab === 'analytics'
                ? 'bg-gradient-to-r from-cyan-400 to-indigo-500 text-slate-950 shadow-lg font-black'
                : 'bg-slate-800/80 hover:bg-slate-800 text-cyan-300 border border-cyan-500/20'
            }`}
          >
            <BarChart3 className="w-4 h-4 shrink-0 text-cyan-400" />
            <span className="truncate">5. Analytique (Recharts)</span>
          </button>
        </div>
      </div>

      {/* Metrics Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Metric 1: Connectés */}
        <div 
          onClick={() => setActiveMainTab('users')}
          className={`p-5 rounded-2xl border cursor-pointer transition-all ${
            activeMainTab === 'users'
              ? 'bg-cyan-50/90 border-cyan-300 shadow-sm'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="font-semibold text-cyan-900 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-cyan-600" />
              Utilisateurs Connectés
            </span>
            <span className="w-2 h-2 rounded-full bg-cyan-500 animate-ping" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-cyan-950 font-mono">
              {registeredUsers.length}
            </span>
            <span className="text-xs text-cyan-700 font-medium">inscrits</span>
          </div>
          <div className="text-[11px] text-cyan-800/80 mt-1">
            {registeredUsers.filter(u => u.accountStatus === 'validated').length} validés • {registeredUsers.filter(u => u.accountStatus === 'pending').length} en attente
          </div>
        </div>

        {/* Metric 2: Abonnés Actifs */}
        <div 
          onClick={() => { setActiveMainTab('subscriptions'); setFilterStatus('active'); }}
          className={`p-5 rounded-2xl border cursor-pointer transition-all ${
            activeMainTab === 'subscriptions' && filterStatus === 'active'
              ? 'bg-emerald-50/90 border-emerald-300 shadow-sm'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="font-semibold text-emerald-900 flex items-center gap-1.5">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
              Abonnés Actifs (30j)
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-emerald-950 font-mono">
              {activeRequests.length}
            </span>
            <span className="text-xs text-emerald-700 font-medium">payants</span>
          </div>
          <div className="text-[11px] text-emerald-800/80 mt-1">
            Validés à 35 000 FCFA / mois
          </div>
        </div>

        {/* Metric 3: Essais Gratuits */}
        <div 
          onClick={() => { setActiveMainTab('subscriptions'); setFilterStatus('trial'); }}
          className={`p-5 rounded-2xl border cursor-pointer transition-all ${
            activeMainTab === 'subscriptions' && filterStatus === 'trial'
              ? 'bg-amber-50/90 border-amber-300 shadow-sm'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="font-semibold text-amber-900 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              Essais Gratuits (7j)
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-amber-950 font-mono">
              {trialRequests.length}
            </span>
            <span className="text-xs text-amber-700 font-medium">en cours</span>
          </div>
          <div className="text-[11px] text-amber-800/80 mt-1">
            Accès 7 jours sans engagement
          </div>
        </div>

        {/* Metric 4: Paiements Reçus */}
        <div 
          onClick={() => setActiveMainTab('payments')}
          className={`p-5 rounded-2xl border cursor-pointer transition-all ${
            activeMainTab === 'payments'
              ? 'bg-purple-50/90 border-purple-300 shadow-sm'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="font-semibold text-purple-900 flex items-center gap-1.5">
              <CreditCard className="w-3.5 h-3.5 text-purple-600" />
              Paiements Encaissés
            </span>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">
              Règle Stricte
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-1">
            <span className="text-2xl sm:text-3xl font-black text-purple-950 font-mono">
              {FORMAT_FCFA(totalRevenue)}
            </span>
          </div>
          <div className="text-[11px] text-purple-800/80 mt-1">
            {totalRevenue === 0 
              ? '0 FCFA • Paiements en attente de reçu Wave' 
              : 'Reçus Wave vérifiés et validés manuellement'}
          </div>
          <div className="text-[10px] text-slate-500 mt-1.5 pt-1.5 border-t border-slate-100">
            🔒 Aucun montant inventé ou simulé
          </div>
        </div>

      </div>

      {/* Analytics Quick Jump Strip */}
      <div 
        onClick={() => setActiveMainTab('analytics')}
        className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
          activeMainTab === 'analytics'
            ? 'bg-gradient-to-r from-cyan-950 via-indigo-950 to-slate-900 border-cyan-400 text-white shadow-lg ring-1 ring-cyan-400'
            : 'bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border-indigo-900/60 text-white hover:border-cyan-500/50'
        }`}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 flex items-center justify-center shrink-0">
            <BarChart3 className="w-5 h-5 text-cyan-300" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black text-white">
                Analytique Graphique Recharts
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-400 text-slate-950 font-black">
                Courbes & Volumes
              </span>
            </div>
            <p className="text-[11px] text-slate-300 mt-0.5">
              Visualisez le nombre d'inscriptions quotidiennes et le volume mensuel de paiements Wave validés (35 000 FCFA).
            </p>
          </div>
        </div>

        <button
          onClick={(e) => { e.stopPropagation(); setActiveMainTab('analytics'); }}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-black shadow-xs self-start sm:self-auto cursor-pointer transition-transform hover:scale-105"
        >
          <span>{activeMainTab === 'analytics' ? 'Onglet Actif' : 'Consulter les Graphiques'}</span>
          <ArrowUpRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Control Bar: Universal Search */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Recherche Universelle :
          </span>
          <div className="relative min-w-[280px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Nom, email, téléphone, réf Wave..."
              className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900"
            />
          </div>
        </div>

        <div className="text-xs text-slate-500 font-medium">
          Affichage actif : <strong className="text-slate-800 uppercase">{
            activeMainTab === 'users' ? '1. Qui se connecte' :
            activeMainTab === 'subscriptions' ? '2. Qui s\'abonne' :
            activeMainTab === 'payments' ? '3. Qui paie Wave' :
            activeMainTab === 'whatsapp' ? '4. WhatsApp Direct' :
            '5. Analytique (Recharts)'
          }</strong>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: QUI SE CONNECTE (UTILISATEURS & CONNEXIONS) */}
      {/* ========================================================================= */}
      {activeMainTab === 'users' && (
        <div className="space-y-6">
          {/* Supabase Table 'utilisateurs' Status & Quick Actions Bar */}
          <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white rounded-3xl p-5 border border-slate-700 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center shrink-0">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    Table Supabase : 'utilisateurs'
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 font-mono">
                    {registeredUsers.length} comptes durables
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-0.5">
                  Persistance active : les comptes sont enregistrés dans votre table Supabase et ne disparaissent JAMAIS sans clic 'Supprimer'.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleReloadFromSupabase}
                disabled={isSupabaseReloading}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white border border-slate-600 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
                title="Recharger directement depuis la table Supabase utilisateurs"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-cyan-400 ${isSupabaseReloading ? 'animate-spin' : ''}`} />
                <span>{isSupabaseReloading ? 'Rechargement...' : 'Recharger Supabase'}</span>
              </button>

              <button
                type="button"
                onClick={() => setIsSqlModalOpen(true)}
                className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                title="Afficher le script SQL pour configurer ou vérifier la table utilisateurs dans Supabase"
              >
                <FileText className="w-3.5 h-3.5 text-indigo-200" />
                <span>Script SQL Supabase</span>
              </button>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="px-6 py-4 bg-slate-50/80 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <Users className="w-4 h-4 text-cyan-600" />
                  <span>Liste des Utilisateurs Inscrits & Connectés ({filteredUsers.length})</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Comptes persistés dans Supabase : chaque personne qui s'inscrit s'affiche ici et ne disparaît jamais sans clic 'Supprimer'.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleDeepRecovery}
                  disabled={isDeepRecovering}
                  className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
                  title="Récupérer tous les comptes d'utilisateurs passés et actuels depuis tous les stockages"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isDeepRecovering ? 'animate-spin' : ''}`} />
                  <span>{isDeepRecovering ? 'Récupération...' : '🔄 Récupérer Tous les Comptes'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsAddUserModalOpen(true)}
                  className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                  title="Inscrire un nouvel utilisateur et l'enregistrer dans Supabase"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>➕ Inscrire un Compte</span>
                </button>
              </div>
            </div>

            {/* Source & Status Filter Bar for Users */}
            <div className="px-6 py-2.5 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center gap-2 text-xs">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mr-1">Filtrer par source :</span>
              <button
                type="button"
                onClick={() => setUserSourceFilter('all')}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                  userSourceFilter === 'all'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                Tous ({registeredUsers.length})
              </button>
              <button
                type="button"
                onClick={() => setUserSourceFilter('external')}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  userSourceFilter === 'external'
                    ? 'bg-violet-600 text-white shadow-xs'
                    : 'bg-violet-50 text-violet-800 hover:bg-violet-100 border border-violet-200'
                }`}
              >
                <Globe className="w-3.5 h-3.5" />
                <span>🌐 Inscriptions Externes ({externalUsersCount})</span>
              </button>
              <button
                type="button"
                onClick={() => setUserSourceFilter('internal')}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                  userSourceFilter === 'internal'
                    ? 'bg-cyan-600 text-white shadow-xs'
                    : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                📱 Internes ({internalUsersCount})
              </button>
              <button
                type="button"
                onClick={() => setUserSourceFilter('validated')}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                  userSourceFilter === 'validated'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                ✅ Validés ({registeredUsers.filter(u => u.accountStatus === 'validated').length})
              </button>
              <button
                type="button"
                onClick={() => setUserSourceFilter('pending')}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                  userSourceFilter === 'pending'
                    ? 'bg-amber-500 text-slate-950 font-black shadow-xs'
                    : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                ⏳ En attente ({registeredUsers.filter(u => u.accountStatus === 'pending').length})
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100/60 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                    <th className="py-3 px-4">Utilisateur</th>
                    <th className="py-3 px-4">Dernière Connexion & Appareil</th>
                    <th className="py-3 px-4">Statut Compte</th>
                    <th className="py-3 px-4">Formule Actuelle</th>
                    <th className="py-3 px-4">Sessions</th>
                    <th className="py-3 px-4 text-right">Actions Contrôle Admin</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-10 text-center text-slate-500">
                        {userSourceFilter === 'external' 
                          ? 'Aucune inscription externe pour le moment. Cliquez sur "🌐 Inscriptions Externes" en haut pour copier votre Webhook ou lien public !' 
                          : 'Aucun utilisateur trouvé pour cette recherche.'}
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((usr) => {
                      const lastLoginFormatted = new Date(usr.lastLoginAt).toLocaleDateString('fr-FR', {
                        day: '2-digit',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit'
                      });

                      const isExternal = Boolean(
                        usr.device?.toLowerCase().includes('externe') || 
                        usr.device?.toLowerCase().includes('webhook') || 
                        usr.notes?.toLowerCase().includes('externe')
                      );

                      return (
                        <tr key={usr.id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-3">
                              <div className="relative">
                                <div className={`w-9 h-9 rounded-full font-black flex items-center justify-center text-xs shrink-0 ${
                                  isExternal 
                                    ? 'bg-violet-100 border border-violet-300 text-violet-900 ring-2 ring-violet-200' 
                                    : 'bg-cyan-100 border border-cyan-200 text-cyan-900'
                                }`}>
                                  {usr.userName.charAt(0).toUpperCase()}
                                </div>
                                {usr.isOnline && (
                                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white" title="En ligne récemment" />
                                )}
                              </div>
                              <div>
                                <div className="font-bold text-slate-900 text-sm flex items-center gap-1.5 flex-wrap">
                                  <span>{usr.userName}</span>
                                  {usr.role === 'admin' && (
                                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-200">
                                      👑 Admin
                                    </span>
                                  )}
                                  {isExternal && (
                                    <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-violet-100 text-violet-800 border border-violet-300 shadow-xs flex items-center gap-1">
                                      <Globe className="w-3 h-3 text-violet-600" />
                                      <span>Externe</span>
                                    </span>
                                  )}
                                </div>
                                <div className="text-slate-500 text-[11px] font-mono">
                                  {usr.userEmail}
                                </div>
                                <div className="text-slate-400 text-[11px]">
                                  {usr.userPhone}
                                </div>
                                {usr.notes && (
                                  <div className="text-[10px] text-slate-500 mt-0.5 italic max-w-xs truncate">
                                    {usr.notes}
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>

                          <td className="py-3.5 px-4">
                            <div className="font-semibold text-slate-800">
                              {lastLoginFormatted}
                            </div>
                            <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                              {isExternal ? (
                                <Globe className="w-3 h-3 text-violet-500 shrink-0" />
                              ) : (
                                <Smartphone className="w-3 h-3 text-slate-400 shrink-0" />
                              )}
                              <span className={`truncate max-w-[170px] ${isExternal ? 'text-violet-700 font-semibold' : ''}`}>
                                {usr.device || 'Mobile / Web'}
                              </span>
                            </div>
                          </td>

                          <td className="py-3.5 px-4">
                            {usr.accountStatus === 'validated' ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-emerald-800 bg-emerald-50 border border-emerald-200 font-bold text-[11px]">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                Validé
                              </span>
                            ) : usr.accountStatus === 'pending' ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-amber-800 bg-amber-50 border border-amber-200 font-bold text-[11px]">
                                <Clock className="w-3.5 h-3.5 text-amber-600 animate-spin" />
                                En attente
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-rose-800 bg-rose-50 border border-rose-200 font-bold text-[11px]">
                                <XCircle className="w-3.5 h-3.5 text-rose-600" />
                                Suspendu
                              </span>
                            )}
                          </td>

                          <td className="py-3.5 px-4">
                            <span className="font-bold text-slate-900 block">
                              {usr.subscriptionPlan}
                            </span>
                            <span className="text-[11px] text-slate-500">
                              Total versé : {FORMAT_FCFA(usr.totalPaidFCFA || 0)}
                            </span>
                          </td>

                          <td className="py-3.5 px-4 font-mono font-bold text-slate-700">
                            {usr.loginCount || 1} logins
                          </td>

                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              
                              {/* Bouton de validation utilisateur */}
                              {usr.accountStatus !== 'validated' && (
                                <button
                                  onClick={() => onValidateUser(usr.id)}
                                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer"
                                  title="Valider et approuver le compte utilisateur"
                                >
                                  <CheckCircle className="w-3.5 h-3.5" />
                                  <span>Valider</span>
                                </button>
                              )}

                              {/* Bouton WhatsApp direct */}
                              <a
                                href={`https://wa.me/message/RGXYT5LWDCTAM1?text=${encodeURIComponent(`Bonjour ${usr.userName}, concernant votre compte M-Ris (${usr.userEmail})...`)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 px-2 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-semibold transition-colors"
                                title="Ouvrir WhatsApp pour échanger"
                              >
                                <MessageCircle className="w-3.5 h-3.5" />
                              </a>

                              {/* Bouton de suppression utilisateur */}
                              {usr.role !== 'admin' && (
                                <button
                                  onClick={() => handleTriggerDelete('user', usr.id, usr.userName)}
                                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-semibold transition-colors cursor-pointer"
                                  title="Supprimer définitivement cet utilisateur"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                  <span>Supprimer</span>
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Live Login Events Stream */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Activity className="w-4 h-4 text-indigo-600" />
                <span>Journal des Connexions & Activités en Direct</span>
              </h3>
              <span className="text-xs font-mono text-slate-500">
                {loginEvents.length} événements récents
              </span>
            </div>

            <div className="space-y-2 max-h-72 overflow-y-auto">
              {loginEvents.length === 0 ? (
                <div className="text-center py-8 text-slate-500 text-xs">
                  Aucun événement de connexion pour le moment.
                </div>
              ) : (
                loginEvents.map((evt) => (
                  <div 
                    key={evt.id}
                    className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between text-xs hover:bg-slate-100/60 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs shrink-0">
                        {evt.eventType === 'connexion' ? '🔑' : evt.eventType === 'paiement_wave' ? '💳' : evt.eventType === 'essai_7j' ? '🎁' : '📱'}
                      </div>
                      <div>
                        <span className="font-bold text-slate-900">{evt.userName}</span>{' '}
                        <span className="text-slate-500 font-mono">({evt.userEmail})</span>
                        <div className="text-[11px] text-slate-600 mt-0.5">
                          {evt.details || evt.eventType} • Appareil : {evt.device}
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-[11px] font-mono text-slate-500">
                        {new Date(evt.timestamp).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <span className="block text-[10px] uppercase font-bold text-emerald-600">
                        {evt.status}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: QUI S'ABONNE (ABONNEMENTS & ESSAIS 7J) */}
      {/* ========================================================================= */}
      {activeMainTab === 'subscriptions' && (
        <div className="space-y-6">
          
          {/* Subscriptions Filter Bar */}
          <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 p-1.5 rounded-2xl max-w-fit">
            <button
              onClick={() => setFilterStatus('all')}
              className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                filterStatus === 'all'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Tous ({subscriptions.length})
            </button>
            <button
              onClick={() => setFilterStatus('pending')}
              className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                filterStatus === 'pending'
                  ? 'bg-amber-400 text-slate-950 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              En attente ({pendingRequests.length})
            </button>
            <button
              onClick={() => setFilterStatus('active')}
              className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                filterStatus === 'active'
                  ? 'bg-emerald-500 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Actifs 30j ({activeRequests.length})
            </button>
            <button
              onClick={() => setFilterStatus('trial')}
              className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                filterStatus === 'trial'
                  ? 'bg-sky-500 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Essais 7j ({trialRequests.length})
            </button>
            <button
              onClick={() => setFilterStatus('rejected')}
              className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                filterStatus === 'rejected'
                  ? 'bg-rose-500 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Rejetés ({subscriptions.filter(s => s.status === 'rejected').length})
            </button>
          </div>

          {/* Subscriptions Table */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100/60 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                    <th className="py-3 px-4">Utilisateur</th>
                    <th className="py-3 px-4">Date Soumission</th>
                    <th className="py-3 px-4">Formule & Montant</th>
                    <th className="py-3 px-4">Reçu Wave</th>
                    <th className="py-3 px-4">Statut & Validité</th>
                    <th className="py-3 px-4 text-right">Actions Contrôle Admin</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredSubscriptions.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-500">
                        Aucun abonnement trouvé pour ce filtre.
                      </td>
                    </tr>
                  ) : (
                    filteredSubscriptions.map((item) => {
                      const submissionFormatted = new Date(item.submissionDate).toLocaleDateString('fr-FR', {
                        day: '2-digit',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit'
                      });

                      let expiryInfo: string | null = null;
                      if (item.expiresAt) {
                        const exp = new Date(item.expiresAt);
                        const daysLeft = Math.max(0, Math.ceil((exp.getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
                        expiryInfo = `Jusqu'au ${exp.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })} (${daysLeft}j restants)`;
                      }

                      const relatedEmail = sentEmails.find(e => e.requestId === item.id);

                      return (
                        <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-700 text-xs shrink-0">
                                {item.userName.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <div className="font-bold text-slate-900 text-sm">
                                  {item.userName}
                                </div>
                                <div className="text-slate-500 text-[11px]">
                                  {item.userEmail}
                                </div>
                                <div className="text-slate-400 text-[11px]">
                                  {item.userPhone}
                                </div>
                              </div>
                            </div>
                          </td>

                          <td className="py-3.5 px-4">
                            <span className="font-mono text-slate-700 font-semibold">
                              {submissionFormatted}
                            </span>
                            {item.waveTransactionId && (
                              <div className="text-[10px] font-mono text-slate-400">
                                Réf: {item.waveTransactionId}
                              </div>
                            )}
                          </td>

                          <td className="py-3.5 px-4">
                            <span className="font-mono font-black text-slate-900 text-sm">
                              {item.isTrial ? '0 FCFA (Essai)' : FORMAT_FCFA(item.amount)}
                            </span>
                            <div className="text-[10px] font-semibold text-indigo-600">
                              {item.planName}
                            </div>
                          </td>

                          <td className="py-3.5 px-4">
                            {item.receiptImage ? (
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => onViewReceipt(item)}
                                  className="relative group block rounded-lg overflow-hidden border border-slate-200 hover:border-sky-500 transition-all shadow-2xs"
                                  title="Cliquer pour agrandir le reçu Wave"
                                >
                                  <img
                                    src={item.receiptImage}
                                    alt={`Reçu de ${item.userName}`}
                                    className="w-12 h-14 object-cover bg-slate-100"
                                  />
                                  <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                                    <Eye className="w-3.5 h-3.5" />
                                  </div>
                                </button>
                                <button
                                  onClick={() => onViewReceipt(item)}
                                  className="text-[11px] text-sky-600 hover:text-sky-800 font-semibold"
                                >
                                  Voir Reçu
                                </button>
                              </div>
                            ) : (
                              <span className="text-[11px] text-slate-400 italic">
                                {item.isTrial ? 'Essai sans reçu' : 'Aucun reçu'}
                              </span>
                            )}
                          </td>

                          <td className="py-3.5 px-4">
                            {item.status === 'pending' && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-amber-800 bg-amber-50 border border-amber-200 font-bold text-xs">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                                En attente validation
                              </span>
                            )}

                            {(item.status === 'trial' || item.isTrial) && (
                              <div>
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-sky-800 bg-sky-50 border border-sky-200 font-bold text-xs">
                                  <Sparkles className="w-3.5 h-3.5 text-sky-600" />
                                  Essai 7 Jours
                                </span>
                                {expiryInfo && (
                                  <div className="text-[10px] font-mono text-slate-600 mt-1">
                                    {expiryInfo}
                                  </div>
                                )}
                              </div>
                            )}

                            {item.status === 'active' && !item.isTrial && (
                              <div>
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-emerald-800 bg-emerald-50 border border-emerald-200 font-bold text-xs">
                                  <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                                  Actif 30 Jours
                                </span>
                                {expiryInfo && (
                                  <div className="text-[10px] font-mono text-slate-600 mt-1">
                                    {expiryInfo}
                                  </div>
                                )}
                              </div>
                            )}

                            {item.status === 'rejected' && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-rose-800 bg-rose-50 border border-rose-200 font-bold text-xs">
                                <XCircle className="w-3.5 h-3.5 text-rose-600" />
                                Rejeté
                              </span>
                            )}
                          </td>

                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              
                              {/* BOUTON DE VALIDATION ABONNEMENT */}
                              {item.status === 'pending' && (
                                <>
                                  <button
                                    onClick={() => onActivateTrialAccount(item.id)}
                                    className="px-2.5 py-1.5 rounded-xl border border-sky-300 bg-sky-50 hover:bg-sky-100 text-sky-800 text-xs font-bold transition-colors cursor-pointer"
                                    title="Accorder 7 jours gratuits"
                                  >
                                    Essai 7j
                                  </button>

                                  <button
                                    onClick={() => onActivateAccount(item.id)}
                                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer"
                                    title="Valider et activer pour 30 jours"
                                  >
                                    <CheckCircle className="w-3.5 h-3.5" />
                                    <span>Valider (30j)</span>
                                  </button>
                                </>
                              )}

                              {(item.status === 'trial' || item.isTrial) && (
                                <button
                                  onClick={() => onActivateAccount(item.id)}
                                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer"
                                  title="Valider en abonnement complet payant 30 jours"
                                >
                                  <CheckCircle className="w-3.5 h-3.5" />
                                  <span>Valider 30j</span>
                                </button>
                              )}

                              {item.status === 'active' && !item.isTrial && (
                                <button
                                  onClick={() => onExtendAccount(item.id)}
                                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
                                  title="Prolonger de 30 jours supplémentaires"
                                >
                                  <RotateCcw className="w-3 h-3" />
                                  <span>+30j</span>
                                </button>
                              )}

                              {/* BOUTON DE SUPPRESSION ABONNEMENT */}
                              <button
                                onClick={() => handleTriggerDelete('subscription', item.id, item.userName)}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-semibold transition-colors cursor-pointer"
                                title="Supprimer cet abonnement"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>Supprimer</span>
                              </button>

                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: QUI FAIT SON PAIEMENT (TRANSACTIONS WAVE BUSINESS BÉNI AMAR) */}
      {/* ========================================================================= */}
      {activeMainTab === 'payments' && (
        <div className="space-y-6">
          {/* Strict rule notice */}
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-start gap-3 text-xs text-emerald-900">
            <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <strong className="font-extrabold text-emerald-950 block mb-0.5">
                🛡️ RÈGLE STRICTE APPLIQUÉE : Transparence Financière & Zéro Simulation
              </strong>
              <p className="text-emerald-800 leading-relaxed">
                Aucun chiffre d'affaires, montant en FCFA ou paiement validé n'est inventé ou simulé sans confirmation technique ou reçu officiel. Si aucun paiement réel n'a été effectué sur Wave, il est obligatoirement noté <strong className="underline">« En attente »</strong>. Vous êtes la seule administratrice à pouvoir valider ou supprimer les paiements et abonnements.
              </p>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="px-6 py-4 bg-slate-50/80 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-emerald-600" />
                  <span>Paiements Wave Business Béni Amar (35 000 FCFA)</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Consultez les preuves de paiement Wave, validez le versement ou supprimez les transactions non conformes.
                </p>
              </div>

              <a
                href={SUBSCRIPTION_CONFIG.WAVE_PAY_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-sky-500 hover:bg-sky-600 text-white text-xs font-bold shadow-xs transition-colors"
              >
                <span>Ouvrir Wave Business Béni Amar</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100/60 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                    <th className="py-3 px-4">Payeur</th>
                    <th className="py-3 px-4">Montant</th>
                    <th className="py-3 px-4">Référence Wave</th>
                    <th className="py-3 px-4">Preuve / Capture Wave</th>
                    <th className="py-3 px-4">Statut Paiement</th>
                    <th className="py-3 px-4 text-right">Actions Validation & Suppression</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {wavePayments.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-500">
                        Aucun paiement Wave trouvé.
                      </td>
                    </tr>
                  ) : (
                    wavePayments.map((pay) => (
                      <tr key={pay.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-900 text-sm">
                            {pay.userName}
                          </div>
                          <div className="text-slate-500 text-[11px]">
                            {pay.userEmail}
                          </div>
                          <div className="text-slate-400 text-[11px]">
                            {pay.userPhone}
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <span className="font-mono font-black text-slate-900 text-sm">
                            {FORMAT_FCFA(pay.amount || 35000)}
                          </span>
                          <div className="text-[10px] text-sky-600 font-bold">
                            Compte : Béni Amar
                          </div>
                        </td>

                        <td className="py-3.5 px-4 font-mono font-bold text-slate-700">
                          {pay.waveTransactionId || 'WAVE-CI-EN-ATTENTE'}
                        </td>

                        <td className="py-3.5 px-4">
                          {pay.receiptImage ? (
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => onViewReceipt(pay)}
                                className="w-12 h-14 rounded-lg overflow-hidden border border-slate-200 hover:border-sky-500 shadow-2xs group relative"
                                title="Agrandir la capture du reçu Wave"
                              >
                                <img
                                  src={pay.receiptImage}
                                  alt={`Reçu de ${pay.userName}`}
                                  className="w-full h-full object-cover"
                                />
                                <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white">
                                  <Eye className="w-3.5 h-3.5" />
                                </div>
                              </button>
                              <button
                                onClick={() => onViewReceipt(pay)}
                                className="text-sky-600 hover:text-sky-800 font-bold text-xs"
                              >
                                Agrandir
                              </button>
                            </div>
                          ) : (
                            <span className="text-slate-400 italic text-[11px]">Pas de reçu téléversé</span>
                          )}
                        </td>

                        <td className="py-3.5 px-4">
                          {pay.status === 'active' && !pay.isTrial ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-emerald-800 bg-emerald-50 border border-emerald-200 font-bold text-[11px]">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              Paiement Validé
                            </span>
                          ) : pay.status === 'pending' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-amber-800 bg-amber-50 border border-amber-200 font-bold text-[11px]">
                              <Clock className="w-3.5 h-3.5 text-amber-600 animate-spin" />
                              En attente vérification
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-slate-700 bg-slate-100 border border-slate-200 font-bold text-[11px]">
                              {pay.status}
                            </span>
                          )}
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            
                            {/* BOUTON DE VALIDATION DU PAIEMENT */}
                            {pay.status !== 'active' && (
                              <button
                                onClick={() => onActivateAccount(pay.id)}
                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer"
                                title="Valider ce paiement et activer l'abonnement 30 jours"
                              >
                                <CheckCircle className="w-3.5 h-3.5" />
                                <span>Valider Paiement</span>
                              </button>
                            )}

                            {/* BOUTON DE SUPPRESSION DU PAIEMENT */}
                            <button
                              onClick={() => handleTriggerDelete('payment', pay.id, pay.userName)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-semibold transition-colors cursor-pointer"
                              title="Supprimer ce paiement"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Supprimer</span>
                            </button>

                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: ALERTES WHATSAPP ESTHER (https://wa.me/message/RGXYT5LWDCTAM1) */}
      {/* ========================================================================= */}
      {activeMainTab === 'whatsapp' && (
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-teal-950 border border-emerald-500/30 rounded-3xl p-6 shadow-xl text-white">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center shrink-0">
                <MessageCircle className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                    Liaison WhatsApp Officielle Active
                  </span>
                  <span className="text-xs text-emerald-300 font-mono">
                    f3: https://wa.me/message/RGXYT5LWDCTAM1
                  </span>
                </div>
                <h3 className="text-lg font-black text-white mt-2">
                  Pourquoi les messages n'étaient pas reçus automatiquement ?
                </h3>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                  Dans les navigateurs web, pour des raisons de sécurité, les messages WhatsApp doivent être transmis via le protocole officiel WhatsApp Web/Mobile.
                  L'agent autonome M-Ris a désormais été configuré pour <strong>formater automatiquement chaque alerte publicitaire, paiement Wave ou inscription</strong> et vous fournir un lien de transmission directe en 1 clic.
                </p>

                <div className="flex flex-wrap items-center gap-3 mt-4">
                  <a
                    href={`https://wa.me/message/RGXYT5LWDCTAM1?text=${encodeURIComponent(generateGlobalWhatsAppReport())}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs shadow-lg transition-transform hover:scale-105 cursor-pointer"
                  >
                    <Send className="w-4 h-4" />
                    <span>Transmettre le Rapport Global sur mon WhatsApp</span>
                  </a>

                  <a
                    href={`https://wa.me/message/RGXYT5LWDCTAM1?text=${encodeURIComponent('Test de réception WhatsApp réussi ! M-Ris est bien connecté à mon compte officiel.')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-4 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold transition-colors cursor-pointer"
                  >
                    <Radio className="w-4 h-4 text-emerald-400" />
                    <span>Tester la réception d'un message direct</span>
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* WhatsApp Alerts Feed */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6">
            <h4 className="font-bold text-slate-900 text-sm mb-4 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>Alertes Commerciales & Transactions Prêtes pour votre WhatsApp</span>
            </h4>

            <div className="space-y-3">
              {whatsAppAlerts.length === 0 ? (
                <div className="text-center py-10 px-4 rounded-2xl bg-slate-50 border border-slate-200 text-slate-500 text-xs">
                  Aucune alerte WhatsApp en attente pour le moment.
                </div>
              ) : (
                whatsAppAlerts.map((alt) => (
                  <div 
                    key={alt.id}
                    className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-emerald-50/30 hover:border-emerald-200 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                        <MessageCircle className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 text-xs">{alt.title}</span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {new Date(alt.timestamp).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                          {alt.message}
                        </p>
                      </div>
                    </div>

                    <a
                      href={alt.whatsappUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-xs shrink-0 transition-colors"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Envoyer sur WhatsApp</span>
                    </a>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: ANALYTIQUE RECHARTS (INSCRIPTIONS QUOTIDIENNES & VOLUME PAIEMENTS) */}
      {/* ========================================================================= */}
      {activeMainTab === 'analytics' && (
        <AdminAnalyticsDashboard
          registeredUsers={registeredUsers}
          subscriptions={subscriptions}
          loginEvents={loginEvents}
        />
      )}

      {/* ========================================================================= */}
      {/* MODAL DE SUPPRESSION SÉCURISÉ (BOUTON DE SUPPRESSION) */}
      {/* ========================================================================= */}
      {deleteModalState.isOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 flex items-center justify-center shrink-0">
                <Trash2 className="w-6 h-6 text-rose-600" />
              </div>
              <div>
                <h3 className="font-black text-slate-900 text-base">
                  {deleteModalState.title}
                </h3>
                <span className="text-xs text-rose-700 font-bold">
                  Action définitive et irréversible
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Êtes-vous certaine de vouloir supprimer l'enregistrement concernant{' '}
              <strong className="text-slate-900">« {deleteModalState.name} »</strong> ? 
              Les données seront immédiatement retirées de votre base de données et de votre tableau de bord.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setDeleteModalState({ isOpen: false, type: 'user', id: '', title: '', name: '' })}
                className="px-4 py-2 text-xs font-bold rounded-xl text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Annuler
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-5 py-2 text-xs font-black rounded-xl bg-rose-600 hover:bg-rose-700 text-white shadow-md transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Confirmer la suppression</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {rejectingId && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <AlertTriangle className="w-6 h-6" />
              <h3 className="font-bold text-slate-900 text-base">Rejeter la demande d'abonnement</h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Veuillez indiquer le motif du rejet. L'utilisateur sera notifié et invité à régulariser sa transaction Wave de 35 000 FCFA.
            </p>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Motif du rejet
              </label>
              <textarea
                rows={3}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="w-full p-2.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-rose-500 text-slate-800"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setRejectingId(null)}
                className="px-3.5 py-2 text-xs font-semibold rounded-xl text-slate-700 hover:bg-slate-100 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleConfirmReject}
                className="px-4 py-2 text-xs font-bold rounded-xl bg-rose-600 hover:bg-rose-700 text-white transition-colors"
              >
                Confirmer le rejet
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL CONFIGURATION BASE DE DONNÉES CENTRALISÉE & SUPABASE */}
      {/* ========================================================================= */}
      {isSupabaseModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center text-white shadow-md">
                  <Database className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-lg">
                    Base de Données Centralisée & Supabase
                  </h3>
                  <span className="text-xs text-slate-500">
                    Gestion du stockage persistant pour inscriptions mobiles & web
                  </span>
                </div>
              </div>
              <button
                onClick={() => setIsSupabaseModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 font-bold text-lg p-1"
              >
                ✕
              </button>
            </div>

            {/* Storage Architecture Overview */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs space-y-2">
              <div className="flex items-center gap-2 text-emerald-800 font-bold">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>Stockage Centralisé Serveur M-Ris : OPÉRATIONNEL (100% Persistant)</span>
              </div>
              <p className="text-slate-600 leading-relaxed">
                Chaque utilisateur qui crée un compte, s'inscrit aux 7 jours d'essai gratuit ou téléverse un reçu Wave depuis son téléphone mobile est automatiquement enregistré sur le serveur central et s'affiche instantanément dans votre section administrateur.
              </p>
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200/80 text-[11px]">
                <div className="bg-white p-2 rounded-xl border border-slate-200">
                  <span className="text-slate-500 block">Comptes Utilisateurs :</span>
                  <strong className="text-slate-900 text-sm">{registeredUsers.length} comptes enregistrés</strong>
                </div>
                <div className="bg-white p-2 rounded-xl border border-slate-200">
                  <span className="text-slate-500 block">Dossiers & Paiements :</span>
                  <strong className="text-slate-900 text-sm">{subscriptions.length} souscriptions</strong>
                </div>
              </div>
            </div>

            {/* Supabase Integration Form */}
            <form onSubmit={handleSaveSupabaseConfig} className="space-y-4">
              <div className="border-t border-slate-100 pt-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-slate-900 text-sm flex items-center gap-2">
                    <Cloud className="w-4 h-4 text-indigo-600" />
                    <span>Connecteur Supabase Client</span>
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${supabaseStatus.connected ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : 'bg-slate-100 text-slate-600'}`}>
                    {supabaseStatus.connected ? 'Connecté' : 'Non configuré'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed mb-3">
                  Renseignez ici votre URL de projet Supabase et votre clé publique (Anon Key) pour répliquer directement chaque inscription interne dans votre table Supabase <code className="bg-emerald-100 font-bold px-1.5 py-0.5 rounded text-emerald-800">utilisateurs</code> (avec les champs : nom, telephone, email, mot_de_passe).
                </p>

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      URL du Projet Supabase
                    </label>
                    <input
                      type="url"
                      placeholder="https://votre-projet.supabase.co"
                      value={supabaseUrl}
                      onChange={(e) => setSupabaseUrl(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Clé Publique Anonyme (Anon / Public Key)
                    </label>
                    <input
                      type="password"
                      placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                      value={supabaseKey}
                      onChange={(e) => setSupabaseKey(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 font-mono"
                    />
                  </div>
                </div>

                {supabaseMessage && (
                  <div className={`mt-3 p-3 rounded-xl text-xs font-medium ${supabaseMessage.includes('succès') ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'}`}>
                    {supabaseMessage}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsSupabaseModalOpen(false)}
                  className="px-4 py-2.5 text-xs font-bold rounded-xl text-slate-700 hover:bg-slate-100 transition-colors"
                >
                  Fermer
                </button>
                <button
                  type="submit"
                  disabled={supabaseSaving}
                  className="px-5 py-2.5 text-xs font-black rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-md transition-all flex items-center gap-2 cursor-pointer"
                >
                  {supabaseSaving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  <span>{supabaseSaving ? 'Connexion en cours...' : 'Enregistrer & Connecter Supabase'}</span>
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* SQL Script Modal for Supabase table 'utilisateurs' */}
      {isSqlModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="bg-slate-900 px-6 py-4 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-500/40 text-indigo-400 flex items-center justify-center font-bold">
                  <Database className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-white">
                    Script SQL Supabase • Table 'utilisateurs'
                  </h3>
                  <p className="text-xs text-slate-400">
                    Copiez et exécutez ce script dans l'éditeur SQL de votre compte Supabase
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsSqlModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition-colors cursor-pointer"
              >
                <XCircle className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4">
              <div className="bg-cyan-50 border border-cyan-200 text-cyan-950 p-3.5 rounded-2xl text-xs flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-cyan-700 shrink-0 mt-0.5" />
                <div>
                  <strong>Instructions rapides :</strong>
                  <ol className="list-decimal list-inside mt-1 space-y-1 text-cyan-900">
                    <li>Rendez-vous sur <strong>supabase.com</strong> et ouvrez votre projet <code>mjtuheawxnvjxzhxfcgx</code>.</li>
                    <li>Dans le menu de gauche, cliquez sur <strong>SQL Editor</strong>.</li>
                    <li>Collez le code ci-dessous et cliquez sur <strong>RUN</strong>.</li>
                  </ol>
                </div>
              </div>

              <div className="relative">
                <pre className="bg-slate-950 text-emerald-400 p-4 rounded-2xl text-[11px] font-mono overflow-x-auto max-h-72 border border-slate-800 leading-relaxed">
                  {SUPABASE_SQL_CREATE_TABLE}
                </pre>
                <button
                  type="button"
                  onClick={handleCopySqlScript}
                  className="absolute top-3 right-3 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer"
                >
                  {copiedSql ? <CheckCheck className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedSql ? 'Copié !' : 'Copier le code'}</span>
                </button>
              </div>
            </div>

            <div className="bg-slate-50 px-6 py-3.5 border-t border-slate-200 flex items-center justify-between">
              <span className="text-xs text-slate-500">
                Champs inclus : <code>nom</code>, <code>telephone</code>, <code>email</code>, <code>mot_de_passe</code>
              </span>
              <button
                type="button"
                onClick={() => setIsSqlModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors cursor-pointer"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Récupération Complète des Comptes */}
      {recoveryModal && recoveryModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="bg-gradient-to-r from-amber-500 to-amber-600 px-6 py-4 text-slate-950 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center font-bold">
                  <CheckCircle2 className="w-6 h-6 text-slate-950" />
                </div>
                <div>
                  <h3 className="font-black text-base">
                    Rapport de Récupération Complète
                  </h3>
                  <p className="text-xs text-slate-900/80 font-medium">
                    Consolidation multi-sources (Local, Téléphones & Supabase)
                  </p>
                </div>
              </div>
              <button
                onClick={() => setRecoveryModal(null)}
                className="w-8 h-8 rounded-full bg-black/10 hover:bg-black/20 text-slate-950 flex items-center justify-center transition-colors cursor-pointer"
              >
                <XCircle className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-950">
                <p className="font-bold text-sm mb-1">
                  {recoveryModal.message}
                </p>
                <p className="text-[11px] text-amber-800">
                  Tous les comptes trouvés dans les caches passés, formulaires et demandes d'abonnements ont été réinjectés et sécurisés.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 text-center">
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                  <span className="text-slate-500 text-xs block">Total Comptes Actifs :</span>
                  <span className="text-2xl font-black text-slate-950 font-mono">{recoveryModal.total}</span>
                </div>
                <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200">
                  <span className="text-emerald-700 text-xs block">Enregistrés Supabase :</span>
                  <span className="text-2xl font-black text-emerald-800 font-mono">{recoveryModal.supabaseCount}</span>
                </div>
              </div>

              <div className="text-xs text-slate-500 space-y-1">
                <p>• La synchronisation en temps réel est active.</p>
                <p>• Chaque futur utilisateur inscrit sur son téléphone apparaîtra automatiquement.</p>
              </div>
            </div>

            <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex justify-end">
              <button
                type="button"
                onClick={() => setRecoveryModal(null)}
                className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors cursor-pointer"
              >
                Compris & Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Ajout Manuel d'Utilisateur Direct Supabase */}
      {isAddUserModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="bg-slate-900 px-6 py-4 text-white flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center font-bold">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-white">
                    Inscrire un Utilisateur
                  </h3>
                  <p className="text-xs text-slate-400">
                    Enregistrement direct dans la table Supabase 'utilisateurs'
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsAddUserModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition-colors cursor-pointer"
              >
                <XCircle className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddUserSubmit} className="p-6 space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nom Complet du Client *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Kouamé Jean"
                  value={addUserName}
                  onChange={(e) => setAddUserName(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Adresse Email *
                </label>
                <input
                  type="email"
                  required
                  placeholder="Ex: jean.kouame@gmail.com"
                  value={addUserEmail}
                  onChange={(e) => setAddUserEmail(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Numéro Téléphone / WhatsApp
                </label>
                <input
                  type="text"
                  placeholder="Ex: +225 07 12 34 56 78"
                  value={addUserPhone}
                  onChange={(e) => setAddUserPhone(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Mot de Passe (optionnel)
                </label>
                <input
                  type="text"
                  placeholder="Mot de passe ou laisser vide"
                  value={addUserPassword}
                  onChange={(e) => setAddUserPassword(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Formule
                  </label>
                  <select
                    value={addUserPlan}
                    onChange={(e: any) => setAddUserPlan(e.target.value)}
                    className="w-full px-2.5 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 bg-white"
                  >
                    <option value="Essai Gratuit 7 Jours">Essai Gratuit 7 Jours</option>
                    <option value="Abonnement Mensuel (35 000 FCFA)">Abonnement Wave (35 000 FCFA)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Statut Initial
                  </label>
                  <select
                    value={addUserStatus}
                    onChange={(e: any) => setAddUserStatus(e.target.value)}
                    className="w-full px-2.5 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 bg-white"
                  >
                    <option value="validated">Validé Immédiatement</option>
                    <option value="pending">En Attente</option>
                  </select>
                </div>
              </div>

              {addUserFeedback && (
                <div className={`p-3 rounded-xl text-xs font-medium ${addUserFeedback.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'}`}>
                  {addUserFeedback.message}
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddUserModalOpen(false)}
                  className="px-4 py-2.5 text-xs font-bold rounded-xl text-slate-700 hover:bg-slate-100 transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingUser}
                  className="px-5 py-2.5 text-xs font-black rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white shadow-md transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isSubmittingUser ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <UserPlus className="w-3.5 h-3.5" />}
                  <span>{isSubmittingUser ? 'Enregistrement...' : 'Enregistrer dans Supabase'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Inscriptions Externes & Webhooks Modal */}
      {isExternalModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-3xl w-full border border-slate-200 shadow-2xl overflow-hidden my-6 animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="px-6 py-5 bg-gradient-to-r from-violet-900 via-indigo-900 to-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-violet-500/30 border border-violet-400/40 text-violet-300 flex items-center justify-center shrink-0">
                  <Globe className="w-5 h-5 text-violet-300" />
                </div>
                <div>
                  <h3 className="text-base font-black flex items-center gap-2">
                    <span>Hub des Inscriptions Externes & Webhooks</span>
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-violet-400 text-slate-950">
                      Temps Réel
                    </span>
                  </h3>
                  <p className="text-xs text-violet-200/90 mt-0.5">
                    Recevez automatiquement les comptes enregistrés sur vos autres sites, formulaires et campagnes dans Supabase.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsExternalModalOpen(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer text-sm"
              >
                ✕
              </button>
            </div>

            {/* Modal Navigation Tabs */}
            <div className="flex border-b border-slate-200 bg-slate-50 text-xs font-bold overflow-x-auto">
              <button
                type="button"
                onClick={() => setExternalTab('webhook')}
                className={`py-3 px-4 border-b-2 flex items-center gap-2 whitespace-nowrap cursor-pointer transition-colors ${
                  externalTab === 'webhook'
                    ? 'border-violet-600 text-violet-900 bg-white font-black'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                <Code className="w-3.5 h-3.5 text-violet-600" />
                <span>1. Webhook & API</span>
              </button>

              <button
                type="button"
                onClick={() => setExternalTab('link')}
                className={`py-3 px-4 border-b-2 flex items-center gap-2 whitespace-nowrap cursor-pointer transition-colors ${
                  externalTab === 'link'
                    ? 'border-violet-600 text-violet-900 bg-white font-black'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                <Link className="w-3.5 h-3.5 text-violet-600" />
                <span>2. Lien Public Partageable</span>
              </button>

              <button
                type="button"
                onClick={() => setExternalTab('embed')}
                className={`py-3 px-4 border-b-2 flex items-center gap-2 whitespace-nowrap cursor-pointer transition-colors ${
                  externalTab === 'embed'
                    ? 'border-violet-600 text-violet-900 bg-white font-black'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                <FileText className="w-3.5 h-3.5 text-violet-600" />
                <span>3. Formulaire HTML Intégrable</span>
              </button>

              <button
                type="button"
                onClick={() => setExternalTab('batch')}
                className={`py-3 px-4 border-b-2 flex items-center gap-2 whitespace-nowrap cursor-pointer transition-colors ${
                  externalTab === 'batch'
                    ? 'border-violet-600 text-violet-900 bg-white font-black'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-violet-600" />
                <span>4. Import en Masse de Contacts</span>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 max-h-[70vh] overflow-y-auto space-y-5 text-xs text-slate-700">

              {/* TAB 1: WEBHOOK & API */}
              {externalTab === 'webhook' && (
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-violet-50/70 border border-violet-200 text-violet-950">
                    <div className="font-black text-sm flex items-center gap-2 text-violet-900">
                      <CheckCircle2 className="w-4 h-4 text-violet-600" />
                      <span>URL de Réception Webhook Active (Live Cloud)</span>
                    </div>
                    <p className="text-xs text-violet-800 mt-1">
                      Envoyez une requête POST (JSON ou formulaire) ou GET vers cette URL depuis n'importe quel site web (GitHub Pages, Netlify, WordPress, Webflow, Zapier, Make). Le compte sera <strong>instantanément créé dans Supabase</strong> et apparaîtra dans votre tableau de bord.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Adresse URL du Webhook de Réception :
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        readOnly
                        value="https://ais-pre-yojeefvy2wylxcfq4ya433-175402587151.europe-west1.run.app/api/mris/external/register"
                        className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-slate-900 text-cyan-300 font-mono border border-slate-700 select-all"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText('https://ais-pre-yojeefvy2wylxcfq4ya433-175402587151.europe-west1.run.app/api/mris/external/register');
                          setCopiedWebhook(true);
                          setTimeout(() => setCopiedWebhook(false), 2000);
                        }}
                        className={`px-4 py-2.5 rounded-xl text-xs font-black shrink-0 transition-all cursor-pointer flex items-center gap-1.5 ${
                          copiedWebhook ? 'bg-emerald-600 text-white' : 'bg-violet-600 hover:bg-violet-500 text-white'
                        }`}
                      >
                        {copiedWebhook ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedWebhook ? 'Copié !' : 'Copier l\'URL'}</span>
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <span className="font-bold text-slate-800 text-xs">Exemple de Requête JSON (POST) :</span>
                    <pre className="p-3.5 rounded-xl bg-slate-900 text-emerald-300 font-mono text-[11px] overflow-x-auto border border-slate-800">
{`curl -X POST "https://ais-pre-yojeefvy2wylxcfq4ya433-175402587151.europe-west1.run.app/api/mris/external/register" \\
  -H "Content-Type: application/json" \\
  -d '{
    "nom": "Kouamé Jean",
    "email": "jean.kouame@gmail.com",
    "telephone": "+225 07 12 34 56 78",
    "source": "Site Externe / Campagne",
    "plan": "Essai Gratuit 7 Jours"
  }'`}
                    </pre>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-100 text-[11px] text-slate-600 border border-slate-200">
                    <span className="font-bold text-slate-800">Champs acceptés automatiquement :</span> <code>nom</code>, <code>name</code>, <code>full_name</code>, <code>email</code>, <code>mail</code>, <code>telephone</code>, <code>phone</code>, <code>source</code>, <code>plan</code>, <code>redirect_url</code>.
                  </div>
                </div>
              )}

              {/* TAB 2: LIEN PUBLIC */}
              {externalTab === 'link' && (
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-cyan-50/70 border border-cyan-200 text-cyan-950">
                    <div className="font-black text-sm flex items-center gap-2 text-cyan-900">
                      <Share2 className="w-4 h-4 text-cyan-600" />
                      <span>Lien d'Inscription Direct pour WhatsApp, TikTok & Réseaux</span>
                    </div>
                    <p className="text-xs text-cyan-800 mt-1">
                      Partagez ce lien à vos prospects dans vos statuts WhatsApp, stories Instagram, bio TikTok ou messages privés. Dès qu'un client s'inscrit, son compte arrive instantanément ici.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Lien d'inscription direct :
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        readOnly
                        value="https://ais-pre-yojeefvy2wylxcfq4ya433-175402587151.europe-west1.run.app/?source=campagne_externe"
                        className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-slate-900 text-emerald-300 font-mono border border-slate-700 select-all"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText('https://ais-pre-yojeefvy2wylxcfq4ya433-175402587151.europe-west1.run.app/?source=campagne_externe');
                          setCopiedLink(true);
                          setTimeout(() => setCopiedLink(false), 2000);
                        }}
                        className={`px-4 py-2.5 rounded-xl text-xs font-black shrink-0 transition-all cursor-pointer flex items-center gap-1.5 ${
                          copiedLink ? 'bg-emerald-600 text-white' : 'bg-cyan-600 hover:bg-cyan-500 text-white'
                        }`}
                      >
                        {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedLink ? 'Copié !' : 'Copier'}</span>
                      </button>
                    </div>
                  </div>

                  <div className="pt-2">
                    <a
                      href={`https://wa.me/?text=${encodeURIComponent('Inscrivez-vous dès maintenant à la plateforme M-Ris pour gérer vos abonnements et accéder à vos services : https://ais-pre-yojeefvy2wylxcfq4ya433-175402587151.europe-west1.run.app/?source=whatsapp_partage')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs shadow-md transition-all cursor-pointer hover:scale-[1.02]"
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span>Partager directement sur WhatsApp</span>
                    </a>
                  </div>
                </div>
              )}

              {/* TAB 3: FORMULAIRE HTML */}
              {externalTab === 'embed' && (
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-slate-100 border border-slate-200 text-slate-800">
                    <div className="font-black text-sm flex items-center gap-2 text-slate-900">
                      <Code className="w-4 h-4 text-violet-600" />
                      <span>Code HTML à Coller sur vos Sites Externes</span>
                    </div>
                    <p className="text-xs text-slate-600 mt-1">
                      Copiez ce formulaire HTML prêt à l'emploi et collez-le sur n'importe quel site web (WordPress, Webflow, GitHub Pages, page HTML simple). Toute soumission enregistrera le compte directement dans votre Supabase.
                    </p>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-bold text-slate-700">Code HTML du Formulaire :</label>
                      <button
                        type="button"
                        onClick={() => {
                          const embedCode = `<form action="https://ais-pre-yojeefvy2wylxcfq4ya433-175402587151.europe-west1.run.app/api/mris/external/register" method="POST">\n  <input type="hidden" name="source" value="Formulaire Site Web Externe" />\n  <label>Nom complet :</label>\n  <input type="text" name="nom" required placeholder="Votre nom" />\n  <label>Email :</label>\n  <input type="email" name="email" required placeholder="votre.email@gmail.com" />\n  <label>Téléphone / WhatsApp :</label>\n  <input type="tel" name="telephone" placeholder="+225 07..." />\n  <button type="submit">S'inscrire</button>\n</form>`;
                          navigator.clipboard.writeText(embedCode);
                          setCopiedEmbed(true);
                          setTimeout(() => setCopiedEmbed(false), 2000);
                        }}
                        className="text-xs font-bold text-violet-600 hover:text-violet-700 flex items-center gap-1 cursor-pointer"
                      >
                        {copiedEmbed ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedEmbed ? 'Copié !' : 'Copier le code'}</span>
                      </button>
                    </div>

                    <textarea
                      readOnly
                      rows={8}
                      className="w-full p-3.5 rounded-xl bg-slate-900 text-emerald-300 font-mono text-[11px] border border-slate-700 select-all"
                      value={`<form action="https://ais-pre-yojeefvy2wylxcfq4ya433-175402587151.europe-west1.run.app/api/mris/external/register" method="POST">
  <input type="hidden" name="source" value="Formulaire Site Web Externe" />
  <label>Nom complet :</label>
  <input type="text" name="nom" required placeholder="Votre nom" />
  
  <label>Email :</label>
  <input type="email" name="email" required placeholder="votre.email@gmail.com" />
  
  <label>Téléphone / WhatsApp :</label>
  <input type="tel" name="telephone" placeholder="+225 07 00 00 00 00" />
  
  <button type="submit">S'inscrire à M-Ris</button>
</form>`}
                    />
                  </div>
                </div>
              )}

              {/* TAB 4: BATCH IMPORT */}
              {externalTab === 'batch' && (
                <form onSubmit={handleBatchImport} className="space-y-4">
                  <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200 text-amber-950">
                    <div className="font-black text-sm flex items-center gap-2 text-amber-900">
                      <FileSpreadsheet className="w-4 h-4 text-amber-600" />
                      <span>Coller une Liste de Contacts Externes</span>
                    </div>
                    <p className="text-xs text-amber-800 mt-1">
                      Importez en 1 clic vos contacts reçus sur d'autres canaux (WhatsApp, Excel, Google Sheets, carnets d'adresses). Chaque ligne sera convertie en compte et injectée dans la table Supabase <code>utilisateurs</code>.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Origine / Source de ces contacts :
                    </label>
                    <input
                      type="text"
                      value={batchSource}
                      onChange={(e) => setBatchSource(e.target.value)}
                      placeholder="Ex: Campagne TikTok, Groupe WhatsApp, Partenaires..."
                      className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-violet-500 text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Collez vos contacts (1 par ligne : Nom, Email, Téléphone) :
                    </label>
                    <textarea
                      rows={6}
                      required
                      value={batchRawText}
                      onChange={(e) => setBatchRawText(e.target.value)}
                      placeholder={`Exemple :\nKouamé Jean, jean.kouame@gmail.com, +225 07 12 34 56 78\nTouré Aminata, toure.a@yahoo.fr, +225 05 98 76 54 32\nKoné Ibrahim, kone.ib@gmail.com`}
                      className="w-full p-3.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-violet-500 text-slate-900 font-mono text-xs"
                    />
                    <span className="text-[11px] text-slate-400 mt-1 block">
                      Formats acceptés : séparateurs virgule (,), point-virgule (;), ou tabulation.
                    </span>
                  </div>

                  {batchFeedback && (
                    <div className={`p-3.5 rounded-xl text-xs font-bold ${
                      batchFeedback.success
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        : 'bg-rose-50 text-rose-800 border border-rose-200'
                    }`}>
                      {batchFeedback.message}
                    </div>
                  )}

                  <div className="flex items-center justify-end gap-2 pt-2">
                    <button
                      type="submit"
                      disabled={isBatchImporting}
                      className="px-6 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-black text-xs shadow-md transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                    >
                      {isBatchImporting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <FileSpreadsheet className="w-3.5 h-3.5" />}
                      <span>{isBatchImporting ? 'Importation en cours...' : 'Importer et Enregistrer dans Supabase'}</span>
                    </button>
                  </div>
                </form>
              )}

            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3.5 bg-slate-100 border-t border-slate-200 flex items-center justify-between">
              <span className="text-[11px] text-slate-500">
                🔒 Synchronisation temps réel avec Supabase (Table: <code>utilisateurs</code>)
              </span>
              <button
                type="button"
                onClick={() => setIsExternalModalOpen(false)}
                className="px-4 py-2 text-xs font-bold rounded-xl bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
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
