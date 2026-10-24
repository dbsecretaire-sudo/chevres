import AsyncStorage from '@react-native-async-storage/async-storage';
import { cleStockagePour, type Etablissement } from '@/features/etablissements/repository';
import { ICONE_ETABLISSEMENT } from '@/shared/constants/etablissements';
import { rappelsDus } from '@/features/rappels/services/rappels';
import type { AppSettings, InfosExploitation } from '@/features/settings/settings';
import { normaliserArchiveStock } from '@/features/stock/repository';
import { lotsARappeler, lotsRappelesAValider } from '@/features/stock/services/lots';
import { libelleArticle } from '@/features/stock/services/stock';
import type { ArchiveStock } from '@/features/stock/types';
import type { ATraiter } from '@/features/a-traiter/types';
import { GENRE_A_TRAITER } from '@/shared/constants/aTraiter';
import { CLE_STOCKAGE } from '@/shared/constants/stockage';
import { formatDateShortFR } from '@/shared/utils/dates';
import { TEXTES } from '@/shared/textes';

const T = TEXTES.aTraiter;

/** Les déclarations à valider d'un établissement (RSA trimestriel), d'après ses réglages. */
export function aTraiterRappels(
  infos: InfosExploitation | undefined,
  aujourdhui: string,
  etablissement: Pick<Etablissement, 'id' | 'nom'>,
): ATraiter[] {
  return rappelsDus(aujourdhui, {
    desactives: infos?.rappelsDesactives,
    valides: infos?.rappelsValides,
  }).map((r) => ({
    id: `rappel:${etablissement.id}:${r.id}`,
    etablissementId: etablissement.id,
    etablissementNom: etablissement.nom,
    genre: GENRE_A_TRAITER.RAPPEL_FISCAL,
    enRetard: r.enRetard,
    libelle: r.libelle,
    cibleId: r.genre,
  }));
}

/**
 * Les lots à rappeler : une ligne qui dit combien de lots vendus ont un contrôle non ok, puis une ligne par rappel déjà lancé qui
 * attend d'être validé.
 */
export function aTraiterLots(
  archive: ArchiveStock,
  etablissement: Pick<Etablissement, 'id' | 'nom'>,
): ATraiter[] {
  const nombre = lotsARappeler(archive).length;
  const aValider = lotsRappelesAValider(archive).map<ATraiter>((l) => ({
    id: `lot:${etablissement.id}:${l.id}`,
    etablissementId: etablissement.id,
    etablissementNom: etablissement.nom,
    genre: GENRE_A_TRAITER.RAPPEL_LOT_A_VALIDER,
    libelle: T.rappelDeLot(
      `${libelleArticle(l.article, archive)} · ${l.numero}`,
      formatDateShortFR(l.dateRappel),
    ),
    cibleId: l.id,
  }));
  if (nombre === 0) return aValider;
  return [
    {
      id: `lots:${etablissement.id}`,
      etablissementId: etablissement.id,
      etablissementNom: etablissement.nom,
      genre: GENRE_A_TRAITER.LOTS_A_RAPPELER,
      enRetard: true,
      libelle: T.lots(nombre),
      cibleId: etablissement.id,
    },
    ...aValider,
  ];
}

async function lireJson<T>(etablissementId: string, suffixe: string): Promise<T | undefined> {
  const brut = await AsyncStorage.getItem(cleStockagePour(etablissementId, suffixe));
  if (!brut) return undefined;
  try {
    return JSON.parse(brut) as T;
  } catch {
    return undefined;
  }
}

/**
 * Ce qui attend dans chacun de ces établissements. Lit les données de chacun directement (sans le rendre actif) : on peut ainsi
 * tout montrer avant d'en ouvrir un.
 */
export async function lireATraiter(etablissements: Etablissement[], aujourdhui: string): Promise<ATraiter[]> {
  const groupes = await Promise.all(
    etablissements.map(async (etablissement) => {
      const [reglages, stock] = await Promise.all([
        lireJson<AppSettings>(etablissement.id, CLE_STOCKAGE.SETTINGS),
        lireJson<Partial<ArchiveStock>>(etablissement.id, CLE_STOCKAGE.STOCK),
      ]);
      const lignes = [
        ...aTraiterRappels(reglages?.exploitation, aujourdhui, etablissement),
        ...(stock ? aTraiterLots(normaliserArchiveStock(stock), etablissement) : []),
      ];
      // Les genres dans l'ordre des constantes.
      const ordre: string[] = Object.values(GENRE_A_TRAITER);
      return lignes
        .map((ligne) => ({
          ...ligne,
          icone: ICONE_ETABLISSEMENT,
          enRetard: ligne.enRetard ?? false,
        }))
        .sort((a, b) => ordre.indexOf(a.genre) - ordre.indexOf(b.genre));
    }),
  );
  return groupes.flat();
}
