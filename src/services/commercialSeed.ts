import { 
  CommercialAgentConfig,
  CommercialPromotion,
  CommercialAdvertisement,
  CommercialLead,
  CommercialLink,
  CommercialSalesPrompt,
  CommercialLog
} from '../types/commercial';

export const getAppOriginUrl = (): string => {
  if (typeof window !== 'undefined' && window.location && window.location.origin) {
    return window.location.origin;
  }
  return 'https://m-ris-compagnon-virtuel.app';
};

// Official user links strictly enforced:
export const OFFICIAL_COMMERCIAL_LINKS = {
  APP_NAME: 'M-Ris le compagnon virtuel',
  APP_URL: getAppOriginUrl(),
  WHATSAPP: 'https://wa.me/message/RGXYT5LWDCTAM1',
  TIKTOK: 'https://www.tiktok.com/@tisanebeniamar1?_r=1&_t=ZS-98DUrsnRQvc',
  WAVE_BUSINESS: 'https://pay.wave.com/m/M_ci_Xs2kjjsivE5V/c/ci/',
  WAVE_PAYMENT_MESSAGE: 'Veuillez Payer Béni Amar avec Wave en cliquant sur ce lien https://pay.wave.com/m/M_ci_Xs2kjjsivE5V/c/ci/. Ajoutez cet expéditeur à vos contacts pour rendre le lien cliquable.',
  TRIAL_DAYS: 7,
  MONTHLY_PRICE_FCFA: 35000,
  TRIAL_INFO_MESSAGE: "Profitez de 7 jours d'utilisation 100% GRATUITE de l'application « M-Ris le compagnon virtuel » pour tester toutes les fonctionnalités (compagnon bienveillant, prof de 5 langues, agent autonome, coaching) sans engagement ni carte bancaire, avant de passer à l'abonnement mensuel de 35 000 FCFA/mois via Wave Business Béni Amar !"
};

export const initialCommercialConfig: CommercialAgentConfig = {
  isActive: true,
  cycleIntervalSeconds: 30,
  autoLeadNurturing: true,
  autoPromoBroadcasting: true,
  autoAdOptimization: true,
  autoConversionLinks: true,
  targetMonthlyRevenueFCFA: 1500000,
  defaultDiscountPercent: 20,
  brandName: 'Béni Amar & M-Ris',
  ownerPhone: 'https://wa.me/message/RGXYT5LWDCTAM1',
  ownerEmail: 'camaraesther920@gmail.com'
};

