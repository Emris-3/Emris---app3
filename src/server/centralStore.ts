import fs from 'fs';
import path from 'path';
import { RegisteredUser, UserLoginEvent, WhatsAppNotification } from '../types/adminControl';
import { SubscriptionRequest } from '../types/subscription';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'mris_central_db.json');
const SUPABASE_CONFIG_FILE = path.join(DATA_DIR, 'supabase_config.json');
const DELETED_KEYS_FILE = path.join(DATA_DIR, 'deleted_users.json');

export interface CentralDatabaseState {
  registeredUsers: RegisteredUser[];
  subscriptions: SubscriptionRequest[];
  loginEvents: UserLoginEvent[];
  whatsAppAlerts: WhatsAppNotification[];
  lastUpdated: string;
}

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  enabled: boolean;
  usersTable?: string;
  subscriptionsTable?: string;
  eventsTable?: string;
}

class CentralStoreManager {
  private state: CentralDatabaseState;
  private supabaseConfig: SupabaseConfig | null = null;
  private supabaseClient: SupabaseClient | null = null;
  private deletedUserKeys: Set<string> = new Set();

  constructor() {
    this.ensureDataDir();
    this.loadDeletedKeys();
    this.state = this.loadState();
    this.loadSupabaseConfig();
    
    // Initial fetch from Supabase
    setTimeout(() => {
      this.fetchUsersFromSupabase().catch(() => {});
    }, 1000);
  }

