import { 
  AutonomousEmail, 
  AutonomousRedaction, 
  AutonomousFreelanceMission, 
  AutonomousAgentLog,
  AutonomousAgentConfig,
  AutonomousStats 
} from '../types/autonomous';
import { 
  INITIAL_AUTONOMOUS_CONFIG, 
  getInitialAutonomousEmails, 
  getInitialAutonomousRedactions, 
  getInitialAutonomousMissions, 
  getInitialAutonomousLogs 
} from './autonomousSeed';

const STORAGE_KEYS = {
  CONFIG: 'mris_auto_config_v1',
  EMAILS: 'mris_auto_emails_v1',
  REDACTIONS: 'mris_auto_redactions_v1',
  MISSIONS: 'mris_auto_missions_v1',
  LOGS: 'mris_auto_logs_v1',
  LAST_CYCLE: 'mris_auto_last_cycle_v1'
};

export function loadAutonomousConfig(): AutonomousAgentConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CONFIG);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Error loading autonomous config:', e);
  }
  return INITIAL_AUTONOMOUS_CONFIG;
}

export function saveAutonomousConfig(config: AutonomousAgentConfig): void {
  try {
    localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(config));
  } catch (e) {
    console.error('Error saving autonomous config:', e);
  }
}

export function loadAutonomousEmails(): AutonomousEmail[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.EMAILS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.error('Error loading autonomous emails:', e);
  }
  const initial = getInitialAutonomousEmails();
  saveAutonomousEmails(initial);
  return initial;
}

export function saveAutonomousEmails(emails: AutonomousEmail[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.EMAILS, JSON.stringify(emails));
  } catch (e) {
    console.error('Error saving autonomous emails:', e);
  }
}

export function loadAutonomousRedactions(): AutonomousRedaction[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.REDACTIONS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.error('Error loading autonomous redactions:', e);
  }
  const initial = getInitialAutonomousRedactions();
  saveAutonomousRedactions(initial);
  return initial;
}

export function saveAutonomousRedactions(redactions: AutonomousRedaction[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.REDACTIONS, JSON.stringify(redactions));
  } catch (e) {
    console.error('Error saving autonomous redactions:', e);
  }
}

export function loadAutonomousMissions(): AutonomousFreelanceMission[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.MISSIONS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.error('Error loading autonomous missions:', e);
  }
  const initial = getInitialAutonomousMissions();
  saveAutonomousMissions(initial);
  return initial;
}

export function saveAutonomousMissions(missions: AutonomousFreelanceMission[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.MISSIONS, JSON.stringify(missions));
  } catch (e) {
    console.error('Error saving autonomous missions:', e);
  }
}

export function loadAutonomousLogs(): AutonomousAgentLog[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.LOGS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.error('Error loading autonomous logs:', e);
  }
  const initial = getInitialAutonomousLogs();
  saveAutonomousLogs(initial);
  return initial;
}

export function saveAutonomousLogs(logs: AutonomousAgentLog[]): void {
  try {
    // Keep last 60 logs
    const trimmed = logs.slice(0, 60);
    localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(trimmed));
  } catch (e) {
    console.error('Error saving autonomous logs:', e);
  }
}

export function calculateAutonomousStats(
  emails: AutonomousEmail[],
  redactions: AutonomousRedaction[],
  missions: AutonomousFreelanceMission[],
  logs: AutonomousAgentLog[]
): AutonomousStats {
  const repliedEmails = emails.filter(e => e.status === 'replied' || e.reply);
  const completedRedactions = redactions.filter(r => r.status === 'completed');
  
  // Total money earned from paid and delivered freelance missions
  const paidMissions = missions.filter(m => m.status === 'paid' || m.status === 'delivered');
  const totalFreelanceGained = paidMissions.reduce((acc, m) => acc + (m.budget || 0), 0);
  
  const activeMissions = missions.filter(m => m.status === 'in_progress' || m.status === 'bid_submitted' || m.status === 'detected');
  const wonMissions = missions.filter(m => m.status === 'delivered' || m.status === 'paid');

  return {
    totalEmailsHandled: emails.length,
    totalEmailsReplied: repliedEmails.length,
    totalRedactionsCompleted: completedRedactions.length,
    totalFreelanceGainedFCFA: totalFreelanceGained,
    totalMissionsWon: wonMissions.length,
    activeMissionsCount: activeMissions.length,
    cyclesRunCount: logs.length,
    lastCycleAt: logs[0]?.timestamp || new Date().toISOString()
  };
}
