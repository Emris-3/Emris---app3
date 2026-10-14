export type SubscriptionStatus = 'pending' | 'active' | 'trial' | 'rejected';

export interface UserSession {
  userName: string;
  userEmail: string;
  userPhone: string;
  password?: string;
  isAdmin?: boolean;
}

export interface SubscriptionRequest {
  id: string;
  userName: string;
  userEmail: string;
  userPhone: string;
  planName: string;
  amount: number; // 35000 FCFA or 0 for trial
  currency: string; // 'FCFA'
  submissionDate: string; // ISO string
  status: SubscriptionStatus;
  receiptImage: string; // Base64 data URL or demo receipt
  receiptFileName?: string;
  waveTransactionId?: string;
  activatedAt?: string; // ISO string
  expiresAt?: string; // ISO string (activatedAt + 30 days or trial + 7 days)
  isTrial?: boolean;
  trialDurationDays?: number; // 7
  trialStartedAt?: string;
  trialDays?: number;
  rejectionReason?: string;
  emailSent?: boolean;
  emailSentAt?: string;
  notes?: string;
}

export interface AssistantMessage {
  id: string;
  sender: 'mris' | 'user';
  text: string;
  timestamp: string;
  actionLink?: string;
  actionLabel?: string;
}

export interface SentEmailNotification {
  id: string;
  requestId: string;
  toEmail: string;
  toName: string;
  subject: string;
  sentAt: string;
  expiresAt: string;
  htmlContent: string;
}