export const initialPromotions: CommercialPromotion[] = [
  {
    id: 'promo-trial-7days',
    code: 'ESSAI-7J-GRATUIT',
    title: "7 Jours d'Utilisation Gratuite & Chat Emris - M-Ris le compagnon virtuel",
    description: "Accès 100% gratuit pendant 7 jours à l'application M-Ris le compagnon virtuel sans carte bancaire, avec orientation vers le chat Emris pour être informé, confiant et motivé avant l'abonnement mensuel de 35 000 FCFA.",
    discountType: 'percentage',
    discountValue: 100,
    targetProduct: "Application « M-Ris le compagnon virtuel »",
    startDate: '2026-10-01',
    endDate: '2026-12-31',
    active: true,
    usageCount: 0,
    maxUses: 500,
    channel: 'multi_channel',
    generatedCopy: "🚀 Profitez de 7 JOURS D'UTILISATION 100% GRATUITE de l'application « M-Ris le compagnon virtuel » !\n📲 Accédez à l'application ici : [Lien de l'application]\n💬 Dès votre entrée, échangez directement dans le chat avec Emris : posez vos questions pour être parfaitement informé, en totale confiance, encouragé, motivé et chaud pour réussir vos projets ! Ensuite, continuez en toute sécurité avec l'abonnement mensuel de 35 000 FCFA/mois via Wave Business Béni Amar.",
    directActivationLink: OFFICIAL_COMMERCIAL_LINKS.APP_URL,
    revenueGeneratedFCFA: 0
  },
  {
    id: 'promo-wave-beni-amar',
    code: 'BENI-AMAR-WAVE',
    title: 'Abonnement Mensuel Wave Business (Béni Amar)',
    description: 'Paiement direct sécurisé Wave Business de 35 000 FCFA/mois après les 7 jours gratuits avec validation instantanée.',
    discountType: 'percentage',
    discountValue: 20,
    targetProduct: 'Abonnement Mensuel M-Ris & Béni Amar (35 000 FCFA/mois)',
    startDate: '2026-10-01',
    endDate: '2026-12-31',
    active: true,
    usageCount: 0,
    maxUses: 100,
    channel: 'multi_channel',
    generatedCopy: '⚡ Abonnement Mensuel M-Ris (35 000 FCFA) : Veuillez Payer Béni Amar avec Wave en cliquant sur ce lien https://pay.wave.com/m/M_ci_Xs2kjjsivE5V/c/ci/. Ajoutez cet expéditeur à vos contacts pour rendre le lien cliquable.',
    directActivationLink: OFFICIAL_COMMERCIAL_LINKS.WAVE_BUSINESS,
    revenueGeneratedFCFA: 0
  },
  {
    id: 'promo-whatsapp-f3',
    code: 'WHATSAPP-F3',
    title: 'Contact Direct WhatsApp f3',
    description: 'Contact direct et assistance personnalisée sur le WhatsApp officiel f3.',
    discountType: 'percentage',
    discountValue: 25,
    targetProduct: 'Accompagnement & Packs Béni Amar',
    startDate: '2026-10-05',
    endDate: '2026-12-31',
    active: true,
    usageCount: 0,
    maxUses: 200,
    channel: 'whatsapp',
    generatedCopy: '🔥 Contactez directement notre service officiel sur WhatsApp (f3) pour activer vos 7 jours gratuits ou votre abonnement : https://wa.me/message/RGXYT5LWDCTAM1',
    directActivationLink: OFFICIAL_COMMERCIAL_LINKS.WHATSAPP,
    revenueGeneratedFCFA: 0
  },
  {
    id: 'promo-tiktok-tisane',
    code: 'TIKTOK-BENIAMAR',
    title: 'Communauté TikTok @tisanebeniamar1',
    description: 'Démonstrations et vidéos exclusives pour notre communauté TikTok active.',
    discountType: 'percentage',
    discountValue: 15,
    targetProduct: 'Produits & Démonstrations Béni Amar',
    startDate: '2026-10-01',
    endDate: '2026-12-31',
    active: true,
    usageCount: 0,
    maxUses: 150,
    channel: 'tiktok_reels',
    generatedCopy: '🎵 Découvrez nos vidéos et démonstrations en direct sur notre compte officiel TikTok : https://www.tiktok.com/@tisanebeniamar1?_r=1&_t=ZS-98DUrsnRQvc',
    directActivationLink: OFFICIAL_COMMERCIAL_LINKS.TIKTOK,
    revenueGeneratedFCFA: 0
  }
];

