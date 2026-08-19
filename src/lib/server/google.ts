import { google } from 'googleapis';
import { env } from '$env/dynamic/private';
import { Readable } from 'node:stream';
import { calcularRankings, TOTAL_JORNADAS } from '$lib/types';

const GOOGLE_SA_JSON = env.GOOGLE_SERVICE_ACCOUNT_JSON;
const SHEET_ID = env.SPREADSHEET_ID;

type SheetsInstance = ReturnType<typeof google.sheets>['spreadsheets'];
type DriveInstance = ReturnType<typeof google.drive>['v3'];

let _sheets: SheetsInstance | null = null;
let _drive: DriveInstance | null = null;

const CACHE_TTL = 30_000;
const _cache: Map<string, { data: unknown; ts: number }> = new Map();

function cacheGet<T>(key: string): T | null {
  const entry = _cache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.ts > CACHE_TTL) { _cache.delete(key); return null; }
  return entry.data as T;
}

function cacheSet(key: string, data: unknown) {
  _cache.set(key, { data, ts: Date.now() });
}

function cacheInvalidate(pattern?: string) {
  if (!pattern) { _cache.clear(); return; }
  for (const key of _cache.keys()) {
    if (key.startsWith(pattern)) _cache.delete(key);
  }
}

function getAuth() {
  const credentials = JSON.parse(GOOGLE_SA_JSON);
  return new google.auth.GoogleAuth({
    credentials,
    scopes: [
      'https://www.googleapis.com/auth/spreadsheets',
      'https://www.googleapis.com/auth/drive.file'
    ]
  });
}

export function getSheets(): SheetsInstance {
  if (!_sheets) {
    _sheets = google.sheets({ version: 'v4', auth: getAuth() }).spreadsheets;
  }
  return _sheets;
}

export function getDrive(): DriveInstance {
  if (!_drive) {
    _drive = google.drive({ version: 'v3', auth: getAuth() }).v3;
  }
  return _drive;
}

const SHEET_CONFIG = 'Config';
const SHEET_USUARIOS = 'Usuarios';
const SHEET_JORNADAS = 'Jornadas';
const JORNADAS_HEADERS = ['temporada', 'num_jornada', 'jugador', 'puntos', 'posicion', 'multa', 'created_at', 'created_by'];

async function getAllSheetNames(): Promise<string[]> {
  const cached = cacheGet<string[]>('sheetNames');
  if (cached) return cached;

  const sheets = getSheets();
  const res = await sheets.get({ spreadsheetId: SHEET_ID });
  const names = res.data.sheets?.map(s => s.properties?.title || '') || [];
  cacheSet('sheetNames', names);
  return names;
}

async function ensureSheetExists(title: string, headers: string[]) {
  const names = await getAllSheetNames();

  if (!names.includes(title)) {
    const sheets = getSheets();
    await sheets.batchUpdate({
      spreadsheetId: SHEET_ID,
      requestBody: {
        requests: [{ addSheet: { properties: { title } } }]
      }
    });
    await sheets.values.update({
      spreadsheetId: SHEET_ID,
      range: `${title}!A1`,
      valueInputOption: 'RAW',
      requestBody: { values: [headers] }
    });
    cacheInvalidate('sheetNames');
  }
}

async function ensureJornadasSheet() {
  const names = await getAllSheetNames();
  if (!names.includes(SHEET_JORNADAS)) {
    await ensureSheetExists(SHEET_JORNADAS, JORNADAS_HEADERS);
  }
}

let _baseSheetsEnsured = false;

async function ensureBaseSheets() {
  if (_baseSheetsEnsured) return;
  await ensureSheetExists(SHEET_CONFIG, ['key', 'value']);
  await ensureSheetExists(SHEET_USUARIOS, ['jugador', 'displayName', 'photoUrl', 'password', 'isAdmin']);
  await ensureJornadasSheet();
  _baseSheetsEnsured = true;
}

