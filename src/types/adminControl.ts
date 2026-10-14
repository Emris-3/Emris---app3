export interface RegisteredUser {
  id: string;
  userName: string;
  userEmail: string;
  userPhone: string;
  password?: string;
  role: 'admin' | 'client';
  accountStatus: 'validated' | 'pending' | 'suspended';
  registeredAt: string;
  lastLoginAt: string;
  loginCount: number;
  device: string;
  subscriptionPlan: string; // 'Abonnement Mensuel 35 000 FCFA' | 'Essai Gratuit 7 Jours' | 'En attente' | 'Aucun'
  subscriptionStatus: 'active' | 'trial' | 'pending' | 'expired' | 'none';
  paymentStatus: 'paid' | 'pending' | 'none';
  totalPaidFCFA: number;
  isOnline?: boolean;
  notes?: string;
}

export interface UserLoginEvent {
  id: string;
  userName: string;
  userEmail: string;
  userPhone: string;
  timestamp: string;
  eventType: 'connexion' | 'inscription' | 'essai_7j' | 'paiement_wave' | 'session_active';
  device: string;
  status: 'reussie' | 'en_attente' | 'bloquee';
  ip?: string;
  details?: string;
}

export interface WhatsAppNotification {
  id: string;
  type: 'lead_converted' | 'campaign_launched' | 'new_payment' | 'user_login' | 'trial_started';
  title: string;
  message: string;
  timestamp: string;
  sent: boolean;
  whatsappUrl: string;
}
