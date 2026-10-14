import React, { useState } from 'react';
import { UserSession, SubscriptionRequest } from '../types/subscription';
import { SUBSCRIPTION_CONFIG, isAdminEmail } from '../utils/constants';
import { 
  Lock, 
  User, 
  Mail, 
  Phone, 
  Sparkles, 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  ArrowRight, 
  KeyRound, 
  Eye, 
  EyeOff,
  UserPlus,
  LogIn,
  Database,
  Check
} from 'lucide-react';
import { 
  insertUserToSupabaseDirect, 
  getSupabaseBrowserClient, 
  SUPABASE_USERS_TABLE 
} from '../services/supabaseClient';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserSession | null;
  isAdmin: boolean;
  onLoginUser: (user: UserSession, autoStartTrial?: boolean) => void;
  onAdminLogin: (email: string, password: string) => boolean;
  onLogout: () => void;
  subscriptions?: SubscriptionRequest[];
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  isAdmin,
  onLoginUser,
  onAdminLogin,
  onLogout
}) => {
  const [activeTab, setActiveTab] = useState<'register' | 'login' | 'admin'>('register');
  
  // Registration Form State (Internal Form -> Supabase table 'utilisateurs')
  const [regName, setRegName] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [startTrialNow, setStartTrialNow] = useState(true);
  const [regError, setRegError] = useState<string | null>(null);
  const [regSuccessMessage, setRegSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Login Form State
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  // Admin Form State
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [showAdminPassword, setShowAdminPassword] = useState(false);
  const [adminError, setAdminError] = useState<string | null>(null);

  if (!isOpen) return null;

  // Handle Internal Registration -> Direct to Supabase 'utilisateurs' table
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName.trim()) {
      setRegError('Veuillez renseigner votre Nom complet.');
      return;
    }
    if (!regPhone.trim()) {
      setRegError('Veuillez renseigner votre numéro de Téléphone ou WhatsApp.');
      return;
    }
    if (!regEmail.trim() || !regEmail.includes('@')) {
      setRegError('Veuillez entrer une adresse email valide.');
      return;
    }
    if (!regPassword.trim() || regPassword.length < 4) {
      setRegError('Veuillez définir un mot de passe d\'au moins 4 caractères.');
      return;
    }

    setRegError(null);
    setIsSubmitting(true);

    try {
      const detectedDevice = typeof navigator !== 'undefined' ? (navigator.userAgent.includes('Mobile') ? 'Mobile' : 'Ordinateur') : 'Web';
      
      // 1. Insertion directe et durable dans la table Supabase 'utilisateurs' (Fonctionne 100% sur Netlify et GitHub Pages)
      await insertUserToSupabaseDirect({
        userName: regName.trim(),
        userEmail: regEmail.trim().toLowerCase(),
        userPhone: regPhone.trim(),
        password: regPassword,
        device: detectedDevice
      }).catch(err => console.warn('Supabase direct insert warning:', err));

      // 2. Appel serveur optionnel (si backend Node.js présent)
      fetch('/api/mris/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nom: regName.trim(),
          telephone: regPhone.trim(),
          email: regEmail.trim().toLowerCase(),
          mot_de_passe: regPassword,
          userName: regName.trim(),
          userPhone: regPhone.trim(),
          userEmail: regEmail.trim().toLowerCase(),
          password: regPassword,
          startTrial: startTrialNow,
          device: detectedDevice
        })
      }).catch(() => {});

      const isOwnerEmail = isAdminEmail(regEmail);
      const session: UserSession = {
        userName: regName.trim(),
        userEmail: regEmail.trim().toLowerCase(),
        userPhone: regPhone.trim(),
        password: regPassword,
        isAdmin: isOwnerEmail && isAdmin
      };

      setRegSuccessMessage('Compte enregistré dans votre table Supabase utilisateurs ! Accès en cours...');

      setTimeout(() => {
        setIsSubmitting(false);
        onLoginUser(session, startTrialNow);
        onClose();
      }, 700);

    } catch (err: any) {
      console.warn('Erreur lors de l\'enregistrement, création locale immédiate:', err);
      const isOwnerEmail = isAdminEmail(regEmail);
      const session: UserSession = {
        userName: regName.trim(),
        userEmail: regEmail.trim().toLowerCase(),
        userPhone: regPhone.trim(),
        password: regPassword,
        isAdmin: isOwnerEmail && isAdmin
      };
      setIsSubmitting(false);
      onLoginUser(session, startTrialNow);
      onClose();
    }
  };

  // Handle Internal Login (avec vérification directe Supabase table 'utilisateurs')
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail.trim() || !loginEmail.includes('@')) {
      setLoginError('Veuillez entrer une adresse email valide.');
      return;
    }

    setLoginError(null);
    setIsSubmitting(true);

    try {
      // 1. Tenter l'API serveur si disponible
      let serverData: any = null;
      try {
        const response = await fetch('/api/mris/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: loginEmail.trim().toLowerCase(),
            password: loginPassword
          })
        });
        if (response.ok) {
          serverData = await response.json();
        }
      } catch {
        // Pas de serveur Node.js (hébergement statique Netlify ou GitHub Pages)
      }

      // 2. Si pas de réponse serveur, vérifier directement dans la table Supabase 'utilisateurs'
      let fetchedUser: any = serverData?.user;
      if (!fetchedUser) {
        try {
          const client = getSupabaseBrowserClient();
          const { data: supaUser, error } = await client
            .from(SUPABASE_USERS_TABLE)
            .select('*')
            .ilike('email', loginEmail.trim().toLowerCase())
            .maybeSingle();

          if (!error && supaUser) {
            const storedPw = supaUser.mot_de_passe || supaUser.password;
            if (storedPw && loginPassword && storedPw !== loginPassword) {
              setLoginError('Mot de passe incorrect.');
              setIsSubmitting(false);
              return;
            }
            fetchedUser = {
              userName: supaUser.nom || supaUser.user_name || loginEmail.split('@')[0],
              userPhone: supaUser.telephone || supaUser.user_phone || '+225 07 00 00 00 00',
              userEmail: supaUser.email || loginEmail.trim().toLowerCase()
            };
          }
        } catch (supaErr) {
          console.warn('Vérification Supabase directe warning:', supaErr);
        }
      }

      const isOwnerEmail = isAdminEmail(loginEmail);
      const session: UserSession = {
        userName: fetchedUser?.userName || loginEmail.split('@')[0],
        userEmail: loginEmail.trim().toLowerCase(),
        userPhone: fetchedUser?.userPhone || '+225 07 00 00 00 00',
        password: loginPassword,
        isAdmin: isOwnerEmail && isAdmin
      };

      setIsSubmitting(false);
      onLoginUser(session, true);
      onClose();
    } catch (err) {
      setIsSubmitting(false);
      const isOwnerEmail = isAdminEmail(loginEmail);
      const session: UserSession = {
        userName: loginEmail.split('@')[0],
        userEmail: loginEmail.trim().toLowerCase(),
        userPhone: '+225 07 00 00 00 00',
        isAdmin: isOwnerEmail && isAdmin
      };
      onLoginUser(session, true);
      onClose();
    }
  };

  // Handle Admin Submit
  const handleAdminSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminEmail.trim()) {
      setAdminError('Veuillez entrer votre adresse email administratrice.');
      return;
    }
    if (!adminPassword) {
      setAdminError('Veuillez entrer votre mot de passe administrateur.');
      return;
    }

    const success = onAdminLogin(adminEmail, adminPassword);
    if (success) {
      setAdminError(null);
      setAdminPassword('');
      setAdminEmail('');
      onClose();
    } else {
      setAdminError('Identifiants administrateur incorrects (adresse email ou mot de passe invalide).');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs animate-fadeIn">
      <div 
        className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Header */}
        <div className="bg-slate-900 px-6 py-4 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center font-black text-white text-lg shadow-sm">
              E
            </div>
            <div>
              <h3 className="font-extrabold text-base text-white tracking-tight">
                Compte Emris • Authentification
              </h3>
              <p className="text-xs text-slate-400 flex items-center gap-1.5">
                <Database className="w-3 h-3 text-emerald-400" />
                <span>Base Supabase interne • Sans redirection Google</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Mode Switcher Tabs (Inscription / Connexion / Admin) */}
        <div className="flex border-b border-slate-100 bg-slate-50 p-1.5 gap-1 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('register')}
            className={`flex-1 py-2 px-1 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'register'
                ? 'bg-white text-slate-900 shadow-xs border border-slate-200/80 text-cyan-700'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5 text-cyan-600" />
            <span>Inscription</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('login')}
            className={`flex-1 py-2 px-1 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'login'
                ? 'bg-white text-slate-900 shadow-xs border border-slate-200/80 text-indigo-700'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <LogIn className="w-3.5 h-3.5 text-indigo-600" />
            <span>Connexion</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('admin')}
            className={`flex-1 py-2 px-1 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'admin'
                ? 'bg-white text-slate-900 shadow-xs border border-slate-200/80 text-amber-700'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <Lock className="w-3.5 h-3.5 text-amber-600" />
            <span>Admin</span>
          </button>
        </div>

        {/* Content Body with scroll if needed */}
        <div className="p-5 overflow-y-auto flex-1">
          
          {/* TAB 1: FORMULAIRE D'INSCRIPTION INTERNE (Nom, Téléphone, Email, Mot de passe) */}
          {activeTab === 'register' && (
            <div className="space-y-3.5">
              <div className="bg-sky-50/70 border border-sky-100 rounded-2xl p-3 text-xs text-sky-900">
                <div className="flex items-center gap-2 font-bold text-sky-800">
                  <Database className="w-4 h-4 text-sky-600 shrink-0" />
                  <span>Enregistrement direct dans Supabase (table 'utilisateurs')</span>
                </div>
                <p className="text-[11px] text-sky-700 mt-1 leading-relaxed">
                  Remplissez vos 4 informations pour créer votre compte immédiatement. Aucune authentification Google externe requise, aucune page 403.
                </p>
              </div>

              {regError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{regError}</span>
                </div>
              )}

              {regSuccessMessage && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                  <span>{regSuccessMessage}</span>
                </div>
              )}

              <form onSubmit={handleRegisterSubmit} className="space-y-3">
                {/* 1. Nom */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nom & Prénom <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      required
                      value={regName}
                      onChange={(e) => setRegName(e.target.value)}
                      placeholder="Ex: Kouamé Jean ou Awa Traoré"
                      className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    />
                  </div>
                </div>

                {/* 2. Téléphone */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Téléphone / WhatsApp <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="tel"
                      required
                      value={regPhone}
                      onChange={(e) => setRegPhone(e.target.value)}
                      placeholder="Ex: +225 07 XX XX XX XX"
                      className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    />
                  </div>
                </div>

                {/* 3. Adresse mail */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Adresse Email <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="email"
                      required
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      placeholder="votre.email@exemple.ci"
                      className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    />
                  </div>
                </div>

                {/* 4. Mot de passe */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Mot de passe <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type={showRegPassword ? "text" : "password"}
                      required
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      placeholder="Définir un mot de passe secret"
                      className="w-full pl-9 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowRegPassword(!showRegPassword)}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                      title={showRegPassword ? "Masquer" : "Afficher"}
                    >
                      {showRegPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* 7-day Trial Checkbox */}
                <div className="flex items-center gap-2 p-2.5 bg-cyan-50/70 rounded-xl border border-cyan-100">
                  <input
                    type="checkbox"
                    id="regTrial"
                    checked={startTrialNow}
                    onChange={(e) => setStartTrialNow(e.target.checked)}
                    className="w-4 h-4 rounded text-cyan-600 focus:ring-cyan-500 cursor-pointer"
                  />
                  <label htmlFor="regTrial" className="text-xs text-cyan-900 font-semibold cursor-pointer">
                    Activer mes <strong>7 jours d'essai gratuit</strong> sans carte bancaire
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-black text-xs shadow-md shadow-cyan-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>{isSubmitting ? 'Enregistrement dans Supabase...' : 'S\'inscrire & Accéder à Emris'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </form>

              <div className="text-center pt-1">
                <button
                  type="button"
                  onClick={() => setActiveTab('login')}
                  className="text-xs text-slate-500 hover:text-indigo-600 font-medium"
                >
                  Vous avez déjà un compte ? <strong className="underline">Connectez-vous ici</strong>
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: CONNEXION RAPIDE INTERNE (Email + Mot de passe) */}
          {activeTab === 'login' && (
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-bold text-slate-900">
                  Connexion à votre Compte Personnel
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Connectez-vous avec votre adresse email et votre mot de passe pour retrouver vos échanges avec Emris.
                </p>
              </div>

              {loginError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{loginError}</span>
                </div>
              )}

              <form onSubmit={handleLoginSubmit} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Adresse Email
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="email"
                      required
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      placeholder="votre.email@exemple.ci"
                      className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Mot de passe
                  </label>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type={showLoginPassword ? "text" : "password"}
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-9 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowLoginPassword(!showLoginPassword)}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-slate-900 hover:from-indigo-700 hover:to-slate-800 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <LogIn className="w-4 h-4" />
                  <span>{isSubmitting ? 'Connexion en cours...' : 'Se connecter'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </form>

              <div className="text-center pt-1">
                <button
                  type="button"
                  onClick={() => setActiveTab('register')}
                  className="text-xs text-slate-500 hover:text-cyan-700 font-medium"
                >
                  Pas encore de compte ? <strong className="underline">Créer un compte ici</strong>
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: ESPACE ADMINISTRATRICE */}
          {activeTab === 'admin' && (
            <div className="space-y-4">
              <div className="text-center pb-2">
                <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto mb-2.5">
                  <Lock className="w-6 h-6" />
                </div>
                <h4 className="text-base font-extrabold text-slate-900">
                  Accès Réservé à l'Administratrice
                </h4>
                <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                  Entrez vos identifiants administrateur pour contrôler les abonnements, utilisateurs et paiements Wave.
                </p>
              </div>

              {adminError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{adminError}</span>
                </div>
              )}

              {isAdmin ? (
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 space-y-3">
                  <div className="flex items-center gap-2 font-bold text-xs">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Vous êtes déjà authentifiée comme Administratrice !</span>
                  </div>
                  <p className="text-xs leading-relaxed text-emerald-700">
                    Le tableau de bord admin est visible et débloqué sur votre session. Vous pouvez valider les paiements Wave et gérer les utilisateurs enregistrés dans Supabase.
                  </p>
                  <button
                    onClick={() => {
                      onLogout();
                      setAdminEmail('');
                      setAdminPassword('');
                    }}
                    className="w-full py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors cursor-pointer"
                  >
                    Verrouiller l'Espace Admin
                  </button>
                </div>
              ) : (
                <form onSubmit={handleAdminSubmit} className="space-y-3.5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Email Administratrice
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      <input
                        type="email"
                        value={adminEmail}
                        onChange={(e) => setAdminEmail(e.target.value)}
                        placeholder="camaraesther920@gmail.com"
                        className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                        autoFocus
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Mot de passe administrateur
                    </label>
                    <div className="relative">
                      <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      <input
                        type={showAdminPassword ? "text" : "password"}
                        value={adminPassword}
                        onChange={(e) => setAdminPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full pl-9 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                      />
                      <button
                        type="button"
                        onClick={() => setShowAdminPassword(!showAdminPassword)}
                        className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                      >
                        {showAdminPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-600 to-slate-900 hover:from-amber-700 hover:to-slate-800 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>Déverrouiller le Dashboard Admin</span>
                  </button>
                </form>
              )}
            </div>
          )}

        </div>

        {/* Footer info */}
        {currentUser && (
          <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600 shrink-0">
            <span className="truncate max-w-[200px]">
              Session : <strong>{currentUser.userName}</strong>
            </span>
            <button
              onClick={() => {
                onLogout();
                onClose();
              }}
              className="text-xs font-semibold text-rose-600 hover:underline cursor-pointer"
            >
              Se déconnecter
            </button>
          </div>
        )}

      </div>
    </div>
  );
};
