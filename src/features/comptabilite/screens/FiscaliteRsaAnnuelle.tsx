import { useEffect, useState } from 'react';
import { Alert, Text } from 'react-native';
import { Button } from '@/shared/components/Button';
import { Card } from '@/shared/components/Card';
import { ChoixPastilles } from '@/shared/components/ChoixPastilles';
import { FormField } from '@/shared/components/FormField';
import { Screen } from '@/shared/components/Screen';
import { ecrirePdfBase64EtPartager } from '@/features/export/services/htmlPdf';
import { declarationRsaAnnuelle } from '@/features/comptabilite/services/declarationRsaAnnuelle';
import { recettesPerceuesParMois } from '@/features/comptabilite/services/fiscalite';
import { commonStyles } from '@/shared/styles/commonStyles';

/** La déclaration annuelle RSA des non-salariés, préremplie : l'ICHN vient des recettes, le bénéfice micro-BA de votre avis d'imposition. */
export default function FiscaliteRsaAnnuelle() {
  const [anneeRevenu, setAnneeRevenu] = useState(String(new Date().getFullYear() - 1));
  const [beneficeMicroBA, setBeneficeMicroBA] = useState('');
  const [nouvelInstalle, setNouvelInstalle] = useState(false);
  const [ichn, setIchn] = useState(0);

  const annee = Number(anneeRevenu);
  const anneeValide = /^\d{4}$/.test(anneeRevenu);

  useEffect(() => {
    if (!anneeValide) return;
    let actif = true;
    recettesPerceuesParMois(annee).then((mois) => {
      if (actif) setIchn(mois.reduce((somme, m) => somme + m.ichn, 0));
    });
    return () => {
      actif = false;
    };
  }, [annee, anneeValide]);

  const preparer = async () => {
    if (!anneeValide) return Alert.alert('Indiquez l’année du dernier revenu imposé (4 chiffres).');
    try {
      const base64 = await declarationRsaAnnuelle({
        anneeRevenu: annee,
        beneficeMicroBA: beneficeMicroBA.trim() ? Number(beneficeMicroBA.replace(',', '.')) : undefined,
        ichn,
        nouvelInstalle,
      });
      await ecrirePdfBase64EtPartager(base64, `declaration-annuelle-rsa-${annee}.pdf`, 'Déclaration annuelle RSA');
    } catch (e: unknown) {
      Alert.alert(e instanceof Error ? e.message : 'Le formulaire ne peut pas être préparé.');
    }
  };

  return (
    <Screen>
      <Card>
        <Text style={commonStyles.cardTitle}>Votre situation</Text>
        <ChoixPastilles
          options={[
            { value: 'impose', label: 'Imposé (micro-BA)' },
            { value: 'nouveau', label: 'Nouvel installé' },
          ]}
          value={nouvelInstalle ? 'nouveau' : 'impose'}
          onChange={(v) => setNouvelInstalle(v === 'nouveau')}
        />
        {nouvelInstalle ? null : (
          <>
            <FormField
              label="Année du dernier revenu imposé (avis d’imposition)"
              value={anneeRevenu}
              onChangeText={setAnneeRevenu}
              keyboardType="number-pad"
              maxLength={4}
            />
            <FormField
              label="Bénéfice micro-BA de cette année (avis d’imposition, en euros)"
              value={beneficeMicroBA}
              onChangeText={setBeneficeMicroBA}
              keyboardType="decimal-pad"
            />
          </>
        )}
      </Card>

      <Card>
        <Text style={commonStyles.cardTitle}>Ce qui sera écrit</Text>
        <Text style={commonStyles.muted}>
          {nouvelInstalle
            ? 'Nouvel installé : la case « jamais imposé » est cochée.'
            : `Régime micro-BA, année ${anneeValide ? anneeRevenu : '…'}${beneficeMicroBA.trim() ? `, bénéfice ${beneficeMicroBA} €` : ''}.`}
        </Text>
        <Text style={commonStyles.muted}>ICHN perçue pendant l’année : {ichn} €</Text>
      </Card>

      <Button label="Préparer le formulaire" onPress={preparer} />
      <Text style={commonStyles.note}>
        Le formulaire est prérempli : l’identité, la date et la signature restent à remplir à la main.
      </Text>
    </Screen>
  );
}
