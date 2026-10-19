import { useCallback, useMemo, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { useAccueil } from '@/features/accueil/hooks/useAccueil';
import {
  autonomieAliments,
  construireMinuteurs,
  enTranshumance,
  progressionPapiers,
  prochaineEcheance,
  type DeclarationAFaire,
} from '@/features/accueil/services/fermeAccueil';
import { categorieAccueil } from '@/features/accueil/services/statsAccueil';
import { listChevresVivantes, listTousLesAnimauxDeLEspece } from '@/features/cheptel/repository/chevres';
import type { Chevre } from '@/features/cheptel/types';
import { listToutesVentes } from '@/features/comptabilite/repository/ventes';
import { joursAbattusAFacturer } from '@/features/comptabilite/utils/animauxVendus';
import { useEtablissement } from '@/features/etablissements/context/EtablissementContext';
import { useInconsommables } from '@/features/exploitation/hooks/useInconsommables';
import { useSanteDuTroupeau } from '@/features/exploitation/hooks/useSanteDuTroupeau';
import { useAppSettings } from '@/features/settings/context/AppSettingsContext';
import { useRappelsCirculation } from '@/features/rappels/hooks/useRappelsCirculation';
import { useRappels } from '@/features/rappels/hooks/useRappels';
import { destinationRappel } from '@/features/rappels/services/destination';
import { lireArchiveStock } from '@/features/stock/repository';
import { useLotsARappeler } from '@/features/stock/hooks/useLotsARappeler';
import { articlesDuGenre } from '@/features/stock/services/stock';
import { CATEGORIE_ANIMAL } from '@/shared/constants/cheptel';
import { GENRE_ARTICLE } from '@/shared/constants/stock';
import { GENRE_RAPPEL } from '@/shared/constants/rappels';
import { especeCourante } from '@/shared/dictionnaire/animaux';
import { todayISO } from '@/shared/utils/dates';

/** Le nom court d'une déclaration à faire : « RSA », « URSSAF », ou le nom de l'échéance. */
const NOM_COURT: Record<string, string> = { [GENRE_RAPPEL.RSA]: 'RSA', [GENRE_RAPPEL.URSSAF]: 'URSSAF' };

/** Les jours d'abattage dont la viande n'est pas encore facturée à un client (le nombre), relus à chaque retour sur l'écran. */
function useLotsAFacturer(): number {
  const { espece } = useEtablissement();
  const inconsommables = useInconsommables();
  const [jours, setJours] = useState<Chevre[][]>([]);
  useFocusEffect(
    useCallback(() => {
      Promise.all([listTousLesAnimauxDeLEspece(), listToutesVentes()])
        .then(([animaux, ventes]) => setJours(joursAbattusAFacturer(animaux, ventes).map((j) => j.animaux)))
        .catch(() => undefined);
    }, [espece]),
  );
  // Seuls les animaux à boucle (non écartés du lot) se facturent ; sans boucle, la vente se fait sans facture.
  return jours.filter((animaux) => animaux.some((a) => !!a.numeroBoucle?.trim() && !inconsommables.has(a.id))).length;
}

/** Jusqu'à quatre animaux qui représentent le troupeau dans l'enclos : une femelle, un mâle, un petit, une autre femelle. */
export function animauxVedettes(vivants: readonly Chevre[]): Chevre[] {
  const parBoucle = (a: Chevre, b: Chevre) => (a.numeroBoucle ?? '').localeCompare(b.numeroBoucle ?? '');
  const de = (categorie: string) => vivants.filter((c) => categorieAccueil(c) === categorie).sort(parBoucle);
  const femelles = de(CATEGORIE_ANIMAL.CHEVRE);
  const boucs = de(CATEGORIE_ANIMAL.BOUC);
  const petits = de(CATEGORIE_ANIMAL.CABRIT);
  return [femelles[0], boucs[0], petits[0], femelles[1]].filter((a): a is Chevre => !!a);
}

/** Tout ce que l'accueil « ferme » montre, rassemblé : le bandeau, la barre des papiers, les minuteurs, l'enclos. */
export function useFermeAccueil() {
  const accueil = useAccueil();
  const sante = useSanteDuTroupeau();
  const { rappels, valides } = useRappels();
  const envois = useRappelsCirculation(valides);
  const { aRappeler, aValider } = useLotsARappeler();
  const lotsAFacturer = useLotsAFacturer();
  const { espece } = useEtablissement();
  const { settings } = useAppSettings();
  // La transhumance de l'année en cours : le décor de la ferme passe à la montagne entre la montée et la descente.
  const aujourdhui = todayISO();
  const estive = settings.exploitation?.estives?.[aujourdhui.slice(0, 4)];
  const enEstive = enTranshumance(estive, aujourdhui);

  const [aliments, setAliments] = useState<{ kg: number; jours?: number } | null>(null);
  const [vedettes, setVedettes] = useState<Chevre[]>([]);
  useFocusEffect(
    useCallback(() => {
      lireArchiveStock()
        .then((archive) => {
          const articles = new Set(articlesDuGenre(GENRE_ARTICLE.ALIMENT, archive, especeCourante()).map((a) => a.cle));
          setAliments(autonomieAliments(archive.mouvements, articles, todayISO()));
        })
        .catch(() => undefined);
      listChevresVivantes()
        .then((vivants) => setVedettes(animauxVedettes(vivants)))
        .catch(() => undefined);
    }, [espece]),
  );

  const declarations: DeclarationAFaire[] = useMemo(
    () =>
      rappels.map((r) => ({
        id: r.id,
        libelle: NOM_COURT[r.genre] ?? r.libelle,
        titre: r.libelle,
        echeance: r.echeance,
        enRetard: r.enRetard,
        route: r.cible ?? destinationRappel(r.genre),
      })),
    [rappels],
  );
  const bilan = sante.avecBilan ? sante.bilan : undefined;
  const minuteurs = useMemo(
    () =>
      construireMinuteurs({
        aujourdhui: todayISO(),
        finLait: sante.finLait,
        finViande: sante.finViande,
        bilan,
        declarations,
        documentsAEnvoyer: envois.length,
        lotsAFacturer,
        lotsARappeler: aRappeler + aValider.length,
      }),
    [sante.finLait, sante.finViande, bilan, declarations, envois.length, lotsAFacturer, aRappeler, aValider.length],
  );
  const papiers = progressionPapiers({
    annee: accueil.annee,
    valides,
    restants: [...rappels.map((r) => r.id), ...envois.map((r) => r.id)],
    bilan,
  });

  return {
    annee: accueil.annee,
    annees: accueil.annees,
    setAnneeActive: accueil.setAnneeActive,
    stats: accueil.stats,
    minuteurs,
    prochaine: prochaineEcheance(minuteurs),
    papiers,
    aliments,
    vedettes,
    /** Le troupeau est à l'estive (aux dates de la déclaration de transhumance) : sa zone et sa date de descente. */
    estive: enEstive ? { zone: estive?.zone, descente: estive?.dateDescente } : undefined,
    lotsAFacturer,
    lotsARappeler: aRappeler + aValider.length,
    /** Les animaux en délai d'attente (lait et viande confondus). */
    delais: sante.nombreLait + sante.nombreViande,
    nombreDeRappels: rappels.length + envois.length + (aRappeler > 0 ? 1 : 0) + aValider.length,
  };
}
