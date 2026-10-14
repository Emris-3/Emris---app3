import { 
  AutonomousEmail, 
  AutonomousRedaction, 
  AutonomousFreelanceMission, 
  AutonomousAgentLog,
  AutonomousAgentConfig 
} from '../types/autonomous';

export const INITIAL_AUTONOMOUS_CONFIG: AutonomousAgentConfig = {
  isActive: true, // Default active as requested by user
  cycleIntervalSeconds: 30,
  autoReplyEmails: true,
  autoDraftArticles: true,
  autoFreelanceBidding: true,
  autoDeliverFreelance: true,
  signature: 'M-Ris Assistant IA pour Camara Esther | Abidjan, Côte d\'Ivoire',
  freelancePlatforms: ['Malt', 'Upwork', 'ComeUp', 'Freelance.ci', 'LinkedIn'],
  hourlyRateFCFA: 20000,
  ownerName: 'Camara Esther',
  ownerEmail: 'camaraesther920@gmail.com'
};

export function getInitialAutonomousEmails(): AutonomousEmail[] {
  const now = new Date();
  const formatPast = (mins: number) => new Date(now.getTime() - mins * 60 * 1000).toISOString();

  return [
    {
      id: 'mail-001',
      senderName: 'M. Sékou Touré (Directeur Agence Tech)',
      senderEmail: 'sekou.toure@innovafrica.ci',
      subject: 'Demande urgente de devis : Stratégie de contenu & rédaction 15 articles',
      receivedAt: formatPast(18),
      category: 'devis',
      importance: 'haute',
      snippet: 'Bonjour Mme Camara, suite à votre profil sur les réseaux, nous recherchons un rédacteur expert pour un pack de 15 articles...',
      body: `Bonjour Madame Camara,

Nous avons pris connaissance de votre expertise et de la réactivité de vos livrables. Notre agence basée au Plateau (Abidjan) prépare le lancement d'une nouvelle plateforme e-santé pour la sous-région.

Nous souhaitons vous confier en freelance :
- La rédaction de 15 articles spécialisés (800 à 1 200 mots chacun)
- L'optimisation SEO (mots-clés ciblés, balisage H2/H3)
- Un délai de livraison sous 10 jours ouvrés.

Pourriez-vous nous transmettre votre proposition tarifaire globale ainsi qu'un premier aperçu de votre approche éditoriale ?

Bien cordialement,
Sékou Touré
Directeur de Projets — InnovAfrica`,
      status: 'replied',
      reply: {
        replyText: `Bonjour Monsieur Touré,

Je vous remercie vivement pour votre sollicitation et l'intérêt porté à mon travail. C'est avec grand enthousiasme que j'accompagne votre agence sur ce beau projet e-santé.

Pour votre pack de 15 articles spécialisés (800-1 200 mots) avec optimisation SEO complète et métadonnées prêtes à l'intégration :

1. Notre Proposition Forfaitaire :
- Tarif unitaire optimisé : 15 000 FCFA / article
- Montant total du pack (15 articles) : 225 000 FCFA net
- Inclus : Recherche documentaire, optimisation SEO poussée, révision illimitée jusqu'à validation.

2. Planning de livraison (10 jours) :
- Jour 3 : Livraison des 5 premiers articles pour alignement éditorial.
- Jour 7 : Livraison des 5 articles suivants.
- Jour 10 : Livraison finale du pack complet et rapport de validation SEO.

Pouvons-nous valider le calendrier afin que je lance immédiatement la phase de recherche ?

Bien à vous,
Camara Esther
Géré avec diligence par M-Ris (Assistant IA Autonome)
Contact : camaraesther920@gmail.com | +225 07 48 92 11 34`,
        generatedAt: formatPast(12),
        sentAutomatically: true,
        tone: 'professionnel'
      }
    },
    {
      id: 'mail-002',
      senderName: 'Cabinet Sylla & Associés',
      senderEmail: 'contact@sylla-avocats.ci',
      subject: 'Confirmation d\'accord de confidentialité et rapport de mission',
      receivedAt: formatPast(45),
      category: 'client',
      importance: 'haute',
      snippet: 'Chère Esther, nous accusons réception de votre projet. Merci de nous confirmer votre disponibilité...',
      body: `Chère Esther,

Nous accusons bonne réception de la note de cadrage. Vos remarques sur la formalisation des accords de partenariat sont très pertinentes.

Pouvez-vous nous confirmer votre accord pour intégrer la clause de confidentialité standard et nous envoyer la version finale amendée avant demain 14h ?

Très respectueusement,
Maître Aïssatou Sylla`,
      status: 'replied',
      reply: {
        replyText: `Chère Maître Sylla,

C'est bien noté avec la plus grande rigueur.

Je vous confirme notre accord plein et entier sur la clause de confidentialité standard. Notre agent a déjà intégré les ajustements nécessaires au sein du document.

La version amendée et prête à la signature vous parviendra bien avant l'échéance de demain 14h00.

Restant à votre entière disposition,
Camara Esther
(Assistée par M-Ris en arrière-plan)`,
        generatedAt: formatPast(30),
        sentAutomatically: true,
        tone: 'professionnel'
      }
    },
    {
      id: 'mail-003',
      senderName: 'Plateforme Malt Africa',
      senderEmail: 'opportunites@malt.com',
      subject: 'Nouvelle opportunité de mission directe : Rédaction Copywriting B2B (Abidjan / Remote)',
      receivedAt: formatPast(75),
      category: 'freelance',
      importance: 'moyenne',
      snippet: 'Un client a repéré vos compétences en rédaction freelance. Budget indicatif : 180 000 FCFA...',
      body: `Bonjour Esther,

Une entreprise recherche un(e) freelance pour une mission de refonte éditoriale et copywriting de leur site vitrine B2B.

- Durée estimée : 4 jours
- Budget proposé : 180 000 FCFA
- Compétences : Copywriting percutant, storytelling, call-to-action B2B.

Connectez-vous pour postuler ou accepter la proposition.`,
      status: 'drafted',
      reply: {
        replyText: `Bonjour,

J'accepte cette mission avec enthousiasme. Mon expertise en rédaction persuasive B2B permettra de valoriser vos offres et d'augmenter votre taux de conversion.

Je suis disponible immédiatement et prête à vous livrer la structure narrative complète sous 72 heures.

Bien à vous,
Camara Esther`,
        generatedAt: formatPast(60),
        sentAutomatically: false,
        tone: 'professionnel'
      }
    },
    {
      id: 'mail-004',
      senderName: 'Bénéficiaire Partenaire',
      senderEmail: 'koffi.marketing@gmail.com',
      subject: 'Demande de conseils pour campagne publicitaire Wave & Orange',
      receivedAt: formatPast(120),
      category: 'lead',
      importance: 'normale',
      snippet: 'Salut Esther, j\'aimerais avoir ton avis sur nos accroches publicitaires pour notre service...',
      body: `Salut Esther,

J'espère que tu vas bien. On prépare une campagne sponsorisée pour cibler les commerçants à Abidjan et Bouaké. J'aimerais que tu jettes un œil sur nos slogans et le pitch commercial. Dis-moi quand tu as un créneau !`,
      status: 'received'
    }
  ];
}