export const initialAdvertisements: CommercialAdvertisement[] = [
  {
    id: 'ad-trial-mris-app',
    campaignName: "Campagne 7 Jours Gratuits & Chat Emris - M-Ris",
    channel: 'multi_channel',
    status: 'active',
    targetAudience: "Particuliers, étudiants, entrepreneurs et professionnels en Côte d'Ivoire et Afrique",
    headline: "Testez GRATUITEMENT M-Ris pendant 7 jours & Échangez avec Emris dans le Chat !",
    adCopy: "Découvrez « M-Ris le compagnon virtuel » : votre confident chaleureux, prof de 5 langues (Anglais, Espagnol, Allemand, Coréen, Chinois) et assistant autonome.\n\n🎁 7 Jours d'essai 100% GRATUIT sans carte bancaire ni engagement !\n📲 Accédez à l'application ici : [Lien de l'application]\n\n💬 Dès votre arrivée, rejoignez le chat avec Emris : posez-lui toutes vos questions. Il est là pour vous informer, vous rassurer, vous encourager, booster votre motivation et vous mettre chaud et déterminé !\n\nAprès vos 7 jours offerts, poursuivez avec l'abonnement mensuel à 35 000 FCFA/mois :\n👉 Veuillez Payer Béni Amar avec Wave en cliquant sur ce lien https://pay.wave.com/m/M_ci_Xs2kjjsivE5V/c/ci/. Ajoutez cet expéditeur à vos contacts pour rendre le lien cliquable.\n\n💬 Support WhatsApp (f3) : https://wa.me/message/RGXYT5LWDCTAM1",
    callToAction: "Tester 7j gratuits & Chater avec Emris",
    visualPrompt: "Visuel moderne illustrant M-Ris compagnon virtuel avec bulle de chat chaleureuse, badge 7 jours gratuits et drapeaux de langues.",
    trackedLink: OFFICIAL_COMMERCIAL_LINKS.APP_URL,
    estimatedBudgetFCFA: 50000,
    impressions: 0,
    clicks: 0,
    conversions: 0,
    revenueGeneratedFCFA: 0,
    createdAt: new Date().toISOString()
  },
  {
    id: 'ad-wave-beni-amar',
    campaignName: 'Campagne Paiement Sécurisé Wave Business - Béni Amar',
    channel: 'facebook_instagram',
    status: 'active',
    targetAudience: "Clients et professionnels en Côte d'Ivoire et Afrique de l'Ouest",
    headline: 'Réglez vos commandes et abonnement Béni Amar en toute sécurité avec Wave',
    adCopy: "Simplifiez vos paiements et recevez vos accès en toute sérénité.\n\n👉 Veuillez Payer Béni Amar avec Wave en cliquant sur ce lien https://pay.wave.com/m/M_ci_Xs2kjjsivE5V/c/ci/. Ajoutez cet expéditeur à vos contacts pour rendre le lien cliquable.\n\nPour toute assistance WhatsApp direct : https://wa.me/message/RGXYT5LWDCTAM1",
    callToAction: 'Payer avec Wave Business',
    visualPrompt: 'Visuel élégant aux couleurs de Béni Amar avec badge de paiement Wave certifié.',
    trackedLink: OFFICIAL_COMMERCIAL_LINKS.WAVE_BUSINESS,
    estimatedBudgetFCFA: 30000,
    impressions: 0,
    clicks: 0,
    conversions: 0,
    revenueGeneratedFCFA: 0,
    createdAt: new Date().toISOString()
  },
  {
    id: 'ad-tiktok-viral',
    campaignName: 'TikTok Engagement & Communauté Béni Amar',
    channel: 'tiktok_reels',
    status: 'active',
    targetAudience: 'Communauté jeune et active intéressée par le bien-être et les astuces naturelles',
    headline: 'Rejoignez-nous sur TikTok @tisanebeniamar1 pour nos astuces quotidiennes !',
    adCopy: "Découvrez les bienfaits authentiques et nos conseils en vidéo.\n\n🎵 Abonnez-vous dès maintenant : https://www.tiktok.com/@tisanebeniamar1?_r=1&_t=ZS-98DUrsnRQvc\n\nCommandez facilement : Veuillez Payer Béni Amar avec Wave en cliquant sur ce lien https://pay.wave.com/m/M_ci_Xs2kjjsivE5V/c/ci/. Ajoutez cet expéditeur à vos contacts pour rendre le lien cliquable.",
    callToAction: 'Voir sur TikTok',
    visualPrompt: 'Vidéo dynamique TikTok avec présentation des tisanes Béni Amar et témoignages clients.',
    trackedLink: OFFICIAL_COMMERCIAL_LINKS.TIKTOK,
    estimatedBudgetFCFA: 25000,
    impressions: 0,
    clicks: 0,
    conversions: 0,
    revenueGeneratedFCFA: 0,
    createdAt: new Date().toISOString()
  }
];

export const initialLeads: CommercialLead[] = [];

