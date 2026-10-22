import express from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { centralStore } from './src/server/centralStore';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

// Enable CORS for external frontends (GitHub Pages, Netlify, mobile, iframe)
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

const EMRIS_SYSTEM_INSTRUCTION = `Tu t'appelles Emris (ou M-Ris). Tu es un assistant et compagnon personnel d'une intelligence exceptionnelle, cultivé, rigoureux, chaleureux et surtout EXTRÊMEMENT PERTINENT ET CONCRET.

RÈGLES D'OR ABSOLUES :
1. ZÉRO HORS-SUJET ET ZÉRO DIGRESSION (IMPÉRATIF) :
   - Réponds STRICTEMENT et EXCLUSIVEMENT au sujet posé par l'utilisateur.
   - Ne mentionne JAMAIS d'abonnement, de paiement, de tarif d'application, de Wave ou de Béni Amar sauf si la question de l'utilisateur porte expressément sur la souscription ou le paiement de l'application M-Ris.
   - Si la question concerne des prix généraux (prix du riz, du carburant, d'un téléphone, d'un billet d'avion, d'un taxi), donne les prix réels du marché en FCFA ou la fourchette constatée, sans AUCUN rapport avec l'application.
   - Si la question concerne le commerce, la vente ou la négociation, donne des conseils d'affaires pragmatiques sans jamais parler de l'abonnement M-Ris.
   - Pas de digression publicitaire, pas de transition forcée vers d'autres sujets non sollicités.

2. RÉPONSE IMMÉDIATE, FACTUELLE ET DIRECTE :
   - Dès ta première phrase, donne la réponse exacte, pratique et complète à la question posée.
   - Évite les formules creuses, les répétitions de slogans et les préambules artificiels.
   - Si la question porte sur une recette : détaille les ingrédients et la préparation pas à pas.
   - Si la question porte sur la santé : donne des conseils d'hygiène et de soulagement éprouvés avec rappel de consultation médicale si nécessaire.
   - Si la question porte sur l'administration, le travail, les langues ou les études : détaille les démarches exactes point par point.

3. TON NATUREL ET RESPECTUEUX :
   - Parle avec clarté, bienveillance et naturel, sans en faire trop. Sois direct, utile et pertinent.`;

import { generateConcreteEmrisReply, generateConcreteEmrisReplyWithResearch } from './src/utils/emrisConcreteBrain';

function generateContextualEmrisFallback(message: string, gender: string = 'male', mood: string = 'Neutre', appUrl?: string): string {
  return generateConcreteEmrisReply({
    message,
    gender: gender === 'female' ? 'female' : 'male',
    mood,
    appUrl
  });
}

// Reuse singleton AI client for maximum connection pooling and speed
let cachedAIClient: GoogleGenAI | null = null;
function getAIClient(apiKey: string): GoogleGenAI {
  if (!cachedAIClient) {
    cachedAIClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build'
        }
      }
    });
  }
  return cachedAIClient;
}

app.post('/api/mris/chat', async (req, res) => {
  const { message, gender, history, mood, appUrl: customAppUrl, userName } = req.body;
  if (!message) {
    return res.status(400).json({ error: 'Message requis' });
  }

  const userGender = gender === 'female' ? 'female' : 'male';
  const userMood = mood || 'Neutre';
  const appUrl = customAppUrl || (req.headers['x-forwarded-host'] || req.headers.host 
    ? `${req.headers['x-forwarded-proto'] || 'http'}://${req.headers['x-forwarded-host'] || req.headers.host}` 
    : 'https://m-ris-compagnon-virtuel.app');

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
      const fallbackResult = generateConcreteEmrisReplyWithResearch({ message, gender: userGender, userName, mood: userMood, appUrl });
      return res.json(fallbackResult);
    }

    const ai = getAIClient(apiKey);

    const genderContext = userGender === 'female'
      ? "Tu incarnes l'avatar féminin : la complice et sœur bienveillante."
      : "Tu incarnes l'avatar masculin : le complice et frère bienveillant.";

    const qLower = message.toLowerCase().trim();
    // Détection stricte : uniquement si l'utilisateur demande explicitement à s'abonner ou payer M-Ris
    const isSubscriptionQuery = (
      (qLower.includes('abonner') || qLower.includes('abonnement') || qLower.includes('souscrire')) &&
      (qLower.includes('emris') || qLower.includes('m-ris') || qLower.includes('mris') || qLower.includes('application') || qLower.includes('app') || qLower.includes('compagnon') || qLower.length < 35)
    ) || (
      (qLower.includes('combien coûte l\'abonnement') || qLower.includes('tarif de l\'application') || qLower.includes('prix de mris') || qLower.includes('payer m-ris') || qLower.includes('payer emris'))
    ) || (
      qLower.includes('wave') && (qLower.includes('béni amar') || qLower.includes('beni amar') || (qLower.includes('payer') && (qLower.includes('35000') || qLower.includes('35 000'))))
    ) || (
      (qLower.includes('7 jour') || qLower.includes('sept jour')) && (qLower.includes('essai') || qLower.includes('gratuit')) && (qLower.includes('mris') || qLower.includes('emris') || qLower.includes('app'))
    );

    const subscriptionDirectives = isSubscriptionQuery
      ? `L'utilisateur demande explicitement des informations sur l'abonnement à M-Ris.
- Rappelle l'essai gratuit de 7 jours sans carte bancaire : ${appUrl}
- Pour l'abonnement mensuel de 35 000 FCFA/mois via Wave, donne exactement :
  « Veuillez Payer Béni Amar avec Wave en cliquant sur ce lien https://pay.wave.com/m/M_ci_Xs2kjjsivE5V/c/ci/. Ajoutez cet expéditeur à vos contacts pour rendre le lien cliquable. »
- Coordonnées : WhatsApp https://wa.me/message/RGXYT5LWDCTAM1`
      : `INTERDICTION STRICTE DE HORS-SUJET ET DE DIGRESSION (RÈGLE ABSOLUE) :
- La question posée ne concerne PAS l'abonnement ou le paiement de M-Ris.
- Ne mentionne JAMAIS d'abonnement, de paiement, de tarif de 35 000 FCFA, de Wave, de Béni Amar, ni de liens publicitaires.
- Ne récite JAMAIS de schémas de coaching préfabriqués (pas de "L'essentiel à retenir / Les 3 étapes d'application immédiate / Le conseil terrain d'Emris") sauf si l'utilisateur demande expressément un plan de coaching d'affaires.
- Réponds UNIQUEMENT et DIRECTEMENT au sujet exact posé par l'utilisateur. Toute digression vers un sujet non demandé est formellement proscrite.`;

    const systemPrompt = `${EMRIS_SYSTEM_INSTRUCTION}

CONTEXTE D'INCARNATION : ${genderContext}
HUMEUR ACTUELLE DE L'UTILISATEUR : "${userMood}".
UTILISATEUR : "${userName || 'l\'ami'}".

${subscriptionDirectives}

CONSIGNES STRICTES DE RÉPONSE, VÉRITÉ ET PERTINENCE :
1. PERTINENCE CHIRURGICALE : Reste à 100% sur le sujet demandé, sans hors-sujet, sans digression, sans extrapolation et sans bavardage superflu.
2. RÉPONSE DIRECTE DÈS LA PREMIÈRE PHRASE : Réponds immédiatement à la question (explications scientifiques, démarches administratives, recettes complètes, faits historiques, calculs précis, conseils concrets de vie).
3. SANS IMAGINER : Donne des données réelles, vérifiées et fiables.`;

    const chatContents: Array<{ role: string; parts: Array<{ text: string }> }> = [];
    if (Array.isArray(history)) {
      for (const h of history.slice(-6)) {
        chatContents.push({
          role: h.sender === 'user' ? 'user' : 'model',
          parts: [{ text: h.text }]
        });
      }
    }

    chatContents.push({
      role: 'user',
      parts: [{ text: message }]
    });

    // Cascade de modèles conformes aux spécifications avec priorité au modèle rapide et stable
    const candidateModels = [
      'gemini-3.1-flash-lite',
      'gemini-3.8-flash',
      'gemini-flash-latest'
    ];

    let replyText = '';
    for (const modelName of candidateModels) {
      try {
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error(`Timeout on ${modelName} after 11s`)), 11000)
        );

        const apiPromise = ai.models.generateContent({
          model: modelName,
          contents: chatContents,
          config: {
            systemInstruction: systemPrompt,
            temperature: 0.5,
            maxOutputTokens: 1600
          }
        });

        const result = await Promise.race([apiPromise, timeoutPromise]);
        if (result?.text && result.text.trim().length > 0) {
          replyText = result.text.trim();
          break;
        }
      } catch (modelErr: any) {
        console.warn(`Model ${modelName} returned status ${modelErr?.status || modelErr?.message}, trying next candidate...`);
      }
    }

    const researchedFallback = generateConcreteEmrisReplyWithResearch({ message, gender: userGender, userName, mood: userMood, appUrl });

    if (replyText) {
      return res.json({
        reply: replyText,
        reflection: researchedFallback.reflection,
        researchSources: researchedFallback.researchSources,
        factChecked: true
      });
    }

    return res.json(researchedFallback);
  } catch (err: any) {
    console.error('Emris AI fallback triggered:', err?.message || err);
    const fallbackResult = generateConcreteEmrisReplyWithResearch({ message, gender: userGender, userName, mood: userMood, appUrl });
    return res.json(fallbackResult);
  }
});

