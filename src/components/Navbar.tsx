import React from 'react';
import { SUBSCRIPTION_CONFIG } from '../utils/constants';
import { UserSession } from '../types/subscription';
import { 
  Sparkles, 
  User, 
  LayoutDashboard, 
  MessageCircle, 
  Lock, 
  LogIn, 
  LogOut, 
  ShieldCheck, 
  CheckCircle2, 
  Clock,
  Bot,
  GraduationCap,
  Target
} from 'lucide-react';

interface NavbarProps {
  currentView: 'client' | 'admin' | 'app_unlocked' | 'autonomous' | 'languages' | 'commercial';
  onViewChange: (view: 'client' | 'admin' | 'app_unlocked' | 'autonomous' | 'languages' | 'commercial') => void;
  pendingCount: number;
  activeCount: number;
  userStatus: 'pending' | 'active' | 'trial' | 'rejected' | 'none';
  isTrial?: boolean;
  isAdmin: boolean;
  currentUser: UserSession | null;
  onOpenAuthModal: () => void;
  onOpenAdminLogin: () => void;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  onViewChange,
  pendingCount,
  activeCount,
  userStatus,
  isTrial = false,
  isAdmin,
  currentUser,
  onOpenAuthModal,
  onOpenAdminLogin,
  onLogout
}) => {
  return (
    <header className="sticky top-0 z-40 bg-slate-900 border-b border-slate-800 text-slate-100 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-2">
        
        {/* Brand / Title */}
        <div 
          onClick={() => onViewChange('app_unlocked')}
          className="flex items-center gap-2.5 cursor-pointer select-none group shrink-0"
        >
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-500 via-sky-500 to-indigo-600 flex items-center justify-center font-black text-white text-lg shadow-md shadow-cyan-500/20 group-hover:scale-105 transition-transform">
            E
          </div>
          <div className="flex flex-col">
            <span className="font-extrabold text-sm sm:text-base tracking-tight text-white flex items-center gap-1.5 lowercase">
              emris le compagnon virtuel
            </span>
            <span className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
              <span>Sage & psychologue complice</span>
              {isTrial && (
                <span className="text-amber-300 font-bold bg-amber-500/20 px-1.5 py-0.2 rounded border border-amber-500/30">
                  Essai 7j
                </span>
              )}
              {userStatus === 'active' && !isTrial && (
                <span className="text-emerald-400 font-bold bg-emerald-500/20 px-1.5 py-0.2 rounded border border-emerald-500/30">
                  Actif 30j
                </span>
              )}
            </span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center gap-1 bg-slate-800/90 p-1 rounded-2xl border border-slate-700/60">
          
          {/* Companion Tab - Always visible */}
          <button
            onClick={() => onViewChange('app_unlocked')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              currentView === 'app_unlocked'
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-cyan-300" />
            <span className="hidden sm:inline">Mon Compagnon Emris</span>
            <span className="sm:hidden">Emris</span>
          </button>

          {/* Autonomous Agent Tab - Emails, Redaction & Freelance */}
          <button
            onClick={() => onViewChange('autonomous')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer border ${
              currentView === 'autonomous'
                ? 'bg-gradient-to-r from-indigo-600 via-purple-600 to-emerald-600 text-white border-purple-400 shadow-md shadow-indigo-500/20'
                : 'bg-indigo-950/40 text-indigo-200 border-indigo-700/50 hover:bg-indigo-900/50 hover:text-white'
            }`}
          >
            <div className="relative flex items-center justify-center">
              <Bot className="w-3.5 h-3.5 text-emerald-300" />
              <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
            </div>
            <span className="hidden md:inline">M-Ris Autonome (Emails, Rédaction & Freelance)</span>
            <span className="md:hidden">Autonome</span>
          </button>

          {/* Languages Professor Tab - Anglais, Espagnol, Allemand, Coréen, Chinois */}
          <button
            onClick={() => onViewChange('languages')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer border ${
              currentView === 'languages'
                ? 'bg-gradient-to-r from-amber-500 via-rose-500 to-indigo-600 text-white border-amber-300 shadow-md shadow-amber-500/20'
                : 'bg-amber-950/30 text-amber-200 border-amber-700/40 hover:bg-amber-900/40 hover:text-white'
            }`}
          >
            <GraduationCap className="w-3.5 h-3.5 text-amber-300" />
            <span className="hidden lg:inline">🎓 Prof de Langues (5 Langues & Devoirs)</span>
            <span className="hidden sm:inline lg:hidden">🎓 Prof de Langues</span>
            <span className="sm:hidden">Langues</span>
          </button>

          {/* Commercial Agent Tab - Promos, Pubs, Prospects, Liens & Prompts */}
          <button
            onClick={() => onViewChange('commercial')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer border ${
              currentView === 'commercial'
                ? 'bg-gradient-to-r from-cyan-500 via-indigo-600 to-emerald-600 text-white border-cyan-300 shadow-md shadow-cyan-500/20'
                : 'bg-cyan-950/30 text-cyan-200 border-cyan-700/40 hover:bg-cyan-900/40 hover:text-white'
            }`}
          >
            <Target className="w-3.5 h-3.5 text-cyan-300" />
            <span className="hidden xl:inline">🎯 Agent Commercial (Promos & Conversion)</span>
            <span className="hidden sm:inline xl:hidden">🎯 Commercial</span>
            <span className="sm:hidden">Ventes</span>
          </button>

          {/* Subscription Tab - Always visible */}
          <button
            onClick={() => onViewChange('client')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
              currentView === 'client'
                ? 'bg-gradient-to-r from-sky-600 to-indigo-600 text-white shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Abonnement Wave (35 000 F)</span>
            <span className="md:hidden">Abonnement</span>
          </button>

          {/* Admin Tab - STRICTLY VISIBLE ONLY FOR ADMIN (Camara Esther) */}
          {isAdmin && (
            <button
              onClick={() => onViewChange('admin')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer border ${
                currentView === 'admin'
                  ? 'bg-amber-400 text-slate-950 border-amber-300 shadow-sm'
                  : 'bg-amber-500/15 text-amber-300 border-amber-500/30 hover:bg-amber-500/25'
              }`}
              title="Tableau de bord réservé exclusivement à Camara Esther"
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">👑 Dashboard Admin</span>
              <span className="sm:hidden">👑 Admin</span>
              {pendingCount > 0 && (
                <span className="px-1.5 py-0.2 text-[10px] font-black rounded-full bg-rose-600 text-white animate-pulse">
                  {pendingCount}
                </span>
              )}
            </button>
          )}

        </nav>

        {/* Right Section: User Profile & Auth */}
        <div className="flex items-center gap-2">
          
          {currentUser ? (
            <div className="flex items-center gap-1.5">
              <button
                onClick={onOpenAuthModal}
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700/80 border border-slate-700 text-xs text-slate-200 transition-colors cursor-pointer group"
                title="Gérer mon compte / changer d'utilisateur"
              >
                <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-cyan-500 to-indigo-500 text-white flex items-center justify-center font-bold text-[11px]">
                  {currentUser.userName.charAt(0).toUpperCase()}
                </div>
                <div className="flex flex-col text-left hidden sm:flex">
                  <span className="font-semibold text-white leading-tight truncate max-w-[100px]">
                    {currentUser.userName.split(' ')[0]}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {isAdmin ? '👑 Admin' : isTrial ? '⏳ Essai 7j' : userStatus === 'active' ? '✓ Abonné' : '⏳ Attente'}
                  </span>
                </div>
              </button>

              <button
                onClick={onLogout}
                className="p-1.5 rounded-xl bg-slate-800/80 hover:bg-rose-950/60 text-slate-400 hover:text-rose-300 border border-slate-700 transition-colors cursor-pointer"
                title="Se déconnecter"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenAuthModal}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-bold shadow-sm transition-all cursor-pointer"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Connexion (Essai 7j)</span>
            </button>
          )}

          {/* Discreet Admin Lock Button for Esther when not yet unlocked */}
          {!isAdmin && (
            <button
              onClick={onOpenAdminLogin}
              className="p-1.5 rounded-xl bg-slate-800/60 hover:bg-slate-700/80 text-slate-500 hover:text-amber-400 border border-slate-700/50 transition-colors cursor-pointer"
              title="Accès Administratrice (Camara Esther)"
            >
              <Lock className="w-3.5 h-3.5" />
            </button>
          )}

          {/* WhatsApp Support Link */}
          <a
            href={SUBSCRIPTION_CONFIG.WHATSAPP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden lg:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/25 transition-colors cursor-pointer"
          >
            <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
            <span>WhatsApp</span>
          </a>

        </div>

      </div>
    </header>
  );
};
