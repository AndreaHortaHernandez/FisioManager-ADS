import { describe, it, expect } from 'vitest';
import { resolveUploadUrl } from '../url';

describe('resolveUploadUrl', () => {
  it('devuelve undefined cuando no hay url', () => {
    expect(resolveUploadUrl()).toBeUndefined();
    expect(resolveUploadUrl(null)).toBeUndefined();
  });

  it('respeta las URLs absolutas', () => {
    expect(resolveUploadUrl('https://cdn.example.com/a.png')).toBe('https://cdn.example.com/a.png');
  });

  it('antepone el origen del backend a las rutas relativas', () => {
    expect(resolveUploadUrl('/uploads/doc-1.pdf')).toMatch(/\/uploads\/doc-1\.pdf$/);
  });
});
