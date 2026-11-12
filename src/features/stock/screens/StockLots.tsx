import { useCallback, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Badge } from '@/shared/components/Badge';
import { Button } from '@/shared/components/Button';
import { BlocLignes } from '@/shared/components/BlocListe';
import { ListRow } from '@/shared/components/ListRow';
import { ArticleStockModal } from '@/features/stock/components/ArticleStockModal';
import { NomModal } from '@/features/dossiers/components/NomModal';
import { OptionsModal } from '@/shared/components/OptionsModal';
import { ConfirmModal } from '@/shared/components/ConfirmModal';
import { HistoriqueArticleModal } from '@/features/stock/components/HistoriqueArticleModal';
import { MouvementStockModal } from '@/features/stock/components/MouvementStockModal';
import { lireArchiveStock } from '@/features/stock/repository';
import {
  ajouterArticle,
  ajouterConsommablesManquants,
  ajouterMouvementManuel,
  type ArticleAffiche,
  articlesDuGenre,
  consommablesManquants,
  definirDureesDeVie,
  definirPrixArticle,
  definirUniteArticle,
  masquerArticle,
  niveauxDeStock,
  prixDesOeufs,
  renommerArticle,
  supprimerArticle,
} from '@/features/stock/services/stock';
import { dureesDeVieDeLArticle } from '@/features/stock/services/dlc';
import { emojiDeLArticle } from '@/features/stock/services/entrepotJeu';
import { DessinDeCarte } from '@/features/stock/components/DessinDeCarte';
import { ModaleImageArticle } from '@/features/stock/components/ModaleImageArticle';
import type { ArchiveStock, GenreArticle } from '@/features/stock/types';
import { useEtablissement } from '@/features/etablissements/context/EtablissementContext';
import { useRole } from '@/features/roles/context/RoleContext';
import { TYPE_ANIMAL_ETABLISSEMENT } from '@/shared/constants/etablissements';
import { ROLE } from '@/shared/constants/roles';
import { ROUTES } from '@/shared/constants/routes';
import { CLE_PRIX_OEUFS, GENRE_ARTICLE, NATURE_PAR_GENRE, NATURE_STOCK, ORIGINE_MOUVEMENT } from '@/shared/constants/stock';
import { SelectField } from '@/shared/components/SelectField';
import { UNITES_STOCK, genreAvecUnite } from '@/features/stock/services/unites';
import { colors } from '@/shared/theme/colors';
import { TEXTES } from '@/shared/textes';
import { formatMontant, todayISO } from '@/shared/utils/dates';
import { SECTIONS } from '@/features/stock/utils/categories';
import { COMPTE_PAR_SECTION_INVENTAIRE } from '@/shared/constants/planComptable';

const T = TEXTES.stock;

/** L'onglet des œufs : ils n'ont pas d'article, seulement un prix (celui de l'inventaire). */
const ONGLET_OEUFS = 'oeufs';

/** L'unité proposée d'office à l'ajout d'un consommable : on le compte à la pièce. */
const UNITE_PAR_DEFAUT = 'pièce';

type Onglet = typeof ONGLET_OEUFS | GenreArticle;

/**
 * Les onglets du stock : une pastille par catégorie, comme sur la maquette. `ajout` est le bouton d'ajout de la catégorie (absent quand on ne
 * l'ajoute pas à la main : les boucles entrent par un achat, les œufs n'ont pas d'article). `unite` est celle de la quantité (le kilo des aliments).
 */
const ONGLETS: { cle: Onglet; titre: string; ajout?: string; unite?: string }[] = [
  { cle: GENRE_ARTICLE.FROMAGE, titre: 'Fromages', ajout: 'Ajouter un fromage' },
  { cle: ONGLET_OEUFS, titre: 'Œufs' },
  { cle: GENRE_ARTICLE.VIANDE, titre: 'Viande', ajout: 'Ajouter une viande' },
  { cle: GENRE_ARTICLE.PLAT, titre: 'Plats', ajout: 'Ajouter un plat' },
  { cle: GENRE_ARTICLE.SAVON, titre: 'Savons', ajout: 'Ajouter un savon' },
  { cle: GENRE_ARTICLE.EMBALLAGE, titre: 'Emballages', ajout: 'Ajouter un emballage' },
  { cle: GENRE_ARTICLE.ALIMENT, titre: 'Aliments', ajout: 'Ajouter un aliment', unite: 'kg' },
  { cle: GENRE_ARTICLE.BOUCLE, titre: 'Boucles' },
  { cle: GENRE_ARTICLE.ENTRETIEN, titre: 'Entretien', ajout: 'Ajouter un produit d’entretien' },
  { cle: GENRE_ARTICLE.MATERIEL, titre: 'Matériel', ajout: 'Ajouter un matériel' },
  { cle: GENRE_ARTICLE.BATIMENT, titre: 'Bâtiment', ajout: 'Ajouter un matériel de bâtiment' },
  { cle: GENRE_ARTICLE.EQUIPEMENT, titre: 'Consommables', ajout: 'Ajouter un consommable' },
];

