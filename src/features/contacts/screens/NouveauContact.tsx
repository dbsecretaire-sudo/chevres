import { useState } from 'react';
import { View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
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
import { retournerALaPageDAvant } from '@/shared/navigation/retourAvant';

const F = TEXTES.contacts.formulaire;

/** Un nouveau contact : un client (recettes), un fournisseur (dépenses), ou les deux, en une seule fiche. */
export default function NouveauContact() {
  const router = useRouter();
  const { categories, idsConnus, assurerCategorie } = useCategoriesContact();
  /** Ouvert depuis la fiche d'un lieu (garage, emballages, surfaces commerciales…) : la catégorie du lieu est déjà choisie, du côté qui lui convient. */
  const { categorie } = useLocalSearchParams<{ categorie?: string }>();
  const [form, setForm] = useState<FormulaireContact>(() => {
    if (!categorie || !categories.some((c) => c.id === categorie)) return FORMULAIRE_CONTACT_VIDE;
    const client = idsConnus.client.includes(categorie);
    const fournisseur = idsConnus.fournisseur.includes(categorie);
    return {
      ...FORMULAIRE_CONTACT_VIDE,
      categorie,
      recettes: client,
      depenses: fournisseur,
    };
  });
  const [enregistrement, setEnregistrement] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  const enregistrer = async () => {
    setEnregistrement(true);
    try {
      if (form.categorie) await assurerCategorie(form.categorie);
      const resultat = await enregistrerContact(form, undefined, idsConnus);
      if ('erreur' in resultat) return setErreur(TEXTES.contacts.erreurs[resultat.erreur]);
      retournerALaPageDAvant(router);
    } finally {
      setEnregistrement(false);
    }
  };

  return (
    <AccentColorProvider color={colors.ajout} softColor={colors.ajoutBadgeBg}>
      <Screen>
        <FormulaireContactChamps form={form} onChange={setForm} categories={categories} />
        <View style={commonStyles.row}>
          <Button
            style={commonStyles.flex1}
            variant="secondary"
            label={F.annuler}
            onPress={() => retournerALaPageDAvant(router)}
          />
          <Button
            style={commonStyles.flex1}
            label={F.enregistrer}
            loading={enregistrement}
            onPress={enregistrer}
          />
        </View>
        <InfoModal visible={!!erreur} title={erreur ?? ''} onClose={() => setErreur(null)} />
      </Screen>
    </AccentColorProvider>
  );
}
