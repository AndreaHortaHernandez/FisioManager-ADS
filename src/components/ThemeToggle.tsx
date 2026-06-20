import { useState } from 'react';
import { Sun, Moon, Monitor } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { getTheme, setTheme, type Theme } from '../lib/theme';
import { cn } from '../utils/cn';

const ORDER: Theme[] = ['light', 'dark', 'system'];
const ICON = { light: Sun, dark: Moon, system: Monitor } as const;

export function ThemeToggle({ className }: { className?: string }) {
  const { t } = useTranslation();
  const [theme, setThemeState] = useState<Theme>(getTheme());
  const Icon = ICON[theme];

  function cycle() {
    const next = ORDER[(ORDER.indexOf(theme) + 1) % ORDER.length];
    setTheme(next);
    setThemeState(next);
  }

  return (
    <button
      onClick={cycle}
      aria-label={t('common.theme')}
      title={t(`common.theme_${theme}`)}
      className={cn('p-2 rounded-full text-on-surface-variant hover:bg-surface-container transition-colors', className)}
    >
      <Icon size={22} />
    </button>
  );
}

export function ThemeSelector() {
  const { t } = useTranslation();
  const [theme, setThemeState] = useState<Theme>(getTheme());

  function choose(next: Theme) {
    setTheme(next);
    setThemeState(next);
  }

  return (
    <div className="flex items-center gap-3">
      <span className="text-sm">{t('common.theme')}</span>
      <div className="flex gap-1 bg-surface-container rounded-full p-1">
        {ORDER.map(opt => {
          const Icon = ICON[opt];
          return (
            <button
              key={opt}
              onClick={() => choose(opt)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm transition-colors',
                theme === opt ? 'bg-primary text-on-primary' : 'text-on-surface-variant hover:bg-surface-container-high'
              )}
            >
              <Icon size={15} /> {t(`common.theme_${opt}`)}
            </button>
          );
        })}
      </div>
    </div>
  );
}
