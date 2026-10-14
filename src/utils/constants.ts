export const SUBSCRIPTION_CONFIG = {
  PLAN_NAME: "Abonnement Emris Premium",
  AMOUNT_FCFA: 35000,
  DURATION_DAYS: 30,
  TRIAL_DAYS: 7,
  TRIAL_PLAN_NAME: "Essai Gratuit Emris (7 Jours)",
  MERCHANT_NAME: "Béni Amar",
  WAVE_PAY_URL: "https://pay.wave.com/m/M_ci_Xs2kjjsivE5V/c/ci/",
  WHATSAPP_URL: "https://wa.me/message/RGXYT5LWDCTAM1",
  WAVE_INSTRUCTIONS: "Veuillez Payer Béni Amar avec Wave en cliquant sur ce lien https://pay.wave.com/m/M_ci_Xs2kjjsivE5V/c/ci/. Ajoutez cet expéditeur à vos contacts pour rendre le lien cliquable. Après paiement, confirmez la transaction via WhatsApp pour activer votre compte immédiatement.",
  SUPPORT_EMAIL: "support@emris.ci",
  ADMIN_EMAIL: "camaraesther920@gmail.com",
  ADMIN_EMAILS: ["camaraesther920@gmail.com", "jephthe514@gmail.com"],
  ADMIN_PASSWORD: "esth@r33"
};

export const isAdminEmail = (email?: string | null): boolean => {
  if (!email) return false;
  const clean = email.trim().toLowerCase();
  return SUBSCRIPTION_CONFIG.ADMIN_EMAILS.some(e => e.toLowerCase() === clean);
};

export const FORMAT_FCFA = (amount: number): string => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'decimal',
    maximumFractionDigits: 0
  }).format(amount) + ' FCFA';
};
