import AsyncStorage from '@react-native-async-storage/async-storage';
import { cleStockage } from '@/features/etablissements/repository';
import {
  definirChoixGroupesRecette,
  type CategorieAjoutee,
  type ChoixGroupesRecette,
} from '@/features/comptabilite/utils/choixGroupesRecette';
import { CLE_STOCKAGE } from '@/shared/constants/stockage';

const cle = () => cleStockage(CLE_STOCKAGE.GROUPES_RECETTE);

export interface ArchiveGroupesRecette {
  choix: ChoixGroupesRecette;
  ajoutees: CategorieAjoutee[];
}

/** Relit le choix de l'établissement actif et le met en mémoire (la liste des catégories de recette le suit). */
export async function chargerChoixGroupesRecette(): Promise<ArchiveGroupesRecette> {
  const raw = await AsyncStorage.getItem(cle());
  let archive: ArchiveGroupesRecette = { choix: {}, ajoutees: [] };
  try {
    const lu = raw ? (JSON.parse(raw) as Partial<ArchiveGroupesRecette>) : {};
    archive = {
      choix: lu.choix && typeof lu.choix === 'object' ? lu.choix : {},
      ajoutees: Array.isArray(lu.ajoutees) ? lu.ajoutees : [],
    };
  } catch {
    archive = { choix: {}, ajoutees: [] };
  }
  definirChoixGroupesRecette(archive.choix, archive.ajoutees);
  return archive;
}

/** Enregistre les catégories de recette cochées pour chaque espèce et celles que l'utilisateur a ajoutées. */
export async function enregistrerChoixGroupesRecette(
  choix: ChoixGroupesRecette,
  ajoutees: CategorieAjoutee[],
): Promise<void> {
  await AsyncStorage.setItem(cle(), JSON.stringify({ choix, ajoutees }));
  definirChoixGroupesRecette(choix, ajoutees);
}

/** La même chose sous le nom des autres archives (sauvegarde locale, Google Drive). */
export const lireArchiveGroupesRecette = chargerChoixGroupesRecette;

/** Remplace tout — utilisé par la restauration d'une sauvegarde et le tirage depuis Google Drive. */
export async function remplacerArchiveGroupesRecette(archive: ArchiveGroupesRecette): Promise<void> {
  await enregistrerChoixGroupesRecette(
    archive.choix && typeof archive.choix === 'object' ? archive.choix : {},
    Array.isArray(archive.ajoutees) ? archive.ajoutees : [],
  );
}
