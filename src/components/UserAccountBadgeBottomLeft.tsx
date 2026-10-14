import React, { useState } from 'react';
import { UserSession, SubscriptionRequest } from '../types/subscription';
import { FORMAT_FCFA } from '../utils/constants';
import { 
  User, 
  Sparkles, 
  CheckCircle2, 
  Clock, 
  LogOut, 
  ShieldCheck, 
  CreditCard, 
  ChevronUp, 
  ChevronDown, 
  LogIn, 
  Eye, 
  ExternalLink,
  MessageCircle,
  HelpCircle
} from 'lucide-react';

interface UserAccountBadgeBottomLeftProps {
  currentUser: UserSession | null;
  subscription: SubscriptionRequest | null;
  isAdmin: boolean;
  onOpenAuthModal: () => void;
  onLogout: () => void;
  onGoToSubscription: () => void;
  onGoToCompanion: () => void;
  onViewReceipt?: (subscription: SubscriptionRequest) => void;
}

export const UserAccountBadgeBottomLeft: React.FC<UserAccountBadgeBottomLeftProps> = ({
  currentUser,
  subscription,
  isAdmin,
  onOpenAuthModal,
  onLogout,
  onGoToSubscription,
  onGoToCompanion,
  onViewReceipt
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // If not logged in
  if (!currentUser) {
    return (
      <div className="fixed bottom-4 left-4 z-40 animate-fadeIn">
        <button
          onClick={onOpenAuthModal}
          className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl bg-slate-900/95 hover:bg-slate-900 text-white border border-slate-700/80 shadow-2xl backdrop-blur-md text-xs font-bold transition-all hover:scale-[1.02] cursor-pointer"
        >
          <div className="w-7 h-7 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 flex items-center justify-center shrink-0">
            <LogIn className="w-3.5 h-3.5" />
          </div>
          <div className="text-left">
            <span className="block text-white font-extrabold leading-tight">Mon Compte Personnel</span>
            <span className="text-[10px] text-cyan-400 font-medium">Se connecter • 7j Gratuits</span>
          </div>
        </button>
      </div>
    );
  }

  const isTrial = subscription?.isTrial || subscription?.status === 'trial';
  const isActive = subscription?.status === 'active' && !isTrial;
  const isPending = subscription?.status === 'pending';

  // Calculate days remaining if trial or active
  let daysRemaining: number | null = null;
  if (subscription?.expiresAt) {
    const exp = new Date(subscription.expiresAt).getTime();
    daysRemaining = Math.max(0, Math.ceil((exp - Date.now()) / (1000 * 60 * 60 * 24)));
  }

  return (
    <div className="fixed bottom-4 left-4 z-40 max-w-[320px] sm:max-w-xs select-none animate-fadeIn">
      <div className="bg-slate-950/95 text-white rounded-3xl border border-slate-800 shadow-2xl backdrop-blur-md overflow-hidden transition-all">
        
        {/* Main Header / Pill (Always visible at bottom-left) */}
        <div 
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-3.5 flex items-center justify-between gap-3 cursor-pointer hover:bg-slate-900/60 transition-colors"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="relative shrink-0">
              <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-cyan-500 to-indigo-600 text-white font-black text-sm flex items-center justify-center shadow-md">
                {currentUser.userName.charAt(0).toUpperCase()}
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-slate-950" title="Connecté" />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-xs text-white truncate block">
                  {currentUser.userName}
                </span>
                {isAdmin && (
                  <span className="text-[9px] font-black uppercase px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 shrink-0">
                    👑 Admin
                  </span>
                )}
              </div>
              
              <div className="flex items-center gap-1.5 mt-0.5">
                {isAdmin ? (
                  <span className="text-[10px] text-amber-300 font-semibold truncate">
                    Camara Esther (Propriétaire)
                  </span>
                ) : isTrial ? (
                  <span className="text-[10px] text-amber-400 font-bold flex items-center gap-1">
                    <Sparkles className="w-2.5 h-2.5 text-amber-400" />
                    <span>Essai 7j {daysRemaining !== null ? `(${daysRemaining}j restants)` : 'Actif'}</span>
                  </span>
                ) : isActive ? (
                  <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400" />
                    <span>Abonné 30j {daysRemaining !== null ? `(${daysRemaining}j restants)` : 'Actif'}</span>
                  </span>
                ) : isPending ? (
                  <span className="text-[10px] text-amber-300 font-bold flex items-center gap-1">
                    <Clock className="w-2.5 h-2.5 animate-spin" />
                    <span>Paiement Wave en cours</span>
                  </span>
                ) : (
                  <span className="text-[10px] text-slate-400">
                    Espace Personnel Sécurisé
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0 text-slate-400 hover:text-white">
            {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </div>
        </div>

        {/* Expanded Drawer Details (Only for this single user) */}
        {isExpanded && (
          <div className="px-4 pb-4 pt-1 border-t border-slate-800/80 space-y-3 bg-slate-900/40 animate-in fade-in zoom-in-95 duration-150 text-xs">
            
            {/* User Identity Details */}
            <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 space-y-1.5">
              <div className="text-slate-400 text-[11px]">
                Email : <strong className="text-slate-200 font-mono">{currentUser.userEmail}</strong>
              </div>
              <div className="text-slate-400 text-[11px]">
                Téléphone : <strong className="text-slate-200">{currentUser.userPhone}</strong>
              </div>
              <div className="text-slate-400 text-[11px]">
                Statut : {' '}
                <strong className={isAdmin ? 'text-amber-300' : isTrial ? 'text-amber-400' : isActive ? 'text-emerald-400' : 'text-slate-300'}>
                  {isAdmin ? '👑 Administratrice Fondatrice' : isTrial ? 'Essai Gratuit 7 Jours Débloqué' : isActive ? 'Abonnement Mensuel 35 000 FCFA Validé' : isPending ? 'Demande de paiement en attente' : 'Visiteur'}
                </strong>
              </div>
              {subscription?.expiresAt && (
                <div className="text-[10px] text-slate-400 pt-1 border-t border-slate-800/80">
                  Échéance : <span className="text-slate-300 font-mono">{new Date(subscription.expiresAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                </div>
              )}
            </div>

            {/* Quick Actions for this user */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                onClick={() => {
                  onGoToSubscription();
                  setIsExpanded(false);
                }}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-[11px] flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <CreditCard className="w-3.5 h-3.5 text-cyan-400" />
                <span>Mon Abonnement</span>
              </button>

              <button
                onClick={() => {
                  onGoToCompanion();
                  setIsExpanded(false);
                }}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-[11px] flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Mon Compagnon</span>
              </button>
            </div>

            {subscription?.receiptImage && onViewReceipt && (
              <button
                onClick={() => {
                  onViewReceipt(subscription);
                  setIsExpanded(false);
                }}
                className="w-full py-2 px-3 rounded-xl bg-sky-950/60 hover:bg-sky-900/60 text-sky-300 border border-sky-800/50 font-bold text-[11px] flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Voir mon reçu Wave téléversé</span>
              </button>
            )}

            {/* Logout button */}
            <button
              onClick={() => {
                onLogout();
                setIsExpanded(false);
              }}
              className="w-full py-2 px-3 rounded-xl bg-rose-950/40 hover:bg-rose-900/50 text-rose-300 border border-rose-800/50 font-bold text-[11px] flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Se déconnecter</span>
            </button>

            <div className="text-[10px] text-slate-500 text-center pt-0.5">
              🔒 Espace strictement confidentiel & isolé
            </div>

          </div>
        )}

      </div>
    </div>
  );
};
