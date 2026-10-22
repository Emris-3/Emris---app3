/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { SubscriptionRequest, SentEmailNotification, UserSession } from './types/subscription';
import { RegisteredUser, UserLoginEvent, WhatsAppNotification } from './types/adminControl';
import { 
  loadSubscriptions, 
  saveSubscriptions, 
  loadSentEmails, 
  saveSentEmails, 
  generateActivationEmail,
  generateTrialActivationEmail,
  loadUserSession,
  saveUserSession,
  loadIsAdminAuth,
  saveIsAdminAuth,
  loadRegisteredUsers,
  saveRegisteredUsers,
  loadUserLoginEvents,
  saveUserLoginEvents,
  recordUserConnection,
  validateRegisteredUser,
  deleteRegisteredUser,
  deleteSubscriptionRecord,
  loadWhatsAppAlerts,
  saveWhatsAppAlerts,
  addWhatsAppAlert
} from './services/storage';
import { centralSync } from './services/centralSyncService';
import { SUBSCRIPTION_CONFIG, FORMAT_FCFA, isAdminEmail } from './utils/constants';
import { Navbar } from './components/Navbar';
import { MrisCompanion } from './components/MrisCompanion';
import { UserAccountBadgeBottomLeft } from './components/UserAccountBadgeBottomLeft';
import avatarMaleImg from './assets/images/mris_assistant_avatar_1791391815061.jpg';
import { 
  CheckCircle, 
  Sparkles, 
  Lock, 
  LogIn, 
  UserPlus, 
  Clock, 
  ShieldCheck,
  Loader2
} from 'lucide-react';

// Lazy loading des vues secondaires : le bundle principal ne charge que le compagnon Emris pour une apparition instantanée à 100%
const ClientView = React.lazy(() => import('./components/ClientView').then(m => ({ default: m.ClientView })));
const AdminDashboard = React.lazy(() => import('./components/AdminDashboard').then(m => ({ default: m.AdminDashboard })));
const AutonomousHub = React.lazy(() => import('./components/AutonomousHub').then(m => ({ default: m.AutonomousHub })));
const LanguageTeacherHub = React.lazy(() => import('./components/LanguageTeacherHub').then(m => ({ default: m.LanguageTeacherHub })));
const CommercialAgentHub = React.lazy(() => import('./components/CommercialAgentHub').then(m => ({ default: m.CommercialAgentHub })));
const AssistantDrawer = React.lazy(() => import('./components/AssistantDrawer').then(m => ({ default: m.AssistantDrawer })));
const ReceiptModal = React.lazy(() => import('./components/ReceiptModal').then(m => ({ default: m.ReceiptModal })));
const EmailModal = React.lazy(() => import('./components/EmailModal').then(m => ({ default: m.EmailModal })));
const AuthModal = React.lazy(() => import('./components/AuthModal').then(m => ({ default: m.AuthModal })));

