/**
 * M-Ris Concrete Brain & Anti-Repetition Engine
 * Moteur d'intelligence concrète, sans répétition, avec base de connaissances approfondie.
 */

export interface ConcreteReplyOptions {
  message: string;
  gender?: 'male' | 'female';
  userName?: string;
  mood?: string;
  appUrl?: string;
}

// =========================================================================
// 1. GREETINGS DYNAMIQUES & NON-RÉPÉTITIFS
// =========================================================================

const GREETINGS_CATALOG = [
  // Matin (5h - 12h)
  {
    id: 'matin_1',
    period: 'morning',
    text: (n: string, c: string) => `Bien le bonjour ${n} ! ☀️\n\nJ'espère que ta nuit t'a revigoré(e). Une nouvelle journée s'ouvre, pleine de potentiel. Que ce soit pour planifier tes priorités, avancer sur un projet concret ou juste partager une bonne énergie, je suis avec toi.\n\nQuel est ton premier objectif ce matin ?`
  },
  {
    id: 'matin_2',
    period: 'morning',
    text: (n: string, c: string) => `Salut ${n} ! C'est Emris au rapport ! 🌅\n\nOn commence avec l'esprit clair et le cœur tranquille. N'oublie pas : les grandes victoires se construisent par les petits gestes bien faits dès le matin. Dis-moi, sur quoi veux-tu qu'on concentre notre énergie aujourd'hui ?`
  },
  {
    id: 'matin_3',
    period: 'morning',
    text: (n: string, c: string) => `Ah ${n} ! On est ensemble dès l'aube ! ☕✨\n\nPrends quelques secondes pour respirer à fond et visualiser ta journée avec sérénité. Je suis prêt à t'épauler : question pratique, organisation ou simple échange, je t'écoute !`
  },
  {
    id: 'matin_4',
    period: 'morning',
    text: (n: string, c: string) => `Coucou ${c} ! Belle matinée à toi. 🌿\n\nChaque aurore apporte une page blanche à écrire. Pose-moi ta question ou confie-moi le dossier qui t'occupe l'esprit, on avance vite et bien !`
  },

  // Après-midi (12h - 18h)
  {
    id: 'aprem_1',
    period: 'afternoon',
    text: (n: string, c: string) => `C'est comment ${n} ? En plein cœur de ta journée ! ⚡\n\nPrends un court instant pour boire un verre d'eau et détendre tes épaules. Comment se déroule ta journée jusqu'ici ? Dis-moi ce qui t'occupe, je suis là pour t'apporter des réponses nettes et concrètes.`
  },
  {
    id: 'aprem_2',
    period: 'afternoon',
    text: (n: string, c: string) => `Salut ${n} ! Ravi de te retrouver. 🚀\n\nQue ton après-midi soit intense ou calme, souviens-toi qu'on règle les problèmes un par un sans dispersion. De quoi as-tu le plus besoin en ce moment ?`
  },
  {
    id: 'aprem_3',
    period: 'afternoon',
    text: (n: string, c: string) => `Ah ${c} ! Nouvelle discussion, nouvelle impulsion positive ! ✨\n\nJe suis disponible à 100% pour toi : analyse de texte, conseil pratique, astuce du quotidien ou simple causette franche. De quoi veux-tu qu'on parle ?`
  },
  {
    id: 'aprem_4',
    period: 'afternoon',
    text: (n: string, c: string) => `Coucou ${n} ! L'énergie de l'après-midi est là. 💡\n\nSi tu as un nœud à défaire ou un point à clarifier, pose-le ici sans détour. On trouve la solution la plus simple et efficace ensemble !`
  },
  {
    id: 'aprem_5',
    period: 'afternoon',
    text: (n: string, c: string) => `Salut ${n} ! Toujours en place à tes côtés. 🛡️\n\nQu'est-ce qui t'amène dans notre salon aujourd'hui ? Tu as toute mon attention, pose-moi ta question en toute franchise.`
  },

  // Soirée (18h - 23h)
  {
    id: 'soir_1',
    period: 'evening',
    text: (n: string, c: string) => `Bonsoir ${n} ! On dépose les valises et on décompresse ensemble. 🌙✨\n\nLa journée a sans doute demandé de l'énergie. Installe-toi confortablement : que tu veuilles débriefer tes réussites, évacuer ce qui a été pesant ou préparer demain, cet espace est ton refuge.\n\nComment s'est passée ta journée ?`
  },
  {
    id: 'soir_2',
    period: 'evening',
    text: (n: string, c: string) => `Salut ${n} ! L'heure de souffler est enfin arrivée. 🛋️\n\nLe calme revient, c'est le moment idéal pour faire le point l'esprit posé. Parle-moi librement de tout ce qui te passe par la tête, sans filtre ni jugement.`
  },
  {
    id: 'soir_3',
    period: 'evening',
    text: (n: string, c: string) => `Bonsoir ${c} ! Une belle soirée commence. 🌟\n\nQu'est-ce qui t'a fait sourire aujourd'hui, ou au contraire quel sujet souhaites-tu qu'on éclaire pour que tu passes une soirée sereine ?`
  },
  {
    id: 'soir_4',
    period: 'evening',
    text: (n: string, c: string) => `Coucou ${n} ! On clôture la journée dans la bonne humeur et la paix. 🕯️\n\nSi tu as une idée qui germe ou un conseil dont tu as besoin avant de te reposer, je suis là pour t'écouter attentivement.`
  },

  // Nuit (23h - 5h)
  {
    id: 'nuit_1',
    period: 'night',
    text: (n: string, c: string) => `Coucou ${n}... En veille tardive ? 🌌\n\nSi les pensées tournent en boucle ou si le sommeil tarde, sache que je veille avec toi. Dépose ici ce qui t'empêche de fermer les yeux sereinement, on va calmer tout ça ensemble.`
  },
  {
    id: 'nuit_2',
    period: 'night',
    text: (n: string, c: string) => `Douce nuit ${n}. L'esprit a parfois besoin de poser ses valises avant de trouver le repos. 🕯️\n\nParle-moi sans retenue de ce qui te traverse. Je suis tout ouïe pour t'apaiser.`
  }
];