/** Les onglets de l'espèce active : les œufs sont ceux des poules, le savon est celui de la chèvre ; les plats et la viande valent pour toutes. */
const ongletVisible = (cle: Onglet, espece: string): boolean => {
  if (cle === ONGLET_OEUFS) return espece === TYPE_ANIMAL_ETABLISSEMENT.POULES;
  if (cle === GENRE_ARTICLE.SAVON) return espece === TYPE_ANIMAL_ETABLISSEMENT.CHEVRES;
  return true;
};

/**
 * Le stock sur le téléphone, comme sur la maquette : une pastille par catégorie du stock (fromages, viande, aliments, boucles…), une carte par
 * article avec son prix et son nombre en stock, un bouton pour ajouter, puis les rubriques avancées (structure des listes, historique, statistiques).
 */
export default function StockLots() {
  const router = useRouter();
  const { role } = useRole();
  const { espece } = useEtablissement();
  // Le mode normal regarde seulement : les rubriques avancées ne s'affichent pas.
  const simple = role === ROLE.BERGER;
  const [archive, setArchive] = useState<ArchiveStock | null>(null);
  const [onglet, setOnglet] = useState<Onglet>(ONGLETS[0].cle);
  const [ajoutOuvert, setAjoutOuvert] = useState(false);
  const [prixOeufsOuvert, setPrixOeufsOuvert] = useState(false);
  const [uniteAjout, setUniteAjout] = useState<string>(UNITE_PAR_DEFAUT);
  // Le menu d'actions d'un article (un appui sur sa carte), puis la fenêtre choisie : modifier, historique, entrée ou sortie, supprimer.
  const [actionsDe, setActionsDe] = useState<ArticleAffiche | null>(null);
  const [renomme, setRenomme] = useState<ArticleAffiche | null>(null);
  /** L'article dont on change l'image depuis la liste (sans passer par « Modifier »). */
  const [imageDe, setImageDe] = useState<{ cle: string; titre: string; emoji: string } | null>(null);
  const [historiqueDe, setHistoriqueDe] = useState<ArticleAffiche | null>(null);
  const [mouvementDe, setMouvementDe] = useState<ArticleAffiche | null>(null);
  const [aSupprimer, setASupprimer] = useState<ArticleAffiche | null>(null);

  const charger = useCallback(() => {
    lireArchiveStock()
      .then(setArchive)
      .catch(() => undefined);
  }, []);

  useFocusEffect(
    useCallback(() => {
      charger();
    }, [charger]),
  );

  /** Enregistre la fenêtre de modification : nom, prix, durée de conservation (les fromages), puis relit le stock. */
  const enregistrerArticle = async (
    a: ArticleAffiche,
    nom: string,
    prix?: number,
    plus?: { dureesDeVie?: Record<string, number> },
  ) => {
    if (nom) await renommerArticle(a.cle, nom);
    await definirPrixArticle(a.cle, prix);
    if (a.cle.startsWith(`${GENRE_ARTICLE.FROMAGE}:`)) await definirDureesDeVie(a.cle, plus?.dureesDeVie ?? {});
    setRenomme(null);
    charger();
  };

  /** Une entrée ou une sortie de stock : une sortie d'un consommable est une consommation. */
  const valider = async (cle: string, delta: number, litres?: number, unite?: string) => {
    if (delta !== 0) {
      const consomme = delta < 0 && NATURE_PAR_GENRE[cle.split(':')[0] as GenreArticle] === NATURE_STOCK.CONSOMMABLE;
      await ajouterMouvementManuel(
        cle,
        delta,
        todayISO(),
        litres,
        consomme ? ORIGINE_MOUVEMENT.CONSOMMATION : ORIGINE_MOUVEMENT.MANUEL,
      );
    }
    if (unite !== undefined) await definirUniteArticle(cle, unite);
    setMouvementDe(null);
    charger();
  };

  /** Supprime l'article confirmé : un article ajouté disparaît, un article d'office est masqué. */
  const retirer = async () => {
    if (aSupprimer?.id) await supprimerArticle(aSupprimer.id);
    else if (aSupprimer) await masquerArticle(aSupprimer.cle);
    setASupprimer(null);
    charger();
  };

  /** Tout article se supprime, sauf les boucles, qui entrent par un achat. */
  const estSupprimable = (cle: string): boolean => cle.split(':')[0] !== GENRE_ARTICLE.BOUCLE;

  const visibles = useMemo(() => ONGLETS.filter((o) => ongletVisible(o.cle, espece)), [espece]);
  const ongletCourant = visibles.find((o) => o.cle === onglet) ?? visibles[0];
  const genre = ongletCourant.cle;
  // Le compte PCG de chaque catégorie, affiché dans la liste déroulante (les œufs n'ont pas de liste d'inventaire, donc pas de compte).
  const compteDe = (cle: string) => {
    const section = SECTIONS.find((s) => s.genre === cle);
    return section ? COMPTE_PAR_SECTION_INVENTAIRE[section.section] : undefined;
  };
  // La viande se regarde par espèce : celle de l'espèce active (les autres animaux n'apparaissent pas).
  const articles = useMemo(
    () =>
      archive && genre !== ONGLET_OEUFS
        ? articlesDuGenre(genre, archive, genre === GENRE_ARTICLE.VIANDE ? espece : undefined)
        : [],
    [archive, genre, espece],
  );
  const niveaux = useMemo(() => (archive ? niveauxDeStock(archive.mouvements) : new Map<string, number>()), [archive]);
  if (!archive) return null;

  // Un consommable se compte dans une unité choisie à l'ajout (« pièce » d'office).
  const avecUnite = genreAvecUnite(genre);

  const ajouter = async (nom: string) => {
    if (genre === ONGLET_OEUFS) return;
    await ajouterArticle(genre, nom, undefined, undefined, avecUnite ? uniteAjout : undefined);
    setAjoutOuvert(false);
    charger();
  };

  const avance = (
    <View style={styles.trailing}>
      <Badge label="Avancé" color={colors.text} />
      <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
    </View>
  );

  return (
    <ScrollView contentContainerStyle={styles.contenu} style={styles.fond}>
      {/* Une liste déroulante : toutes les catégories tiennent, même sur un petit écran (les pastilles en ligne coupaient les dernières). */}
      <SelectField<string>
        label="Catégorie"
        value={genre}
        onChange={(cle) => setOnglet(cle as Onglet)}
        options={visibles.map((o) => {
          const compte = compteDe(o.cle);
          return { value: o.cle, label: compte ? `${compte.numero} · ${o.titre}` : o.titre };
        })}
      />

      {genre === ONGLET_OEUFS ? (
        <>
          <View style={styles.carte}>
            <View style={styles.carteTexte}>
              <Text style={styles.nom}>{T.oeufs.prixDeLOeuf}</Text>
              <Text style={styles.prix}>{T.oeufs.prixOeuf(formatMontant(prixDesOeufs(archive)))}</Text>
            </View>
            <Pressable onPress={() => setPrixOeufsOuvert(true)} hitSlop={8} accessibilityLabel={T.oeufs.modifierLePrix}>
              <Ionicons name="pencil" size={20} color={colors.ajout} />
            </Pressable>
          </View>
          <Text style={styles.note}>{T.oeufs.note}</Text>
        </>
      ) : (
        <>
          {articles.length === 0 ? <Text style={styles.vide}>Aucun article pour le moment.</Text> : null}
          <View style={styles.bloc}>
          {articles.map((a, i) => {
            const niveau = niveaux.get(a.cle) ?? 0;
            return (
              // La ligne et l'image sont deux zones distinctes (pas d'imbrication) : un appui sur l'image ne déclenche jamais la ligne.
              <View key={a.cle} style={[styles.carte, styles.carteDansBloc, i > 0 && styles.carteSeparee]}>
                {/* L'image de l'article (ou son dessin d'origine) : un appui sur l'image permet de la changer, là où on peut en choisir une. */}
                {!simple ? (
                  <Pressable
                    onPress={() =>
                      setImageDe({ cle: a.cle, titre: a.libelle, emoji: emojiDeLArticle(a.cle.split(':')[0] as GenreArticle, a.libelle) })
                    }
                    hitSlop={6}
                    style={styles.dessin}
                    accessibilityRole="button"
                    accessibilityLabel={TEXTES.stock.articleModal.image.modifier}
                  >
                    <DessinDeCarte emoji={emojiDeLArticle(a.cle.split(':')[0] as GenreArticle, a.libelle)} cle={a.cle} />
                  </Pressable>
                ) : (
                  <View style={styles.dessin}>
                    <DessinDeCarte emoji={emojiDeLArticle(a.cle.split(':')[0] as GenreArticle, a.libelle)} cle={a.cle} />
                  </View>
                )}
                {/* Le reste de la ligne : son nom, son prix et sa quantité ; un appui ouvre le menu de l'article. */}
                <Pressable
                  style={styles.zoneTexte}
                  onPress={() => !simple && setActionsDe(a)}
                  accessibilityRole="button"
                >
                  <View style={styles.carteTexte}>
                    <Text style={styles.nom}>{a.libelle}</Text>
                    {a.prix ? (
                      <Text style={styles.prix}>{`${formatMontant(a.prix)} ${ongletCourant.unite ? 'le kilo' : 'la pièce'}`}</Text>
                    ) : null}
                  </View>
                  <Text style={styles.quantite}>
                    {ongletCourant.unite ? `${niveau} ${ongletCourant.unite}` : a.unite ? `${niveau} ${a.unite}` : `${niveau} en stock`}
                  </Text>
                </Pressable>
              </View>
            );
          })}
          </View>
          {ongletCourant.ajout ? (
            <Button
              label={ongletCourant.ajout}
              onPress={() => {
                setUniteAjout(UNITE_PAR_DEFAUT);
                setAjoutOuvert(true);
              }}
            />
          ) : null}
        </>
      )}

      {/* Les consommables des listes de départ (farine, huiles, soude…) qu'on n'a pas encore dans le stock : leur unité se renseigne ensuite. */}
      {genre === GENRE_ARTICLE.EQUIPEMENT && archive && consommablesManquants(archive).length > 0 ? (
        <Button
          variant="secondary"
          label="Ajouter les consommables manquants"
          onPress={async () => {
            await ajouterConsommablesManquants();
            charger();
          }}
        />
      ) : null}

      {simple ? null : (
        <BlocLignes>
          <ListRow
            title="Structure des listes"
            icone="list"
            trailing={avance}
            onPress={() => router.push(ROUTES.STOCK_STRUCTURE)}
          />
          <ListRow
            title="Historique"
            icone="time"
            trailing={avance}
            onPress={() => router.push(ROUTES.stockHistorique())}
          />
          <ListRow
            title="Statistiques"
            icone="stats-chart"
            trailing={avance}
            onPress={() => router.push(ROUTES.STOCK_STATISTIQUES)}
          />
        </BlocLignes>
      )}

      <ModaleImageArticle article={imageDe} onFermer={() => setImageDe(null)} />

      <NomModal
        visible={ajoutOuvert}
        titre={ongletCourant.ajout ?? ''}
        onValider={ajouter}
        onAnnuler={() => setAjoutOuvert(false)}
        enfants={
          avecUnite ? (
            <SelectField<string>
              label={T.modal.unite}
              value={uniteAjout}
              onChange={setUniteAjout}
              options={UNITES_STOCK.map((u) => ({ value: u.cle, label: u.libelle }))}
            />
          ) : null
        }
      />

      <OptionsModal
        visible={!!actionsDe}
        onClose={() => setActionsDe(null)}
        title={actionsDe?.libelle}
        options={
          actionsDe
            ? [
                { label: TEXTES.commun.general.modifier, icon: 'create-outline', onPress: () => setRenomme(actionsDe) },
                { label: T.historiqueArticle.titre, icon: 'time-outline', onPress: () => setHistoriqueDe(actionsDe) },
                { label: T.modal.entreeSortie, icon: 'swap-vertical-outline', onPress: () => setMouvementDe(actionsDe) },
                ...(estSupprimable(actionsDe.cle)
                  ? [
                      {
                        label: TEXTES.commun.general.supprimer,
                        icon: 'trash-outline' as const,
                        color: colors.danger,
                        onPress: () => setASupprimer(actionsDe),
                      },
                    ]
                  : []),
              ]
            : []
        }
      />
      <ArticleStockModal
        visible={!!renomme}
        titre={renomme?.libelle ?? ''}
        nom={renomme?.libelle}
        cle={renomme?.cle}
        emoji={renomme ? emojiDeLArticle(renomme.cle.split(':')[0] as GenreArticle, renomme.libelle) : undefined}
        prix={renomme?.prix}
        avecPrix={!!renomme}
        avecDlc={!!renomme && renomme.cle.startsWith(`${GENRE_ARTICLE.FROMAGE}:`)}
        dlcParVariante={!!renomme && renomme.cle.startsWith(`${GENRE_ARTICLE.FROMAGE}:`)}
        dureesDeVie={renomme && archive ? dureesDeVieDeLArticle(archive, renomme.cle) : undefined}
        onValider={(nom, prix, _litres, _image, plus) => renomme && enregistrerArticle(renomme, nom, prix, plus)}
        onAnnuler={() => setRenomme(null)}
      />
      <HistoriqueArticleModal
        article={
          historiqueDe
            ? {
                cle: historiqueDe.cle,
                titre: historiqueDe.libelle,
                emoji: emojiDeLArticle(historiqueDe.cle.split(':')[0] as GenreArticle, historiqueDe.libelle),
                unite: historiqueDe.cle.startsWith(`${GENRE_ARTICLE.ALIMENT}:`) ? TEXTES.commun.general.kg : undefined,
              }
            : null
        }
        onAjuster={() => {
          setMouvementDe(historiqueDe);
          setHistoriqueDe(null);
        }}
        onAutomatiqueChange={() => charger()}
        onFermer={() => setHistoriqueDe(null)}
      />
      <MouvementStockModal
        article={mouvementDe}
        unite={
          mouvementDe?.cle.startsWith(`${GENRE_ARTICLE.ALIMENT}:`)
            ? TEXTES.commun.general.kg
            : mouvementDe
              ? archive?.unites?.[mouvementDe.cle]
              : undefined
        }
        consommable={!!mouvementDe && NATURE_PAR_GENRE[mouvementDe.cle.split(':')[0] as GenreArticle] === NATURE_STOCK.CONSOMMABLE}
        avecUnite={!!mouvementDe && genreAvecUnite(mouvementDe.cle.split(':')[0])}
        niveau={mouvementDe ? niveaux.get(mouvementDe.cle) : undefined}
        onValider={valider}
        onSupprimer={
          mouvementDe && estSupprimable(mouvementDe.cle)
            ? () => {
                setASupprimer(mouvementDe);
                setMouvementDe(null);
              }
            : undefined
        }
        onFermer={() => setMouvementDe(null)}
      />
      <ConfirmModal
        visible={!!aSupprimer}
        title={T.suppression.titre}
        message={T.suppression.message(aSupprimer?.libelle ?? '')}
        confirmLabel={TEXTES.commun.general.supprimer}
        onCancel={() => setASupprimer(null)}
        onConfirm={retirer}
      />
      <ArticleStockModal
        visible={prixOeufsOuvert}
        titre={T.oeufs.modifierLePrix}
        prix={prixDesOeufs(archive)}
        avecPrix
        libellePrix={T.oeufs.prixLabel}
        onValider={async (_nom, prix) => {
          await definirPrixArticle(CLE_PRIX_OEUFS, prix);
          setPrixOeufsOuvert(false);
          charger();
        }}
        onAnnuler={() => setPrixOeufsOuvert(false)}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  fond: { flex: 1, backgroundColor: colors.background },
  contenu: { padding: 16, gap: 12 },
  entete: { backgroundColor: colors.badgeBg, borderRadius: 8, paddingVertical: 6, paddingHorizontal: 12 },
  enteteTexte: { fontWeight: '700', color: colors.primary },
  vide: { color: colors.textMuted, textAlign: 'center' },
  note: { color: colors.textMuted, fontSize: 13 },
  carte: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
  },
  // Les articles d'une catégorie forment un seul bloc : sans espace entre eux, séparés par un trait.
  bloc: { backgroundColor: colors.surface, borderRadius: 14, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' },
  carteDansBloc: { borderRadius: 0, borderWidth: 0 },
  carteSeparee: { borderTopWidth: 1, borderTopColor: colors.border },
  carteTexte: { flex: 1, gap: 2 },
  zoneTexte: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 },
  dessin: { width: 52, height: 52, alignItems: 'center', justifyContent: 'center' },
  nom: { fontSize: 16, fontWeight: '700', color: colors.text },
  prix: { color: colors.textMuted },
  quantite: { fontSize: 16, fontWeight: '800', color: colors.text },
  trailing: { flexDirection: 'row', alignItems: 'center', gap: 6 },
});