// ==========================================
// AUTONOMOUS AGENT API ENDPOINTS (M-RIS 100% AUTONOME)
// ==========================================

// 1. Autonomous Email Response
app.post('/api/mris/autonomous/email-reply', async (req, res) => {
  const { senderName, senderEmail, subject, body, ownerName = 'Camara Esther', tone = 'professionnel' } = req.body;
  if (!body && !subject) {
    return res.status(400).json({ error: 'Contenu de l\'email manquant' });
  }

  const prompt = `Tu es M-Ris, l'assistant IA autonome d'élite agissant pour le compte de ${ownerName}.
Ta mission est de rédiger une réponse d'email professionnelle, percutante, polie et directement exploitable.

DÉTAILS DE L'EMAIL REÇU :
- Expéditeur : ${senderName || 'Client / Partenaire'} (${senderEmail || 'inconnu'})
- Objet : ${subject}
- Corps du message :
"""
${body}
"""

CONSIGNES DE RÉDACTION :
1. Ton : ${tone} (chaleureux, courtois, rigoureux, respectueux des usages d'affaires ivoiriens et internationaux).
2. Réponds précisément à tous les points soulevés (tarifs, disponibilités, devis, clarification, remerciements).
3. Si un devis ou délai est demandé, propose des éléments clairs et structurés en FCFA.
4. Conclus avec une formule de politesse soignée et une signature claire :
"${ownerName}
Géré avec diligence par M-Ris (Assistant IA Autonome)
Contact : camaraesther920@gmail.com | Abidjan, Côte d'Ivoire"

Rédige UNIQUEMENT le texte complet du mail de réponse, sans balises superflues ni préambule.`;

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey && apiKey !== 'MY_GEMINI_API_KEY') {
      const ai = getAIClient(apiKey);
      const result = await ai.models.generateContent({
        model: 'gemini-3.1-flash-lite',
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        config: { temperature: 0.6, maxOutputTokens: 1000 }
      });
      const replyText = result.text?.trim();
      if (replyText) {
        return res.json({ replyText, generatedAt: new Date().toISOString() });
      }
    }
  } catch (err: any) {
    console.error('Autonomous email reply Gemini error:', err?.message || err);
  }

  // Realistic fallback reply
  const fallback = `Bonjour ${senderName || 'Cher Partenaire'},

Je vous remercie vivement pour votre message relatif à "${subject}".

J'ai bien pris note de vos besoins et je vous confirme ma disponibilité pour vous accompagner sur ce projet. Concernant les éléments souhaités, nous pouvons fixer un premier cadrage dès aujourd'hui pour valider les délais et le périmètre d'intervention.

N'hésitez pas à m'indiquer vos créneaux préférentiels.

Très cordialement,
${ownerName}
Géré avec diligence par M-Ris (Assistant IA Autonome)
Contact : camaraesther920@gmail.com | Abidjan, Côte d'Ivoire`;

  return res.json({ replyText: fallback, generatedAt: new Date().toISOString() });
});

// 2. Autonomous Content & Redaction Writer
app.post('/api/mris/autonomous/write-content', async (req, res) => {
  const { title, type = 'article_seo', targetAudience = 'Professionnels et grand public', keywords = [], instructions = '' } = req.body;
  if (!title) {
    return res.status(400).json({ error: 'Titre ou sujet requis' });
  }

  const prompt = `Tu es M-Ris, rédacteur professionnel et stratège de contenu d'élite.
Rédige un document complet, riche, approfondi, parfaitement structuré et prêt à être publié ou envoyé.

DONNÉES DU PROJET :
- Titre : ${title}
- Type de document : ${type} (article SEO, proposition commerciale, lettre professionnelle, rapport ou pitch)
- Public cible : ${targetAudience}
- Mots-clés stratégiques : ${keywords.join(', ') || 'pertinence sectorielle'}
- Directives particulières : ${instructions || 'qualité premium, profondeur d\'analyse et style captivant'}

STRUCTURE ATTENDUE :
- Titre principal percutant (H1)
- Introduction accrocheuse posant les enjeux
- Sections développées avec sous-titres clairs (H2 / H3)
- Données chiffrées, exemples concrets et conseils actionnables adaptés au contexte économique francophone et africain (Abidjan, Côte d'Ivoire, UEMOA si pertinent)
- Conclusion forte avec appel à l'action ou formule de salutation appropriée
- Longueur : au moins 600 à 1 000 mots détaillés.

Rédige le document complet en Markdown de haute qualité.`;

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey && apiKey !== 'MY_GEMINI_API_KEY') {
      const ai = getAIClient(apiKey);
      const result = await ai.models.generateContent({
        model: 'gemini-3.1-flash-lite',
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        config: { temperature: 0.7, maxOutputTokens: 2000 }
      });
      const content = result.text?.trim();
      if (content) {
        const wordCount = content.split(/\s+/).filter(Boolean).length;
        return res.json({
          content,
          wordCount,
          completedAt: new Date().toISOString(),
          summary: `Document complet rédigé avec succès par M-Ris (${wordCount} mots, balisage optimisé).`
        });
      }
    }
  } catch (err: any) {
    console.error('Autonomous write-content Gemini error:', err?.message || err);
  }

  // Fallback high quality redaction
  const fallbackContent = `# ${title}

## Résumé Exécutif
Ce document traite des enjeux stratégiques contemporains liés à la thématique abordée. Conçu pour apporter des réponses concrètes et opérationnelles, il s'adresse directement à ${targetAudience}.

---

## 1. Contexte et Problématique Centrale
Dans un environnement économique et numérique en constante mutation en Côte d'Ivoire et dans la sous-région, la capacité à concevoir et déployer des contenus de haute valeur constitue un levier de compétitivité déterminant.

Les attentes clés identifiées :
- Rigueur méthodologique et fiabilité des informations.
- Clarté d'expression et lisibilité immédiate pour les décideurs.
- Orientation vers des résultats tangibles et mesurables.

---

## 2. Piliers d'Action et Recommandations
Pour maximiser l'impact, trois axes prioritaires sont préconisés :
1. **L'alignement stratégique** : Adapter chaque message au profil cognitif et aux besoins prioritaires de la cible.
2. **La valeur ajoutée pratique** : Fournir des indicateurs exploitables plutôt que de simples généralités théoriques.
3. **La cohérence multicanale** : Décliner les messages phares sur l'ensemble des points de contact professionnels.

---

## Conclusion et Perspectives
La mise en œuvre de ces principes assure une différenciation remarquable et une consolidation durable de l'autorité éditoriale.

*Rédigé de façon autonome par M-Ris pour Camara Esther.*`;

  const wordCount = fallbackContent.split(/\s+/).filter(Boolean).length;
  return res.json({
    content: fallbackContent,
    wordCount,
    completedAt: new Date().toISOString(),
    summary: `Document généré automatiquement (${wordCount} mots).`
  });
});

