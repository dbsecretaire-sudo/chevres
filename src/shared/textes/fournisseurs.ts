/** Textes de l'interface — « fournisseurs ». À modifier ici uniquement. */
export const TEXTES_FOURNISSEURS = {
  ficheFournisseur: {
    fournisseurIntrouvable: 'Fournisseur introuvable.',
    nomDEntrepriseDeuxPoints: 'Nom d’entreprise : ',
    contactDeuxPoints: 'Contact : ',
    siretDeuxPoints: 'SIRET : ',
    tvaIntracommunautaireDeuxPoints: 'TVA intracommunautaire : ',
    ribDeuxPoints: 'RIB : ',
    totalPayeACeFournisseur: 'Total payé à ce fournisseur',
    totalAvecAutreDeuxPoints: 'Total avec Autre : ',
    aucuneEcritureLieeACe: 'Aucune écriture liée à ce fournisseur pour l’instant.',
    cetteActionSupprimeraDefinitivementLa: (nomEntreprise: string) =>
      `Cette action supprimera définitivement la fiche de ${nomEntreprise}. Les factures déjà enregistrées ne sont pas modifiées.`,
  },
  listeFournisseurs: {
    nomEntrepriseSiretPoints: 'Nom, entreprise, SIRET…',
    aucunFournisseur: 'Aucun fournisseur',
    ajoutezVosFournisseursPourLes:
      'Ajoutez vos fournisseurs pour les retrouver rapidement dans une nouvelle facture.',
    nomValeurSiretSiret: (nom: string, valeur: string, siret: string) => `${nom}${valeur} · SIRET ${siret}`,
  },
  nouveauFournisseur: {
    exCooperativeAgricoleDuNord: 'ex: Coopérative agricole du Nord',
    nomDuContact: 'Nom du contact',
    numeroRueCodePostalVille: 'Numéro, rue, code postal, ville',
    t14Chiffres: '14 chiffres',
    facultatifIbanBic: 'Facultatif — IBAN / BIC',
  },
} as const;
