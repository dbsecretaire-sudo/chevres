import { accorder, vocabulaire } from '@/shared/dictionnaire/animaux';

const V = vocabulaire;

/** Textes de l'interface — « accueil ». À modifier ici uniquement. */
export const TEXTES_ACCUEIL = {
  accueil: {
    animauxVivants: 'Animaux vivants',
    dAlimentAnimalJour: 'd’aliment / animal / jour',
    soldeFactures: 'Solde factures',
    derniereVisiteVeterinaire: 'Dernière visite vétérinaire',
    actionsRapides: 'Actions rapides',
    cheptel: '+ Cheptel',
    comptabilite: '+ Comptabilité',
    sante: 'Santé et alimentation',
    aSavoir: 'À savoir',
    ajouterUnAnimal: 'Ajouter un animal',
    saisirUneEcriture: 'Saisir une écriture',
    repartitionAnimaux: (femelles: number, males: number, petits: number) =>
      `${femelles} ${accorder(V().femelle, femelles)} · ${males} ${accorder(V().male, males)} · ${petits} ${accorder(V().petit, petits)}`,
    aucuneVisiteEnregistreeCetteAnnee: 'Aucune visite enregistrée cette année',
  },
} as const;
