import React, { useState } from 'react';
import { 
  X, 
  Sparkles, 
  Copy, 
  Check, 
  Calendar, 
  Mail, 
  HeartPulse, 
  Droplets, 
  Activity,
  AlertTriangle,
  ShieldCheck,
  AlertCircle,
  Clock,
  IdCard
} from 'lucide-react';

export default function PatientDetailModal({
  isOpen,
  onClose,
  patient,
  onRegenerateRemarks,
  isRegenerating = false,
}) {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !patient) return null;

  const handleCopyRemarks = () => {
    if (!patient.ai_remarks) return;
    navigator.clipboard.writeText(patient.ai_remarks);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Helper for biomarker visual bars
  const calculateBarPercentage = (val, min, max) => {
    const clamped = Math.max(min, Math.min(max, val));
    return ((clamped - min) / (max - min)) * 100;
  };

  const getRiskTheme = (status) => {
    switch (status?.toLowerCase()) {
      case 'high risk':
        return {
          bannerBg: 'bg-rose-50 border-rose-200 text-rose-800',
          badgeBg: 'bg-rose-600 text-white',
          icon: AlertCircle,
        };
      case 'moderate risk':
        return {
          bannerBg: 'bg-amber-50 border-amber-200 text-amber-800',
          badgeBg: 'bg-amber-600 text-white',
          icon: AlertTriangle,
        };
      default:
        return {
          bannerBg: 'bg-emerald-50 border-emerald-200 text-emerald-800',
          badgeBg: 'bg-emerald-600 text-white',
          icon: ShieldCheck,
        };
    }
  };

  const riskTheme = getRiskTheme(patient.overall_risk?.status);
  const RiskIcon = riskTheme.icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs overflow-y-auto animate-fade-in">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-100 overflow-hidden my-8 transform transition-all">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-gradient-to-tr from-teal-600 to-emerald-500 text-white flex items-center justify-center font-bold text-lg shadow-sm">
              {patient.name.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="heading-font text-xl font-bold text-slate-900">{patient.name}</h3>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${riskTheme.badgeBg}`}>
                  {patient.overall_risk?.status || 'Normal'}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 mt-1">
                <span className="flex items-center gap-1">
                  <Mail className="h-3 w-3" />
                  {patient.email}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  DOB: {patient.date_of_birth} ({patient.age} yrs)
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          
          {/* Risk Level Banner */}
          <div className={`p-4 rounded-xl border flex items-start gap-3 ${riskTheme.bannerBg}`}>
            <RiskIcon className="h-5 w-5 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-sm">Overall Status: {patient.overall_risk?.status}</h4>
              <p className="text-xs mt-0.5 opacity-90">
                {patient.overall_risk?.status === 'High Risk'
                  ? 'One or more blood test parameters exceed critical clinical reference intervals. Prompt follow-up is recommended.'
                  : patient.overall_risk?.status === 'Moderate Risk'
                  ? 'Borderline biomarker elevations observed. Preventative dietary and physical activity adjustments are suggested.'
                  : 'All evaluated biomarker indicators fall comfortably within physiological healthy reference intervals.'}
              </p>
            </div>
          </div>

          {/* Biomarker Cards with Visual Gauge Indicators */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
              Biomarker Diagnostic Analysis
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              
              {/* Fasting Glucose */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                    <span className="font-semibold text-slate-700">Fasting Glucose</span>
                    <span>70–99 mg/dL</span>
                  </div>
                  <div className="flex items-baseline gap-1 my-1">
                    <span className="text-2xl font-extrabold text-slate-900">{patient.glucose}</span>
                    <span className="text-xs text-slate-500">mg/dL</span>
                  </div>
                  <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold ${
                    patient.glucose_info?.level === 'High' ? 'bg-rose-100 text-rose-800' :
                    patient.glucose_info?.level === 'Prediabetes' ? 'bg-amber-100 text-amber-800' :
                    patient.glucose_info?.level === 'Low' ? 'bg-amber-100 text-amber-800' :
                    'bg-emerald-100 text-emerald-800'
                  }`}>
                    {patient.glucose_info?.level || 'Normal'}
                  </span>
                </div>
                {/* Visual bar */}
                <div className="mt-3">
                  <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-500 ${
                        patient.glucose >= 126 ? 'bg-rose-500' :
                        patient.glucose >= 100 ? 'bg-amber-500' :
                        patient.glucose < 70 ? 'bg-amber-400' :
                        'bg-emerald-500'
                      }`}
                      style={{ width: `${calculateBarPercentage(patient.glucose, 50, 200)}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Haemoglobin */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                    <span className="font-semibold text-slate-700">Haemoglobin</span>
                    <span>12.0–17.5 g/dL</span>
                  </div>
                  <div className="flex items-baseline gap-1 my-1">
                    <span className="text-2xl font-extrabold text-slate-900">{patient.haemoglobin}</span>
                    <span className="text-xs text-slate-500">g/dL</span>
                  </div>
                  <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold ${
                    patient.haemoglobin_info?.level === 'Low' ? 'bg-amber-100 text-amber-800' :
                    patient.haemoglobin_info?.level === 'High' ? 'bg-amber-100 text-amber-800' :
                    'bg-emerald-100 text-emerald-800'
                  }`}>
                    {patient.haemoglobin_info?.level || 'Normal'}
                  </span>
                </div>
                {/* Visual bar */}
                <div className="mt-3">
                  <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-500 ${
                        patient.haemoglobin < 12.0 ? 'bg-amber-500' :
                        patient.haemoglobin > 17.5 ? 'bg-amber-500' :
                        'bg-emerald-500'
                      }`}
                      style={{ width: `${calculateBarPercentage(patient.haemoglobin, 6, 22)}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Total Cholesterol */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                    <span className="font-semibold text-slate-700">Cholesterol</span>
                    <span>&lt;200 mg/dL</span>
                  </div>
                  <div className="flex items-baseline gap-1 my-1">
                    <span className="text-2xl font-extrabold text-slate-900">{patient.cholesterol}</span>
                    <span className="text-xs text-slate-500">mg/dL</span>
                  </div>
                  <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold ${
                    patient.cholesterol_info?.level === 'High' ? 'bg-rose-100 text-rose-800' :
                    patient.cholesterol_info?.level === 'Borderline' ? 'bg-amber-100 text-amber-800' :
                    'bg-emerald-100 text-emerald-800'
                  }`}>
                    {patient.cholesterol_info?.level || 'Desirable'}
                  </span>
                </div>
                {/* Visual bar */}
                <div className="mt-3">
                  <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-500 ${
                        patient.cholesterol >= 240 ? 'bg-rose-500' :
                        patient.cholesterol >= 200 ? 'bg-amber-500' :
                        'bg-emerald-500'
                      }`}
                      style={{ width: `${calculateBarPercentage(patient.cholesterol, 120, 320)}%` }}
                    />
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* Groq AI Clinical Remarks Box */}
          <div className="bg-gradient-to-br from-purple-50/60 to-indigo-50/30 rounded-xl border border-purple-200 p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-purple-100 text-purple-700">
                  <Sparkles className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-purple-950">Groq AI Health Remarks</h4>
                  <p className="text-[11px] text-purple-600">Automated clinical assessment synthesis</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopyRemarks}
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md bg-white border border-purple-200 text-purple-700 hover:bg-purple-50 transition-colors shadow-xs"
                >
                  {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>

                <button
                  onClick={() => onRegenerateRemarks(patient.id)}
                  disabled={isRegenerating}
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md bg-purple-600 text-white hover:bg-purple-700 transition-colors shadow-xs disabled:opacity-50"
                >
                  <Sparkles className={`h-3.5 w-3.5 ${isRegenerating ? 'animate-spin' : ''}`} />
                  <span>{isRegenerating ? 'Analyzing...' : 'Re-analyze'}</span>
                </button>
              </div>
            </div>

            {/* Remarks Content */}
            <div className="bg-white/80 backdrop-blur-xs rounded-lg p-4 border border-purple-100 text-xs text-slate-800 leading-relaxed font-sans whitespace-pre-wrap">
              {patient.ai_remarks || 'No remarks currently generated.'}
            </div>
          </div>

          {/* Record Metadata */}
          <div className="pt-2 text-[11px] text-slate-400 flex flex-wrap items-center justify-between border-t border-slate-100">
            <span>Patient ID: <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-600">{patient.id}</code></span>
            <span>Last Updated: {new Date(patient.updated_at).toLocaleString()}</span>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs sm:text-sm font-semibold rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 transition-colors"
          >
            Close Report
          </button>
        </div>

      </div>
    </div>
  );
}
