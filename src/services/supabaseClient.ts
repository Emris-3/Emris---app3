import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { RegisteredUser } from '../types/adminControl';

// Default Supabase configuration for Emris application
export const DEFAULT_SUPABASE_URL = 'https://mjtuheawxnvjxzhxfcgx.supabase.co';
export const DEFAULT_SUPABASE_ANON_KEY = 'sb_publishable_ukG6nkkTapfloUi6kT4xQg_tsrOuF5x';
export const SUPABASE_USERS_TABLE = 'utilisateurs';

// Full SQL Schema for the user's Supabase SQL Editor
export const SUPABASE_SQL_CREATE_TABLE = `-- =========================================================
-- Script SQL Officiel pour la table 'utilisateurs' dans Supabase
-- Exécutez ce script dans votre Supabase Dashboard > SQL Editor
-- =========================================================

CREATE TABLE IF NOT EXISTS public.utilisateurs (
  id TEXT PRIMARY KEY DEFAULT ('usr-' || floor(extract(epoch from now()) * 1000)::text),
  nom TEXT NOT NULL,
  telephone TEXT,
  email TEXT UNIQUE NOT NULL,
  mot_de_passe TEXT,
  role TEXT DEFAULT 'client',
  account_status TEXT DEFAULT 'pending',
  subscription_plan TEXT DEFAULT 'Essai Gratuit 7 Jours',
  subscription_status TEXT DEFAULT 'trial',
  payment_status TEXT DEFAULT 'none',
  total_paid_fcfa NUMERIC DEFAULT 0,
  device TEXT DEFAULT 'Formulaire Interne Emris',
  notes TEXT,
  registered_at TIMESTAMPTZ DEFAULT NOW(),
  last_login_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Désactiver ou configurer la politique RLS pour autoriser la lecture et l'écriture anonyme
ALTER TABLE public.utilisateurs ENABLE ROW LEVEL SECURITY;

-- Autoriser la lecture publique/anonyme (pour le tableau de bord administrateur)
CREATE POLICY IF NOT EXISTS "Lecture publique utilisateurs"
  ON public.utilisateurs FOR SELECT
  USING (true);

-- Autoriser l'insertion directe depuis le formulaire d'inscription
CREATE POLICY IF NOT EXISTS "Insertion formulaire utilisateurs"
  ON public.utilisateurs FOR INSERT
  WITH CHECK (true);

-- Autoriser la modification (validation du compte par l'admin)
CREATE POLICY IF NOT EXISTS "Modification utilisateurs"
  ON public.utilisateurs FOR UPDATE
  USING (true);

-- Autoriser la suppression explicite (bouton supprimer de l'admin)
CREATE POLICY IF NOT EXISTS "Suppression utilisateurs"
  ON public.utilisateurs FOR DELETE
  USING (true);
`;

let browserClient: SupabaseClient | null = null;

export function getSupabaseBrowserClient(): SupabaseClient {
  if (!browserClient) {
    let url = DEFAULT_SUPABASE_URL;
    let key = DEFAULT_SUPABASE_ANON_KEY;

    try {
      const stored = localStorage.getItem('mris_supabase_custom_cfg');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.url && parsed.anonKey) {
          url = parsed.url;
          key = parsed.anonKey;
        }
      }
    } catch {
      // ignore
    }

    browserClient = createClient(url, key, {
      auth: { persistSession: false }
    });
  }
  return browserClient;
}

export function resetSupabaseBrowserClient(url: string, key: string) {
  try {
    localStorage.setItem('mris_supabase_custom_cfg', JSON.stringify({ url, anonKey: key }));
  } catch {
    // ignore
  }
  browserClient = createClient(url, key, {
    auth: { persistSession: false }
  });
}

