import { useState } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen } from '@/shared/components/Screen';
import { Button } from '@/shared/components/Button';
import { InfoModal } from '@/shared/components/InfoModal';
import { FormulaireContactChamps } from '@/features/contacts/components/FormulaireContactChamps';
import { useCategoriesContact } from '@/features/contacts/hooks/useCategoriesContact';
import { enregistrerContact } from '@/features/contacts/repository';
import { FORMULAIRE_CONTACT_VIDE, type FormulaireContact } from '@/features/contacts/services/fiche';
import { AccentColorProvider } from '@/shared/theme/AccentColorContext';
import { colors } from '@/shared/theme/colors';
import { commonStyles } from '@/shared/styles/commonStyles';
import { TEXTES } from '@/shared/textes';

const F = TEXTES.contacts.formulaire;

/** Un nouveau contact : un client (recettes), un fournisseur (dépenses), ou les deux, en une seule fiche. */
export default function NouveauContact() {
  const router = useRouter();
  const { categories, idsConnus, assurerCategorie } = useCategoriesContact();
  const [form, setForm] = useState<FormulaireContact>(FORMULAIRE_CONTACT_VIDE);
  const [enregistrement, setEnregistrement] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  const enregistrer = async () => {
    setEnregistrement(true);
    try {
      if (form.categorie) await assurerCategorie(form.categorie);
      const resultat = await enregistrerContact(form, undefined, idsConnus);
      if ('erreur' in resultat) return setErreur(TEXTES.contacts.erreurs[resultat.erreur]);
      router.back();
    } finally {
      setEnregistrement(false);
    }
  };

  return (
    <AccentColorProvider color={colors.ajout} softColor={colors.ajoutBadgeBg}>
      <Screen>
        <FormulaireContactChamps form={form} onChange={setForm} categories={categories} />
        <View style={commonStyles.row}>
          <Button style={commonStyles.flex1} variant="secondary" label={F.annuler} onPress={() => router.back()} />
          <Button style={commonStyles.flex1} label={F.enregistrer} loading={enregistrement} onPress={enregistrer} />
        </View>
        <InfoModal visible={!!erreur} title={erreur ?? ''} onClose={() => setErreur(null)} />
      </Screen>
    </AccentColorProvider>
  );
}