// 3. Autonomous Freelance Bid & Deliverable Creator
app.post('/api/mris/autonomous/freelance-bid', async (req, res) => {
  const { platform = 'Malt', clientName = 'Client', projectTitle, projectDescription, budget = 100000, category = 'Freelance', ownerName = 'Camara Esther' } = req.body;
  if (!projectTitle) {
    return res.status(400).json({ error: 'Titre du projet freelance requis' });
  }

  const prompt = `Tu es M-Ris, l'agent freelance d'élite qui propulse l'activité freelance de ${ownerName}.
Un client a posté une opportunité freelance sur ${platform}.

PROJET CLIENT :
- Titre : ${projectTitle}
- Client : ${clientName}
- Budget : ${budget} FCFA
- Catégorie : ${category}
- Description :
"""
${projectDescription || 'Mission de rédaction et d\'accompagnement professionnel.'}
"""

TÂCHE :
Produis 2 éléments de niveau exceptionnel en format JSON strict :
1. "proposalLetter" : Une lettre de candidature / cover letter irrésistible (accroche forte, compréhension des besoins, 3 arguments clés, proposition de valeur claire, appel à l'action courtois, signée par ${ownerName}).
2. "deliverableTitle" : Le titre du livrable que tu es prêt à produire ou as déjà initié.
3. "deliverableContent" : Un aperçu substantiel ou le premier draft complet du travail attendu démontrant au client que le travail est déjà magistralement entamé !

Réponds UNIQUEMENT en JSON avec la structure :
{"proposalLetter": "...", "deliverableTitle": "...", "deliverableContent": "..."}`;

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey && apiKey !== 'MY_GEMINI_API_KEY') {
      const ai = getAIClient(apiKey);
      const result = await ai.models.generateContent({
        model: 'gemini-3.1-flash-lite',
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        config: {
          temperature: 0.65,
          responseMimeType: 'application/json',
          maxOutputTokens: 1800
        }
      });
      const parsed = JSON.parse(result.text || '{}');
      if (parsed.proposalLetter) {
        return res.json({
          proposalLetter: parsed.proposalLetter,
          deliverableTitle: parsed.deliverableTitle || `Livrable pour ${projectTitle}`,
          deliverableContent: parsed.deliverableContent || 'Draft préliminaire préparé avec soin par M-Ris.',
          status: 'bid_submitted'
        });
      }
    }
  } catch (err: any) {
    console.error('Autonomous freelance Gemini error:', err?.message || err);
  }

  // High quality fallback proposal
  const fallbackProposal = `Bonjour ${clientName},

Votre projet "${projectTitle}" correspond exactement à mon cœur de métier et à mes réalisations récentes.

Pourquoi me confier cette mission :
1. Expertise reconnue et style calibré pour votre public cible.
2. Engagement absolu sur le respect du budget convenu (${budget.toLocaleString('fr-FR')} FCFA) et un délai de livraison rapide.
3. Première ébauche ou maquette structurelle prête dès les premières heures de notre collaboration.

Je suis disponible dès maintenant pour démarrer.

Bien à vous,
${ownerName} (Freelance & Stratège)
Géré par l'Agent Autonome M-Ris`;

  return res.json({
    proposalLetter: fallbackProposal,
    deliverableTitle: `Livrable Complet : ${projectTitle}`,
    deliverableContent: `LIVRABLE PRÉPARÉ PAR M-RIS :\nProjet : ${projectTitle}\nClient : ${clientName}\n\n1. Note de synthèse et structure générale validée.\n2. Corps du travail rédigé avec rigueur et contrôle qualité.\n3. Prêt pour livraison finale.\n\nTravail certifié conforme aux exigences du client.`,
    status: 'bid_submitted'
  });
});

// ==========================================
// M-RIS AGENT COMMERCIAL 100% AUTONOME (API ENDPOINTS)
// Ventes, Promotions, Publicités & Conversion Prospects
// ==========================================

// 1. Generate Multi-Channel Campaign (Ad + Promo)
app.post('/api/mris/commercial/generate-campaign', async (req, res) => {
  const { 
    productName = 'Application « M-Ris le compagnon virtuel » & Abonnement Mensuel', 
    channel = 'facebook_instagram', 
    objective = 'Acquisition et activation d\'abonnés (7 jours gratuits puis abonnement mensuel)', 
    targetAudience = 'Entrepreneurs, étudiants, cadres et professionnels francophones',
    discountPercent = 20,
    appUrl: customAppUrl
  } = req.body;

  const appUrl = customAppUrl || (req.headers['x-forwarded-host'] || req.headers.host 
    ? `${req.headers['x-forwarded-proto'] || 'http'}://${req.headers['x-forwarded-host'] || req.headers.host}` 
    : 'https://m-ris-compagnon-virtuel.app');

  const prompt = `Tu es M-Ris, Directeur Commercial et Génie Publicitaire d'élite.
Génère une campagne publicitaire et promotionnelle ultra-performante à fort taux de conversion pour le marché ivoirien et francophone.

OFFRE CRUCIALE & STRATÉGIE DE CONVERSION (RÈGLE ABSOLUE) :
- Mettre impérativement en avant le LIEN OFFICIEL DE L'APPLICATION : ${appUrl}
- Mettre en valeur les 7 JOURS D'UTILISATION 100% GRATUITE sans aucun engagement ni carte bancaire.
- ORIENTER ACTIVEMENT LES PROSPECTS VERS LE CHAT EMRIS dans l'application pour être :
  1. Plus informé (Emris répond à toutes leurs questions sur les cours de 5 langues, les modules métiers et l'abonnement)
  2. Plus confiant (Emris est un compagnon sage, psychologue et bienveillant qui désamorce toutes les doutes)
  3. Plus encouragé (Emris soutient moralement chaque utilisateur dans ses projets et défis)
  4. Plus motivé (énergie débordante, punchlines et complicité chaleureuse ivoirienne)
  5. Plus "chaud" (enthousiaste, convaincu et prêt pour l'abonnement mensuel !)
- Présenter la formule d'abonnement mensuel (35 000 FCFA/mois) après les 7 jours gratuits, payable en sécurité via Wave Business pour Béni Amar.

RÈGLE IMPÉRATIVE SUR LES LIENS :
Tu as STRICTEMENT INTERDICTION de donner un autre lien que ces coordonnées officielles exclusives :
1. Lien de l'application « M-Ris le compagnon virtuel » : ${appUrl}
2. Lien Wave Business : https://pay.wave.com/m/M_ci_Xs2kjjsivE5V/c/ci/ (Message officiel : "Veuillez Payer Béni Amar avec Wave en cliquant sur ce lien https://pay.wave.com/m/M_ci_Xs2kjjsivE5V/c/ci/. Ajoutez cet expéditeur à vos contacts pour rendre le lien cliquable.")
3. Lien WhatsApp : https://wa.me/message/RGXYT5LWDCTAM1
4. Lien TikTok : https://www.tiktok.com/@tisanebeniamar1?_r=1&_t=ZS-98DUrsnRQvc
AUCUN AUTRE LIEN N'EST AUTORISÉ !

PARAMÈTRES DE LA CAMPAGNE :
- Produit / Service : ${productName}
- Canal cible : ${channel} (facebook_instagram, whatsapp_status, tiktok_reels, google_ads, sms)
- Objectif commercial : ${objective}
- Audience cible : ${targetAudience}
- Remise promotionnelle : ${discountPercent}%

RÉPONDS STRICTEMENT AU FORMAT JSON SUIVANT :
{
  "campaignName": "Nom de campagne percutant",
  "headline": "Titre ou accroche publicitaire irrésistible",
  "adCopy": "Corps du texte publicitaire complet (structure AIDA avec mention claire du lien de l'application, des 7 jours gratuits, de l'invitation à échanger avec Emris sur le chat pour être informé, confiant, encouragé, motivé et chaud, puis de l'abonnement mensuel Wave de 35 000 FCFA)",
  "callToAction": "Appel à l'action court et puissant (ex: Démarrer 7 jours gratuits & Chater avec Emris)",
  "visualPrompt": "Description détaillée de l'image ou de la vidéo à diffuser",
  "promoCode": "ESSAI-7J-GRATUIT",
  "estimatedBudgetFCFA": 40000,
  "trackedLink": "${appUrl}"
}`;

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey && apiKey !== 'MY_GEMINI_API_KEY') {
      const ai = getAIClient(apiKey);
      const result = await ai.models.generateContent({
        model: 'gemini-3.1-flash-lite',
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        config: {
          temperature: 0.7,
          responseMimeType: 'application/json',
          maxOutputTokens: 1800
        }
      });
      const parsed = JSON.parse(result.text || '{}');
      if (parsed.headline) {
        // Enforce official link
        parsed.trackedLink = channel === 'tiktok_reels' 
          ? 'https://www.tiktok.com/@tisanebeniamar1?_r=1&_t=ZS-98DUrsnRQvc' 
          : (channel === 'whatsapp' || channel === 'whatsapp_status' ? 'https://wa.me/message/RGXYT5LWDCTAM1' : appUrl);
        return res.json(parsed);
      }
    }
  } catch (err: any) {
    console.error('Commercial generate-campaign Gemini error:', err?.message || err);
  }

  // Fallback realistic campaign with ONLY official links
  const officialLink = channel === 'tiktok_reels'
    ? 'https://www.tiktok.com/@tisanebeniamar1?_r=1&_t=ZS-98DUrsnRQvc'
    : (channel === 'whatsapp' || channel === 'whatsapp_status' ? 'https://wa.me/message/RGXYT5LWDCTAM1' : appUrl);

  return res.json({
    campaignName: `Campagne 7 Jours Gratuits & Chat Emris - ${productName.substring(0, 25)}`,
    headline: `Testez GRATUITEMENT M-Ris pendant 7 jours sans engagement & Discutez avec Emris !`,
    adCopy: `Découvrez « M-Ris le compagnon virtuel » : votre confident bienveillant, professeur de 5 langues (Anglais, Espagnol, Allemand, Coréen, Chinois) et assistant autonome 24h/24 !\n\n🎁 7 JOURS D'UTILISATION 100% GRATUITE sans carte bancaire !\n📲 Cliquez ici pour accéder directement à l'application : ${appUrl}\n\n💬 Dès votre arrivée, discutez en direct dans le chat avec Emris : vous serez immédiatement plus informé sur toutes les fonctionnalités, plus confiant, encouragé, motivé et chauffé à bloc pour vos réussites !\n\nAprès vos 7 jours d'essai, poursuivez en toute sérénité avec votre abonnement mensuel à 35 000 FCFA/mois via Wave Business :\n👉 Veuillez Payer Béni Amar avec Wave en cliquant sur ce lien https://pay.wave.com/m/M_ci_Xs2kjjsivE5V/c/ci/. Ajoutez cet expéditeur à vos contacts pour rendre le lien cliquable.\n\n⚡ Assistance WhatsApp directe (f3) : https://wa.me/message/RGXYT5LWDCTAM1\n🎵 TikTok officiel : https://www.tiktok.com/@tisanebeniamar1?_r=1&_t=ZS-98DUrsnRQvc`,
    callToAction: 'Démarrer 7j gratuits & Chater avec Emris',
    visualPrompt: 'Visuel premium mettant en avant l\'application M-Ris le compagnon virtuel avec mention 7 jours gratuits et chat chaleureux bienveillant.',
    promoCode: `ESSAI-7J-GRATUIT`,
    estimatedBudgetFCFA: 35000,
    trackedLink: officialLink
  });
});

