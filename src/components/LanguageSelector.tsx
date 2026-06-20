import { useTranslation } from 'react-i18next';
import { Languages } from 'lucide-react';
import { setLanguage } from '../i18n';

export function LanguageSelector() {
  const { t, i18n } = useTranslation();
  return (
    <div className="flex items-center gap-3">
      <Languages size={18} className="text-primary" />
      <span className="text-sm">{t('common.language')}</span>
      <select
        value={i18n.language}
        onChange={e => setLanguage(e.target.value)}
        className="bg-surface-container border border-surface-container-high rounded-lg px-3 py-1.5 text-sm"
      >
        <option value="es">{t('common.spanish')}</option>
        <option value="en">{t('common.english')}</option>
      </select>
    </div>
  );
}
