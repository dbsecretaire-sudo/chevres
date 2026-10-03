/** Textes de l'interface — « comptesPcg ». À modifier ici uniquement. */
export const TEXTES_COMPTES_PCG = {
  ficheComptePcg: {
    compteIntrouvable: 'Compte introuvable.',
    descriptionDeuxPoints: 'Description : ',
    cetteActionSupprimeraDefinitivementLe: (numero: string, libelle: string) =>
      `Cette action supprimera définitivement le compte ${numero} — ${libelle}.`,
  },
  listeComptesPcg: {
    nOuLibellePoints: 'N° ou libellé…',
    aucunCompte: 'Aucun compte',
    ajoutezDesComptesPcgPour:
      'Ajoutez des comptes PCG pour les retrouver rapidement dans une nouvelle écriture.',
  },
  nouveauComptePcg: {
    ex623000: 'ex: 623000',
    exPublicitePublications: 'ex: Publicité, publications',
  },
} as const;