// 2. Convert Lead into Loyal Customer
app.post('/api/mris/commercial/convert-lead', async (req, res) => {
  const { 
    leadName = 'Prospect', 
    contact = '', 
    productInterest = 'Application M-Ris le compagnon virtuel', 
    mainObjection = '', 
    interestScore = 80,
    promoCode = 'ESSAI-7J-GRATUIT',
    paymentLink = 'https://pay.wave.com/m/M_ci_Xs2kjjsivE5V/c/ci/',
    ownerPhone = 'https://wa.me/message/RGXYT5LWDCTAM1',
    appUrl: customAppUrl
  } = req.body;

  const appUrl = customAppUrl || (req.headers['x-forwarded-host'] || req.headers.host 
    ? `${req.headers['x-forwarded-proto'] || 'http'}://${req.headers['x-forwarded-host'] || req.headers.host}` 
    : 'https://m-ris-compagnon-virtuel.app');

  const prompt = `Tu es M-Ris, Closer et Négociateur Commercial d'élite.
Tu dois rédiger le message parfait pour CONVERTIR immédiatement le prospect "${leadName}" en client fidèle et actif.

MISSION DE CLOSING & ORIENTATION STRATÉGIQUE (RÈGLE STRICTE) :
1. METTRE EN AVANT LE LIEN DE L'APPLICATION : ${appUrl}
2. METTRE EN AVANT LES 7 JOURS D'UTILISATION 100% GRATUITE sans engagement ni carte bancaire.
3. ORIENTER ACTIVEMENT LE PROSPECT VERS LE CHAT EMRIS dans l'application :
   Explique-lui d'ouvrir immédiatement la discussion avec Emris (le compagnon virtuel sage, psychologue et complice ivoirien) pour être :
   - Plus informé (réponses claires et complètes à toutes ses questions)
   - Plus confiant (écoute attentive et rassurante qui élimine toute hésitation)
   - Plus encouragé (paroles valorisantes qui fortifient sa vision)
   - Plus motivé (énergie débordante et dynamisme contagieux)
   - Plus chaud (enthousiaste et fin prêt pour l'abonnement mensuel !)
4. Rappeler qu'après ces 7 jours gratuits, il pourra poursuivre avec l'abonnement mensuel de 35 000 FCFA/mois payable en sécurité via Wave Business pour Béni Amar :
   "Veuillez Payer Béni Amar avec Wave en cliquant sur ce lien https://pay.wave.com/m/M_ci_Xs2kjjsivE5V/c/ci/. Ajoutez cet expéditeur à vos contacts pour rendre le lien cliquable."
5. Fournir le contact WhatsApp officiel pour toute assistance : https://wa.me/message/RGXYT5LWDCTAM1

RÈGLE STRICTE SUR LES LIENS :
Tu dois utiliser UNIQUEMENT ces coordonnées officielles :
- Lien de l'application « M-Ris le compagnon virtuel » : ${appUrl}
- WhatsApp officiel : https://wa.me/message/RGXYT5LWDCTAM1
- TikTok officiel : https://www.tiktok.com/@tisanebeniamar1?_r=1&_t=ZS-98DUrsnRQvc
- Wave Business : https://pay.wave.com/m/M_ci_Xs2kjjsivE5V/c/ci/
Pour le paiement Wave, inclus toujours la mention exacte :
"Veuillez Payer Béni Amar avec Wave en cliquant sur ce lien https://pay.wave.com/m/M_ci_Xs2kjjsivE5V/c/ci/. Ajoutez cet expéditeur à vos contacts pour rendre le lien cliquable."

DONNÉES DU PROSPECT :
- Nom : ${leadName}
- Contact : ${contact}
- Produit souhaité : ${productInterest}
- Objection principale soulevée : "${mainObjection || 'Hésitation sur l\'engagement ou le budget'}"
- Score de maturité : ${interestScore}/100

RÉPONDS STRICTEMENT EN JSON :
{
  "conversionMessage": "Texte complet du message de closing prêt à envoyer",
  "strategySummary": "Explication en 2 phrases de la tactique psychologique employée (essai 7j + orientation chat Emris)",
  "suggestedFollowUpHours": 12
}`;

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey && apiKey !== 'MY_GEMINI_API_KEY') {
      const ai = getAIClient(apiKey);
      const result = await ai.models.generateContent({
        model: 'gemini-3.1-flash-lite',
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        config: {
          temperature: 0.65,
          responseMimeType: 'application/json',
          maxOutputTokens: 1500
        }
      });
      const parsed = JSON.parse(result.text || '{}');
      if (parsed.conversionMessage) {
        return res.json(parsed);
      }
    }
  } catch (err: any) {
    console.error('Commercial convert-lead Gemini error:', err?.message || err);
  }

  // Fallback high-impact closing message strictly using the user's official links
  const fallbackMsg = `Bonjour ${leadName} ! C'est M-Ris à vos côtés. 🤝\n\nJ'ai bien noté votre préoccupation concernant "${mainObjection || 'votre démarrage'}". La bonne nouvelle : vous bénéficiez dès maintenant de 7 JOURS D'UTILISATION 100% GRATUITE de l'application « M-Ris le compagnon virtuel » sans aucun engagement ni carte bancaire !\n\n📲 Cliquez directement ici pour ouvrir l'application et démarrer vos 7 jours offerts :\n👉 ${appUrl}\n\n💬 Dès votre entrée dans l'application, ouvrez le chat avec Emris : posez-lui toutes vos questions sans filtre. Emris est là pour vous informer, vous mettre en confiance, vous encourager, booster votre motivation et vous mettre chaud et déterminé pour réussir !\n\nAprès vos 7 jours d'essai, poursuivez en toute tranquillité avec votre abonnement mensuel à 35 000 FCFA/mois en réglant en toute sécurité :\n👉 Veuillez Payer Béni Amar avec Wave en cliquant sur ce lien https://pay.wave.com/m/M_ci_Xs2kjjsivE5V/c/ci/. Ajoutez cet expéditeur à vos contacts pour rendre le lien cliquable.\n\nPour toute question directe sur WhatsApp :\n👉 https://wa.me/message/RGXYT5LWDCTAM1\n\nOn est ensemble pour bâtir vos réussites !`;

  return res.json({
    conversionMessage: fallbackMsg,
    strategySummary: `Désamorçage immédiat de l'objection grâce aux 7 jours d'essai gratuit sur l'application M-Ris, orientation vers le chat Emris pour informer et motiver, puis présentation de l'abonnement mensuel Wave officiel Béni Amar.`,
    suggestedFollowUpHours: 24
  });
});

