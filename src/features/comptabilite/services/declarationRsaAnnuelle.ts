import { PDFDocument } from 'pdf-lib';
import { MODELE_RSA_ANNUELLE } from '@/features/comptabilite/formulaires/rsaAnnuelle';

/** Ce qu'il faut pour la déclaration annuelle : ce que la notice demande, et que l'application ne connaît pas toujours. */
interface DonneesRsaAnnuelle {
  /** L'année du dernier revenu imposé ou imposable connu (celle de l'avis d'imposition). */
  anneeRevenu: number;
  /** Le bénéfice micro-BA de cette année, tel qu'il figure sur l'avis (« bénéfices agricoles régime micro imposables »), en euros. */
  beneficeMicroBA?: number;
  /** L'ICHN perçue pendant l'année du revenu, en euros : elle se déclare ici seulement, et pas dans la déclaration trimestrielle. */
  ichn: number;
  /** Nouvel installé : jamais imposé en tant que non-salarié. */
  nouvelInstalle: boolean;
}

/** Les champs du formulaire annuel (le formulaire nomme ses cases). */
const CHAMPS = {
  anneeBA: 'BA année du revenu',
  regimeBA: 'Ba/régime réel ',
  choixMicroBA: 'Choix2',
  anneeMicroBA: 'Impot micro BA année',
  beneficeMicroBA: 'Impot BA montant',
  ichnNature: 'ICHN nature 1',
  ichnMontant: 'ICHN date 1',
  declareBA: 'Case à cocher 20',
  nouvelInstalle: 'Case à cocher 22',
} as const;

/**
 * Le formulaire de déclaration annuelle des non-salariés, rempli pour l'année du revenu : le régime micro-BA et son bénéfice (de l'avis
 * d'imposition), l'ICHN de l'année, et la case « nouvel installé » si l'activité n'a jamais été imposée. Rend le PDF en base64. L'identité et la
 * signature restent à remplir à la main.
 */
export async function declarationRsaAnnuelle(donnees: DonneesRsaAnnuelle): Promise<string> {
  const doc = await PDFDocument.load(MODELE_RSA_ANNUELLE);
  const formulaire = doc.getForm();

  if (donnees.nouvelInstalle) {
    formulaire.getCheckBox(CHAMPS.nouvelInstalle).check();
  } else {
    formulaire.getCheckBox(CHAMPS.declareBA).check();
    formulaire.getTextField(CHAMPS.anneeBA).setText(String(donnees.anneeRevenu));
    formulaire.getRadioGroup(CHAMPS.regimeBA).select(CHAMPS.choixMicroBA);
    formulaire.getTextField(CHAMPS.anneeMicroBA).setText(String(donnees.anneeRevenu));
    if (donnees.beneficeMicroBA !== undefined) {
      formulaire.getTextField(CHAMPS.beneficeMicroBA).setText(String(Math.floor(donnees.beneficeMicroBA)));
    }
  }

  if (donnees.ichn > 0) {
    formulaire.getTextField(CHAMPS.ichnNature).setText('ICHN');
    formulaire.getTextField(CHAMPS.ichnMontant).setText(String(Math.floor(donnees.ichn)));
  }

  return doc.saveAsBase64();
}
