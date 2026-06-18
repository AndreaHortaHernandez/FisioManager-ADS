import { useEffect, useState } from 'react';
import { Plus, User, Mail, Phone, ToggleLeft, ToggleRight } from 'lucide-react';
import { adminApi } from '../../services/admin.api';
import type { Therapist } from '../../types';
import { resolveUploadUrl } from '../../utils/url';

type PatientRow = {
  id: string; name: string; email: string; phone?: string; avatarUrl?: string;
  isActive: boolean;
  patientProfile?: { age: number; condition: string; therapistId: string } | null;
};

const emptyForm = { name: '', email: '', password: '', phone: '', age: '', condition: '', therapistId: '' };

export function AdminPatients() {
  const [patients, setPatients] = useState<PatientRow[]>([]);
  const [therapists, setTherapists] = useState<Therapist[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    adminApi.getPatients().then(p => setPatients(p as PatientRow[]));
    adminApi.getTherapists().then(setTherapists);
  }, []);

  function openForm() {
    setForm(emptyForm);
    setError('');
    setSuccess('');
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    try {
      const created = await adminApi.registerPatient({
        name: form.name, email: form.email, password: form.password,
        phone: form.phone || undefined, age: Number(form.age),
        condition: form.condition, therapistId: form.therapistId,
      });
      setPatients(prev => [created as PatientRow, ...prev]);
      setShowForm(false);
      setSuccess(`Paciente ${form.name} registrado correctamente.`);
    } catch (e: unknown) {
      setError((e as Error).message);
    }
  }

  async function handleToggle(p: PatientRow) {
    const updated = await adminApi.toggleActive(p.id);
    setPatients(prev => prev.map(x => x.id === p.id ? { ...x, isActive: updated.isActive } : x));
  }

  const f = (k: keyof typeof emptyForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(prev => ({ ...prev, [k]: e.target.value }));

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-display font-bold">Pacientes</h1>
          <p className="text-on-surface-variant">Registro y listado de pacientes</p>
        </div>
        <button onClick={openForm}
          className="flex items-center gap-2 bg-primary text-on-primary px-4 py-2.5 rounded-xl font-medium hover:opacity-90 transition-opacity">
          <Plus size={18} /> Registrar paciente
        </button>
      </div>

      {success && (
        <div className="mb-4 px-4 py-3 bg-primary-container text-primary rounded-xl text-sm">{success}</div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-surface rounded-2xl p-6 w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-display font-bold mb-4">Nuevo paciente</h2>
            <form onSubmit={handleSubmit} className="space-y-3">
              {[
                { label: 'Nombre completo', key: 'name', type: 'text', required: true },
                { label: 'Correo electrónico', key: 'email', type: 'email', required: true },
                { label: 'Contraseña inicial', key: 'password', type: 'password', required: true },
                { label: 'Teléfono', key: 'phone', type: 'tel', required: false },
                { label: 'Edad', key: 'age', type: 'number', required: true },
                { label: 'Padecimiento / Diagnóstico', key: 'condition', type: 'text', required: true },
              ].map(({ label, key, type, required }) => (
                <div key={key}>
                  <label className="text-sm text-on-surface-variant mb-1 block">{label}</label>
                  <input required={required} type={type} value={form[key as keyof typeof emptyForm]}
                    onChange={f(key as keyof typeof emptyForm)}
                    className="w-full bg-surface-container border border-surface-container-high rounded-xl px-3 py-2.5 text-sm" />
                </div>
              ))}
              <div>
                <label className="text-sm text-on-surface-variant mb-1 block">Terapeuta asignado</label>
                <select required value={form.therapistId} onChange={f('therapistId')}
                  className="w-full bg-surface-container border border-surface-container-high rounded-xl px-3 py-2.5 text-sm">
                  <option value="">Seleccionar...</option>
                  {therapists.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
              {error && <p className="text-sm text-error">{error}</p>}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)}
                  className="flex-1 py-2.5 rounded-xl border border-surface-container-high text-sm hover:bg-surface-container transition-colors">
                  Cancelar
                </button>
                <button type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-primary text-on-primary text-sm font-medium hover:opacity-90 transition-opacity">
                  Registrar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="bg-surface-container rounded-2xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-surface-container-high">
              <th className="text-left p-4 text-sm text-on-surface-variant font-medium">Paciente</th>
              <th className="text-left p-4 text-sm text-on-surface-variant font-medium">Contacto</th>
              <th className="text-left p-4 text-sm text-on-surface-variant font-medium">Padecimiento</th>
              <th className="text-left p-4 text-sm text-on-surface-variant font-medium">Edad</th>
              <th className="text-left p-4 text-sm text-on-surface-variant font-medium">Estado</th>
            </tr>
          </thead>
          <tbody>
            {patients.length === 0 && (
              <tr><td colSpan={5} className="p-8 text-center text-on-surface-variant">Sin pacientes registrados</td></tr>
            )}
            {patients.map(p => (
              <tr key={p.id} className="border-b border-surface-container-high last:border-0 hover:bg-surface transition-colors">
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    {resolveUploadUrl(p.avatarUrl)
                      ? <img src={resolveUploadUrl(p.avatarUrl)} className="w-9 h-9 rounded-full object-cover" alt="" />
                      : <div className="w-9 h-9 rounded-full bg-primary-container flex items-center justify-center"><User size={16} className="text-primary" /></div>
                    }
                    <span className="font-medium">{p.name}</span>
                  </div>
                </td>
                <td className="p-4">
                  <p className="flex items-center gap-1 text-sm"><Mail size={12} className="text-on-surface-variant" /> {p.email}</p>
                  {p.phone && <p className="flex items-center gap-1 text-sm text-on-surface-variant"><Phone size={12} /> {p.phone}</p>}
                </td>
                <td className="p-4 text-sm">{p.patientProfile?.condition ?? '—'}</td>
                <td className="p-4 text-sm">{p.patientProfile?.age ?? '—'}</td>
                <td className="p-4">
                  <button onClick={() => handleToggle(p)}
                    className="flex items-center gap-1.5 text-sm transition-colors"
                    title={p.isActive ? 'Desactivar' : 'Activar'}>
                    {p.isActive
                      ? <><ToggleRight size={22} className="text-primary" /><span className="text-primary font-medium">Activo</span></>
                      : <><ToggleLeft size={22} className="text-on-surface-variant" /><span className="text-on-surface-variant">Inactivo</span></>
                    }
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
