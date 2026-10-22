import { SubscriptionRequest, SentEmailNotification, UserSession } from '../types/subscription';
import { RegisteredUser, UserLoginEvent, WhatsAppNotification } from '../types/adminControl';
import { SUBSCRIPTION_CONFIG } from '../utils/constants';
import { generateRealisticWaveReceipt } from '../utils/receiptGenerator';

const STORAGE_KEYS = {
  SUBSCRIPTIONS: 'mris_subscriptions_v5',
  SENT_EMAILS: 'mris_sent_emails_v5',
  ACTIVE_USER_EMAIL: 'mris_active_user_email_v5',
  USER_SESSION: 'mris_user_session_v5',
  ADMIN_AUTH: 'mris_admin_authenticated_v5',
  REGISTERED_USERS: 'mris_registered_users_v5',
  LOGIN_EVENTS: 'mris_login_events_v5',
  WHATSAPP_ALERTS: 'mris_whatsapp_alerts_v5',
  DELETED_USERS: 'mris_deleted_users_v5'
};

export function getInitialSubscriptions(): SubscriptionRequest[] {
  // Tableau de bord 100% vierge au premier démarrage (zéro donnée simulée ou fictive)
  return [];
}

export function loadSubscriptions(): SubscriptionRequest[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SUBSCRIPTIONS);
    if (!raw) {
      const initial = getInitialSubscriptions();
      saveSubscriptions(initial);
      return initial;
    }
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveSubscriptions(subscriptions: SubscriptionRequest[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.SUBSCRIPTIONS, JSON.stringify(subscriptions));
  } catch (err) {
    console.error('Failed to save subscriptions to localStorage', err);
  }
}

export function loadSentEmails(): SentEmailNotification[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SENT_EMAILS);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveSentEmails(emails: SentEmailNotification[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.SENT_EMAILS, JSON.stringify(emails));
  } catch (err) {
    console.error('Failed to save emails to localStorage', err);
  }
}

