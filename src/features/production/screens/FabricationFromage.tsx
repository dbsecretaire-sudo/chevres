import { useEffect, useState } from 'react';
import { Alert, Text } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Screen } from '@/shared/components/Screen';
import { Button } from '@/shared/components/Button';
import { DateField } from '@/shared/components/DateField';
import { FormField } from '@/shared/components/FormField';
import { SelectField } from '@/shared/components/SelectField';
import { useEtablissement } from '@/features/etablissements/context/EtablissementContext';
import { exporterGuideLotsPdf } from '@/features/export/guideLotsPdf';
import { lireArchiveStock } from '@/features/stock/repository';
import { derniereBoucle } from '@/features/stock/services/boucles';
import {
  articlesDuProduit,
  erreurFabrication,
  fabriquerFromages,
  numeroDeLot,
} from '@/features/stock/services/lots';
import { definirLitresParFromage } from '@/features/stock/services/stock';
import type { ArticleAffiche } from '@/features/stock/services/stock';
import type { ArchiveStock } from '@/features/stock/types';
import { PRODUIT_A_LOTS } from '@/shared/constants/stock';
import { useAjoutTabBarBleu } from '@/shared/hooks/useAjoutTabBarBleu';
import { colors } from '@/shared/theme/colors';
import { AccentColorProvider } from '@/shared/theme/AccentColorContext';
import { parseDecimal } from '@/shared/utils/nombres';
import { todayISO } from '@/shared/utils/dates';
import { commonStyles } from '@/shared/styles/commonStyles';
import { TEXTES } from '@/shared/textes';

/**
 * La fabrication de fromages ou de charcuterie (paramètre `produit`) : un lot par produit, numérotés à la suite du premier, qui
 * entrent au stock (avec les litres de lait pour un fromage).
 */
export default function FabricationFromage() {
  useAjoutTabBarBleu();
  const router = useRouter();
  const { produit: param } = useLocalSearchParams<{ produit?: string }>();
  const produit = param === PRODUIT_A_LOTS.CHARCUTERIE ? PRODUIT_A_LOTS.CHARCUTERIE : PRODUIT_A_LOTS.FROMAGE;
  const fromage = produit === PRODUIT_A_LOTS.FROMAGE;
  const T = fromage ? TEXTES.production.fabrication : TEXTES.production.fabricationCharcuterie;
  const { espece } = useEtablissement();
  const [archive, setArchive] = useState<ArchiveStock | null>(null);
  const [articles, setArticles] = useState<ArticleAffiche[]>([]);
  const [article, setArticle] = useState('');
  const [date, setDate] = useState(todayISO());
  const [quantite, setQuantite] = useState('');
  /** Le numéro du premier lot tapé à la main (vide : celui qui est proposé d'après le produit et la date). */
  const [premierSaisi, setPremierSaisi] = useState<string | null>(null);
  /** Les litres de lait par fromage, demandés une seule fois quand l'inventaire ne les a pas encore. */
  const [litresSaisis, setLitresSaisis] = useState('');
  const [enregistrement, setEnregistrement] = useState(false);

  useEffect(() => {
    lireArchiveStock().then((a) => {
      const proposes = articlesDuProduit(produit, a, espece);
      setArchive(a);
      setArticles(proposes);
      if (proposes[0]) setArticle(proposes[0].cle);
    });
  }, [espece, produit]);

  // Le numéro du premier lot se propose d'après le produit et la date (on peut le modifier ensuite).
  const premier = premierSaisi ?? (archive && article && date ? numeroDeLot(archive, article, date) : '');

  const choisirArticle = (cle: string) => {
    setArticle(cle);
    setPremierSaisi(null);
  };
  const changerDate = (nouvelle: string) => {
    setDate(nouvelle);
    setPremierSaisi(null);
  };

  const nombre = Math.round(Number(quantite) || 0);
  /** Les litres de lait par fromage : ceux de l'inventaire, sinon ceux qu'on vient d'indiquer. */
  const litresDeLInventaire = archive?.litresParFromage?.[article];
  const litresParFromage = litresDeLInventaire ?? parseDecimal(litresSaisis);
  const laitUtilise = Math.round(nombre * litresParFromage * 100) / 100;
  const dernier = nombre > 0 && premier ? derniereBoucle(premier, nombre) : undefined;

  const fabriquer = async () => {
    if (!archive) return;
    const erreur = erreurFabrication(archive, article, premier, nombre);
    if (erreur) return Alert.alert(erreur);
    // Le lait utilisé est une entrée de l'inventaire : il faut le dire pour un fromage.
    if (fromage && !(litresParFromage > 0)) return Alert.alert(TEXTES.production.fabrication.litresRequis);
    setEnregistrement(true);
    try {
      // Les litres par fromage indiqués ici sont gardés dans l'inventaire : on ne les redemande plus.
      if (fromage && litresDeLInventaire === undefined)
        await definirLitresParFromage(article, litresParFromage);
      await fabriquerFromages({
        article,
        date,
        quantite: nombre,
        debut: premier,
        litres: fromage ? laitUtilise : undefined,
      });
      router.back();
    } finally {
      setEnregistrement(false);
    }
  };

  return (
    <AccentColorProvider color={colors.ajout} softColor={colors.ajoutBadgeBg}>
      <Screen>
        <SelectField
          label={T.type}
          required
          value={article}
          onChange={choisirArticle}
          options={articles.map((a) => ({ value: a.cle, label: a.libelle }))}
        />
        <DateField label={T.date} required value={date} onChange={changerDate} />
        <FormField
          label={T.quantite}
          required
          value={quantite}
          onChangeText={(v) => /^\d*$/.test(v) && setQuantite(v)}
          keyboardType="number-pad"
        />
        <FormField
          label={T.premier}
          required
          explication={TEXTES.production.fabrication.explicationNumero}
          value={premier}
          onChangeText={(v) => setPremierSaisi(v.trim())}
        />
        <Text style={commonStyles.note}>{dernier ? T.dernier(dernier) : T.premierAide}</Text>
        <Button
          variant="secondary"
          label={TEXTES.production.fabrication.guide}
          onPress={() => exporterGuideLotsPdf(espece)}
        />
        {fromage ? (
          litresDeLInventaire ? (
            nombre > 0 ? (
              <Text style={commonStyles.note}>
                {TEXTES.production.fabrication.laitUtilise(
                  nombre,
                  String(litresDeLInventaire).replace('.', ','),
                  String(laitUtilise).replace('.', ','),
                )}
              </Text>
            ) : null
          ) : (
            <>
              <FormField
                label={TEXTES.production.fabrication.litresParFromage}
                required
                value={litresSaisis}
                onChangeText={setLitresSaisis}
                keyboardType="decimal-pad"
                placeholder="0"
              />
              <Text style={commonStyles.note}>{TEXTES.production.fabrication.litresParFromageAide}</Text>
            </>
          )
        ) : null}
        <Button label={T.enregistrer} onPress={fabriquer} loading={enregistrement} />
      </Screen>
    </AccentColorProvider>
  );
}
