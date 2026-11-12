import type { Chevre } from '@/features/cheptel/types';
import type { Client } from '@/features/clients/types';
import { declarerStatutChevre, reactiverChevre } from '@/features/cheptel/repository/chevres';
import { enregistrerLaVente } from '@/features/comptabilite/hooks/nouvelleEcriture/enregistrement';
import { supprimerVente } from '@/features/comptabilite/repository/ventes';
import { getSettings, updateSettings } from '@/features/settings/settings';
import { CATEGORIE_VENTE, TYPE_CHOIX_FACTURE, UNITE_VENTE } from '@/shared/constants/comptabilite';
import { CIRCUIT_VENTE } from '@/shared/constants/commercial';
import { STATUT_CHEVRE } from '@/shared/constants/cheptel';
import { tauxTvaDeLaVente } from '@/shared/dictionnaire/tauxParProduit';
import { noterAEnvoyer } from '@/shared/storage/aEnvoyer';
import { generateId } from '@/shared/utils/id';
import { nomComplet } from '@/shared/utils/personne';

/** Ce qu'on saisit pour une vente vivante : la date, le prix, et l'acheteur (sans lui, le document de circulation n'a pas où se ranger). */
interface SaisieVenteVivante {
  activite: Parameters<typeof enregistrerLaVente>[0]['activite'];
  date: string;
  prix: number;
  client: Client;
}

/** Les ventes enregistrées ici : la vente d'animaux vivants (pour le document de circulation), la recette, et la sortie du cheptel. Rend l'identifiant de la recette. */
export async function enregistrerVenteVivante(animal: Chevre, saisie: SaisieVenteVivante): Promise<{ venteId: string; recetteId: string }> {
  const boucle = (animal.numeroBoucle ?? '').trim();
  const venteId = generateId();

  // La vente d'animaux vivants : c'est elle que le suivi des documents de circulation regarde.
  const reglages = await getSettings();
  const ventesVivants = [
    ...(reglages.exploitation?.ventesVivants ?? []),
    { id: venteId, date: saisie.date, boucles: boucle, contactCle: saisie.client.id },
  ];
  await updateSettings({ exploitation: { ...reglages.exploitation, ventesVivants } });

  // La recette : une vente sans facture (« au noir »), rattachée à la vente d'animaux vivants.
  const recette = await enregistrerLaVente({
    activite: saisie.activite,
    date: saisie.date,
    categorie: CATEGORIE_VENTE.ANIMAL_VIVANT,
    quantite: 1,
    unite: UNITE_VENTE.PIECE,
    prix: Math.round(saisie.prix * 100) / 100,
    tauxTva: tauxTvaDeLaVente(CATEGORIE_VENTE.ANIMAL_VIVANT),
    client: nomComplet(saisie.client),
    choixFacture: TYPE_CHOIX_FACTURE.SANS_FACTURE,
    circuit: CIRCUIT_VENTE.FERME,
    lotId: venteId,
  });

  // La chèvre vendue vivante quitte le cheptel.
  await declarerStatutChevre(animal.id, STATUT_CHEVRE.VENDUE, saisie.date);
  await noterAEnvoyer();
  return { venteId, recetteId: recette.id };
}

/** Annule une vente vivante enregistrée par erreur : la recette, la vente d'animaux et le statut de la chèvre reviennent à leur état d'avant. */
export async function annulerVenteVivante(animal: Chevre, ids: { venteId: string; recetteId: string }): Promise<void> {
  await supprimerVente(ids.recetteId);
  const reglages = await getSettings();
  const ventesVivants = (reglages.exploitation?.ventesVivants ?? []).filter((v) => v.id !== ids.venteId);
  await updateSettings({ exploitation: { ...reglages.exploitation, ventesVivants } });
  await reactiverChevre(animal.id);
  await noterAEnvoyer(-1);
}
