import React from 'react';
import { 
  Search, 
  ArrowUpDown, 
  Eye, 
  Edit3, 
  Trash2, 
  Sparkles, 
  FileText, 
  AlertCircle,
  Filter,
  CheckCircle2,
  Calendar,
  Mail
} from 'lucide-react';

export default function PatientTable({
  patients,
  isLoading,
  searchTerm,
  onSearchChange,
  riskFilter,
  onRiskFilterChange,
  sortBy,
  sortOrder,
  onSortChange,
  onViewPatient,
  onEditPatient,
  onDeletePatient,
  onRegenerateRemarks,
  regeneratingId,
}) {
  // Helper to get initials
  const getInitials = (name) => {
    if (!name) return 'PT';
    return name
      .split(' ')
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  // Helper for badge colors
  const getBadgeClass = (level) => {
    switch (level?.toLowerCase()) {
      case 'normal':
      case 'desirable':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'prediabetes':
      case 'borderline':
      case 'moderate risk':
      case 'low':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'high':
      case 'high risk':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
      {/* Controls Bar: Search, Filters, and Sorting */}
      <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            id="input-search-patients"
            type="text"
            placeholder="Search by patient name or email (e.g. Rajesh, Priya, Aarav)..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-colors"
          />
        </div>

        {/* Filters and Sorting */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Risk Level Filter */}
          <div className="flex items-center bg-white rounded-lg border border-slate-200 p-0.5 text-xs font-medium text-slate-600">
            {['All', 'Normal', 'Moderate Risk', 'High Risk'].map((r) => (
              <button
                key={r}
                onClick={() => onRiskFilterChange(r)}
                className={`px-2.5 py-1.5 rounded-md transition-colors ${
                  riskFilter === r
                    ? 'bg-teal-600 text-white font-semibold shadow-xs'
                    : 'hover:bg-slate-100 text-slate-600'
                }`}
              >
                {r === 'All' ? 'All Risks' : r}
              </button>
            ))}
          </div>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-600">
            <ArrowUpDown className="h-3.5 w-3.5 text-slate-400" />
            <select
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [field, order] = e.target.value.split('-');
                onSortChange(field, order);
              }}
              className="bg-transparent border-none text-xs text-slate-700 font-medium focus:outline-none cursor-pointer"
            >
              <option value="created_at-desc">Newest Added</option>
              <option value="name-asc">Name (A-Z)</option>
              <option value="name-desc">Name (Z-A)</option>
              <option value="glucose-desc">Glucose (High to Low)</option>
              <option value="glucose-asc">Glucose (Low to High)</option>
              <option value="cholesterol-desc">Cholesterol (High to Low)</option>
              <option value="haemoglobin-asc">Haemoglobin (Low to High)</option>
              <option value="date_of_birth-asc">Age (Oldest First)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Patients Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-slate-600">
          <thead className="bg-slate-50 text-[11px] uppercase tracking-wider font-semibold text-slate-500 border-b border-slate-200">
            <tr>
              <th className="py-3.5 px-4 sm:px-6">Patient</th>
              <th className="py-3.5 px-3">DOB / Age</th>
              <th className="py-3.5 px-3">Glucose</th>
              <th className="py-3.5 px-3">Haemoglobin</th>
              <th className="py-3.5 px-3">Cholesterol</th>
              <th className="py-3.5 px-3">Overall Risk</th>
              <th className="py-3.5 px-3 hidden lg:table-cell">AI Clinical Remarks</th>
              <th className="py-3.5 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading ? (
              <tr>
                <td colSpan="8" className="py-12 text-center text-slate-500">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <div className="w-8 h-8 border-3 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-sm">Loading health records...</p>
                  </div>
                </td>
              </tr>
            ) : patients.length === 0 ? (
              <tr>
                <td colSpan="8" className="py-12 text-center text-slate-500">
                  <div className="flex flex-col items-center justify-center gap-2 max-w-sm mx-auto">
                    <AlertCircle className="h-10 w-10 text-slate-300" />
                    <h4 className="font-semibold text-slate-700">No patient records found</h4>
                    <p className="text-xs text-slate-500">
                      {searchTerm || riskFilter !== 'All'
                        ? 'Try clearing your search query or changing the risk filter.'
                        : 'Your database is currently empty. Click "Reset Assessment Data" to seed the 10 test records.'}
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              patients.map((patient) => {
                const isRegenerating = regeneratingId === patient.id;

                return (
                  <tr 
                    key={patient.id} 
                    className="hover:bg-slate-50/80 transition-colors group"
                  >
                    {/* Patient Name & Avatar */}
                    <td className="py-3.5 px-4 sm:px-6">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-teal-500 to-emerald-400 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                          {getInitials(patient.name)}
                        </div>
                        <div>
                          <button
                            onClick={() => onViewPatient(patient)}
                            className="font-semibold text-slate-900 hover:text-teal-600 transition-colors text-left"
                          >
                            {patient.name}
                          </button>
                          <div className="flex items-center gap-1 text-xs text-slate-400">
                            <Mail className="h-3 w-3" />
                            <span>{patient.email}</span>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* DOB / Age */}
                    <td className="py-3.5 px-3">
                      <div className="text-slate-800 font-medium">{patient.age} yrs</div>
                      <div className="text-[11px] text-slate-400 flex items-center gap-1">
                        <Calendar className="h-2.5 w-2.5" />
                        <span>{patient.date_of_birth}</span>
                      </div>
                    </td>

                    {/* Fasting Glucose */}
                    <td className="py-3.5 px-3">
                      <div className="flex flex-col items-start gap-0.5">
                        <span className="font-semibold text-slate-900">
                          {patient.glucose} <span className="text-[10px] text-slate-400 font-normal">mg/dL</span>
                        </span>
                        <span className={`inline-flex px-1.5 py-0.5 rounded text-[10px] font-medium border ${getBadgeClass(patient.glucose_info?.level)}`}>
                          {patient.glucose_info?.level || 'Normal'}
                        </span>
                      </div>
                    </td>

                    {/* Haemoglobin */}
                    <td className="py-3.5 px-3">
                      <div className="flex flex-col items-start gap-0.5">
                        <span className="font-semibold text-slate-900">
                          {patient.haemoglobin} <span className="text-[10px] text-slate-400 font-normal">g/dL</span>
                        </span>
                        <span className={`inline-flex px-1.5 py-0.5 rounded text-[10px] font-medium border ${getBadgeClass(patient.haemoglobin_info?.level)}`}>
                          {patient.haemoglobin_info?.level || 'Normal'}
                        </span>
                      </div>
                    </td>

                    {/* Cholesterol */}
                    <td className="py-3.5 px-3">
                      <div className="flex flex-col items-start gap-0.5">
                        <span className="font-semibold text-slate-900">
                          {patient.cholesterol} <span className="text-[10px] text-slate-400 font-normal">mg/dL</span>
                        </span>
                        <span className={`inline-flex px-1.5 py-0.5 rounded text-[10px] font-medium border ${getBadgeClass(patient.cholesterol_info?.level)}`}>
                          {patient.cholesterol_info?.level || 'Desirable'}
                        </span>
                      </div>
                    </td>

                    {/* Overall Risk */}
                    <td className="py-3.5 px-3">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${getBadgeClass(patient.overall_risk?.status)}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${
                          patient.overall_risk?.status === 'High Risk'
                            ? 'bg-rose-500 animate-pulse'
                            : patient.overall_risk?.status === 'Moderate Risk'
                            ? 'bg-amber-500'
                            : 'bg-emerald-500'
                        }`} />
                        {patient.overall_risk?.status || 'Normal'}
                      </span>
                    </td>

                    {/* AI Remarks Preview */}
                    <td className="py-3.5 px-3 hidden lg:table-cell max-w-xs">
                      <div className="group/ai relative">
                        <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                          {patient.ai_remarks ? (
                            patient.ai_remarks.replace(/[#*_]/g, '')
                          ) : (
                            <span className="italic text-slate-400">No remarks generated yet.</span>
                          )}
                        </p>
                        <button
                          onClick={() => onViewPatient(patient)}
                          className="text-[11px] font-medium text-teal-600 hover:text-teal-700 hover:underline mt-0.5 block"
                        >
                          View Full AI Clinical Report →
                        </button>
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {/* View Report */}
                        <button
                          onClick={() => onViewPatient(patient)}
                          title="View Complete Report & Biomarker Breakdown"
                          className="p-1.5 text-slate-500 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors"
                        >
                          <Eye className="h-4 w-4" />
                        </button>

                        {/* Regenerate AI Remarks */}
                        <button
                          onClick={() => onRegenerateRemarks(patient.id)}
                          disabled={isRegenerating}
                          title="Regenerate Groq AI Remarks"
                          className="p-1.5 text-slate-500 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors disabled:opacity-40"
                        >
                          <Sparkles className={`h-4 w-4 ${isRegenerating ? 'animate-spin text-purple-600' : ''}`} />
                        </button>

                        {/* Edit Record */}
                        <button
                          onClick={() => onEditPatient(patient)}
                          title="Edit Patient Details"
                          className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <Edit3 className="h-4 w-4" />
                        </button>

                        {/* Delete Record */}
                        <button
                          onClick={() => onDeletePatient(patient)}
                          title="Delete Patient Record"
                          className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Footer info */}
      <div className="p-3 bg-slate-50 text-xs text-slate-500 border-t border-slate-200 flex items-center justify-between">
        <span>Showing {patients.length} patient record(s)</span>
        <span className="hidden sm:inline">Reference Ranges: Fasting Glucose (70–99), Haemoglobin (12–17.5), Cholesterol (&lt;200)</span>
      </div>
    </div>
  );
}
