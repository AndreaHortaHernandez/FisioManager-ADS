import { useState, useRef } from 'react';
import { useStore } from '../../store/useStore';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { Plus, Video, Image, Wind, Dumbbell, Upload, X, Trash2 } from 'lucide-react';
import type { BodyPart } from '../../types';

const BODY_PARTS: { value: BodyPart; label: string }[] = [
  { value: 'KNEE', label: 'Rodilla' },
  { value: 'BACK', label: 'Espalda' },
  { value: 'SHOULDER', label: 'Hombro' },
  { value: 'NECK', label: 'Cuello' },
  { value: 'ARM', label: 'Brazo' },
  { value: 'HIP', label: 'Cadera' },
  { value: 'ANKLE', label: 'Tobillo' },
  { value: 'OTHER', label: 'Otro' },
];

const BACKEND_URL = import.meta.env.VITE_API_URL?.replace('/api', '') ?? 'http://localhost:3001';

function ExerciseCard({ template, onDelete }: {
  template: { id: string; title: string; description: string; imageUrl?: string; videoUrl?: string; bodyPart?: string };
  onDelete: (id: string) => void;
}) {
  const media = template.imageUrl ?? template.videoUrl;
  const isVideo = !!template.videoUrl && !template.imageUrl;

  return (
    <Card level={2} className="flex flex-col border-ghost hover:shadow-ambient transition-shadow">
      <div className="aspect-video bg-surface-container rounded-xl mb-3 flex items-center justify-center overflow-hidden relative">
        {media ? (
          isVideo ? (
            <video src={`${BACKEND_URL}${media}`} className="w-full h-full object-cover" muted />
          ) : (
            <img src={`${BACKEND_URL}${media}`} alt={template.title} className="w-full h-full object-cover" />
          )
        ) : (
          <div className="flex flex-col items-center gap-2 text-outline-variant">
            <Video size={32} />
            <span className="text-xs">Sin media</span>
          </div>
        )}
      </div>
      <h3 className="font-bold text-on-surface text-sm leading-tight mb-1">{template.title}</h3>
      <p className="text-xs text-on-surface-variant line-clamp-2 mb-3">{template.description}</p>
      <button
        onClick={() => onDelete(template.id)}
        className="mt-auto flex items-center justify-center gap-1.5 w-full py-1.5 rounded-lg text-xs font-bold text-error hover:bg-error/10 transition-colors"
      >
        <Trash2 size={13} /> Eliminar
      </button>
    </Card>
  );
}