export function getInitialAutonomousRedactions(): AutonomousRedaction[] {
  const now = new Date();
  const formatPast = (mins: number) => new Date(now.getTime() - mins * 60 * 1000).toISOString();

  return [
    {
      id: 'red-001',
      title: 'Guide Ultime 2026 : Le Mobile Money et la Révolution Wave en Côte d\'Ivoire',
      type: 'article_seo',
      targetAudience: 'Entrepreneurs, commerçants et particuliers en Côte d\'Ivoire',
      wordCount: 1420,
      status: 'completed',
      createdAt: formatPast(180),
      completedAt: formatPast(165),
      keywords: ['Wave Côte d\'Ivoire', 'Mobile Money Abidjan', 'Transfert d\'argent 1%', 'Paiement commerçant Wave', 'Inclusion financière'],
      summary: 'Analyse approfondie de l\'impact de Wave sur les coûts de transaction, les habitudes des ménages et la digitalisation des PME ivoiriennes.',
      content: `# Le Mobile Money et la Révolution Wave en Côte d'Ivoire : Décryptage Économique et Pratique 2026

## Introduction : La fin des frais exorbitants

Il y a encore quelques années à Abidjan, envoyer de l'argent ou payer un prestataire par téléphone impliquait de calculer minutieusement les pourcentages de retrait et d'envoi. L'arrivée du pingouin bleu – Wave Mobile Money – a redéfini les règles du jeu avec son tarif unique et transparent de 1% sur les retraits, bousculant les géants historiques du secteur.

En 2026, l'adoption est massive : du vendeur d'attiéké à Marcory jusqu'aux cabinets de conseil du Plateau, la formule « scanne mon code Wave » est devenue un réflexe quotidien.

---

## 1. Pourquoi le modèle à 1% a conquis les Ivoiriens

Le succès fulgurant de Wave en Côte d'Ivoire repose sur trois piliers fondamentaux :

1. **La transparence absolue** : Aucun frais masqué, pas de surcoût lors du dépôt, et un prélèvement clair plafonné.
2. **L'expérience utilisateur simplifiée** : L'utilisation des codes QR physiques et de l'application rapide même en connexion 3G/4G instable.
3. **La sécurité sans compromis** : Confirmation visuelle instantanée du bénéficiaire et code secret sécurisé.

---

## 2. L'impact direct sur les Commerçants et PME à Abidjan

Pour un commerçant traitant 2 000 000 FCFA de volume mensuel, l'économie réalisée sur les frais de retrait représente jusqu'à **45 000 à 60 000 FCFA par mois**. Cette marge nette réinjectée dans le stock ou la trésorerie renforce durablement la résilience des micro-entreprises locales.

De plus, l'adoption des solutions marchandes Wave Business permet :
- Un suivi comptable en direct sans carnet papier vulnérable.
- Des paiements de salaires immédiats sans files d'attente aux guichets bancaires.

---

## 3. Stratégie d'Avenir : Ce qui attend le Mobile Money

L'intégration croissante des micro-crédits, de l'épargne rémunérée et des abonnements numériques marque la prochaine phase. Des plateformes modernes comme M-Ris intègrent déjà le paiement Wave pour débloquer des services instantanément dès réception du reçu de 35 000 FCFA.

### Conclusion

La révolution du mobile money en Côte d'Ivoire n'est plus seulement une question de technologie : c'est un accélérateur d'émancipation financière collective. Pour tout entrepreneur moderne, maîtriser ces outils est devenu le premier pas vers la pérennité.

*Rédigé et optimisé pour le référencement naturel par M-Ris Rédaction Autonome.*`
    },
    {
      id: 'red-002',
      title: 'Proposition Commerciale : Accompagnement Stratégique et Rédaction de Contenus B2B',
      type: 'proposition_commerciale',
      targetAudience: 'Direction Générale et Responsable Marketing d\'entreprises partenaires',
      wordCount: 880,
      status: 'completed',
      createdAt: formatPast(120),
      completedAt: formatPast(110),
      keywords: ['Proposition commerciale', 'Rédaction B2B', 'Génération de leads', 'Partenariat Abidjan'],
      summary: 'Offre clé en main de production éditoriale pour accroître la notoriété et la conversion d\'une entreprise tech africaine.',
      content: `PROPOSITION COMMERCIALE & OFFRE DE PARTENARIAT ÉDITORIAL

À l'attention de la Direction Marketing & Commerciale
Projet : Accélération de visibilité et Conversion B2B par le Contenu

1. CONTEXTE ET ENJEUX
Dans un écosystème économique dynamique à Abidjan et en Afrique de l'Ouest, les décideurs B2B choisissent leurs partenaires en fonction de leur autorité d'expertise. Un contenu de haute valeur permet d'asseoir cette crédibilité tout en réduisant le coût d'acquisition client de 30% en moyenne.

2. NOTRE DISPOSITIF CLÉ EN MAIN
Nous vous proposons un accompagnement éditorial complet comprenant :
- 8 Études de cas et articles experts par mois (format 1 000 mots avec visuels et synthèse)
- Rédaction de 4 Newsletters ciblées pour fidéliser vos prospects
- Optimisation SEO pour dominer les requêtes stratégiques de votre secteur

3. CONDITIONS FINANCIÈRES & MODALITÉS
- Forfait Mensuel Recommandé : 280 000 FCFA / mois
- Engagement minimum : 3 mois renouvelable
- Garantie : Révision illimitée jusqu'à approbation complète de vos équipes.

Validation et Démarrage :
Signature du bon de commande et acompte de démarrage de 50%. Livraison des premiers livrables sous 5 jours ouvrés.

Rédigé par Camara Esther avec le concours de l'Agent M-Ris.`
    },
    {
      id: 'red-003',
      title: 'Lettre de Motivation Professionnelle : Candidature Rédacteur en Chef Adjoint & Stratège',
      type: 'lettre_pro',
      targetAudience: 'Comité de Recrutement & Direction des Ressources Humaines',
      wordCount: 520,
      status: 'completed',
      createdAt: formatPast(60),
      completedAt: formatPast(55),
      keywords: ['Lettre de motivation', 'Rédacteur en chef', 'Leadership éditorial', 'Stratégie de communication'],
      summary: 'Lettre formelle et percutante valorisant rigueur, créativité et sens aigu de la gestion de projets éditoriaux.',
      content: `Objet : Candidature au poste de Responsable Éditorial et Stratège de Contenu

Madame, Monsieur,

C’est avec une vive attention que j’ai découvert l’ouverture de votre poste au sein de votre prestigieuse structure. Forte d’une expertise éprouvée dans la conception de contenus à fort impact et d'une passion constante pour la transmission d’idées porteuses, je souhaite apporter mon dynamisme et ma rigueur à vos équipes.

Au fil de mon parcours en gestion de contenus numériques et accompagnement freelance, j’ai développé une double compétence :
- L’exigence éditoriale : garantir un style irréprochable, une recherche documentaire méthodique et une adaptation fine aux attentes du public cible.
- La vision stratégique : aligner la production de texte avec les objectifs mesurables de notoriété, d'engagement et de conversion.

Dotée d'un sens aigu de l'organisation et d'une capacité naturelle à fédérer autour d'un projet, je serais honorée de mettre mes compétences au service de votre rayonnement.

Restant à votre entière disposition pour convenir d'un entretien, je vous prie d'agréer, Madame, Monsieur, l'expression de mes salutations distinguées.

Camara Esther`
    }
  ];
}