// Official links: Application "M-Ris le compagnon virtuel", Wave Business, WhatsApp f3, TikTok
export const initialLinks: CommercialLink[] = [
  {
    id: 'link-app-mris',
    name: 'Application « M-Ris le compagnon virtuel » (7 Jours Gratuits & Chat Emris)',
    type: 'app_download',
    url: OFFICIAL_COMMERCIAL_LINKS.APP_URL,
    destination: "Accès direct à l'application « M-Ris le compagnon virtuel » (7 jours gratuits & chat Emris pour être informé et motivé, puis abonnement Wave)",
    codePromo: 'ESSAI-7-JOURS',
    clicksCount: 0,
    conversionsCount: 0,
    revenueEarnedFCFA: 0,
    conversionRate: 0,
    prefilledMessage: "Profitez de 7 jours d'utilisation 100% GRATUITE de l'application « M-Ris le compagnon virtuel » et discutez dans le chat avec Emris pour être informé, confiant, encouragé et motivé avant de passer à l'abonnement mensuel de 35 000 FCFA/mois via Wave Business Béni Amar !",
    createdAt: new Date().toISOString()
  },
  {
    id: 'link-wave-business',
    name: 'Lien Wave Business Officiel (Béni Amar)',
    type: 'wave_payment',
    url: OFFICIAL_COMMERCIAL_LINKS.WAVE_BUSINESS,
    destination: 'Compte Wave Business officiel de Béni Amar',
    codePromo: 'BENI-AMAR-WAVE',
    clicksCount: 0,
    conversionsCount: 0,
    revenueEarnedFCFA: 0,
    conversionRate: 0,
    prefilledMessage: OFFICIAL_COMMERCIAL_LINKS.WAVE_PAYMENT_MESSAGE,
    createdAt: new Date().toISOString()
  },
  {
    id: 'link-whatsapp-official',
    name: 'Lien WhatsApp Officiel (f3)',
    type: 'whatsapp_closing',
    url: OFFICIAL_COMMERCIAL_LINKS.WHATSAPP,
    destination: 'Messagerie WhatsApp Business officielle (f3)',
    clicksCount: 0,
    conversionsCount: 0,
    revenueEarnedFCFA: 0,
    conversionRate: 0,
    prefilledMessage: 'Bonjour Béni Amar, je vous contacte via votre lien officiel f3',
    createdAt: new Date().toISOString()
  },
  {
    id: 'link-tiktok-official',
    name: 'Lien TikTok Officiel (@tisanebeniamar1)',
    type: 'promo_landing',
    url: OFFICIAL_COMMERCIAL_LINKS.TIKTOK,
    destination: 'Page TikTok officielle @tisanebeniamar1',
    clicksCount: 0,
    conversionsCount: 0,
    revenueEarnedFCFA: 0,
    conversionRate: 0,
    prefilledMessage: 'Visiter le TikTok officiel @tisanebeniamar1',
    createdAt: new Date().toISOString()
  }
];

