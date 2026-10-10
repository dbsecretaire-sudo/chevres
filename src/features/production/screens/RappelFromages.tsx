import { useEffect, useState } from 'react';
import { Text } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen } from '@/shared/components/Screen';
import { Button } from '@/shared/components/Button';
import { Checkbox } from '@/shared/components/Checkbox';
import { DateField } from '@/shared/components/DateField';
import { SelectField } from '@/shared/components/SelectField';
import { SectionForm } from '@/shared/components/SectionForm';
import { useEtablissement } from '@/features/etablissements/context/EtablissementContext';
import { lireArchiveStock } from '@/features/stock/repository';
import { etatDuLot, rappelerLots, trierLots } from '@/features/stock/services/lots';
import { articlesDuGenre, type ArticleAffiche } from '@/features/stock/services/stock';
import type { ArchiveStock } from '@/features/stock/types';
import { ETAT_LOT, GENRE_ARTICLE, TRI_LOT } from '@/shared/constants/stock';
import { useAjoutTabBarBleu } from '@/shared/hooks/useAjoutTabBarBleu';
import { colors } from '@/shared/theme/colors';
import { AccentColorProvider } from '@/shared/theme/AccentColorContext';
import { formatDateShortFR, todayISO } from '@/shared/utils/dates';
import { commonStyles } from '@/shared/styles/commonStyles';
import { TEXTES } from '@/shared/textes';

const T = TEXTES.production.rappel;

/** Le rappel de fromages : on choisit un fromage, puis ses lots à retirer de la vente (en stock ou déjà vendus), à une date. */
export default function RappelFromages() {
  useAjoutTabBarBleu();
  const router = useRouter();
  const { espece } = useEtablissement();
  const [archive, setArchive] = useState<ArchiveStock | null>(null);
  const [articles, setArticles] = useState<ArticleAffiche[]>([]);
  const [article, setArticle] = useState('');
  const [date, setDate] = useState(todayISO());
  const [choisis, setChoisis] = useState<string[]>([]);
  const [enregistrement, setEnregistrement] = useState(false);

  useEffect(() => {
    lireArchiveStock().then((a) => {
      const proposes = articlesDuGenre(GENRE_ARTICLE.FROMAGE, a, espece);
      setArchive(a);
      setArticles(proposes);
      if (proposes[0]) setArticle(proposes[0].cle);
    });
  }, [espece]);

  // Les lots qu'on peut rappeler : ceux du fromage qui ont été vendus et dont le contrôle n'est pas bon (pas déjà rappelés).
  const lots = trierLots(
    (archive?.lots ?? []).filter(
      (l) => l.article === article && etatDuLot(l) === ETAT_LOT.VENDU && !l.controleOk,
    ),
    TRI_LOT.NUMERO,
    true,
  );

  const basculer = (id: string) =>
    setChoisis((actuels) => (actuels.includes(id) ? actuels.filter((x) => x !== id) : [...actuels, id]));

  const rappeler = async () => {
    setEnregistrement(true);
    try {
      await rappelerLots(choisis, date);
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
          onChange={(cle) => {
            setArticle(cle);
            setChoisis([]);
          }}
          options={articles.map((a) => ({ value: a.cle, label: a.libelle }))}
        />
        <DateField label={T.date} required value={date} onChange={setDate} />
        <SectionForm>
          <Text style={commonStyles.note}>{lots.length === 0 ? T.aucun : T.choisir}</Text>
          {lots.map((lot) => (
            <Checkbox
              key={lot.id}
              label={`${lot.numero} · ${formatDateShortFR(lot.dateFabrication)}${lot.dateVente ? ` · ${formatDateShortFR(lot.dateVente)}` : ''}`}
              value={choisis.includes(lot.id)}
              onChange={() => basculer(lot.id)}
            />
          ))}
        </SectionForm>
        <Text style={commonStyles.note}>{T.aide}</Text>
        {choisis.length > 0 ? (
          <Button
            variant="danger"
            label={T.enregistrer(choisis.length)}
            onPress={rappeler}
            loading={enregistrement}
          />
        ) : null}
      </Screen>
    </AccentColorProvider>
  );
}