export default function App() {
  const [subscriptions, setSubscriptions] = useState<SubscriptionRequest[]>([]);
  const [sentEmails, setSentEmails] = useState<SentEmailNotification[]>([]);
  const [registeredUsers, setRegisteredUsers] = useState<RegisteredUser[]>([]);
  const [loginEvents, setLoginEvents] = useState<UserLoginEvent[]>([]);
  const [whatsAppAlerts, setWhatsAppAlerts] = useState<WhatsAppNotification[]>([]);
  const [currentView, setCurrentView] = useState<'client' | 'admin' | 'app_unlocked' | 'autonomous' | 'languages' | 'commercial'>('app_unlocked');
  
  // User Session & Admin Control state
  const [currentUser, setCurrentUser] = useState<UserSession | null>(() => {
    const saved = loadUserSession();
    if (saved) return saved;
    // Default initial user (owner Esther)
    return {
      userName: 'Camara Esther',
      userEmail: 'camaraesther920@gmail.com',
      userPhone: '+225 07 48 92 11 34',
      isAdmin: true
    };
  });

  const [isAdmin, setIsAdmin] = useState<boolean>(() => {
    const saved = loadIsAdminAuth();
    if (saved !== undefined && saved !== null) return saved;
    return true; // Default enabled for Esther on initial setup
  });

  // Modals state
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [selectedReceiptSub, setSelectedReceiptSub] = useState<SubscriptionRequest | null>(null);
  const [selectedEmail, setSelectedEmail] = useState<SentEmailNotification | null>(null);
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ title: string; desc: string; type: 'success' | 'info' } | null>(null);

  // Load persistent centralized data & listen for real-time mobile updates
  useEffect(() => {
    // Initial local cache
    const loadedSubs = loadSubscriptions();
    const loadedMails = loadSentEmails();
    const loadedUsers = loadRegisteredUsers();
    const loadedEvents = loadUserLoginEvents();
    const loadedAlerts = loadWhatsAppAlerts();
    setSubscriptions(loadedSubs);
    setSentEmails(loadedMails);
    setRegisteredUsers(loadedUsers);
    setLoginEvents(loadedEvents);
    setWhatsAppAlerts(loadedAlerts);

    // Synchronisation immédiate avec Supabase table utilisateurs
    centralSync.fetchDirectSupabaseUsers().catch(() => {});

    // Subscribe to central server updates (incoming registrations from mobile phones)
    const unsubscribe = centralSync.subscribe((syncState) => {
      if (syncState.subscriptions && syncState.subscriptions.length > 0) {
        setSubscriptions(syncState.subscriptions);
      }
      if (syncState.users && syncState.users.length > 0) {
        setRegisteredUsers(syncState.users);
      }
      if (syncState.events && syncState.events.length > 0) {
        setLoginEvents(syncState.events);
      }
      if (syncState.alerts && syncState.alerts.length > 0) {
        setWhatsAppAlerts(syncState.alerts);
      }
    });

    return () => unsubscribe();
  }, []);

  // Sync back to storage on change
  const updateSubscriptions = (newSubs: SubscriptionRequest[]) => {
    setSubscriptions(newSubs);
    saveSubscriptions(newSubs);
  };

  const updateEmails = (newEmails: SentEmailNotification[]) => {
    setSentEmails(newEmails);
    saveSentEmails(newEmails);
  };

  const showToast = (title: string, desc: string, type: 'success' | 'info' = 'success') => {
    setToastMessage({ title, desc, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 5000);
  };

  // Find the subscription request for the currently logged-in user
  const currentUserSubscription = subscriptions.find(
    s => s.userEmail.toLowerCase() === (currentUser?.userEmail || '').toLowerCase()
  ) || null;

  // Protect Admin View: If non-admin tries to access admin view, redirect
  useEffect(() => {
    if (currentView === 'admin' && !isAdmin) {
      setCurrentView('client');
      showToast('Accès restreint', 'Le tableau de bord administrateur est réservé exclusivement à Camara Esther.', 'info');
      setIsAuthModalOpen(true);
    }
  }, [currentView, isAdmin]);

  // Handler: Login / Register user
  const handleLoginUser = (user: UserSession, autoStartTrial: boolean = true) => {
    const isOwner = isAdminEmail(user.userEmail);
    const updatedUser: UserSession = {
      ...user,
      isAdmin: isOwner && isAdmin
    };

    setCurrentUser(updatedUser);
    saveUserSession(updatedUser);

    // Record live user connection for Admin Dashboard (both local cache and centralized cloud)
    const { users, events } = recordUserConnection(
      { userName: user.userName, userEmail: user.userEmail, userPhone: user.userPhone },
      'connexion',
      undefined,
      isOwner ? 'Connexion administratrice Camara Esther' : 'Connexion utilisateur client (mobile/web)'
    );
    setRegisteredUsers(users);
    setLoginEvents(events);

    // Register into central online store (so admin sees it immediately on their dashboard)
    centralSync.registerUserOnline(
      {
        userName: user.userName,
        userEmail: user.userEmail,
        userPhone: user.userPhone,
        plan: isOwner ? 'Essai 7j & Propriétaire' : 'Essai Gratuit 7 Jours'
      },
      'connexion',
      isOwner ? 'Connexion administratrice Camara Esther' : 'Connexion utilisateur client'
    ).catch(err => console.warn('Central registration warning:', err));

    // If user is owner, keep admin state, else disable admin state for other users
    if (!isOwner) {
      setIsAdmin(false);
      saveIsAdminAuth(false);
    }

    // Check if subscription already exists
    const existing = subscriptions.find(s => s.userEmail.toLowerCase() === user.userEmail.toLowerCase());

    if (autoStartTrial && (!existing || existing.status === 'rejected')) {
      handleActivateTrial(user.userName, user.userEmail, user.userPhone);
    } else {
      showToast(
        `Bienvenue ${user.userName.split(' ')[0]} !`,
        `Vous êtes connecté(e) avec l'adresse ${user.userEmail}.`,
        'success'
      );
      if (existing && (existing.status === 'active' || existing.status === 'trial' || existing.isTrial)) {
        setCurrentView('app_unlocked');
      } else {
        setCurrentView('client');
      }
    }
  };

  // Handler: Admin Unlock via Email and Password
  const handleAdminLogin = (emailInput: string, passwordInput: string): boolean => {
    const isEmailValid = isAdminEmail(emailInput);
    const isPasswordValid = passwordInput === SUBSCRIPTION_CONFIG.ADMIN_PASSWORD;

    if (isEmailValid && isPasswordValid) {
      setIsAdmin(true);
      saveIsAdminAuth(true);

      const ownerSession: UserSession = {
        userName: 'Camara Esther',
        userEmail: emailInput.trim().toLowerCase(),
        userPhone: '+225 07 48 92 11 34',
        isAdmin: true
      };
      setCurrentUser(ownerSession);
      saveUserSession(ownerSession);

      const { users, events } = recordUserConnection(
        { userName: 'Camara Esther', userEmail: emailInput.trim().toLowerCase(), userPhone: '+225 07 48 92 11 34' },
        'connexion',
        undefined,
        'Accès Déverrouillé : Espace Administratrice Camara Esther'
      );
      setRegisteredUsers(users);
      setLoginEvents(events);

      showToast(
        'Espace Administratrice Déverrouillé 👑',
        'Bonjour Esther ! Vous avez le contrôle total sur les utilisateurs, abonnements et paiements Wave.',
        'success'
      );
      setCurrentView('admin');
      return true;
    }
    return false;
  };

  // Handler: Logout
  const handleLogout = () => {
    setCurrentUser(null);
    saveUserSession(null);
    setIsAdmin(false);
    saveIsAdminAuth(false);
    setCurrentView('client');
    showToast('Déconnexion effectuée', 'Vous pouvez vous reconnecter à tout moment.', 'info');
  };

  // Handler: Lock Admin
  const handleLockAdmin = () => {
    setIsAdmin(false);
    saveIsAdminAuth(false);
    if (currentUser) {
      const regularUser: UserSession = {
        ...currentUser,
        isAdmin: false
      };
      setCurrentUser(regularUser);
      saveUserSession(regularUser);
    }
    setCurrentView('app_unlocked');
    showToast('Dashboard Admin verrouillé', 'Vos identifiants administrateur sont requis pour rouvrir cet espace.', 'info');
  };

  // Handler: Activate 7-day trial for user
  const handleActivateTrial = (name?: string, email?: string, phone?: string) => {
    const targetEmail = email || currentUser?.userEmail || 'nouveau.client@emris.ci';
    const targetName = name || currentUser?.userName || 'Client Emris';
    const targetPhone = phone || currentUser?.userPhone || '+225 07 00 00 00 00';

    const now = new Date();
    const trialDays = SUBSCRIPTION_CONFIG.TRIAL_DAYS || 7;
    const expiresAt = new Date(now.getTime() + 1000 * 60 * 60 * 24 * trialDays).toISOString();

    const existingIndex = subscriptions.findIndex(s => s.userEmail.toLowerCase() === targetEmail.toLowerCase());
    const existing = existingIndex >= 0 ? subscriptions[existingIndex] : null;

    const trialSub: SubscriptionRequest = {
      id: existing ? existing.id : 'trial-' + Date.now(),
      userName: targetName,
      userEmail: targetEmail,
      userPhone: targetPhone,
      planName: SUBSCRIPTION_CONFIG.TRIAL_PLAN_NAME,
      amount: 0,
      currency: 'FCFA',
      submissionDate: now.toISOString(),
      status: 'trial',
      isTrial: true,
      trialDurationDays: trialDays,
      receiptImage: existing?.receiptImage || '',
      receiptFileName: existing?.receiptFileName,
      waveTransactionId: existing?.waveTransactionId || ('TRIAL-7D-' + Math.floor(100000 + Math.random() * 900000)),
      activatedAt: now.toISOString(),
      expiresAt: expiresAt,
      emailSent: true,
      emailSentAt: now.toISOString(),
      notes: 'Essai gratuit de 7 jours activé sans engagement.'
    };

    let updated: SubscriptionRequest[];
    if (existingIndex >= 0) {
      updated = [...subscriptions];
      updated[existingIndex] = trialSub;
    } else {
      updated = [trialSub, ...subscriptions];
    }

    updateSubscriptions(updated);

    // Keep currentUser synced
    if (!currentUser || currentUser.userEmail.toLowerCase() !== targetEmail.toLowerCase()) {
      const newSession: UserSession = {
        userName: targetName,
        userEmail: targetEmail,
        userPhone: targetPhone,
        isAdmin: targetEmail.toLowerCase() === SUBSCRIPTION_CONFIG.ADMIN_EMAIL.toLowerCase() && isAdmin
      };
      setCurrentUser(newSession);
      saveUserSession(newSession);
    }

    // Generate automated trial welcome email
    const autoEmail = generateTrialActivationEmail(trialSub, expiresAt);
    const newEmails = [autoEmail, ...sentEmails];
    updateEmails(newEmails);

    // Record live user connection for Admin Dashboard
    const { users, events } = recordUserConnection(
      { userName: targetName, userEmail: targetEmail, userPhone: targetPhone },
      'essai_7j',
      undefined,
      'Activation de l\'essai gratuit de 7 jours (0 FCFA)'
    );
    setRegisteredUsers(users);
    setLoginEvents(events);

    // Sync online to central database and Supabase
    centralSync.registerUserOnline(
      { userName: targetName, userEmail: targetEmail, userPhone: targetPhone, plan: 'Essai Gratuit 7 Jours' },
      'essai_7j',
      'Activation de l\'essai gratuit de 7 jours'
    ).catch(err => console.warn(err));
    centralSync.submitSubscriptionOnline(trialSub).catch(err => console.warn(err));

    // Add WhatsApp notification
    const newAlert = addWhatsAppAlert(
      'trial_started',
      `Nouvel Essai 7 Jours : ${targetName}`,
      `🎁 Essai gratuit 7 jours activé pour ${targetName} (${targetPhone}). Valide jusqu'au ${new Date(expiresAt).toLocaleDateString('fr-FR')}.`
    );
    setWhatsAppAlerts(prev => [newAlert, ...prev]);

    showToast(
      `🎉 Essai gratuit de 7 jours activé !`,
      `Bienvenue ${targetName.split(' ')[0]} ! Accès complet à Emris débloqué jusqu'au ${new Date(expiresAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}.`,
      'success'
    );

    setCurrentView('app_unlocked');
  };

  // Handler: User submits new subscription request (Wave 35 000 FCFA)
  const handleSubmitSubscription = (newRequest: SubscriptionRequest) => {
    const existingIndex = subscriptions.findIndex(s => s.id === newRequest.id || s.userEmail.toLowerCase() === newRequest.userEmail.toLowerCase());
    let updated: SubscriptionRequest[];

    if (existingIndex >= 0) {
      updated = [...subscriptions];
      updated[existingIndex] = newRequest;
    } else {
      updated = [newRequest, ...subscriptions];
    }

    if (!currentUser || currentUser.userEmail.toLowerCase() !== newRequest.userEmail.toLowerCase()) {
      const newSession: UserSession = {
        userName: newRequest.userName,
        userEmail: newRequest.userEmail,
        userPhone: newRequest.userPhone,
        isAdmin: isAdminEmail(newRequest.userEmail) && isAdmin
      };
      setCurrentUser(newSession);
      saveUserSession(newSession);
    }

    // Record user connection & payment upload event
    const { users, events } = recordUserConnection(
      { userName: newRequest.userName, userEmail: newRequest.userEmail, userPhone: newRequest.userPhone },
      'paiement_wave',
      undefined,
      `Paiement Wave 35 000 FCFA soumis (Réf: ${newRequest.waveTransactionId || 'WAVE-CI'})`
    );
    setRegisteredUsers(users);
    setLoginEvents(events);

    // Sync online centrally to server and Supabase
    centralSync.submitSubscriptionOnline(newRequest).catch(err => console.warn(err));
    centralSync.registerUserOnline(
      { userName: newRequest.userName, userEmail: newRequest.userEmail, userPhone: newRequest.userPhone, plan: newRequest.planName },
      'paiement_wave',
      `Paiement Wave 35 000 FCFA soumis (Réf: ${newRequest.waveTransactionId || 'WAVE-CI'})`
    ).catch(err => console.warn(err));

    // Add WhatsApp alert for Esther
    const newAlert = addWhatsAppAlert(
      'new_payment',
      `Paiement Wave 35 000 FCFA : ${newRequest.userName}`,
      `🚨 ALERTE PAIEMENT WAVE : ${newRequest.userName} (${newRequest.userPhone}) a soumis un versement de 35 000 FCFA vers Béni Amar. Reçu téléversé, à valider sur le dashboard admin !`
    );
    setWhatsAppAlerts(prev => [newAlert, ...prev]);

    updateSubscriptions(updated);
    showToast(
      'Reçu Wave transmis (« En attente »)',
      `Votre paiement de 35 000 FCFA pour Béni Amar est enregistré. L'administratrice Camara Esther va valider votre accès.`,
      'info'
    );
  };

  // Handler: Administrator activates trial account
  const handleActivateTrialAccount = (id: string) => {
    const target = subscriptions.find(s => s.id === id);
    if (!target) return;

    const now = new Date();
    const trialDays = SUBSCRIPTION_CONFIG.TRIAL_DAYS || 7;
    const expiresAt = new Date(now.getTime() + 1000 * 60 * 60 * 24 * trialDays).toISOString();

    const updatedSub: SubscriptionRequest = {
      ...target,
      status: 'trial',
      isTrial: true,
      trialDurationDays: trialDays,
      planName: SUBSCRIPTION_CONFIG.TRIAL_PLAN_NAME,
      activatedAt: now.toISOString(),
      expiresAt: expiresAt,
      emailSent: true,
      emailSentAt: now.toISOString(),
      notes: 'Essai gratuit de 7 jours accordé par l\'administratrice.'
    };

    const updatedList = subscriptions.map(s => s.id === id ? updatedSub : s);
    updateSubscriptions(updatedList);

    const autoEmail = generateTrialActivationEmail(updatedSub, expiresAt);
    const newEmails = [autoEmail, ...sentEmails];
    updateEmails(newEmails);

    // Update registered users list
    setRegisteredUsers(prev => prev.map(u => {
      if (u.userEmail.toLowerCase() === target.userEmail.toLowerCase()) {
        return {
          ...u,
          accountStatus: 'validated',
          subscriptionPlan: 'Essai Gratuit 7 Jours',
          subscriptionStatus: 'trial'
        };
      }
      return u;
    }));

    // Central cloud sync
    centralSync.updateSubscriptionStatusOnline(id, 'trial');

    showToast(
      `Essai 7j accordé à ${target.userName}`,
      `L'utilisateur bénéficie désormais de 7 jours d'essai gratuit. Notification envoyée !`,
      'success'
    );
  };

  // Handler: Administrator activates account for 30 days
  const handleActivateAccount = (id: string) => {
    const target = subscriptions.find(s => s.id === id);
    if (!target) return;

    const now = new Date();
    const expiresAt = new Date(now.getTime() + 1000 * 60 * 60 * 24 * SUBSCRIPTION_CONFIG.DURATION_DAYS).toISOString();

    const updatedSub: SubscriptionRequest = {
      ...target,
      status: 'active',
      isTrial: false,
      amount: SUBSCRIPTION_CONFIG.AMOUNT_FCFA,
      planName: SUBSCRIPTION_CONFIG.PLAN_NAME,
      activatedAt: now.toISOString(),
      expiresAt: expiresAt,
      emailSent: true,
      emailSentAt: now.toISOString(),
      rejectionReason: undefined
    };

    const updatedList = subscriptions.map(s => s.id === id ? updatedSub : s);
    updateSubscriptions(updatedList);

    const autoEmail = generateActivationEmail(updatedSub, expiresAt);
    const newEmails = [autoEmail, ...sentEmails];
    updateEmails(newEmails);

    // Update registered user status
    setRegisteredUsers(prev => {
      const updated = prev.map(u => {
        if (u.userEmail.toLowerCase() === target.userEmail.toLowerCase()) {
          return {
            ...u,
            accountStatus: 'validated' as const,
            subscriptionPlan: 'Abonnement Mensuel 35 000 FCFA',
            subscriptionStatus: 'active' as const,
            paymentStatus: 'paid' as const,
            totalPaidFCFA: (u.totalPaidFCFA || 0) + SUBSCRIPTION_CONFIG.AMOUNT_FCFA
          };
        }
        return u;
      });
      saveRegisteredUsers(updated);
      return updated;
    });

    // Central cloud sync
    centralSync.updateSubscriptionStatusOnline(id, 'active');

    showToast(
      `Compte de ${target.userName} activé pour 30 jours !`,
      `Statut passé à « Actif ». Email de confirmation envoyé à ${target.userEmail}.`,
      'success'
    );
  };

  // Handler: Administrator rejects account
  const handleRejectAccount = (id: string, reason: string) => {
    const updatedList = subscriptions.map(s => {
      if (s.id === id) {
        return {
          ...s,
          status: 'rejected' as const,
          rejectionReason: reason
        };
      }
      return s;
    });
    updateSubscriptions(updatedList);
    centralSync.updateSubscriptionStatusOnline(id, 'rejected', reason);
    showToast(
      'Demande rejetée',
      `Le dossier a été marqué comme rejeté avec motif enregistré.`,
      'info'
    );
  };

  // Handler: Administrator extends account +30 days
  const handleExtendAccount = (id: string) => {
    const updatedList = subscriptions.map(s => {
      if (s.id === id) {
        const currentExp = s.expiresAt ? new Date(s.expiresAt) : new Date();
        const newExp = new Date(currentExp.getTime() + 1000 * 60 * 60 * 24 * 30).toISOString();
        return {
          ...s,
          expiresAt: newExp
        };
      }
      return s;
    });
    updateSubscriptions(updatedList);
    centralSync.updateSubscriptionStatusOnline(id, 'active', 'Prolongation +30 jours');
    showToast('Prolongation de 30 jours', 'Le compte a été prolongé avec succès de 30 jours supplémentaires.', 'success');
  };

  // Handler: Administrator deletes subscription request
  const handleDeleteSubscription = (id: string) => {
    const updated = deleteSubscriptionRecord(id);
    setSubscriptions(updated);
    centralSync.deleteSubscriptionOnline(id);
    showToast('Abonnement supprimé', 'L\'abonnement a été supprimé définitivement du tableau de bord.', 'info');
  };

  // Handler: Administrator validates registered user
  const handleValidateUser = (id: string) => {
    const updated = validateRegisteredUser(id);
    setRegisteredUsers(updated);
    centralSync.updateUserStatusOnline(id, 'validated');
    showToast('Utilisateur validé', 'Le compte utilisateur est désormais validé avec succès.', 'success');
  };

  // Handler: Administrator deletes registered user
  const handleDeleteUser = (id: string) => {
    const updated = deleteRegisteredUser(id);
    setRegisteredUsers(updated);
    centralSync.deleteUserOnline(id);
    showToast('Utilisateur supprimé', 'Le compte utilisateur a été supprimé de la base de données.', 'info');
  };

  const pendingCount = subscriptions.filter(s => s.status === 'pending').length;
  const activeCount = subscriptions.filter(s => s.status === 'active' || s.status === 'trial' || s.isTrial).length;
  const isOwnerSession = isAdminEmail(currentUser?.userEmail || '');
  const isCurrentTrial = Boolean(currentUserSubscription?.isTrial || currentUserSubscription?.status === 'trial');
  // Accès immédiat et instantané garanti au Compagnon Virtuel Emris dès l'ouverture (0ms d'attente)
  const hasAppAccess = true;

  return (
    <div className={`min-h-screen ${currentView === 'app_unlocked' ? 'h-[100dvh] overflow-hidden' : ''} bg-slate-50 text-slate-900 flex flex-col font-sans`}>
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-4 z-50 max-w-md bg-white border border-slate-200 rounded-2xl shadow-xl p-4 flex items-start gap-3 animate-fadeIn">
          <div className={`p-2 rounded-xl shrink-0 ${toastMessage.type === 'success' ? 'bg-emerald-100 text-emerald-700' : 'bg-sky-100 text-sky-700'}`}>
            <CheckCircle className="w-5 h-5" />
          </div>
          <div className="flex-1 text-xs">
            <h4 className="font-bold text-slate-900 text-sm">{toastMessage.title}</h4>
            <p className="text-slate-600 mt-0.5 leading-relaxed">{toastMessage.desc}</p>
          </div>
          <button
            onClick={() => setToastMessage(null)}
            className="text-slate-400 hover:text-slate-700 text-sm font-bold ml-1 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Navigation Header */}
      <Navbar
        currentView={currentView}
        onViewChange={(view) => {
          if (view === 'admin' && !isAdmin) {
            setIsAuthModalOpen(true);
            return;
          }
          setCurrentView(view);
        }}
        pendingCount={pendingCount}
        activeCount={activeCount}
        userStatus={currentUserSubscription?.status || 'none'}
        isTrial={isCurrentTrial}
        isAdmin={isAdmin}
        currentUser={currentUser}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
        onOpenAdminLogin={() => setIsAuthModalOpen(true)}
        onLogout={handleLogout}
      />

      {/* Sub-header Information Strip - Only on non-companion views to dedicate 100% viewport to chat */}
      {currentView !== 'app_unlocked' && (
        <div className="bg-slate-100/90 border-b border-slate-200/80 py-2 px-4 sm:px-8 text-xs text-slate-600 shrink-0">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="font-medium text-slate-500">Utilisateur actuel :</span>
              {currentUser ? (
                <span className="inline-flex items-center gap-1.5 font-bold text-slate-800 bg-white px-2.5 py-0.5 rounded-lg border border-slate-200 shadow-2xs">
                  <span>{currentUser.userName}</span>
                  <span className="text-[10px] text-slate-400 font-normal">({currentUser.userEmail})</span>
                  {isCurrentTrial && (
                    <span className="px-1.5 py-0.2 text-[10px] bg-amber-100 text-amber-800 rounded font-bold">
                      Essai 7j
                    </span>
                  )}
                  {currentUserSubscription?.status === 'active' && !isCurrentTrial && (
                    <span className="px-1.5 py-0.2 text-[10px] bg-emerald-100 text-emerald-800 rounded font-bold">
                      Actif 30j
                    </span>
                  )}
                </span>
              ) : (
                <button
                  onClick={() => setIsAuthModalOpen(true)}
                  className="text-sky-600 font-bold hover:underline cursor-pointer flex items-center gap-1"
                >
                  <LogIn className="w-3 h-3" /> Se connecter pour activer l'essai 7j
                </button>
              )}
            </div>

            <div className="flex items-center gap-3">
              {isAdmin && (
                <span className="text-[11px] font-bold text-amber-800 bg-amber-100/80 px-2 py-0.5 rounded border border-amber-300 flex items-center gap-1">
                  <span>👑 Administratrice :</span>
                  <span>Camara Esther</span>
                </span>
              )}
              <span className="text-[11px] text-slate-500">
                Formule : <strong className="text-slate-900">{isCurrentTrial ? 'Essai Gratuit 7j' : `${FORMAT_FCFA(SUBSCRIPTION_CONFIG.AMOUNT_FCFA)}/mois`}</strong>
              </span>
              <span>·</span>
              <span className="text-[11px] text-slate-500">
                Wave : <strong>{SUBSCRIPTION_CONFIG.MERCHANT_NAME}</strong>
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Main View Area: Expands to 100% viewport height and 0 padding on companion chat */}
      <main className={currentView === 'app_unlocked' ? "flex-1 min-h-0 flex flex-col w-full overflow-hidden p-0" : "flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-12"}>
        
        {/* Le compagnon virtuel Emris apparaît immédiatement sans aucun délai */}
        {currentView === 'app_unlocked' && (
          <MrisCompanion
            subscription={currentUserSubscription || {
              id: 'sub-owner-' + (currentUser?.userEmail || 'admin'),
              userName: currentUser?.userName || 'Camara Esther',
              userEmail: currentUser?.userEmail || 'camaraesther920@gmail.com',
              userPhone: currentUser?.userPhone || '+225 07 48 92 11 34',
              planName: isOwnerSession ? 'Propriétaire & Administrateur' : 'Essai Gratuit 7 Jours',
              amount: 35000,
              currency: 'FCFA',
              submissionDate: new Date().toISOString(),
              status: 'active',
              isTrial: false,
              receiptImage: '',
              activatedAt: new Date().toISOString(),
              notes: 'Accès débloqué instantané'
            }}
            onRenew={() => setCurrentView('client')}
            onOpenReceipt={() => currentUserSubscription && setSelectedReceiptSub(currentUserSubscription)}
            onOpenAutonomous={() => setCurrentView('autonomous')}
            onOpenLanguages={() => setCurrentView('languages')}
            onOpenCommercial={() => setCurrentView('commercial')}
          />
        )}

        {/* Vues secondaires chargées à la demande */}
        <React.Suspense fallback={
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-slate-500">
            <Loader2 className="w-8 h-8 animate-spin text-cyan-600 mb-3" />
            <p className="text-sm font-medium">Ouverture de l'espace...</p>
          </div>
        }>
          {currentView === 'languages' && (
            <LanguageTeacherHub
              onBackToCompanion={() => setCurrentView('app_unlocked')}
              userName={currentUser?.userName || 'Élève'}
            />
          )}

          {currentView === 'commercial' && (
            <CommercialAgentHub
              onBackToCompanion={() => setCurrentView('app_unlocked')}
              userEmail={currentUser?.userEmail}
              userName={currentUser?.userName}
            />
          )}

          {currentView === 'autonomous' && (
            <AutonomousHub
              onBackToCompanion={() => setCurrentView('app_unlocked')}
              userEmail={currentUser?.userEmail}
              userName={currentUser?.userName}
            />
          )}

          {currentView === 'client' && (
            <ClientView
              currentRequest={currentUserSubscription}
              currentUser={currentUser}
              onSubmitSubscription={handleSubmitSubscription}
              onActivateTrial={handleActivateTrial}
              onOpenAssistant={() => setIsAssistantOpen(true)}
              onViewReceipt={(req) => setSelectedReceiptSub(req)}
              onGoToUnlockedApp={() => setCurrentView('app_unlocked')}
              onOpenAuthModal={() => setIsAuthModalOpen(true)}
            />
          )}

          {currentView === 'admin' && isAdmin && (
            <AdminDashboard
              subscriptions={subscriptions}
              sentEmails={sentEmails}
              registeredUsers={registeredUsers}
              loginEvents={loginEvents}
              whatsAppAlerts={whatsAppAlerts}
              onActivateAccount={handleActivateAccount}
              onActivateTrialAccount={handleActivateTrialAccount}
              onRejectAccount={handleRejectAccount}
              onExtendAccount={handleExtendAccount}
              onDeleteSubscription={handleDeleteSubscription}
              onValidateUser={handleValidateUser}
              onDeleteUser={handleDeleteUser}
              onViewReceipt={(sub) => setSelectedReceiptSub(sub)}
              onViewEmail={(mail) => setSelectedEmail(mail)}
              onLockAdmin={handleLockAdmin}
            />
          )}
        </React.Suspense>

      </main>

      {/* Floating Action Button for Emris Assistant - only shown outside companion view */}
      {currentView !== 'app_unlocked' && (
        <button
          onClick={() => setIsAssistantOpen(true)}
          className="fixed bottom-6 right-6 z-40 flex items-center gap-2.5 px-4 py-3 rounded-full bg-slate-900 hover:bg-slate-800 text-white shadow-2xl border border-slate-700 transition-all hover:scale-105 group cursor-pointer"
          title="Ouvrir Emris le compagnon virtuel"
        >
          <div className="relative">
            <img
              src={avatarMaleImg}
              alt="Assistant Emris"
              className="w-7 h-7 rounded-full object-cover border border-cyan-400"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-slate-900" />
          </div>
          <span className="text-xs font-bold text-white pr-1">Emris Compagnon</span>
        </button>
      )}

      {/* User Account Widget strictly isolated at bottom-left - hide in full companion view to ensure zero overlap with bottom chat input */}
      {currentView !== 'app_unlocked' && (
        <UserAccountBadgeBottomLeft
          currentUser={currentUser}
          subscription={currentUserSubscription}
          isAdmin={isAdmin}
          onOpenAuthModal={() => setIsAuthModalOpen(true)}
          onLogout={handleLogout}
          onGoToSubscription={() => setCurrentView('client')}
          onGoToCompanion={() => setCurrentView('app_unlocked')}
          onViewReceipt={(sub) => setSelectedReceiptSub(sub)}
        />
      )}

      {/* Modals chargées à la demande avec Suspense */}
      <React.Suspense fallback={null}>
        {isAuthModalOpen && (
          <AuthModal
            isOpen={isAuthModalOpen}
            onClose={() => setIsAuthModalOpen(false)}
            currentUser={currentUser}
            isAdmin={isAdmin}
            onLoginUser={handleLoginUser}
            onAdminLogin={handleAdminLogin}
            onLogout={handleLogout}
            subscriptions={subscriptions}
          />
        )}

        {selectedReceiptSub && (
          <ReceiptModal
            subscription={selectedReceiptSub}
            onClose={() => setSelectedReceiptSub(null)}
            onActivate={handleActivateAccount}
            onReject={(id) => handleRejectAccount(id, 'Reçu illisible ou non conforme')}
            showAdminActions={currentView === 'admin' && isAdmin}
          />
        )}

        {selectedEmail && (
          <EmailModal
            email={selectedEmail}
            onClose={() => setSelectedEmail(null)}
          />
        )}

        {isAssistantOpen && (
          <AssistantDrawer
            isOpen={isAssistantOpen}
            onClose={() => setIsAssistantOpen(false)}
            subscriptionRequest={currentUserSubscription}
            onGoToWhatsApp={() => {
              window.open(SUBSCRIPTION_CONFIG.WHATSAPP_URL, '_blank');
            }}
          />
        )}
      </React.Suspense>

      {/* Footer */}
      <footer className="mt-16 border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>© {new Date().getFullYear()} emris le compagnon virtuel • Sage, psychologue & complice ivoirien • Marchand Wave : Béni Amar</p>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsAuthModalOpen(true)}
              className="text-slate-600 hover:text-slate-900 font-semibold cursor-pointer"
            >
              {currentUser ? `Mon Compte (${currentUser.userName})` : 'Connexion / Inscription'}
            </button>
            <span>·</span>
            <button
              onClick={() => {
                if (isAdmin) {
                  setCurrentView('admin');
                } else {
                  setIsAuthModalOpen(true);
                }
              }}
              className="text-slate-500 hover:text-amber-600 font-medium flex items-center gap-1 cursor-pointer"
            >
              <Lock className="w-3 h-3" />
              <span>{isAdmin ? '👑 Espace Admin' : 'Accès Administratrice'}</span>
            </button>
          </div>
        </div>
      </footer>

    </div>
  );
}