export async function getTemporadas(): Promise<string[]> {
  await ensureBaseSheets();
  const sheets = getSheets();

  try {
    const res = await sheets.values.get({ spreadsheetId: SHEET_ID, range: `${SHEET_JORNADAS}!A1:A5000` });
    const rows = res.data.values || [];
    if (rows.length < 2) return [];

    const header = rows[0].map((h: string) => String(h).trim().toLowerCase());
    const temporadaIdx = header.indexOf('temporada');
    if (temporadaIdx === -1) return [];

    const seasons = new Set<string>();
    for (let i = 1; i < rows.length; i++) {
      const temp = String(rows[i][temporadaIdx] || '').trim();
      if (temp) seasons.add(temp);
    }

    return Array.from(seasons).sort().reverse();
  } catch {
    return [];
  }
}

export async function getCurrentSeason(): Promise<string> {
  await ensureBaseSheets();
  const sheets = getSheets();
  const res = await sheets.values.get({
    spreadsheetId: SHEET_ID,
    range: `${SHEET_CONFIG}!A1:B100`
  });

  const rows = res.data.values || [];
  for (const row of rows) {
    if (row[0] === 'currentSeason') return row[1] || '';
  }

  const temporadas = await getTemporadas();
  return temporadas[0] || '';
}

export async function setCurrentSeason(temporada: string): Promise<void> {
  await ensureBaseSheets();
  const sheets = getSheets();
  const res = await sheets.values.get({
    spreadsheetId: SHEET_ID,
    range: `${SHEET_CONFIG}!A1:B100`
  });

  const rows = res.data.values || [];
  let found = false;

  for (let i = 0; i < rows.length; i++) {
    if (rows[i][0] === 'currentSeason') {
      const rowIdx = i + 1;
      await sheets.values.update({
        spreadsheetId: SHEET_ID,
        range: `${SHEET_CONFIG}!B${rowIdx}`,
        valueInputOption: 'RAW',
        requestBody: { values: [[temporada]] }
      });
      found = true;
      break;
    }
  }

  if (!found) {
    await sheets.values.append({
      spreadsheetId: SHEET_ID,
      range: `${SHEET_CONFIG}!A:B`,
      valueInputOption: 'RAW',
      requestBody: { values: [['currentSeason', temporada]] }
    });
  }

  cacheInvalidate('config');
}

export async function createSeason(temporada: string): Promise<void> {
  await ensureJornadasSheet();

  const usuarios = await readUsuarios();
  const jugadores = Object.keys(usuarios);

  if (jugadores.length > 0) {
    const sheets = getSheets();
    const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
    const rows: (string | number)[][] = [];

    for (const jugador of jugadores) {
      for (let j = 1; j <= 38; j++) {
        rows.push([temporada, j, jugador, 0, 0, 0, now, 'System']);
      }
    }

    const existing = await sheets.values.get({ spreadsheetId: SHEET_ID, range: `${SHEET_JORNADAS}!A1:H5000` });
    const existingRows = existing.data.values || [];
    const filtered = existingRows.filter((row: string[]) => row[0] !== temporada);
    const allRows = [...filtered, ...rows];

    await sheets.values.clear({ spreadsheetId: SHEET_ID, range: `${SHEET_JORNADAS}!A:H` });
    await sheets.values.update({
      spreadsheetId: SHEET_ID,
      range: `${SHEET_JORNADAS}!A1`,
      valueInputOption: 'RAW',
      requestBody: { values: [JORNADAS_HEADERS, ...allRows] }
    });
  }

  cacheInvalidate(`scores:${temporada}`);
  cacheInvalidate('sheetNames');
}

export async function readPuntuaciones(temporada: string): Promise<Record<string, Record<number, number>>> {
  const cacheKey = `scores:${temporada}`;
  const cached = cacheGet<Record<string, Record<number, number>>>(cacheKey);
  if (cached) return cached;

  await ensureJornadasSheet();
  const sheets = getSheets();

  try {
    const res = await sheets.values.get({ spreadsheetId: SHEET_ID, range: `${SHEET_JORNADAS}!A1:H5000` });
    const rows = res.data.values || [];
    if (rows.length < 2) return {};

    const header = rows[0].map((h: string) => String(h).trim().toLowerCase());
    const temporadaIdx = header.indexOf('temporada');
    const jornadaIdx = header.indexOf('num_jornada');
    const jugadorIdx = header.indexOf('jugador');
    const puntosIdx = header.indexOf('puntos');

    if (jornadaIdx === -1 || jugadorIdx === -1 || puntosIdx === -1) return {};

    const result: Record<string, Record<number, number>> = {};

    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (temporadaIdx >= 0 && row[temporadaIdx] !== temporada) continue;

      const jugador = row[jugadorIdx];
      const jornada = parseInt(row[jornadaIdx]);
      const puntos = parseFloat(String(row[puntosIdx]).replace(',', '.')) || 0;

      if (!jugador || isNaN(jornada) || jornada < 1 || jornada > TOTAL_JORNADAS) continue;

      if (!result[jugador]) result[jugador] = {};
      result[jugador][jornada] = puntos;
    }

    cacheSet(cacheKey, result);
    return result;
  } catch {
    return {};
  }
}

