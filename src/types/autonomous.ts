export type AutonomousModuleType = 'email' | 'redaction' | 'freelance';

export interface AutonomousEmailReply {
  replyText: string;
  generatedAt: string;
  sentAutomatically: boolean;
  tone: 'professionnel' | 'chaleureux' | 'negociation' | 'urgent';
}

export interface AutonomousEmail {
  id: string;
  senderName: string;
  senderEmail: string;
  subject: string;
  receivedAt: string;
  category: 'client' | 'urgent' | 'lead' | 'admin' | 'freelance' | 'devis';
  importance: 'haute' | 'moyenne' | 'normale';
  snippet: string;
  body: string;
  status: 'received' | 'analyzed' | 'drafted' | 'replied';
  reply?: AutonomousEmailReply;
}

export type RedactionType = 
  | 'article_seo' 
  | 'lettre_pro' 
  | 'rapport_synthese' 
  | 'proposition_commerciale' 
  | 'pitch_vente';

export interface AutonomousRedaction {
  id: string;
  title: string;
  type: RedactionType;
  targetAudience: string;
  wordCount: number;
  status: 'draft' | 'in_progress' | 'completed';
  createdAt: string;
  completedAt?: string;
  keywords: string[];
  summary: string;
  content: string;
  scheduledTopic?: string;
}

export type FreelancePlatform = 'Upwork' | 'Malt' | 'ComeUp' | 'Freelance.ci' | 'LinkedIn';

export interface AutonomousFreelanceMission {
  id: string;
  platform: FreelancePlatform;
  clientName: string;
  clientCountry: string;
  projectTitle: string;
  projectDescription: string;
  category: string;
  budget: number; // in FCFA
  currency: 'FCFA';
  status: 'detected' | 'bid_submitted' | 'accepted' | 'in_progress' | 'delivered' | 'paid';
  detectedAt: string;
  proposalLetter: string;
  deliverableContent?: string;
  deliverableTitle?: string;
  deliveryDate?: string;
  rating?: number;
  clientFeedback?: string;
}

export interface AutonomousAgentLog {
  id: string;
  timestamp: string;
  module: 'email' | 'redaction' | 'freelance' | 'system';
  message: string;
  level: 'info' | 'success' | 'warn';
  details?: string;
}

export interface AutonomousAgentConfig {
  isActive: boolean;
  cycleIntervalSeconds: number; // e.g. 20, 30, 60
  autoReplyEmails: boolean;
  autoDraftArticles: boolean;
  autoFreelanceBidding: boolean;
  autoDeliverFreelance: boolean;
  signature: string;
  freelancePlatforms: FreelancePlatform[];
  hourlyRateFCFA: number;
  ownerName: string;
  ownerEmail: string;
}

export interface AutonomousStats {
  totalEmailsHandled: number;
  totalEmailsReplied: number;
  totalRedactionsCompleted: number;
  totalFreelanceGainedFCFA: number;
  totalMissionsWon: number;
  activeMissionsCount: number;
  cyclesRunCount: number;
  lastCycleAt?: string;
}
