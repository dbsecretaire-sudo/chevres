import { getYears } from '@/shared/storage/localStore';
import { CATEGORIE_STOCKAGE } from '@/shared/constants/stockage';

// Toutes les années connues, toutes catégories confondues (pour le sélecteur d'année)
export async function toutesLesAnneesConnues(): Promise<number[]> {
  const groups = await Promise.all([
    getYears(CATEGORIE_STOCKAGE.CHEPTEL),
    getYears(CATEGORIE_STOCKAGE.VISITES_VETERINAIRE),
    getYears(CATEGORIE_STOCKAGE.FACTURES),
    getYears(CATEGORIE_STOCKAGE.VENTES),
    getYears(CATEGORIE_STOCKAGE.CONTROLES),
  ]);
  const set = new Set<number>(groups.flat());
  set.add(new Date().getFullYear());
  return Array.from(set).sort((a, b) => b - a);
}