// Convert any row from Supabase 'utilisateurs' to RegisteredUser
export function mapSupabaseRowToRegisteredUser(row: any): RegisteredUser {
  const id = String(row.id || ('usr-' + Date.now()));
  const userName = String(row.nom || row.user_name || row.userName || row.name || 'Utilisateur').trim();
  const userEmail = String(row.email || row.user_email || row.userEmail || '').trim().toLowerCase();
  const userPhone = String(row.telephone || row.user_phone || row.userPhone || row.phone || '+225 07 00 00 00 00').trim();
  const password = String(row.mot_de_passe || row.password || row.motDePasse || '');
  const role = (row.role === 'admin' || userEmail === 'camaraesther920@gmail.com') ? 'admin' : 'client';
  
  // Status mapping
  let accountStatus: 'validated' | 'pending' | 'suspended' = 'pending';
  const rawStatus = String(row.account_status || row.accountStatus || row.status || '').toLowerCase();
  if (rawStatus === 'validated' || rawStatus === 'valide' || rawStatus === 'validé' || role === 'admin') {
    accountStatus = 'validated';
  } else if (rawStatus === 'suspended' || rawStatus === 'suspendu') {
    accountStatus = 'suspended';
  }

  const registeredAt = String(row.registered_at || row.registeredAt || row.created_at || new Date().toISOString());
  const lastLoginAt = String(row.last_login_at || row.lastLoginAt || registeredAt);
  const subscriptionPlan = String(row.subscription_plan || row.subscriptionPlan || (role === 'admin' ? 'Propriétaire & Administrateur' : 'Essai Gratuit 7 Jours'));
  const subscriptionStatus = (row.subscription_status || (role === 'admin' ? 'active' : 'trial')) as any;
  const paymentStatus = (row.payment_status || 'none') as any;
  const totalPaidFCFA = Number(row.total_paid_fcfa || row.totalPaidFCFA || 0);
  const device = String(row.device || 'Formulaire Interne Emris');
  const notes = String(row.notes || (role === 'admin' ? 'Compte administratrice Esther' : 'Inscrit via table Supabase utilisateurs'));

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
}

// Direct fetch from Supabase table 'utilisateurs'
export async function fetchUsersFromSupabaseTable(): Promise<{ success: boolean; users: RegisteredUser[]; error?: string }> {
  try {
    const client = getSupabaseBrowserClient();
    const { data, error } = await client
      .from(SUPABASE_USERS_TABLE)
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('[Supabase Direct] Erreur lecture table utilisateurs:', error.message);
      return { success: false, users: [], error: error.message };
    }

    if (!Array.isArray(data)) {
      return { success: true, users: [] };
    }

    const users = data.map(mapSupabaseRowToRegisteredUser);
    return { success: true, users };
  } catch (err: any) {
    console.warn('[Supabase Direct] Exception lecture:', err);
    return { success: false, users: [], error: err?.message || 'Erreur inconnue' };
  }
}

// Direct insert/upsert to Supabase table 'utilisateurs'
export async function insertUserToSupabaseDirect(user: {
  id?: string;
  userName: string;
  userEmail: string;
  userPhone?: string;
  password?: string;
  role?: string;
  device?: string;
}): Promise<{ success: boolean; message: string; error?: string }> {
  try {
    const client = getSupabaseBrowserClient();
    const id = user.id || ('usr-' + Date.now());
    const now = new Date().toISOString();

    // 1. Try French columns (Nom, Téléphone, adresse mail, Mot de passe)
    const frenchPayload = {
      id,
      nom: user.userName,
      telephone: user.userPhone || '+225 07 00 00 00 00',
      email: user.userEmail.toLowerCase().trim(),
      mot_de_passe: user.password || '',
      role: user.role || (user.userEmail.toLowerCase().includes('camaraesther') ? 'admin' : 'client'),
      account_status: user.userEmail.toLowerCase().includes('camaraesther') ? 'validated' : 'pending',
      subscription_plan: 'Essai Gratuit 7 Jours',
      subscription_status: 'trial',
      device: user.device || 'Formulaire Interne Emris',
      registered_at: now,
      last_login_at: now
    };

    const res1 = await client.from(SUPABASE_USERS_TABLE).upsert([frenchPayload], { onConflict: 'email' });

    if (!res1.error) {
      return { success: true, message: `Enregistré avec succès dans la table Supabase '${SUPABASE_USERS_TABLE}'` };
    }

    // 2. Try minimal payload with explicit ID if columns vary
    const minimalPayload = {
      id,
      nom: user.userName,
      telephone: user.userPhone || '+225 07 00 00 00 00',
      email: user.userEmail.toLowerCase().trim(),
      mot_de_passe: user.password || ''
    };

    const res2 = await client.from(SUPABASE_USERS_TABLE).upsert([minimalPayload], { onConflict: 'email' });
    if (!res2.error) {
      return { success: true, message: `Enregistré dans la table Supabase '${SUPABASE_USERS_TABLE}' (champs principaux)` };
    }

    // 3. Simple insert as fallback
    const res3 = await client.from(SUPABASE_USERS_TABLE).insert([minimalPayload]);
    if (!res3.error) {
      return { success: true, message: `Inséré dans la table Supabase '${SUPABASE_USERS_TABLE}'` };
    }

    // Si échec temporaire, mettre en file d'attente hors ligne
    queuePendingUserForSync({
      id,
      userName: user.userName,
      userEmail: user.userEmail.toLowerCase().trim(),
      userPhone: user.userPhone,
      password: user.password,
      role: user.role,
      device: user.device
    });

    return { 
      success: false, 
      message: res1.error?.message || res2.error?.message || res3.error?.message || 'Erreur insertion Supabase', 
      error: res1.error?.message 
    };
  } catch (err: any) {
    queuePendingUserForSync({
      id: user.id || ('usr-' + Date.now()),
      userName: user.userName,
      userEmail: user.userEmail.toLowerCase().trim(),
      userPhone: user.userPhone,
      password: user.password,
      role: user.role,
      device: user.device
    });
    return { success: false, message: err?.message || 'Erreur Supabase', error: err?.message };
  }
}

