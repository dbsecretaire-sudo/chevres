import { PDFDocument } from 'pdf-lib';
import { MODELE_RSA_TRIMESTRIELLE } from '@/features/comptabilite/formulaires/rsaTrimestrielle';
import type { RecettesDuMois } from '@/features/comptabilite/services/fiscalite';

/** Les mois abrégés, pour écrire le mois dans la case du formulaire. */
const MOIS_COURTS = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];

/** Le taux d'abattement des bénéfices agricoles : la notice demande le chiffre d'affaires après abattement de 87 % (BA). */
const ABATTEMENT_BA_CENTIEMES = 87;

/** Un mois de l'année : le mois de l'étude et ceux qu'elle concerne. */
export interface MoisDeLAnnee {
  annee: number;
  /** De 1 à 12. */
  mois: number;
}

/**
 * Les trois mois à déclarer pour étudier les droits d'un mois : la notice décale de deux mois (pour l'étude de mars, on déclare novembre,
 * décembre et janvier).
 */
export function moisDeclares(etude: MoisDeLAnnee): MoisDeLAnnee[] {
  const rang = etude.annee * 12 + (etude.mois - 1);
  return [-4, -3, -2].map((ecart) => {
    const position = rang + ecart;
    return { annee: Math.floor(position / 12), mois: (position % 12) + 1 };
  });
}

/** Ce qui s'écrit dans les trois colonnes du formulaire, pour un mois déclaré. */
interface MontantsDuMois {
  /** Le chiffre d'affaires après abattement, en euros sans centimes (nouvel installé seulement). */
  ca?: number;
  /** Les aides courantes (PAC…), en euros sans centimes ; l'ICHN n'y entre pas (elle se déclare chaque année). */
  autres?: number;
  /** Cocher « Travailleur non-salarié » : l'activité est imposée sur une année complète. */
  travailleurNonSalarie: boolean;
  /** Cocher « Aucune ressource » : rien n'est perçu ce mois-là. */
  aucuneRessource: boolean;
}

/**
 * Les montants d'un mois, selon la notice : un nouvel installé déclare son chiffre d'affaires après abattement (le BA garde 13 % des
 * recettes) ; une activité imposée sur une année complète coche « Travailleur non-salarié » et ne remplit pas le chiffre d'affaires. Les
 * aides courantes vont dans « Si autres ressources », sans les centimes.
 */
export function montantsDuMois(recettes: RecettesDuMois, nouvelInstalle: boolean): MontantsDuMois {
  // En centimes, pour que l'abattement et les centimes ne donnent pas d'arrondi approximatif.
  const caCentimes = Math.round(recettes.ca * 100);
  const ca = Math.floor((caCentimes * (100 - ABATTEMENT_BA_CENTIEMES)) / 10000);
  const autres = Math.floor(recettes.aidesCourantes);
  const rienPercu = ca === 0 && autres === 0;
  return {
    ca: nouvelInstalle ? ca : undefined,
    autres: autres > 0 ? autres : undefined,
    travailleurNonSalarie: !nouvelInstalle,
    aucuneRessource: nouvelInstalle && rienPercu,
  };
}

/** Les cases du formulaire pour la personne 1 : trois colonnes, une par mois déclaré. */
const CHAMPS = {
  mois: ['Champ de texte 1036', 'Champ de texte 1058', 'Champ de texte 1059'],
  chiffreAffaires: ['Champ de texte 1033', 'Champ de texte 1034', 'Champ de texte 1035'],
  autresRessources: ['Champ de texte 1046', 'Champ de texte 1047', 'Champ de texte 1048'],
  precisez: 'Champ de texte 10108',
  travailleurNonSalarie: ['Case à cocher 62', 'Case à cocher 63', 'Case à cocher 64'],
  aucuneRessource: ['Case à cocher 68', 'Case à cocher 69', 'Case à cocher 70'],
} as const;

/**
 * Le formulaire de déclaration trimestrielle RSA, rempli pour trois mois : les mois, puis les montants. Rend le PDF en base64. Le formulaire
 * reste modifiable : l'exploitante peut corriger une case avant de l'envoyer.
 */
export async function declarationRsaTrimestrielle(mois: MoisDeLAnnee[], montants: MontantsDuMois[]): Promise<string> {
  const doc = await PDFDocument.load(MODELE_RSA_TRIMESTRIELLE);
  const formulaire = doc.getForm();
  mois.forEach((m, i) => {
    formulaire.getTextField(CHAMPS.mois[i]).setText(`${MOIS_COURTS[m.mois - 1]} ${m.annee}`);
    const montant = montants[i];
    if (montant.ca !== undefined) formulaire.getTextField(CHAMPS.chiffreAffaires[i]).setText(String(montant.ca));
    if (montant.autres !== undefined) {
      formulaire.getTextField(CHAMPS.autresRessources[i]).setText(String(montant.autres));
      formulaire.getTextField(CHAMPS.precisez).setText('Primes et aides PAC');
    }
    if (montant.travailleurNonSalarie) formulaire.getCheckBox(CHAMPS.travailleurNonSalarie[i]).check();
    if (montant.aucuneRessource) formulaire.getCheckBox(CHAMPS.aucuneRessource[i]).check();
  });
  return doc.saveAsBase64();
}
