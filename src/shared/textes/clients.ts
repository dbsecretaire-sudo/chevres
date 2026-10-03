/** Textes de l'interface — « clients ». À modifier ici uniquement. */
export const TEXTES_CLIENTS = {
  ficheClient: {
    clientIntrouvable: 'Client introuvable.',
    telephoneDeuxPoints: 'Téléphone : ',
    emailDeuxPoints: 'Email : ',
    resume: 'Résumé',
    laitVendu: 'Lait vendu',
    fromageVendu: 'Fromage vendu',
    cabrisVendus: 'Cabris vendus',
    aidesSubventions: 'Aides / subventions',
    totalPayeParCeClient: 'Total payé par ce client',
    aucuneEcritureLieeACe: 'Aucune écriture liée à ce client pour l’instant.',
    cetteActionSupprimeraDefinitivementLa: (nom: string, valeur: string) =>
      `Cette action supprimera définitivement la fiche de ${nom}${valeur}. Les ventes déjà enregistrées ne sont pas modifiées.`,
    masquerLesDetails: 'Masquer les détails',
    voirLesDetails: 'Voir les détails',
    kgcabrisKg: (kgCabris: number) => ` (${kgCabris} kg)`,
  },
  listeClients: {
    nomTelephoneEmailPoints: 'Nom, téléphone, email…',
    aucunClient: 'Aucun client',
    ajoutezVosClientsPourLes: 'Ajoutez vos clients pour les retrouver rapidement dans une nouvelle vente.',
  },
  nouveauClient: {
    nomDuClient: 'Nom du client',
  },
} as const;
