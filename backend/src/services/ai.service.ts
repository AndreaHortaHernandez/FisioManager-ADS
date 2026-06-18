import { execFile } from 'child_process';
import { promises as fs, readdirSync, existsSync } from 'fs';
import path from 'path';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);

const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL ?? 'http://localhost:11434';
const OLLAMA_URL = `${OLLAMA_BASE_URL.replace(/\/$/, '')}/api/generate`;
const OLLAMA_MODEL = process.env.OLLAMA_MODEL ?? 'gemma4:e2b';

function findFfmpegBinDir(): string | undefined {
  const localAppData = process.env.LOCALAPPDATA;
  if (!localAppData) return undefined;

  const wingetBase = path.join(localAppData, 'Microsoft', 'WinGet', 'Packages');
  try {
    const packages = readdirSync(wingetBase);
    const ffmpegPkg = packages.find(p => p.toLowerCase().startsWith('gyan.ffmpeg'));
    if (!ffmpegPkg) return undefined;

    const pkgDir = path.join(wingetBase, ffmpegPkg);
    const builds = readdirSync(pkgDir);
    for (const build of builds) {
      const binDir = path.join(pkgDir, build, 'bin');
      if (existsSync(path.join(binDir, 'ffmpeg.exe'))) return binDir;
    }
  } catch {}
  return undefined;
}

const FFMPEG_BIN_DIR = findFfmpegBinDir();
if (FFMPEG_BIN_DIR) {
  console.log('[AI] ffmpeg encontrado en:', FFMPEG_BIN_DIR);
} else {
  console.warn('[AI] ffmpeg no encontrado en WinGet — asumiendo que está en PATH');
}

function buildEnv() {
  if (!FFMPEG_BIN_DIR) return process.env;
  return { ...process.env, PATH: `${FFMPEG_BIN_DIR};${process.env.PATH ?? ''}` };
}

export async function transcribeAudio(audioFilePath: string): Promise<string> {
  const outputDir = path.dirname(audioFilePath);
  const baseName  = path.basename(audioFilePath, path.extname(audioFilePath));
  const txtPath   = path.join(outputDir, `${baseName}.txt`);

  console.log('[Whisper] Transcribiendo:', audioFilePath);

  try {
    const { stdout, stderr } = await execFileAsync('python', [
      '-m', 'whisper',
      audioFilePath,
      '--model', 'tiny',
      '--language', 'es',
      '--output_format', 'txt',
      '--output_dir', outputDir,
      '--fp16', 'False',
    ], { timeout: 120_000, env: buildEnv() });

    if (stdout) console.log('[Whisper] stdout:', stdout.slice(0, 500));
    if (stderr) console.log('[Whisper] stderr:', stderr.slice(0, 500));

    const text = await fs.readFile(txtPath, 'utf-8');
    await fs.unlink(txtPath).catch(() => {});
    return text.trim();
  } catch (err: any) {
    console.error('[Whisper] Error al transcribir:');
    console.error('  message:', err?.message);
    console.error('  stdout:', err?.stdout?.slice(0, 500));
    console.error('  stderr:', err?.stderr?.slice(0, 500));
    return '';
  }
}

export async function generateProgressInsight(
  streak: number,
  weeklyCompleted: number,
  recentFeedbacks: { painLevel: number; emotionalState: string }[],
): Promise<string> {
  if (recentFeedbacks.length === 0) return '';

  const painList = recentFeedbacks.map(f => f.painLevel).join(', ');
  const emotions = recentFeedbacks.map(f => f.emotionalState).join(', ');

  const prompt = `Eres un asistente de fisioterapia motivacional. Genera un mensaje personalizado y alentador en español (máximo 2 oraciones) para un paciente con este progreso:
- Racha activa: ${streak} día(s) consecutivos
- Sesiones completadas esta semana: ${weeklyCompleted}/5
- Niveles de dolor recientes: ${painList}
- Estados emocionales recientes: ${emotions}

Sé específico con los datos. Solo el mensaje, sin introducciones ni formato.`;

  try {
    const res = await fetch(OLLAMA_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: OLLAMA_MODEL, prompt, stream: false }),
      signal: AbortSignal.timeout(6_000),
    });
    if (!res.ok) return '';
    const data = await res.json() as { response?: string };
    return (data.response ?? '').trim();
  } catch {
    return '';
  }
}

export async function generateClinicalSummary(transcript: string): Promise<string> {
  if (!transcript) return '';

  const prompt = `Eres un asistente clínico de fisioterapia. El siguiente es el reporte verbal de un paciente sobre su sesión de ejercicios:

"${transcript}"

Genera un resumen clínico conciso en español (máximo 3 oraciones) para el terapeuta. Destaca: nivel de dolor reportado, progreso percibido y cualquier preocupación mencionada. Solo el resumen, sin introducciones.`;

  try {
    const res = await fetch(OLLAMA_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: OLLAMA_MODEL, prompt, stream: false }),
      signal: AbortSignal.timeout(60_000),
    });

    if (!res.ok) throw new Error(`Ollama respondió ${res.status}`);
    const data = await res.json() as { response?: string };
    return (data.response ?? '').trim();
  } catch (err) {
    console.error('[Ollama] Error al generar resumen:', err);
    return '';
  }
}
