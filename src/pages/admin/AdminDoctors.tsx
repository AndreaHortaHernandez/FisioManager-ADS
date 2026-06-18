import { useEffect, useState } from 'react';
import { Plus, Stethoscope, Mail, Phone, ToggleLeft, ToggleRight } from 'lucide-react';
import { adminApi } from '../../services/admin.api';
import type { Therapist } from '../../types';
import { resolveUploadUrl } from '../../utils/url';

const emptyForm = { name: '', email: '', password: '', phone: '', cedula: '', especialidad: '' };

export function AdminDoctors() {
  const [therapists, setTherapists] = useState<Therapist[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
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
      const created = await adminApi.registerTherapist({
        name: form.name, email: form.email, password: form.password,
        phone: form.phone || undefined,
        cedula: form.cedula || undefined,
        especialidad: form.especialidad || undefined,
      });
      setTherapists(prev => [created, ...prev]);
      setShowForm(false);
      setSuccess(`Terapeuta ${form.name} registrado correctamente.`);
    } catch (e: unknown) {
      setError((e as Error).message);
    }
  }

  async function handleToggle(t: Therapist) {
    const updated = await adminApi.toggleActive(t.id);
    setTherapists(prev => prev.map(x => x.id === t.id ? { ...x, isActive: updated.isActive } : x));
  }

  const f = (k: keyof typeof emptyForm) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(prev => ({ ...prev, [k]: e.target.value }));

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-display font-bold">Doctores / Terapeutas</h1>
          <p className="text-on-surface-variant">Registro y listado del personal terapéutico</p>
        </div>
        <button onClick={openForm}
          className="flex items-center gap-2 bg-primary text-on-primary px-4 py-2.5 rounded-xl font-medium hover:opacity-90 transition-opacity">
          <Plus size={18} /> Registrar terapeuta
        </button>
      </div>

      {success && (
        <div className="mb-4 px-4 py-3 bg-primary-container text-primary rounded-xl text-sm">{success}</div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-surface rounded-2xl p-6 w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-display font-bold mb-4">Nuevo terapeuta</h2>
            <form onSubmit={handleSubmit} className="space-y-3">
              {[
                { label: 'Nombre completo', key: 'name', type: 'text', placeholder: 'Dr. Juan Pérez', required: true },
                { label: 'Correo electrónico', key: 'email', type: 'email', placeholder: '', required: true },
                { label: 'Contraseña inicial', key: 'password', type: 'password', placeholder: 'mínimo 6 caracteres', required: true },
                { label: 'Teléfono', key: 'phone', type: 'tel', placeholder: 'opcional', required: false },
                { label: 'Cédula profesional', key: 'cedula', type: 'text', placeholder: 'opcional', required: false },
                { label: 'Especialidad', key: 'especialidad', type: 'text', placeholder: 'ej. Fisioterapia ortopédica', required: false },
              ].map(({ label, key, type, placeholder, required }) => (
                <div key={key}>
                  <label className="text-sm text-on-surface-variant mb-1 block">{label}</label>
                  <input required={required} type={type}
                    placeholder={placeholder} value={form[key as keyof typeof emptyForm]}
                    onChange={f(key as keyof typeof emptyForm)}
                    className="w-full bg-surface-container border border-surface-container-high rounded-xl px-3 py-2.5 text-sm" />
                </div>
              ))}
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

      {therapists.length === 0 && (
        <div className="bg-surface-container rounded-2xl p-12 text-center text-on-surface-variant">
          No hay terapeutas registrados.
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {therapists.map(t => (
          <div key={t.id} className="bg-surface-container rounded-2xl p-5">
            <div className="flex items-start justify-between gap-2 mb-3">
              <div className="flex items-center gap-3">
                {resolveUploadUrl(t.avatarUrl)
                  ? <img src={resolveUploadUrl(t.avatarUrl)} className="w-12 h-12 rounded-full object-cover" alt="" />
                  : <div className="w-12 h-12 rounded-full bg-primary-container flex items-center justify-center shrink-0"><Stethoscope size={20} className="text-primary" /></div>
                }
                <div>
                  <p className="font-bold">{t.name}</p>
                  <p className="text-xs text-on-surface-variant">
                    {t.therapistProfile?.especialidad ?? 'Terapeuta'}
                  </p>
                </div>
              </div>
              <button onClick={() => handleToggle(t)} title={t.isActive ? 'Desactivar' : 'Activar'}>
                {t.isActive
                  ? <ToggleRight size={22} className="text-primary" />
                  : <ToggleLeft size={22} className="text-on-surface-variant" />
                }
              </button>
            </div>

            <div className="space-y-1">
              <p className="flex items-center gap-2 text-sm text-on-surface-variant"><Mail size={13} /> {t.email}</p>
              {t.phone && <p className="flex items-center gap-2 text-sm text-on-surface-variant"><Phone size={13} /> {t.phone}</p>}
              {t.therapistProfile?.cedula && (
                <p className="text-xs text-on-surface-variant">Cédula: {t.therapistProfile.cedula}</p>
              )}
            </div>

            <div className="mt-3 pt-3 border-t border-surface-container-high">
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${t.isActive ? 'bg-primary/10 text-primary' : 'bg-surface text-on-surface-variant'}`}>
                {t.isActive ? 'Activo' : 'Inactivo'}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