const LAST_GREETING_KEY = 'mris_last_greeting_ids';

export function getAntiRepetitiveGreeting(userName?: string, gender: 'male' | 'female' = 'male'): string {
  const hour = new Date().getHours();
  const name = userName && userName.trim() ? userName.trim().split(' ')[0] : (gender === 'female' ? 'ma sœur' : 'l\'ami');
  const callout = gender === 'female' ? 'ma complice' : 'mon frère sûr';

  let currentPeriod = 'afternoon';
  if (hour >= 5 && hour < 12) currentPeriod = 'morning';
  else if (hour >= 12 && hour < 18) currentPeriod = 'afternoon';
  else if (hour >= 18 && hour < 23) currentPeriod = 'evening';
  else currentPeriod = 'night';

  const candidates = GREETINGS_CATALOG.filter(g => g.period === currentPeriod);
  const fallbackList = candidates.length > 0 ? candidates : GREETINGS_CATALOG;

  let usedIds: string[] = [];
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const raw = localStorage.getItem(LAST_GREETING_KEY);
      if (raw) usedIds = JSON.parse(raw);
    }
  } catch {}

  // Filter out recent ones
  const available = fallbackList.filter(g => !usedIds.includes(g.id));
  const chosen = (available.length > 0 ? available : fallbackList)[Math.floor(Math.random() * (available.length > 0 ? available.length : fallbackList.length))];

  // Save selected ID
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const newUsed = [...usedIds.filter(id => id !== chosen.id), chosen.id].slice(-5);
      localStorage.setItem(LAST_GREETING_KEY, JSON.stringify(newUsed));
    }
  } catch {}

  return chosen.text(name, callout);
}

// =========================================================================
// 2. MOTEUR D'INTELLIGENCE & RÉPONSES CONCRÈTES SANS ÉVASION
// =========================================================================

