import { creerChevre, supprimerChevre } from '@/features/cheptel/repository/chevres';
import { enregistrerLaDepense } from '@/features/comptabilite/hooks/nouvelleEcriture/enregistrement';
import { supprimerFacture } from '@/features/comptabilite/repository/factures';
import type { Facture } from '@/features/comptabilite/types';
import { CATEGORIE_DEPENSE, SEPARATEUR_ANIMAUX, TYPE_FACTURE } from '@/shared/constants/comptabilite';
import type { SEXE } from '@/shared/constants/cheptel';
import type { ValeurDe } from '@/shared/constants/valeurDe';
import { getSettings, updateSettings } from '@/features/settings/settings';
import { noterAEnvoyer } from '@/shared/storage/aEnvoyer';
import { generateId } from '@/shared/utils/id';

/** Ce qu'on saisit pour un achat : la boucle (facultative), le sexe, le vendeur, la date, et le prix (facultatif). */
interface SaisieAchat {
  boucle: string;
  sexe: ValeurDe<typeof SEXE>;
  vendeur: string;
  date: string;
  /** Sans prix : l'animal entre au cheptel, sans dépense en comptabilité (on pourra la saisir plus tard). */
  prix?: number;
  activite: Facture['activite'];
}

/**
 * Un achat : l'animal entre au cheptel à la date de l'achat, chez ce vendeur. Avec un prix, la dépense « animaux vivants » est enregistrée
 * (c'est elle qui crée la fiche, comme dans le mode avancé) ; sans prix, seule la fiche est créée.
 * Rend ce qu'il faut pour annuler l'achat.
 */
export async function enregistrerAchat(saisie: SaisieAchat): Promise<{ chevreIds: string[]; factureId?: string; entreeId?: string }> {
  const boucle = saisie.boucle.trim();
  const vendeur = saisie.vendeur.trim();
  if (saisie.prix !== undefined && saisie.prix > 0) {
    const facture = await enregistrerLaDepense(
      {
        date: saisie.date,
        type: TYPE_FACTURE.RECUE,
        tiers: vendeur,
        description: boucle ? `Achat d’un animal, boucle ${boucle}` : 'Achat d’un animal',
        montant: Math.round(saisie.prix * 100) / 100,
        categorieDepense: CATEGORIE_DEPENSE.ANIMAUX_VIVANTS,
        activite: saisie.activite,
      },
      {
        date: saisie.date,
        tiers: vendeur,
        achatAnimaux: true,
        animauxAchetes: [{ key: generateId(), boucle, sexe: saisie.sexe, naissance: '' }],
        envoiAnimaux: false,
        animauxEnvoyes: [],
      },
    );
    await noterAEnvoyer();
    return { chevreIds: (facture.animauxAchetes ?? '').split(SEPARATEUR_ANIMAUX).filter(Boolean), factureId: facture.id };
  }
  const fiche = await creerChevre({
    numeroBoucle: boucle || undefined,
    sexe: saisie.sexe,
    dateNaissance: '',
    dateEntree: saisie.date,
    vendeur: vendeur || undefined,
  });
  // Sans prix, pas de dépense : c'est l'entrée qui porte le document de circulation (si l'animal a une boucle).
  let entreeId: string | undefined;
  if (boucle) {
    entreeId = generateId();
    const reglages = await getSettings();
    const entreesAnimaux = [
      ...(reglages.exploitation?.entreesAnimaux ?? []),
      { id: entreeId, date: saisie.date, boucle, vendeur: vendeur || undefined, activite: saisie.activite },
    ];
    await updateSettings({ exploitation: { ...reglages.exploitation, entreesAnimaux } });
  }
  await noterAEnvoyer();
  return { chevreIds: [fiche.id], entreeId };
}

/** Annule un achat enregistré par erreur : la fiche créée et la dépense, s'il y en avait une, sont retirées. */
export async function annulerAchat(ids: { chevreIds: string[]; factureId?: string; entreeId?: string }): Promise<void> {
  if (ids.factureId) await supprimerFacture(ids.factureId);
  for (const id of ids.chevreIds) await supprimerChevre(id);
  if (ids.entreeId) {
    const reglages = await getSettings();
    const entreesAnimaux = (reglages.exploitation?.entreesAnimaux ?? []).filter((e) => e.id !== ids.entreeId);
    await updateSettings({ exploitation: { ...reglages.exploitation, entreesAnimaux } });
  }
  await noterAEnvoyer(-1);
}
