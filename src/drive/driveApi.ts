const API = 'https://www.googleapis.com/drive/v3';
const UPLOAD_API = 'https://www.googleapis.com/upload/drive/v3';
const FOLDER_MIME = 'application/vnd.google-apps.folder';

export interface DriveFile {
  id: string;
  name: string;
}

class DriveApiError extends Error {}

async function driveFetch(url: string, accessToken: string, init?: RequestInit): Promise<Response> {
  const res = await fetch(url, {
    ...init,
    headers: {
      ...(init?.headers ?? {}),
      Authorization: `Bearer ${accessToken}`,
    },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new DriveApiError(`Google Drive: ${res.status} ${res.statusText} — ${body}`);
  }
  return res;
}

export async function findFolder(
  accessToken: string,
  name: string,
  parentId?: string,
): Promise<DriveFile | undefined> {
  const parentClause = parentId ? ` and '${parentId}' in parents` : " and 'root' in parents";
  const q = encodeURIComponent(
    `name='${name.replace(/'/g, "\\'")}' and mimeType='${FOLDER_MIME}' and trashed=false${parentClause}`,
  );
  const res = await driveFetch(`${API}/files?q=${q}&fields=files(id,name)`, accessToken);
  const json = await res.json();
  return json.files?.[0];
}

export async function createFolder(
  accessToken: string,
  name: string,
  parentId?: string,
): Promise<DriveFile> {
  const res = await driveFetch(`${API}/files?fields=id,name`, accessToken, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name,
      mimeType: FOLDER_MIME,
      parents: parentId ? [parentId] : undefined,
    }),
  });
  return res.json();
}

export async function ensureFolder(
  accessToken: string,
  name: string,
  parentId?: string,
): Promise<DriveFile> {
  const existing = await findFolder(accessToken, name, parentId);
  if (existing) return existing;
  return createFolder(accessToken, name, parentId);
}

export async function findFile(
  accessToken: string,
  name: string,
  parentId: string,
): Promise<DriveFile | undefined> {
  const q = encodeURIComponent(
    `name='${name.replace(/'/g, "\\'")}' and trashed=false and '${parentId}' in parents`,
  );
  const res = await driveFetch(`${API}/files?q=${q}&fields=files(id,name)`, accessToken);
  const json = await res.json();
  return json.files?.[0];
}

export async function listFiles(accessToken: string, parentId: string): Promise<DriveFile[]> {
  const q = encodeURIComponent(`trashed=false and '${parentId}' in parents`);
  const res = await driveFetch(`${API}/files?q=${q}&fields=files(id,name)&pageSize=1000`, accessToken);
  const json = await res.json();
  return json.files ?? [];
}

export async function downloadFileText(accessToken: string, fileId: string): Promise<string> {
  const res = await driveFetch(`${API}/files/${fileId}?alt=media`, accessToken);
  return res.text();
}

const BOUNDARY = 'troupeau_chevres_boundary_9f3c1a';

export async function createFileWithText(
  accessToken: string,
  name: string,
  parentId: string,
  content: string,
): Promise<DriveFile> {
  const metadata = { name, parents: [parentId], mimeType: 'text/csv' };
  const body =
    `--${BOUNDARY}\r\n` +
    `Content-Type: application/json; charset=UTF-8\r\n\r\n` +
    `${JSON.stringify(metadata)}\r\n` +
    `--${BOUNDARY}\r\n` +
    `Content-Type: text/csv; charset=UTF-8\r\n\r\n` +
    `${content}\r\n` +
    `--${BOUNDARY}--`;

  const res = await driveFetch(
    `${UPLOAD_API}/files?uploadType=multipart&fields=id,name`,
    accessToken,
    {
      method: 'POST',
      headers: { 'Content-Type': `multipart/related; boundary=${BOUNDARY}` },
      body,
    },
  );
  return res.json();
}

export async function updateFileText(
  accessToken: string,
  fileId: string,
  content: string,
): Promise<void> {
  await driveFetch(`${UPLOAD_API}/files/${fileId}?uploadType=media`, accessToken, {
    method: 'PATCH',
    headers: { 'Content-Type': 'text/csv; charset=UTF-8' },
    body: content,
  });
}

export async function upsertFileText(
  accessToken: string,
  name: string,
  parentId: string,
  content: string,
): Promise<DriveFile> {
  const existing = await findFile(accessToken, name, parentId);
  if (existing) {
    await updateFileText(accessToken, existing.id, content);
    return existing;
  }
  return createFileWithText(accessToken, name, parentId, content);
}

export async function getAccountEmail(accessToken: string): Promise<string | undefined> {
  const res = await driveFetch(
    'https://www.googleapis.com/oauth2/v3/userinfo',
    accessToken,
  );
  const json = await res.json();
  return json.email;
}