export function generateActivationEmail(subscription: SubscriptionRequest, expiresAt: string): SentEmailNotification {
  const expiryDate = new Date(expiresAt).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden;">
      <div style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); padding: 32px 24px; text-align: center; color: #ffffff;">
        <h1 style="margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px;">M-Ris Platform</h1>
        <p style="margin: 8px 0 0; color: #94a3b8; font-size: 14px;">Confirmation d'Activation de votre Abonnement Premium</p>
      </div>

      <div style="padding: 32px 24px; color: #334155;">
        <h2 style="color: #0f172a; font-size: 20px; margin-top: 0;">Félicitations ${subscription.userName} ! 🎉</h2>
        <p style="line-height: 1.6; font-size: 15px;">
          Votre paiement de <strong>35 000 FCFA</strong> effectué via <strong>Wave Business</strong> pour <strong>Béni Amar</strong> a été validé avec succès par notre équipe administrative.
        </p>

        <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 20px; margin: 24px 0;">
          <h3 style="margin: 0 0 12px; color: #166534; font-size: 16px; font-weight: 700;">Détails de votre accès M-Ris</h3>
          <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
            <tr>
              <td style="padding: 6px 0; color: #64748b;">Plan souscrit :</td>
              <td style="padding: 6px 0; font-weight: bold; text-align: right; color: #0f172a;">${subscription.planName}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #64748b;">Durée d'accès :</td>
              <td style="padding: 6px 0; font-weight: bold; text-align: right; color: #16a34a;">30 Jours d'accès illimité</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #64748b;">Date d'expiration :</td>
              <td style="padding: 6px 0; font-weight: bold; text-align: right; color: #0f172a;">${expiryDate}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #64748b;">Marchand Wave :</td>
              <td style="padding: 6px 0; font-weight: bold; text-align: right; color: #0f172a;">Béni Amar</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #64748b;">Réf. Transaction :</td>
              <td style="padding: 6px 0; font-family: monospace; text-align: right; color: #0f172a;">${subscription.waveTransactionId || 'WAVE-CI-VAL'}</td>
            </tr>
          </table>
        </div>

        <p style="font-size: 14px; line-height: 1.6;">
          Tous les modules exclusifs et outils de l'application M-Ris sont désormais débloqués pour votre compte.
        </p>

        <div style="text-align: center; margin: 32px 0;">
          <a href="#" style="background: #00B2FF; color: #ffffff; text-decoration: none; font-weight: bold; padding: 14px 28px; border-radius: 8px; display: inline-block; font-size: 15px;">
            Accéder à mon Espace M-Ris
          </a>
        </div>

        <div style="border-top: 1px solid #e2e8f0; padding-top: 20px; margin-top: 32px; font-size: 13px; color: #64748b; line-height: 1.5;">
          <p style="margin: 0 0 8px;">Une question ou besoin d'assistance ? Notre support WhatsApp est disponible 7j/7 :</p>
          <a href="${SUBSCRIPTION_CONFIG.WHATSAPP_URL}" style="color: #25d366; text-decoration: none; font-weight: 600;">
            💬 Contacter l'assistance WhatsApp M-Ris
          </a>
        </div>
      </div>

      <div style="background: #f8fafc; padding: 16px 24px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0;">
        © M-Ris • Abonnements et Solutions Métiers • Côte d'Ivoire
      </div>
    </div>
  `;

  return {
    id: 'mail-' + Date.now(),
    requestId: subscription.id,
    toEmail: subscription.userEmail,
    toName: subscription.userName,
    subject: `🎉 Confirmation : Votre abonnement M-Ris Premium (30 jours) est activé !`,
    sentAt: new Date().toISOString(),
    expiresAt,
    htmlContent: html
  };
}

export function generateTrialActivationEmail(subscription: SubscriptionRequest, expiresAt: string): SentEmailNotification {
  const expiryDate = new Date(expiresAt).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden;">
      <div style="background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%); padding: 32px 24px; text-align: center; color: #ffffff;">
        <h1 style="margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px;">M-Ris Platform</h1>
        <p style="margin: 8px 0 0; color: #e0f2fe; font-size: 14px;">Activation de votre Essai Gratuit de 7 Jours</p>
      </div>

      <div style="padding: 32px 24px; color: #334155;">
        <h2 style="color: #0f172a; font-size: 20px; margin-top: 0;">Bienvenue ${subscription.userName} ! 🚀</h2>
        <p style="line-height: 1.6; font-size: 15px;">
          Votre <strong>essai gratuit de 7 jours</strong> a été activé avec succès sur la plateforme M-Ris sans aucun prélèvement ni carte bancaire.
        </p>

        <div style="background: #f0f9ff; border: 1px solid #bae6fd; border-radius: 8px; padding: 20px; margin: 24px 0;">
          <h3 style="margin: 0 0 12px; color: #0369a1; font-size: 16px; font-weight: 700;">Détails de votre Essai Gratuit</h3>
          <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
            <tr>
              <td style="padding: 6px 0; color: #64748b;">Formule :</td>
              <td style="padding: 6px 0; font-weight: bold; text-align: right; color: #0f172a;">Essai Gratuit M-Ris</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #64748b;">Durée accordée :</td>
              <td style="padding: 6px 0; font-weight: bold; text-align: right; color: #0284c7;">7 Jours d'accès complet</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #64748b;">Date de fin d'essai :</td>
              <td style="padding: 6px 0; font-weight: bold; text-align: right; color: #0f172a;">${expiryDate}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #64748b;">Tarif après l'essai :</td>
              <td style="padding: 6px 0; font-weight: bold; text-align: right; color: #0f172a;">35 000 FCFA / mois (Wave)</td>
            </tr>
          </table>
        </div>

        <p style="font-size: 14px; line-height: 1.6;">
          Découvrez l'ensemble de nos modules : Observatoire UEMOA, Rapports Stratégiques et Support VIP dès maintenant.
        </p>

        <div style="border-top: 1px solid #e2e8f0; padding-top: 20px; margin-top: 32px; font-size: 13px; color: #64748b; line-height: 1.5;">
          <p style="margin: 0 0 8px;">Besoin d'aide ou souhaitez activer votre abonnement complet à 35 000 FCFA par Wave ?</p>
          <a href="${SUBSCRIPTION_CONFIG.WHATSAPP_URL}" style="color: #25d366; text-decoration: none; font-weight: 600;">
            💬 Contacter l'assistance WhatsApp M-Ris
          </a>
        </div>
      </div>

      <div style="background: #f8fafc; padding: 16px 24px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0;">
        © M-Ris • Abonnements et Solutions Métiers • Côte d'Ivoire
      </div>
    </div>
  `;

  return {
    id: 'mail-trial-' + Date.now(),
    requestId: subscription.id,
    toEmail: subscription.userEmail,
    toName: subscription.userName,
    subject: `🚀 Bienvenue : Votre essai gratuit de 7 jours M-Ris est activé !`,
    sentAt: new Date().toISOString(),
    expiresAt,
    htmlContent: html
  };
}

