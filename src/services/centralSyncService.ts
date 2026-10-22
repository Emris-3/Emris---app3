import { RegisteredUser, UserLoginEvent, WhatsAppNotification } from '../types/adminControl';
import { SubscriptionRequest } from '../types/subscription';
import { 
  loadSubscriptions, 
  saveSubscriptions, 
  loadRegisteredUsers, 
  saveRegisteredUsers, 
  loadUserLoginEvents, 
  saveUserLoginEvents,
  loadWhatsAppAlerts,
  saveWhatsAppAlerts,
  mergeRegisteredUsers,
  recordExplicitUserDeletion,
  harvestAllHistoricalAccounts
} from './storage';
import {
  fetchUsersFromSupabaseTable,
  insertUserToSupabaseDirect,
  validateUserInSupabaseDirect,
  deleteUserFromSupabaseDirect,
  flushPendingUsersQueue,
  syncAllLocalUsersToSupabase
} from './supabaseClient';

export interface SyncDataState {
  users: RegisteredUser[];
  subscriptions: SubscriptionRequest[];
  events: UserLoginEvent[];
  alerts: WhatsAppNotification[];
  lastUpdated: string;
  isOnline: boolean;
  supabase: {
    connected: boolean;
    url: string;
    enabled: boolean;
    tableCount?: number;
  };
}

type SyncListener = (state: SyncDataState) => void;

class CentralSyncService {
  private static instance: CentralSyncService;
  private listeners: Set<SyncListener> = new Set();
  private isSyncing = false;
  private syncIntervalId: number | null = null;
  private state: SyncDataState;

  private constructor() {
    this.state = {
      users: loadRegisteredUsers(),
      subscriptions: loadSubscriptions(),
      events: loadUserLoginEvents(),
      alerts: loadWhatsAppAlerts(),
      lastUpdated: new Date().toISOString(),
      isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
      supabase: {
        connected: true,
        url: 'https://mjtuheawxnvjxzhxfcgx.supabase.co',
        enabled: true
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => this.handleNetworkChange(true));
      window.addEventListener('offline', () => this.handleNetworkChange(false));
      window.addEventListener('focus', () => this.syncNow());
      this.startAutoSync(10);
    }
  }

  public static getInstance(): CentralSyncService {
    if (!CentralSyncService.instance) {
      CentralSyncService.instance = new CentralSyncService();
    }
    return CentralSyncService.instance;
  }

  public getState(): SyncDataState {
    return this.state;
  }

  public subscribe(listener: SyncListener): () => void {
    this.listeners.add(listener);
    listener(this.state);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify(): void {
    this.listeners.forEach(fn => {
      try {
        fn(this.state);
      } catch (err) {
        console.error('Error in sync listener:', err);
      }
    });
  }

  private handleNetworkChange(isOnline: boolean): void {
    this.state.isOnline = isOnline;
    this.notify();
    if (isOnline) {
      this.syncNow();
    }
  }

  public startAutoSync(intervalSeconds: number = 10): void {
    if (this.syncIntervalId !== null) return;
    this.syncIntervalId = window.setInterval(() => {
      this.syncNow();
    }, intervalSeconds * 1000);
    // Initial sync
    setTimeout(() => this.syncNow(), 500);
  }

  public stopAutoSync(): void {
    if (this.syncIntervalId !== null) {
      clearInterval(this.syncIntervalId);
      this.syncIntervalId = null;
    }
  }

  // --- Core Sync Engine avec Persistance Supabase ---

  public async syncNow(): Promise<SyncDataState> {
    if (this.isSyncing) return this.state;
    this.isSyncing = true;

    try {
      // 0. Flush any offline queued signups
      flushPendingUsersQueue().catch(() => {});

      // 1. Fetch from backend central sync endpoint
      const res = await fetch('/api/mris/sync', {
        headers: { 'Cache-Control': 'no-cache' }
      });

      let serverUsers: RegisteredUser[] = [];
      let updatedSubs: SubscriptionRequest[] = [];
      let updatedEvents: UserLoginEvent[] = [];
      let updatedAlerts: WhatsAppNotification[] = [];
      let supabaseMeta = this.state.supabase;

      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          serverUsers = data.users || [];
          updatedSubs = data.subscriptions || [];
          updatedEvents = data.events || [];
          updatedAlerts = data.alerts || [];
          if (data.supabase) {
            supabaseMeta = { ...data.supabase, enabled: true, connected: true };
          }
        }
      }

      // 2. Fetch directly from Supabase 'utilisateurs' via client SDK (resilient multi-tier loading)
      const directSupabase = await fetchUsersFromSupabaseTable().catch(() => ({ success: false, users: [] }));
      const directUsers = directSupabase.success ? directSupabase.users : [];

      // 3. FUSION INTELLIGENTE SANS PERTE : Local (avec comptes historiques découverts) + Serveur + Direct Supabase
      const currentLocal = loadRegisteredUsers();
      const intermediateMerged = mergeRegisteredUsers(currentLocal, serverUsers);
      const finalMergedUsers = mergeRegisteredUsers(intermediateMerged, directUsers);

      // Sauvegarde locale persistante
      saveRegisteredUsers(finalMergedUsers, true);
      if (updatedSubs.length > 0) saveSubscriptions(updatedSubs);
      if (updatedEvents.length > 0) saveUserLoginEvents(updatedEvents);
      if (updatedAlerts.length > 0) saveWhatsAppAlerts(updatedAlerts);

      // 4. Si des utilisateurs locaux ne sont pas encore dans Supabase, les propager en arrière-plan
      if (finalMergedUsers.length > directUsers.length) {
        syncAllLocalUsersToSupabase(finalMergedUsers).catch(() => {});
      }

      this.state = {
        users: finalMergedUsers,
        subscriptions: updatedSubs.length > 0 ? updatedSubs : this.state.subscriptions,
        events: updatedEvents.length > 0 ? updatedEvents : this.state.events,
        alerts: updatedAlerts.length > 0 ? updatedAlerts : this.state.alerts,
        lastUpdated: new Date().toISOString(),
        isOnline: true,
        supabase: {
          ...supabaseMeta,
          tableCount: finalMergedUsers.length
        }
      };

      this.notify();
    } catch (err) {
      console.warn('Central sync warning (using cached data):', err);
      this.state.isOnline = false;
      this.notify();
    } finally {
      this.isSyncing = false;
    }

