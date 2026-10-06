import { useCallback, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '@/shared/components/ScreenList';
import { Fab } from '@/shared/components/Fab';
import { ListRow } from '@/shared/components/ListRow';
import { PucesDefilantes } from '@/shared/components/PucesDefilantes';
import { SectionDeroulante } from '@/shared/components/SectionDeroulante';
import { BoissonModal } from '@/features/bar/components/BoissonModal';
import { RestaurationGite } from '@/features/bar/components/RestaurationGite';
import { VenteBar } from '@/features/bar/components/VenteBar';
import { NomModal } from '@/features/dossiers/components/NomModal';
import { MouvementStockModal } from '@/features/stock/components/MouvementStockModal';
import {
  ajouterAliment,
  ajusterStock,
  enregistrerBoisson,
  lireArchiveBar,
  renommerAliment,
  supprimerAliment,
  supprimerBoisson,
} from '@/features/bar/repository';
import type { ArchiveBar, Boisson } from '@/features/bar/types';
import { listSejours } from '@/features/gite/repository';
import type { Sejour } from '@/features/gite/types';
import { ONGLET_BAR } from '@/shared/constants/bar';
import type { ValeurDe } from '@/shared/constants/valeurDe';
import { colors } from '@/shared/theme/colors';
import { formatMontant } from '@/shared/utils/dates';
import { styles } from '@/shared/styles/trading/Trading.styles';
import { styles as stylesStock } from '@/shared/styles/stock/Stock.styles';
import { commonStyles } from '@/shared/styles/commonStyles';
import { TEXTES } from '@/shared/textes';

type Onglet = ValeurDe<typeof ONGLET_BAR>;

const T = TEXTES.bar;
const PUCES: { valeur: Onglet; label: string }[] = [
  { valeur: ONGLET_BAR.RESTAURATION, label: T.onglets.restauration },
  { valeur: ONGLET_BAR.BAR, label: T.onglets.bar },
  { valeur: ONGLET_BAR.STOCK, label: T.onglets.stock },
];

const PREFIXE_BOISSON = 'boisson:';
const PREFIXE_ALIMENT = 'aliment:';

/**
 * La restauration, le bar et leur stock du gîte. Restauration : le calendrier des repas à préparer. Bar : la vente de
 * boissons (nom, quantité, prix qui suit). Stock : deux sections qui se déroulent (fermées par défaut), les boissons (nom,
 * prix, stock — qui baisse à chaque vente) et la nourriture ; le bouton « + » ajoute une boisson ou un aliment et ouvre
 * sa section.
 */
export default function BarRestauration() {
  const [onglet, setOnglet] = useState<Onglet>(ONGLET_BAR.RESTAURATION);
  const [archive, setArchive] = useState<ArchiveBar>({ boissons: [], aliments: [] });
  const [sejours, setSejours] = useState<Sejour[]>([]);
  const [article, setArticle] = useState<{ cle: string; libelle: string } | null>(null);
  const [alimentOuvert, setAlimentOuvert] = useState(false);
  const [alimentRenomme, setAlimentRenomme] = useState<{ id: string; nom: string } | null>(null);
  const [boissonOuverte, setBoissonOuverte] = useState(false);
  const [boissonModifiee, setBoissonModifiee] = useState<Boisson | undefined>();
  const [boissonsDeroulees, setBoissonsDeroulees] = useState(false);
  const [alimentsDeroules, setAlimentsDeroules] = useState(false);

  const charger = useCallback(async () => {
    const [bar, tous] = await Promise.all([lireArchiveBar(), listSejours()]);
    setArchive({
      boissons: [...bar.boissons].sort((a, b) => a.nom.localeCompare(b.nom)),
      aliments: [...bar.aliments].sort((a, b) => a.nom.localeCompare(b.nom)),
    });
    setSejours(tous);
  }, []);

  useFocusEffect(
    useCallback(() => {
      charger();
    }, [charger]),
  );

  const valider = async (cle: string, delta: number) => {
    if (cle.startsWith(PREFIXE_BOISSON))
      await ajusterStock('boisson', cle.slice(PREFIXE_BOISSON.length), delta);
    else await ajusterStock('aliment', cle.slice(PREFIXE_ALIMENT.length), delta);
    setArticle(null);
    charger();
  };

  const retirerAliment = async () => {
    if (article?.cle.startsWith(PREFIXE_ALIMENT))
      await supprimerAliment(article.cle.slice(PREFIXE_ALIMENT.length));
    setArticle(null);
    charger();
  };

  const creerAliment = async (nom: string) => {
    await ajouterAliment(nom);
    setAlimentOuvert(false);
    setAlimentsDeroules(true);
    charger();
  };

  const renommerLAliment = async (nom: string) => {
    if (alimentRenomme) await renommerAliment(alimentRenomme.id, nom);
    setAlimentRenomme(null);
    charger();
  };

  const validerBoisson = async (nom: string, prix: number) => {
    await enregistrerBoisson({ id: boissonModifiee?.id, nom, prix });
    setBoissonOuverte(false);
    setBoissonsDeroulees(true);
    charger();
  };

  const retirerBoisson = async () => {
    if (boissonModifiee) await supprimerBoisson(boissonModifiee.id);
    setBoissonOuverte(false);
    charger();
  };

  const ligneStock = (cle: string, libelle: string, niveau: number, detail?: string, crayon?: () => void) => (
    <ListRow
      key={cle}
      title={libelle}
      subtitle={niveau < 0 ? T.stock.negatif : detail}
      trailing={
        <View style={stylesStock.fin}>
          <Text style={[styles.resultatLigne, niveau < 0 ? styles.perte : undefined]}>{niveau}</Text>
          {crayon ? (
            <Pressable onPress={crayon} hitSlop={8} accessibilityLabel={T.stock.modifierBoisson}>
              <Ionicons name="pencil" size={18} color={colors.primary} />
            </Pressable>
          ) : null}
        </View>
      }
      onPress={() => setArticle({ cle, libelle })}
    />
  );

  return (
    <Screen scroll={false}>
      <ScrollView contentContainerStyle={commonStyles.listFab}>
        <PucesDefilantes<Onglet> puces={PUCES} valeur={onglet} onChoisir={setOnglet} />

        {onglet === ONGLET_BAR.RESTAURATION ? <RestaurationGite sejours={sejours} /> : null}

        {onglet === ONGLET_BAR.BAR ? <VenteBar boissons={archive.boissons} onVendu={charger} /> : null}

        {onglet === ONGLET_BAR.STOCK ? (
          <>
            <SectionDeroulante
              titre={T.stock.boissons}
              nombre={archive.boissons.length}
              ouverte={boissonsDeroulees}
              onBasculer={() => setBoissonsDeroulees((actuel) => !actuel)}
            >
              {archive.boissons.length === 0 ? (
                <Text style={commonStyles.mutedItalic}>{T.stock.aucuneBoisson}</Text>
              ) : (
                archive.boissons.map((b) =>
                  ligneStock(`${PREFIXE_BOISSON}${b.id}`, b.nom, b.stock ?? 0, formatMontant(b.prix), () => {
                    setBoissonModifiee(b);
                    setBoissonOuverte(true);
                  }),
                )
              )}
            </SectionDeroulante>
            <SectionDeroulante
              titre={T.stock.nourriture}
              nombre={archive.aliments.length}
              ouverte={alimentsDeroules}
              onBasculer={() => setAlimentsDeroules((actuel) => !actuel)}
            >
              {archive.aliments.length === 0 ? (
                <Text style={commonStyles.mutedItalic}>{T.stock.aucunAliment}</Text>
              ) : (
                archive.aliments.map((a) =>
                  ligneStock(`${PREFIXE_ALIMENT}${a.id}`, a.nom, a.stock, undefined, () =>
                    setAlimentRenomme({ id: a.id, nom: a.nom }),
                  ),
                )
              )}
            </SectionDeroulante>
          </>
        ) : null}
      </ScrollView>

      {onglet === ONGLET_BAR.STOCK ? (
        <Fab
          options={[
            {
              label: T.stock.ajouterBoisson,
              icon: 'beer',
              onPress: () => {
                setBoissonModifiee(undefined);
                setBoissonOuverte(true);
              },
            },
            { label: T.stock.ajouterAliment, icon: 'restaurant', onPress: () => setAlimentOuvert(true) },
          ]}
        />
      ) : null}

      <MouvementStockModal
        article={article}
        onValider={valider}
        onSupprimer={article?.cle.startsWith(PREFIXE_ALIMENT) ? retirerAliment : undefined}
        onFermer={() => setArticle(null)}
      />
      <BoissonModal
        visible={boissonOuverte}
        boisson={boissonModifiee}
        onValider={validerBoisson}
        onSupprimer={retirerBoisson}
        onFermer={() => setBoissonOuverte(false)}
      />
      <NomModal
        visible={!!alimentRenomme}
        titre={T.stock.renommerAliment}
        valeurInitiale={alimentRenomme?.nom}
        onValider={renommerLAliment}
        onAnnuler={() => setAlimentRenomme(null)}
      />
      <NomModal
        visible={alimentOuvert}
        titre={T.stock.ajouterAliment}
        placeholder={T.stock.nomAliment}
        onValider={creerAliment}
        onAnnuler={() => setAlimentOuvert(false)}
      />
    </Screen>
  );
}