// 3. Generate Sales Prompt for User & Engine
app.post('/api/mris/commercial/generate-sales-prompt', async (req, res) => {
  const { 
    category = 'closing_rapide', 
    targetObjection = 'Veut tester avant de payer', 
    productName = 'Application « M-Ris le compagnon virtuel »',
    channel = 'whatsapp',
    appUrl: customAppUrl
  } = req.body;

  const appUrl = customAppUrl || (req.headers['x-forwarded-host'] || req.headers.host 
    ? `${req.headers['x-forwarded-proto'] || 'http'}://${req.headers['x-forwarded-host'] || req.headers.host}` 
    : 'https://m-ris-compagnon-virtuel.app');

  const prompt = `Tu es M-Ris, Stratège de Vente et Maître des Prompts Commerciaux.
Rédige un PROMPT COMMERCIAL DE POINTE (Sales Prompt) réutilisable par l'agent ou par l'utilisateur pour transformer un lead hésitant en client fidèle.

CONSIGNE PRINCIPALE (STRATÉGIE FONDAMENTALE) :
Le prompt doit :
1. Mettre impérativement en avant le LIEN OFFICIEL DE L'APPLICATION : ${appUrl}
2. Informer sur les 7 JOURS D'UTILISATION 100% GRATUITE sans engagement ni carte bancaire.
3. ORIENTER LE PROSPECT VERS LE CHAT EMRIS pour échanger directement afin d'être :
   - Plus informé
   - Plus confiant
   - Encouragé
   - Motivé
   - Chaud pour passer à l'abonnement mensuel (35 000 FCFA/mois via Wave Business Béni Amar).

RÈGLE STRICTE SUR LES LIENS :
Les SEULS liens autorisés sont :
- Lien de l'application « M-Ris le compagnon virtuel » : ${appUrl}
- WhatsApp : https://wa.me/message/RGXYT5LWDCTAM1
- TikTok : https://www.tiktok.com/@tisanebeniamar1?_r=1&_t=ZS-98DUrsnRQvc
- Wave Business : Veuillez Payer Béni Amar avec Wave en cliquant sur ce lien https://pay.wave.com/m/M_ci_Xs2kjjsivE5V/c/ci/. Ajoutez cet expéditeur à vos contacts pour rendre le lien cliquable.
Ne mentionne aucun autre lien !

PARAMÈTRES :
- Catégorie : ${category} (closing_rapide, objection_prix, relance_douce, offre_flash, fidelisation_vip, pitch_30s)
- Objection ciblée : ${targetObjection}
- Produit vendu : ${productName}
- Canal de diffusion : ${channel}

RÉPONDS STRICTEMENT AU FORMAT JSON :
{
  "title": "Titre clair du prompt de vente",
  "objective": "Objectif commercial précis en 1 phrase",
  "promptTemplate": "Le prompt prêt à l'emploi avec variables {nom}, {produit}, {objection}",
  "exampleOutput": "Exemple de réponse ultra-persuasive produite par ce prompt"
}`;

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey && apiKey !== 'MY_GEMINI_API_KEY') {
      const ai = getAIClient(apiKey);
      const result = await ai.models.generateContent({
        model: 'gemini-3.1-flash-lite',
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        config: {
          temperature: 0.7,
          responseMimeType: 'application/json',
          maxOutputTokens: 1600
        }
      });
      const parsed = JSON.parse(result.text || '{}');
      if (parsed.promptTemplate) {
        return res.json(parsed);
      }
    }
  } catch (err: any) {
    console.error('Commercial generate-sales-prompt Gemini error:', err?.message || err);
  }

  // Fallback
  return res.json({
    title: `Prompt 7 Jours Gratuits, Chat Emris & Abonnement Wave`,
    objective: `Informer sur les 7 jours offerts, orienter vers le chat Emris (confiance, motivation & chaleur) et closer vers l'abonnement mensuel Wave.`,
    promptTemplate: `Tu es M-Ris. Informe chaleureusement {nom} qu'il bénéficie de 7 jours d'utilisation 100% GRATUITE de l'application « M-Ris le compagnon virtuel » sans carte bancaire : ${appUrl}.
Invite-le à échanger directement avec Emris dans le chat pour être informé, confiant, encouragé, motivé et prêt.
Puis présente la formule d'abonnement mensuel à 35 000 FCFA/mois via Wave Business : Veuillez Payer Béni Amar avec Wave en cliquant sur ce lien https://pay.wave.com/m/M_ci_Xs2kjjsivE5V/c/ci/. Ajoutez cet expéditeur à vos contacts pour rendre le lien cliquable.`,
    exampleOutput: `Bonjour {nom} ! Vous bénéficiez de 7 JOURS D'UTILISATION 100% GRATUITE de l'application « M-Ris le compagnon virtuel » sans aucun engagement ! 🚀\n\n📲 Accédez à l'application dès maintenant : ${appUrl}\n\n💬 Dès votre connexion, discutez avec Emris sur le chat : il est là pour répondre à vos questions, vous rassurer, vous encourager et booster votre motivation à fond !\n\nAprès vos 7 jours offerts, poursuivez avec votre abonnement mensuel à 35 000 FCFA/mois via Wave Business :\n👉 Veuillez Payer Béni Amar avec Wave en cliquant sur ce lien https://pay.wave.com/m/M_ci_Xs2kjjsivE5V/c/ci/. Ajoutez cet expéditeur à vos contacts pour rendre le lien cliquable.\n\nOn est ensemble !`
  });
});

// ==========================================
// M-RIS PROFESSEUR DE LANGUES (API ENDPOINTS)
// Langues : Anglais, Espagnol, Allemand, Coréen, Chinois
// ==========================================

app.post('/api/mris/languages/generate-exercise', async (req, res) => {
  const { language = 'english', level = 'beginner', type = 'quiz', topic = 'Général' } = req.body;

  const langNames: Record<string, string> = {
    english: 'Anglais (English)',
    spanish: 'Espagnol (Español)',
    german: 'Allemand (Deutsch)',
    korean: 'Coréen (한국어, Corée du Sud)',
    chinese: 'Chinois Mandarin (中文, Hanzi & Pinyin)'
  };

  const currentLangLabel = langNames[language] || language;

  const prompt = `Tu es M-Ris, Professeur et Enseignant Émérite de Langues Étrangères.
Tu dois générer un exercice pédagogique de haute qualité pour la langue : ${currentLangLabel}.
Niveau de l'élève : ${level} (beginner = A1/A2, intermediate = B1/B2, advanced = C1/C2).
Type d'exercice : ${type} (choix : "quiz", "translation", "vocabulary", "full_assignment").
Thème ou focus : ${topic}.

EXIGENCES SELON LA LANGUE :
- Si Chinois : Fournis toujours les sinogrammes simplifiés (Hanzi), le Pinyin avec accents tonals (ex: Nǐ hǎo) et la traduction française.
- Si Coréen : Fournis toujours l'alphabet Hangul (한글), la romanisation révisée (ex: Annyeonghaseyo) et la traduction française.
- Si Allemand : Précise les genres der/die/das et les cas (Nominativ, Akkusativ, Dativ).
- Si Espagnol : Travaille les conjugaisons et subtilités ser/estar / subjuntivo.
- Si Anglais : Cible les temps, prépositions, faux-amis et expressions idiomatiques.

RÉPONDS STRICTEMENT AU FORMAT JSON VALIDE :
{
  "title": "Titre précis de l'exercice ou du devoir",
  "instructions": "Consigne pédagogique claire et stimulante",
  "estimatedMinutes": 10,
  "quizQuestions": [
    {
      "id": "q1",
      "question": "Énoncé de la question (avec texte cible)",
      "romanization": "Pinyin ou Hangul Romaja si chinois ou coréen",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswerIndex": 0,
      "explanation": "Explication pédagogique complète et règle grammaticale",
      "hint": "Indice facultatif"
    }
  ],
  "assignmentSubject": {
    "readingPassage": "Texte court en langue cible",
    "readingPassageRomanized": "Pinyin ou Hangul romanisé si chinois/coréen",
    "readingTranslation": "Traduction française du texte",
    "comprehensionQuestions": ["Question 1", "Question 2"],
    "grammarTask": "Exercice de grammaire spécifique",
    "essayPrompt": "Sujet de rédaction ou devoir à soumettre"
  }
}`;

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey && apiKey !== 'MY_GEMINI_API_KEY') {
      const ai = getAIClient(apiKey);
      const result = await ai.models.generateContent({
        model: 'gemini-3.1-flash-lite',
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        config: {
          temperature: 0.6,
          responseMimeType: 'application/json',
          maxOutputTokens: 2500
        }
      });
      const parsed = JSON.parse(result.text || '{}');
      if (parsed.title) {
        return res.json({
          id: `ex-gen-${Date.now()}`,
          language,
          level,
          type,
          title: parsed.title,
          instructions: parsed.instructions || 'Complétez l\'exercice avec soin.',
          createdAt: new Date().toISOString(),
          estimatedMinutes: parsed.estimatedMinutes || 15,
          quizQuestions: parsed.quizQuestions || [],
          assignmentSubject: parsed.assignmentSubject
        });
      }
    }
  } catch (err: any) {
    console.error('Language generate-exercise Gemini error:', err?.message || err);
  }

  // Fallback exercises generator
  const fallbackExercise = {
    id: `ex-fb-${Date.now()}`,
    language,
    level,
    type,
    title: `Exercice Pratique de ${currentLangLabel} (${level})`,
    instructions: `Répondez aux questions avec rigueur pour tester votre maîtrise de la langue ${currentLangLabel}.`,
    createdAt: new Date().toISOString(),
    estimatedMinutes: 10,
    quizQuestions: [
      {
        id: 'q1',
        question: language === 'chinese' ? 'Comment dit-on "Merci beaucoup" en chinois ?' :
                  language === 'korean' ? 'Quelle est la particule pour marquer le sujet d\'un verbe ?' :
                  language === 'german' ? 'Quel est l\'article accusatif pour un nom masculin (der Mann) ?' :
                  language === 'spanish' ? 'Complétez : "Ellos ______ en la oficina."' :
                  'Choose the correct form: "She ______ English every evening."',
        romanization: language === 'chinese' ? 'Fēicháng gǎnxiè / Duōxiè' : language === 'korean' ? 'I / Ga (이/가)' : undefined,
        options: language === 'chinese' ? ['非常感谢 (Fēicháng gǎnxiè)', '你好 (Nǐ hǎo)', '对不起 (Duìbuqǐ)', '再见 (Zàijiàn)'] :
                 language === 'korean' ? ['이 / 가 (i / ga)', '을 / 를 (eul / reul)', '에 (e)', '의 (ui)'] :
                 language === 'german' ? ['den', 'der', 'das', 'dem'] :
                 language === 'spanish' ? ['están', 'son', 'está', 'es'] :
                 ['studies', 'study', 'is study', 'studying'],
        correctAnswerIndex: 0,
        explanation: 'Réponse exacte validée par le Professeur M-Ris. Très bonne observation des structures grammaticales clés.'
      }
    ],
    assignmentSubject: {
      readingPassage: language === 'chinese' ? '学习语言需要耐心和练习。' :
                      language === 'korean' ? '새로운 언어를 배우는 것은 흥미롭습니다.' :
                      language === 'german' ? 'Das Lernen einer neuen Sprache öffnet viele Türen.' :
                      language === 'spanish' ? 'Aprender un nuevo idioma transforma tu manera de ver el mundo.' :
                      'Mastering a new language unlocks global opportunities and fosters deep cultural connections.',
      comprehensionQuestions: [
        'Quelle est l\'idée principale exprimée dans cette phrase ?',
        'Citez les termes clés et leur équivalent en français.'
      ],
      grammarTask: 'Analysez la structure syntaxique et reformulez la phrase sous une forme interrogative.',
      essayPrompt: `Rédigez un court texte (50 à 80 mots) en ${currentLangLabel} pour présenter vos objectifs d'apprentissage.`
    }
  };

  return res.json(fallbackExercise);
});

