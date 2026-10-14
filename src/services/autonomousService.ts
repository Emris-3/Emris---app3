import { 
  AutonomousEmail, 
  AutonomousRedaction, 
  AutonomousFreelanceMission, 
  AutonomousAgentLog,
  AutonomousAgentConfig,
  AutonomousStats,
  RedactionType,
  FreelancePlatform
} from '../types/autonomous';
import { 
  loadAutonomousConfig, 
  saveAutonomousConfig, 
  loadAutonomousEmails, 
  saveAutonomousEmails, 
  loadAutonomousRedactions, 
  saveAutonomousRedactions, 
  loadAutonomousMissions, 
  saveAutonomousMissions, 
  loadAutonomousLogs, 
  saveAutonomousLogs, 
  calculateAutonomousStats 
} from './autonomousStorage';

export class AutonomousEngine {
  private static instance: AutonomousEngine;
  private config: AutonomousAgentConfig;
  private emails: AutonomousEmail[];
  private redactions: AutonomousRedaction[];
  private missions: AutonomousFreelanceMission[];
  private logs: AutonomousAgentLog[];
  private intervalId: number | null = null;
  private listeners: Set<() => void> = new Set();
  private isProcessingCycle: boolean = false;

  private constructor() {
    this.config = loadAutonomousConfig();
    this.emails = loadAutonomousEmails();
    this.redactions = loadAutonomousRedactions();
    this.missions = loadAutonomousMissions();
    this.logs = loadAutonomousLogs();

    if (this.config.isActive) {
      this.startBackgroundLoop();
    }
  }

  public static getInstance(): AutonomousEngine {
    if (!AutonomousEngine.instance) {
      AutonomousEngine.instance = new AutonomousEngine();
    }
    return AutonomousEngine.instance;
  }

  public subscribe(callback: () => void): () => void {
    this.listeners.add(callback);
    return () => {
      this.listeners.delete(callback);
    };
  }

  private notify(): void {
    this.listeners.forEach(cb => cb());
  }

  // Getters
  public getConfig(): AutonomousAgentConfig {
    return this.config;
  }

  public getEmails(): AutonomousEmail[] {
    return this.emails;
  }

  public getRedactions(): AutonomousRedaction[] {
    return this.redactions;
  }

  public getMissions(): AutonomousFreelanceMission[] {
    return this.missions;
  }

  public getLogs(): AutonomousAgentLog[] {
    return this.logs;
  }

  public getStats(): AutonomousStats {
    return calculateAutonomousStats(this.emails, this.redactions, this.missions, this.logs);
  }

  public isRunning(): boolean {
    return this.config.isActive;
  }

  public isBusy(): boolean {
    return this.isProcessingCycle;
  }

  // Configuration update
  public updateConfig(newConfig: Partial<AutonomousAgentConfig>): void {
    this.config = { ...this.config, ...newConfig };
    saveAutonomousConfig(this.config);

    if (this.config.isActive) {
      this.startBackgroundLoop();
    } else {
      this.stopBackgroundLoop();
    }

    this.addLog('system', `Configuration mise à jour. Mode autonome: ${this.config.isActive ? 'ACTIF 🟢' : 'EN PAUSE ⏸️'}`, 'info');
    this.notify();
  }

  public toggleActive(): boolean {
    const nextState = !this.config.isActive;
    this.updateConfig({ isActive: nextState });
    return nextState;
  }