export function getInitialAutonomousMissions(): AutonomousFreelanceMission[] {
  const now = new Date();
  const formatPast = (mins: number) => new Date(now.getTime() - mins * 60 * 1000).toISOString();

  return [
    {
      id: 'free-001',
      platform: 'Malt',
      clientName: 'DigiHealth West Africa (M. Oumar Diarra)',
      clientCountry: 'Côte d\'Ivoire / Sénégal',
      projectTitle: 'Rédaction d\'un livre blanc de 20 pages : La télémédecine en Afrique francophone',
      projectDescription: 'Recherche d\'un rédacteur freelance expérimenté pour rédiger un livre blanc complet sur les innovations en télémédecine, avec interviews de spécialistes et synthèse des défis d\'infrastructure.',
      category: 'Rédaction Spécialisée & Santé',
      budget: 160000,
      currency: 'FCFA',
      status: 'paid',
      detectedAt: formatPast(360),
      proposalLetter: `Bonjour M. Diarra,

Votre projet de livre blanc sur la télémédecine touche exactement à mon cœur d'expertise. Allier clarté scientifique, pertinence économique locale et style captivant est ma spécialité.

Pourquoi me choisir ?
1. Maîtrise des enjeux de santé numérique en Afrique de l'Ouest (Sénégal, Côte d'Ivoire, Mali).
2. Capacité de vulgarisation de haut niveau pour captiver directeurs d'hôpitaux et investisseurs.
3. Respect scrupuleux des délais et livraison clés en main (plan détaillé, rédaction intégrale, bibliographie).

Je m'engage à vous livrer la première ébauche du plan sous 48h.

Bien cordialement,
Camara Esther (Freelance certifiée)`,
      deliverableTitle: 'Livre Blanc : La Révolution de la Télémédecine en Afrique de l\'Ouest',
      deliverableContent: `LIVRE BLANC : LA RÉVOLUTION DE LA TÉLÉMÉDECINE EN AFRIQUE DE L'OUEST (Édition 2026)

RÉSUMÉ EXÉCUTIF :
Comment le numérique comble les déserts médicaux dans la zone UEMOA. Analyse des 12 meilleures initiatives, des cadres légaux en vigueur et des opportunités d'investissement.

CHAPITRE 1 : État des lieux de l'accès aux soins spécialisés.
CHAPITRE 2 : Les infrastructures mobiles : quand le smartphone devient stéthoscope.
CHAPITRE 3 : Modèles économiques viables et intégration des assurances locales.
CHAPITRE 4 : Recommandations stratégiques pour les décideurs publics et privés.

(Document complet de 20 pages validé et archivé)`,
      deliveryDate: formatPast(30),
      rating: 5,
      clientFeedback: 'Travail exceptionnel, rapidité stupéfiante et très grande qualité de plume. Nous retravaillerons ensemble !'
    },
    {
      id: 'free-002',
      platform: 'Upwork',
      clientName: 'AfriCorp Logistics',
      clientCountry: 'France / Côte d\'Ivoire',
      projectTitle: 'Pack de 10 Articles de Blog SEO & Stratégie Supply Chain',
      projectDescription: 'Besoin de 10 articles de 1 000 mots chacun pour positionner notre site web sur la logistique portuaire d\'Abidjan et San Pedro.',
      category: 'Copywriting SEO',
      budget: 125000,
      currency: 'FCFA',
      status: 'delivered',
      detectedAt: formatPast(240),
      proposalLetter: `Bonjour,

Votre besoin d'autorité SEO sur la logistique portuaire ivoirienne nécessite une compréhension pointue des flux économiques réels d'Abidjan et de San Pedro.

Je vous propose :
- 10 articles calibrés SEO avec cocon sémantique complet
- Balisage Hn, méta-titres percutants et intégration naturelle des mots-clés
- Livraison cadencée pour votre calendrier éditorial.

Disponibilité immédiate.

Camara Esther`,
      deliverableTitle: 'Pack Complet 10 Articles Logistique Portuaire Abidjan',
      deliverableContent: `PACK ÉDITORIAL LOGISTIQUE (10 ARTICLES LIVRÉS) :
Article 1 : Le Port Autonome d'Abidjan : Hub de transit incontournable de l'hinterland.
Article 2 : Nouvelles solutions de dédouanement express en 2026.
Article 3 : Le corridor Abidjan-Ouagadougou optimisé par le tracking GPS.
... (Pack de 10 articles finalisé)`,
      deliveryDate: formatPast(40),
      rating: 5,
      clientFeedback: 'Articles très bien documentés et rédigés avec précision. Merci Esther !'
    },
    {
      id: 'free-003',
      platform: 'ComeUp',
      clientName: 'Studio Créatif Ivoire',
      clientCountry: 'Côte d\'Ivoire',
      projectTitle: 'Rédaction de Scripts Publicitaires pour TikTok & Instagram Reels',
      projectDescription: '3 scripts vidéo de 45 secondes pour promouvoir une nouvelle application mobile locale avec humour et authenticité ivoirienne.',
      category: 'Copywriting Réseaux Sociaux',
      budget: 45000,
      currency: 'FCFA',
      status: 'in_progress',
      detectedAt: formatPast(90),
      proposalLetter: `Salut !

Captiver sur TikTok et Reels en moins de 3 secondes demande du nouchi bien dosé, un hook choc et une chute mémorable.

Je vous livre les 3 scripts avec :
- L'accroche visuelle et sonore (Hook)
- Le déroulement émotionnel / drôle
- L'appel à l'action direct (CTA).

Livraison garantie sous 24 heures.

Esther Camara`,
      deliverableTitle: '3 Scripts TikTok / Reels Application Mobile',
      deliverableContent: `SCRIPT 1 (Hook Choc) :
[Visuel : Un jeune qui transpire devant une file d'attente interminable au soleil]
Voix off : « Tu es encore là à faire rang comme si on était en 1990 ? Mon cher, télécharge l'appli et gère ça en deux secondes ! »
... (En cours de finalisation)`,
      rating: undefined
    },
    {
      id: 'free-004',
      platform: 'Freelance.ci',
      clientName: 'Groupe Agro-Ivoire',
      clientCountry: 'Côte d\'Ivoire',
      projectTitle: 'Rédaction du Rapport Annuel d\'Activité & RSE 2025-2026',
      projectDescription: 'Entreprise agroalimentaire recherche un rédacteur professionnel pour compiler et synthétiser les données d\'impact environnemental et social.',
      category: 'Rapport d\'Entreprise & RSE',
      budget: 210000,
      currency: 'FCFA',
      status: 'bid_submitted',
      detectedAt: formatPast(15),
      proposalLetter: `Madame, Monsieur,

La valorisation de vos engagements RSE exige un équilibre subtil entre rigueur chiffrée et narration humaine valorisante.

Je vous propose de prendre en charge la rédaction intégrale de votre rapport :
- Synthèse des indicateurs clés (emplois créés, réduction d'empreinte carbone)
- Structuration selon les standards de reporting internationaux
- Relecture orthotypographique méticuleuse.

Prête à échanger sur vos données sources dès aujourd'hui.

Camara Esther`
    }
  ];
}

