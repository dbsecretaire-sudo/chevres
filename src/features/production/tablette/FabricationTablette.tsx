import { useCallback, useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useEtablissement } from '@/features/etablissements/context/EtablissementContext';
import { ListeDeChoix } from '@/features/production/simple/ListeDeChoix';
import { lireArchiveStock } from '@/features/stock/repository';
import {
  articlesAFabriquer,
  erreurFabrication,
  estArticleFromage,
  estArticlePlat,
  fabriquerFromages,
  fabriquerPlats,
  ingredientsDeLaRecette,
  numeroDeLot,
  recettesDuProduit,
} from '@/features/stock/services/lots';
import { libelleIngredientDeRecette, lotsPrisPourIngredient } from '@/features/production/services/ingredientsPlat';
import { ChoixDesLots } from '@/features/production/components/ChoixDesLots';
import { laitsPermis, variantesImposees, type TypeLait } from '@/features/stock/services/dlc';
import { libelleArticle, type ArticleAffiche } from '@/features/stock/services/stock';
import type { ArchiveStock, GenreArticle } from '@/features/stock/types';
import { emojiDeLArticle } from '@/features/stock/services/entrepotJeu';
import { Button } from '@/shared/components/Button';
import { GENRE_ARTICLE, PRODUIT_A_LOTS } from '@/shared/constants/stock';
import { noterAEnvoyer } from '@/shared/storage/aEnvoyer';
import { colors } from '@/shared/theme/colors';
import { TEXTES } from '@/shared/textes';
import { todayISO } from '@/shared/utils/dates';

const T = TEXTES.production.fabricationSimple;

/** Le nom de chaque lait. */
const LAITS: Record<TypeLait, string> = { cru: T.laitCru, pasteurise: T.laitPasteurise, uht: T.laitUht };

/** L'icône de chaque produit dans la liste de choix. */
const ICONE_DU_PRODUIT = {
  [PRODUIT_A_LOTS.FROMAGE]: 'cheese',
  [PRODUIT_A_LOTS.CHARCUTERIE]: 'knife',
  [PRODUIT_A_LOTS.PLAT]: 'pot-steam',
} as const;

/** Les produits suivis lot par lot sur la tablette : le fromage, la charcuterie et les plats préparés. */
type Produit = typeof PRODUIT_A_LOTS.FROMAGE | typeof PRODUIT_A_LOTS.CHARCUTERIE | typeof PRODUIT_A_LOTS.PLAT;

/** Où l'on en est : le produit, puis (fromage) salé ou non et le lait, puis le lot. */
type Etape = 'produit' | 'sale' | 'lait' | 'lot';

/** Une quantité (les litres de lait, le nombre de pièces) : des boutons de pas de 1 et de 10, sans clavier. */
function Compteur({ valeur, onChange }: { valeur: number; onChange: (v: number) => void }) {
  const ajouter = (pas: number) => onChange(Math.max(0, valeur + pas));
  const bouton = (libelle: string, pas: number) => (
    <Pressable accessibilityRole="button" onPress={() => ajouter(pas)} style={styles.pas}>
      <Text style={styles.pasTexte}>{libelle}</Text>
    </Pressable>
  );
  return (
    <View style={styles.compteur}>
      {bouton('-10', -10)}
      {bouton('-', -1)}
      <Text style={styles.valeur}>{valeur}</Text>
      {bouton('+', 1)}
      {bouton('+10', 10)}
    </View>
  );
}

/**
 * La fabrication sur la tablette (l'interface Windows mobile), comme le savon : on choisit d'abord le produit dans une liste de grands boutons. Pour un
 * fromage, on choisit ensuite s'il est salé et son lait (sauf quand le produit les impose). Le lot vient ensuite, avec ces choix rappelés en tête.
 */
