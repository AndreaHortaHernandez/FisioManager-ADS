import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, DoorOpen, MapPin, Users, Wrench, Trash2 } from 'lucide-react';
import { roomsApi, type Room } from '../../services/rooms.api';

const emptyForm = { name: '', location: '', capacity: '1', equipment: '' };

export function AdminRooms() {
  const { t } = useTranslation();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState('');

  useEffect(() => {
    roomsApi.getAll().then(setRooms);
  }, []);

  function openForm() {
    setForm(emptyForm);
    setError('');
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    try {
      const created = await roomsApi.create({
        name: form.name,
        location: form.location || undefined,
        capacity: form.capacity ? parseInt(form.capacity) : undefined,
        equipment: form.equipment || undefined,
      });
      setRooms(prev => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)));
      setShowForm(false);
    } catch (e: unknown) {
      setError((e as Error).message);
    }
  }

  async function handleDelete(id: string) {
    await roomsApi.delete(id);
    setRooms(prev => prev.filter(r => r.id !== id));
  }

  const f = (k: keyof typeof emptyForm) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(prev => ({ ...prev, [k]: e.target.value }));

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-display font-bold">{t('admin.rooms.title')}</h1>
          <p className="text-on-surface-variant">{t('admin.rooms.subtitle')}</p>
        </div>
        <button onClick={openForm}
          className="flex items-center gap-2 bg-primary text-on-primary px-4 py-2.5 rounded-xl font-medium hover:opacity-90 transition-opacity">
          <Plus size={18} /> {t('admin.rooms.new')}
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-surface rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h2 className="text-xl font-display font-bold mb-4">{t('admin.rooms.newTitle')}</h2>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="text-sm text-on-surface-variant mb-1 block">{t('admin.rooms.name')}</label>
                <input required type="text" placeholder={t('admin.rooms.namePlaceholder')} value={form.name} onChange={f('name')}
                  className="w-full bg-surface-container border border-surface-container-high rounded-xl px-3 py-2.5 text-sm" />
              </div>
              <div>
                <label className="text-sm text-on-surface-variant mb-1 block">{t('admin.rooms.location')}</label>
                <input type="text" placeholder={t('admin.rooms.locationPlaceholder')} value={form.location} onChange={f('location')}
                  className="w-full bg-surface-container border border-surface-container-high rounded-xl px-3 py-2.5 text-sm" />
              </div>
              <div>
                <label className="text-sm text-on-surface-variant mb-1 block">{t('admin.rooms.capacity')}</label>
                <input type="number" min="1" value={form.capacity} onChange={f('capacity')}
                  className="w-full bg-surface-container border border-surface-container-high rounded-xl px-3 py-2.5 text-sm" />
              </div>
              <div>
                <label className="text-sm text-on-surface-variant mb-1 block">{t('admin.rooms.equipment')}</label>
                <input type="text" placeholder={t('admin.rooms.equipmentPlaceholder')} value={form.equipment} onChange={f('equipment')}
                  className="w-full bg-surface-container border border-surface-container-high rounded-xl px-3 py-2.5 text-sm" />
              </div>
              {error && <p className="text-sm text-error">{error}</p>}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)}
                  className="flex-1 py-2.5 rounded-xl border border-surface-container-high text-sm hover:bg-surface-container transition-colors">
                  {t('common.cancel')}
                </button>
                <button type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-primary text-on-primary text-sm font-medium hover:opacity-90 transition-opacity">
                  {t('admin.rooms.create')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {rooms.length === 0 && (
        <div className="bg-surface-container rounded-2xl p-12 text-center text-on-surface-variant">
          {t('admin.rooms.empty')}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {rooms.map(r => (
          <div key={r.id} className="bg-surface-container rounded-2xl p-5">
            <div className="flex items-start justify-between gap-2 mb-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-primary-container flex items-center justify-center shrink-0">
                  <DoorOpen size={20} className="text-primary" />
                </div>
                <p className="font-bold">{r.name}</p>
              </div>
              <button onClick={() => handleDelete(r.id)} title={t('common.delete')} className="text-on-surface-variant hover:text-error transition-colors">
                <Trash2 size={18} />
              </button>
            </div>
            <div className="space-y-1">
              {r.location && <p className="flex items-center gap-2 text-sm text-on-surface-variant"><MapPin size={13} /> {r.location}</p>}
              <p className="flex items-center gap-2 text-sm text-on-surface-variant"><Users size={13} /> {t('admin.rooms.capacityLabel', { count: r.capacity })}</p>
              {r.equipment && <p className="flex items-center gap-2 text-sm text-on-surface-variant"><Wrench size={13} /> {r.equipment}</p>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
