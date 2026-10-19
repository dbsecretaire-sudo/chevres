import { capitaliser, vocabulaire } from '@/shared/dictionnaire/animaux';

const V = vocabulaire;
const Cap = capitaliser;

export const naissancesTextes = {
  /** Où en sont aujourd'hui les petits des naissances montrées : vivants, vendus, à l'abattoir, auto-consommés, morts. */
  repartition: (r: { vivants: number; vendus: number; abattoir: number; autoconsommes: number; morts: number }) =>
    [
      [r.vivants, r.vivants > 1 ? 'vivants' : 'vivant'],
      [r.vendus, r.vendus > 1 ? 'vendus' : 'vendu'],
      [r.abattoir, 'à l’abattoir'],
      [r.autoconsommes, r.autoconsommes > 1 ? 'auto-consommés' : 'auto-consommé'],
      [r.morts, r.morts > 1 ? 'morts' : 'mort'],
    ]
      .filter(([n]) => (n as number) > 0)
      .map(([n, libelle]) => `${n} ${libelle}`)
      .join(' · '),
  bilan: (naissances: number, meres: number) =>
    `${naissances} naissance${naissances > 1 ? 's' : ''} · ${meres} mère${meres > 1 ? 's' : ''}`,
  aucuneNaissanceEnregistree: 'Aucune naissance enregistrée',
  declarezUneNaissanceDepuisL: "Déclarez une naissance depuis l'onglet Cheptel.",
  mereEspace: 'Mère ',
  get cabri() {
    return V().petit.singulier;
  },
  naissanceNotes: (notes: string) => `Naissance: ${notes}`,
  sansBoucleSexe: (sexe: unknown) => `sans boucle (${sexe})`,
  /** Le carnet de mise bas imprimable. */
  carnetBouton: 'Carnet de mise bas (PDF)',
  carnetLivretBouton: 'Carnet à imprimer (livret à plier)',
  carnetLivretAide: 'À imprimer en A4 portrait, recto verso (retourner sur le bord long), puis à couper en deux et à plier : un livret A6, comme le carnet papier.',
  carnet: {
    titre: 'Carnet de mise bas',
    fichier: 'carnet_mise_bas',
    fichierLivret: 'carnet_mise_bas_livret',
    aucune: 'Aucune mise bas enregistrée.',
    inconnue: 'inconnue',
    donnees: 'Mes données personnelles',
    nom: 'NOM',
    prenom: 'PRÉNOM',
    adresse: 'ADRESSE',
    tel: 'Tél',
    exploitation: 'Numéro d’exploitation',
    siret: 'Numéro Siret',
    coordonnees: 'Coordonnées utiles',
    groupement: 'Groupement et Technicien',
    veterinaire: 'Vétérinaire',
    veterinaireSanitaire: 'Vétérinaire sanitaire',
    inseminateur: 'Inséminateur',
    // Les observations s'écrivent en une lettre, comme sur le carnet papier (R, A…) ; la légende est sous le tableau.
    renouvellement: 'R',
    poidsKg: (poids: number) => `${String(poids).replace('.', ',')} kg`,
    jours: (n: number) => `${n} j`,
    mois: (n: number) => `${n} mois`,
    statuts: {
      mortNe: 'MN',
      vendue: 'V',
      abattoir: 'A',
      autoconsommee: 'C',
    },
    legende: 'R : renouvellement · A : abattoir · V : vendu · C : consommé · MN : mort-né',
    colonnes: {
      date: 'Date',
      numero: (petit: string) => `N° ${petit}`,
      mere: 'N° mère',
      pere: 'N° père',
      sexe: 'Sexe',
      observations: 'Observations',
      age: 'Âge départ / mort',
      poids: 'Poids départ',
    },
    resultats: {
      titre: 'Résultats de production',
      taux: 'Calculs des taux',
      misesALaReproduction: (femelles: string) => `Nombre de ${femelles} mises à la reproduction`,
      avorte: (femelles: string) => `Nombre de ${femelles} ayant avorté`,
      misBas: (femelles: string) => `Nombre de ${femelles} ayant mis bas`,
      nes: (petits: string) => `Nombre de ${petits} nés`,
      morts: (petits: string) => `Nombre de ${petits} morts`,
      vivants: (petits: string) => `Nombre de ${petits} vivants`,
      simples: 'Simples',
      doubles: 'Doubles',
      triples: 'Triples et plus',
      naissance: 'Naissance',
      premiereSemaine: '1° semaine',
      avantSevrage: 'Avant sevrage',
      avantDepart: 'Avant départ',
      total: 'Total',
      fertilite: 'Taux de fertilité',
      prolificite: 'Taux de prolificité',
      productivite: 'Taux de productivité',
      mortalite: 'Taux de mortalité',
      formuleFertilite: (femelles: string) => `${Cap(femelles)} ayant mis bas / ${femelles} mises à la reproduction`,
      formuleProlificite: (petits: string, femelles: string) => `${Cap(petits)} nés / ${femelles} ayant mis bas`,
      formuleProductivite: (petits: string, femelles: string) =>
        `${Cap(petits)} vendus + ${petits} gardés reproducteurs / ${femelles} mises à la reproduction`,
      formuleMortalite: (petits: string) => `${Cap(petits)} morts / ${petits} nés`,
      aCompleter: (femelles: string) =>
        `Les ${femelles} mises à la reproduction sont celles du lot de mise à la reproduction de l’année (Lots d’animaux) : les femelles qui ont mis bas et toutes celles à leur majorité sexuelle (6 mois) et vivantes à la date d’une mise bas de l’année. Le nombre de ${femelles} ayant avorté est celui du lot « Avortements » de l’année (Lots d’animaux, ou le bouton de la fiche de l’animal) ; sans lot, à écrire à la main.`,
    },
  },
} as const;
