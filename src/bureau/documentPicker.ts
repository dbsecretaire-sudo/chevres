import { pont } from '@/bureau/pont';
import { MIME_PAR_EXTENSION } from '@/shared/constants/fichiers';

interface Options {
  type?: string | string[];
  multiple?: boolean;
  copyToCacheDirectory?: boolean;
}

interface Resultat {
  canceled: boolean;
  assets: { uri: string; name: string; mimeType?: string }[];
}

/** Les extensions que demandent les types acceptés (« image/* » prend toutes les images ; « *\/* » : tout fichier). */
function extensionsDesTypes(types: string[]): string[] {
  if (types.length === 0 || types.includes('*/*')) return [];
  return Object.entries(MIME_PAR_EXTENSION)
    .filter(([, mime]) =>
      types.some((t) => t === mime || (t.endsWith('/*') && mime.startsWith(t.slice(0, -1)))),
    )
    .map(([extension]) => extension);
}

/** getDocumentAsync de expo-document-picker : le sélecteur de fichiers de Windows. */
export async function getDocumentAsync(options: Options = {}): Promise<Resultat> {
  const types = Array.isArray(options.type) ? options.type : options.type ? [options.type] : [];
  const choisis = await pont().fichiers.choisir(extensionsDesTypes(types), !!options.multiple);
  return {
    canceled: choisis.length === 0,
    assets: choisis.map((c) => ({ uri: c.chemin, name: c.nom })),
  };
}