export function getInitialAutonomousLogs(): AutonomousAgentLog[] {
  const now = new Date();
  const formatPast = (mins: number) => new Date(now.getTime() - mins * 60 * 1000).toISOString();

  return [
    {
      id: 'log-001',
      timestamp: formatPast(12),
      module: 'email',
      message: 'Email entrant de Sékou Touré analysé avec succès. Réponse de devis professionnel (225 000 FCFA) générée et transmise automatiquement.',
      level: 'success'
    },
    {
      id: 'log-002',
      timestamp: formatPast(15),
      module: 'freelance',
      message: 'Nouvelle mission détectée sur Freelance.ci : "Rapport Annuel RSE" (Budget: 210 000 FCFA). Candidature sur-mesure soumise.',
      level: 'info'
    },
    {
      id: 'log-003',
      timestamp: formatPast(30),
      module: 'email',
      message: 'Réponse envoyée au Cabinet Sylla & Associés pour confirmation d\'accord de confidentialité.',
      level: 'success'
    },
    {
      id: 'log-004',
      timestamp: formatPast(40),
      module: 'freelance',
      message: 'Mission Upwork "Pack 10 Articles SEO" livrée au client AfriCorp Logistics. Note client reçue : 5/5 ⭐.',
      level: 'success'
    },
    {
      id: 'log-005',
      timestamp: formatPast(55),
      module: 'redaction',
      message: 'Rédaction achevée : "Lettre de Motivation Professionnelle Rédacteur en Chef" (520 mots) prête pour utilisation.',
      level: 'success'
    },
    {
      id: 'log-006',
      timestamp: formatPast(110),
      module: 'redaction',
      message: 'Génération automatique de document terminée : "Proposition Commerciale B2B" (880 mots).',
      level: 'info'
    },
    {
      id: 'log-007',
      timestamp: formatPast(165),
      module: 'redaction',
      message: 'Article SEO complet généré : "Guide Ultime Mobile Money Wave 2026" (1 420 mots).',
      level: 'success'
    },
    {
      id: 'log-008',
      timestamp: formatPast(180),
      module: 'system',
      message: 'Moteur autonome d\'arrière-plan M-Ris démarré. Surveillance continue des emails, rédaction et freelance active 24h/24.',
      level: 'info'
    }
  ];
}
