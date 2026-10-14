import React, { useState, useRef } from 'react';
import { SubscriptionRequest } from '../types/subscription';
import { SUBSCRIPTION_CONFIG, FORMAT_FCFA } from '../utils/constants';
import { WavePaymentInstructions } from './WavePaymentInstructions';
import { generateRealisticWaveReceipt, fileToBase64 } from '../utils/receiptGenerator';
import { UserSession } from '../types/subscription';
import { 
  Upload, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  FileText, 
  X, 
  Sparkles, 
  Bot, 
  MessageCircle, 
  Eye, 
  ExternalLink,
  ShieldCheck,
  RefreshCw,
  Image as ImageIcon,
  LogIn,
  ArrowRight,
  UserCheck
} from 'lucide-react';

interface ClientViewProps {
  currentRequest: SubscriptionRequest | null;
  currentUser: UserSession | null;
  onSubmitSubscription: (newRequest: SubscriptionRequest) => void;
  onActivateTrial: (userName: string, userEmail: string, userPhone: string) => void;
  onOpenAssistant: () => void;
  onViewReceipt: (request: SubscriptionRequest) => void;
  onGoToUnlockedApp: () => void;
  onOpenAuthModal: () => void;
}

export const ClientView: React.FC<ClientViewProps> = ({
  currentRequest,
  currentUser,
  onSubmitSubscription,
  onActivateTrial,
  onOpenAssistant,
  onViewReceipt,
  onGoToUnlockedApp,
  onOpenAuthModal
}) => {
  // Form fields
  const [fullName, setFullName] = useState(currentUser?.userName || currentRequest?.userName || 'Camara Esther');
  const [email, setEmail] = useState(currentUser?.userEmail || currentRequest?.userEmail || 'camaraesther920@gmail.com');
  const [phone, setPhone] = useState(currentUser?.userPhone || currentRequest?.userPhone || '+225 07 48 92 11 34');
  const [txRef, setTxRef] = useState(currentRequest?.waveTransactionId || '');

  // Keep synced with currentUser or currentRequest
  React.useEffect(() => {
    if (currentUser) {
      setFullName(currentUser.userName);
      setEmail(currentUser.userEmail);
      setPhone(currentUser.userPhone);
    } else if (currentRequest) {
      setFullName(currentRequest.userName);
      setEmail(currentRequest.userEmail);
      setPhone(currentRequest.userPhone);
    }
  }, [currentUser, currentRequest]);
  
  // File upload state
  const [receiptImage, setReceiptImage] = useState<string | null>(currentRequest?.receiptImage || null);
  const [receiptFileName, setReceiptFileName] = useState<string>(currentRequest?.receiptFileName || '');
  const [isDragging, setIsDragging] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setUploadError('Veuillez sélectionner un fichier image valide (PNG, JPG, WEBP).');
      return;
    }

    try {
      setUploadError(null);
      const base64 = await fileToBase64(file);
      setReceiptImage(base64);
      setReceiptFileName(file.name);
    } catch (err) {
      setUploadError('Erreur lors du traitement de l\'image.');
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setUploadError('Veuillez déposer une image valide (PNG, JPG, WEBP).');
      return;
    }

    try {
      setUploadError(null);
      const base64 = await fileToBase64(file);
      setReceiptImage(base64);
      setReceiptFileName(file.name);
    } catch (err) {
      setUploadError('Erreur lors du traitement du fichier.');
    }
  };

  const handleLoadDemoReceipt = () => {
    setUploadError(null);
    const demoImg = generateRealisticWaveReceipt(
      fullName || 'Camara Esther',
      phone || '+225 07 48 92 11 34',
      35000,
      'WAVE-CI-' + Math.floor(100000000 + Math.random() * 900000000)
    );
    setReceiptImage(demoImg);
    setReceiptFileName('recu_wave_demo_35000_beni_amar.png');
    if (!txRef) {
      setTxRef('WAVE-CI-' + Math.floor(100000000 + Math.random() * 900000000));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!receiptImage) {
      setUploadError('Veuillez téléverser la capture d\'écran de votre reçu Wave avant de valider.');
      return;
    }

    setIsSubmitting(true);

    const newRequest: SubscriptionRequest = {
      id: currentRequest ? currentRequest.id : 'sub-' + Date.now(),
      userName: fullName.trim() || 'Client M-Ris',
      userEmail: email.trim(),
      userPhone: phone.trim(),
      planName: SUBSCRIPTION_CONFIG.PLAN_NAME,
      amount: SUBSCRIPTION_CONFIG.AMOUNT_FCFA,
      currency: 'FCFA',
      submissionDate: new Date().toISOString(),
      status: 'pending',
      receiptImage: receiptImage,
      receiptFileName: receiptFileName || 'capture_recu_wave.png',
      waveTransactionId: txRef.trim() || ('WAVE-CI-' + Math.floor(100000000 + Math.random() * 900000000)),
      notes: 'Demande enregistrée via le formulaire client. En attente de validation manuelle administrateur.'
    };

    setTimeout(() => {
      onSubmitSubscription(newRequest);
      setIsSubmitting(false);
      onOpenAssistant();
    }, 400);
  };

  const whatsappMessage = encodeURIComponent(
    `Bonjour Béni Amar (M-Ris), j'ai soumis mon reçu de 35 000 FCFA pour l'abonnement mensuel (Réf: ${txRef || 'Demande M-Ris'}). Pouvez-vous valider mon accès s'il vous plaît ?`
  );

  const isTrialActive = currentRequest?.isTrial || currentRequest?.status === 'trial';
  const isSubActive = currentRequest?.status === 'active' && !currentRequest?.isTrial;

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fadeIn pb-12">
      
      {/* 3-Step Journey Guide */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs p-5 sm:p-6">
        <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-cyan-600" />
          <span>Parcours utilisateur en 3 étapes simples</span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          
          {/* Step 1 */}
          <div className={`p-4 rounded-2xl border transition-all ${
            currentUser 
              ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950' 
              : 'bg-slate-50 border-slate-200 text-slate-800'
          }`}>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-black uppercase px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-700">
                Étape 1
              </span>
              {currentUser ? (
                <span className="text-[11px] font-bold text-emerald-700 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Connecté
                </span>
              ) : (
                <button
                  onClick={onOpenAuthModal}
                  className="text-[11px] font-bold text-sky-600 hover:underline cursor-pointer flex items-center gap-1"
                >
                  <LogIn className="w-3 h-3" /> Se connecter
                </button>
              )}
            </div>
            <h4 className="font-bold text-xs text-slate-900">1. Connexion / Compte</h4>
            <p className="text-[11px] text-slate-600 mt-1 leading-snug">
              {currentUser ? `Connecté : ${currentUser.userName}` : 'Créez ou connectez votre compte utilisateur.'}
            </p>
          </div>

          {/* Step 2 */}
          <div className={`p-4 rounded-2xl border transition-all ${
            isTrialActive 
              ? 'bg-amber-50/70 border-amber-300 text-amber-950' 
              : 'bg-sky-50/60 border-sky-200 text-sky-950'
          }`}>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-black uppercase px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-700">
                Étape 2
              </span>
              {isTrialActive ? (
                <span className="text-[11px] font-bold text-amber-700 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" /> Essai 7j Actif
                </span>
              ) : (
                <span className="text-[11px] font-bold text-sky-700">7 Jours Offerts</span>
              )}
            </div>
            <h4 className="font-bold text-xs text-slate-900">2. Essai Gratuit de 7 Jours</h4>
            <p className="text-[11px] text-slate-600 mt-1 leading-snug">
              Testez Emris sans carte bancaire ni paiement Wave initial.
            </p>
          </div>

          {/* Step 3 */}
          <div className={`p-4 rounded-2xl border transition-all ${
            isSubActive 
              ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950' 
              : currentRequest?.status === 'pending'
              ? 'bg-amber-50/70 border-amber-200 text-amber-950'
              : 'bg-slate-50 border-slate-200 text-slate-800'
          }`}>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-black uppercase px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-700">
                Étape 3
              </span>
              {isSubActive ? (
                <span className="text-[11px] font-bold text-emerald-700 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> 30j Actif
                </span>
              ) : currentRequest?.status === 'pending' ? (
                <span className="text-[11px] font-bold text-amber-700 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" /> Validation en cours
                </span>
              ) : (
                <span className="text-[11px] font-bold text-slate-600">35 000 FCFA/mois</span>
              )}
            </div>
            <h4 className="font-bold text-xs text-slate-900">3. Abonnement Wave</h4>
            <p className="text-[11px] text-slate-600 mt-1 leading-snug">
              Paiement vers Béni Amar, validé par l'administratrice.
            </p>
          </div>

        </div>
      </div>
      
      {/* Plan Header Card */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-cyan-50 text-cyan-700 border border-cyan-200/60">
                Offre Mensuelle Professionnelle
              </span>
              <span className="text-xs text-slate-500">
                Validation Manuelle Garantie
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {SUBSCRIPTION_CONFIG.PLAN_NAME}
            </h1>
            <p className="text-sm text-slate-600 mt-1 max-w-xl">
              Accédez à l'intégralité des modules métiers, analyses de marché et outils stratégiques de la plateforme M-Ris.
            </p>
          </div>

          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-5 text-right shrink-0">
            <div className="text-xs text-slate-500 font-medium">Tarif d'abonnement</div>
            <div className="text-3xl font-extrabold text-slate-900 font-mono-numbers mt-0.5">
              {FORMAT_FCFA(SUBSCRIPTION_CONFIG.AMOUNT_FCFA)}
            </div>
            <div className="text-xs text-sky-600 font-semibold mt-0.5">
              pour 30 jours d'accès complet
            </div>
          </div>
        </div>

        {/* Value Points */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 text-xs text-slate-700">
          <div className="flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <span>Accès complet et illimité pendant <strong>30 jours</strong></span>
          </div>
          <div className="flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <span>Paiement sécurisé direct via <strong>Wave Business</strong></span>
          </div>
          <div className="flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <span>Validation manuelle rapide & support <strong>WhatsApp VIP</strong></span>
          </div>
        </div>
      </div>

      {/* Free Trial Banner / Card */}
      {(!currentRequest || currentRequest.status === 'rejected') && (
        <div className="bg-gradient-to-r from-sky-50 via-cyan-50 to-blue-50 border-2 border-sky-300 rounded-3xl p-6 sm:p-7 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
            <div className="space-y-1.5 max-w-xl">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-sky-200/80 text-sky-900 text-[11px] font-bold uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5 text-sky-700" />
                <span>Offre Découverte Sans Frais</span>
              </div>
              <h3 className="text-lg font-extrabold text-slate-900">
                Activer l'Essai Gratuit de 7 Jours
              </h3>
              <p className="text-xs text-slate-700 leading-relaxed">
                Testez immédiatement l'ensemble des fonctionnalités et modules décisionnels M-Ris pendant <strong>7 jours</strong> complets. Aucun paiement Wave préalable, aucune carte bancaire demandée.
              </p>
            </div>

            <button
              onClick={() => onActivateTrial(fullName, email, phone)}
              className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-700 hover:to-blue-700 text-white font-extrabold text-sm shadow-md shadow-sky-500/20 hover:shadow-sky-500/30 transition-all shrink-0 cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>Démarrer mon Essai Gratuit (7j)</span>
            </button>
          </div>
        </div>
      )}

      {/* Active Trial Callout */}
      {currentRequest && (currentRequest.status === 'trial' || currentRequest.isTrial) && (
        <div className="bg-amber-50/90 border-2 border-amber-300 rounded-2xl p-5 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-amber-700 shrink-0">
                <Sparkles className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-amber-950 text-sm">
                    Votre Essai Gratuit de 7 Jours est ACTIF !
                  </h3>
                  <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-amber-200 text-amber-900">
                    7 Jours Offerts
                  </span>
                </div>
                <p className="text-xs text-amber-800 mt-1">
                  Vous avez accès à l'intégralité de l'application M-Ris. Vous pouvez à tout moment souscrire à l'abonnement complet de 35 000 FCFA/mois via Wave pour sécuriser votre accès illimité.
                </p>
              </div>
            </div>

            <button
              onClick={onGoToUnlockedApp}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-sm transition-colors shrink-0"
            >
              <Sparkles className="w-4 h-4" />
              <span>Accéder à l'Application (Essai 7j)</span>
            </button>
          </div>
        </div>
      )}

      {/* Active or Pending Status Callout if applicable */}
      {currentRequest && currentRequest.status === 'pending' && (
        <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-5 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-amber-700 shrink-0">
                <Clock className="w-5 h-5 animate-spin" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-amber-950 text-sm">
                    Votre demande d'abonnement est « En attente » de validation
                  </h3>
                  <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-amber-200 text-amber-900">
                    En cours
                  </span>
                </div>
                <p className="text-xs text-amber-800 mt-1 leading-relaxed">
                  L'administrateur vérifie la réception de vos <strong>35 000 FCFA</strong> sur le compte Wave de Béni Amar.
                  Dès approbation, votre accès sera activé pour 30 jours et vous recevrez un email de confirmation.
                </p>
                <div className="flex items-center gap-3 mt-3 text-xs text-amber-900">
                  <span>Réf: <strong>{currentRequest.waveTransactionId || currentRequest.id}</strong></span>
                  <span>·</span>
                  <button
                    onClick={() => onViewReceipt(currentRequest)}
                    className="font-semibold underline hover:text-amber-950 flex items-center gap-1"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    Voir mon reçu téléversé
                  </button>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 shrink-0">
              <button
                onClick={onOpenAssistant}
                className="inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-amber-300 text-amber-900 hover:bg-amber-100/60 text-xs font-semibold transition-colors"
              >
                <Bot className="w-4 h-4 text-cyan-600" />
                <span>Assistant M-Ris</span>
              </button>
              <a
                href={`${SUBSCRIPTION_CONFIG.WHATSAPP_URL}?text=${whatsappMessage}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition-colors"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Accélérer sur WhatsApp</span>
              </a>
            </div>
          </div>
        </div>
      )}

      {currentRequest && currentRequest.status === 'active' && (
        <div className="bg-emerald-50 border-2 border-emerald-200 rounded-2xl p-5 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-700 shrink-0">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-emerald-950 text-sm">
                    Votre abonnement M-Ris est actuellement ACTIF !
                  </h3>
                  <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-emerald-200 text-emerald-900">
                    30 Jours Validés
                  </span>
                </div>
                <p className="text-xs text-emerald-800 mt-1">
                  Votre compte bénéficie de l'accès complet à tous les modules métiers de l'application M-Ris.
                </p>
              </div>
            </div>

            <button
              onClick={onGoToUnlockedApp}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition-colors shrink-0"
            >
              <Sparkles className="w-4 h-4" />
              <span>Ouvrir l'Application Débloquée</span>
            </button>
          </div>
        </div>
      )}

      {/* Part 1: Official Wave Instructions Section */}
      <WavePaymentInstructions />

      {/* Part 2: Upload Form */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-8">
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900">
              Formulaire de soumission de votre reçu de paiement
            </h2>
            <button
              type="button"
              onClick={handleLoadDemoReceipt}
              className="text-xs font-semibold text-sky-600 hover:text-sky-700 underline flex items-center gap-1"
            >
              <ImageIcon className="w-3.5 h-3.5" />
              Générer un reçu Wave exemple (35 000 FCFA)
            </button>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Remplissez vos coordonnées et déposez la capture d'écran nette de votre transfert Wave Business vers Béni Amar.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* User Identification Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Nom complet *
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Ex: Camara Esther"
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white text-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Adresse email (pour la notification) *
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Ex: camaraesther920@gmail.com"
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white text-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Numéro Wave / Téléphone *
              </label>
              <input
                type="text"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Ex: +225 07 48 92 11 34"
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white text-slate-900"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Numéro de transaction Wave ou Référence (optionnel mais recommandé)
            </label>
            <input
              type="text"
              value={txRef}
              onChange={(e) => setTxRef(e.target.value)}
              placeholder="Ex: WAVE-CI-992108341"
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white font-mono text-slate-900"
            />
          </div>

          {/* Upload Area */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Capture d'écran du reçu de paiement Wave (35 000 FCFA) *
            </label>

            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`relative border-2 border-dashed rounded-2xl p-6 sm:p-8 text-center cursor-pointer transition-all ${
                isDragging
                  ? 'border-sky-500 bg-sky-50/60'
                  : receiptImage
                  ? 'border-emerald-300 bg-emerald-50/30'
                  : 'border-slate-300 hover:border-slate-400 bg-slate-50/50 hover:bg-slate-50'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />

              {receiptImage ? (
                <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                  <div className="relative group">
                    <img
                      src={receiptImage}
                      alt="Aperçu reçu"
                      className="w-28 h-36 object-cover rounded-xl shadow-md border border-slate-200"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center">
                      <span className="text-[11px] font-bold text-white">Changer l'image</span>
                    </div>
                  </div>

                  <div className="text-left space-y-2">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                      <span className="font-bold text-sm text-slate-900">
                        Capture d'écran prête
                      </span>
                    </div>
                    <p className="text-xs text-slate-600">
                      Fichier : <strong className="text-slate-800">{receiptFileName || 'recu_wave.png'}</strong>
                    </p>
                    <p className="text-[11px] text-slate-500">
                      Montant détecté : <strong>35 000 FCFA</strong> (Wave Côte d'Ivoire)
                    </p>
                    <div className="flex items-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setReceiptImage(null);
                          setReceiptFileName('');
                        }}
                        className="text-xs text-rose-600 hover:text-rose-700 font-medium underline"
                      >
                        Supprimer cette capture
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-sky-100 text-sky-600 flex items-center justify-center mx-auto">
                    <Upload className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="font-bold text-sm text-slate-800">
                      Cliquez pour téléverser votre reçu
                    </span>{' '}
                    <span className="text-xs text-slate-500">ou glissez-déposez l'image ici</span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Formats acceptés : PNG, JPG, JPEG, WEBP (Max 10 Mo)
                  </p>
                </div>
              )}
            </div>

            {uploadError && (
              <p className="text-xs text-rose-600 font-medium mt-2 flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4" />
                {uploadError}
              </p>
            )}
          </div>

          {/* Submission CTA button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-sky-500 via-sky-600 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white font-extrabold text-base shadow-lg shadow-sky-500/20 hover:shadow-sky-500/30 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  <span>Enregistrement en cours...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  <span>Envoyer ma preuve de paiement (35 000 FCFA)</span>
                </>
              )}
            </button>
            <p className="text-center text-[11px] text-slate-500 mt-2.5">
              En soumettant ce formulaire, votre statut passera immédiatement à <strong>« En attente »</strong> et l'administratrice <strong>Camara Esther</strong> validera votre dossier.
            </p>

            <div className="mt-3 text-center">
              <a
                href={`${SUBSCRIPTION_CONFIG.WHATSAPP_URL}?text=${whatsappMessage}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md transition-all hover:scale-[1.02]"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Prévenir Esther sur WhatsApp (RGXYT5LWDCTAM1)</span>
              </a>
            </div>
          </div>

        </form>
      </div>

      {/* Floating Assistant Trigger Bar */}
      <div className="bg-slate-900 text-white rounded-2xl p-4 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-3">
          <img
            src="/src/assets/images/mris_assistant_avatar_1791391815061.jpg"
            alt="M-Ris Assistant"
            className="w-10 h-10 rounded-full border border-cyan-400 object-cover"
            onError={(e) => {
              (e.target as HTMLElement).style.display = 'none';
            }}
          />
          <div>
            <div className="font-bold text-sm text-white">Besoin d'aide pour votre validation Wave ?</div>
            <div className="text-xs text-slate-300">L'assistant M-Ris est disponible pour vous guider pas à pas.</div>
          </div>
        </div>

        <button
          onClick={onOpenAssistant}
          className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition-colors shrink-0"
        >
          Parler à M-Ris
        </button>
      </div>

    </div>
  );
};
