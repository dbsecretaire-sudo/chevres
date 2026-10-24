import { useCallback, useMemo, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import {
  dernieresMisesBasParMere,
  listChevresHistorique,
  listChevresVivantes,
} from '@/features/cheptel/repository/chevres';
import type { Chevre } from '@/features/cheptel/types';
import { useEtablissement } from '@/features/etablissements/context/EtablissementContext';
import {
  CRITERES_PRECIS_VIDES,
  LABEL_CATEGORIE_FILTRE,
  LABEL_STATUT_VIDE,
  OPTIONS_CATEGORIE,
  OPTIONS_STATUT,
  filtrerEtTrierCheptel,
  matchCategorie,
  matchStatut,
  type CategorieFiltre,
  type CriteresPrecis,
  type StatutFiltre,
  type Tri,
} from '@/features/cheptel/utils/filtresCheptel';
import { FILTRE_CATEGORIE_CHEPTEL, FILTRE_STATUT_CHEPTEL, TRI_CHEPTEL } from '@/shared/constants/cheptel';
import { ETAT_CONSERVE } from '@/shared/constants/etatConserve';
import { useEtatConserve } from '@/features/etablissements/hooks/useEtatConserve';
import { TEXTES } from '@/shared/textes';

/** État de la liste du cheptel : chargement, filtres, tri, recherche et libellés dérivés. */
export function useListeCheptel() {
  // L'espèce active : la liste se recharge quand elle change, sans que l'écran soit recréé.
  const { espece } = useEtablissement();
  const [chevres, setChevres] = useState<Chevre[]>([]);
  const [misesBas, setMisesBas] = useState<Record<string, string>>({});
  // La recherche et les filtres sont gardés quand on ouvre une fiche : au retour sur la liste, ils sont toujours là.
  const [recherche, setRecherche] = useEtatConserve(ETAT_CONSERVE.CHEPTEL_RECHERCHE, '');
  const [statutFiltre, setStatutFiltre] = useEtatConserve<StatutFiltre>(
    ETAT_CONSERVE.CHEPTEL_STATUT,
    FILTRE_STATUT_CHEPTEL.VIVANTE,
  );
  const [categorieFiltre, setCategorieFiltre] = useEtatConserve<CategorieFiltre>(
    ETAT_CONSERVE.CHEPTEL_CATEGORIE,
    FILTRE_CATEGORIE_CHEPTEL.TOUT,
  );
  const [tri, setTri] = useEtatConserve<Tri>(ETAT_CONSERVE.CHEPTEL_TRI, TRI_CHEPTEL.BOUCLE);
  const [precis, setPrecis] = useEtatConserve<CriteresPrecis>(
    ETAT_CONSERVE.CHEPTEL_CRITERES,
    CRITERES_PRECIS_VIDES,
  );

  const charger = useCallback(async () => {
    const [vivantes, sorties, misesBasParMere] = await Promise.all([
      listChevresVivantes(),
      listChevresHistorique(),
      dernieresMisesBasParMere(),
    ]);
    setChevres([...vivantes, ...sorties]);
    setMisesBas(misesBasParMere);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [espece]);

  useFocusEffect(
    useCallback(() => {
      charger();
    }, [charger]),
  );

  /** Le tri « dernière mise bas » n'a de sens que pour les chèvres : il retombe sur la boucle sinon. */
  const triActif: Tri =
    categorieFiltre === FILTRE_CATEGORIE_CHEPTEL.CHEVRE || tri !== TRI_CHEPTEL.MISE_BAS
      ? tri
      : TRI_CHEPTEL.BOUCLE;

  const filtrees = useMemo(
    () =>
      filtrerEtTrierCheptel(
        chevres,
        { recherche, statutFiltre, categorieFiltre, triActif, ...precis },
        misesBas,
      ),
    [chevres, recherche, statutFiltre, categorieFiltre, triActif, precis, misesBas],
  );

  const majPrecis = (patch: Partial<CriteresPrecis>) => setPrecis((p) => ({ ...p, ...patch }));

  /** Vrai quand un filtre s'écarte de l'affichage d'origine (les vivantes, toutes catégories, triées par boucle). */
  const filtresActifs =
    statutFiltre !== FILTRE_STATUT_CHEPTEL.VIVANTE ||
    categorieFiltre !== FILTRE_CATEGORIE_CHEPTEL.TOUT ||
    tri !== TRI_CHEPTEL.BOUCLE ||
    Object.values(precis).some((v) => v !== '');
  /** Revient à l'affichage d'origine (la recherche reste : elle a son propre champ). */
  const reinitialiserFiltres = () => {
    setStatutFiltre(FILTRE_STATUT_CHEPTEL.VIVANTE);
    setCategorieFiltre(FILTRE_CATEGORIE_CHEPTEL.TOUT);
    setTri(TRI_CHEPTEL.BOUCLE);
    setPrecis(CRITERES_PRECIS_VIDES);
  };

  const optionsStatut = OPTIONS_STATUT.map((option) => ({
    ...option,
    label: `${option.label} (${
      option.value === FILTRE_STATUT_CHEPTEL.TOUT
        ? chevres.length
        : chevres.filter((c) => matchStatut(c, option.value)).length
    })`,
  }));

  const optionsCategorie = OPTIONS_CATEGORIE.map((option) => ({
    ...option,
    label: `${option.label} (${
      chevres.filter((c) => matchStatut(c, statutFiltre) && matchCategorie(c, option.value)).length
    })`,
  }));

  const suffixeStatut =
    statutFiltre === FILTRE_STATUT_CHEPTEL.TOUT ? '' : ` ${LABEL_STATUT_VIDE[statutFiltre]}`;
  const titreListeVide =
    categorieFiltre === FILTRE_CATEGORIE_CHEPTEL.TOUT
      ? TEXTES.cheptel.listeCheptel.aucunAnimalSuffixestatut(suffixeStatut)
      : TEXTES.cheptel.listeCheptel.aucunValeurSuffixestatut(
          LABEL_CATEGORIE_FILTRE[categorieFiltre],
          suffixeStatut,
        );

  return {
    filtrees,
    recherche,
    setRecherche,
    statutFiltre,
    setStatutFiltre,
    categorieFiltre,
    setCategorieFiltre,
    triActif,
    setTri,
    precis,
    majPrecis,
    filtresActifs,
    reinitialiserFiltres,
    optionsStatut,
    optionsCategorie,
    titreListeVide,
  };
}

export type EtatListeCheptel = ReturnType<typeof useListeCheptel>;
