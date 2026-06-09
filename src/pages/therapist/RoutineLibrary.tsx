import { useState } from 'react';
import { useStore } from '../../store/useStore';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Plus, BookMarked, Users, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function RoutineLibrary() {
  const navigate = useNavigate();
  const allRoutines = useStore(state => state.routines);
  const patients = useStore(state => state.patients);
  const assignRoutineToPatients = useStore(state => state.assignRoutineToPatients);
  
  // Library routines are those that act as templates (patientId === null)
  const libraryRoutines = allRoutines.filter(r => r.patientId === null);
  
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedRoutineId, setSelectedRoutineId] = useState<string | null>(null);
  const [selectedPatientIds, setSelectedPatientIds] = useState<Set<string>>(new Set());

  const handleOpenAssign = (routineId: string) => {
    setSelectedRoutineId(routineId);
    setSelectedPatientIds(new Set());
    setModalOpen(true);
  };

  const handleTogglePatient = (id: string) => {
    const next = new Set(selectedPatientIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedPatientIds(next);
  };

  const handleConfirmAssign = () => {
    if (selectedRoutineId && selectedPatientIds.size > 0) {
      assignRoutineToPatients(selectedRoutineId, Array.from(selectedPatientIds));
      setModalOpen(false);
      alert('Routine successfully assigned to selected patients!');
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <header className="flex justify-between items-end mb-6">
        <div>
          <h1 className="text-3xl font-display font-bold text-on-surface mb-2">Routine Library</h1>
          <p className="text-on-surface-variant font-body">Manage your saved templates and assign them to patients.</p>
        </div>
        <Button onClick={() => navigate('/therapist/routines/builder')} className="flex items-center gap-2">
          <Plus size={20} /> Build New Routine
        </Button>
      </header>

      {libraryRoutines.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-20 bg-surface-container-lowest rounded-2xl border-ghost">
          <BookMarked size={64} className="text-outline-variant mb-4" />
          <p className="text-xl font-display font-bold text-on-surface">Your library is empty</p>
          <p className="text-on-surface-variant mt-2 mb-6 text-center max-w-sm">
             You haven't built any general routines yet. Build one to save it as a template here.
          </p>
          <Button onClick={() => navigate('/therapist/routines/builder')} variant="secondary">
             Start Building
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {libraryRoutines.map(routine => (
            <Card key={routine.id} level={2} className="flex flex-col justify-between hover:shadow-ambient transition-shadow border-ghost">
              <div className="mb-6">
                 <span className="text-xs font-bold text-primary tracking-wider uppercase mb-2 block">{routine.type}</span>
                 <h2 className="text-xl font-display font-bold text-on-surface mb-2">{routine.title}</h2>
                 <p className="text-sm text-on-surface-variant mb-4">
                    Composed of {routine.activities.length} activities.
                 </p>
              </div>
              <Button fullWidth onClick={() => handleOpenAssign(routine.id)} className="flex items-center justify-center gap-2">
                 <Users size={18} /> Assign to Patient
              </Button>
            </Card>
          ))}
        </div>
      )}

      {/* Assignment Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Assign Routine">
        <p className="text-sm text-on-surface-variant mb-4">
          Select the patients who should receive this routine plan:
        </p>
        
        <div className="space-y-2 mb-6">
           {patients.map(patient => (
             <label 
               key={patient.id} 
               onClick={(e) => { e.preventDefault(); handleTogglePatient(patient.id); }}
               className="flex items-center gap-4 p-4 rounded-xl border border-ghost hover:bg-surface-container cursor-pointer transition-colors group"
             >
                <div className={`w-6 h-6 rounded border-2 flex items-center justify-center transition-colors ${selectedPatientIds.has(patient.id) ? 'bg-primary border-primary text-white' : 'border-outline-variant group-hover:border-primary'}`}>
                   {selectedPatientIds.has(patient.id) && <Check size={16} strokeWidth={3} />}
                </div>
                <img src={patient.avatarUrl} alt={patient.name} className="w-10 h-10 rounded-full" />
                <div className="flex-1">
                   <p className="font-bold text-on-surface">{patient.name}</p>
                   <p className="text-xs text-on-surface-variant font-body">{patient.condition}</p>
                </div>
             </label>
           ))}
        </div>

        <div className="flex gap-4 justify-end">
           <Button variant="tertiary" onClick={() => setModalOpen(false)}>Cancel</Button>
           <Button 
             onClick={handleConfirmAssign} 
             disabled={selectedPatientIds.size === 0}
           >
             Assign to {selectedPatientIds.size} Patient{selectedPatientIds.size !== 1 ? 's' : ''}
           </Button>
        </div>
      </Modal>
    </div>
  );
}
