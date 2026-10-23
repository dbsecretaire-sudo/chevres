import { useCallback, useState } from 'react';
import { View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Screen } from '@/shared/components/Screen';
import { FormField } from '@/shared/components/FormField';
import { Button } from '@/shared/components/Button';
import { InfoModal } from '@/shared/components/InfoModal';
import { colors } from '@/shared/theme/colors';
import { AccentColorProvider } from '@/shared/theme/AccentColorContext';
import { creerComptePcg, listComptesPcg } from '@/features/comptes-pcg/repository';
import { ChoixSuiviCompte, useSuiviCompte } from '@/features/comptes-pcg/components/ChoixSuiviCompte';
import { ajouterListe } from '@/features/stock/services/structure';
import { commonStyles } from '@/shared/styles/commonStyles';
import { TEXTES } from '@/shared/textes';
import { retournerALaPageDAvant } from '@/shared/navigation/retourAvant';

export default function NouveauComptePcg() {
  const router = useRouter();
  const [numero, setNumero] = useState('');
  const [libelle, setLibelle] = useState('');
  const [enregistrement, setEnregistrement] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  /** Les numéros déjà enregistrés : un compte n'y figure qu'une fois. */
  const [numeros, setNumeros] = useState<string[]>([]);
  useFocusEffect(
    useCallback(() => {
      listComptesPcg().then((comptes) => setNumeros(comptes.map((c) => c.numero)));
    }, []),
  );
  const dejaEnregistre = numeros.includes(numero.trim());

  const suiviCompte = useSuiviCompte(numero);
  const { suivi, categorie } = suiviCompte;

  const enregistrer = async () => {
    if (!numero.trim()) return setErreur(TEXTES.commun.general.nRequis);
    if (dejaEnregistre || suiviCompte.impossible) return;
    if (!libelle.trim()) return setErreur(TEXTES.commun.general.descriptionRequise);

    setEnregistrement(true);
    try {
      await creerComptePcg({ numero: numero.trim(), libelle: libelle.trim() });
      // Un compte inventorié : sa liste est ajoutée à la catégorie choisie de l'inventaire (avec son premier article).
      if (suivi === 'inventaire' && categorie) {
        await ajouterListe(categorie.categorie, libelle.trim(), {
          numero: numero.trim(),
          libelle: libelle.trim(),
        });
      }
      retournerALaPageDAvant(router);
    } finally {
      setEnregistrement(false);
    }
  };

  return (
    <AccentColorProvider color={colors.ajout} softColor={colors.ajoutBadgeBg}>
      <Screen>
        <FormField
          label="N°"
          required
          value={numero}
          onChangeText={setNumero}
          keyboardType="number-pad"
          erreur={dejaEnregistre ? TEXTES.comptesPcg.numeroDejaEnregistre : undefined}
          placeholder={TEXTES.comptesPcg.nouveauComptePcg.ex623000}
        />
        <FormField
          label={TEXTES.commun.general.description}
          required
          value={libelle}
          onChangeText={setLibelle}
          placeholder={TEXTES.comptesPcg.nouveauComptePcg.exPublicitePublications}
        />

        <ChoixSuiviCompte etat={suiviCompte} numero={numero} />

        <View style={commonStyles.row}>
          <Button
            style={commonStyles.flex1}
            variant="secondary"
            label={TEXTES.commun.general.annuler}
            onPress={() => retournerALaPageDAvant(router)}
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
