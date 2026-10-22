/** Textes de l'interface — « rappels » de déclarations. À modifier ici uniquement. */
export const TEXTES_RAPPELS = {
  titre: 'Rappels',
  aucun: 'Rien à valider pour le moment.',
  genre: {
    rsa: 'Déclaration RSA',
    urssaf: 'Déclaration URSSAF',
  },
  trimestre: (rang: number, annee: number) => `${rang}${rang === 1 ? 'er' : 'e'} trimestre ${annee}`,
  ligne: (genre: string, periode: string) => `${genre} · ${periode}`,
  avant: (date: string) => `À faire avant le ${date}`,
  enRetard: (date: string) => `En retard : à faire avant le ${date}`,
  gerer: 'Gérer les rappels',
  historique: {
    titre: 'Historique des rappels',
    aucun: 'Aucun rappel validé pour le moment.',
    valide: 'Validé',
    rouvrir: 'Remettre à valider',
  },
  /** Les lots vendus dont le contrôle n'est pas ok : à rappeler (ligne du bloc de l'accueil). */
  lots: {
    libelle: (n: number) => `${n} lot${n > 1 ? 's' : ''} à rappeler`,
    detail: 'Vendus, contrôle non ok : ouvrir les rappels de lots',
    /** Un rappel de lot lancé, à valider quand il est fait. */
    rappel: (lot: string) => `Rappel de lot · ${lot}`,
    rappele: (date: string) => `Rappelé le ${date}`,
    validerQuestion: (lot: string) => `Valider le rappel du lot ${lot} ?`,
    validerMessage: 'Le rappel sera marqué comme fait.',
    valider: 'Valider',
  },
  /** L'envoi à la chambre d'agriculture du document de circulation (vert pour un achat, rose pour un abattoir ou une recette). */
  circulation: {
    envoi: (date: string, couleur: 'vert' | 'rose') => `Envoyer le document du ${date} (${couleur}) à la chambre d’agriculture`,
    nature: {
      achat: 'Achat d’animaux vivants',
      abattoir: 'Envoi à l’abattoir',
      vente: 'Vente d’animaux vivants',
    },
  },
  /** L'échantillon d'un plat préparé à envoyer à un laboratoire : l'intervalle se règle dans la liste des plats. */
  analysesPlats: {
    libelle: (plat: string) => `Analyse à envoyer · ${plat}`,
    avant: (date: string, lots: string) => `Échantillon (lots ${lots}) à envoyer avant le ${date}`,
    enRetard: (date: string, lots: string) => `En retard : échantillon (lots ${lots}) à envoyer avant le ${date}`,
    valider: 'Échantillon envoyé',
    regler: 'Intervalle entre les analyses',
    reglerAide: 'Tous les combien de jours un échantillon des plats en stock doit partir à un laboratoire. Demandez l’intervalle à la DDPP : sans lui, aucun rappel.',
    placeholder: 'ex : 90',
    invalide: 'Indiquez un nombre de jours entier.',
  },
  validerLeRappel: 'Marquer comme fait',
  reglages: {
    titre: 'Rappels de déclarations',
    rsa: 'Rappeler la déclaration trimestrielle du RSA',
    urssaf: 'Rappeler la déclaration mensuelle de l’URSSAF',
    aide: 'Un rappel s’affiche sur l’accueil à la fin de chaque période, jusqu’à ce que vous le validiez. Vous pouvez les désactiver.',
  },
} as const;
