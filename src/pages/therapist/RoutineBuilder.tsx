import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useStore } from '../../store/useStore';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import type { Activity, ActivityTemplate, BodyPart } from '../../types';
import { Plus, X, Video, ChevronUp, ChevronDown, Save, Wind } from 'lucide-react';

const BODY_PARTS: { value: BodyPart; label: string }[] = [
  { value: 'KNEE',     label: 'Rodilla'  },
  { value: 'BACK',     label: 'Espalda'  },
  { value: 'SHOULDER', label: 'Hombro'   },
  { value: 'NECK',     label: 'Cuello'   },
  { value: 'ARM',      label: 'Brazo'    },
  { value: 'HIP',      label: 'Cadera'   },
  { value: 'ANKLE',    label: 'Tobillo'  },
  { value: 'OTHER',    label: 'Otro'     },
];

const BACKEND_URL = import.meta.env.VITE_API_URL?.replace('/api', '') ?? 'http://localhost:3001';

export function RoutineBuilder() {
  const navigate = useNavigate();
  const { id: editId } = useParams<{ id?: string }>();
  const isEditing = Boolean(editId);

  const templates      = useStore(state => state.activityTemplates);
  const routines       = useStore(state => state.routines);
  const addRoutine     = useStore(state => state.addRoutine);
  const updateRoutine  = useStore(state => state.updateRoutine);

  const [routineTitle, setRoutineTitle]           = useState('');
  const [routineType, setRoutineType]             = useState<'TREATMENT' | 'RELAXATION'>('TREATMENT');
  const [selectedActivities, setSelectedActivities] = useState<Activity[]>([]);
  const [catalogFilter, setCatalogFilter]         = useState<'ALL' | 'PHYSICAL' | 'BREATHING'>('ALL');
  const [bodyPartFilter, setBodyPartFilter]       = useState<BodyPart | 'ALL'>('ALL');
  const [saving, setSaving]                       = useState(false);

  // Pre-populate when editing
  useEffect(() => {
    if (!editId) return;
    const routine = routines.find(r => r.id === editId);
    if (!routine) return;
    setRoutineTitle(routine.title);
    setRoutineType(routine.type);
    setSelectedActivities(routine.activities.map(a => ({ ...a })));
  }, [editId, routines]);

  const handleAddTemplate = (template: ActivityTemplate) => {
    const newActivity: Activity = {
      id: `a-${Date.now()}-${Math.random()}`,
      templateId: template.id,
      title: template.title,
      description: template.description,
      type: template.type,
      durationMinutes: 1,
      restSeconds: 30,
      repetitions: 10,
      order: selectedActivities.length + 1,
    };
    setSelectedActivities(prev => [...prev, newActivity]);
  };

  const handleRemoveActivity = (id: string) => {
    setSelectedActivities(prev => prev.filter(a => a.id !== id));
  };

  const handleUpdateActivity = (id: string, field: keyof Activity, value: number) => {
    setSelectedActivities(prev =>
      prev.map(a => a.id === id ? { ...a, [field]: value } : a)
    );
  };

  const handleSave = async () => {
    if (!routineTitle.trim() || selectedActivities.length === 0) {
      alert('Agrega un título y al menos una actividad.');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        title: routineTitle,
        type: routineType,
        patientId: null as string | null,
        activities: selectedActivities.map((a, i) => ({
          templateId:      a.templateId,
          title:           a.title,
          description:     a.description,
          type:            a.type,
          durationMinutes: a.durationMinutes,
          restSeconds:     a.restSeconds,
          repetitions:     a.repetitions,
          order:           i + 1,
          videoUrl:        a.videoUrl,
        })),
      };

      if (isEditing && editId) {
        await updateRoutine(editId, payload);
      } else {
        await addRoutine(payload);
      }
      navigate('/therapist/routines');
    } finally {
      setSaving(false);
    }
  };

  const filteredTemplates = templates
    .filter(t => catalogFilter === 'ALL' || t.type === catalogFilter)
    .filter(t => bodyPartFilter === 'ALL' || t.bodyPart === bodyPartFilter || t.type === 'BREATHING');

  return (
    <div className="h-[calc(100vh-80px)] flex flex-col animate-fade-in">
      <header className="mb-6 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-display font-bold text-on-surface mb-2">
            {isEditing ? 'Editar Rutina' : 'Routine Builder'}
          </h1>
          <p className="text-on-surface-variant font-body">
            {isEditing ? 'Modifica el título, tipo y ejercicios.' : 'Crea nuevas plantillas para tu biblioteca.'}
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="tertiary" onClick={() => navigate('/therapist/routines')}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={saving} className="flex gap-2 items-center">
            <Save size={18} /> {isEditing ? 'Guardar cambios' : 'Guardar en biblioteca'}
          </Button>
        </div>
      </header>

      <div className="flex-1 flex gap-8 overflow-hidden pb-8">

        {/* Left Column: Catálogo */}
        <div className="w-2/3 flex flex-col bg-surface-container-low rounded-2xl border-ghost overflow-hidden">
          <div className="p-4 border-b border-surface-container-high bg-surface-container-lowest space-y-3">
            <h2 className="font-display font-bold text-lg">Catálogo de Ejercicios</h2>

            <div className="flex gap-2">
              {(['ALL', 'PHYSICAL', 'BREATHING'] as const).map(f => (
                <button
                  key={f}
                  onClick={() => { setCatalogFilter(f); setBodyPartFilter('ALL'); }}
                  className={`px-3 py-1 rounded-full text-xs font-bold transition-colors ${catalogFilter === f ? 'bg-primary text-white' : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'}`}
                >
                  {f === 'ALL' ? 'Todos' : f === 'PHYSICAL' ? 'Físicos' : 'Meditación'}
                </button>
              ))}
            </div>

            {catalogFilter !== 'BREATHING' && (() => {
              const usedParts = Array.from(new Set(
                templates.filter(t => t.type === 'PHYSICAL' && t.bodyPart).map(t => t.bodyPart as BodyPart)
              ));
              if (usedParts.length === 0) return null;
              return (
                <div className="flex flex-wrap gap-1.5">
                  <button
                    onClick={() => setBodyPartFilter('ALL')}
                    className={`px-3 py-1 rounded-full text-xs transition-colors ${bodyPartFilter === 'ALL' ? 'bg-secondary text-white' : 'bg-surface-container-high text-on-surface-variant hover:bg-surface-container'}`}
                  >
                    Todas las zonas
                  </button>
                  {BODY_PARTS.filter(bp => usedParts.includes(bp.value)).map(bp => (
                    <button
                      key={bp.value}
                      onClick={() => setBodyPartFilter(bp.value)}
                      className={`px-3 py-1 rounded-full text-xs transition-colors ${bodyPartFilter === bp.value ? 'bg-secondary text-white' : 'bg-surface-container-high text-on-surface-variant hover:bg-surface-container'}`}
                    >
                      {bp.label}
                    </button>
                  ))}
                </div>
              );
            })()}
          </div>

          <div className="flex-1 overflow-y-auto p-4 grid grid-cols-2 gap-4 content-start">
            {filteredTemplates.map(template => {
              const bodyPartLabel = BODY_PARTS.find(bp => bp.value === template.bodyPart)?.label;
              return (
                <Card key={template.id} level={1} className="p-3 group hover:border-primary border-transparent border transition-all cursor-pointer">
                  <div className="aspect-video bg-surface-container-high rounded-lg mb-2 flex items-center justify-center text-outline-variant relative overflow-hidden">
                    {template.imageUrl ? (
                      <img src={`${BACKEND_URL}${template.imageUrl}`} alt={template.title} className="w-full h-full object-cover" />
                    ) : template.videoUrl ? (
                      <video src={`${BACKEND_URL}${template.videoUrl}`} className="w-full h-full object-cover" muted />
                    ) : template.type === 'BREATHING' ? (
                      <Wind size={32} />
                    ) : (
                      <Video size={32} />
                    )}
                    <div className="absolute inset-0 bg-primary/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <button
                        onClick={(e) => { e.stopPropagation(); handleAddTemplate(template); }}
                        className="w-12 h-12 bg-primary rounded-full text-white flex items-center justify-center shadow-ambient hover:scale-110 transition-transform"
                      >
                        <Plus size={24} />
                      </button>
                    </div>
                  </div>
                  {bodyPartLabel && (
                    <span className="text-[10px] font-bold uppercase tracking-wider text-primary bg-primary/10 rounded-full px-2 py-0.5 mb-1 inline-block">
                      {bodyPartLabel}
                    </span>
                  )}
                  <h3 className="font-bold text-sm text-on-surface leading-tight">{template.title}</h3>
                  <p className="text-xs text-on-surface-variant mt-0.5 line-clamp-2">{template.description}</p>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Right Column: Canvas */}
        <div className="flex-1 flex flex-col bg-surface-container-lowest rounded-2xl shadow-ambient border-ghost overflow-hidden">
          <div className="p-6 border-b border-surface-container-high bg-surface">
            <div className="flex gap-4 mb-4">
              <div className="flex-1">
                <Input
                  label="Título de la rutina"
                  value={routineTitle}
                  onChange={e => setRoutineTitle(e.target.value)}
                  placeholder="Ej. Movilidad Post-Op Rodilla"
                />
              </div>
              <div className="w-48">
                <label className="text-sm font-body text-on-surface-variant ml-2 tracking-wide mb-1 block">Tipo</label>
                <select
                  value={routineType}
                  onChange={(e) => setRoutineType(e.target.value as 'TREATMENT' | 'RELAXATION')}
                  className="w-full bg-surface-container text-on-surface rounded-t-lg px-4 py-3 border-b-2 border-transparent outline-none focus:bg-surface-container-lowest focus:border-primary"
                >
                  <option value="TREATMENT">Treatment</option>
                  <option value="RELAXATION">Relaxation</option>
                </select>
              </div>
            </div>
            <p className="text-sm font-bold text-primary">{selectedActivities.length} actividades</p>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-surface-bright">
            {selectedActivities.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-outline">
                <Plus size={48} className="mb-4 opacity-50" />
                <p className="font-display">Tu rutina está vacía.</p>
                <p className="text-sm">Haz clic en + sobre cualquier ejercicio.</p>
              </div>
            ) : (
              selectedActivities.map((activity, index) => (
                <Card key={activity.id} level={2} className="relative p-0 overflow-hidden flex border-ghost">
                  <div className="w-12 bg-primary-container/10 flex flex-col items-center justify-center border-r border-surface-container-high">
                    <span className="font-display font-bold text-primary">{index + 1}</span>
                  </div>
                  <div className="p-4 flex-1">
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="font-bold text-lg">{activity.title}</h3>
                      <button onClick={() => handleRemoveActivity(activity.id)} className="text-outline hover:text-error transition-colors">
                        <X size={20} />
                      </button>
                    </div>
                    <div className="grid grid-cols-3 gap-6">
                      <div>
                        <label className="text-xs text-on-surface-variant uppercase font-bold tracking-wider mb-1 block">Duración (min)</label>
                        <div className="flex items-center gap-2">
                          <button onClick={() => handleUpdateActivity(activity.id, 'durationMinutes', Math.max(1, activity.durationMinutes - 1))} className="p-1 bg-surface-container rounded hover:text-primary"><ChevronDown size={16} /></button>
                          <span className="w-8 text-center font-bold text-lg">{activity.durationMinutes}</span>
                          <button onClick={() => handleUpdateActivity(activity.id, 'durationMinutes', activity.durationMinutes + 1)} className="p-1 bg-surface-container rounded hover:text-primary"><ChevronUp size={16} /></button>
                        </div>
                      </div>
                      <div>
                        <label className="text-xs text-on-surface-variant uppercase font-bold tracking-wider mb-1 block">Reps</label>
                        <div className="flex items-center gap-2">
                          <button onClick={() => handleUpdateActivity(activity.id, 'repetitions', Math.max(1, activity.repetitions - 1))} className="p-1 bg-surface-container rounded hover:text-primary"><ChevronDown size={16} /></button>
                          <span className="w-8 text-center font-bold text-lg">{activity.repetitions}</span>
                          <button onClick={() => handleUpdateActivity(activity.id, 'repetitions', activity.repetitions + 1)} className="p-1 bg-surface-container rounded hover:text-primary"><ChevronUp size={16} /></button>
                        </div>
                      </div>
                      <div>
                        <label className="text-xs text-on-surface-variant uppercase font-bold tracking-wider mb-1 block">Descanso (seg)</label>
                        <div className="flex items-center gap-2">
                          <button onClick={() => handleUpdateActivity(activity.id, 'restSeconds', Math.max(0, (activity.restSeconds || 0) - 5))} className="p-1 bg-surface-container rounded hover:text-primary"><ChevronDown size={16} /></button>
                          <span className="w-8 text-center font-bold text-lg">{activity.restSeconds}</span>
                          <button onClick={() => handleUpdateActivity(activity.id, 'restSeconds', (activity.restSeconds || 0) + 5)} className="p-1 bg-surface-container rounded hover:text-primary"><ChevronUp size={16} /></button>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