export function loadUserSession(): UserSession | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.USER_SESSION);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function saveUserSession(session: UserSession | null): void {
  try {
    if (!session) {
      localStorage.removeItem(STORAGE_KEYS.USER_SESSION);
    } else {
      localStorage.setItem(STORAGE_KEYS.USER_SESSION, JSON.stringify(session));
    }
  } catch (err) {
    console.error('Failed to save user session', err);
  }
}

export function loadIsAdminAuth(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEYS.ADMIN_AUTH) === 'true';
  } catch {
    return false;
  }
}

export function saveIsAdminAuth(isAuth: boolean): void {
  try {
    if (isAuth) {
      localStorage.setItem(STORAGE_KEYS.ADMIN_AUTH, 'true');
    } else {
      localStorage.removeItem(STORAGE_KEYS.ADMIN_AUTH);
    }
  } catch (err) {
    console.error('Failed to save admin auth', err);
  }
}

// =========================================================================
// =========================================================================
// REGISTERED USERS & CONNECTION TRACKING (QUI SE CONNECTE)
// Avec persistance absolue : aucun compte ne disparaît sans clic 'Supprimer'
// =========================================================================

export function getExplicitlyDeletedUserKeys(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.DELETED_USERS);
    if (!raw) return new Set();
    const arr = JSON.parse(raw);
    return new Set(Array.isArray(arr) ? arr : []);
  } catch {
    return new Set();
  }
}

export function recordExplicitUserDeletion(id: string, email?: string): void {
  try {
    const set = getExplicitlyDeletedUserKeys();
    if (id) set.add(id);
    if (email) set.add(email.trim().toLowerCase());
    localStorage.setItem(STORAGE_KEYS.DELETED_USERS, JSON.stringify(Array.from(set)));
  } catch (err) {
    console.error('Failed to record user deletion:', err);
  }
}