export function ExerciseLibrary() {
  const templates = useStore(state => state.activityTemplates);
  const addActivityTemplate = useStore(state => state.addActivityTemplate);
  const deleteActivityTemplate = useStore(state => state.deleteActivityTemplate);

  const handleDelete = async (id: string) => {
    if (!window.confirm('¿Eliminar este ejercicio del catálogo?')) return;
    await deleteActivityTemplate(id);
  };

  const physical = templates.filter(t => t.type === 'PHYSICAL');
  const breathing = templates.filter(t => t.type === 'BREATHING');

  const [activeBodyPart, setActiveBodyPart] = useState<BodyPart | 'ALL'>('ALL');
  const [modalOpen, setModalOpen] = useState(false);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<'PHYSICAL' | 'BREATHING'>('PHYSICAL');
  const [bodyPart, setBodyPart] = useState<BodyPart>('KNEE');
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const videoRef = useRef<HTMLInputElement>(null);
  const imageRef = useRef<HTMLInputElement>(null);

  const filteredPhysical = activeBodyPart === 'ALL'
    ? physical
    : physical.filter(t => t.bodyPart === activeBodyPart);

  const handleSave = async () => {
    if (!title.trim() || !description.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append('title', title);
      fd.append('description', description);
      fd.append('type', type);
      if (type === 'PHYSICAL') fd.append('bodyPart', bodyPart);
      if (videoFile) fd.append('video', videoFile);
      if (imageFile) fd.append('image', imageFile);
      await addActivityTemplate(fd);
      setModalOpen(false);
      setTitle('');
      setDescription('');
      setType('PHYSICAL');
      setBodyPart('KNEE');
      setVideoFile(null);
      setImageFile(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al guardar el ejercicio');
    } finally {
      setSaving(false);
    }
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setError(null);
  };

  const bodyPartsUsed = Array.from(new Set(physical.map(t => t.bodyPart).filter(Boolean))) as BodyPart[];

  return (
    <div className="space-y-10 animate-fade-in">
      <header className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-display font-bold text-on-surface mb-2">Biblioteca de Ejercicios</h1>
          <p className="text-on-surface-variant font-body">Administra el catálogo de ejercicios disponibles para tus rutinas.</p>
        </div>
        <Button onClick={() => setModalOpen(true)} className="flex items-center gap-2">
          <Plus size={20} /> Nuevo Ejercicio
        </Button>
      </header>

      {/* ── Sección 1: Ejercicios Físicos ───────────────────────────────── */}
      <section>
        <div className="flex items-center gap-3 mb-5">
          <Dumbbell size={22} className="text-primary" />
          <h2 className="text-xl font-display font-bold text-on-surface">Ejercicios Físicos</h2>
          <span className="text-sm text-on-surface-variant">({physical.length})</span>
        </div>

        {/* Filtros por parte del cuerpo */}
        {physical.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-6">
            <button
              onClick={() => setActiveBodyPart('ALL')}
              className={`px-4 py-1.5 rounded-full text-sm font-body transition-colors ${activeBodyPart === 'ALL' ? 'bg-primary text-white' : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'}`}
            >
              Todos
            </button>
            {BODY_PARTS.filter(bp => bodyPartsUsed.includes(bp.value)).map(bp => (
              <button
                key={bp.value}
                onClick={() => setActiveBodyPart(bp.value)}
                className={`px-4 py-1.5 rounded-full text-sm font-body transition-colors ${activeBodyPart === bp.value ? 'bg-primary text-white' : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'}`}
              >
                {bp.label}
              </button>
            ))}
          </div>
        )}

        {filteredPhysical.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-16 bg-surface-container-lowest rounded-2xl border-ghost text-center">
            <Dumbbell size={48} className="text-outline-variant mb-3" />
            <p className="font-display font-bold text-on-surface">Sin ejercicios físicos</p>
            <p className="text-sm text-on-surface-variant mt-1">Crea el primero con el botón de arriba.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {filteredPhysical.map(t => <ExerciseCard key={t.id} template={t} onDelete={handleDelete} />)}
          </div>
        )}
      </section>

      {/* ── Sección 2: Meditación y Respiración ─────────────────────────── */}
      <section>
        <div className="flex items-center gap-3 mb-5">
          <Wind size={22} className="text-tertiary" />
          <h2 className="text-xl font-display font-bold text-on-surface">Meditación y Respiración</h2>
          <span className="text-sm text-on-surface-variant">({breathing.length})</span>
        </div>

        {breathing.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-16 bg-surface-container-lowest rounded-2xl border-ghost text-center">
            <Wind size={48} className="text-outline-variant mb-3" />
            <p className="font-display font-bold text-on-surface">Sin ejercicios de meditación</p>
            <p className="text-sm text-on-surface-variant mt-1">Crea el primero con el botón de arriba.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {breathing.map(t => <ExerciseCard key={t.id} template={t} onDelete={handleDelete} />)}
          </div>
        )}
      </section>

      {/* ── Modal: Crear ejercicio ───────────────────────────────────────── */}
      <Modal isOpen={modalOpen} onClose={handleCloseModal} title="Nuevo Ejercicio">
        <div className="space-y-4">
          <Input label="Título" value={title} onChange={e => setTitle(e.target.value)} placeholder="ej. Extensión de rodilla" />
          <div>
            <label className="text-sm font-body text-on-surface-variant ml-2 tracking-wide mb-1 block">Descripción</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Describe el ejercicio..."
              rows={3}
              className="w-full bg-surface-container text-on-surface rounded-t-lg px-4 py-3 border-b-2 border-transparent outline-none focus:bg-surface-container-lowest focus:border-primary resize-none font-body text-sm"
            />
          </div>

          <div>
            <label className="text-sm font-body text-on-surface-variant ml-2 tracking-wide mb-1 block">Tipo</label>
            <div className="flex gap-3">
              {(['PHYSICAL', 'BREATHING'] as const).map(t => (
                <button
                  key={t}
                  onClick={() => setType(t)}
                  className={`flex-1 py-2 rounded-xl text-sm font-bold transition-colors ${type === t ? 'bg-primary text-white' : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'}`}
                >
                  {t === 'PHYSICAL' ? 'Físico' : 'Meditación / Respiración'}
                </button>
              ))}
            </div>
          </div>

          {type === 'PHYSICAL' && (
            <div>
              <label className="text-sm font-body text-on-surface-variant ml-2 tracking-wide mb-1 block">Parte del cuerpo</label>
              <div className="flex flex-wrap gap-2">
                {BODY_PARTS.map(bp => (
                  <button
                    key={bp.value}
                    onClick={() => setBodyPart(bp.value)}
                    className={`px-3 py-1 rounded-full text-xs font-bold transition-colors ${bodyPart === bp.value ? 'bg-primary text-white' : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'}`}
                  >
                    {bp.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Upload de imagen */}
          <div>
            <label className="text-sm font-body text-on-surface-variant ml-2 tracking-wide mb-1 block">Imagen</label>
            <input ref={imageRef} type="file" accept="image/*" className="hidden" onChange={e => setImageFile(e.target.files?.[0] ?? null)} />
            {imageFile ? (
              <div className="flex items-center gap-3 p-3 bg-surface-container rounded-xl">
                <Image size={18} className="text-primary shrink-0" />
                <span className="text-sm flex-1 truncate">{imageFile.name}</span>
                <button onClick={() => setImageFile(null)} className="text-outline hover:text-error"><X size={16} /></button>
              </div>
            ) : (
              <button onClick={() => imageRef.current?.click()} className="w-full flex items-center gap-3 p-3 bg-surface-container rounded-xl text-on-surface-variant hover:bg-surface-container-high transition-colors">
                <Upload size={18} />
                <span className="text-sm">Subir imagen</span>
              </button>
            )}
          </div>

          {/* Upload de video */}
          <div>
            <label className="text-sm font-body text-on-surface-variant ml-2 tracking-wide mb-1 block">Video (opcional)</label>
            <input ref={videoRef} type="file" accept="video/*" className="hidden" onChange={e => setVideoFile(e.target.files?.[0] ?? null)} />
            {videoFile ? (
              <div className="flex items-center gap-3 p-3 bg-surface-container rounded-xl">
                <Video size={18} className="text-primary shrink-0" />
                <span className="text-sm flex-1 truncate">{videoFile.name}</span>
                <button onClick={() => setVideoFile(null)} className="text-outline hover:text-error"><X size={16} /></button>
              </div>
            ) : (
              <button onClick={() => videoRef.current?.click()} className="w-full flex items-center gap-3 p-3 bg-surface-container rounded-xl text-on-surface-variant hover:bg-surface-container-high transition-colors">
                <Upload size={18} />
                <span className="text-sm">Subir video</span>
              </button>
            )}
          </div>

          {error && (
            <p className="text-sm text-error bg-error-container rounded-xl px-4 py-2">{error}</p>
          )}

          <div className="flex gap-3 justify-end pt-2">
            <Button variant="tertiary" onClick={handleCloseModal}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving || !title.trim() || !description.trim()}>
              {saving ? 'Guardando...' : 'Crear Ejercicio'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
