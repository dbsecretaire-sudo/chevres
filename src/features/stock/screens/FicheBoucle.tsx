import { useCallback, useState } from 'react';
import { Text, View } from 'react-native';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import type { Chevre } from '@/features/cheptel/types';
import { useListeBoucles } from '@/features/stock/hooks/useListeBoucles';
import { lireArchiveStock } from '@/features/stock/repository';
import { libelleDeLaSorte, marquerBoucles, nePasPoser, texteDeLaRemarque } from '@/features/stock/services/boucles';
import type { ArchiveStock } from '@/features/stock/types';
import { Button } from '@/shared/components/Button';
import { FormField } from '@/shared/components/FormField';
import { Screen } from '@/shared/components/Screen';
import { ROUTES } from '@/shared/constants/routes';
import { CATEGORIE_STOCKAGE } from '@/shared/constants/stockage';
import { commonStyles } from '@/shared/styles/commonStyles';
import { TEXTES } from '@/shared/textes';
import { formatDateShortFR } from '@/shared/utils/dates';
import { loadAllYears } from '@/shared/storage/localStore';

const T = TEXTES.stock.boucles.fiche;

/**
 * La fiche d'une boucle, sur sa page : son statut (posée, à poser, ne pas poser), l'animal qui la porte, sa date d'achat et sa remarque.
 * Sa remarque se modifie ici, pour cette seule boucle (vide : retirée).
 */
export default function FicheBoucle() {
  const router = useRouter();
  const { article = '', numero = '' } = useLocalSearchParams<{ article?: string; numero?: string }>();
  const [stock, setStock] = useState<ArchiveStock | null>(null);
  const [animaux, setAnimaux] = useState<Chevre[]>([]);
  /** La remarque saisie, tant qu'elle n'est pas enregistrée (sinon, celle de la boucle). */
  const [saisie, setSaisie] = useState<string | null>(null);
  const [message, setMessage] = useState<{ texte: string; erreur: boolean } | null>(null);
  const [enCours, setEnCours] = useState(false);

  const charger = useCallback(() => {
    Promise.all([lireArchiveStock(), loadAllYears(CATEGORIE_STOCKAGE.CHEPTEL)])
      .then(([archive, liste]) => {
        setStock(archive);
        setAnimaux(liste);
      })
      .catch(() => undefined);
  }, []);
  useFocusEffect(useCallback(() => charger(), [charger]));

  // Même lecture que la liste des boucles (les poses d'après les fiches du cheptel, quand la synchronisation est active).
  const liste = useListeBoucles(stock?.boucles ?? [], article, stock?.mouvements ?? []);
  const boucle = liste.toutes.find((b) => b.numero === numero);

  // La remarque actuelle est reprise dans le champ (on l'ajuste plutôt que de la retaper).
  const texte = saisie ?? texteDeLaRemarque(boucle?.remarque ?? '');

  const enregistrer = async () => {
    setEnCours(true);
    try {
      const nombre = await marquerBoucles(article, numero, numero, texte);
      setMessage(
        nombre > 0
          ? { texte: texte.trim() ? T.enregistree : T.retiree, erreur: false }
          : { texte: T.introuvable, erreur: true },
      );
      setSaisie(null);
      charger();
    } finally {
      setEnCours(false);
    }
  };

  if (stock === null) return <Screen />;
  if (!boucle) {
    return (
      <Screen>
        <Text style={commonStyles.note}>{T.introuvable}</Text>
      </Screen>
    );
  }

  const posee = !!boucle.chevreId;
  const animal = posee ? animaux.find((a) => a.id === boucle.chevreId) : undefined;
  const statut = posee
    ? T.posee(boucle.datePose ? formatDateShortFR(boucle.datePose) : '')
    : nePasPoser(boucle)
      ? TEXTES.stock.boucles.nePasPoser
      : T.aPoser;

  return (
    <Screen>
      <View style={commonStyles.gap10}>
        <Text style={commonStyles.muted}>{libelleDeLaSorte(article)}</Text>
        <View style={commonStyles.rowSpaceBetween}>
          <Text style={commonStyles.muted}>{T.statut}</Text>
          <Text>{statut}</Text>
        </View>
        {posee ? (
          <View style={commonStyles.rowSpaceBetween}>
            <Text style={commonStyles.muted}>{T.animal}</Text>
            <Text>{animal?.nom ?? animal?.numeroBoucle ?? ''}</Text>
          </View>
        ) : null}
        <View style={commonStyles.rowSpaceBetween}>
          <Text style={commonStyles.muted}>{T.achat}</Text>
          <Text>{formatDateShortFR(boucle.dateAchat)}</Text>
        </View>
        <View style={commonStyles.rowSpaceBetween}>
          <Text style={commonStyles.muted}>{T.remarqueActuelle}</Text>
          <Text>{boucle.remarque ? texteDeLaRemarque(boucle.remarque) : T.aucuneRemarque}</Text>
        </View>
        {posee && animal ? (
          <Button label={T.voirAnimal} variant="secondary" onPress={() => router.push(ROUTES.ficheChevre(animal.id) as never)} />
        ) : null}
      </View>

      <View style={commonStyles.gap10}>
        <Text style={commonStyles.subheading}>{T.marquage}</Text>
        <Button label={T.enTrop} variant="secondary" onPress={() => setSaisie(T.enTrop)} />
        <Button label={T.jamaisPosee} variant="secondary" onPress={() => setSaisie(T.jamaisPosee)} />
        <FormField
          label={T.remarqueChamp}
          value={texte}
          onChangeText={setSaisie}
          placeholder={T.remarquePlaceholder}
          aide={T.remarqueAide}
          multiline
        />
        {message ? (
          <Text style={[commonStyles.note, message.erreur ? commonStyles.required : null]}>{message.texte}</Text>
        ) : null}
        <Button label={T.enregistrer} onPress={enregistrer} loading={enCours} />
      </View>
    </Screen>
  );
}