// Fusionne intelligemment deux listes sans JAMAIS écraser ou perdre d'utilisateurs
export function mergeRegisteredUsers(
  currentUsers: RegisteredUser[],
  newUsers: RegisteredUser[]
): RegisteredUser[] {
  const deletedKeys = getExplicitlyDeletedUserKeys();
  const map = new Map<string, RegisteredUser>();

  // 1. Conserver tous les utilisateurs actuels non supprimés explicitement
  for (const u of currentUsers) {
    if (!u || !u.userEmail) continue;
    const emailKey = u.userEmail.trim().toLowerCase();
    if (deletedKeys.has(u.id) || deletedKeys.has(emailKey)) {
      continue;
    }
    map.set(emailKey, u);
  }

  // 2. Ajouter ou mettre à jour avec les nouveaux utilisateurs
  for (const u of newUsers) {
    if (!u || !u.userEmail) continue;
    const emailKey = u.userEmail.trim().toLowerCase();
    if (deletedKeys.has(u.id) || deletedKeys.has(emailKey)) {
      continue;
    }
    const existing = map.get(emailKey);
    if (existing) {
      // Conserver les statuts validés et informations clés
      map.set(emailKey, {
        ...existing,
        ...u,
        id: existing.id || u.id,
        userName: u.userName || existing.userName,
        userPhone: u.userPhone || existing.userPhone,
        password: u.password || existing.password,
        accountStatus: (existing.accountStatus === 'validated' || u.accountStatus === 'validated') ? 'validated' : u.accountStatus,
        subscriptionPlan: existing.subscriptionPlan !== 'En attente' ? existing.subscriptionPlan : u.subscriptionPlan,
        subscriptionStatus: existing.subscriptionStatus !== 'none' ? existing.subscriptionStatus : u.subscriptionStatus,
        loginCount: Math.max(existing.loginCount || 1, u.loginCount || 1),
        lastLoginAt: u.lastLoginAt || existing.lastLoginAt,
        registeredAt: existing.registeredAt || u.registeredAt
      });
    } else {
      map.set(emailKey, u);
    }
  }

  return Array.from(map.values());
}

export function getInitialRegisteredUsers(): RegisteredUser[] {
  return [];
}

export function loadRegisteredUsers(): RegisteredUser[] {
  try {
    let current: RegisteredUser[] = [];
    const raw = localStorage.getItem(STORAGE_KEYS.REGISTERED_USERS);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) current = parsed;
      } catch {
        current = [];
      }
    }

    // Récupérer et fusionner tous les comptes historiques passés découverts
    const harvested = harvestAllHistoricalAccounts();
    const merged = mergeRegisteredUsers(current, harvested);

    // Si de nouveaux comptes ont été découverts lors de la récupération, mettre à jour le stockage
    if (merged.length > current.length) {
      try {
        localStorage.setItem(STORAGE_KEYS.REGISTERED_USERS, JSON.stringify(merged));
      } catch {
        // ignore
      }
    }

    const deletedKeys = getExplicitlyDeletedUserKeys();
    return merged.filter(u => !deletedKeys.has(u.id) && !deletedKeys.has(u.userEmail?.trim().toLowerCase()));
  } catch {
    return [];
  }
}

export function saveRegisteredUsers(users: RegisteredUser[], force: boolean = false): void {
  try {
    const deletedKeys = getExplicitlyDeletedUserKeys();
    const filtered = (users || []).filter(u => u && !deletedKeys.has(u.id) && !deletedKeys.has(u.userEmail?.trim().toLowerCase()));
    
    // Protection anti-effacement accidentel : ne pas écraser une liste existante avec une liste vide sans 'force'
    if (filtered.length === 0 && !force) {
      const existing = loadRegisteredUsers();
      if (existing.length > 0) {
        return; // Ne pas effacer les utilisateurs existants
      }
    }

    localStorage.setItem(STORAGE_KEYS.REGISTERED_USERS, JSON.stringify(filtered));
  } catch (err) {
    console.error('Failed to save registered users', err);
  }
}

// =========================================================================
// HISTORICAL ACCOUNT HARVESTER (RÉCUPÉRATEUR HISTORIQUE MULTI-CLÉS)
// Récupère automatiquement les comptes de toutes les versions précédentes :
// v1, v2, v3, v4, v5, local_users_backup, standalone, sessions et abonnements
// =========================================================================