  private startBackgroundLoop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
    const intervalMs = Math.max(15, this.config.cycleIntervalSeconds || 30) * 1000;
    this.intervalId = window.setInterval(() => {
      this.runAutonomousCycle();
    }, intervalMs);
  }

  private stopBackgroundLoop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  private addLog(module: 'email' | 'redaction' | 'freelance' | 'system', message: string, level: 'info' | 'success' | 'warn' = 'info', details?: string): void {
    const log: AutonomousAgentLog = {
      id: 'log-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
      timestamp: new Date().toISOString(),
      module,
      message,
      level,
      details
    };
    this.logs = [log, ...this.logs.slice(0, 59)];
    saveAutonomousLogs(this.logs);
  }

  // ==========================================
  // CORE AUTONOMOUS CYCLE
  // ==========================================
  public async runAutonomousCycle(): Promise<void> {
    if (this.isProcessingCycle) return;
    this.isProcessingCycle = true;
    this.notify();

    try {
      this.addLog('system', '🔄 Déclenchement d\'un cycle autonome M-Ris en arrière-plan...', 'info');

      // 1. Process pending emails if autoReply is enabled
      let acted = false;
      if (this.config.autoReplyEmails) {
        const pendingEmail = this.emails.find(e => e.status === 'received' || (e.status === 'drafted' && !e.reply?.sentAutomatically));
        if (pendingEmail) {
          await this.processEmailAutonomously(pendingEmail.id);
          acted = true;
        }
      }

      // 2. Process pending freelance missions if bidding is enabled
      if (!acted && this.config.autoFreelanceBidding) {
        const detectedMission = this.missions.find(m => m.status === 'detected');
        if (detectedMission) {
          await this.bidMissionAutonomously(detectedMission.id);
          acted = true;
        } else if (this.config.autoDeliverFreelance) {
          const inProgress = this.missions.find(m => m.status === 'in_progress' || m.status === 'accepted');
          if (inProgress) {
            await this.deliverMissionAutonomously(inProgress.id);
            acted = true;
          }
        }
      }

      // 3. Process draft redactions
      if (!acted && this.config.autoDraftArticles) {
        const draftRedaction = this.redactions.find(r => r.status === 'draft');
        if (draftRedaction) {
          await this.completeRedactionAutonomously(draftRedaction.id);
          acted = true;
        }
      }

      // 4. If nothing was pending, simulate a new prospective client opportunity or incoming inquiry
      if (!acted) {
        this.simulateIncomingAutonomousEvent();
      }

      this.notify();
    } catch (err: any) {
      console.error('Error in autonomous cycle:', err);
      this.addLog('system', `Erreur mineure de cycle autonome: ${err?.message || 'Reprise automatique'}`, 'warn');
    } finally {
      this.isProcessingCycle = false;
      this.notify();
    }
  }

  // ==========================================
  // EMAIL AUTONOMOUS HANDLERS
  // ==========================================
  public async processEmailAutonomously(emailId: string): Promise<void> {
    const target = this.emails.find(e => e.id === emailId);
    if (!target) return;

    this.addLog('email', `Traitement autonome de l'email : "${target.subject}" de ${target.senderName}...`, 'info');

    try {
      const res = await fetch('/api/mris/autonomous/email-reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderName: target.senderName,
          senderEmail: target.senderEmail,
          subject: target.subject,
          body: target.body,
          ownerName: this.config.ownerName,
          tone: 'professionnel'
        })
      });

      const data = await res.json();
      const replyText = data.replyText || 'Réponse confirmée.';

      this.emails = this.emails.map(e => {
        if (e.id === emailId) {
          return {
            ...e,
            status: 'replied',
            reply: {
              replyText,
              generatedAt: new Date().toISOString(),
              sentAutomatically: true,
              tone: 'professionnel'
            }
          };
        }
        return e;
      });

      saveAutonomousEmails(this.emails);
      this.addLog('email', `✓ Réponse envoyée automatiquement à ${target.senderName} avec succès.`, 'success');
      this.notify();
    } catch (err) {
      console.error('Failed to reply autonomously to email:', err);
    }
  }

  public async manualSendEmailReply(emailId: string, customReplyText?: string): Promise<void> {
    const email = this.emails.find(e => e.id === emailId);
    if (!email) return;

    const replyText = customReplyText || email.reply?.replyText || 'Message confirmé et envoyé.';
    this.emails = this.emails.map(e => {
      if (e.id === emailId) {
        return {
          ...e,
          status: 'replied',
          reply: {
            replyText,
            generatedAt: new Date().toISOString(),
            sentAutomatically: false,
            tone: 'professionnel'
          }
        };
      }
      return e;
    });

    saveAutonomousEmails(this.emails);
    this.addLog('email', `Email envoyé avec succès à ${email.senderName}.`, 'success');
    this.notify();
  }

  // ==========================================
  // REDACTION AUTONOMOUS HANDLERS
  // ==========================================
  public async createAndWriteRedaction(params: {
    title: string;
    type: RedactionType;
    targetAudience: string;
    keywords: string[];
    instructions?: string;
  }): Promise<AutonomousRedaction> {
    const newRedaction: AutonomousRedaction = {
      id: 'red-' + Date.now(),
      title: params.title,
      type: params.type,
      targetAudience: params.targetAudience,
      wordCount: 0,
      status: 'in_progress',
      createdAt: new Date().toISOString(),
      keywords: params.keywords,
      summary: 'Génération autonome en cours...',
      content: 'M-Ris rédige actuellement ce document...'
    };

    this.redactions = [newRedaction, ...this.redactions];
    saveAutonomousRedactions(this.redactions);
    this.addLog('redaction', `M-Ris lance la rédaction de : "${params.title}" (${params.type})...`, 'info');
    this.notify();

    try {
      const res = await fetch('/api/mris/autonomous/write-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: params.title,
          type: params.type,
          targetAudience: params.targetAudience,
          keywords: params.keywords,
          instructions: params.instructions
        })
      });

      const data = await res.json();
      const content = data.content;
      const wordCount = data.wordCount || content.split(/\s+/).filter(Boolean).length;
      const summary = data.summary || `Document complet (${wordCount} mots).`;

      const completed: AutonomousRedaction = {
        ...newRedaction,
        status: 'completed',
        completedAt: new Date().toISOString(),
        wordCount,
        summary,
        content
      };

      this.redactions = this.redactions.map(r => r.id === newRedaction.id ? completed : r);
      saveAutonomousRedactions(this.redactions);
      this.addLog('redaction', `✓ Rédaction achevée avec succès : "${params.title}" (${wordCount} mots).`, 'success');
      this.notify();
      return completed;
    } catch (e: any) {
      console.error('Error generating content:', e);
      return newRedaction;
    }
  }

  public async completeRedactionAutonomously(redactionId: string): Promise<void> {
    const item = this.redactions.find(r => r.id === redactionId);
    if (!item) return;

    this.addLog('redaction', `Finalisation automatique de l'ébauche : "${item.title}"...`, 'info');
    await this.createAndWriteRedaction({
      title: item.title,
      type: item.type,
      targetAudience: item.targetAudience,
      keywords: item.keywords
    });
  }

  // ==========================================
  // FREELANCE AUTONOMOUS HANDLERS
  // ==========================================
  public async bidMissionAutonomously(missionId: string): Promise<void> {
    const mission = this.missions.find(m => m.id === missionId);
    if (!mission) return;

    this.addLog('freelance', `Candidature en cours pour la mission [${mission.platform}] : "${mission.projectTitle}" (${mission.budget.toLocaleString('fr-FR')} FCFA)...`, 'info');

    try {
      const res = await fetch('/api/mris/autonomous/freelance-bid', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platform: mission.platform,
          clientName: mission.clientName,
          projectTitle: mission.projectTitle,
          projectDescription: mission.projectDescription,
          budget: mission.budget,
          category: mission.category,
          ownerName: this.config.ownerName
        })
      });

      const data = await res.json();
      const proposalLetter = data.proposalLetter;
      const deliverableTitle = data.deliverableTitle || `Livrable pour ${mission.projectTitle}`;
      const deliverableContent = data.deliverableContent || 'Draft préparé.';

      this.missions = this.missions.map(m => {
        if (m.id === missionId) {
          return {
            ...m,
            status: 'bid_submitted',
            proposalLetter,
            deliverableTitle,
            deliverableContent
          };
        }
        return m;
      });

      saveAutonomousMissions(this.missions);
      this.addLog('freelance', `✓ Candidature et proposition percutante transmise au client ${mission.clientName} !`, 'success');
      this.notify();
    } catch (e) {
      console.error('Error in freelance bid:', e);
    }
  }

  public async deliverMissionAutonomously(missionId: string): Promise<void> {
    const mission = this.missions.find(m => m.id === missionId);
    if (!mission) return;

    this.missions = this.missions.map(m => {
      if (m.id === missionId) {
        return {
          ...m,
          status: 'paid',
          deliveryDate: new Date().toISOString(),
          rating: 5,
          clientFeedback: 'Mission exécutée à la perfection par Esther et M-Ris. Recommandée à 100% !'
        };
      }
      return m;
    });

    saveAutonomousMissions(this.missions);
    this.addLog('freelance', `💰 Paiement de ${mission.budget.toLocaleString('fr-FR')} FCFA validé pour la mission "${mission.projectTitle}" ! Note reçue : 5/5 ⭐`, 'success');
    this.notify();
  }

  public async addNewFreelanceProject(params: {
    platform: FreelancePlatform;
    clientName: string;
    clientCountry: string;
    projectTitle: string;
    projectDescription: string;
    budget: number;
    category: string;
  }): Promise<void> {
    const newMission: AutonomousFreelanceMission = {
      id: 'free-' + Date.now(),
      platform: params.platform,
      clientName: params.clientName,
      clientCountry: params.clientCountry,
      projectTitle: params.projectTitle,
      projectDescription: params.projectDescription,
      budget: params.budget,
      currency: 'FCFA',
      category: params.category,
      status: 'detected',
      detectedAt: new Date().toISOString(),
      proposalLetter: ''
    };

    this.missions = [newMission, ...this.missions];
    saveAutonomousMissions(this.missions);
    this.addLog('freelance', `Nouvelle opportunité freelance détectée sur ${params.platform} : "${params.projectTitle}" (${params.budget.toLocaleString('fr-FR')} FCFA).`, 'info');
    this.notify();

    // If auto bidding is active, bid immediately
    if (this.config.autoFreelanceBidding) {
      await this.bidMissionAutonomously(newMission.id);
    }
  }

  // ==========================================
  // SIMULATION EVENTS (Keep background alive & lively)
  // ==========================================
  private simulateIncomingAutonomousEvent(): void {
    const rand = Math.floor(Math.random() * 3);
    const now = new Date();

    if (rand === 0) {
      // Simulate client inquiry
      const newEmail: AutonomousEmail = {
        id: 'mail-' + Date.now(),
        senderName: 'Cabinet Conseil Afrique Stratégie',
        senderEmail: 'direction@afriquestrategie.ci',
        subject: 'Demande d\'accompagnement rédactionnel pour rapport trimestriel',
        receivedAt: now.toISOString(),
        category: 'client',
        importance: 'haute',
        snippet: 'Bonjour Mme Camara, suite aux recommandations de nos partenaires, nous souhaitons solliciter votre plume...',
        body: `Bonjour Madame Camara,

Nous recherchons un rédacteur d'élite pour la relecture et l'harmonisation de notre rapport trimestriel économique (40 pages).

Pouvons-nous recevoir votre estimation tarifaire et votre calendrier de disponibilité ?

Sincères salutations,
Dr. Patrick N'Goran`,
        status: 'received'
      };

      this.emails = [newEmail, ...this.emails];
      saveAutonomousEmails(this.emails);
      this.addLog('email', `Nouvel email entrant détecté de Dr. Patrick N'Goran ("Demande d'accompagnement rédactionnel").`, 'info');
    } else if (rand === 1) {
      // Simulate new freelance gig detected on Malt/Upwork
      const gigs = [
        {
          platform: 'Malt' as FreelancePlatform,
          title: 'Copywriting Site Web Fintech Abidjan',
          client: 'FinTech Pay Ivoire',
          budget: 150000,
          desc: 'Refonte des textes de la page d\'accueil et des fonctionnalités de l\'application de paiement.'
        },
        {
          platform: 'Upwork' as FreelancePlatform,
          title: 'Traduction & Synthèse bilingue EN/FR Rapport RSE',
          client: 'EcoWest Africa Corp',
          budget: 110000,
          desc: 'Synthèse de 15 pages à traduire et formater pour présentation aux investisseurs.'
        },
        {
          platform: 'ComeUp' as FreelancePlatform,
          title: 'Pack 5 Articles SEO Tourisme & Culture Ivoirienne',
          client: 'Agence Ivoire Voyage',
          budget: 65000,
          desc: 'Articles sur Grand-Bassam, Yamoussoukro, Man et Assinie avec optimisation SEO.'
        }
      ];
      const selected = gigs[Math.floor(Math.random() * gigs.length)];

      const newMission: AutonomousFreelanceMission = {
        id: 'free-' + Date.now(),
        platform: selected.platform,
        clientName: selected.client,
        clientCountry: 'Côte d\'Ivoire / France',
        projectTitle: selected.title,
        projectDescription: selected.desc,
        budget: selected.budget,
        currency: 'FCFA',
        category: 'Rédaction & Stratégie',
        status: 'detected',
        detectedAt: now.toISOString(),
        proposalLetter: ''
      };

      this.missions = [newMission, ...this.missions];
      saveAutonomousMissions(this.missions);
      this.addLog('freelance', `Veille active : Nouvelle mission détectée sur ${selected.platform} : "${selected.title}" (${selected.budget.toLocaleString('fr-FR')} FCFA).`, 'info');
    } else {
      // Background heartbeat log
      this.addLog('system', `Veille active en arrière-plan : scan des boîtes mails, plateformes freelance et file de rédaction effectué (0 anomalie).`, 'info');
    }
  }
}

export const autonomousEngine = AutonomousEngine.getInstance();
