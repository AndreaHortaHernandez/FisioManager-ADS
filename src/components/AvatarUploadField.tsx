import { useRef, useState } from 'react';
import { Camera, Loader2 } from 'lucide-react';
import { resolveUploadUrl } from '../utils/url';

interface AvatarUploadFieldProps {
  avatarUrl?: string | null;
  name?: string;
  onUpload: (file: File) => Promise<void>;
}

export function AvatarUploadField({ avatarUrl, name, onUpload }: AvatarUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  async function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError('');
    try {
      await onUpload(file);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  }

  const resolvedUrl = resolveUploadUrl(avatarUrl);

  return (
    <div className="flex items-center gap-4">
      <div className="relative w-16 h-16 shrink-0">
        {resolvedUrl ? (
          <img src={resolvedUrl} alt={name ?? 'avatar'} className="w-16 h-16 rounded-full object-cover" />
        ) : (
          <div className="w-16 h-16 rounded-full bg-primary-container flex items-center justify-center text-primary font-display font-bold text-xl">
            {name?.[0]?.toUpperCase() ?? '?'}
          </div>
        )}
        {uploading && (
          <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center">
            <Loader2 size={20} className="text-white animate-spin" />
          </div>
        )}
      </div>
      <div>
        <button type="button" onClick={() => inputRef.current?.click()} disabled={uploading}
          className="flex items-center gap-1.5 text-sm px-3 py-2 rounded-xl bg-surface-container hover:bg-surface-container-high transition-colors disabled:opacity-50">
          <Camera size={15} /> {resolvedUrl ? 'Cambiar foto' : 'Subir foto'}
        </button>
        <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleChange} />
        {error && <p className="text-xs text-error mt-1">{error}</p>}
      </div>
    </div>
  );
}
