import {
  CHARSET_UTF8,
  DRIVE_API_URL,
  DRIVE_BOUNDARY,
  DRIVE_TAILLE_PAGE,
  DRIVE_UPLOAD_API_URL,
  GOOGLE_USERINFO_URL,
  MIME_CSV,
  MIME_DOSSIER_DRIVE,
  MIME_JSON,
} from '@/shared/constants/google';

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
    `name='${name.replace(/'/g, "\\'")}' and mimeType='${MIME_DOSSIER_DRIVE}' and trashed=false${parentClause}`,
  );
  const res = await driveFetch(`${DRIVE_API_URL}/files?q=${q}&fields=files(id,name)`, accessToken);
  const json = await res.json();
  return json.files?.[0];
}

export async function createFolder(accessToken: string, name: string, parentId?: string): Promise<DriveFile> {
  const res = await driveFetch(`${DRIVE_API_URL}/files?fields=id,name`, accessToken, {
    method: 'POST',
    headers: { 'Content-Type': MIME_JSON },
    body: JSON.stringify({
      name,
      mimeType: MIME_DOSSIER_DRIVE,
      parents: parentId ? [parentId] : undefined,
    }),
  });
  return res.json();
}

export async function ensureFolder(accessToken: string, name: string, parentId?: string): Promise<DriveFile> {
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
  const res = await driveFetch(`${DRIVE_API_URL}/files?q=${q}&fields=files(id,name)`, accessToken);
  const json = await res.json();
  return json.files?.[0];
}

export async function listFiles(accessToken: string, parentId: string): Promise<DriveFile[]> {
  const q = encodeURIComponent(`trashed=false and '${parentId}' in parents`);
  const res = await driveFetch(
    `${DRIVE_API_URL}/files?q=${q}&fields=files(id,name)&pageSize=${DRIVE_TAILLE_PAGE}`,
    accessToken,
  );
  const json = await res.json();
  return json.files ?? [];
}

export async function downloadFileText(accessToken: string, fileId: string): Promise<string> {
  const res = await driveFetch(`${DRIVE_API_URL}/files/${fileId}?alt=media`, accessToken);
  return res.text();
}

export async function createFileWithText(
  accessToken: string,
  name: string,
  parentId: string,
  content: string,
): Promise<DriveFile> {
  const metadata = { name, parents: [parentId], mimeType: MIME_CSV };
  const body =
    `--${DRIVE_BOUNDARY}\r\n` +
    `Content-Type: ${MIME_JSON}; ${CHARSET_UTF8}\r\n\r\n` +
    `${JSON.stringify(metadata)}\r\n` +
    `--${DRIVE_BOUNDARY}\r\n` +
    `Content-Type: ${MIME_CSV}; ${CHARSET_UTF8}\r\n\r\n` +
    `${content}\r\n` +
    `--${DRIVE_BOUNDARY}--`;

  const res = await driveFetch(
    `${DRIVE_UPLOAD_API_URL}/files?uploadType=multipart&fields=id,name`,
    accessToken,
    {
      method: 'POST',
      headers: { 'Content-Type': `multipart/related; boundary=${DRIVE_BOUNDARY}` },
      body,
    },
  );
  return res.json();
}

export async function updateFileText(accessToken: string, fileId: string, content: string): Promise<void> {
  await driveFetch(`${DRIVE_UPLOAD_API_URL}/files/${fileId}?uploadType=media`, accessToken, {
    method: 'PATCH',
    headers: { 'Content-Type': `${MIME_CSV}; ${CHARSET_UTF8}` },
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
  const res = await driveFetch(GOOGLE_USERINFO_URL, accessToken);
  const json = await res.json();
  return json.email;
}