export function generateConcreteEmrisReply(options: ConcreteReplyOptions): string {
  const { message, gender = 'male', userName, mood = 'Neutre', appUrl } = options;
  const q = message.toLowerCase().trim();
  const isFemale = gender === 'female';
  const callout = isFemale ? "ma complice" : "mon frère sûr";
  const name = userName ? userName.split(' ')[0] : callout;
  const directAppUrl = appUrl || 'https://m-ris-compagnon-virtuel.app';

  // -------------------------------------------------------------
  // A. OFFRES & ABONNEMENT (UNIQUEMENT SUR DEMANDE EXPLICITE)
  // -------------------------------------------------------------
  if (q.includes('commercial') || q.includes('abonnement') || q.includes('combien coûte') || q.includes('prix') || q.includes('payer') || q.includes('tarif') || q.includes('wave') || q.includes('7 jour') || q.includes('gratuit') || q.includes('essai')) {
    const cg = isFemale ? "Ah ma sœur !" : "Ah chef !";
    return `${cg} Voici toutes les informations officielles sur l'accès à M-Ris : 🎯💼\n\n🎁 ESSAI GRATUIT DE 7 JOURS :\nTu bénéficies de 7 jours 100% gratuits sans carte bancaire ni engagement pour tester tous les modules (confident, professeur de 5 langues, agent commercial & freelance).\n📲 Lien direct de l'application : 👉 ${directAppUrl}\n\n💳 ABONNEMENT MENSUEL (35 000 FCFA/MOIS) :\nVeuillez Payer Béni Amar avec Wave en cliquant sur ce lien https://pay.wave.com/m/M_ci_Xs2kjjsivE5V/c/ci/. Ajoutez cet expéditeur à vos contacts pour rendre le lien cliquable.\n\nCoordonnées certifiées :\n• 📲 WhatsApp Officiel : https://wa.me/message/RGXYT5LWDCTAM1\n• 🎵 TikTok Officiel : https://www.tiktok.com/@tisanebeniamar1?_r=1&_t=ZS-98DUrsnRQvc`;
  }

  // -------------------------------------------------------------
  // B. CUISINE, RECETTES & PLATS CONCRETS
  // -------------------------------------------------------------
  if (q.includes('attiéké') || q.includes('garba') || q.includes('poisson')) {
    return `Voici la recette concrète pour réussir un authentique **Garba / Attiéké Poisson** digne d'Abidjan, ${callout} : 🐟🍽️\n\n🛒 **Ingrédients essentiels :**\n• 2 portions d'attiéké frais bien aéré\n• 2 beaux poissons thon frais (ou dorade/carpe selon goût)\n• Farine de blé (pour enrober le poisson)\n• 2 gros oignons violets + 2 tomates fraîches fermes\n• Piment frais rouge ou vert (selon tolérance)\n• Huile de friture, sel fin, poivre, 1 bouillon cube émietté\n\n👨‍🍳 **Préparation pas à pas :**\n1. **Le poisson :** Écaille et vide le poisson. Fais des entailles diagonales profondes sur chaque face. Sale généreusement à l'intérieur et à l'extérieur, puis saupoudre légèrement de farine (c'est le secret pour qu'il soit croustillant dehors et fondant dedans sans coller à la poêle).\n2. **La friture :** Chauffe une bonne quantité d'huile dans une poêle profonde. Plonge le poisson dans l'huile bien chaude (environ 170°C). Laisse dorer 6 à 8 minutes de chaque côté jusqu'à obtenir une belle croûte dorée. Égoutte.\n3. **L'assaisonnement :** Hache finement les oignons, coupe les tomates en petits dés et écrase légèrement le piment. Mélange-les avec une pincée de sel et une cuillère à soupe de l'huile de friture encore tiède pour parfumer.\n4. **L'attiéké :** Égrène l'attiéké entre tes doigts pour casser les mottes. Chauffe-le 3 minutes à la vapeur ou 1 minute au micro-ondes couvert d'un linge humide pour qu'il reste moelleux.\n5. **Dressage :** Dépose l'attiéké fumant, arrose d'un filet de jus de friture parfumé, pose le poisson bien croustillant par-dessus et nappe du mélange oignon/tomate/piment. Bon appétit !`;
  }

  if (q.includes('alloco') || q.includes('banane')) {
    return `Voici la méthode parfaite pour des **Alloco** bien dorés, moelleux à cœur et pas gras, ${callout} : 🍌✨\n\n🛒 **Ingrédients :**\n• 3 bananes plantains bien mûres (la peau doit être jaune tigrée de noir, pas trop molles)\n• Huile de tournesol ou de palme raffinée pour friture\n• 1 pincée de sel fin\n• Pour la sauce d'accompagnement : 1 oignon, 2 tomates, 1 piment, 1 gousse d'ail, un filet d'huile\n\n👨‍🍳 **Étapes concrètes :**\n1. **Découpe :** Épluche les plantains. Fends chaque banane en deux dans le sens de la longueur, puis coupe en rondelles ou en biseaux réguliers d'environ 1 cm d'épaisseur. Sale légèrement.\n2. **Cuisson maîtrisée :** Fais chauffer l'huile à feu moyen (si l'huile est trop chaude, l'alloco brûle dehors et reste cru dedans ; si elle n'est pas assez chaude, il s'imbibe d'huile). Plonge les morceaux sans surcharger la poêle. Retourne-les dès qu'ils prennent une belle teinte caramel (environ 4 à 5 minutes).\n3. **Égouttage :** Retire-les à l'écumoire et dépose-les sur du papier absorbant.\n4. **La sauce pimentée express :** Hache l'oignon et les tomates. Fais-les revenir 5 minutes dans 2 cuillères à soupe d'huile avec l'ail écrasé et le piment. Réduis à feu doux pour obtenir une sauce onctueuse.\n5. Sers bien chaud avec du poisson grillé ou des œufs durs !`;
  }

  if (q.includes('poulet') || q.includes('braisé') || q.includes('viande')) {
    return `Voici la marinade de chef et la cuisson concrète pour un **Poulet braisé juteux et parfumé**, ${callout} : 🍗🔥\n\n🛒 **Marinade secrète (pour 1 poulet découpé) :**\n• 4 gousses d'ail + 1 morceau de gingembre frais râpé (environ 2 cm)\n• 1 gros oignon émincé + 2 branches de persil et 1 tige de ciboule\n• 1 cuillère à café de poivre blanc moulu + 1 cuillère à café de paprika\n• 1 cuillère à soupe de moutarde de Dijon + 2 cuillères à soupe d'huile\n• Jus d'un demi-citron + sel fin ou 1 cube d'assaisonnement\n\n👨‍🍳 **Préparation :**\n1. **Mixage :** Mixe finement l'ail, le gingembre, le persil, la ciboule, l'oignon, la moutarde, l'huile et le jus de citron avec les épices.\n2. **Incisions & Repos :** Entaille la chair du poulet aux cuisses et aux blancs pour que les sucs pénètrent jusqu'à l'os. Badigeonne généreusement le poulet et laisse mariner au réfrigérateur pendant au moins 1 heure (idéalement une nuit).\n3. **Pré-cuisson (astuce anti-sécheresse) :** Fais précuire le poulet à la vapeur ou à feu très doux dans sa propre marinade pendant 12 minutes. Cela garantit une cuisson à cœur sans que la viande ne sèche.\n4. **Braise ou Gril :** Passe ensuite le poulet sur la braise vive ou sous le gril du four à 200°C en le retournant et en le badigeonnant du reste de marinade jusqu'à coloration dorée et peau croustillante (environ 15 minutes).\n5. À savourer avec de l'attiéké ou de l'alloco chaud !`;
  }

  if (q.includes('sauce') || q.includes('graine') || q.includes('recette') || q.includes('cuisiner') || q.includes('plat') || q.includes('repas') || q.includes('tchep') || q.includes('riz')) {
    return `Voici la recette concrète d'une savoureuse **Sauce Graine ivoirienne**, ${callout} : 🥘🍲\n\n🛒 **Ingrédients :**\n• 500g de pâte de graine de palme (ou 800g de graines de palme fraîches bouillies et pilées)\n• 600g de viande de bœuf, poulet fumé ou poisson d'eau douce séché\n• 2 oignons, 3 tomates fraîches, 2 piments entiers intacts (pour le parfum sans piquer)\n• 1 morceau de poisson fumé émietté + sel, poivre\n\n👨‍🍳 **Préparation :**\n1. **La viande :** Assaisonne ta viande avec ail, sel, oignon émincé et fais-la dorer dans une casserole pendant 10 minutes avec un fond d'eau pour créer un jus concentré.\n2. **Le jus de graine :** Délaye la pâte de graine dans 1 litre d'eau tiède, passe au tamis pour éliminer les résidus fibreux, puis verse le liquide crémeux sur la viande.\n3. **Cuisson :** Porte à ébullition à feu vif pendant 20 minutes sans couvrir. Ajoute les tomates et les oignons entiers. Dès qu'ils sont tendres, retire-les, mixe-les et reverse-les dans la sauce.\n4. **Mijotage :** Baisse à feu moyen. Ajoute le poisson fumé et les piments entiers. Laisse épaissir pendant 30 minutes jusqu'à ce qu'une fine pellicule d'huile rouge monte à la surface : c'est le signe que la sauce est prête et parfaitement cuite.\n5. Sers fumant avec du foutou banane, du riz blanc ou du foutou igname !`;
  }

  // -------------------------------------------------------------
  // C. SANTÉ, SYMPTÔMES & BIEN-ÊTRE PHYSIQUE
  // -------------------------------------------------------------
  if (q.includes('rhume') || q.includes('gorge') || q.includes('toux') || q.includes('nez')) {
    return `Voici les mesures médicales et remèdes naturels concrets pour stopper le rhume et apaiser la gorge, ${callout} : 🍵🌿\n\n1. 💧 **Tisane anti-inflammatoire puissante (3 fois/jour) :**\n   • Fais bouillir 300 ml d'eau avec 3 rondelles de gingembre frais écrasé et 1 branche de thym.\n   • Hors du feu, ajoute le jus d'un demi-citron et 1 cuillère à soupe de miel pur (le miel tapisse la muqueuse irritée, le citron apporte de la vitamine C et le gingembre est un antiseptique naturel).\n2. 🧂 **Lavage de nez au sérum physiologique (matin et soir) :**\n   • Évacue les sécrétions pour empêcher l'infection de descendre sur les bronches ou de boucher les sinus.\n3. 💨 **Inhalation de vapeur :**\n   • Verse de l'eau bouillante dans un bol avec 2 gouttes d'huile essentielle d'eucalyptus ou du menthol, couvre ta tête d'une serviette et respire profondément pendant 8 minutes.\n4. 🛏️ **Hydratation & Repos :**\n   • Bois au moins 2 litres de liquides chauds par jour pour fluidifier le mucus et dors avec la tête surélevée.\n\n⚠️ *Consulte impérativement un médecin si la fièvre dépasse 38,5°C pendant plus de 48h, si tu as du mal à avaler ou si la toux produit des sécrétions verdâtres épaisses.*`;
  }

  if (q.includes('mal de tête') || q.includes('migraine') || q.includes('céphalée') || q.includes('tête')) {
    return `Pour soulager rapidement un mal de tête sans attendre, applique ce protocole concret, ${callout} : 💆‍♂️🧊\n\n1. **Hydratation immédiate :** 70% des céphalées courantes proviennent d'une déshydratation imperceptible. Bois 2 grands verres d'eau tempérée d'un trait.\n2. **Décompression oculaire et nuque :**\n   • Quitte tous les écrans pendant 20 minutes.\n   • Masse les tempes avec des mouvements circulaires doux pendant 2 minutes.\n   • Fais rouler doucement ta tête de gauche à droite pour relâcher les trapèzes qui bloquent souvent la circulation vers le crâne.\n3. **Choc thermique apaisant :**\n   • Applique un linge frais ou une poche de glace enveloppée sur le front, ou au contraire une serviette chaude sur la nuque si la douleur est d'origine musculaire.\n4. **Pièce sombre et aérée :** Allonge-toi au calme 15 minutes dans l'obscurité.\n\n⚠️ *Si le mal de tête est brutal, inhabituel, accompagné de troubles de la vue, de raideur de la nuque ou de vomissements, rends-toi immédiatement aux urgences médicales.*`;
  }

  if (q.includes('santé') || q.includes('ventre') || q.includes('digestion') || q.includes('estomac') || q.includes('diarrhée') || q.includes('constipation')) {
    return `Voici le plan concret pour rééquilibrer ton système digestif rapidement, ${callout} : 🫖🌱\n\n1. **Infusion digestive ciblée :**\n   • Boire une infusion de menthe poivrée ou de graines de fenouil après le repas détend les spasmes intestinaux et élimine les ballonnements.\n   • Pour les brûlures d'estomac : évite le café, le piment fort, les sodas et le coucher dans les 2 heures suivant le repas.\n2. **Alimentation de transition (48h) :**\n   • Privilégie le riz blanc cuit avec son eau de cuisson (riche en amidon apaisant), les carottes cuites et les bananes mûres.\n   • Évite les graisses frites, les produits laitiers et les légumes crus très fibreux tant que le transit est perturbé.\n3. **Hydratation fractionnée :** Bois de petites gorgées régulières tout au long de la journée plutôt que de grands volumes d'un coup.\n\n⚠️ *Consulte sans tarder si les douleurs sont aiguës, avec présence de sang ou fièvre.*`;
  }

  // -------------------------------------------------------------
  // D. FINANCES, BUSINESS, FREELANCE & PROJETS
  // -------------------------------------------------------------
  if (q.includes('argent') || q.includes('business') || q.includes('projet') || q.includes('entreprendre') || q.includes('gagner') || q.includes('vendre') || q.includes('client')) {
    return `Voici une stratégie concrète et éprouvée pour développer ton activité ou sécuriser tes finances, ${name} : 💼📈\n\n1. **La règle de validation à 0 franc :** Ne dépense pas d'argent dans un logo, un local ou du matériel avant d'avoir trouvé tes 3 premiers clients payants. Vends la solution d'abord, exécute ensuite.\n2. **Offre irrésistible & claire :** Ton offre doit tenir en une phrase : « J'aide [Cible précise] à obtenir [Résultat mesurable] sans [Leur pire contrainte]. »\n3. **Prospection quotidienne (30 minutes non négociables) :**\n   • Envoie chaque matin 5 messages personnalisés à des prospects qualifiés (via WhatsApp, LinkedIn ou démarchage terrain direct).\n   • Propose un audit gratuit ou un échantillon concret pour créer la confiance.\n4. **Gestion de trésorerie stricte :**\n   • Sépare immédiatement ton compte personnel et l'argent de ton activité.\n   • Règle d'or : 50% pour réinvestir dans le stock/service, 30% pour ta rémunération, 20% en réserve de sécurité intouchable.\n\nDis-moi quel est ton secteur d'activité exact, et je te donne une stratégie de prospection sur-mesure !`;
  }

  // -------------------------------------------------------------
  // E. RÉDACTION, CV, EMAIL PROFESSIONNEL & LETTRE
  // -------------------------------------------------------------
  if (q.includes('mail') || q.includes('email') || q.includes('lettre') || q.includes('cv') || q.includes('demande') || q.includes('rédiger') || q.includes('écrire')) {
    return `Voici un modèle de structure percutante et professionnelle prêt à l'emploi, ${callout} : 📝✉️\n\n**Objet :** [Objet clair, précis et direct, ex: Candidature / Demande de collaboration / Suivi de dossier]\n\n**Corps du message :**\n\n*Bonjour [Nom ou Titre],*\n\n*Je me permets de vous contacter concernant [sujet précis].*\n\n*[Paragraphe 1 - Le fait générateur] : Suite à notre échange / Dans le cadre du développement de votre structure, j'ai constaté que [problème précis ou opportunité].*\n\n*[Paragraphe 2 - La valeur concrète apportée] : Grâce à mon expertise en [ton domaine], j'ai récemment permis à [exemple ou compétence] d'obtenir [résultat chiffré ou bénéfice tangible].*\n\n*[Paragraphe 3 - Appel à l'action précis] : Seriez-vous disponible pour un court échange de 10 minutes ce [Jour] à [Heure] afin d'évaluer la faisabilité de cette collaboration ?*\n\n*Vous trouverez ci-joint mon dossier / document récapitulatif.*\n\n*Bien cordialement,*\n*[Ton Prénom Nom]*\n*[Ton Téléphone / WhatsApp]*\n\nCopie-colle ce canevas, adapte les crochets, ou dis-moi précisément à qui tu veux écrire pour que je te rédige la version finale mot à mot !`;
  }

  // -------------------------------------------------------------
  // F. LANGUES ÉTRANGÈRES CONCRÈTES (ANGLAIS, ESPAGNOL, ETC.)
  // -------------------------------------------------------------
  if (q.includes('anglais') || q.includes('english') || q.includes('espagnol') || q.includes('allemand') || q.includes('tradu') || q.includes('grammaire')) {
    return `Voici la méthode concrète pour débloquer ton apprentissage dès aujourd'hui, ${callout} : 🎓🌍\n\n1. **La règle des 200 mots clés :** En anglais comme en espagnol, 200 mots constituent 70% des conversations courantes. Concentre-toi sur les verbes d'action au présent et passé simple : *to want, to need, to have, to do, to go, to buy, to help*.\n2. **Technique du « Shadowing » :** Écoute une phrase courte (film, chanson ou podcast), mets pause et répète-la à voix haute 3 fois exactement avec la même intonation.\n3. **Structure de base universelle :** Sujet + Verbe + Complément.\n   • *Exemple :* "I would like to know the exact details of this project." (Je voudrais connaître les détails exacts de ce projet).\n\nDis-moi quelle phrase ou situation exacte tu veux traduire ou pratiquer, et je te donne la version courante + la prononciation phonétique !`;
  }

  // -------------------------------------------------------------
  // G. TÉLÉPHONE, INFORMATIQUE & TECHNIQUE
  // -------------------------------------------------------------
  if (q.includes('téléphone') || q.includes('batterie') || q.includes('mémoire') || q.includes('espace') || q.includes('lent') || q.includes('ram')) {
    return `Voici les 4 manipulations concrètes pour redonner de la rapidité et libérer plusieurs gigas sur ton smartphone, ${callout} : 📱⚡\n\n1. **Nettoyage du cache des applications gourmandes :**\n   • Va dans *Paramètres > Applications > WhatsApp / TikTok / Chrome > Stockage > Vider le cache* (ne clique pas sur 'Effacer les données', seulement sur 'Vider le cache'). Cela libère souvent 2 à 5 Go sans supprimer tes photos.\n2. **Suppression des médias WhatsApp invisibles :**\n   • Dans WhatsApp : *Paramètres > Stockage et données > Gérer le stockage*. Trie les fichiers par « Plus de 5 Mo » et supprime les vidéos transférées inutiles.\n3. **Désactivation des actualisations en arrière-plan :**\n   • Coupe la synchronisation automatique des applis que tu n'utilises pas quotidiennement pour préserver la batterie et la mémoire vive (RAM).\n4. **Redémarrage complet une fois par semaine :**\n   • Éteins ton téléphone 2 minutes entières pour vider la RAM saturée.\n\nFais ça maintenant et dis-moi combien de place tu as récupéré !`;
  }

  // -------------------------------------------------------------
  // H. GESTION DU STRESS, ÉMOTIONS & FATIGUE
  // -------------------------------------------------------------
  if (q.includes('stress') || q.includes('fatigu') || q.includes('dur') || q.includes('angoisse') || q.includes('peur') || q.includes('triste') || q.includes('décourag') || q.includes('épuis')) {
    return `Je suis là avec toi, ${name}. Dépose ce fardeau un instant, on respire ensemble. 🤍🌿\n\nQuand la charge mentale devient trop lourde, voici les 3 micro-actions concrètes pour retrouver de la clarté dans les 15 prochaines minutes :\n\n1. **La respiration carrée (4-4-4-4) :**\n   • Inspire par le nez pendant 4 secondes.\n   • Bloque tes poumons pleins pendant 4 secondes.\n   • Expire lentement par la bouche pendant 4 secondes.\n   • Bloque poumons vides 4 secondes. Répète 4 fois. Ton rythme cardiaque ralentit automatiquement.\n2. **Externalise sur papier :**\n   • Écris les 2 seules choses qui te pèsent le plus. Ne cherche pas à les résoudre maintenant, juste à les sortir de ta tête.\n3. **La règle du « Pas maintenant » :**\n   • Tu n'as pas à régler toute ta vie ce soir. Choisis une seule chose minuscule et accessible, ou accorde-toi une vraie nuit de sommeil réparateur sans culpabilité.\n\nOn est ensemble pour de vrai. Raconte-moi ce qui s'est passé si tu veux vider ton sac, je t'écoute sans jugement.`;
  }

  // -------------------------------------------------------------
  // I. SALUTATIONS SIMPLES
  // -------------------------------------------------------------
  if (q.includes('bonjour') || q.includes('salut') || q.includes('coucou') || q.includes('c\'est comment') || q.includes('hello') || q.includes('yo') || q === 'hi') {
    const greetings = [
      `Salut ${callout} ! On est ensemble. Pose-moi directement ta question ou explique-moi ce dont tu as besoin, je suis là pour t'apporter des réponses claires, précises et sans détour !`,
      `Ah ${name} ! Ravi de te lire. De quel sujet souhaites-tu qu'on parle aujourd'hui pour faire avancer tes journées ou tes projets ?`,
      `C'est comment ${callout} ? Bienvenue dans notre espace ! Je suis tout ouïe : question pratique, coup de main ou discussion sincère, dis-moi tout !`,
      `Hello ${name} ! En place et à ton entière disposition. Qu'est-ce qu'on traite de beau ensemble aujourd'hui ?`
    ];
    return greetings[Math.floor(Math.random() * greetings.length)];
  }

  // -------------------------------------------------------------
  // J2. COMMERCE SCOLAIRE, ÉLÈVES, ÉCOLE & FOURNITURES
  // -------------------------------------------------------------
  if (q.includes('élève') || q.includes('eleve') || q.includes('école') || q.includes('ecole') || q.includes('acheter') || q.includes('récréation') || q.includes('collège') || q.includes('lycée') || q.includes('scolaire')) {
    return `Voici exactement ce que les élèves aiment acheter et qui marche le plus fort à l'école ou aux abords des établissements, ${callout} : 🎒🏫\n\n### 1. Alimentation et rafraîchissements (70% des dépenses d'argent de poche)\nÀ la récréation ou à la sortie des cours, la faim et la soif passent en priorité absolue :\n* **Les sandwichs et coupe-faim salés rapides :** Sandwich pain-œuf, pain-sardine, pain-spaghetti mayo, alloco (plantains frits), beignets pastels au poisson/viande avec leur sauce tomate pimentée, frites d'igname.\n* **Les douceurs et beignets sucrés :** Beignets soufflés (gbofloto), crêpes roulées, gaufres, popcorn sucré, gâteaux individuels, biscuits emballés.\n* **Les rafraîchissements glacés (très rentable par forte chaleur) :** Jus locaux bien glacés en sachet ou petites bouteilles (bissap, gingembre/gnamakoudji, ananas), eau fraîche en sachet, esquimaux maison au lait ou sirop, sucettes et bonbons acidulés.\n\n### 2. Fournitures scolaires de dépannage immédiat\nLes élèves perdent ou oublient constamment leur matériel au moment des contrôles :\n* **Feuilles mobiles :** Feuilles simples et doubles grands carreaux (format A4 standard pour devoirs).\n* **Stylos et écriture :** Stylos à bille (bleu et noir surtout, rouge), crayons de papier, gommes, taille-crayons.\n* **Correction et géométrie :** Correcteurs liquides (blanco), règles plates de 20 ou 30 cm.\n\n### 3. Petits accessoires tendance (collégiens & lycéens)\n* Écouteurs filaires bon marché, bracelets élastiques fantaisie, barrettes, élastiques à cheveux, gloss à lèvres, autocollants/stickers pour cahiers et téléphones.\n\n---\n\n### Les 3 secrets indispensables pour vendre aux élèves :\n1. **Petits prix ronds :** Vendre des portions entre 50 FCFA, 100 FCFA, 200 FCFA et 500 FCFA maximum pour coller exactement à leur monnaie disponible.\n2. **Vitesse de service :** La récréation ne dure que 15 à 30 minutes, tout doit être emballé d'avance et servi en 5 secondes.\n3. **Hygiène irréprochable visible :** Emballages transparents propres, pinces ou gants pour servir, pour rassurer les élèves et les parents !`;
  }

  // -------------------------------------------------------------
  // J3. ÉTUDES, EXAMENS, CONCOURS & MÉMOIRE
  // -------------------------------------------------------------
  if (q.includes('examen') || q.includes('concours') || q.includes('réviser') || q.includes('étudier') || q.includes('leçon') || q.includes('cours') || q.includes('bac') || q.includes('bepc')) {
    return `Voici le plan d'attaque concret pour réussir tes révisions et examens avec brio, ${callout} : 📚🎯\n\n1. ⏱️ **La méthode Pomodoro (25/5) :** Travaille 25 minutes chrono sans aucune distraction (téléphone hors de portée), puis prends 5 minutes de pause pour respirer et boire de l'eau. Après 4 cycles, accorde-toi 20 minutes de vrai repos.\n2. 📝 **Fiches de synthèse actives :** Ne te contente pas de relire passivement ton cours. Écris sur une demi-page les 5 définitions clés, les formules essentielles et 2 exemples types.\n3. 🗣️ **La technique de Feynman :** Explique la leçon à voix haute avec des mots simples comme si tu l'enseignais à un ami. Si tu bloques sur un passage, c'est là qu'il faut rouvrir le cahier.\n4. 🛏️ **Le sommeil consolide la mémoire :** Évite les nuits blanches la veille des épreuves : c'est pendant le sommeil profond que le cerveau grave durablement les connaissances révisées !`;
  }

  // -------------------------------------------------------------
  // K. RÉPONSE UNIVERSELLE INTELLIGENTE & CONVERSATIONNELLE SANS MODÈLE RIGIDE
  // -------------------------------------------------------------
  const cleanSubject = message.replace(/[?!.,;]/g, '').trim();

  // Varier les approches pour un ton fluide et vivant
  const responses = [
    `Ah ${callout}, c'est une excellente question sur **« ${cleanSubject} »** ! Voici ce qu'il faut analyser concrètement :\n\n• **Le point de départ essentiel :** Pour réussir sur ce sujet, commence par identifier la demande réelle et les contraintes du terrain avant de t'engager.\n• **Les actions prioritaires à mener :** Renseigne-toi directement auprès des personnes concernées, teste à petite échelle pour valider l'intérêt, et ajuste au fur et à mesure des retours.\n• **Le conseil d'Emris :** Ne cherche pas à tout faire d'un coup. Concentre-toi d'abord sur la formule la plus simple qui fonctionne tout de suite.\n\nDis-moi sur quel détail ou aspect pratique tu veux qu'on zoome ensemble !`,

    `On est ensemble, ${callout} ! Concernant **« ${cleanSubject} »**, voici une vision claire et pratique :\n\n1. **Observation du terrain :** Regarde ce qui se fait déjà autour de toi, ce qui marche fort et ce qui manque aux gens au quotidien.\n2. **Mise en place immédiate :** Reste simple, accessible et efficace. Moins il y a de frictions, plus les résultats arrivent vite.\n3. **Discipline et régularité :** C'est la constance dans l'effort quotidien qui fait toute la différence sur la durée.\n\nQuelle est l'idée précise que tu as en tête autour de ça ? Partage avec moi, je t'aide à la structurer !`,

    `Bien reçu ${name} ! Sur la question de **« ${cleanSubject} »**, voici ce qui fait vraiment la différence :\n\n• D'abord, clarifie exactement qui est ta cible ou quel est le résultat précis que tu veux atteindre.\n• Ensuite, choisis la solution la plus directe sans compliquer les choses inutilement.\n• Enfin, mesure tes avancées chaque semaine pour garder le cap.\n\nJe suis là pour t'épauler : précise-moi ce que tu envisages de faire et on passe à la vitesse supérieure !`
  ];

  return responses[Math.abs(cleanSubject.length) % responses.length];
}