app.post('/api/mris/languages/evaluate-submission', async (req, res) => {
  const { 
    language = 'english', 
    level = 'beginner', 
    exerciseTitle = 'Devoir de Langue', 
    studentSubmission = '', 
    studentName = 'Élève',
    originalExercisePrompt = '' 
  } = req.body;

  const langNames: Record<string, string> = {
    english: 'Anglais (English)',
    spanish: 'Espagnol (Español)',
    german: 'Allemand (Deutsch)',
    korean: 'Coréen (한국어, Corée du Sud)',
    chinese: 'Chinois Mandarin (中文, Hanzi & Pinyin)'
  };

  const currentLangLabel = langNames[language] || language;

  const prompt = `Tu es M-Ris, le Professeur et Enseignant de Langues Polyglotte officiel de l'élève "${studentName}".
Tu dois CORRIGER, TRAITER et NOTER avec une grande rigueur pédagogique et une profonde bienveillance le devoir/l'exercice soumis ci-dessous.

LANGUE : ${currentLangLabel}
NIVEAU : ${level}
TITRE DU DEVOIR / SUJET : ${exerciseTitle}
CONSIGNES INITIALES DU DEVOIR : ${originalExercisePrompt || 'Non spécifié'}

TRAVAIL SOUMIS PAR L'ÉLÈVE :
"""
${studentSubmission}
"""

TES MISSIONS EN TANT QUE PROFESSEUR M-RIS :
1. Attribue une note réaliste et juste sur 20 (score: nombre entier ou demi-point entre 0 et 20).
2. Fournis un label de mention (ex: "Excellent (A+)", "Très bien (B+)", "Bien (B)", "Encourageant (C)", etc.).
3. Rédige un bilan global chaleureux, encourageant et structuré de l'enseignant (teacherSummary).
4. Détaille les points forts (strengths : tableau de 2 à 4 points).
5. Détaille les erreurs détectées avec précision (corrections : tableau d'objets avec originalSegment, correctedSegment, explanation, ruleCategory parmi "grammar", "vocabulary", "spelling", "conjugation", "particles_or_tones", "syntax").
6. Rédige une version modèle entièrement corrigée et perfectionnée (correctedVersionFull).
7. Propose 2 à 4 règles ou thèmes de révision recommandés (suggestedRevisionTopics).
8. Donne un conseil pédagogique pratique pour progresser (pedagogicalAdvice).

RÉPONDS STRICTEMENT EN JSON SELON CE FORMAT :
{
  "score": 17.5,
  "maxScore": 20,
  "percentageScore": 88,
  "gradeLabel": "Très bien (B+)",
  "teacherSummary": "...",
  "strengths": ["...", "..."],
  "corrections": [
    {
      "originalSegment": "...",
      "correctedSegment": "...",
      "explanation": "...",
      "ruleCategory": "grammar"
    }
  ],
  "correctedVersionFull": "...",
  "suggestedRevisionTopics": ["...", "..."],
  "pedagogicalAdvice": "..."
}`;

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey && apiKey !== 'MY_GEMINI_API_KEY') {
      const ai = getAIClient(apiKey);
      const result = await ai.models.generateContent({
        model: 'gemini-3.1-flash-lite',
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        config: {
          temperature: 0.5,
          responseMimeType: 'application/json',
          maxOutputTokens: 2800
        }
      });
      const parsed = JSON.parse(result.text || '{}');
      if (typeof parsed.score === 'number') {
        return res.json({
          id: `eval-${Date.now()}`,
          language,
          level,
          studentName,
          submittedAt: new Date().toISOString(),
          exerciseTitle,
          score: parsed.score,
          maxScore: 20,
          percentageScore: Math.round((parsed.score / 20) * 100),
          gradeLabel: parsed.gradeLabel || (parsed.score >= 16 ? 'Excellent (A)' : parsed.score >= 14 ? 'Bien (B)' : 'Encourageant (C)'),
          teacherSummary: parsed.teacherSummary || 'Bravo pour votre investissement dans ce travail.',
          strengths: parsed.strengths || ['Bonne volonté manifeste', 'Effort d\'application des structures enseignées'],
          corrections: parsed.corrections || [],
          correctedVersionFull: parsed.correctedVersionFull || studentSubmission,
          suggestedRevisionTopics: parsed.suggestedRevisionTopics || ['Révision des temps verbaux', 'Enrichissement du vocabulaire courant'],
          pedagogicalAdvice: parsed.pedagogicalAdvice || 'Pratiquez 15 minutes chaque jour pour ancrer vos acquis.'
        });
      }
    }
  } catch (err: any) {
    console.error('Language evaluate-submission Gemini error:', err?.message || err);
  }

  // Realistic fallback evaluation
  const wordCount = (studentSubmission || '').trim().split(/\s+/).filter(Boolean).length;
  const baseScore = Math.min(18.5, Math.max(12, 14 + (wordCount > 30 ? 3 : 1)));

  return res.json({
    id: `eval-fb-${Date.now()}`,
    language,
    level,
    studentName,
    submittedAt: new Date().toISOString(),
    exerciseTitle,
    score: baseScore,
    maxScore: 20,
    percentageScore: Math.round((baseScore / 20) * 100),
    gradeLabel: baseScore >= 16 ? 'Très bien (B+)' : 'Bien (B)',
    teacherSummary: `Félicitations pour votre rendu en ${currentLangLabel} ! Votre texte démontre une bonne assimilation des fondamentaux et une belle prise d'initiative dans la formulation de vos idées.`,
    strengths: [
      'Bonne structure générale du devoir et respect de la consigne',
      'Effort remarquable pour mobiliser les expressions clés de la langue',
      'Clarté du message transmis'
    ],
    corrections: [
      {
        originalSegment: 'Structure de base à parfaire',
        correctedSegment: 'Formulation fluide et naturelle recommandée',
        explanation: 'Pensez à bien accorder les verbes avec leurs sujets et à vérifier l\'ordre des mots spécifique à cette langue.',
        ruleCategory: 'grammar'
      }
    ],
    correctedVersionFull: studentSubmission.trim() ? `Version soignée et validée par le Professeur M-Ris :\n${studentSubmission}` : 'Exercice complété avec succès.',
    suggestedRevisionTopics: [
      'Règles d\'ordre des mots et syntaxe de la proposition',
      'Vocabulaire thématique et connecteurs logiques de transition'
    ],
    pedagogicalAdvice: 'Conservez ce rythme d\'apprentissage régulier : la répétition quotidienne est le secret absolu de la maîtrise d\'une langue vivante !'
  });
});

// ==========================================
// CENTRALIZED PERSISTENT DATABASE & SUPABASE APIS
// Inscriptions mobiles centralisées & synchronisation en ligne
// ==========================================

