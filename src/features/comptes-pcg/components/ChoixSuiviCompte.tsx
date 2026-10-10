import { useCallback, useState } from 'react';
import { Text } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { PucesDefilantes } from '@/shared/components/PucesDefilantes';
import { SelectField } from '@/shared/components/SelectField';
import { lireArchiveStock } from '@/features/stock/repository';
import { compteAutorise, listesDuCompte } from '@/features/stock/services/structure';
import { categoriesDeLEtablissement } from '@/features/stock/utils/categories';
import type { ArchiveStock } from '@/features/stock/types';
import { commonStyles } from '@/shared/styles/commonStyles';
import { TEXTES } from '@/shared/textes';

export type SuiviCompte = 'inventaire' | 'service';

const T = TEXTES.comptesPcg.nouveauComptePcg;

/**
 * Ce qu'est un compte : un compte de service (une charge ou un produit), ou un compte inventorié, qui a sa liste dans une
 * catégorie de l'inventaire. Le numéro d'une catégorie (35, 33…) n'est pas celui d'un compte (701…, 602…) : chaque catégorie
 * dit les débuts de compte qu'elle accepte, et celle qui accepte le numéro saisi est proposée d'office.
 */
export function useSuiviCompte(numero: string) {
  const [suivi, setSuivi] = useState<SuiviCompte>('service');
  const [archive, setArchive] = useState<ArchiveStock | null>(null);
  const [categorieChoisie, setCategorieChoisie] = useState('');
  useFocusEffect(
    useCallback(() => {
      lireArchiveStock().then(setArchive);
    }, []),
  );
  const categories = categoriesDeLEtablissement(archive?.categories, archive?.reglagesCategories);
  const accepte = (c: (typeof categories)[number]) =>
    compteAutorise(c.categorie, numero.trim(), archive?.categories, archive?.reglagesCategories);
  const categorie =
    categories.find((c) => c.categorie === categorieChoisie) ?? categories.find(accepte) ?? categories[0];
  return {
    suivi,
    setSuivi,
    archive,
    categories,
    categorie,
    setCategorieChoisie,
    accepte,
    /** Le numéro saisi ne convient pas à la catégorie choisie (alors rien n'est ajouté à l'inventaire). */
    impossible: suivi === 'inventaire' && (!categorie || !accepte(categorie)),
    /** Le compte a déjà une liste dans l'inventaire (il est donc inventorié). */
    dejaInventorie: (numeroActuel: string) => !!archive && listesDuCompte(archive, numeroActuel).length > 0,
  };
}

type Etat = ReturnType<typeof useSuiviCompte>;

/** Les deux puces (l'une ou l'autre) et, pour un compte inventorié, la catégorie de l'inventaire qui reçoit sa liste. */
export function ChoixSuiviCompte({ etat, numero }: { etat: Etat; numero: string }) {
  const { suivi, setSuivi, categories, categorie, setCategorieChoisie, accepte } = etat;
  return (
    <>
      <PucesDefilantes<SuiviCompte>
        puces={(['inventaire', 'service'] as const).map((valeur) => ({ valeur, label: T.suivi[valeur] }))}
        valeur={suivi}
        onChoisir={setSuivi}
      />
      {suivi === 'inventaire' && categorie ? (
        <>
          <SelectField
            label={T.inventorieDans}
            value={categorie.categorie}
            onChange={setCategorieChoisie}
            options={categories.map((c) => ({
              value: c.categorie,
              label: T.categorieEtComptes(
                TEXTES.stock.enteteCategorie(c.classe, c.nom),
                c.prefixes.join(', '),
              ),
              shortLabel: TEXTES.stock.enteteCategorie(c.classe, c.nom),
            }))}
            aide={T.aideInventaire}
          />
          {numero.trim() && !accepte(categorie) ? (
            <Text style={commonStyles.required}>{T.numeroIncompatible(categorie.prefixes.join(', '))}</Text>
          ) : null}
        </>
      ) : null}
    </>
  );
}
