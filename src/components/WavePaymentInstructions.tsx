import React, { useState } from 'react';
import { SUBSCRIPTION_CONFIG, FORMAT_FCFA } from '../utils/constants';
import { 
  ExternalLink, 
  Copy, 
  Check, 
  MessageCircle, 
  ShieldCheck, 
  AlertCircle, 
  Smartphone,
  CreditCard,
  QrCode
} from 'lucide-react';

export const WavePaymentInstructions: React.FC = () => {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedText, setCopiedText] = useState(false);
  const [showQr, setShowQr] = useState(false);

  const copyToClipboard = (text: string, isLink: boolean) => {
    navigator.clipboard.writeText(text);
    if (isLink) {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } else {
      setCopiedText(true);
      setTimeout(() => setCopiedText(false), 2000);
    }
  };

  const whatsappMessage = encodeURIComponent(
    `Bonjour Béni Amar (M-Ris), je viens d'effectuer mon paiement de 35 000 FCFA par Wave pour mon abonnement de 30 jours. Voici les détails de ma transaction pour activation immédiate.`
  );

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
      
      {/* Top Banner - Wave Theme Header */}
      <div className="bg-gradient-to-r from-sky-500 via-sky-600 to-blue-600 px-6 py-5 text-white">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center border border-white/20">
              {/* Wave penguin silhouette representation */}
              <svg className="w-7 h-7 text-white fill-current" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14.5v-9l6 4.5-6 4.5z"/>
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-white/20 text-white">
                  Paiement Sécurisé Wave CI
                </span>
                <span className="text-xs text-sky-100 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" /> Compte Vérifié
                </span>
              </div>
              <h2 className="text-xl font-bold tracking-tight text-white mt-1">
                Paiement Wave Business : {FORMAT_FCFA(SUBSCRIPTION_CONFIG.AMOUNT_FCFA)}
              </h2>
            </div>
          </div>

          <div className="text-right sm:border-l sm:border-white/20 sm:pl-5">
            <div className="text-xs text-sky-100">Bénéficiaire officiel</div>
            <div className="text-lg font-bold tracking-tight text-white">{SUBSCRIPTION_CONFIG.MERCHANT_NAME}</div>
          </div>
        </div>
      </div>

      {/* Main Body */}
      <div className="p-6 space-y-6">
        
        {/* Official instructions quote box */}
        <div className="bg-sky-50/70 border border-sky-100 rounded-xl p-4 sm:p-5 relative">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-sky-600 shrink-0 mt-0.5" />
            <div className="space-y-2 text-sm text-slate-700">
              <p className="font-semibold text-slate-900">
                Instructions officielles Wave :
              </p>
              <p className="leading-relaxed bg-white/80 p-3 rounded-lg border border-sky-200/60 font-medium text-slate-800 select-all">
                « {SUBSCRIPTION_CONFIG.WAVE_INSTRUCTIONS} »
              </p>
              <div className="flex flex-wrap gap-2 pt-1">
                <button
                  onClick={() => copyToClipboard(SUBSCRIPTION_CONFIG.WAVE_INSTRUCTIONS, false)}
                  className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-lg bg-sky-100 text-sky-800 hover:bg-sky-200 transition-colors"
                >
                  {copiedText ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedText ? 'Instructions copiées !' : 'Copier le texte d\'instruction'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Step-by-Step Payment Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          {/* Step 1 */}
          <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/60 flex flex-col justify-between">
            <div>
              <div className="w-7 h-7 rounded-full bg-sky-600 text-white font-bold text-xs flex items-center justify-center mb-3">
                1
              </div>
              <h3 className="font-bold text-slate-900 text-sm mb-1">
                Ouvrir le lien Wave Business
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed mb-4">
                Cliquez directement sur le lien sécurisé pour payer Béni Amar avec l'application Wave installée sur votre smartphone.
              </p>
            </div>
            <a
              href={SUBSCRIPTION_CONFIG.WAVE_PAY_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 w-full py-2.5 px-3 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-semibold text-xs shadow-sm transition-colors text-center"
            >
              <span>Ouvrir Wave Business</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          {/* Step 2 */}
          <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/60 flex flex-col justify-between">
            <div>
              <div className="w-7 h-7 rounded-full bg-sky-600 text-white font-bold text-xs flex items-center justify-center mb-3">
                2
              </div>
              <h3 className="font-bold text-slate-900 text-sm mb-1">
                Régler 35 000 FCFA & Capturer
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed mb-4">
                Validez le montant de 35 000 FCFA dans Wave. Une fois le paiement validé, prenez une capture d'écran nette du reçu.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => copyToClipboard(SUBSCRIPTION_CONFIG.WAVE_PAY_URL, true)}
                className="inline-flex items-center justify-center gap-1.5 flex-1 py-2 px-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs transition-colors"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedLink ? 'Lien copié' : 'Copier lien Wave'}</span>
              </button>
              <button
                onClick={() => setShowQr(!showQr)}
                className="p-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 transition-colors"
                title="Afficher QR Code"
              >
                <QrCode className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Step 3 */}
          <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/60 flex flex-col justify-between">
            <div>
              <div className="w-7 h-7 rounded-full bg-emerald-600 text-white font-bold text-xs flex items-center justify-center mb-3">
                3
              </div>
              <h3 className="font-bold text-slate-900 text-sm mb-1">
                Téléverser & Confirmer
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed mb-4">
                Déposez la capture dans le formulaire ci-dessous. Vous pouvez aussi confirmer directement sur WhatsApp pour un traitement accéléré.
              </p>
            </div>
            <a
              href={`${SUBSCRIPTION_CONFIG.WHATSAPP_URL}?text=${whatsappMessage}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 w-full py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-sm transition-colors text-center"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>Confirmer sur WhatsApp</span>
            </a>
          </div>

        </div>

        {/* QR Code toggle section */}
        {showQr && (
          <div className="p-4 bg-slate-900 text-white rounded-xl flex flex-col sm:flex-row items-center gap-4 justify-between animate-fadeIn">
            <div className="space-y-1">
              <h4 className="font-bold text-sm text-sky-400">Scanner pour payer avec Wave</h4>
              <p className="text-xs text-slate-300">
                Pointez la caméra de votre téléphone ou l'application Wave vers ce code QR pour ouvrir le paiement direct de Béni Amar.
              </p>
              <p className="text-xs font-mono text-slate-400 select-all pt-1">
                {SUBSCRIPTION_CONFIG.WAVE_PAY_URL}
              </p>
            </div>
            <div className="bg-white p-3 rounded-xl shadow-md shrink-0">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=${encodeURIComponent(SUBSCRIPTION_CONFIG.WAVE_PAY_URL)}`}
                alt="QR Code Wave Payment"
                className="w-28 h-28"
              />
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