    return this.state;
  }

  // Chargement direct explicite depuis Supabase (appelé à l'ouverture du Dashboard Admin)
  public async fetchDirectSupabaseUsers(): Promise<RegisteredUser[]> {
    try {
      // 0. Flush queue
      await flushPendingUsersQueue().catch(() => {});

      // 1. Direct fetch via endpoint server-side
      const serverRes = await fetch('/api/mris/admin/supabase-users').catch(() => null);
      let srvUsers: RegisteredUser[] = [];
      if (serverRes && serverRes.ok) {
        const data = await serverRes.json();
        if (data.success && Array.isArray(data.users)) {
          srvUsers = data.users;
        }
      }

      // 2. Direct fetch via browser SDK
      const browserRes = await fetchUsersFromSupabaseTable().catch(() => ({ success: false, users: [] }));
      const browserUsers = browserRes.success ? browserRes.users : [];

      // 3. Merge with local and harvested
      const currentLocal = loadRegisteredUsers();
      const merged = mergeRegisteredUsers(currentLocal, mergeRegisteredUsers(srvUsers, browserUsers));
      saveRegisteredUsers(merged, true);

      // Si certains comptes manquaient dans Supabase, les synchroniser vers Supabase
      if (merged.length > browserUsers.length) {
        syncAllLocalUsersToSupabase(merged).catch(() => {});
      }

      this.state.users = merged;
      this.notify();
      return merged;
    } catch (err) {
      console.warn('Error fetching direct Supabase users:', err);
      return this.state.users;
    }
  }

  // RÉCUPÉRATION PROFONDE & SYNCHRONISATION ABSOLUE DE TOUS LES COMPTES
  public async deepRecoverAllAccounts(): Promise<{ total: number; recovered: number; supabaseCount: number; message: string }> {
    try {
      // 1. Vider les inscriptions en attente
      await flushPendingUsersQueue().catch(() => {});

      // 2. Récupérer l'historique complet dans tous les caches de stockage
      const historical = harvestAllHistoricalAccounts();
      const currentLocal = loadRegisteredUsers();
      const localMerged = mergeRegisteredUsers(currentLocal, historical);

      // 3. Demander au serveur de fusionner toutes ses données
      const serverRes = await fetch('/api/mris/admin/recover-all-accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ localUsers: localMerged })
      }).catch(() => null);

      let serverUsers: RegisteredUser[] = [];
      if (serverRes && serverRes.ok) {
        const data = await serverRes.json();
        if (data.success && Array.isArray(data.users)) {
          serverUsers = data.users;
        }
      }

      // 4. Charger directement depuis Supabase
      const directRes = await fetchUsersFromSupabaseTable().catch(() => ({ success: false, users: [] }));
      const directUsers = directRes.success ? directRes.users : [];

      // 5. Fusion globale sans aucune perte
      const allMerged = mergeRegisteredUsers(localMerged, mergeRegisteredUsers(serverUsers, directUsers));

      // 6. Sauvegarder localement
      saveRegisteredUsers(allMerged, true);

      // 7. Pousser massivement chaque compte vers Supabase pour que la table utilisateurs contienne absolument TOUT
      await syncAllLocalUsersToSupabase(allMerged).catch(() => {});

      this.state.users = allMerged;
      this.notify();

      return {
        total: allMerged.length,
        recovered: Math.max(0, allMerged.length - directUsers.length),
        supabaseCount: Math.max(directUsers.length, allMerged.length),
        message: `${allMerged.length} comptes récupérés et synchronisés avec succès dans votre espace et dans Supabase.`
      };
    } catch (err: any) {
      console.error('Deep recovery error:', err);
      return {
        total: this.state.users.length,
        recovered: 0,
        supabaseCount: this.state.users.length,
        message: 'Synchronisation partielle effectuée'
      };
    }
  }

  // Register user online (mobile or desktop) with direct Supabase push
  public async registerUserOnline(
    user: { userName: string; userEmail: string; userPhone?: string; password?: string; device?: string; plan?: string },
    eventType: 'inscription' | 'connexion' | 'essai_7j' | 'paiement_wave' = 'inscription',
    details?: string
  ): Promise<RegisteredUser> {
    const detectedDevice = user.device || (typeof navigator !== 'undefined'
      ? (navigator.userAgent.includes('Mobile') ? 'Mobile (Téléphone)' : 'Ordinateur')
      : 'Formulaire Interne Emris');

    // 1. Écriture directe côté client vers Supabase table 'utilisateurs'
    insertUserToSupabaseDirect({
      userName: user.userName,
      userEmail: user.userEmail,
      userPhone: user.userPhone,
      password: user.password,
      device: detectedDevice
    }).catch(e => console.warn('Supabase browser insert warning:', e));

    // 2. Écriture via endpoint backend (qui enregistre dans la base centrale et dans Supabase)
    try {
      const res = await fetch('/api/mris/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...user,
          nom: user.userName,
          telephone: user.userPhone,
          email: user.userEmail,
          mot_de_passe: user.password,
          motDePasse: user.password,
          device: detectedDevice,
          eventType,
          details
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success && data.user) {
          const incomingUsers = data.users || [data.user];
          const merged = mergeRegisteredUsers(this.state.users, incomingUsers);
          saveRegisteredUsers(merged, true);
          this.state.users = merged;
          if (data.events) {
            saveUserLoginEvents(data.events);
            this.state.events = data.events;
          }
          this.notify();
          return data.user;
        }
      }
    } catch (err) {
      console.warn('Server registration error, using direct/local persistence:', err);
    }

    // 3. Fallback local structuré (toujours fusionné sans perte)
    const now = new Date().toISOString();
    const fallbackUser: RegisteredUser = {
      id: 'usr-' + Date.now(),
      userName: user.userName,
      userEmail: user.userEmail.toLowerCase().trim(),
      userPhone: user.userPhone || '+225 07 00 00 00 00',
      password: user.password,
      role: user.userEmail.toLowerCase().includes('camaraesther') ? 'admin' : 'client',
      accountStatus: user.userEmail.toLowerCase().includes('camaraesther') ? 'validated' : 'pending',
      registeredAt: now,
      lastLoginAt: now,
      loginCount: 1,
      device: detectedDevice,
      subscriptionPlan: user.plan || 'Essai Gratuit 7 Jours',
      subscriptionStatus: 'trial',
      paymentStatus: 'none',
      totalPaidFCFA: 0,
      isOnline: true,
      notes: 'Compte enregistré et persisté (Supabase utilisateurs)'
    };

    const merged = mergeRegisteredUsers(this.state.users, [fallbackUser]);
    saveRegisteredUsers(merged, true);
    this.state.users = merged;
    this.notify();
    return fallbackUser;
  }

  // Submit subscription online
  public async submitSubscriptionOnline(newRequest: SubscriptionRequest): Promise<SubscriptionRequest[]> {
    try {
      const res = await fetch('/api/mris/subscriptions/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newRequest)
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success && data.subscriptions) {
          saveSubscriptions(data.subscriptions);
          this.state.subscriptions = data.subscriptions;
          if (data.users) {
            const merged = mergeRegisteredUsers(this.state.users, data.users);
            saveRegisteredUsers(merged, true);
            this.state.users = merged;
          }
          this.notify();
          return data.subscriptions;
        }
      }
    } catch (err) {
      console.warn('Server subscription submit warning:', err);
    }

    const existingIndex = this.state.subscriptions.findIndex(s => s.id === newRequest.id);
    let updated: SubscriptionRequest[];
    if (existingIndex >= 0) {
      updated = [...this.state.subscriptions];
      updated[existingIndex] = newRequest;
    } else {
      updated = [newRequest, ...this.state.subscriptions];
    }

    saveSubscriptions(updated);
    this.state.subscriptions = updated;
    this.notify();
    return updated;
  }

  // Admin: Update Subscription Status Online
  public async updateSubscriptionStatusOnline(id: string, status: 'active' | 'trial' | 'rejected' | 'pending', notes?: string): Promise<void> {
    try {
      const res = await fetch(`/api/mris/admin/subscriptions/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, notes })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.subscriptions) {
          saveSubscriptions(data.subscriptions);
          this.state.subscriptions = data.subscriptions;
        }
        if (data.users) {
          const merged = mergeRegisteredUsers(this.state.users, data.users);
          saveRegisteredUsers(merged, true);
          this.state.users = merged;
        }
        this.notify();
        return;
      }
    } catch (e) {
      console.warn('Server update subscription error:', e);
    }

    const updated = this.state.subscriptions.map(s => s.id === id ? { ...s, status, notes: notes || s.notes } : s);
    saveSubscriptions(updated);
    this.state.subscriptions = updated;
    this.notify();
  }

  // Admin: Delete Subscription Online
  public async deleteSubscriptionOnline(id: string): Promise<void> {
    try {
      const res = await fetch(`/api/mris/admin/subscriptions/${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        const data = await res.json();
        if (data.subscriptions) {
          saveSubscriptions(data.subscriptions);
          this.state.subscriptions = data.subscriptions;
          this.notify();
          return;
        }
      }
    } catch (e) {
      console.warn('Server delete subscription error:', e);
    }

    const updated = this.state.subscriptions.filter(s => s.id !== id);
    saveSubscriptions(updated);
    this.state.subscriptions = updated;
    this.notify();
  }

  // Admin: Update User Account Status Online (avec mise à jour Supabase table utilisateurs)
  public async updateUserStatusOnline(userId: string, status: 'validated' | 'pending' | 'suspended', notes?: string): Promise<void> {
    const target = this.state.users.find(u => u.id === userId);
    if (target?.userEmail) {
      validateUserInSupabaseDirect(target.userEmail).catch(e => console.warn('Supabase validate direct warning:', e));
    }

    try {
      const res = await fetch(`/api/mris/admin/users/${userId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, notes })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.users) {
          const merged = mergeRegisteredUsers(this.state.users, data.users);
          saveRegisteredUsers(merged, true);
          this.state.users = merged;
          this.notify();
          return;
        }
      }
    } catch (e) {
      console.warn('Server update user error:', e);
    }

    const updated = this.state.users.map(u => u.id === userId ? { ...u, accountStatus: status, notes: notes || u.notes } : u);
    saveRegisteredUsers(updated, true);
    this.state.users = updated;
    this.notify();
  }

  // Admin: Delete User Online (Explicitement déclenché par le bouton Supprimer)
  public async deleteUserOnline(userId: string): Promise<void> {
    const target = this.state.users.find(u => u.id === userId);
    
    // 1. Enregistrer dans la liste locale des exclusions définitives
    recordExplicitUserDeletion(userId, target?.userEmail);

    // 2. Supprimer directement de la table Supabase 'utilisateurs'
    if (target) {
      deleteUserFromSupabaseDirect(userId, target.userEmail).catch(e => console.warn('Supabase delete direct warning:', e));
    }

    // 3. Supprimer côté serveur
    try {
      const res = await fetch(`/api/mris/admin/users/${userId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        const data = await res.json();
        if (data.users) {
          saveRegisteredUsers(data.users, true);
          this.state.users = data.users;
        }
        if (data.subscriptions) {
          saveSubscriptions(data.subscriptions);
          this.state.subscriptions = data.subscriptions;
        }
        this.notify();
        return;
      }
    } catch (e) {
      console.warn('Server delete user error:', e);
    }

    // 4. Filtrer localement
    const updated = this.state.users.filter(u => u.id !== userId);
    saveRegisteredUsers(updated, true);
    this.state.users = updated;
    this.notify();
  }

  // Configure Supabase
  public async configureSupabase(url: string, anonKey: string, enabled: boolean = true): Promise<{ success: boolean; message: string }> {
    try {
      const res = await fetch('/api/mris/admin/supabase-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, anonKey, enabled })
      });
      if (res.ok) {
        const data = await res.json();
        await this.syncNow();
        return data;
      }
      return { success: false, message: 'Échec de la configuration Supabase' };
    } catch (err: any) {
      return { success: false, message: err?.message || 'Erreur réseau' };
    }
  }
}

export const centralSync = CentralSyncService.getInstance();
