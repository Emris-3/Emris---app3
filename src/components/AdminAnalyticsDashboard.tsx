import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { SubscriptionRequest } from '../types/subscription';
import { RegisteredUser, UserLoginEvent } from '../types/adminControl';
import { FORMAT_FCFA } from '../utils/constants';
import {
  TrendingUp,
  Users,
  CreditCard,
  Calendar,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  Filter,
  PieChart as PieIcon,
  BarChart3
} from 'lucide-react';

interface AdminAnalyticsDashboardProps {
  registeredUsers: RegisteredUser[];
  subscriptions: SubscriptionRequest[];
  loginEvents: UserLoginEvent[];
}

// Colors for Charts
const CHART_COLORS = {
  cyan: '#06b6d4',
  indigo: '#6366f1',
  emerald: '#10b981',
  amber: '#f59e0b',
  rose: '#f43f5e',
  purple: '#a855f7',
  slate: '#64748b'
};

const PIE_COLORS = [
  '#10b981', // Actif payant
  '#f59e0b', // Essai 7j
  '#06b6d4', // En attente
  '#f43f5e'  // Rejeté
];

export const AdminAnalyticsDashboard: React.FC<AdminAnalyticsDashboardProps> = ({
  registeredUsers = [],
  subscriptions = [],
  loginEvents = []
}) => {
  // Timeframe for daily registrations chart: 7, 14, or 30 days
  const [dailyTimeframe, setDailyTimeframe] = useState<7 | 14 | 30>(14);
  // View mode for monthly payments: 'amount' (FCFA) or 'count' (Nombre de transactions)
  const [monthlyMetricMode, setMonthlyMetricMode] = useState<'amount' | 'count'>('amount');

  // =========================================================================
  // 1. DATA PROCESSING: Inscriptions quotidiennes (Daily Registrations)
  // =========================================================================
  const dailyRegistrationData = useMemo(() => {
    const days: Array<{
      dateKey: string;
      label: string;
      fullDate: string;
      inscriptions: number;
      essais7j: number;
      connexions: number;
    }> = [];

    const now = new Date();

    for (let i = dailyTimeframe - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const dateKey = `${year}-${month}-${day}`;

      const shortLabel = d.toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: dailyTimeframe > 14 ? 'numeric' : 'short'
      });

      const fullDate = d.toLocaleDateString('fr-FR', {
        weekday: 'short',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });

      // Count registrations on this specific day
      const usersRegisteredThisDay = registeredUsers.filter(u => {
        if (!u.registeredAt) return false;
        const uDate = new Date(u.registeredAt);
        return !isNaN(uDate.getTime()) && uDate.toISOString().slice(0, 10) === dateKey;
      }).length;

      // Count trial registrations
      const trialsThisDay = registeredUsers.filter(u => {
        if (!u.registeredAt) return false;
        const uDate = new Date(u.registeredAt);
        const matchesDate = !isNaN(uDate.getTime()) && uDate.toISOString().slice(0, 10) === dateKey;
        return matchesDate && (u.subscriptionPlan?.includes('7') || u.subscriptionStatus === 'trial');
      }).length;

      // Count login events on this day
      const loginsThisDay = loginEvents.filter(evt => {
        if (!evt.timestamp) return false;
        const eDate = new Date(evt.timestamp);
        return !isNaN(eDate.getTime()) && eDate.toISOString().slice(0, 10) === dateKey;
      }).length;

      days.push({
        dateKey,
        label: shortLabel,
        fullDate,
        inscriptions: usersRegisteredThisDay,
        essais7j: trialsThisDay,
        connexions: loginsThisDay
      });
    }

    return days;
  }, [registeredUsers, loginEvents, dailyTimeframe]);

  // Daily registrations summary metrics
  const totalInscriptionsPeriod = useMemo(() => {
    return dailyRegistrationData.reduce((acc, curr) => acc + curr.inscriptions, 0);
  }, [dailyRegistrationData]);

  const avgInscriptionsPerDay = useMemo(() => {
    return (totalInscriptionsPeriod / dailyTimeframe).toFixed(1);
  }, [totalInscriptionsPeriod, dailyTimeframe]);

  const maxInscriptionsDay = useMemo(() => {
    return dailyRegistrationData.reduce((prev, curr) => (curr.inscriptions > prev.inscriptions ? curr : prev), dailyRegistrationData[0]);
  }, [dailyRegistrationData]);

  // =========================================================================
  // 2. DATA PROCESSING: Volume de paiements validés par mois (Monthly Validated Payments)
  // =========================================================================
  const monthlyPaymentsData = useMemo(() => {
    const monthNames = [
      'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
      'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
    ];
    const shortMonthNames = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];

    const now = new Date();
    const currentYear = now.getFullYear();

    // Last 6 to 12 months buckets
    const result: Array<{
      monthKey: string;
      label: string;
      monthFull: string;
      year: number;
      volumeFCFA: number;
      transactionsCount: number;
      pendingCount: number;
      pendingVolumeFCFA: number;
    }> = [];

    // Build the last 6 months (including current month)
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const mIdx = d.getMonth();
      const yr = d.getFullYear();
      const monthPrefix = `${yr}-${String(mIdx + 1).padStart(2, '0')}`;

      // Validated payments in this month (status: 'active' and not trial)
      const validatedThisMonth = subscriptions.filter(sub => {
        if (sub.status !== 'active' || sub.isTrial || sub.amount <= 0) return false;
        const dateToCheck = sub.activatedAt || sub.submissionDate;
        if (!dateToCheck) return false;
        const sDate = new Date(dateToCheck);
        return !isNaN(sDate.getTime()) && sDate.getFullYear() === yr && sDate.getMonth() === mIdx;
      });

      // Pending payments in this month
      const pendingThisMonth = subscriptions.filter(sub => {
        if (sub.status !== 'pending') return false;
        const sDate = new Date(sub.submissionDate);
        return !isNaN(sDate.getTime()) && sDate.getFullYear() === yr && sDate.getMonth() === mIdx;
      });

      const volumeFCFA = validatedThisMonth.reduce((acc, curr) => acc + (curr.amount || 35000), 0);
      const pendingVolume = pendingThisMonth.reduce((acc, curr) => acc + (curr.amount || 35000), 0);

      result.push({
        monthKey: monthPrefix,
        label: `${shortMonthNames[mIdx]} ${yr === currentYear ? '' : yr}`,
        monthFull: `${monthNames[mIdx]} ${yr}`,
        year: yr,
        volumeFCFA,
        transactionsCount: validatedThisMonth.length,
        pendingCount: pendingThisMonth.length,
        pendingVolumeFCFA: pendingVolume
      });
    }

    return result;
  }, [subscriptions]);

  const totalValidatedAllMonthsFCFA = useMemo(() => {
    return monthlyPaymentsData.reduce((acc, curr) => acc + curr.volumeFCFA, 0);
  }, [monthlyPaymentsData]);

  const totalValidatedTransactionsCount = useMemo(() => {
    return monthlyPaymentsData.reduce((acc, curr) => acc + curr.transactionsCount, 0);
  }, [monthlyPaymentsData]);

  // =========================================================================
  // 3. DATA PROCESSING: Répartition des Formules (Subscription Breakdown Pie)
  // =========================================================================
  const subscriptionBreakdownData = useMemo(() => {
    const active = subscriptions.filter(s => s.status === 'active' && !s.isTrial).length;
    const trials = subscriptions.filter(s => s.status === 'trial' || s.isTrial).length;
    const pending = subscriptions.filter(s => s.status === 'pending').length;
    const rejected = subscriptions.filter(s => s.status === 'rejected').length;

    return [
      { name: 'Abonnés 30j Validés', value: active, color: '#10b981' },
      { name: 'Essais Gratuits 7j', value: trials, color: '#f59e0b' },
      { name: 'Paiements En Attente', value: pending, color: '#06b6d4' },
      { name: 'Rejetés / Non conformes', value: rejected, color: '#f43f5e' }
    ].filter(item => item.value > 0);
  }, [subscriptions]);

  // Conversion rate: Registered -> Active paid
  const conversionRate = useMemo(() => {
    if (registeredUsers.length === 0) return 0;
    const activePaid = subscriptions.filter(s => s.status === 'active' && !s.isTrial).length;
    return Math.round((activePaid / registeredUsers.length) * 100);
  }, [registeredUsers, subscriptions]);

  // Custom Recharts Tooltip for Daily Registrations
  const CustomDailyTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-900/95 backdrop-blur-md text-white p-3 rounded-2xl border border-slate-700 shadow-xl text-xs space-y-1.5 min-w-[190px]">
          <p className="font-bold text-cyan-300 pb-1 border-b border-slate-800">{data.fullDate}</p>
          <div className="flex items-center justify-between text-slate-200">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
              Nouvelles inscriptions :
            </span>
            <span className="font-mono font-bold text-cyan-300">{data.inscriptions}</span>
          </div>
          <div className="flex items-center justify-between text-slate-300">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
              Dont essais gratuits 7j :
            </span>
            <span className="font-mono font-bold text-amber-300">{data.essais7j}</span>
          </div>
          <div className="flex items-center justify-between text-slate-400 text-[11px] pt-1 border-t border-slate-800/80">
            <span>Connexions totales du jour :</span>
            <span className="font-mono text-slate-300">{data.connexions}</span>
          </div>
        </div>
      );
    }
    return null;
  };

  // Custom Recharts Tooltip for Monthly Payments
  const CustomMonthlyTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-900/95 backdrop-blur-md text-white p-3.5 rounded-2xl border border-slate-700 shadow-xl text-xs space-y-2 min-w-[220px]">
          <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
            <span className="font-black text-emerald-400">{data.monthFull}</span>
            <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/30">
              Wave Béni Amar
            </span>
          </div>
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-slate-300">Volume Validé :</span>
              <span className="font-mono font-bold text-emerald-300 text-sm">
                {FORMAT_FCFA(data.volumeFCFA)}
              </span>
            </div>
            <div className="flex items-center justify-between text-slate-300">
              <span>Transactions validées :</span>
              <span className="font-mono font-bold text-white">{data.transactionsCount} abonné(s)</span>
            </div>
            {data.pendingCount > 0 && (
              <div className="flex items-center justify-between text-amber-300 text-[11px] pt-1 border-t border-slate-800">
                <span>En attente de reçu Wave :</span>
                <span className="font-mono">{data.pendingCount} ({FORMAT_FCFA(data.pendingVolumeFCFA)})</span>
              </div>
            )}
          </div>
          <p className="text-[10px] text-slate-400 italic">
            🔒 Reçus vérifiés manuellement par l'administrateur
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">

      {/* Top Header of Analytics Dashboard */}
      <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 border border-indigo-800/50 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-72 h-72 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                Module Analytique Recharts
              </span>
              <span className="text-xs text-emerald-400 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Synchronisation En Temps Réel
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white mt-1.5 flex items-center gap-2.5">
              <BarChart3 className="w-6 h-6 text-cyan-400" />
              <span>Tableau de Bord Analytique & Graphiques</span>
            </h2>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl">
              Suivi graphique précis du rythme des inscriptions quotidiennes des clients et de l'évolution mensuelle des encaissements Wave Business Béni Amar (35 000 FCFA/mois).
            </p>
          </div>

          {/* Quick Metrics Badges */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="bg-slate-800/80 border border-slate-700/80 px-3.5 py-2 rounded-2xl">
              <span className="text-[10px] text-slate-400 block font-semibold">Taux de Conversion</span>
              <span className="text-base font-black text-emerald-400 font-mono">{conversionRate}%</span>
            </div>
            <div className="bg-slate-800/80 border border-slate-700/80 px-3.5 py-2 rounded-2xl">
              <span className="text-[10px] text-slate-400 block font-semibold">Volume Total Validé</span>
              <span className="text-base font-black text-cyan-300 font-mono">
                {FORMAT_FCFA(totalValidatedAllMonthsFCFA)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. GRAPHIQUE DES INSCRIPTIONS QUOTIDIENNES (Recharts AreaChart / BarChart) */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-cyan-100 text-cyan-700 flex items-center justify-center font-bold">
                <Users className="w-4 h-4" />
              </div>
              <h3 className="font-black text-slate-900 text-base">
                Nombre d'Inscriptions Quotidiennes
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Nombre de nouveaux utilisateurs ayant créé un compte chaque jour depuis leur téléphone mobile ou ordinateur.
            </p>
          </div>

          {/* Timeframe Selector */}
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-2xl self-start sm:self-auto">
            <button
              onClick={() => setDailyTimeframe(7)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                dailyTimeframe === 7
                  ? 'bg-white text-cyan-700 shadow-xs font-black'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              7 jours
            </button>
            <button
              onClick={() => setDailyTimeframe(14)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                dailyTimeframe === 14
                  ? 'bg-white text-cyan-700 shadow-xs font-black'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              14 jours
            </button>
            <button
              onClick={() => setDailyTimeframe(30)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                dailyTimeframe === 30
                  ? 'bg-white text-cyan-700 shadow-xs font-black'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              30 jours
            </button>
          </div>
        </div>

        {/* Daily Stats Summary Row */}
        <div className="grid grid-cols-3 gap-3">
          <div className="p-3.5 rounded-2xl bg-cyan-50/60 border border-cyan-100">
            <span className="text-[11px] text-cyan-700 font-semibold block">Inscriptions sur la période</span>
            <span className="text-2xl font-black text-cyan-950 font-mono mt-0.5 block">
              {totalInscriptionsPeriod}
            </span>
            <span className="text-[10px] text-cyan-600">Sur les {dailyTimeframe} derniers jours</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-indigo-50/60 border border-indigo-100">
            <span className="text-[11px] text-indigo-700 font-semibold block">Moyenne quotidienne</span>
            <span className="text-2xl font-black text-indigo-950 font-mono mt-0.5 block">
              {avgInscriptionsPerDay}
            </span>
            <span className="text-[10px] text-indigo-600">Comptes créés / jour</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-amber-50/60 border border-amber-100">
            <span className="text-[11px] text-amber-700 font-semibold block">Jour Record</span>
            <span className="text-2xl font-black text-amber-950 font-mono mt-0.5 block">
              {maxInscriptionsDay?.inscriptions || 0}
            </span>
            <span className="text-[10px] text-amber-700 truncate block">
              {maxInscriptionsDay?.label || '-'}
            </span>
          </div>
        </div>

        {/* Chart Canvas */}
        <div className="h-72 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={dailyRegistrationData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="cyanGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={CHART_COLORS.cyan} stopOpacity={0.4} />
                  <stop offset="95%" stopColor={CHART_COLORS.cyan} stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="amberGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={CHART_COLORS.amber} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={CHART_COLORS.amber} stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis
                dataKey="label"
                stroke="#94a3b8"
                fontSize={11}
                tickLine={false}
                axisLine={{ stroke: '#e2e8f0' }}
              />
              <YAxis
                stroke="#94a3b8"
                fontSize={11}
                allowDecimals={false}
                tickLine={false}
                axisLine={{ stroke: '#e2e8f0' }}
              />
              <Tooltip content={<CustomDailyTooltip />} />
              <Area
                type="monotone"
                dataKey="inscriptions"
                name="Nouvelles Inscriptions"
                stroke={CHART_COLORS.cyan}
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#cyanGradient)"
                activeDot={{ r: 6, fill: '#0891b2', stroke: '#ffffff', strokeWidth: 2 }}
              />
              <Area
                type="monotone"
                dataKey="essais7j"
                name="Essais Gratuits 7j"
                stroke={CHART_COLORS.amber}
                strokeWidth={2}
                strokeDasharray="4 4"
                fillOpacity={1}
                fill="url(#amberGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-100">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 font-medium text-slate-700">
              <span className="w-3 h-3 rounded-full bg-cyan-500" />
              Courbe d'inscriptions
            </span>
            <span className="flex items-center gap-1.5 font-medium text-slate-700">
              <span className="w-3 h-3 rounded-full bg-amber-500" />
              Souscriptions Essai Gratuit 7j
            </span>
          </div>
          <span className="text-slate-400 italic">Mise à jour automatique à chaque inscription mobile</span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. GRAPHIQUE DU VOLUME DE PAIEMENTS VALIDÉS PAR MOIS (Recharts BarChart) */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                <CreditCard className="w-4 h-4" />
              </div>
              <h3 className="font-black text-slate-900 text-base">
                Volume de Paiements Validés par Mois
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Encaissements mensuels officiels sur le compte Wave Business Béni Amar (Abonnements 35 000 FCFA validés).
            </p>
          </div>

          {/* Metric mode toggle */}
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-2xl self-start sm:self-auto">
            <button
              onClick={() => setMonthlyMetricMode('amount')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                monthlyMetricMode === 'amount'
                  ? 'bg-emerald-600 text-white shadow-xs font-black'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Montant en FCFA
            </button>
            <button
              onClick={() => setMonthlyMetricMode('count')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                monthlyMetricMode === 'count'
                  ? 'bg-emerald-600 text-white shadow-xs font-black'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Nombre d'abonnés
            </button>
          </div>
        </div>

        {/* Monthly Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-100">
            <span className="text-[11px] text-emerald-800 font-semibold block">Volume Total Encaissé</span>
            <span className="text-2xl font-black text-emerald-950 font-mono mt-0.5 block">
              {FORMAT_FCFA(totalValidatedAllMonthsFCFA)}
            </span>
            <span className="text-[10px] text-emerald-700 font-medium">Reçus Wave vérifiés et confirmés</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-purple-50/70 border border-purple-100">
            <span className="text-[11px] text-purple-800 font-semibold block">Abonnements 30j Validés</span>
            <span className="text-2xl font-black text-purple-950 font-mono mt-0.5 block">
              {totalValidatedTransactionsCount}
            </span>
            <span className="text-[10px] text-purple-700 font-medium">Transactions payantes actives</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
            <span className="text-[11px] text-slate-600 font-semibold block">Tarif Unitaire Mensuel</span>
            <span className="text-2xl font-black text-slate-900 font-mono mt-0.5 block">
              35 000 FCFA
            </span>
            <span className="text-[10px] text-slate-500 font-medium">Compte : Wave Béni Amar</span>
          </div>
        </div>

        {/* Bar Chart Container */}
        <div className="h-72 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthlyPaymentsData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis
                dataKey="label"
                stroke="#94a3b8"
                fontSize={11}
                tickLine={false}
                axisLine={{ stroke: '#e2e8f0' }}
              />
              <YAxis
                stroke="#94a3b8"
                fontSize={11}
                tickLine={false}
                axisLine={{ stroke: '#e2e8f0' }}
                tickFormatter={(value) =>
                  monthlyMetricMode === 'amount'
                    ? value >= 1000 ? `${(value / 1000).toFixed(0)}k` : `${value}`
                    : `${value}`
                }
              />
              <Tooltip content={<CustomMonthlyTooltip />} />
              <Bar
                dataKey={monthlyMetricMode === 'amount' ? 'volumeFCFA' : 'transactionsCount'}
                name={monthlyMetricMode === 'amount' ? 'Volume Validé (FCFA)' : 'Transactions Validées'}
                fill={CHART_COLORS.emerald}
                radius={[8, 8, 0, 0]}
                maxBarSize={48}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-emerald-50/60 border border-emerald-200/80 rounded-2xl p-3 flex items-start gap-2.5 text-xs text-emerald-900">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <strong>Règle d'intégrité financière appliquée :</strong> Seuls les paiements avec reçu Wave validé par l'administratrice sont comptabilisés dans le volume mensuel. Tout paiement en attente ou non confirmé affiche strictement 0 FCFA tant que le bouton « Valider Paiement » n'a pas été actionné.
          </p>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. RÉPARTITION DES FORMULES & STATUTS (Recharts PieChart / Donut) */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Pie Chart Card */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
              <PieIcon className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-black text-slate-900 text-sm">
                Répartition des Formules & Statuts
              </h3>
              <p className="text-[11px] text-slate-500">
                Part des abonnements payants, essais gratuits 7 jours et paiements en cours.
              </p>
            </div>
          </div>

          <div className="h-64 w-full flex items-center justify-center">
            {subscriptionBreakdownData.length === 0 ? (
              <p className="text-xs text-slate-400 italic">Aucune donnée disponible</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={subscriptionBreakdownData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {subscriptionBreakdownData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: any, name: any) => [`${value} compte(s)`, name]}
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderRadius: '12px',
                      color: '#fff',
                      fontSize: '12px',
                      border: '1px solid #334155'
                    }}
                  />
                  <Legend
                    verticalAlign="bottom"
                    iconType="circle"
                    wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Strategic Funnel & Summary */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-black text-slate-900 text-sm">
                  Entonnoir de Conversion Commercial
                </h3>
                <p className="text-[11px] text-slate-500">
                  Progression du prospect de l'inscription à l'abonnement 35 000 FCFA.
                </p>
              </div>
            </div>

            <div className="mt-4 space-y-3">
              {/* Step 1 */}
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-lg bg-cyan-100 text-cyan-800 text-xs font-black flex items-center justify-center">
                    1
                  </span>
                  <div>
                    <span className="text-xs font-bold text-slate-900 block">Comptes Inscrits</span>
                    <span className="text-[10px] text-slate-500">Téléphones mobiles & ordinateurs</span>
                  </div>
                </div>
                <span className="font-mono font-black text-slate-900 text-base">{registeredUsers.length}</span>
              </div>

              {/* Step 2 */}
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-lg bg-amber-100 text-amber-800 text-xs font-black flex items-center justify-center">
                    2
                  </span>
                  <div>
                    <span className="text-xs font-bold text-slate-900 block">Essais Gratuits (7 jours)</span>
                    <span className="text-[10px] text-slate-500">Période de test sans carte</span>
                  </div>
                </div>
                <span className="font-mono font-black text-amber-700 text-base">
                  {subscriptions.filter(s => s.status === 'trial' || s.isTrial).length}
                </span>
              </div>

              {/* Step 3 */}
              <div className="p-3 rounded-2xl bg-emerald-50/70 border border-emerald-200 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-lg bg-emerald-500 text-white text-xs font-black flex items-center justify-center">
                    3
                  </span>
                  <div>
                    <span className="text-xs font-black text-emerald-950 block">Abonnés Payants 30j</span>
                    <span className="text-[10px] text-emerald-700">Paiement Wave 35 000 FCFA validé</span>
                  </div>
                </div>
                <span className="font-mono font-black text-emerald-800 text-base">
                  {subscriptions.filter(s => s.status === 'active' && !s.isTrial).length}
                </span>
              </div>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-900 text-white text-xs flex items-center justify-between">
            <span className="text-slate-300">Taux global de concrétisation :</span>
            <span className="text-emerald-400 font-mono font-black text-sm">{conversionRate}%</span>
          </div>
        </div>

      </div>

    </div>
  );
};