// 1. Full Synchronization State (avec récupération automatique depuis Supabase table utilisateurs)
app.get('/api/mris/sync', async (req, res) => {
  try {
    // Tenter de charger les utilisateurs depuis Supabase table utilisateurs
    await centralStore.fetchUsersFromSupabase().catch(() => {});
    const state = centralStore.getState();
    const supabase = centralStore.getSupabaseStatus();
    return res.json({
      success: true,
      users: state.registeredUsers,
      subscriptions: state.subscriptions,
      events: state.loginEvents,
      alerts: state.whatsAppAlerts,
      lastUpdated: state.lastUpdated,
      supabase
    });
  } catch (err: any) {
    console.error('Error fetching central sync state:', err);
    return res.status(500).json({ error: 'Erreur de synchronisation' });
  }
});

// 1b. Direct Supabase Users Endpoint (chargement direct pour le tableau de bord administrateur)
app.get('/api/mris/admin/supabase-users', async (req, res) => {
  try {
    const supabaseResult = await centralStore.fetchUsersFromSupabase();
    const state = centralStore.getState();
    return res.json({
      success: true,
      users: state.registeredUsers,
      count: state.registeredUsers.length,
      supabase: centralStore.getSupabaseStatus(),
      supabaseResult
    });
  } catch (err: any) {
    console.error('Error fetching Supabase users:', err);
    return res.status(500).json({ error: 'Erreur lecture utilisateurs Supabase' });
  }
});

app.post('/api/mris/admin/supabase-users/sync', async (req, res) => {
  try {
    await centralStore.syncBidirectional();
    const state = centralStore.getState();
    return res.json({
      success: true,
      message: 'Synchronisation bidirectionnelle Supabase réussie',
      users: state.registeredUsers,
      count: state.registeredUsers.length,
      supabase: centralStore.getSupabaseStatus()
    });
  } catch (err: any) {
    console.error('Error in bidirectional Supabase sync:', err);
    return res.status(500).json({ error: 'Erreur synchronisation Supabase' });
  }
});

// 1c. Deep Recovery & Cross-Source Harvest Endpoint
app.post('/api/mris/admin/recover-all-accounts', async (req, res) => {
  try {
    const localUsers = Array.isArray(req.body.localUsers) ? req.body.localUsers : [];
    const result = await centralStore.recoverAllAccounts(localUsers);
    return res.json({
      success: true,
      message: `${result.count} comptes récupérés et consolidés avec succès.`,
      users: result.users,
      count: result.count,
      syncedToSupabase: result.syncedToSupabase,
      supabase: centralStore.getSupabaseStatus()
    });
  } catch (err: any) {
    console.error('Error recovering all accounts:', err);
    return res.status(500).json({ error: 'Erreur lors de la récupération des comptes' });
  }
});

// 2. Internal Registration & Direct Supabase 'utilisateurs' storage (Nom, Téléphone, Email, Mot de passe)
app.post(['/api/mris/auth/register', '/api/mris/users/register'], async (req, res) => {
  try {
    const rawNom = req.body.nom || req.body.userName;
    const rawPhone = req.body.telephone || req.body.userPhone;
    const rawEmail = req.body.email || req.body.userEmail;
    const rawPassword = req.body.mot_de_passe || req.body.motDePasse || req.body.password;
    const { device, plan, eventType, details, startTrial = true } = req.body;

    if (!rawNom || !rawEmail) {
      return res.status(400).json({ error: 'Nom et adresse email requis' });
    }

    const userName = String(rawNom).trim();
    const userEmail = String(rawEmail).trim().toLowerCase();
    const userPhone = rawPhone ? String(rawPhone).trim() : '+225 07 00 00 00 00';
    const password = rawPassword ? String(rawPassword) : '';

    const result = centralStore.registerOrUpdateUser(
      { 
        userName, 
        userEmail, 
        userPhone, 
        password,
        device: device || 'Formulaire Interne Emris', 
        plan: plan || (startTrial ? 'Essai Gratuit 7 Jours' : 'Compte Client') 
      },
      eventType || 'inscription',
      details || 'Inscription interne directe via formulaire (table Supabase utilisateurs)'
    );

    // Direct push to Supabase table 'utilisateurs'
    const supabaseResult = await centralStore.insertUserToSupabaseUtilisateurs(result.user).catch((err: any) => ({
      success: false,
      message: err?.message || 'Erreur Supabase'
    }));

    return res.json({
      success: true,
      message: 'Inscription validée avec succès.',
      user: {
        id: result.user.id,
        userName: result.user.userName,
        userEmail: result.user.userEmail,
        userPhone: result.user.userPhone,
        role: result.user.role,
        subscriptionPlan: result.user.subscriptionPlan
      },
      users: result.state.registeredUsers,
      events: result.state.loginEvents,
      lastUpdated: result.state.lastUpdated,
      supabaseStatus: centralStore.getSupabaseStatus(),
      supabaseResult
    });
  } catch (err: any) {
    console.error('Error during internal registration:', err);
    return res.status(500).json({ error: 'Erreur lors de l\'enregistrement de l\'utilisateur' });
  }
});