// Queue for offline / pending registrations to guarantee zero loss
const PENDING_QUEUE_KEY = 'mris_pending_users_queue';

export function queuePendingUserForSync(user: any): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    const raw = localStorage.getItem(PENDING_QUEUE_KEY);
    const queue: any[] = raw ? JSON.parse(raw) : [];
    const email = user.userEmail?.toLowerCase().trim();
    if (!email) return;

    const filtered = queue.filter(q => q.userEmail?.toLowerCase().trim() !== email);
    filtered.push(user);
    localStorage.setItem(PENDING_QUEUE_KEY, JSON.stringify(filtered));
  } catch {
    // ignore
  }
}

export function getPendingUsersQueue(): any[] {
  if (typeof window === 'undefined' || !window.localStorage) return [];
  try {
    const raw = localStorage.getItem(PENDING_QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function clearPendingUser(email: string): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    const queue = getPendingUsersQueue();
    const filtered = queue.filter(q => q.userEmail?.toLowerCase().trim() !== email.toLowerCase().trim());
    localStorage.setItem(PENDING_QUEUE_KEY, JSON.stringify(filtered));
  } catch {
    // ignore
  }
}

// Flush pending sync queue
export async function flushPendingUsersQueue(): Promise<number> {
  const queue = getPendingUsersQueue();
  if (!queue || queue.length === 0) return 0;
  let syncedCount = 0;

  for (const item of queue) {
    try {
      const res = await insertUserToSupabaseDirect({
        id: item.id,
        userName: item.userName || item.nom,
        userEmail: item.userEmail || item.email,
        userPhone: item.userPhone || item.telephone,
        password: item.password || item.mot_de_passe,
        role: item.role,
        device: item.device
      });
      if (res.success) {
        clearPendingUser(item.userEmail || item.email);
        syncedCount++;
      }
    } catch {
      // Continue to next
    }
  }
  return syncedCount;
}

// Mass synchronize all registered users in local storage into Supabase
export async function syncAllLocalUsersToSupabase(users: RegisteredUser[]): Promise<{ synced: number; total: number }> {
  if (!users || users.length === 0) return { synced: 0, total: 0 };
  let count = 0;

  for (const u of users) {
    if (!u.userEmail) continue;
    try {
      const res = await insertUserToSupabaseDirect({
        id: u.id,
        userName: u.userName,
        userEmail: u.userEmail,
        userPhone: u.userPhone,
        password: u.password,
        role: u.role,
        device: u.device
      });
      if (res.success) {
        count++;
      }
    } catch {
      // continue
    }
  }

  return { synced: count, total: users.length };
}

// Direct validate in Supabase
export async function validateUserInSupabaseDirect(userEmail: string): Promise<boolean> {
  try {
    const client = getSupabaseBrowserClient();
    const { error } = await client
      .from(SUPABASE_USERS_TABLE)
      .update({ account_status: 'validated' })
      .ilike('email', userEmail.toLowerCase().trim());
    return !error;
  } catch {
    return false;
  }
}

// Direct delete in Supabase
export async function deleteUserFromSupabaseDirect(id: string, email: string): Promise<boolean> {
  try {
    const client = getSupabaseBrowserClient();
    const emailLower = email.toLowerCase().trim();
    const { error } = await client
      .from(SUPABASE_USERS_TABLE)
      .delete()
      .or(`id.eq.${id},email.eq.${emailLower}`);
    return !error;
  } catch {
    return false;
  }
}

