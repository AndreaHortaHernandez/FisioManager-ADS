import { useEffect, useState } from 'react';
import { Plus, User, Mail, Phone, ToggleLeft, ToggleRight } from 'lucide-react';
import { adminApi, type UserRow } from '../../services/admin.api';
import type { Therapist } from '../../types';

const roleLabel: Record<UserRow['role'], string> = {
  PATIENT: 'Paciente',
  THERAPIST: 'Terapeuta',
  ADMIN: 'Admin',
};

const emptyForm = {
  role: 'PATIENT' as 'PATIENT' | 'THERAPIST',
  name: '', email: '', password: '', phone: '',
  age: '', condition: '', therapistId: '',
  cedula: '', especialidad: '',
};

export function AdminUsers() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [therapists, setTherapists] = useState<Therapist[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  function reload() {
    adminApi.getAllUsers().then(setUsers);
  }

  useEffect(() => {
    reload();
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
      if (form.role === 'PATIENT') {
        await adminApi.registerPatient({
          name: form.name, email: form.email, password: form.password,
          phone: form.phone || undefined, age: Number(form.age),
          condition: form.condition, therapistId: form.therapistId,
        });
      } else {
        await adminApi.registerTherapist({
          name: form.name, email: form.email, password: form.password,
          phone: form.phone || undefined,
          cedula: form.cedula || undefined, especialidad: form.especialidad || undefined,
        });
      }
      setShowForm(false);
      setSuccess(`${roleLabel[form.role]} ${form.name} registrado correctamente.`);
      reload();
    } catch (e: unknown) {
      setError((e as Error).message);
    }
  }

  async function handleToggle(u: UserRow) {
    const updated = await adminApi.toggleActive(u.id);
    setUsers(prev => prev.map(x => x.id === u.id ? { ...x, isActive: updated.isActive } : x));
  }

  const f = (k: keyof typeof emptyForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(prev => ({ ...prev, [k]: e.target.value }));

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-display font-bold">Usuarios</h1>
          <p className="text-on-surface-variant">Alta y administración de cuentas</p>
        </div>
        <button onClick={openForm}
          className="flex items-center gap-2 bg-primary text-on-primary px-4 py-2.5 rounded-xl font-medium hover:opacity-90 transition-opacity">
          <Plus size={18} /> Nuevo usuario
        </button>
      </div>

      {success && (
        <div className="mb-4 px-4 py-3 bg-primary-container text-primary rounded-xl text-sm">{success}</div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-surface rounded-2xl p-6 w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-display font-bold mb-4">Nuevo usuario</h2>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="text-sm text-on-surface-variant mb-1 block">Tipo de usuario</label>
                <select value={form.role} onChange={f('role')}
                  className="w-full bg-surface-container border border-surface-container-high rounded-xl px-3 py-2.5 text-sm">
                  <option value="PATIENT">Paciente</option>
                  <option value="THERAPIST">Terapeuta</option>
                </select>
              </div>

              {[
                { label: 'Nombre completo', key: 'name', type: 'text', required: true },
                { label: 'Correo electrónico', key: 'email', type: 'email', required: true },
                { label: 'Contraseña inicial', key: 'password', type: 'password', required: true },
                { label: 'Teléfono', key: 'phone', type: 'tel', required: false },
              ].map(({ label, key, type, required }) => (
                <div key={key}>
                  <label className="text-sm text-on-surface-variant mb-1 block">{label}</label>
                  <input required={required} type={type} value={form[key as keyof typeof emptyForm]}
                    onChange={f(key as keyof typeof emptyForm)}
                    className="w-full bg-surface-container border border-surface-container-high rounded-xl px-3 py-2.5 text-sm" />
                </div>
              ))}

              {form.role === 'PATIENT' ? (
                <>
                  <div>
                    <label className="text-sm text-on-surface-variant mb-1 block">Edad</label>
                    <input required type="number" value={form.age} onChange={f('age')}
                      className="w-full bg-surface-container border border-surface-container-high rounded-xl px-3 py-2.5 text-sm" />
                  </div>
                  <div>
                    <label className="text-sm text-on-surface-variant mb-1 block">Padecimiento / Diagnóstico</label>
                    <input required type="text" value={form.condition} onChange={f('condition')}
                      className="w-full bg-surface-container border border-surface-container-high rounded-xl px-3 py-2.5 text-sm" />
                  </div>
                  <div>
                    <label className="text-sm text-on-surface-variant mb-1 block">Terapeuta asignado</label>
                    <select required value={form.therapistId} onChange={f('therapistId')}
                      className="w-full bg-surface-container border border-surface-container-high rounded-xl px-3 py-2.5 text-sm">
                      <option value="">Seleccionar...</option>
                      {therapists.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="text-sm text-on-surface-variant mb-1 block">Cédula</label>
                    <input type="text" value={form.cedula} onChange={f('cedula')}
                      className="w-full bg-surface-container border border-surface-container-high rounded-xl px-3 py-2.5 text-sm" />
                  </div>
                  <div>
                    <label className="text-sm text-on-surface-variant mb-1 block">Especialidad</label>
                    <input type="text" value={form.especialidad} onChange={f('especialidad')}
                      className="w-full bg-surface-container border border-surface-container-high rounded-xl px-3 py-2.5 text-sm" />
                  </div>
                </>
              )}

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
              <th className="text-left p-4 text-sm text-on-surface-variant font-medium">Usuario</th>
              <th className="text-left p-4 text-sm text-on-surface-variant font-medium">Contacto</th>
              <th className="text-left p-4 text-sm text-on-surface-variant font-medium">Rol</th>
              <th className="text-left p-4 text-sm text-on-surface-variant font-medium">Estado</th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 && (
              <tr><td colSpan={4} className="p-8 text-center text-on-surface-variant">Sin usuarios registrados</td></tr>
            )}
            {users.map(u => (
              <tr key={u.id} className="border-b border-surface-container-high last:border-0 hover:bg-surface transition-colors">
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    {u.avatarUrl
                      ? <img src={u.avatarUrl} className="w-9 h-9 rounded-full object-cover" alt="" />
                      : <div className="w-9 h-9 rounded-full bg-primary-container flex items-center justify-center"><User size={16} className="text-primary" /></div>
                    }
                    <span className="font-medium">{u.name}</span>
                  </div>
                </td>
                <td className="p-4">
                  <p className="flex items-center gap-1 text-sm"><Mail size={12} className="text-on-surface-variant" /> {u.email}</p>
                  {u.phone && <p className="flex items-center gap-1 text-sm text-on-surface-variant"><Phone size={12} /> {u.phone}</p>}
                </td>
                <td className="p-4 text-sm">{roleLabel[u.role]}</td>
                <td className="p-4">
                  {u.role === 'ADMIN' ? (
                    <span className="text-sm text-on-surface-variant">—</span>
                  ) : (
                    <button onClick={() => handleToggle(u)}
                      className="flex items-center gap-1.5 text-sm transition-colors"
                      title={u.isActive ? 'Desactivar' : 'Activar'}>
                      {u.isActive
                        ? <><ToggleRight size={22} className="text-primary" /><span className="text-primary font-medium">Activo</span></>
                        : <><ToggleLeft size={22} className="text-on-surface-variant" /><span className="text-on-surface-variant">Inactivo</span></>
                      }
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
