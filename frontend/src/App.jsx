import React, { useState, useEffect, useCallback } from 'react';
import api from './services/api';
import Navbar from './components/Navbar';
import StatsCards from './components/StatsCards';
import PatientTable from './components/PatientTable';
import PatientModal from './components/PatientModal';
import PatientDetailModal from './components/PatientDetailModal';
import DeleteConfirmationModal from './components/DeleteConfirmationModal';
import Toast from './components/Toast';

export default function App() {
  // State
  const [patients, setPatients] = useState([]);
  const [stats, setStats] = useState(null);
  const [systemHealth, setSystemHealth] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Filters & Sorting
  const [searchTerm, setSearchTerm] = useState('');
  const [riskFilter, setRiskFilter] = useState('All');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');

  // Modals state
  const [isPatientModalOpen, setIsPatientModalOpen] = useState(false);
  const [editingPatient, setEditingPatient] = useState(null);
  const [isSubmittingPatient, setIsSubmittingPatient] = useState(false);

  const [viewingPatient, setViewingPatient] = useState(null);
  const [deletingPatient, setDeletingPatient] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [regeneratingId, setRegeneratingId] = useState(null);
  const [isSeeding, setIsSeeding] = useState(false);

  // Toast Notification
  const [toast, setToast] = useState({ message: '', type: 'success' });

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
  };

  // Fetch Patients List
  const fetchPatients = useCallback(async () => {
    try {
      setIsLoading(true);
      const params = {
        search: searchTerm || undefined,
        risk: riskFilter !== 'All' ? riskFilter : undefined,
        sort_by: sortBy,
        sort_order: sortOrder,
      };
      const res = await api.getPatients(params);
      setPatients(res.data);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setIsLoading(false);
    }
  }, [searchTerm, riskFilter, sortBy, sortOrder]);

  // Fetch Dashboard Stats & Health
  const fetchStatsAndHealth = useCallback(async () => {
    try {
      const [statsRes, healthRes] = await Promise.allSettled([
        api.getStats(),
        api.getHealth(),
      ]);

      if (statsRes.status === 'fulfilled') {
        setStats(statsRes.value.data);
      }
      if (healthRes.status === 'fulfilled') {
        setSystemHealth(healthRes.value.data);
      }
    } catch (err) {
      console.error('Error fetching stats/health:', err);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchStatsAndHealth();
  }, [fetchStatsAndHealth]);

  // Refetch patients on filter/sort changes
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchPatients();
    }, 200);
    return () => clearTimeout(timer);
  }, [fetchPatients]);

  // Handle Add / Edit Submit
  const handleSavePatient = async (payload) => {
    setIsSubmittingPatient(true);
    try {
      if (editingPatient) {
        const res = await api.updatePatient(editingPatient.id, payload);
        showToast(`Patient '${res.data.name}' updated successfully!`, 'success');
      } else {
        const res = await api.createPatient(payload);
        showToast(`Patient '${res.data.name}' registered & analyzed by AI!`, 'success');
      }
      setIsPatientModalOpen(false);
      setEditingPatient(null);
      fetchPatients();
      fetchStatsAndHealth();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setIsSubmittingPatient(false);
    }
  };

  // Handle Delete Confirm
  const handleConfirmDelete = async () => {
    if (!deletingPatient) return;
    setIsDeleting(true);
    try {
      await api.deletePatient(deletingPatient.id);
      showToast(`Record for '${deletingPatient.name}' deleted.`, 'success');
      setDeletingPatient(null);
      fetchPatients();
      fetchStatsAndHealth();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  // Handle Regenerate AI Remarks
  const handleRegenerateRemarks = async (patientId) => {
    setRegeneratingId(patientId);
    try {
      const res = await api.regenerateRemarks(patientId);
      showToast(`Groq AI remarks updated for '${res.data.name}'!`, 'success');
      // If modal open, update modal data
      if (viewingPatient && viewingPatient.id === patientId) {
        setViewingPatient(res.data);
      }
      fetchPatients();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setRegeneratingId(null);
    }
  };

  // Handle Seed Assessment Data
  const handleSeedData = async () => {
    setIsSeeding(true);
    try {
      const res = await api.seedPatients(true);
      showToast(res.data.message || 'Seeded 10 assessment patient records!', 'success');
      fetchPatients();
      fetchStatsAndHealth();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setIsSeeding(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      
      {/* Navigation Header */}
      <Navbar
        systemHealth={systemHealth}
        onAddPatient={() => {
          setEditingPatient(null);
          setIsPatientModalOpen(true);
        }}
        onSeedData={handleSeedData}
        isSeeding={isSeeding}
      />

      {/* Main Dashboard Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        
        {/* Cohort Stats & Biomarker Averages */}
        <StatsCards
          stats={stats}
          currentRiskFilter={riskFilter}
          onSelectRiskFilter={(risk) => setRiskFilter(risk)}
        />

        {/* Patients Table & Management Panel */}
        <PatientTable
          patients={patients}
          isLoading={isLoading}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          riskFilter={riskFilter}
          onRiskFilterChange={setRiskFilter}
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSortChange={(field, order) => {
            setSortBy(field);
            setSortOrder(order);
          }}
          onViewPatient={(patient) => setViewingPatient(patient)}
          onEditPatient={(patient) => {
            setEditingPatient(patient);
            setIsPatientModalOpen(true);
          }}
          onDeletePatient={(patient) => setDeletingPatient(patient)}
          onRegenerateRemarks={handleRegenerateRemarks}
          regeneratingId={regeneratingId}
        />

      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-200 bg-white py-4 text-center text-xs text-slate-500">
        <p>
          Health Records Management System &bull; Built with FastAPI, React, MongoDB, & Groq Python SDK &bull; AI Skills Assessment
        </p>
      </footer>

      {/* Add / Edit Patient Modal */}
      <PatientModal
        isOpen={isPatientModalOpen}
        onClose={() => {
          setIsPatientModalOpen(false);
          setEditingPatient(null);
        }}
        onSubmit={handleSavePatient}
        patient={editingPatient}
        isSubmitting={isSubmittingPatient}
      />

      {/* Detailed Clinical Scorecard & Remarks Modal */}
      <PatientDetailModal
        isOpen={Boolean(viewingPatient)}
        onClose={() => setViewingPatient(null)}
        patient={viewingPatient}
        onRegenerateRemarks={handleRegenerateRemarks}
        isRegenerating={regeneratingId === viewingPatient?.id}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={Boolean(deletingPatient)}
        onClose={() => setDeletingPatient(null)}
        onConfirm={handleConfirmDelete}
        patientName={deletingPatient?.name}
        isDeleting={isDeleting}
      />

      {/* Toast Alert */}
      <Toast
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ message: '', type: 'success' })}
      />

    </div>
  );
}