export function FabricationTablette({ produit, onTerminer }: { produit: Produit; onTerminer: () => void }) {
  const fromage = produit === PRODUIT_A_LOTS.FROMAGE;
  const { espece } = useEtablissement();
  const [etape, setEtape] = useState<Etape>('produit');
  const [archive, setArchive] = useState<ArchiveStock | null>(null);
  const [articles, setArticles] = useState<ArticleAffiche[]>([]);
  const [article, setArticle] = useState('');
  const [numero, setNumero] = useState('');
  const [date, setDate] = useState(todayISO());
  const [sale, setSale] = useState<boolean | undefined>(undefined);
  const [lait, setLait] = useState<TypeLait | undefined>(undefined);
  const [nombre, setNombre] = useState(0);
  const [message, setMessage] = useState('');
  const [fait, setFait] = useState<{ numero: string; nombre: number } | null>(null);
  // Les lots choisis pour chaque fromage de la recette (par article) ; absents : les plus anciens, d'office.
  const [lotsChoisis, setLotsChoisis] = useState<Record<string, string[]>>({});
  const [recetteOuverte, setRecetteOuverte] = useState(false);

  const appliquer = useCallback(
    (a: ArchiveStock) => {
      setArchive(a);
      setArticles(articlesAFabriquer(a, produit, espece));
      setNumero(numeroDeLot(a));
    },
    [espece, produit],
  );

  useEffect(() => {
    lireArchiveStock().then(appliquer);
  }, [appliquer]);

  // Le nom du fromage dit s'il est affiné (un fromage ajouté au stock n'a pas de type d'office).
  const nomDe = (cle: string) => articles.find((a) => a.cle === cle)?.libelle ?? '';
  const imposee = variantesImposees(article, nomDe(article));
  const saleEffectif = imposee.sale ?? sale;
  const laitEffectif = imposee.lait ?? lait;
  const nombreN = nombre;
  const libelleDuChoix = articles.find((a) => a.cle === article)?.libelle ?? '';
  const appartient = (cle: string) =>
    fromage ? estArticleFromage(cle) : produit === PRODUIT_A_LOTS.PLAT ? estArticlePlat(cle) : cle.startsWith(`${GENRE_ARTICLE.VIANDE}:`);
  // Les lots récents : seulement ceux qui ne sont pas encore vendus, et pour un fromage, ceux du fromage choisi (un vieux ne montre pas les frais).
  const recents = (archive?.lots ?? [])
    .filter((l) => (fromage && article ? l.article === article : appartient(l.article)) && !l.dateVente)
    .slice(-5)
    .reverse();

  /** Le produit choisi : pour un fromage, on demande ensuite ce qui n'est pas imposé. */
  const choisirProduit = (cle: string) => {
    setArticle(cle);
    setSale(undefined);
    setLait(undefined);
    setMessage('');
    if (!fromage) return setEtape('lot');
    const choix = variantesImposees(cle, nomDe(cle));
    setEtape(choix.sale === undefined ? 'sale' : choix.lait || laitsPermis(cle, nomDe(cle)).length === 0 ? 'lot' : 'lait');
  };
  /** Revenir au choix du produit : rien de ce qui suit ne vaut plus. */
  const retourProduit = () => {
    setArticle('');
    setSale(undefined);
    setLait(undefined);
    setLotsChoisis({});
    setMessage('');
    setEtape('produit');
  };
  const retourDuLot = () => {
    if (!fromage) return retourProduit();
    if (!imposee.lait && laitsPermis(article, nomDe(article)).length > 0) return setEtape('lait');
    if (imposee.sale === undefined) return setEtape('sale');
    return retourProduit();
  };

  const enregistrer = async () => {
    if (!archive) return;
    if (!article) return setMessage('Choisissez le produit.');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return setMessage('La date est à écrire ainsi : AAAA-MM-JJ.');
    if (fromage && saleEffectif === undefined) return setMessage('Dites si le fromage est salé.');
    if (fromage && laitsPermis(article, nomDe(article)).length > 0 && !laitEffectif) return setMessage('Choisissez le lait.');
    const erreur = erreurFabrication(archive, article, numero, nombreN);
    if (erreur) return setMessage(erreur);
    try {
      // Les ingrédients viennent de la recette, pour le nombre de pièces, lait compris : le lait sort en litres. Chaque ingrédient prend ses lots choisis
      // (sans plus que sa quantité entière), ou les plus anciens.
      const ingredients = ingredientsDeLaRecette(archive, produit, article, nombreN).map((i) => ({
        ...i,
        lotIds: lotsPrisPourIngredient(archive, { article: i.article, lotIds: lotsChoisis[i.article] }, i.quantite).slice(
          0,
          Math.max(0, Math.floor(i.quantite)),
        ),
      }));
      if (produit === PRODUIT_A_LOTS.PLAT) {
        await fabriquerPlats({ article, date, quantite: nombreN, debut: numero, ingredients });
      } else {
        await fabriquerFromages({
          article,
          date,
          quantite: nombreN,
          debut: numero,
          sale: saleEffectif,
          lait: laitEffectif,
          ingredients,
        });
      }
      await noterAEnvoyer();
      setFait({ numero, nombre: nombreN });
    } catch {
      setMessage(T.erreur);
    }
  };

  const unAutre = async () => {
    setFait(null);
    setMessage('');
    setArticle('');
    setSale(undefined);
    setLait(undefined);
    setLotsChoisis({});
    setNombre(0);
    setDate(todayISO());
    setEtape('produit');
    appliquer(await lireArchiveStock());
  };

  if (fait)
    return (
      <View style={styles.page}>
        <Text style={styles.titre}>{T.fait(fait.nombre, libelleArticle(article, archive ?? ({} as ArchiveStock)))}</Text>
        <Text style={styles.detail}>{`Lot ${fait.numero}`}</Text>
        <View style={styles.actions}>
          <Button label={T.unAutre} variant="secondary" onPress={unAutre} />
          <Button label={T.terminer} onPress={onTerminer} />
        </View>
      </View>
    );

  if (etape === 'produit')
    return (
      <ScrollView contentContainerStyle={styles.page}>
        <Text style={styles.titreCentre}>{fromage ? T.quelFromage : T.quelProduit}</Text>
        {articles.length === 0 ? <Text style={styles.detail}>{T.aucunProduit}</Text> : null}
        <ListeDeChoix
          presentation="gros"
          choix={articles.map((a) => ({
            cle: a.cle,
            libelle: a.libelle,
            icone: ICONE_DU_PRODUIT[produit],
            // L'image du stock de l'article (sinon son dessin).
            image: { cle: a.cle, emoji: emojiDeLArticle(a.cle.split(':')[0] as GenreArticle, a.libelle) },
          }))}
          onChoisir={(c) => choisirProduit(c.cle)}
        />
        <Button label={T.retour} variant="secondary" onPress={onTerminer} />
      </ScrollView>
    );

  if (etape === 'sale')
    return (
      <ScrollView contentContainerStyle={styles.page}>
        <Text style={styles.detail}>{libelleDuChoix}</Text>
        <Text style={styles.titreCentre}>{T.leFromageEstSale}</Text>
        <ListeDeChoix
          presentation="gros"
          choix={[
            { cle: 'non', libelle: T.nonSale, icone: 'cheese' },
            { cle: 'oui', libelle: T.sale, icone: 'shaker-outline' },
          ]}
          onChoisir={(c) => {
            setSale(c.cle === 'oui');
            setEtape(imposee.lait ? 'lot' : 'lait');
          }}
        />
        <Button label={T.retour} variant="secondary" onPress={retourProduit} />
      </ScrollView>
    );

  if (etape === 'lait')
    return (
      <ScrollView contentContainerStyle={styles.page}>
        <Text style={styles.detail}>{`${libelleDuChoix} · ${saleEffectif ? T.sale : T.nonSale}`}</Text>
        <Text style={styles.titreCentre}>{T.quelLait}</Text>
        <ListeDeChoix
          presentation="gros"
          choix={laitsPermis(article, nomDe(article)).map((l) => ({ cle: l as string, libelle: LAITS[l], icone: 'water' as const }))}
          onChoisir={(c) => {
            setLait(c.cle as TypeLait);
            setEtape('lot');
          }}
        />
        <Button
          label={T.retour}
          variant="secondary"
          onPress={() => (imposee.sale === undefined ? setEtape('sale') : retourProduit())}
        />
      </ScrollView>
    );

  // Le lot : les choix faits (produit, salé, lait) sont rappelés en tête.
  // Le vieux n'a ni salé ni lait à montrer : son nom suffit.
  const recapitulatif =
    fromage && laitsPermis(article, nomDe(article)).length > 0
      ? `${libelleDuChoix} - ${saleEffectif ? T.sale : T.nonSale}${laitEffectif ? ` - ${LAITS[laitEffectif]}` : ''}`
      : libelleDuChoix;
  // Les fromages de la recette (frais, crottin, brocciu…) : leurs lots se choisissent ici, comme pour un plat.
  const fromagesDeLaRecette =
    archive && article ? ingredientsDeLaRecette(archive, produit, article, nombreN).filter((i) => estArticleFromage(i.article)) : [];
  // La recette du choix, pour le nombre de pièces demandé : ses ingrédients (quantités calculées) et ses étapes.
  const recette =
    archive && article
      ? (recettesDuProduit(archive, produit, article).find((r) => r.article === article) ??
        recettesDuProduit(archive, produit, article).find((r) => !r.article))
      : undefined;
  const ingredientsRecette = archive && article ? ingredientsDeLaRecette(archive, produit, article, nombreN) : [];

  return (
    <ScrollView contentContainerStyle={[styles.page, styles.pleineHauteur]}>
      <Text style={styles.recap}>{recapitulatif}</Text>
      <Text style={styles.titre}>Nouveau lot de fabrication</Text>
      <View style={styles.grille}>
        <View style={styles.colonne}>
          <Text style={styles.detail}>Lots récents</Text>
          {recents.length === 0 ? <Text style={styles.detail}>Aucun lot pour l’instant.</Text> : null}
          {recents.map((l) => (
            <View key={l.id} style={styles.carte}>
              <Text style={styles.carteTitre}>{l.numero}</Text>
              <Text style={styles.detail}>{`${libelleArticle(l.article, archive ?? ({} as ArchiveStock))} · ${l.dateFabrication}`}</Text>
            </View>
          ))}
        </View>

        <View style={[styles.colonne, styles.formulaire]}>
          <Button label="Voir la recette" variant="secondary" onPress={() => setRecetteOuverte(true)} />

          <View style={styles.deuxChamps}>
            <View style={styles.champ}>
              <Text style={styles.libelle}>Numéro de lot</Text>
              <TextInput style={[styles.saisie, styles.numero]} value={numero} onChangeText={setNumero} keyboardType="number-pad" />
            </View>
            <View style={styles.champ}>
              <Text style={styles.libelle}>Date de fabrication</Text>
              <TextInput style={styles.saisie} value={date} onChangeText={setDate} placeholder="AAAA-MM-JJ" />
            </View>
          </View>

          <Text style={styles.libelle}>Nombre de pièces</Text>
          <Compteur valeur={nombre} onChange={setNombre} />

          {archive
            ? fromagesDeLaRecette.map((f) => (
                <ChoixDesLots
                  key={f.article}
                  archive={archive}
                  article={f.article}
                  quantite={f.quantite}
                  lotIds={lotsChoisis[f.article]}
                  onChange={(lotIds) => setLotsChoisis({ ...lotsChoisis, [f.article]: lotIds })}
                  afficheVide
                />
              ))
            : null}

          {message ? <Text style={styles.erreur}>{message}</Text> : null}

          <View style={[styles.actions, styles.bas]}>
            <Button label={T.retour} variant="secondary" onPress={retourDuLot} style={styles.boutonRetour} styleTexte={styles.texteBouton} />
            <Button
              label="Enregistrer le lot"
              disabled={!article || !(nombreN > 0)}
              onPress={enregistrer}
              style={styles.boutonEnregistrer}
              styleTexte={styles.texteBouton}
            />
          </View>
        </View>
      </View>
      <Modal visible={recetteOuverte} transparent animationType="fade" onRequestClose={() => setRecetteOuverte(false)}>
        <View style={styles.fond}>
          <View style={styles.feuille}>
            <ScrollView contentContainerStyle={styles.corps}>
              <Text style={styles.titre}>{libelleDuChoix}</Text>
              <Text style={styles.detail}>{`Pour ${nombreN} ${nombreN > 1 ? 'pièces' : 'pièce'}`}</Text>
              <Text style={styles.libelle}>Ingrédients</Text>
              {!recette ? <Text style={styles.detail}>Aucune recette pour ce produit.</Text> : null}
              {recette && ingredientsRecette.length === 0 ? (
                <Text style={styles.detail}>Aucun ingrédient : rien ne sort du stock.</Text>
              ) : null}
              {archive
                ? ingredientsRecette.map((i) => (
                    <Text key={i.article} style={styles.carteTitre}>
                      {libelleIngredientDeRecette({ article: i.article, quantite: i.quantite, unite: archive.unites?.[i.article] }, archive)}
                    </Text>
                  ))
                : null}
              <Text style={styles.libelle}>Préparation</Text>
              {recette?.etapes?.length ? (
                recette.etapes.map((e, n) => (
                  <Text key={n} style={styles.carteTitre}>{`${n + 1}. ${e}`}</Text>
                ))
              ) : (
                <Text style={styles.detail}>Aucune étape n’est renseignée.</Text>
              )}
            </ScrollView>
            <Button label="Fermer" variant="secondary" onPress={() => setRecetteOuverte(false)} />
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { padding: 16, gap: 14 },
  // La page prend toute la hauteur de la fenêtre : la grille s'étire, et le formulaire descend jusqu'en bas.
  pleineHauteur: { flexGrow: 1 },
  titre: { fontSize: 22, fontWeight: '500', color: colors.text },
  titreCentre: { fontSize: 22, fontWeight: '600', color: colors.text, textAlign: 'center' },
  recap: { fontSize: 18, fontWeight: '600', color: colors.primary },
  grille: { flex: 1, flexDirection: 'row', gap: 12, flexWrap: 'wrap', alignContent: 'stretch' },
  colonne: { flex: 1, minWidth: 280, gap: 10 },
  formulaire: { flex: 2, backgroundColor: colors.surface, borderRadius: 12, padding: 16, borderWidth: 0.5, borderColor: colors.border },
  libelle: { fontSize: 22, fontWeight: '600', color: colors.text },
  detail: { fontSize: 14, color: colors.textMuted },
  carte: { backgroundColor: colors.surface, borderRadius: 12, padding: 10, borderWidth: 0.5, borderColor: colors.border },
  carteTitre: { fontSize: 16, fontWeight: '500', color: colors.text },
  deuxChamps: { flexDirection: 'row', gap: 12 },
  champ: { flex: 1, gap: 4 },
  saisie: {
    borderRadius: 12,
    borderWidth: 0.5,
    borderColor: colors.border,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 18,
    color: colors.text,
    backgroundColor: colors.background,
  },
  numero: { fontSize: 20, fontWeight: '500', color: colors.primary },
  erreur: { fontSize: 14, color: colors.danger ?? '#a33' },
  compteur: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  pas: {
    minWidth: 80,
    minHeight: 64,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 0.5,
    borderColor: colors.border,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pasTexte: { fontSize: 22, fontWeight: '600', color: colors.text },
  valeur: { fontSize: 44, fontWeight: '700', color: colors.text },
  // Les boutons du bas de la carte : ils descendent jusqu'en bas du formulaire.
  bas: { marginTop: 'auto' },
  fond: { flex: 1, justifyContent: 'center', padding: 16, backgroundColor: 'rgba(0,0,0,0.35)' },
  feuille: { backgroundColor: colors.surface, borderRadius: 16, padding: 16, gap: 12, maxHeight: '90%' },
  corps: { gap: 10 },
  actions: { flexDirection: 'row', gap: 12, marginTop: 4 },
  boutonRetour: { flex: 1, minHeight: 96 },
  boutonEnregistrer: { flex: 2, minHeight: 96 },
  texteBouton: { fontSize: 24, fontWeight: '600' },
});
