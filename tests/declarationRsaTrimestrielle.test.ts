import { PDFDocument } from 'pdf-lib';
import { describe, expect, it } from 'vitest';
import {
  declarationRsaTrimestrielle,
  montantsDuMois,
  moisDeclares,
} from '@/features/comptabilite/services/declarationRsaTrimestrielle';

describe('la déclaration trimestrielle RSA', () => {
  it('déclare les trois mois décalés de deux mois, comme dans la notice', () => {
    expect(moisDeclares({ annee: 2026, mois: 3 })).toEqual([
      { annee: 2025, mois: 11 },
      { annee: 2025, mois: 12 },
      { annee: 2026, mois: 1 },
    ]);
  });

  it('un nouvel installé déclare son chiffre d’affaires après l’abattement BA de 87 %, sans centimes', () => {
    const montants = montantsDuMois({ ca: 1000, aidesCourantes: 250.7, ichn: 300 }, true);
    expect(montants.ca).toBe(130);
    expect(montants.autres).toBe(250);
    expect(montants.travailleurNonSalarie).toBe(false);
  });

  it('une activité imposée sur une année complète coche « travailleur non-salarié » et ne remplit pas le chiffre d’affaires', () => {
    const montants = montantsDuMois({ ca: 1000, aidesCourantes: 0, ichn: 0 }, false);
    expect(montants.ca).toBeUndefined();
    expect(montants.travailleurNonSalarie).toBe(true);
  });

  it('un nouvel installé sans rien perçu coche « aucune ressource »', () => {
    expect(montantsDuMois({ ca: 0, aidesCourantes: 0, ichn: 0 }, true).aucuneRessource).toBe(true);
  });

  it('écrit les mois, les montants et les cases dans le formulaire', async () => {
    const mois = moisDeclares({ annee: 2026, mois: 3 });
    const montants = [
      montantsDuMois({ ca: 1000, aidesCourantes: 250, ichn: 0 }, true),
      montantsDuMois({ ca: 0, aidesCourantes: 0, ichn: 0 }, true),
      montantsDuMois({ ca: 500, aidesCourantes: 0, ichn: 0 }, true),
    ];
    const base64 = await declarationRsaTrimestrielle(mois, montants);
    const formulaire = (await PDFDocument.load(base64)).getForm();

    expect(formulaire.getTextField('Champ de texte 1036').getText()).toBe('nov. 2025');
    expect(formulaire.getTextField('Champ de texte 1033').getText()).toBe('130');
    expect(formulaire.getTextField('Champ de texte 1046').getText()).toBe('250');
    expect(formulaire.getTextField('Champ de texte 10108').getText()).toBe('Primes et aides PAC');
    expect(formulaire.getCheckBox('Case à cocher 69').isChecked()).toBe(true);
    expect(formulaire.getCheckBox('Case à cocher 62').isChecked()).toBe(false);
  });
});
