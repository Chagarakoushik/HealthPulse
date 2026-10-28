import React from 'react';
import { Activity, Plus, RefreshCw, Sparkles, Database, Server } from 'lucide-react';

export default function Navbar({
  systemHealth,
  onAddPatient,
  onSeedData,
  isSeeding,
}) {
  const isGroqActive = systemHealth?.ai_engine?.configured;
  const dbEngine = systemHealth?.database?.engine === 'mongodb' ? 'MongoDB' : 'Persistent Store';
  const isDbOnline = systemHealth?.database?.status === 'online';

  return (
    <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl bg-gradient-to-tr from-teal-600 to-cyan-500 flex items-center justify-center text-white shadow-md shadow-teal-500/20">
              <Activity className="h-6 w-6 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="heading-font text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
                  HealthPulse <span className="text-teal-600">EHR</span>
                </h1>
                <span className="hidden sm:inline-block px-2 py-0.5 text-xs font-semibold rounded-full bg-teal-50 text-teal-700 border border-teal-200">
                  AI Assessment
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden sm:block">
                Health Records Management with Groq AI Clinical Insights
              </p>
            </div>
          </div>

          {/* System Status Indicators */}
          <div className="hidden lg:flex items-center gap-2 text-xs">
            {/* API Status */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
              <Server className="h-3.5 w-3.5 text-emerald-600" />
              <span>FastAPI</span>
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            </div>

            {/* Database Status */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200" title={systemHealth?.database?.message}>
              <Database className="h-3.5 w-3.5 text-blue-600" />
              <span>{dbEngine}</span>
              <span className={`h-1.5 w-1.5 rounded-full ${isDbOnline ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
            </div>

            {/* Groq AI Status */}
            <div 
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border ${
                isGroqActive 
                  ? 'bg-purple-50 text-purple-700 border-purple-200' 
                  : 'bg-amber-50 text-amber-700 border-amber-200'
              }`}
              title={isGroqActive ? 'Groq Llama-3 AI active' : 'Groq API Key not set - using clinical rule fallback'}
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>Groq AI: {isGroqActive ? 'Active' : 'Rule Engine'}</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              id="btn-seed-data"
              onClick={onSeedData}
              disabled={isSeeding}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-medium rounded-lg text-slate-700 bg-slate-100 hover:bg-slate-200 active:scale-95 transition-all border border-slate-200 disabled:opacity-50"
              title="Reset records to the official 10 assessment test records"
            >
              <RefreshCw className={`h-4 w-4 ${isSeeding ? 'animate-spin text-teal-600' : 'text-slate-500'}`} />
              <span className="hidden md:inline">Reset Assessment Data</span>
              <span className="md:hidden">Reset</span>
            </button>

            <button
              id="btn-add-patient"
              onClick={onAddPatient}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-lg text-white bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-700 hover:to-teal-600 shadow-sm shadow-teal-600/30 active:scale-95 transition-all"
            >
              <Plus className="h-4 w-4 stroke-[3]" />
              <span>Add Patient</span>
            </button>
          </div>

        </div>
      </div>
    </header>
  );
}