export function harvestAllHistoricalAccounts(): RegisteredUser[] {
  if (typeof window === 'undefined' || !window.localStorage) {
    return [];
  }

  const deletedKeys = getExplicitlyDeletedUserKeys();
  const recoveredMap = new Map<string, RegisteredUser>();

  const candidateKeys = [
    'mris_registered_users_v5',
    'mris_registered_users_v4',
    'mris_registered_users_v3',
    'mris_registered_users_v2',
    'mris_registered_users_v1',
    'mris_registered_users',
    'mris_users',
    'mris_all_users_archive',
    'emris_local_users_backup',
    'emris_current_user',
    'mris_standalone_user',
    'mris_user_session',
    'mris_user_session_v5',
    'mris_pending_users_queue'
  ];

  const now = new Date().toISOString();

  // 1. Scanner chaque clé candidate
  for (const key of candidateKeys) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      const parsed = JSON.parse(raw);

      const items = Array.isArray(parsed) ? parsed : [parsed];
      for (const item of items) {
        if (!item) continue;
        const rawEmail = item.userEmail || item.email || item.toEmail || item.user_email;
        if (!rawEmail || typeof rawEmail !== 'string') continue;
        const emailLower = rawEmail.trim().toLowerCase();
        if (!emailLower.includes('@')) continue;

        if (deletedKeys.has(item.id) || deletedKeys.has(emailLower)) {
          continue;
        }

        const rawName = item.userName || item.nom || item.name || item.toName || item.user_name || emailLower.split('@')[0];
        const rawPhone = item.userPhone || item.telephone || item.phone || item.user_phone || '+225 07 00 00 00 00';
        const rawPassword = item.password || item.mot_de_passe || item.motDePasse || '';
        const isOwner = emailLower === 'camaraesther920@gmail.com';

        const user: RegisteredUser = {
          id: String(item.id || ('usr-recov-' + Date.now() + '-' + Math.floor(Math.random() * 1000))),
          userName: String(rawName).trim(),
          userEmail: emailLower,
          userPhone: String(rawPhone).trim(),
          password: String(rawPassword),
          role: isOwner ? 'admin' : (item.role || 'client'),
          accountStatus: isOwner ? 'validated' : (item.accountStatus || item.account_status || 'pending'),
          registeredAt: item.registeredAt || item.registered_at || item.created_at || now,
          lastLoginAt: item.lastLoginAt || item.last_login_at || now,
          loginCount: Number(item.loginCount || item.login_count || 1),
          device: item.device || 'Récupération Historique LocalStorage',
          subscriptionPlan: isOwner ? 'Propriétaire & Administrateur' : (item.subscriptionPlan || item.subscription_plan || item.planName || 'Essai Gratuit 7 Jours'),
          subscriptionStatus: isOwner ? 'active' : (item.subscriptionStatus || item.subscription_status || 'trial'),
          paymentStatus: item.paymentStatus || item.payment_status || 'none',
          totalPaidFCFA: Number(item.totalPaidFCFA || item.total_paid_fcfa || 0),
          isOnline: true,
          notes: item.notes || (isOwner ? 'Compte administratrice Esther' : 'Compte historique récupéré')
        };

        if (!recoveredMap.has(emailLower)) {
          recoveredMap.set(emailLower, user);
        } else {
          // Fusionner en conservant les données les plus complètes
          const existing = recoveredMap.get(emailLower)!;
          recoveredMap.set(emailLower, {
            ...existing,
            ...user,
            id: existing.id || user.id,
            userName: existing.userName || user.userName,
            userPhone: (existing.userPhone && !existing.userPhone.includes('00 00 00 00')) ? existing.userPhone : user.userPhone,
            password: existing.password || user.password,
            accountStatus: (existing.accountStatus === 'validated' || user.accountStatus === 'validated') ? 'validated' : 'pending'
          });
        }
      }
    } catch {
      // Ignorer les erreurs de parsing individuelles
    }
  }

  // 2. Extraire également les utilisateurs des demandes d'abonnements et essais gratuits existants
  const subKeys = ['mris_subscriptions_v5', 'mris_subscriptions_v4', 'mris_subscriptions'];
  for (const sKey of subKeys) {
    try {
      const rawSubs = localStorage.getItem(sKey);
      if (!rawSubs) continue;
      const parsedSubs = JSON.parse(rawSubs);
      if (Array.isArray(parsedSubs)) {
        for (const s of parsedSubs) {
          if (!s || !s.userEmail) continue;
          const emailLower = String(s.userEmail).trim().toLowerCase();
          if (!emailLower.includes('@') || deletedKeys.has(emailLower)) continue;

          const isOwner = emailLower === 'camaraesther920@gmail.com';
          if (!recoveredMap.has(emailLower)) {
            recoveredMap.set(emailLower, {
              id: 'usr-sub-' + (s.id || Date.now()),
              userName: s.userName || emailLower.split('@')[0],
              userEmail: emailLower,
              userPhone: s.userPhone || '+225 07 00 00 00 00',
              password: '',
              role: isOwner ? 'admin' : 'client',
              accountStatus: (isOwner || s.status === 'active') ? 'validated' : 'pending',
              registeredAt: s.submissionDate || now,
              lastLoginAt: s.submissionDate || now,
              loginCount: 1,
              device: 'Formulaire Abonnement / Essai',
              subscriptionPlan: isOwner ? 'Propriétaire & Administrateur' : (s.planName || (s.isTrial ? 'Essai Gratuit 7 Jours' : 'Abonnement 30 Jours')),
              subscriptionStatus: s.isTrial ? 'trial' : (s.status === 'active' ? 'active' : 'trial'),
              paymentStatus: s.status === 'active' ? 'paid' : (s.waveTransactionId ? 'pending' : 'none'),
              totalPaidFCFA: s.status === 'active' ? (s.amount || 35000) : 0,
              isOnline: true,
              notes: 'Compte extrait d\'une demande d\'abonnement'
            });
          }
        }
      }
    } catch {
      // ignore
    }
  }

  return Array.from(recoveredMap.values());
}