export const initialSalesPrompts: CommercialSalesPrompt[] = [
  {
    id: 'prompt-trial-7days-app',
    title: 'Offre 7 Jours Gratuits, Chat Emris & Abonnement Mensuel',
    category: 'pitch_30s',
    objective: 'Mettre en avant le lien de l\'application, les 7 jours d\'essai gratuit et orienter vers le chat Emris pour informer, rassurer et motiver.',
    targetObjection: 'Hésite à payer immédiatement / veut tester d\'abord.',
    promptTemplate: `Tu es M-Ris. Informe chaleureusement {nom} qu'il bénéficie de 7 jours d'utilisation 100% GRATUITE de l'application « M-Ris le compagnon virtuel » sans aucun engagement ni carte bancaire.
Fournis-lui le lien direct de l'application : ${OFFICIAL_COMMERCIAL_LINKS.APP_URL}.
Oriente-le activement vers le chat avec Emris dès son arrivée pour être plus informé, confiant, encouragé, motivé et chaud.
Rappelle-lui qu'ensuite l'abonnement mensuel est de 35 000 FCFA/mois via Wave Business pour Béni Amar :
« Veuillez Payer Béni Amar avec Wave en cliquant sur ce lien https://pay.wave.com/m/M_ci_Xs2kjjsivE5V/c/ci/. Ajoutez cet expéditeur à vos contacts pour rendre le lien cliquable. »`,
    exampleOutput: `Bonjour {nom} ! Vous bénéficiez de 7 JOURS D'UTILISATION 100% GRATUITE de l'application « M-Ris le compagnon virtuel » pour tester toutes nos fonctionnalités sans engagement ni carte bancaire ! 🚀\n\n📲 Accédez à l'application dès maintenant : ${OFFICIAL_COMMERCIAL_LINKS.APP_URL}\n\n💬 Dès votre entrée, rejoignez le chat avec Emris : posez-lui toutes vos questions. Il est là pour vous informer, vous mettre en totale confiance, vous encourager, booster votre motivation et vous mettre chaud et prêt pour réussir !\n\nAprès vos 7 jours d'essai, poursuivez en toute sécurité avec l'abonnement mensuel à 35 000 FCFA/mois via Wave Business :\n👉 Veuillez Payer Béni Amar avec Wave en cliquant sur ce lien https://pay.wave.com/m/M_ci_Xs2kjjsivE5V/c/ci/. Ajoutez cet expéditeur à vos contacts pour rendre le lien cliquable.\n\nOn est ensemble !`,
    suggestedChannel: 'whatsapp',
    usageCount: 0,
    conversionRateScore: 100
  },
  {
    id: 'prompt-closing-wave',
    title: 'Closing Paiement Wave Business Béni Amar',
    category: 'closing_rapide',
    objective: 'Guider le prospect vers le paiement direct et sécurisé de l\'abonnement mensuel via Wave Business après ses 7 jours ou échanges chat.',
    targetObjection: 'Comment payer en sécurité ?',
    promptTemplate: `Tu es M-Ris. Réponds à {nom} en lui transmettant la formule officielle exacte :
« Veuillez Payer Béni Amar avec Wave en cliquant sur ce lien https://pay.wave.com/m/M_ci_Xs2kjjsivE5V/c/ci/. Ajoutez cet expéditeur à vos contacts pour rendre le lien cliquable. »`,
    exampleOutput: `Bonjour {nom} ! Pour valider votre abonnement mensuel à 35 000 FCFA en 1 clic : Veuillez Payer Béni Amar avec Wave en cliquant sur ce lien https://pay.wave.com/m/M_ci_Xs2kjjsivE5V/c/ci/. Ajoutez cet expéditeur à vos contacts pour rendre le lien cliquable.`,
    suggestedChannel: 'whatsapp',
    usageCount: 0,
    conversionRateScore: 100
  },
  {
    id: 'prompt-whatsapp-direct',
    title: 'Échange & Négociation WhatsApp (f3)',
    category: 'closing_rapide',
    objective: 'Amener le prospect à dialoguer directement sur WhatsApp officiel f3.',
    targetObjection: 'Préfère discuter avant d\'acheter.',
    promptTemplate: `Tu es M-Ris. Invite chaleureusement {nom} à échanger sur WhatsApp officiel :
https://wa.me/message/RGXYT5LWDCTAM1`,
    exampleOutput: `Bonjour {nom} ! C'est un plaisir d'échanger avec vous. Cliquez directement ici pour nous joindre sur WhatsApp : https://wa.me/message/RGXYT5LWDCTAM1. On est ensemble !`,
    suggestedChannel: 'whatsapp',
    usageCount: 0,
    conversionRateScore: 100
  },
  {
    id: 'prompt-tiktok-community',
    title: 'Engagement TikTok & Démonstration Vidéo',
    category: 'pitch_30s',
    objective: 'Orienter vers le TikTok officiel @tisanebeniamar1 pour voir les démonstrations et retours clients.',
    targetObjection: 'Veut voir des avis et vidéos.',
    promptTemplate: `Tu es M-Ris. Invite {nom} à visionner nos vidéos et témoignages sur TikTok :
https://www.tiktok.com/@tisanebeniamar1?_r=1&_t=ZS-98DUrsnRQvc`,
    exampleOutput: `Retrouvez toutes nos vidéos, témoignages et explications en direct sur notre compte TikTok officiel : https://www.tiktok.com/@tisanebeniamar1?_r=1&_t=ZS-98DUrsnRQvc !`,
    suggestedChannel: 'tiktok_reels',
    usageCount: 0,
    conversionRateScore: 100
  },
  {
    id: 'prompt-fidelite',
    title: 'Fidélisation & Renouvellement Abonnement Mensuel',
    category: 'fidelisation_vip',
    objective: 'Renforcer la fidélité des abonnés récurrents avec lien direct Wave et contact privilégié.',
    targetObjection: 'Réabonnement et nouvelles commandes.',
    promptTemplate: `Tu es M-Ris. Remercie chaleureusement le client fidèle {nom} et fournis le lien Wave pour renouveler son abonnement mensuel :
Veuillez Payer Béni Amar avec Wave en cliquant sur ce lien https://pay.wave.com/m/M_ci_Xs2kjjsivE5V/c/ci/. Ajoutez cet expéditeur à vos contacts pour rendre le lien cliquable.`,
    exampleOutput: `Merci infiniment pour votre fidélité continue ! Pour renouveler votre abonnement mensuel (35 000 FCFA) : Veuillez Payer Béni Amar avec Wave en cliquant sur ce lien https://pay.wave.com/m/M_ci_Xs2kjjsivE5V/c/ci/. Ajoutez cet expéditeur à vos contacts pour rendre le lien cliquable.`,
    suggestedChannel: 'whatsapp',
    usageCount: 0,
    conversionRateScore: 100
  }
];

export const initialCommercialLogs: CommercialLog[] = [];