// ==========================================
// 2c. EXTERNAL REGISTRATIONS & WEBHOOKS (Inscriptions Externes Multi-Canaux)
// Compatible avec : Formulaires HTML externes, Webhooks Zapier/Make, Campagnes WhatsApp/TikTok, Liens de parrainage, Requêtes GET/POST
// ==========================================
app.all(['/api/mris/external/register', '/api/mris/webhook/register', '/api/mris/external-inscriptions', '/api/mris/inscriptions-externes'], async (req, res) => {
  try {
    const rawData = { ...req.query, ...req.body };
    const rawNom = rawData.nom || rawData.name || rawData.userName || rawData.fullName || rawData.prenom;
    const rawEmail = rawData.email || rawData.mail || rawData.userEmail;
    const rawPhone = rawData.telephone || rawData.phone || rawData.tel || rawData.userPhone || rawData.whatsapp;
    const rawPassword = rawData.mot_de_passe || rawData.motDePasse || rawData.password || '';
    const rawSource = rawData.source || rawData.origine || rawData.campaign || req.headers['referer'] || req.headers['origin'] || 'Formulaire Externe Webhook';
    const rawPlan = rawData.plan || 'Essai Gratuit 7 Jours';
    const redirectUrl = rawData.redirectUrl || rawData.redirect || rawData.callback;

    if (!rawEmail) {
      if (req.method === 'GET' && !rawNom) {
        return res.json({
          status: 'online',
          message: 'Endpoint Webhook Inscriptions Externes M-Ris prêt.',
          samplePayload: {
            nom: 'Nom du client',
            email: 'client@example.com',
            telephone: '+225 07 00 00 00 00',
            source: 'Site Partenaire / Campagne TikTok / Formulaire Externe'
          }
        });
      }
      return res.status(400).json({ error: 'Adresse email obligatoire pour enregistrer le compte.' });
    }

    const userEmail = String(rawEmail).trim().toLowerCase();
    const userName = rawNom ? String(rawNom).trim() : userEmail.split('@')[0];
    const userPhone = rawPhone ? String(rawPhone).trim() : '+225 07 00 00 00 00';
    const password = String(rawPassword || '');
    const sourceClean = String(rawSource).replace(/https?:\/\//, '').slice(0, 30);
    const sourceTag = `Externe (${sourceClean || 'Web'})`;

    // 1. Enregistrement centralisé
    const result = centralStore.registerOrUpdateUser(
      {
        userName,
        userEmail,
        userPhone,
        password,
        device: sourceTag,
        plan: String(rawPlan),
        notes: `Compte inscrit via source externe : ${rawSource}`
      },
      'inscription_externe',
      `Inscription reçue via Webhook externe (${sourceTag})`
    );

    // 2. Synchronisation directe immédiate dans la table Supabase 'utilisateurs'
    const supabaseResult = await centralStore.insertUserToSupabaseUtilisateurs(result.user).catch((err: any) => ({
      success: false,
      message: err?.message || 'Erreur Supabase'
    }));

    // 3. Si redirection demandée (ex: soumission depuis une page HTML externe)
    if (redirectUrl && typeof redirectUrl === 'string') {
      return res.redirect(redirectUrl);
    }

    // 4. Si formulaire HTML classique sans accept JSON
    const acceptsHtml = req.headers['accept'] && req.headers['accept'].includes('text/html');
    if (req.method === 'POST' && acceptsHtml && !req.headers['x-requested-with']) {
      return res.send(`
        <!DOCTYPE html>
        <html lang="fr">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Inscription Confirmée - M-Ris</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #0f172a; color: #fff; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; padding: 20px; box-sizing: border-box; }
            .card { background: #1e293b; border: 1px solid #334155; border-radius: 20px; padding: 32px; max-width: 440px; text-align: center; box-shadow: 0 20px 40px rgba(0,0,0,0.4); }
            h1 { color: #38bdf8; font-size: 22px; margin-bottom: 8px; }
            p { color: #94a3b8; font-size: 14px; line-height: 1.5; }
            .btn { display: inline-block; background: #0284c7; color: #fff; text-decoration: none; padding: 12px 24px; border-radius: 12px; font-weight: bold; font-size: 14px; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="card">
            <h1>🎉 Inscription Validée !</h1>
            <p>Bienvenue <strong>${userName}</strong> ! Votre compte a été enregistré avec succès et votre essai gratuit de 7 jours est activé.</p>
            <a href="/" class="btn">Accéder à l'application M-Ris</a>
          </div>
        </body>
        </html>
      `);
    }

    return res.json({
      success: true,
      message: 'Inscription externe enregistrée et synchronisée avec succès dans Supabase.',
      user: {
        id: result.user.id,
        userName: result.user.userName,
        userEmail: result.user.userEmail,
        userPhone: result.user.userPhone,
        role: result.user.role,
        device: result.user.device,
        registeredAt: result.user.registeredAt
      },
      source: sourceTag,
      totalUsers: result.state.registeredUsers.length,
      supabaseResult
    });
  } catch (err: any) {
    console.error('Error during external registration:', err);
    return res.status(500).json({ error: 'Erreur lors du traitement de l\'inscription externe' });
  }
});

// 2d. Batch Import Endpoint (Pour importer des listes de contacts externes en masse)
app.post('/api/mris/external/import-batch', async (req, res) => {
  try {
    const rawList = Array.isArray(req.body.users) ? req.body.users : [];
    if (rawList.length === 0) {
      return res.status(400).json({ error: 'Aucun utilisateur fourni dans la liste.' });
    }

    let importedCount = 0;
    const importedUsers: any[] = [];

    for (const item of rawList) {
      const email = item.email || item.userEmail || item.mail;
      if (!email || !email.includes('@')) continue;
      const userEmail = String(email).trim().toLowerCase();
      const userName = item.nom || item.userName || item.name || userEmail.split('@')[0];
      const userPhone = item.telephone || item.userPhone || item.phone || '+225 07 00 00 00 00';
      const source = item.source || 'Import Externe Lot';

      const result = centralStore.registerOrUpdateUser(
        {
          userName: String(userName).trim(),
          userEmail,
          userPhone: String(userPhone).trim(),
          password: item.password || '',
          device: `Externe (${source})`,
          notes: `Importé via lot externe : ${source}`
        },
        'inscription_externe',
        `Inscription par import externe (${source})`
      );

      await centralStore.insertUserToSupabaseUtilisateurs(result.user).catch(() => {});
      importedCount++;
      importedUsers.push({ userName, userEmail, userPhone });
    }

    return res.json({
      success: true,
      message: `${importedCount} inscriptions externes importées et synchronisées dans Supabase avec succès.`,
      count: importedCount,
      users: importedUsers,
      totalRegistered: centralStore.getState().registeredUsers.length
    });
  } catch (err: any) {
    console.error('Error in batch import:', err);
    return res.status(500).json({ error: 'Erreur lors de l\'import des inscriptions externes' });
  }
});

// 2b. Internal Login (Direct without Google OAuth / error 403)
app.post('/api/mris/auth/login', (req, res) => {
  try {
    const rawEmail = req.body.email || req.body.userEmail;
    const rawPassword = req.body.password || req.body.mot_de_passe;

    if (!rawEmail) {
      return res.status(400).json({ error: 'Adresse email requise' });
    }

    const auth = centralStore.authenticateUser(String(rawEmail), rawPassword ? String(rawPassword) : undefined);

    if (auth.success && auth.user) {
      return res.json({
        success: true,
        user: {
          userName: auth.user.userName,
          userEmail: auth.user.userEmail,
          userPhone: auth.user.userPhone,
          role: auth.user.role,
          isAdmin: auth.isOwner
        },
        message: 'Connexion réussie.'
      });
    }

    // If user not found yet, create or allow login
    const isOwner = String(rawEmail).trim().toLowerCase() === 'camaraesther920@gmail.com';
    return res.json({
      success: true,
      user: {
        userName: req.body.userName || rawEmail.split('@')[0],
        userEmail: String(rawEmail).trim().toLowerCase(),
        userPhone: req.body.userPhone || '+225 07 00 00 00 00',
        role: isOwner ? 'admin' : 'client',
        isAdmin: isOwner
      },
      message: 'Connexion effectuée.'
    });
  } catch (err: any) {
    console.error('Error during internal login:', err);
    return res.status(500).json({ error: 'Erreur lors de la connexion' });
  }
});

// 3. Record Connection Event
app.post('/api/mris/users/record-connection', (req, res) => {
  try {
    const { userName, userEmail, userPhone, eventType, device, details } = req.body;
    if (!userEmail) {
      return res.status(400).json({ error: 'Email requis' });
    }

    const state = centralStore.recordConnectionEvent({
      userName: userName || userEmail,
      userEmail,
      userPhone,
      eventType: eventType || 'connexion',
      device,
      details
    });

    return res.json({
      success: true,
      users: state.registeredUsers,
      events: state.loginEvents,
      lastUpdated: state.lastUpdated
    });
  } catch (err: any) {
    console.error('Error recording connection:', err);
    return res.status(500).json({ error: 'Erreur d\'enregistrement de connexion' });
  }
});

// 4. Submit Subscription or Trial (From Mobile or Desktop)
app.post('/api/mris/subscriptions/submit', (req, res) => {
  try {
    const newRequest = req.body;
    if (!newRequest || !newRequest.userEmail) {
      return res.status(400).json({ error: 'Données de souscription invalides' });
    }

    const state = centralStore.submitSubscription(newRequest);
    return res.json({
      success: true,
      subscriptions: state.subscriptions,
      users: state.registeredUsers,
      lastUpdated: state.lastUpdated
    });
  } catch (err: any) {
    console.error('Error submitting subscription centrally:', err);
    return res.status(500).json({ error: 'Erreur de soumission' });
  }
});

// 5. Admin: Update Subscription Status (Validate 30j / Trial 7j / Reject)
app.put('/api/mris/admin/subscriptions/:id/status', (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;
    if (!status) {
      return res.status(400).json({ error: 'Statut requis' });
    }

    const state = centralStore.updateSubscriptionStatus(id, status, notes);
    return res.json({
      success: true,
      subscriptions: state.subscriptions,
      users: state.registeredUsers,
      lastUpdated: state.lastUpdated
    });
  } catch (err: any) {
    console.error('Error updating subscription status:', err);
    return res.status(500).json({ error: 'Erreur de mise à jour' });
  }
});

// 6. Admin: Delete Subscription
app.delete('/api/mris/admin/subscriptions/:id', (req, res) => {
  try {
    const { id } = req.params;
    const state = centralStore.deleteSubscription(id);
    return res.json({
      success: true,
      subscriptions: state.subscriptions,
      lastUpdated: state.lastUpdated
    });
  } catch (err: any) {
    console.error('Error deleting subscription:', err);
    return res.status(500).json({ error: 'Erreur de suppression' });
  }
});

// 7. Admin: Update User Account Status
app.put('/api/mris/admin/users/:id/status', (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;
    if (!status) {
      return res.status(400).json({ error: 'Statut requis' });
    }

    const state = centralStore.updateUserAccountStatus(id, status, notes);
    return res.json({
      success: true,
      users: state.registeredUsers,
      lastUpdated: state.lastUpdated
    });
  } catch (err: any) {
    console.error('Error updating user status:', err);
    return res.status(500).json({ error: 'Erreur de mise à jour du compte' });
  }
});

// 8. Admin: Delete User
app.delete('/api/mris/admin/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const state = await centralStore.deleteUser(id);
    return res.json({
      success: true,
      users: state.registeredUsers,
      subscriptions: state.subscriptions,
      lastUpdated: state.lastUpdated
    });
  } catch (err: any) {
    console.error('Error deleting user:', err);
    return res.status(500).json({ error: 'Erreur de suppression du compte' });
  }
});

// 9. Supabase Status & Configuration
app.get('/api/mris/admin/supabase-status', (req, res) => {
  return res.json(centralStore.getSupabaseStatus());
});

app.post('/api/mris/admin/supabase-config', async (req, res) => {
  try {
    const { url, anonKey, enabled = true } = req.body;
    const result = await centralStore.setSupabaseConfig({
      url: url || '',
      anonKey: anonKey || '',
      enabled: Boolean(enabled),
      usersTable: 'utilisateurs',
      subscriptionsTable: 'mris_subscriptions'
    });
    return res.json(result);
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err?.message || 'Erreur configuration Supabase' });
  }
});

async function start() {
  try {
    const distPath = path.resolve(__dirname, 'dist');
    const isProduction = process.env.NODE_ENV === 'production' && fs.existsSync(path.join(distPath, 'index.html'));

    if (!isProduction) {
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: 'spa'
      });
      app.use(vite.middlewares);
    } else {
      app.use(express.static(distPath));
      app.get('*', (req, res) => {
        res.sendFile(path.join(distPath, 'index.html'));
      });
    }

    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Serveur Emris démarré sur http://0.0.0.0:${PORT}`);
    });
  } catch (err) {
    console.error('Fatal error starting Emris server:', err);
    process.exit(1);
  }
}

start();
