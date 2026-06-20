import { useTranslation } from 'react-i18next';
import { cn } from '../utils/cn';
import type { BodyPart, Side, PainPointInput } from '../services/metrics.api';

interface Region {
  key: string;
  bodyPart: BodyPart;
  side: Side;
  labelKey: string;
  cx: number;
  cy: number;
}

const REGIONS: Region[] = [
  { key: 'NECK', bodyPart: 'NECK', side: 'CENTER', labelKey: 'shared.bodyMap.NECK', cx: 50, cy: 16 },
  { key: 'SHOULDER_L', bodyPart: 'SHOULDER', side: 'LEFT', labelKey: 'shared.bodyMap.SHOULDER_L', cx: 35, cy: 24 },
  { key: 'SHOULDER_R', bodyPart: 'SHOULDER', side: 'RIGHT', labelKey: 'shared.bodyMap.SHOULDER_R', cx: 65, cy: 24 },
  { key: 'BACK', bodyPart: 'BACK', side: 'CENTER', labelKey: 'shared.bodyMap.BACK', cx: 50, cy: 38 },
  { key: 'ARM_L', bodyPart: 'ARM', side: 'LEFT', labelKey: 'shared.bodyMap.ARM_L', cx: 27, cy: 42 },
  { key: 'ARM_R', bodyPart: 'ARM', side: 'RIGHT', labelKey: 'shared.bodyMap.ARM_R', cx: 73, cy: 42 },
  { key: 'HIP', bodyPart: 'HIP', side: 'CENTER', labelKey: 'shared.bodyMap.HIP', cx: 50, cy: 55 },
  { key: 'KNEE_L', bodyPart: 'KNEE', side: 'LEFT', labelKey: 'shared.bodyMap.KNEE_L', cx: 43, cy: 74 },
  { key: 'KNEE_R', bodyPart: 'KNEE', side: 'RIGHT', labelKey: 'shared.bodyMap.KNEE_R', cx: 57, cy: 74 },
  { key: 'ANKLE_L', bodyPart: 'ANKLE', side: 'LEFT', labelKey: 'shared.bodyMap.ANKLE_L', cx: 43, cy: 92 },
  { key: 'ANKLE_R', bodyPart: 'ANKLE', side: 'RIGHT', labelKey: 'shared.bodyMap.ANKLE_R', cx: 57, cy: 92 },
];

function regionKey(p: { bodyPart: BodyPart; side?: Side }) {
  return `${p.bodyPart}_${p.side ?? 'CENTER'}`;
}

function intensityColor(intensity: number) {
  if (intensity >= 7) return '#dc2626';
  if (intensity >= 4) return '#f59e0b';
  return '#22c55e';
}

interface Props {
  value: PainPointInput[];
  onChange: (points: PainPointInput[]) => void;
  readOnly?: boolean;
}

export function BodyMap({ value, onChange, readOnly }: Props) {
  const { t } = useTranslation();
  const selected = new Map(value.map(p => [regionKey(p), p]));

  function toggle(region: Region) {
    if (readOnly) return;
    const k = regionKey({ bodyPart: region.bodyPart, side: region.side });
    if (selected.has(k)) {
      onChange(value.filter(p => regionKey(p) !== k));
    } else {
      onChange([...value, { bodyPart: region.bodyPart, side: region.side, intensity: 5 }]);
    }
  }

  function setIntensity(p: PainPointInput, intensity: number) {
    onChange(value.map(x => (regionKey(x) === regionKey(p) ? { ...x, intensity } : x)));
  }

  return (
    <div className="space-y-4">
      <div className="relative mx-auto w-48" style={{ aspectRatio: '1 / 2' }}>
        <svg viewBox="0 0 100 200" className="w-full h-full">
          <g fill="currentColor" className="text-surface-container-high">
            <circle cx="50" cy="14" r="9" />
            <rect x="44" y="22" width="12" height="6" rx="3" />
            <rect x="30" y="28" width="40" height="60" rx="14" />
            <rect x="20" y="30" width="12" height="50" rx="6" />
            <rect x="68" y="30" width="12" height="50" rx="6" />
            <rect x="36" y="86" width="12" height="80" rx="6" />
            <rect x="52" y="86" width="12" height="80" rx="6" />
            <rect x="36" y="166" width="12" height="20" rx="4" />
            <rect x="52" y="166" width="12" height="20" rx="4" />
          </g>
        </svg>

        {REGIONS.map(r => {
          const k = regionKey({ bodyPart: r.bodyPart, side: r.side });
          const point = selected.get(k);
          return (
            <button
              key={r.key}
              type="button"
              onClick={() => toggle(r)}
              title={t(r.labelKey)}
              disabled={readOnly}
              className={cn(
                'absolute -translate-x-1/2 -translate-y-1/2 rounded-full border-2 transition-all',
                point ? 'w-6 h-6' : 'w-4 h-4 border-dashed',
                readOnly ? 'cursor-default' : 'cursor-pointer hover:scale-110',
              )}
              style={{
                left: `${r.cx}%`,
                top: `${r.cy}%`,
                backgroundColor: point ? intensityColor(point.intensity) : 'transparent',
                borderColor: point ? intensityColor(point.intensity) : 'var(--color-outline, #999)',
              }}
            />
          );
        })}
      </div>

      {value.length > 0 && (
        <div className="space-y-2">
          {value.map(p => {
            const region = REGIONS.find(r => regionKey(r) === regionKey(p));
            return (
              <div key={regionKey(p)} className="flex items-center gap-3 text-sm">
                <span className="w-28 shrink-0">{region ? t(region.labelKey) : p.bodyPart}</span>
                {readOnly ? (
                  <span className="font-bold" style={{ color: intensityColor(p.intensity) }}>{p.intensity}/10</span>
                ) : (
                  <>
                    <input
                      type="range" min={1} max={10} value={p.intensity}
                      onChange={e => setIntensity(p, Number(e.target.value))}
                      className="flex-1 accent-primary"
                    />
                    <span className="w-10 text-right font-bold" style={{ color: intensityColor(p.intensity) }}>{p.intensity}</span>
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}
      {!readOnly && value.length === 0 && (
        <p className="text-xs text-on-surface-variant text-center">{t('shared.bodyMap.tapHint')}</p>
      )}
    </div>
  );
}
