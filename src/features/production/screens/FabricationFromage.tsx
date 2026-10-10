import { useEffect, useState } from 'react';
import { Alert, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen } from '@/shared/components/Screen';
import { Button } from '@/shared/components/Button';
import { DateField } from '@/shared/components/DateField';
import { FormField } from '@/shared/components/FormField';
import { SelectField } from '@/shared/components/SelectField';
import { useEtablissement } from '@/features/etablissements/context/EtablissementContext';
import { lireArchiveStock } from '@/features/stock/repository';
import { derniereBoucle } from '@/features/stock/services/boucles';
import { erreurFabrication, fabriquerFromages, numeroSuivant } from '@/features/stock/services/lots';
import { articlesDuGenre, type ArticleAffiche } from '@/features/stock/services/stock';
import type { ArchiveStock } from '@/features/stock/types';
import { GENRE_ARTICLE } from '@/shared/constants/stock';
import { useAjoutTabBarBleu } from '@/shared/hooks/useAjoutTabBarBleu';
import { colors } from '@/shared/theme/colors';
import { AccentColorProvider } from '@/shared/theme/AccentColorContext';
import { parseDecimal } from '@/shared/utils/nombres';
import { todayISO } from '@/shared/utils/dates';
import { commonStyles } from '@/shared/styles/commonStyles';
import { TEXTES } from '@/shared/textes';

const T = TEXTES.production.fabrication;

/** La fabrication de fromages : un lot par fromage, numérotés à la suite du premier, qui entrent au stock (avec les litres de lait). */
export default function FabricationFromage() {
  useAjoutTabBarBleu();
  const router = useRouter();
  const { espece } = useEtablissement();
  const [archive, setArchive] = useState<ArchiveStock | null>(null);
  const [articles, setArticles] = useState<ArticleAffiche[]>([]);
  const [article, setArticle] = useState('');
  const [date, setDate] = useState(todayISO());
  const [quantite, setQuantite] = useState('');
  const [premier, setPremier] = useState('');
  const [litres, setLitres] = useState('');
  const [enregistrement, setEnregistrement] = useState(false);

  useEffect(() => {
    lireArchiveStock().then((a) => {
      const proposes = articlesDuGenre(GENRE_ARTICLE.FROMAGE, a, espece);
      setArchive(a);
      setArticles(proposes);
      if (proposes[0]) {
        setArticle(proposes[0].cle);
        setPremier(numeroSuivant(a, proposes[0].cle));
      }
    });
  }, [espece]);

  const choisirArticle = (cle: string) => {
    setArticle(cle);
    if (archive) setPremier(numeroSuivant(archive, cle));
  };

  const nombre = Math.round(Number(quantite) || 0);
  const dernier = nombre > 0 && premier ? derniereBoucle(premier, nombre) : undefined;

  const fabriquer = async () => {
    if (!archive) return;
    const erreur = erreurFabrication(archive, article, premier, nombre);
    if (erreur) return Alert.alert(erreur);
    setEnregistrement(true);
    try {
      await fabriquerFromages({
        article,
        date,
        quantite: nombre,
        debut: premier,
        litres: litres.trim() ? parseDecimal(litres) : undefined,
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
        <DateField label={T.date} required value={date} onChange={setDate} />
        <FormField
          label={T.quantite}
          required
          value={quantite}
          onChangeText={(v) => /^\d*$/.test(v) && setQuantite(v)}
          keyboardType="number-pad"
        />
        <FormField label={T.premier} required value={premier} onChangeText={(v) => setPremier(v.trim())} />
        <Text style={commonStyles.note}>{dernier ? T.dernier(dernier) : T.premierAide}</Text>
        <FormField
          label={T.litres}
          value={litres}
          onChangeText={setLitres}
          keyboardType="decimal-pad"
          placeholder="0"
        />
        <Button label={T.enregistrer} onPress={fabriquer} loading={enregistrement} />
      </Screen>
    </AccentColorProvider>
  );
}