  private ensureDataDir(): void {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
    } catch (err) {
      console.error('Failed to create data directory:', err);
    }
  }

  private loadDeletedKeys(): void {
    try {
      if (fs.existsSync(DELETED_KEYS_FILE)) {
        const raw = fs.readFileSync(DELETED_KEYS_FILE, 'utf-8');
        const arr = JSON.parse(raw);
        if (Array.isArray(arr)) {
          this.deletedUserKeys = new Set(arr);
        }
      }
    } catch {
      this.deletedUserKeys = new Set();
    }
  }

  private saveDeletedKeys(): void {
    try {
      this.ensureDataDir();
      fs.writeFileSync(DELETED_KEYS_FILE, JSON.stringify(Array.from(this.deletedUserKeys)), 'utf-8');
    } catch (err) {
      console.error('Failed to save deleted keys:', err);
    }
  }

  private getInitialSeed(): CentralDatabaseState {
    const now = new Date();
    return {
      registeredUsers: [],
      subscriptions: [],
      loginEvents: [],
      whatsAppAlerts: [],
      lastUpdated: now.toISOString()
    };
  }

  private loadState(): CentralDatabaseState {
    try {
      if (fs.existsSync(DB_FILE)) {
        const content = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(content);
        if (parsed && Array.isArray(parsed.registeredUsers)) {
          // Filtrer les comptes explicitement supprimés
          parsed.registeredUsers = parsed.registeredUsers.filter(
            (u: RegisteredUser) => !this.deletedUserKeys.has(u.id) && !this.deletedUserKeys.has(u.userEmail?.toLowerCase().trim())
          );
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Failed to read central DB file, fallback to seed:', e);
    }

    const seed = this.getInitialSeed();
    this.saveState(seed);
    return seed;
  }

  private saveState(state: CentralDatabaseState): void {
    try {
      this.ensureDataDir();
      state.lastUpdated = new Date().toISOString();
      fs.writeFileSync(DB_FILE, JSON.stringify(state, null, 2), 'utf-8');
      this.state = state;
    } catch (e) {
      console.error('Error saving central DB file:', e);
    }
  }

  private loadSupabaseConfig(): void {
    try {
      // 1. Environment variables
      const envUrl = process.env.SUPABASE_URL || 'https://mjtuheawxnvjxzhxfcgx.supabase.co';
      const envKey = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_KEY || 'sb_publishable_ukG6nkkTapfloUi6kT4xQg_tsrOuF5x';

      // 2. Local config file override if present
      let fileCfg: any = null;
      if (fs.existsSync(SUPABASE_CONFIG_FILE)) {
        const raw = fs.readFileSync(SUPABASE_CONFIG_FILE, 'utf-8');
        fileCfg = JSON.parse(raw);
      }

      const activeUrl = fileCfg?.url || envUrl;
      const activeKey = fileCfg?.anonKey || envKey;
      const usersTable = fileCfg?.usersTable || process.env.SUPABASE_USERS_TABLE || 'utilisateurs';
      const subscriptionsTable = fileCfg?.subscriptionsTable || process.env.SUPABASE_SUBSCRIPTIONS_TABLE || 'mris_subscriptions';

      this.initSupabaseClient({
        url: activeUrl,
        anonKey: activeKey,
        enabled: true,
        usersTable,
        subscriptionsTable
      });
    } catch (e) {
      console.warn('Supabase config not loaded or invalid:', e);
    }
  }

  private initSupabaseClient(config: SupabaseConfig): void {
    try {
      this.supabaseConfig = config;
      if (config.enabled && config.url && config.anonKey) {
        this.supabaseClient = createClient(config.url, config.anonKey, {
          auth: { persistSession: false }
        });
        console.log(`[Supabase] Client initialisé vers: ${config.url}`);
      } else {
        this.supabaseClient = null;
      }
    } catch (e) {
      console.error('[Supabase] Erreur d\'initialisation du client Supabase:', e);
      this.supabaseClient = null;
    }
  }

  public getSupabaseStatus(): { connected: boolean; url: string; enabled: boolean; table: string; userCount: number } {
    return {
      connected: this.supabaseClient !== null,
      url: this.supabaseConfig ? (this.supabaseConfig.url ? this.supabaseConfig.url.replace(/(https?:\/\/)(.{4}).+(.{4}\.)/, '$1$2***$3') : '') : '',
      enabled: Boolean(this.supabaseConfig?.enabled),
      table: this.supabaseConfig?.usersTable || 'utilisateurs',
      userCount: this.state.registeredUsers.length
    };
  }

  public async setSupabaseConfig(config: SupabaseConfig): Promise<{ success: boolean; message: string }> {
    try {
      this.ensureDataDir();
      fs.writeFileSync(SUPABASE_CONFIG_FILE, JSON.stringify(config, null, 2), 'utf-8');
      this.initSupabaseClient(config);

      if (this.supabaseClient) {
        await this.syncBidirectional();
        return { success: true, message: 'Client Supabase connecté et synchronisé avec succès !' };
      }
      return { success: true, message: 'Configuration enregistrée.' };
    } catch (err: any) {
      return { success: false, message: `Erreur de connexion Supabase: ${err?.message || err}` };
    }
  }

  // --- Lecture Directe depuis la table Supabase 'utilisateurs' ---
  public async fetchUsersFromSupabase(): Promise<{ success: boolean; users: RegisteredUser[]; error?: string }> {
    if (!this.supabaseClient || !this.supabaseConfig?.enabled) {
      return { success: false, users: this.state.registeredUsers, error: 'Client Supabase non activé' };
    }

    const table = this.supabaseConfig.usersTable || 'utilisateurs';
    try {
      const { data, error } = await this.supabaseClient
        .from(table)
        .select('*');

      if (error) {
        console.warn(`[Supabase] Erreur lecture table '${table}':`, error.message);
        return { success: false, users: this.state.registeredUsers, error: error.message };
      }

      if (Array.isArray(data) && data.length > 0) {
        const mappedUsers: RegisteredUser[] = data.map((row: any) => {
          const id = String(row.id || ('usr-' + Date.now()));
          const userName = String(row.nom || row.user_name || row.userName || row.name || 'Utilisateur').trim();
          const userEmail = String(row.email || row.user_email || row.userEmail || '').trim().toLowerCase();
          const userPhone = String(row.telephone || row.user_phone || row.userPhone || row.phone || '+225 07 00 00 00 00').trim();
          const password = String(row.mot_de_passe || row.password || row.motDePasse || '');
          const role = (row.role === 'admin' || userEmail === 'camaraesther920@gmail.com') ? 'admin' : 'client';
          
          let accountStatus: 'validated' | 'pending' | 'suspended' = 'pending';
          const rawStatus = String(row.account_status || row.accountStatus || row.status || '').toLowerCase();
          if (rawStatus === 'validated' || rawStatus === 'valide' || rawStatus === 'validé' || role === 'admin') {
            accountStatus = 'validated';
          }

          const registeredAt = String(row.registered_at || row.registeredAt || row.created_at || new Date().toISOString());
          const lastLoginAt = String(row.last_login_at || row.lastLoginAt || registeredAt);
          const subscriptionPlan = String(row.subscription_plan || row.subscriptionPlan || (role === 'admin' ? 'Propriétaire & Administrateur' : 'Essai Gratuit 7 Jours'));
          const subscriptionStatus = (row.subscription_status || (role === 'admin' ? 'active' : 'trial')) as any;
          const paymentStatus = (row.payment_status || 'none') as any;
          const totalPaidFCFA = Number(row.total_paid_fcfa || row.totalPaidFCFA || 0);
          const device = String(row.device || 'Formulaire Interne Emris');
          const notes = String(row.notes || (role === 'admin' ? 'Compte administratrice Esther' : 'Compte persistant Supabase'));

          return {
            id,
            userName,
            userEmail,
            userPhone,
            password,
            role,
            accountStatus,
            registeredAt,
            lastLoginAt,
            loginCount: Number(row.login_count || row.loginCount || 1),
            device,
            subscriptionPlan,
            subscriptionStatus,
            paymentStatus,
            totalPaidFCFA,
            isOnline: true,
            notes
          };
        });

        // FUSION SANS PERTE avec les utilisateurs locaux
        const userMap = new Map<string, RegisteredUser>();
        for (const u of this.state.registeredUsers) {
          const key = u.userEmail.toLowerCase().trim();
          if (!this.deletedUserKeys.has(u.id) && !this.deletedUserKeys.has(key)) {
            userMap.set(key, u);
          }
        }
        for (const u of mappedUsers) {
          const key = u.userEmail.toLowerCase().trim();
          if (this.deletedUserKeys.has(u.id) || this.deletedUserKeys.has(key)) {
            continue;
          }
          const existing = userMap.get(key);
          if (existing) {
            userMap.set(key, {
              ...existing,
              ...u,
              accountStatus: existing.accountStatus === 'validated' ? 'validated' : u.accountStatus,
              password: u.password || existing.password
            });
          } else {
            userMap.set(key, u);
          }
        }

        const mergedList = Array.from(userMap.values());
        this.state.registeredUsers = mergedList;
        this.saveState(this.state);
        return { success: true, users: mergedList };
      }

      return { success: true, users: this.state.registeredUsers };
    } catch (err: any) {
      console.warn(`[Supabase] Erreur fetch table '${table}':`, err?.message || err);
      return { success: false, users: this.state.registeredUsers, error: err?.message };
    }
  }

  // --- Insertion Directe dans Supabase 'utilisateurs' (Nom, Téléphone, Email, Mot de passe) ---
  public async insertUserToSupabaseUtilisateurs(user: RegisteredUser): Promise<{ success: boolean; message: string }> {
    if (!this.supabaseClient || !this.supabaseConfig?.enabled) {
      return { success: false, message: 'Client Supabase non activé' };
    }

    const table = this.supabaseConfig.usersTable || 'utilisateurs';

    try {
      // 1. Colonnes françaises exactes demandées par l'utilisatrice
      const frenchPayload = {
        id: user.id,
        nom: user.userName,
        telephone: user.userPhone || '+225 07 00 00 00 00',
        email: user.userEmail.toLowerCase().trim(),
        mot_de_passe: user.password || '',
        role: user.role || 'client',
        account_status: user.accountStatus || 'pending',
        subscription_plan: user.subscriptionPlan || 'Essai Gratuit 7 Jours',
        subscription_status: user.subscriptionStatus || 'trial',
        device: user.device || 'Formulaire Interne Emris',
        registered_at: user.registeredAt || new Date().toISOString(),
        last_login_at: user.lastLoginAt || new Date().toISOString()
      };

      const res1 = await this.supabaseClient.from(table).upsert([frenchPayload], { onConflict: 'email' });
      if (!res1.error) {
        console.log(`[Supabase] Inscription synchronisée avec succès dans '${table}' pour ${user.userEmail}`);
        return { success: true, message: `Enregistré dans la table Supabase '${table}'` };
      }

      // 2. Si colonnes minimales
      const minimalPayload = {
        nom: user.userName,
        telephone: user.userPhone || '+225 07 00 00 00 00',
        email: user.userEmail.toLowerCase().trim(),
        mot_de_passe: user.password || ''
      };

      const res2 = await this.supabaseClient.from(table).insert([minimalPayload]);
      if (!res2.error) {
        return { success: true, message: `Enregistré dans la table Supabase '${table}' (champs de base)` };
      }

      console.warn(`[Supabase] Résultat table '${table}':`, res1.error?.message || res2.error?.message);
      return { success: false, message: res1.error?.message || res2.error?.message || 'Erreur insertion Supabase' };
    } catch (err: any) {
      console.warn(`[Supabase] Erreur insertion dans '${table}':`, err?.message || err);
      return { success: false, message: err?.message || 'Erreur Supabase' };
    }
  }

  // --- Synchronisation Bidirectionnelle Complète ---
  public async syncBidirectional(): Promise<void> {
    if (!this.supabaseClient || !this.supabaseConfig?.enabled) return;

    try {
      // 1. Lire depuis Supabase
      await this.fetchUsersFromSupabase();

      // 2. Écrire vers Supabase les utilisateurs locaux manquants
      for (const u of this.state.registeredUsers) {
        if (!this.deletedUserKeys.has(u.id) && !this.deletedUserKeys.has(u.userEmail.toLowerCase().trim())) {
          await this.insertUserToSupabaseUtilisateurs(u).catch(() => {});
        }
      }

      // 3. Synchroniser abonnements
      const subscriptionsTable = this.supabaseConfig.subscriptionsTable || 'mris_subscriptions';
      const subsPayload = this.state.subscriptions.map(s => ({
        id: s.id,
        user_name: s.userName,
        user_email: s.userEmail,
        user_phone: s.userPhone,
        plan_name: s.planName,
        amount: s.amount,
        status: s.status,
        wave_transaction_id: s.waveTransactionId || '',
        expires_at: s.expiresAt || '',
        activated_at: s.activatedAt || '',
        is_trial: Boolean(s.isTrial),
        submission_date: s.submissionDate
      }));
      try {
        await this.supabaseClient.from(subscriptionsTable).upsert(subsPayload, { onConflict: 'id' });
      } catch {
        // ignore background error
      }
    } catch (err) {
      console.warn('[Supabase Sync] Warning during background sync:', err);
    }
  }

  public async syncToSupabase(): Promise<void> {
    return this.syncBidirectional();
  }

  // --- Public API Methods ---

  public getState(): CentralDatabaseState {
    return this.state;
  }

  public authenticateUser(email: string, password?: string): { success: boolean; user?: RegisteredUser; isOwner: boolean; message: string } {
    const emailLower = email.trim().toLowerCase();
    const isOwner = emailLower === 'camaraesther920@gmail.com';
    const found = this.state.registeredUsers.find(u => u.userEmail.toLowerCase() === emailLower);

    if (found) {
      if (password && found.password && found.password !== password) {
        return { success: false, isOwner, message: 'Mot de passe incorrect.' };
      }
      return { success: true, user: found, isOwner, message: 'Connexion réussie.' };
    }

    return { success: false, isOwner, message: 'Aucun compte trouvé avec cette adresse email.' };
  }

  public registerOrUpdateUser(
    user: { userName: string; userEmail: string; userPhone?: string; password?: string; device?: string; plan?: string },
    eventType: 'inscription' | 'connexion' | 'essai_7j' | 'paiement_wave' = 'inscription',
    details?: string
  ): { user: RegisteredUser; state: CentralDatabaseState } {
    const emailLower = user.userEmail.trim().toLowerCase();
    const now = new Date().toISOString();
    const device = user.device || 'Formulaire Interne Emris';

    // Si l'utilisateur avait été supprimé précédemment, retirer des exclusions car il se réinscrit
    this.deletedUserKeys.delete(emailLower);
    this.saveDeletedKeys();

    const users = [...this.state.registeredUsers];
    const existingIndex = users.findIndex(u => u.userEmail.toLowerCase() === emailLower);

    let registeredUser: RegisteredUser;
    const isOwner = emailLower === 'camaraesther920@gmail.com';

    if (existingIndex >= 0) {
      const existing = users[existingIndex];
      registeredUser = {
        ...existing,
        userName: user.userName || existing.userName,
        userPhone: user.userPhone || existing.userPhone,
        password: user.password || existing.password,
        lastLoginAt: now,
        loginCount: (existing.loginCount || 1) + 1,
        device: device,
        isOnline: true,
        subscriptionPlan: user.plan || existing.subscriptionPlan
      };
      users[existingIndex] = registeredUser;
    } else {
      registeredUser = {
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
        subscriptionPlan: user.plan || 'Essai Gratuit 7 Jours',
        subscriptionStatus: 'trial',
        paymentStatus: 'none',
        totalPaidFCFA: 0,
        isOnline: true,
        notes: `Compte enregistré en ligne via formulaire interne (table Supabase utilisateurs)`
      };
      users.unshift(registeredUser);
    }

    const newEvent: UserLoginEvent = {
      id: 'evt-' + Date.now(),
      userName: user.userName,
      userEmail: emailLower,
      userPhone: user.userPhone || '+225 07 00 00 00 00',
      timestamp: now,
      eventType: eventType,
      device: device,
      status: 'reussie',
      details: details || `Nouvelle activité enregistrée sur le serveur centralisé`
    };

    const events = [newEvent, ...this.state.loginEvents].slice(0, 50);

    const newState: CentralDatabaseState = {
      ...this.state,
      registeredUsers: users,
      loginEvents: events,
      lastUpdated: now
    };

    this.saveState(newState);
    this.insertUserToSupabaseUtilisateurs(registeredUser).catch(() => {});

    return { user: registeredUser, state: newState };
  }

  public recordConnectionEvent(
    data: { userName: string; userEmail: string; userPhone?: string; eventType?: any; device?: string; details?: string }
  ): CentralDatabaseState {
    const { state } = this.registerOrUpdateUser(
      {
        userName: data.userName,
        userEmail: data.userEmail,
        userPhone: data.userPhone,
        device: data.device
      },
      data.eventType || 'connexion',
      data.details
    );
    return state;
  }

  public submitSubscription(newRequest: SubscriptionRequest): CentralDatabaseState {
    const subscriptions = [...this.state.subscriptions];
    const existingIndex = subscriptions.findIndex(
      s => s.id === newRequest.id || s.userEmail.toLowerCase() === newRequest.userEmail.toLowerCase()
    );

    if (existingIndex >= 0) {
      subscriptions[existingIndex] = newRequest;
    } else {
      subscriptions.unshift(newRequest);
    }

    const users = [...this.state.registeredUsers];
    const userIndex = users.findIndex(u => u.userEmail.toLowerCase() === newRequest.userEmail.toLowerCase());
    if (userIndex >= 0) {
      users[userIndex] = {
        ...users[userIndex],
        subscriptionPlan: newRequest.planName,
        subscriptionStatus: newRequest.status as any,
        paymentStatus: newRequest.status === 'active' ? 'paid' : (newRequest.status === 'pending' ? 'pending' : 'none'),
        totalPaidFCFA: newRequest.status === 'active' ? (newRequest.amount || 35000) : users[userIndex].totalPaidFCFA
      };
    }

    const newState: CentralDatabaseState = {
      ...this.state,
      subscriptions,
      registeredUsers: users,
      lastUpdated: new Date().toISOString()
    };

    this.saveState(newState);
    this.syncToSupabase().catch(() => {});
    return newState;
  }

  public updateSubscriptionStatus(id: string, status: 'active' | 'trial' | 'rejected' | 'pending', notes?: string): CentralDatabaseState {
    const subscriptions = this.state.subscriptions.map(s => {
      if (s.id === id) {
        const now = new Date();
        const activatedAt = status === 'active' ? now.toISOString() : s.activatedAt;
        const expiresAt = status === 'active' 
          ? new Date(now.getTime() + 1000 * 60 * 60 * 24 * 30).toISOString()
          : (status === 'trial' ? new Date(now.getTime() + 1000 * 60 * 60 * 24 * 7).toISOString() : s.expiresAt);

        return {
          ...s,
          status,
          isTrial: status === 'trial',
          activatedAt,
          expiresAt,
          notes: notes || s.notes
        };
      }
      return s;
    });

    const targetSub = subscriptions.find(s => s.id === id);
    let users = [...this.state.registeredUsers];
    if (targetSub) {
      users = users.map(u => {
        if (u.userEmail.toLowerCase() === targetSub.userEmail.toLowerCase()) {
          return {
            ...u,
            subscriptionStatus: status as any,
            paymentStatus: status === 'active' ? 'paid' : 'pending',
            totalPaidFCFA: status === 'active' ? (targetSub.amount || 35000) : u.totalPaidFCFA
          };
        }
        return u;
      });
    }

    const newState: CentralDatabaseState = {
      ...this.state,
      subscriptions,
      registeredUsers: users,
      lastUpdated: new Date().toISOString()
    };

    this.saveState(newState);
    this.syncToSupabase().catch(() => {});
    return newState;
  }

  public updateUserAccountStatus(userId: string, status: 'validated' | 'pending' | 'suspended', notes?: string): CentralDatabaseState {
    const users = this.state.registeredUsers.map(u => {
      if (u.id === userId) {
        return {
          ...u,
          accountStatus: status,
          notes: notes || u.notes
        };
      }
      return u;
    });

    const target = this.state.registeredUsers.find(u => u.id === userId);
    if (target && this.supabaseClient && this.supabaseConfig?.enabled) {
      const table = this.supabaseConfig.usersTable || 'utilisateurs';
      this.supabaseClient
        .from(table)
        .update({ account_status: status })
        .eq('email', target.userEmail.toLowerCase().trim())
        .then(() => {}, () => {});
    }

    const newState: CentralDatabaseState = {
      ...this.state,
      registeredUsers: users,
      lastUpdated: new Date().toISOString()
    };

    this.saveState(newState);
    return newState;
  }

  // Deletion explicite : Seul le bouton Supprimer peut appeler cette fonction
  public deleteUser(userId: string): CentralDatabaseState {
    const target = this.state.registeredUsers.find(u => u.id === userId);
    
    // Mémoriser définitivement pour ne pas réimporter
    if (userId) this.deletedUserKeys.add(userId);
    if (target?.userEmail) this.deletedUserKeys.add(target.userEmail.toLowerCase().trim());
    this.saveDeletedKeys();

    const users = this.state.registeredUsers.filter(u => u.id !== userId);
    let subscriptions = [...this.state.subscriptions];

    if (target) {
      subscriptions = subscriptions.filter(s => s.userEmail.toLowerCase() !== target.userEmail.toLowerCase());
      
      if (this.supabaseClient && this.supabaseConfig?.enabled) {
        const table = this.supabaseConfig.usersTable || 'utilisateurs';
        this.supabaseClient
          .from(table)
          .delete()
          .or(`id.eq.${userId},email.eq.${target.userEmail.toLowerCase().trim()}`)
          .then(() => {}, () => {});
      }
    }

    const newState: CentralDatabaseState = {
      ...this.state,
      registeredUsers: users,
      subscriptions,
      lastUpdated: new Date().toISOString()
    };

    this.saveState(newState);
    return newState;
  }

  public deleteSubscription(subId: string): CentralDatabaseState {
    const subscriptions = this.state.subscriptions.filter(s => s.id !== subId);

    const newState: CentralDatabaseState = {
      ...this.state,
      subscriptions,
      lastUpdated: new Date().toISOString()
    };

    this.saveState(newState);
    return newState;
  }
}

export const centralStore = new CentralStoreManager();
