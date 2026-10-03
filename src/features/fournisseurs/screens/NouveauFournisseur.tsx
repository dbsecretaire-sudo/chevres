import { useState } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen } from '@/shared/components/Screen';
import { FormField } from '@/shared/components/FormField';
import { Button } from '@/shared/components/Button';
import { InfoModal } from '@/shared/components/InfoModal';
import { colors } from '@/shared/theme/colors';
import { AccentColorProvider } from '@/shared/theme/AccentColorContext';
import { creerFournisseur } from '@/features/fournisseurs/repository';
import { commonStyles } from '@/shared/styles/commonStyles';
import { TEXTES } from '@/shared/textes';

export default function NouveauFournisseur() {
  const router = useRouter();
  const [nom, setNom] = useState('');
  const [prenom, setPrenom] = useState('');
  const [nomEntreprise, setNomEntreprise] = useState('');
  const [siret, setSiret] = useState('');
  const [tva, setTva] = useState('');
  const [rib, setRib] = useState('');
  const [adressePostale, setAdressePostale] = useState('');
  const [enregistrement, setEnregistrement] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  const enregistrer = async () => {
    if (!nom.trim()) return setErreur(TEXTES.commun.general.nomRequis);
    if (!nomEntreprise.trim()) return setErreur(TEXTES.commun.general.nomDEntrepriseRequis);
    if (!siret.trim()) return setErreur(TEXTES.commun.general.siretRequis);
    if (!adressePostale.trim()) return setErreur(TEXTES.commun.general.adressePostaleRequise);

    setEnregistrement(true);
    try {
      await creerFournisseur({
        nom: nom.trim(),
        prenom: prenom.trim() || undefined,
        nomEntreprise: nomEntreprise.trim(),
        siret: siret.trim(),
        tva: tva.trim() || undefined,
        rib: rib.trim() || undefined,
        adressePostale: adressePostale.trim(),
      });
      router.back();
    } finally {
      setEnregistrement(false);
    }
  };

  return (
    <AccentColorProvider color={colors.ajout} softColor={colors.ajoutBadgeBg}>
      <Screen>
        <FormField
          label={TEXTES.commun.general.nomDEntreprise}
          required
          value={nomEntreprise}
          onChangeText={setNomEntreprise}
          placeholder={TEXTES.fournisseurs.nouveauFournisseur.exCooperativeAgricoleDuNord}
        />
        <FormField
          label={TEXTES.commun.general.nom}
          required
          value={nom}
          onChangeText={setNom}
          placeholder={TEXTES.fournisseurs.nouveauFournisseur.nomDuContact}
        />
        <FormField
          label={TEXTES.commun.general.prenom}
          value={prenom}
          onChangeText={setPrenom}
          placeholder={TEXTES.commun.general.facultatif}
        />
        <FormField
          label={TEXTES.commun.general.adressePostale}
          required
          value={adressePostale}
          onChangeText={setAdressePostale}
          multiline
          style={commonStyles.textarea}
          placeholder={TEXTES.fournisseurs.nouveauFournisseur.numeroRueCodePostalVille}
        />
        <FormField
          label={TEXTES.commun.general.siret}
          required
          value={siret}
          onChangeText={setSiret}
          keyboardType="number-pad"
          placeholder={TEXTES.fournisseurs.nouveauFournisseur.t14Chiffres}
        />
        <FormField
          label={TEXTES.commun.general.tvaIntracommunautaire}
          value={tva}
          onChangeText={setTva}
          placeholder={TEXTES.commun.general.facultatif}
        />
        <FormField
          label={TEXTES.commun.general.rib}
          value={rib}
          onChangeText={setRib}
          placeholder={TEXTES.fournisseurs.nouveauFournisseur.facultatifIbanBic}
        />

        <View style={commonStyles.row}>
          <Button
            style={commonStyles.flex1}
            variant="secondary"
            label={TEXTES.commun.general.annuler}
            onPress={() => router.back()}
          />
          <Button
            style={commonStyles.flex1}
            label={TEXTES.commun.general.enregistrer}
            onPress={enregistrer}
            loading={enregistrement}
          />
        </View>
      </Screen>

      <InfoModal visible={!!erreur} title={erreur ?? ''} onClose={() => setErreur(null)} />
    </AccentColorProvider>
  );
}
