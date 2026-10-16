import { pont } from '@/bureau/pont';

/** expo-sharing sur l'ordinateur : « partager » un fichier, c'est choisir où l'enregistrer (le dossier s'ouvre ensuite). */
export const isAvailableAsync = async (): Promise<boolean> => true;

export async function shareAsync(uri: string, options?: { dialogTitle?: string }): Promise<void> {
  const chemin = uri.replace(/^file:\/\//, '');
  await pont().fichiers.enregistrerSous(chemin, chemin.split('/').pop() ?? '', options?.dialogTitle);
}
