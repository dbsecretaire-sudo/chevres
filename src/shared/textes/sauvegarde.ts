import { vocabulaire } from '@/shared/dictionnaire/animaux';
import { modeEntreprise } from '@/shared/dictionnaire/entreprise';

const V = vocabulaire;

/** Textes de l'interface — « sauvegarde ». À modifier ici uniquement. */
export const TEXTES_SAUVEGARDE = {
  /** Le rappel de l'accueil : une sauvegarde hors de l'appareil protège les données d'une panne ou d'une perte. */
  rappel: {
    titre: 'Pensez à sauvegarder vos données',
    jamais: (jours: number) =>
      `Aucune sauvegarde n’a été faite depuis ${jours} jours. Vos données sont sur cet appareil seulement : en cas de panne ou de perte, elles seraient perdues.`,
    depuis: (jours: number) =>
      `Dernière sauvegarde il y a ${jours} jours. Vos données sont sur cet appareil seulement : sauvegardez-les dans un fichier ou sur Google Drive.`,
    bouton: 'Sauvegarder maintenant',
  },
  /** La disquette de la capsule du haut : enregistrer les données sur Google Drive ou dans un fichier de l'appareil. */
  enregistrer: {
    bouton: 'Enregistrer',
    titre: 'Enregistrer mes données',
    surDrive: 'Sur Google Drive',
    surAppareil: 'Sur cet appareil (fichier)',
    /** Les entrées du menu du haut (Windows). */
    menuDrive: 'Google Drive',
    menuAppareil: 'Enregistrer dans un fichier',
  },
  backup: {
    get sauvegardeTroupeauChevres() {
      return modeEntreprise() ? 'Sauvegarde de l’entreprise' : `Sauvegarde ${V().troupeau}`;
    },
    ceFichierNEstPas: 'Ce fichier n’est pas une sauvegarde valide (JSON illisible).',
    ceFichierNEstPasUne: 'Ce fichier n’est pas une sauvegarde valide.',
  },
} as const;
