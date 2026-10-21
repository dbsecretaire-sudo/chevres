import { useState } from 'react';
import { animalAcheteVide, type AnimalAcheteForm } from '@/features/comptabilite/forms/animauxAchetes';
import { ligneAlimentVide, type LigneAlimentForm } from '@/features/comptabilite/forms/lignesAlimentation';
import { lignesChambreParDefaut, type LigneChambreForm } from '@/features/comptabilite/forms/lignesChambre';
import { ligneCarburantVide, type LigneCarburantForm } from '@/features/comptabilite/forms/lignesCarburant';
import { ligneMarchandiseVide, type LigneMarchandiseForm } from '@/features/comptabilite/forms/lignesMarchandises';
import { ligneProductionVide, type LigneProductionForm } from '@/features/comptabilite/forms/lignesProduction';
import type { LigneVeterinaire } from '@/features/comptabilite/types';

/**
 * Les lignes saisies d'une dépense (facture reçue), une liste par sorte de dépense : aliments, marchandises d'un gîte, carburant,
 * fournitures de production, articles de la Chambre d'agriculture, actes du vétérinaire, animaux achetés ou envoyés à l'abattoir.
 */
export function useLignesDepense() {
  const [lignesAlimentation, setLignesAlimentation] = useState<LigneAlimentForm[]>([ligneAlimentVide()]);
  const [lignesMarchandises, setLignesMarchandises] = useState<LigneMarchandiseForm[]>([ligneMarchandiseVide()]);
  const [lignesCarburant, setLignesCarburant] = useState<LigneCarburantForm[]>([ligneCarburantVide()]);
  /** Une dépense « Animaux vivants » : les animaux achetés (leurs fiches se créent à l'enregistrement). */
  const [animauxAchetes, setAnimauxAchetes] = useState<AnimalAcheteForm[]>([animalAcheteVide()]);
  /** Une dépense « Animaux vivants (vente) » : les animaux du cheptel qui partent (leur fiche passe à « abattoir »). */
  const [animauxEnvoyes, setAnimauxEnvoyes] = useState<string[]>([]);
  /** Une dépense « Animaux vivants (vente) » : le lot d'abattoir qu'elle facture (créé avant, avec le document de circulation) ; sans lot, pas de facture. */
  const [lotId, setLotId] = useState<string | undefined>(undefined);
  /** Achat de production : le détail par fourniture. */
  const [lignesProduction, setLignesProduction] = useState<LigneProductionForm[]>([ligneProductionVide()]);
  /** Les articles d'une facture de la Chambre d'agriculture (forfait d'identification, équarrissage ATM, conseils et analyses). */
  const [lignesChambre, setLignesChambre] = useState<LigneChambreForm[]>(lignesChambreParDefaut);
  /** Une dépense vétérinaire : tout ce qui a été fait lors de la visite (pour le carnet sanitaire). */
  const [lignesVeterinaire, setLignesVeterinaire] = useState<LigneVeterinaire[]>([]);

  /** Vide ce qui est propre à une écriture (après « Enregistrer et en ajouter une autre ») ; la Chambre et le vétérinaire se gardent. */
  const reinitialiserLesLignes = () => {
    setLignesAlimentation([ligneAlimentVide()]);
    setLignesMarchandises([ligneMarchandiseVide()]);
    setLignesCarburant([ligneCarburantVide()]);
    setLignesProduction([ligneProductionVide()]);
    setAnimauxAchetes([animalAcheteVide()]);
    setAnimauxEnvoyes([]);
    setLotId(undefined);
  };

  return {
    lignesAlimentation,
    setLignesAlimentation,
    lignesMarchandises,
    setLignesMarchandises,
    lignesCarburant,
    setLignesCarburant,
    animauxAchetes,
    setAnimauxAchetes,
    animauxEnvoyes,
    setAnimauxEnvoyes,
    lotId,
    setLotId,
    lignesProduction,
    setLignesProduction,
    lignesChambre,
    setLignesChambre,
    lignesVeterinaire,
    setLignesVeterinaire,
    reinitialiserLesLignes,
  };
}