export async function writePuntuaciones(temporada: string, data: Record<string, Record<number, number>>): Promise<void> {
  await ensureJornadasSheet();
  const sheets = getSheets();
  const jugadores = Object.keys(data);

  if (jugadores.length === 0) return;

  const now = new Date().toISOString().slice(0, 19).replace('T', ' ');

  const existing = await sheets.values.get({ spreadsheetId: SHEET_ID, range: `${SHEET_JORNADAS}!A1:H5000` });
  const existingRows = existing.data.values || [];

  const filtered = existingRows.filter((row: string[]) => row[0] !== temporada);

  const newRows: (string | number)[][] = [];

  for (const jugador of jugadores) {
    const scores = data[jugador];
    for (const [jornadaStr, puntos] of Object.entries(scores)) {
      const jornada = parseInt(jornadaStr);
      if (jornada < 1 || jornada > TOTAL_JORNADAS) continue;

      const jornadaScores: Record<string, number> = {};
      for (const j of jugadores) {
        jornadaScores[j] = data[j]?.[jornada] ?? 0;
      }
      const rankings = calcularRankings(jornadaScores);
      const rank = rankings.find(r => r.jugador === jugador);

      newRows.push([
        temporada,
        jornada,
        jugador,
        puntos,
        rank?.posicion ?? 0,
        rank?.multa ?? 0,
        now,
        'App'
      ]);
    }
  }

  const allRows = [JORNADAS_HEADERS, ...filtered, ...newRows];

  await sheets.values.clear({ spreadsheetId: SHEET_ID, range: `${SHEET_JORNADAS}!A:H` });
  await sheets.values.update({
    spreadsheetId: SHEET_ID,
    range: `${SHEET_JORNADAS}!A1`,
    valueInputOption: 'RAW',
    requestBody: { values: allRows }
  });

  cacheInvalidate(`scores:${temporada}`);
}

export async function addJugadores(temporada: string, jugadores: string[]): Promise<void> {
  const existing = await readPuntuaciones(temporada);
  const newPlayers = jugadores.filter(j => !existing[j]);
  if (newPlayers.length === 0) return;

  await ensureJornadasSheet();
  const sheets = getSheets();

  const allJornadas = new Set<number>();
  for (const j of Object.keys(existing)) {
    for (const num of Object.keys(existing[j])) {
      allJornadas.add(Number(num));
    }
  }
  const jornadas = allJornadas.size > 0 ? Array.from(allJornadas).sort((a, b) => a - b) : [1];
  const now = new Date().toISOString().slice(0, 19).replace('T', ' ');

  const existing2 = await sheets.values.get({ spreadsheetId: SHEET_ID, range: `${SHEET_JORNADAS}!A1:H5000` });
  const existingRows = existing2.data.values || [];
  const filtered = existingRows.filter((row: string[]) => row[0] !== temporada);

  const newRows: (string | number)[][] = [];
  for (const jugador of newPlayers) {
    for (const jornada of jornadas) {
      newRows.push([temporada, jornada, jugador, 0, 0, 0, now, 'App']);
    }
  }

  const allRows = [JORNADAS_HEADERS, ...filtered, ...newRows];
  await sheets.values.clear({ spreadsheetId: SHEET_ID, range: `${SHEET_JORNADAS}!A:H` });
  await sheets.values.update({
    spreadsheetId: SHEET_ID,
    range: `${SHEET_JORNADAS}!A1`,
    valueInputOption: 'RAW',
    requestBody: { values: allRows }
  });

  cacheInvalidate(`scores:${temporada}`);
}

