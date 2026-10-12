/** Textes de l'interface — « comptesPcg ». À modifier ici uniquement. */
export const TEXTES_COMPTES_PCG = {
  ficheComptePcg: {
    compteIntrouvable: 'Compte introuvable.',
    descriptionDeuxPoints: 'Description : ',
    typeDeuxPoints: 'Type : ',
    retirerDeLInventaire: 'Retirer de l’inventaire ?',
    retraitMessage:
      'Le compte devient un compte de service : sa liste de l’inventaire est supprimée, avec ses articles (aucun mouvement n’y est enregistré).',
    retirer: 'Retirer',
    compteAvecMouvements: (numero: string) =>
      `Le compte ${numero} ne peut pas être supprimé ni retiré de l’inventaire : des mouvements de stock sont enregistrés sur ses listes.`,
    suppressionImpossible: 'Suppression impossible',
    retirerPourEspece: (espece: string) => `Retirer pour ${espece}`,
    retirerPourEspeceQuestion: (espece: string) => `Retirer ce compte pour ${espece} ?`,
    retirerPourEspeceMessage: (numero: string, libelle: string, espece: string) =>
      `Le compte ${numero} — ${libelle} ne sera plus proposé pour ${espece}. Il reste disponible pour les autres espèces.`,
    retireePour: (especes: string) => `Retiré pour : ${especes}`,
    retablir: 'Rétablir pour toutes les espèces',
    cetteActionSupprimeraDefinitivementLe: (numero: string, libelle: string) =>
      `Cette action supprimera définitivement le compte ${numero} — ${libelle}.`,
  },
  listeComptesPcg: {
    nOuLibellePoints: 'N° ou libellé…',
    aucunCompte: 'Aucun compte',
    ajoutezDesComptesPcgPour:
      'Ajoutez des comptes PCG pour les retrouver rapidement dans une nouvelle écriture.',
  },
  numeroDejaEnregistre: 'Ce numéro de compte est déjà enregistré.',
  nouveauComptePcg: {
    suivi: { inventaire: 'Inventaire', service: 'Service' },
    inventorieDans: 'Ce compte sera inventorié :',
    aideInventaire:
      'Une liste de ce nom est ajoutée à la catégorie choisie de l’inventaire, avec son décompte.',
    categorieEtComptes: (categorie: string, prefixes: string) => `${categorie} · comptes ${prefixes}`,
    numeroIncompatible: (prefixes: string) =>
      `Pour cette catégorie, le numéro doit avoir 6 chiffres et commencer par ${prefixes} (le numéro de la catégorie n’est pas celui du compte).`,
    ex623000: 'ex: 623000',
    exPublicitePublications: 'ex: Publicité, publications',
  },
} as const;
