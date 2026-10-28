import React from 'react';
import { Users, HeartPulse, AlertTriangle, AlertCircle, Droplets, ShieldCheck, Flame } from 'lucide-react';

export default function StatsCards({ stats, onSelectRiskFilter, currentRiskFilter }) {
  if (!stats) return null;

  const cards = [
    {
      id: 'All',
      title: 'Total Patients',
      value: stats.total_patients,
      subtext: 'Active medical records',
      icon: Users,
      color: 'slate',
      bgGradient: 'from-slate-50 to-slate-100/60',
      border: 'border-slate-200',
      textAccent: 'text-slate-900',
      iconBg: 'bg-slate-200/70 text-slate-700',
    },
    {
      id: 'Normal',
      title: 'Optimal Vitals',
      value: stats.normal_count,
      subtext: 'All biomarkers in range',
      icon: ShieldCheck,
      color: 'emerald',
      bgGradient: 'from-emerald-50 to-emerald-100/40',
      border: 'border-emerald-200',
      textAccent: 'text-emerald-700',
      iconBg: 'bg-emerald-100 text-emerald-700',
    },
    {
      id: 'Moderate Risk',
      title: 'Moderate Risk',
      value: stats.moderate_count,
      subtext: 'Borderline biomarkers',
      icon: AlertTriangle,
      color: 'amber',
      bgGradient: 'from-amber-50 to-amber-100/40',
      border: 'border-amber-200',
      textAccent: 'text-amber-700',
      iconBg: 'bg-amber-100 text-amber-700',
    },
    {
      id: 'High Risk',
      title: 'Priority Attention',
      value: stats.high_risk_count,
      subtext: 'Elevated or abnormal vitals',
      icon: AlertCircle,
      color: 'rose',
      bgGradient: 'from-rose-50 to-rose-100/40',
      border: 'border-rose-200',
      textAccent: 'text-rose-700',
      iconBg: 'bg-rose-100 text-rose-700',
    },
  ];

  return (
    <div className="space-y-4">
      {/* Risk Category Quick Filter Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {cards.map((card) => {
          const Icon = card.icon;
          const isSelected = currentRiskFilter === card.id;

          return (
            <button
              key={card.id}
              onClick={() => onSelectRiskFilter(card.id)}
              className={`p-4 rounded-xl border text-left transition-all duration-200 bg-gradient-to-br ${card.bgGradient} ${
                isSelected
                  ? `ring-2 ring-teal-500 shadow-md ${card.border} scale-[1.02]`
                  : `${card.border} hover:shadow-sm hover:scale-[1.01]`
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs sm:text-sm font-medium text-slate-600">{card.title}</span>
                <div className={`p-2 rounded-lg ${card.iconBg}`}>
                  <Icon className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${card.textAccent}`}>
                  {card.value}
                </span>
                <span className="text-xs text-slate-500 hidden sm:inline">records</span>
              </div>
              <p className="mt-1 text-xs text-slate-500">{card.subtext}</p>
            </button>
          );
        })}
      </div>

      {/* Population Biomarker Means Banner */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <HeartPulse className="h-4 w-4 text-teal-600" />
            <h3 className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
              Cohort Biomarker Averages
            </h3>
          </div>

          <div className="grid grid-cols-3 gap-4 divide-x divide-slate-100">
            {/* Avg Glucose */}
            <div className="px-2 first:pl-0">
              <span className="text-xs text-slate-500 block">Avg. Glucose</span>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="text-sm sm:text-base font-bold text-slate-800">
                  {stats.avg_glucose}
                </span>
                <span className="text-xs text-slate-400">mg/dL</span>
              </div>
              <span className="text-[10px] text-teal-600 font-medium">Ref: 70–99</span>
            </div>

            {/* Avg Haemoglobin */}
            <div className="px-3">
              <span className="text-xs text-slate-500 block">Avg. Haemoglobin</span>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="text-sm sm:text-base font-bold text-slate-800">
                  {stats.avg_haemoglobin}
                </span>
                <span className="text-xs text-slate-400">g/dL</span>
              </div>
              <span className="text-[10px] text-teal-600 font-medium">Ref: 12.0–17.5</span>
            </div>

            {/* Avg Cholesterol */}
            <div className="px-3">
              <span className="text-xs text-slate-500 block">Avg. Cholesterol</span>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="text-sm sm:text-base font-bold text-slate-800">
                  {stats.avg_cholesterol}
                </span>
                <span className="text-xs text-slate-400">mg/dL</span>
              </div>
              <span className="text-[10px] text-teal-600 font-medium">Ref: &lt;200</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