export async function readUsuarios(): Promise<Record<string, { displayName: string; photoUrl: string; password: string; isAdmin: boolean }>> {
  const cached = cacheGet<Record<string, { displayName: string; photoUrl: string; password: string; isAdmin: boolean }>>('usuarios');
  if (cached) return cached;

  await ensureBaseSheets();
  const sheets = getSheets();
  const res = await sheets.values.get({
    spreadsheetId: SHEET_ID,
    range: `${SHEET_USUARIOS}!A1:E100`
  });

  const rows = res.data.values || [];
  const result: Record<string, { displayName: string; photoUrl: string; password: string; isAdmin: boolean }> = {};

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const jugador = row[0];
    if (!jugador) continue;

    result[jugador] = {
      displayName: row[1] || jugador,
      photoUrl: row[2] || '',
      password: row[3] || '',
      isAdmin: row[4] === 'true'
    };
  }

  cacheSet('usuarios', result);
  return result;
}

const DEFAULT_PLAYERS = [
  { jugador: 'Ame FC', password: '1234' },
  { jugador: 'Mvg1712', password: '1234' },
  { jugador: 'Rakiticismo', password: '1234' },
  { jugador: 'Mariooon', password: '1234' },
  { jugador: 'Babin5', password: '1234' },
  { jugador: 'a|t0r', password: '1234' }
];

export async function seedDefaultUsers(): Promise<boolean> {
  const usuarios = await readUsuarios();
  if (Object.keys(usuarios).length > 0) return false;

  const sheets = getSheets();
  const rows = DEFAULT_PLAYERS.map(p => [p.jugador, p.jugador, '', p.password, 'true']);
  await sheets.values.append({
    spreadsheetId: SHEET_ID,
    range: `${SHEET_USUARIOS}!A:E`,
    valueInputOption: 'RAW',
    requestBody: { values: rows }
  });

  cacheInvalidate('usuarios');
  return true;
}

export async function updateUsuario(
  jugador: string,
  data: { displayName?: string; photoUrl?: string; password?: string; isAdmin?: boolean }
): Promise<void> {
  const sheets = getSheets();
  const usuarios = await readUsuarios();
  const jugadores = Object.keys(usuarios);
  const rowIdx = jugadores.indexOf(jugador) + 2;

  if (rowIdx < 2) {
    await sheets.values.append({
      spreadsheetId: SHEET_ID,
      range: `${SHEET_USUARIOS}!A:E`,
      valueInputOption: 'RAW',
      requestBody: {
        values: [[jugador, data.displayName || jugador, data.photoUrl || '', data.password || '', data.isAdmin ? 'true' : 'false']]
      }
    });
    return;
  }

  const current = usuarios[jugador];
  await sheets.values.update({
    spreadsheetId: SHEET_ID,
    range: `${SHEET_USUARIOS}!A${rowIdx}:E${rowIdx}`,
    valueInputOption: 'RAW',
    requestBody: {
      values: [[
        jugador,
        data.displayName ?? current.displayName,
        data.photoUrl ?? current.photoUrl,
        data.password || current.password,
        data.isAdmin !== undefined ? (data.isAdmin ? 'true' : 'false') : (current.isAdmin ? 'true' : 'false')
      ]]
    }
  });

  cacheInvalidate('usuarios');
}

export async function addUsuario(jugador: string, displayName: string, password: string): Promise<void> {
  const sheets = getSheets();
  await sheets.values.append({
    spreadsheetId: SHEET_ID,
    range: `${SHEET_USUARIOS}!A:E`,
    valueInputOption: 'RAW',
    requestBody: {
      values: [[jugador, displayName, '', password, 'true']]
    }
  });
  cacheInvalidate('usuarios');
}

