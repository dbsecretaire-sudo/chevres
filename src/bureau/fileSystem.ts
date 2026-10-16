import { pont } from '@/bureau/pont';

/** Les fonctions de expo-file-system (version « legacy ») que l'application utilise, faites par l'ordinateur. */
export const documentDirectory: string = pont().dossiers.documents;
export const cacheDirectory: string = pont().dossiers.cache;

export const EncodingType = { UTF8: 'utf8', Base64: 'base64' } as const;

interface OptionsLecture {
  encoding?: 'utf8' | 'base64';
}

/** Un chemin tel que le donne le sélecteur de fichiers (« file:// » éventuel retiré). */
const chemin = (uri: string): string => uri.replace(/^file:\/\//, '');

export const makeDirectoryAsync = (uri: string, _options?: { intermediates?: boolean }): Promise<void> =>
  pont().fichiers.creerDossier(chemin(uri));

export const copyAsync = ({ from, to }: { from: string; to: string }): Promise<void> =>
  pont().fichiers.copier(chemin(from), chemin(to));

export const readAsStringAsync = (uri: string, options?: OptionsLecture): Promise<string> =>
  pont().fichiers.lire(chemin(uri), options?.encoding === 'base64' ? 'base64' : 'utf8');

export const writeAsStringAsync = (uri: string, contenu: string, options?: OptionsLecture): Promise<void> =>
  pont().fichiers.ecrire(chemin(uri), contenu, options?.encoding === 'base64' ? 'base64' : 'utf8');

export const deleteAsync = (uri: string, _options?: { idempotent?: boolean }): Promise<void> =>
  pont().fichiers.supprimer(chemin(uri));

export const getInfoAsync = async (uri: string): Promise<{ exists: boolean; uri: string }> => ({
  exists: await pont().fichiers.existe(chemin(uri)),
  uri,
});