export function getInitialUserLoginEvents(): UserLoginEvent[] {
  return [];
}

export function loadUserLoginEvents(): UserLoginEvent[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.LOGIN_EVENTS);
    if (!raw) {
      const initial = getInitialUserLoginEvents();
      saveUserLoginEvents(initial);
      return initial;
    }
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveUserLoginEvents(events: UserLoginEvent[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.LOGIN_EVENTS, JSON.stringify(events));
  } catch (err) {
    console.error('Failed to save login events', err);
  }
}

export function recordUserConnection(
  user: { userName: string; userEmail: string; userPhone?: string; password?: string },
  eventType: 'connexion' | 'inscription' | 'essai_7j' | 'paiement_wave' | 'session_active',
  deviceInfo?: string,
  details?: string
): { users: RegisteredUser[]; events: UserLoginEvent[] } {
  const users = loadRegisteredUsers();
  const events = loadUserLoginEvents();
  const now = new Date().toISOString();
  const device = deviceInfo || (typeof navigator !== 'undefined' ? (navigator.userAgent.includes('Mobile') ? 'Mobile' : 'Ordinateur') : 'Navigateur Web');

  // Find or create registered user
  const emailLower = user.userEmail.toLowerCase().trim();
  const existingIndex = users.findIndex(u => u.userEmail.toLowerCase().trim() === emailLower);
  
  if (existingIndex >= 0) {
    const existing = users[existingIndex];
    users[existingIndex] = {
      ...existing,
      userName: user.userName || existing.userName,
      userPhone: user.userPhone || existing.userPhone,
      password: user.password || existing.password,
      lastLoginAt: now,
      loginCount: (existing.loginCount || 1) + 1,
      device: device,
      isOnline: true
    };
  } else {
    const isOwner = emailLower === SUBSCRIPTION_CONFIG.ADMIN_EMAIL.toLowerCase();
    const newUser: RegisteredUser = {
      id: 'usr-' + Date.now(),
      userName: user.userName,
      userEmail: emailLower,
      userPhone: user.userPhone || '+225 07 00 00 00 00',
      password: user.password,
      role: isOwner ? 'admin' : 'client',
      accountStatus: isOwner ? 'validated' : 'pending',
      registeredAt: now,
      lastLoginAt: now,
      loginCount: 1,
      device: device,
      subscriptionPlan: isOwner ? 'Propriétaire & Administrateur' : 'Essai Gratuit 7 Jours',
      subscriptionStatus: isOwner ? 'active' : 'trial',
      paymentStatus: 'none',
      totalPaidFCFA: 0,
      isOnline: true,
      notes: isOwner ? 'Compte administratrice Esther' : 'Nouvel utilisateur inscrit (Supabase)'
    };
    users.unshift(newUser);
  }

  saveRegisteredUsers(users, true);

  // Add event log
  const newEvent: UserLoginEvent = {
    id: 'evt-' + Date.now(),
    userName: user.userName,
    userEmail: user.userEmail,
    userPhone: user.userPhone || '+225 07 00 00 00 00',
    timestamp: now,
    eventType,
    device,
    status: 'reussie',
    details: details || `Action ${eventType} enregistrée avec succès`
  };
  events.unshift(newEvent);
  const trimmedEvents = events.slice(0, 100);
  saveUserLoginEvents(trimmedEvents);

  return { users, events: trimmedEvents };
}

