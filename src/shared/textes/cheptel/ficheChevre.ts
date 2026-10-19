import { capitaliser, vocabulaire } from '@/shared/dictionnaire/animaux';

const V = vocabulaire;
const Cap = capitaliser;

export const ficheChevreTextes = {
  menu: 'Menu de la fiche',
  get chevreIntrouvable() {
    return `${Cap(V().femelle.singulier)} introuvable.`;
  },
  le: 'le',
  /** La section Santé de la fiche : les visites vétérinaires et les contrôles de l'animal. */
  sante: {
    titre: (nombre: number) => `Santé (${nombre})`,
    aucun: (animal: string) => `Aucune visite vétérinaire ni aucun contrôle enregistré pour ${animal}.`,
    visite: 'Visite',
    controle: 'Contrôle',
    rapportEssais: (numero?: string) => (numero ? `Rapport d’essais n° ${numero}` : 'Rapport d’essais'),
  },
  get ajouterUnCabri() {
    return `Ajouter un ${V().petit.singulier}`;
  },
  nDeBoucleDeuxPoints: 'N° de boucle : ',
  dateDeBouclageDeuxPoints: 'Date de bouclage : ',
  /** La boucle rouge et le rebouclage n'ont pas de numéro : seulement la date. */
  dateBouclageRouge: 'Date bouclage (boucle rouge)',
  /** Les libellés courts du formulaire, où les trois dates de pose sont côte à côte. */
  dateBoucleRougeCourt: 'Boucle rouge',
  dateRebouclageCourt: 'Rebouclage',
  dateBouclageRougeDeuxPoints: 'Date bouclage (boucle rouge) : ',
  dateRebouclage: 'Date rebouclage (boucle de rebouclage)',
  dateRebouclageDeuxPoints: 'Date rebouclage (boucle de rebouclage) : ',
  sexeDeuxPoints: 'Sexe : ',
  dateDeSortie: 'Date de sortie',
  enregistrerLaDate: 'Enregistrer la date',
  poids: 'Poids (kg)',
  poidsAbattoir: 'Poids donné par l’abattoir (kg)',
  poidsAide: 'Facultatif : par exemple le poids de carcasse donné par l’abattoir. Il s’écrit dans le carnet de mise bas.',
  poidsDeuxPoints: 'Poids : ',
  poidsKg: (poids: number) => `${String(poids).replace('.', ',')} kg`,
  dateDeNaissanceDeuxPoints: 'Date de naissance : ',
  nDeBoucleDeLaDeuxPoints: 'N° de boucle de la mère :',
  notesDeuxPoints: 'Notes : ',
  leEspace: 'le ',
  /** Règle d'or : tout tiptag de cabri est destiné à l'abattoir. */
  destineAAbattoir: 'Destiné à l’abattoir',
  tiptagAbattoir: 'Tiptag : ce cabri est destiné à l’abattoir.',
  /** Les onglets de la fiche d'un animal. */
  onglets: {
    fiche: 'Fiche',
    sante: 'Santé',
    suivi: 'Reproduction',
  },
  aucuneDescendance: 'Aucune descendance enregistrée.',
  ascendance: 'Ascendance',
  mereHorsCheptel: 'Cette mère n’est pas dans le cheptel.',
  pereHorsCheptel: 'Ce père n’est pas dans le cheptel.',
  parentInconnu: 'Aucune / inconnue',
  choisirLaMere: 'Choisir la mère',
  choisirLePere: 'Choisir le père',
  retirerLeParent: 'Retirer',
  declarerDeuxPoints: 'Déclarer : ',
  remettreDansLeCheptelActif: 'Remettre dans le cheptel actif',
  /** La carte de sortie d'un animal sorti : date et retour au cheptel actif, verrouillés d'office. */
  sortie: {
    titreAvecDate: (statut: string, date: string) => `${statut} le ${date}`,
    voirLaFacture: (facture: string) => `Facture du client : ${facture}`,
    figee: 'Cet animal est dans un lot d’abattoir vendu : sa sortie est figée. Pour la modifier, supprimez d’abord la facture du client.',
    deverrouiller: 'Déverrouiller pour modifier',
    verrouiller: 'Verrouiller',
    aideVerrou: 'Verrouillé pour éviter les erreurs : le cadenas permet de corriger la date de sortie ou de remettre l’animal dans le cheptel actif.',
  },
  reactivationQuestion: 'Remettre cet animal dans le cheptel actif ?',
  reactivationMessage: (statut: string) =>
    `Voulez-vous vraiment remettre cet animal dans le cheptel actif ? Il n’aura plus de date de sortie (statut « ${statut} »). Si vous vouliez seulement corriger la date de sortie ou de décès, annulez et modifiez-la dans « Date de sortie ».`,
  descendance: 'Descendance',
  contrairementAValeurAbattoirValeur2: (
    valeur: string,
    valeur2: string,
    valeur3: string,
    valeur4: string,
    valeur5: string,
  ) =>
    `Contrairement à « ${valeur} / Abattoir / ${valeur2} », cette action efface complètement la fiche de ${valeur3} — elle ne sera plus enregistrée du tout. Utilisez plutôt « Déclarer ${valeur4} / abattoir / ${valeur5} » si vous voulez garder une trace. Cette suppression est irréversible.`,
  leNBoucleEstDeja: (boucle: string) => `Le n° ${boucle} est déjà attribué à une autre chèvre.`,
  renouvellementRenouvellementannee: (renouvellementAnnee: number) =>
    `Renouvellement ${renouvellementAnnee}`,
  nee: 'Née',
  ne: 'Né',
  envoyeALAbattoir: 'Envoyé à l’abattoir',
  envoyeeALAbattoir: 'Envoyée à l’abattoir',
} as const;
