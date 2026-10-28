import React, { useState, useEffect } from 'react';
import { X, Sparkles, AlertCircle, CheckCircle, User, Mail, Calendar, Activity } from 'lucide-react';

const EMAIL_REGEX = /^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$/;

export default function PatientModal({
  isOpen,
  onClose,
  onSubmit,
  patient = null, // If present, edit mode; else add mode
  isSubmitting = false,
}) {
  const isEditMode = Boolean(patient);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    date_of_birth: '',
    glucose: '',
    haemoglobin: '',
    cholesterol: '',
    ai_remarks: '',
  });

  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  // Populate data when editing
  useEffect(() => {
    if (patient) {
      setFormData({
        name: patient.name || '',
        email: patient.email || '',
        date_of_birth: patient.date_of_birth || '',
        glucose: patient.glucose !== undefined ? String(patient.glucose) : '',
        haemoglobin: patient.haemoglobin !== undefined ? String(patient.haemoglobin) : '',
        cholesterol: patient.cholesterol !== undefined ? String(patient.cholesterol) : '',
        ai_remarks: patient.ai_remarks || '',
      });
    } else {
      setFormData({
        name: '',
        email: '',
        date_of_birth: '',
        glucose: '',
        haemoglobin: '',
        cholesterol: '',
        ai_remarks: '',
      });
    }
    setErrors({});
    setTouched({});
  }, [patient, isOpen]);

  if (!isOpen) return null;

  // Validation function
  const validate = (data) => {
    const errs = {};
    const todayStr = new Date().toISOString().split('T')[0];

    // Name
    if (!data.name.trim()) {
      errs.name = 'Patient name is required.';
    } else if (data.name.trim().length < 2) {
      errs.name = 'Patient name must be at least 2 characters.';
    } else if (!/[a-zA-Z]/.test(data.name)) {
      errs.name = 'Patient name must contain alphabetical characters.';
    }

    // Email
    if (!data.email.trim()) {
      errs.email = 'Email address is required.';
    } else if (!EMAIL_REGEX.test(data.email.trim())) {
      errs.email = 'Please provide a valid email address (e.g. user@domain.com).';
    }

    // Date of Birth
    if (!data.date_of_birth) {
      errs.date_of_birth = 'Date of birth is required.';
    } else if (data.date_of_birth > todayStr) {
      errs.date_of_birth = 'Date of birth cannot be in the future.';
    } else if (data.date_of_birth < '1900-01-01') {
      errs.date_of_birth = 'Date of birth must be after 1900.';
    }

    // Glucose
    const g = parseFloat(data.glucose);
    if (!data.glucose || isNaN(g)) {
      errs.glucose = 'Glucose value is required.';
    } else if (g <= 0) {
      errs.glucose = 'Glucose must be a positive number (> 0 mg/dL).';
    } else if (g > 1000) {
      errs.glucose = 'Glucose cannot exceed 1000 mg/dL.';
    }

    // Haemoglobin
    const h = parseFloat(data.haemoglobin);
    if (!data.haemoglobin || isNaN(h)) {
      errs.haemoglobin = 'Haemoglobin value is required.';
    } else if (h <= 0) {
      errs.haemoglobin = 'Haemoglobin must be a positive number (> 0 g/dL).';
    } else if (h > 30) {
      errs.haemoglobin = 'Haemoglobin cannot exceed 30 g/dL.';
    }

    // Cholesterol
    const c = parseFloat(data.cholesterol);
    if (!data.cholesterol || isNaN(c)) {
      errs.cholesterol = 'Cholesterol value is required.';
    } else if (c <= 0) {
      errs.cholesterol = 'Cholesterol must be a positive number (> 0 mg/dL).';
    } else if (c > 1000) {
      errs.cholesterol = 'Cholesterol cannot exceed 1000 mg/dL.';
    }

    return errs;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    const updated = { ...formData, [name]: value };
    setFormData(updated);

    // If field was already touched, re-validate dynamically
    if (touched[name]) {
      const vErrors = validate(updated);
      setErrors(vErrors);
    }
  };

  const handleBlur = (e) => {
    const { name } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
    const vErrors = validate(formData);
    setErrors(vErrors);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const markTouched = {
      name: true,
      email: true,
      date_of_birth: true,
      glucose: true,
      haemoglobin: true,
      cholesterol: true,
    };
    setTouched(markTouched);

    const validationErrors = validate(formData);
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    const payload = {
      name: formData.name.trim(),
      email: formData.email.trim().toLowerCase(),
      date_of_birth: formData.date_of_birth,
      glucose: parseFloat(formData.glucose),
      haemoglobin: parseFloat(formData.haemoglobin),
      cholesterol: parseFloat(formData.cholesterol),
      ai_remarks: formData.ai_remarks?.trim() ? formData.ai_remarks.trim() : null,
    };

    onSubmit(payload);
  };

  const todayDateString = new Date().toISOString().split('T')[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs overflow-y-auto animate-fade-in">
      <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-slate-100 overflow-hidden my-8 transform transition-all">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-teal-50/50 to-white">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center font-bold">
              <User className="h-5 w-5" />
            </div>
            <div>
              <h3 className="heading-font text-lg font-bold text-slate-900">
                {isEditMode ? 'Edit Patient Record' : 'Register New Patient'}
              </h3>
              <p className="text-xs text-slate-500">
                {isEditMode
                  ? 'Update demographic details and blood biomarker metrics.'
                  : 'Enter patient vitals. Groq AI will evaluate clinical status automatically.'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
          {/* Patient Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Patient Full Name <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                id="input-patient-name"
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="e.g. Aarav Sharma"
                className={`w-full px-3.5 py-2 text-sm rounded-lg border bg-slate-50/30 focus:bg-white focus:outline-none focus:ring-2 transition-all ${
                  errors.name && touched.name
                    ? 'border-rose-300 focus:ring-rose-200 focus:border-rose-500 bg-rose-50/20'
                    : 'border-slate-200 focus:ring-teal-100 focus:border-teal-500'
                }`}
              />
            </div>
            {errors.name && touched.name && (
              <p className="mt-1 text-xs text-rose-500 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                <span>{errors.name}</span>
              </p>
            )}
          </div>

          {/* Email & Date of Birth (Grid) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Email */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Email Address <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  id="input-patient-email"
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="e.g. aarav.sharma@example.com"
                  className={`w-full px-3.5 py-2 text-sm rounded-lg border bg-slate-50/30 focus:bg-white focus:outline-none focus:ring-2 transition-all ${
                    errors.email && touched.email
                      ? 'border-rose-300 focus:ring-rose-200 focus:border-rose-500 bg-rose-50/20'
                      : 'border-slate-200 focus:ring-teal-100 focus:border-teal-500'
                  }`}
                />
              </div>
              {errors.email && touched.email && (
                <p className="mt-1 text-xs text-rose-500 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  <span>{errors.email}</span>
                </p>
              )}
            </div>

            {/* Date of Birth */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Date of Birth <span className="text-rose-500">*</span>
              </label>
              <input
                id="input-patient-dob"
                type="date"
                name="date_of_birth"
                max={todayDateString}
                value={formData.date_of_birth}
                onChange={handleChange}
                onBlur={handleBlur}
                className={`w-full px-3.5 py-2 text-sm rounded-lg border bg-slate-50/30 focus:bg-white focus:outline-none focus:ring-2 transition-all ${
                  errors.date_of_birth && touched.date_of_birth
                    ? 'border-rose-300 focus:ring-rose-200 focus:border-rose-500 bg-rose-50/20'
                    : 'border-slate-200 focus:ring-teal-100 focus:border-teal-500'
                }`}
              />
              {errors.date_of_birth && touched.date_of_birth && (
                <p className="mt-1 text-xs text-rose-500 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  <span>{errors.date_of_birth}</span>
                </p>
              )}
            </div>
          </div>

          {/* Section Divider */}
          <div className="pt-2 border-t border-slate-100">
            <h4 className="text-xs font-bold uppercase tracking-wider text-teal-800 flex items-center gap-1.5 mb-3">
              <Activity className="h-3.5 w-3.5" />
              Blood Laboratory Biomarkers
            </h4>
          </div>

          {/* Blood Metrics (3 columns) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Fasting Glucose */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-0.5">
                Glucose (mg/dL) <span className="text-rose-500">*</span>
              </label>
              <span className="text-[10px] text-slate-400 block mb-1">Ref: 70–99 mg/dL</span>
              <input
                id="input-patient-glucose"
                type="number"
                step="0.1"
                min="1"
                max="1000"
                name="glucose"
                value={formData.glucose}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="e.g. 92"
                className={`w-full px-3 py-2 text-sm rounded-lg border bg-slate-50/30 focus:bg-white focus:outline-none focus:ring-2 transition-all ${
                  errors.glucose && touched.glucose
                    ? 'border-rose-300 focus:ring-rose-200 focus:border-rose-500'
                    : 'border-slate-200 focus:ring-teal-100 focus:border-teal-500'
                }`}
              />
              {errors.glucose && touched.glucose && (
                <p className="mt-1 text-[11px] text-rose-500">{errors.glucose}</p>
              )}
            </div>

            {/* Haemoglobin */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-0.5">
                Haemoglobin (g/dL) <span className="text-rose-500">*</span>
              </label>
              <span className="text-[10px] text-slate-400 block mb-1">Ref: 12.0–17.5 g/dL</span>
              <input
                id="input-patient-haemoglobin"
                type="number"
                step="0.1"
                min="0.1"
                max="30"
                name="haemoglobin"
                value={formData.haemoglobin}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="e.g. 14.5"
                className={`w-full px-3 py-2 text-sm rounded-lg border bg-slate-50/30 focus:bg-white focus:outline-none focus:ring-2 transition-all ${
                  errors.haemoglobin && touched.haemoglobin
                    ? 'border-rose-300 focus:ring-rose-200 focus:border-rose-500'
                    : 'border-slate-200 focus:ring-teal-100 focus:border-teal-500'
                }`}
              />
              {errors.haemoglobin && touched.haemoglobin && (
                <p className="mt-1 text-[11px] text-rose-500">{errors.haemoglobin}</p>
              )}
            </div>

            {/* Cholesterol */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-0.5">
                Cholesterol (mg/dL) <span className="text-rose-500">*</span>
              </label>
              <span className="text-[10px] text-slate-400 block mb-1">Ref: &lt;200 mg/dL</span>
              <input
                id="input-patient-cholesterol"
                type="number"
                step="0.1"
                min="1"
                max="1000"
                name="cholesterol"
                value={formData.cholesterol}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="e.g. 175"
                className={`w-full px-3 py-2 text-sm rounded-lg border bg-slate-50/30 focus:bg-white focus:outline-none focus:ring-2 transition-all ${
                  errors.cholesterol && touched.cholesterol
                    ? 'border-rose-300 focus:ring-rose-200 focus:border-rose-500'
                    : 'border-slate-200 focus:ring-teal-100 focus:border-teal-500'
                }`}
              />
              {errors.cholesterol && touched.cholesterol && (
                <p className="mt-1 text-[11px] text-rose-500">{errors.cholesterol}</p>
              )}
            </div>
          </div>

          {/* AI Generation Notice */}
          <div className="p-3 bg-purple-50/70 rounded-xl border border-purple-100 flex items-start gap-2.5 text-xs text-purple-900">
            <Sparkles className="h-4 w-4 text-purple-600 mt-0.5 shrink-0" />
            <div>
              <span className="font-semibold block">Groq AI Automated Evaluation:</span>
              <span>
                Upon saving, Groq's high-speed inference engine will evaluate these blood markers against clinical ranges and synthesize a structured health remark.
              </span>
            </div>
          </div>

          {/* Footer Action Buttons */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              id="btn-submit-patient"
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-5 py-2 text-sm font-semibold rounded-lg text-white bg-teal-600 hover:bg-teal-700 shadow-md shadow-teal-600/20 active:scale-95 transition-all disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Processing & Analyzing...</span>
                </>
              ) : (
                <span>{isEditMode ? 'Update Patient' : 'Save & Generate Remarks'}</span>
              )}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