// Validation & Deletion Helpers demandés par l'utilisatrice:
// "je veux qu'il y ait un bouton de validation et de suppression"
// "Aucun compte validé ou en attente ne doit disparaître de la liste tant que l'administrateur (moi) ne clique pas explicitement sur le bouton 'Supprimer'"
export function validateRegisteredUser(userId: string): RegisteredUser[] {
  const users = loadRegisteredUsers();
  const updated = users.map(u => {
    if (u.id === userId) {
      return {
        ...u,
        accountStatus: 'validated' as const,
        notes: (u.notes ? u.notes + ' • ' : '') + 'Validé par l\'administrateur'
      };
    }
    return u;
  });
  saveRegisteredUsers(updated, true);
  return updated;
}

export function deleteRegisteredUser(userId: string): RegisteredUser[] {
  const users = loadRegisteredUsers();
  const target = users.find(u => u.id === userId);
  
  // Enregistrer la suppression explicite
  recordExplicitUserDeletion(userId, target?.userEmail);

  const filtered = users.filter(u => u.id !== userId);
  saveRegisteredUsers(filtered, true);
  return filtered;
}

export function deleteSubscriptionRecord(subscriptionId: string): SubscriptionRequest[] {
  const subs = loadSubscriptions();
  const filtered = subs.filter(s => s.id !== subscriptionId);
  saveSubscriptions(filtered);
  return filtered;
}

// =========================================================================
// WHATSAPP NOTIFICATION DISPATCH (https://wa.me/message/RGXYT5LWDCTAM1)
// =========================================================================

export const OFFICIAL_WHATSAPP_LINK = 'https://wa.me/message/RGXYT5LWDCTAM1';

export function buildWhatsAppLink(text: string): string {
  return `${OFFICIAL_WHATSAPP_LINK}?text=${encodeURIComponent(text)}`;
}

export function getInitialWhatsAppAlerts(): WhatsAppNotification[] {
  // Aucune fausse alerte au premier démarrage
  return [];
}

export function loadWhatsAppAlerts(): WhatsAppNotification[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.WHATSAPP_ALERTS);
    if (!raw) {
      const initial = getInitialWhatsAppAlerts();
      saveWhatsAppAlerts(initial);
      return initial;
    }
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveWhatsAppAlerts(alerts: WhatsAppNotification[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.WHATSAPP_ALERTS, JSON.stringify(alerts));
  } catch (err) {
    console.error('Failed to save whatsapp alerts', err);
  }
}

export function addWhatsAppAlert(
  type: WhatsAppNotification['type'],
  title: string,
  message: string
): WhatsAppNotification {
  const alerts = loadWhatsAppAlerts();
  const alert: WhatsAppNotification = {
    id: 'wa-' + Date.now(),
    type,
    title,
    message,
    timestamp: new Date().toISOString(),
    sent: false,
    whatsappUrl: buildWhatsAppLink(message)
  };
  alerts.unshift(alert);
  saveWhatsAppAlerts(alerts.slice(0, 50));
  return alert;
}


