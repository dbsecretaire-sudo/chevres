import { PDFDocument } from 'pdf-lib';
import { describe, expect, it } from 'vitest';
import { declarationRsaAnnuelle } from '@/features/comptabilite/services/declarationRsaAnnuelle';

describe('la déclaration annuelle RSA des non-salariés', () => {
  it('coche « déclare des BA » et « micro-BA », avec l’année du revenu, le bénéfice et l’ICHN', async () => {
    const base64 = await declarationRsaAnnuelle({ anneeRevenu: 2024, beneficeMicroBA: 12345.8, ichn: 2100.4, nouvelInstalle: false });
    const formulaire = (await PDFDocument.load(base64)).getForm();

    expect(formulaire.getCheckBox('Case à cocher 20').isChecked()).toBe(true);
    expect(formulaire.getCheckBox('Case à cocher 22').isChecked()).toBe(false);
    expect(formulaire.getRadioGroup('Ba/régime réel ').getSelected()).toBe('Choix2');
    expect(formulaire.getTextField('BA année du revenu').getText()).toBe('2024');
    expect(formulaire.getTextField('Impot micro BA année').getText()).toBe('2024');
    expect(formulaire.getTextField('Impot BA montant').getText()).toBe('12345');
    expect(formulaire.getTextField('ICHN nature 1').getText()).toBe('ICHN');
    expect(formulaire.getTextField('ICHN date 1').getText()).toBe('2100');
  });

  it('un nouvel installé coche sa case, sans bénéfice micro-BA', async () => {
    const base64 = await declarationRsaAnnuelle({ anneeRevenu: 2024, ichn: 0, nouvelInstalle: true });
    const formulaire = (await PDFDocument.load(base64)).getForm();

    expect(formulaire.getCheckBox('Case à cocher 22').isChecked()).toBe(true);
    expect(formulaire.getCheckBox('Case à cocher 20').isChecked()).toBe(false);
    expect(formulaire.getTextField('Impot BA montant').getText()).toBeFalsy();
    expect(formulaire.getTextField('ICHN date 1').getText()).toBeFalsy();
  });
});