export async function uploadPhotoToDrive(
  jugador: string,
  fileBuffer: ArrayBuffer,
  mimeType: string
): Promise<string> {
  const drive = getDrive();
  const ext = mimeType.split('/')[1] || 'png';
  const fileName = `avatar_${jugador.replace(/\s+/g, '_')}.${ext}`;

  const existing = await drive.files.list({
    q: `name='${fileName}' and trashed=false`,
    fields: 'files(id)'
  });

  const fileId = existing.data.files?.[0]?.id;

  if (fileId) {
    await drive.files.update({
      fileId,
      media: { mimeType, body: Readable.from(Buffer.from(fileBuffer)) }
    });
    return `https://drive.google.com/uc?id=${fileId}`;
  }

  const folderRes = await drive.files.list({
    q: `name='avatars' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
    fields: 'files(id)'
  });

  let folderId = folderRes.data.files?.[0]?.id;
  if (!folderId) {
    const newFolder = await drive.files.create({
      requestBody: {
        name: 'avatars',
        mimeType: 'application/vnd.google-apps.folder'
      },
      fields: 'id'
    });
    folderId = newFolder.data.id!;
  }

  const uploaded = await drive.files.create({
    requestBody: { name: fileName, parents: [folderId] },
    media: { mimeType, body: Readable.from(Buffer.from(fileBuffer)) },
    fields: 'id'
  });

  const newFileId = uploaded.data.id!;
  await drive.permissions.create({
    fileId: newFileId,
    requestBody: { role: 'reader', type: 'anyone' }
  });

  return `https://drive.google.com/uc?id=${newFileId}`;
}

export async function migrateFromLegacySheet(targetSeason: string): Promise<{ migrated: boolean; jugadores: number; jornadas: number; records: number }> {
  const sheets = getSheets();
  const allNames = await getAllSheetNames();
  const legacyName = allNames.find(n =>
    n !== SHEET_CONFIG &&
    n !== SHEET_USUARIOS &&
    n !== SHEET_JORNADAS &&
    !n.startsWith('Puntuaciones ')
  );

  if (!legacyName) return { migrated: false, jugadores: 0, jornadas: 0, records: 0 };

  const res = await sheets.values.get({
    spreadsheetId: SHEET_ID,
    range: `'${legacyName}'!A1:G1000`
  });

  const rows = res.data.values || [];
  if (rows.length < 2) return { migrated: false, jugadores: 0, jornadas: 0, records: 0 };

  const headers = rows[0].map(h => String(h).trim().toLowerCase());
  const jornadaIdx = headers.indexOf('num_jornada');
  const jugadorIdx = headers.indexOf('jugador');
  const puntosIdx = headers.indexOf('puntos');

  if (jornadaIdx === -1 || jugadorIdx === -1 || puntosIdx === -1) {
    return { migrated: false, jugadores: 0, jornadas: 0, records: 0 };
  }

  const matrix: Record<string, Record<number, number>> = {};
  let records = 0;

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const jugador = String(row[jugadorIdx] || '').trim();
    const jornada = parseInt(String(row[jornadaIdx] || '0'));
    const puntos = parseFloat(String(row[puntosIdx] || '0').replace(',', '.')) || 0;

    if (!jugador || jornada < 1 || jornada > 38) continue;

    if (!matrix[jugador]) matrix[jugador] = {};
    matrix[jugador][jornada] = puntos;
    records++;
  }

  const jugadores = Object.keys(matrix);
  const allJornadas = new Set<number>();
  for (const j of jugadores) {
    for (const num of Object.keys(matrix[j])) {
      allJornadas.add(Number(num));
    }
  }

  await writePuntuaciones(targetSeason, matrix);

  const current = await getCurrentSeason();
  if (!current) await setCurrentSeason(targetSeason);

  return { migrated: true, jugadores: jugadores.length, jornadas: allJornadas.size, records };
}

export async function deletePuntuacionesSheets(): Promise<number> {
  const sheets = getSheets();
  const allNames = await getAllSheetNames();
  const toDelete = allNames.filter(n => n.startsWith('Puntuaciones '));

  if (toDelete.length === 0) return 0;

  await sheets.batchUpdate({
    spreadsheetId: SHEET_ID,
    requestBody: {
      requests: toDelete.map(title => ({ deleteSheet: { sheetId: allNames.indexOf(title) } }))
    }
  });

  cacheInvalidate('sheetNames');
  return toDelete.length;
}
