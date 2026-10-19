import { useCallback, useEffect, useState } from 'react';
import { parseDecimal } from '@/shared/utils/nombres';
import { useFocusEffect } from 'expo-router';
import { lireArchiveStock } from '@/features/stock/repository';
import { lireArchiveCommercial } from '@/features/commercial/repository';
import { prixUnitaireEffectif } from '@/features/comptabilite/utils/prixPersonnalise';
import { prixDuTarif } from '@/features/commercial/services/commandes';
import { prixDesOeufs } from '@/features/stock/services/stock';
import { SelectField } from '@/shared/components/SelectField';
import type { EtatNouvelleEcriture } from '@/features/comptabilite/hooks/useNouvelleEcriture';
import { OPTIONS_TAUX_TVA } from '@/features/comptabilite/utils/tva';
import { CLE_PRIX_LAIT } from '@/shared/constants/stock';
import { TEXTES } from '@/shared/textes';

export type Props = { e: EtatNouvelleEcriture };


/**
 * Le prix total d'une vente dont le prix vient de l'inventaire : prix défini là × quantité, jamais saisi. Il se recalcule dès que
 * le prix (modifié à l'inventaire), la quantité ou le détail change ; sans prix défini, le total reste vide (et la vente bloquée).
 * `actif` faux : un autre calcul s'en charge (le poids d'un animal).
 */
export function useTotalVerrouille(
  e: EtatNouvelleEcriture,
  prixUnitaire: number | undefined,
  quantite: string,
  actif = true,
) {
  const { setMontant, prixLibre } = e;
  // Le prix personnalisé (exceptionnel) remplace celui de l'inventaire pour tous les produits de la facture.
  const prix = prixUnitaireEffectif(e, prixUnitaire);
  useEffect(() => {
    // Le prix d'un récolteur est libre : il se saisit, l'inventaire ne le fixe pas.
    if (!actif || prixLibre) return;
    const nombre = parseDecimal(quantite);
    setMontant(
      prix && nombre > 0
        ? (Math.round(prix * nombre * 100) / 100).toFixed(2).replace('.', ',')
        : '',
    );
  }, [actif, prixLibre, prix, quantite, setMontant]);
}

/**
 * Le prix d'un article (fromage, viande) pour le contact de la vente : celui de sa catégorie dans la grille de tarifs (un particulier et
 * un professionnel ne paient pas le même prix), à défaut le prix de l'inventaire.
 */
export function usePrixSelonLeContact(
  e: EtatNouvelleEcriture,
): (cle: string | undefined, prixInventaire: number | undefined) => number | undefined {
  const [tarifs, setTarifs] = useState<Record<string, Record<string, number>>>({});
  useFocusEffect(
    useCallback(() => {
      lireArchiveCommercial().then((archive) => setTarifs(archive.tarifs));
    }, []),
  );
  const categorie = e.clientSelectionne?.categorie;
  return (cle, prixInventaire) =>
    cle
      ? prixDuTarif(cle, categorie, tarifs, prixInventaire === undefined ? {} : { [cle]: prixInventaire })
      : prixInventaire;
}

/** Le prix de vente défini à l'inventaire pour le lait (€ le litre) ou l'œuf (€ pièce, 0,50 € d'office). */
export function usePrixInventaire(genre: 'lait' | 'oeufs'): number | undefined {
  const [prix, setPrix] = useState<number | undefined>();
  useFocusEffect(
    useCallback(() => {
      lireArchiveStock().then((archive) =>
        setPrix(genre === 'lait' ? archive.prix[CLE_PRIX_LAIT] : prixDesOeufs(archive)),
      );
    }, [genre]),
  );
  return prix;
}

export function ChampTauxTvaVente({ e }: Props) {
  return (
    <SelectField
      label={TEXTES.commun.general.tauxDeTva}
      value={e.tauxTvaVente}
      onChange={e.setTauxTvaVente}
      options={OPTIONS_TAUX_TVA}
    />
  );
}

