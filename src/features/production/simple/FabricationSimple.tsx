import { useEffect, useState } from 'react';
import { ScrollView, Text, Pressable, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useEtablissement } from '@/features/etablissements/context/EtablissementContext';
import { lireArchiveStock } from '@/features/stock/repository';
import {
  articlesDuProduit,
  erreurFabrication,
  fabriquerFromages,
  fabriquerPlats,
  fabriquerSavons,
  numeroDeLot,
} from '@/features/stock/services/lots';
import { emojiDeLArticle } from '@/features/stock/services/entrepotJeu';
import { TYPES_DE_LAIT, variantesImposees, type TypeLait, type VarianteDeFromage } from '@/features/stock/services/dlc';
import { noterAEnvoyer } from '@/shared/storage/aEnvoyer';
import { definirLitresParFromage, type ArticleAffiche } from '@/features/stock/services/stock';
import type { ArchiveStock, GenreArticle } from '@/features/stock/types';
import { ClavierNumerique } from '@/features/berger/components/ClavierNumerique';
import { Button } from '@/shared/components/Button';
import { ListeDeChoix, type PresentationDesChoix } from '@/features/production/simple/ListeDeChoix';
import { JOURS_DE_CURE_SAVON, PRODUIT_A_LOTS } from '@/shared/constants/stock';
import { styles } from '@/shared/styles/roles/Roles.styles';
import { colors } from '@/shared/theme/colors';
import { TEXTES } from '@/shared/textes';
import { ajouterJours } from '@/shared/utils/calendrier';
import { todayISO } from '@/shared/utils/dates';
import { parseDecimal } from '@/shared/utils/nombres';

const T = TEXTES.production.fabricationSimple;

/** Le nom de chaque lait. */
const LAITS: Record<TypeLait, string> = { cru: T.laitCru, pasteurise: T.laitPasteurise, uht: T.laitUht };

type Produit =
  | typeof PRODUIT_A_LOTS.FROMAGE
  | typeof PRODUIT_A_LOTS.CHARCUTERIE
  | typeof PRODUIT_A_LOTS.PLAT
  | typeof PRODUIT_A_LOTS.SAVON;

/** L'icône de chaque produit. */
const ICONE_DU_PRODUIT = {
  [PRODUIT_A_LOTS.FROMAGE]: 'cheese',
  [PRODUIT_A_LOTS.CHARCUTERIE]: 'knife',
  [PRODUIT_A_LOTS.PLAT]: 'pot-steam',
  [PRODUIT_A_LOTS.SAVON]: 'hand-wash',
} as const;

/** Où l'on en est : choisir le produit, dire (un fromage) s'il est salé et de quel lait, les litres de lait caillé, combien, puis voir que c'est enregistré. */
type Etape =
  | { nom: 'produit' }
  | { nom: 'sale'; article: ArticleAffiche }
  | { nom: 'lait'; article: ArticleAffiche; sale: boolean }
  | { nom: 'litres'; article: ArticleAffiche; variante?: VarianteDeFromage }
  | { nom: 'nombre'; article: ArticleAffiche; litres?: number; variante?: VarianteDeFromage }
  | { nom: 'fait'; titre: string; detail: string }
  | { nom: 'erreur'; message: string };

/**
 * Fabriquer un fromage, de la charcuterie, un plat ou un savon au plus simple, en très grands boutons : le produit (frais, affiné…, ceux des produits finis), puis, pour un
 * fromage, les litres de lait caillé, puis combien ont été faits. La fabrication est celle d'aujourd'hui, numérotée comme d'habitude ; tout le reste
 * (ingrédients, notes) se complète dans l'écran habituel. `onTerminer` ferme l'écran.
 */
export function FabricationSimple({
  produit,
  onTerminer,
  presentation = 'gros',
}: {
  produit: Produit;
  onTerminer: () => void;
  /** Les produits en très grands boutons (mode normal) ou en tuiles (mode avancé). */
  presentation?: PresentationDesChoix;
}) {
  const fromage = produit === PRODUIT_A_LOTS.FROMAGE;
  const savon = produit === PRODUIT_A_LOTS.SAVON;
  const { espece } = useEtablissement();
  const [archive, setArchive] = useState<ArchiveStock | null>(null);
  const [articles, setArticles] = useState<ArticleAffiche[]>([]);
  const [etape, setEtape] = useState<Etape>({ nom: 'produit' });
  const [saisie, setSaisie] = useState('');

  useEffect(() => {
    lireArchiveStock().then((a) => {
      setArchive(a);
      setArticles(articlesDuProduit(produit, a, espece));
    });
  }, [espece, produit]);

  const recommencer = () => {
    setSaisie('');
    setEtape({ nom: 'produit' });
  };

  const choisir = (article: ArticleAffiche) => {
    setSaisie('');
    if (!fromage) return setEtape(savon ? { nom: 'litres', article } : { nom: 'nombre', article });
    // Le vieux est toujours salé, le brocciu toujours salé et pasteurisé : ces questions ne se posent pas.
    const imposee = variantesImposees(article.cle);
    if (imposee.sale === undefined) return setEtape({ nom: 'sale', article });
    if (!imposee.lait) return setEtape({ nom: 'lait', article, sale: imposee.sale });
    setEtape({ nom: 'litres', article, variante: { sale: imposee.sale, lait: imposee.lait } });
  };

  const fabriquer = async (article: ArticleAffiche, nombre: number, litres?: number, variante?: VarianteDeFromage) => {
    if (!archive) return;
    try {
      const date = todayISO();
      const debut = numeroDeLot(archive, article.cle, date, fromage ? variante : undefined);
      const erreur = erreurFabrication(archive, article.cle, debut, nombre);
      if (erreur) return setEtape({ nom: 'erreur', message: erreur });
      // Les litres par fromage se recalculent à chaque fabrication : les litres caillés divisés par le nombre de fromages, gardés pour la fois suivante.
      if (fromage && litres && litres > 0 && nombre > 0)
        await definirLitresParFromage(article.cle, Math.round((litres / nombre) * 100) / 100);
      if (produit === PRODUIT_A_LOTS.PLAT) {
        await fabriquerPlats({ article: article.cle, date, quantite: nombre, debut, ingredients: [] });
      } else if (produit === PRODUIT_A_LOTS.SAVON) {
        await fabriquerSavons({
          article: article.cle,
          date,
          quantite: nombre,
          debut,
          finCure: ajouterJours(date, JOURS_DE_CURE_SAVON),
          litresLait: litres,
          ingredients: [],
        });
      } else {
        await fabriquerFromages({
          article: article.cle,
          date,
          quantite: nombre,
          debut,
          litres: fromage ? litres : undefined,
          sale: variante?.sale,
          lait: variante?.lait,
        });
      }
      await noterAEnvoyer();
      setArchive(await lireArchiveStock());
      setEtape({
        nom: 'fait',
        titre: T.fait(nombre, article.libelle),
        detail: T.detail(debut, litres),
      });
    } catch {
      setEtape({ nom: 'erreur', message: T.erreur });
    }
  };

  return (
    <View style={{ flex: 1 }}>
      {etape.nom === 'produit' ? (
        <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
          <Text style={styles.titre}>{fromage ? T.quelFromage : T.quelProduit}</Text>
          {articles.length === 0 ? <Text style={styles.detail}>{T.aucunProduit}</Text> : null}
          <ListeDeChoix
            presentation={presentation}
            choix={articles.map((a) => ({
              cle: a.cle,
              libelle: a.libelle,
              icone: ICONE_DU_PRODUIT[produit],
              image: { cle: a.cle, emoji: emojiDeLArticle(a.cle.split(':')[0] as GenreArticle, a.libelle) },
            }))}
            onChoisir={(c) => {
              const article = articles.find((a) => a.cle === c.cle);
              if (article) choisir(article);
            }}
          />
          <Pressable style={styles.discret} onPress={onTerminer} accessibilityRole="button">
            <Text style={styles.discretTexte}>{T.retour}</Text>
          </Pressable>
        </ScrollView>
      ) : null}

      {etape.nom === 'sale' ? (
        <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
          <Text style={styles.detail}>{etape.article.libelle}</Text>
          <Text style={styles.titre}>{T.leFromageEstSale}</Text>
          <ListeDeChoix
            presentation={presentation}
            choix={[
              { cle: 'non', libelle: T.nonSale, icone: 'cheese' },
              { cle: 'oui', libelle: T.sale, icone: 'shaker-outline' },
            ]}
            onChoisir={(c) => setEtape({ nom: 'lait', article: etape.article, sale: c.cle === 'oui' })}
          />
          <Button label={T.retour} variant="secondary" onPress={recommencer} />
        </ScrollView>
      ) : null}

      {etape.nom === 'lait' ? (
        <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
          <Text style={styles.detail}>{`${etape.article.libelle} · ${etape.sale ? T.sale : T.nonSale}`}</Text>
          <Text style={styles.titre}>{T.quelLait}</Text>
          <ListeDeChoix
            presentation={presentation}
            choix={TYPES_DE_LAIT.map((lait) => ({ cle: lait, libelle: LAITS[lait], icone: 'water' as const }))}
            onChoisir={(c) => {
              setSaisie('');
              setEtape({ nom: 'litres', article: etape.article, variante: { sale: etape.sale, lait: c.cle as TypeLait } });
            }}
          />
          <Button label={T.retour} variant="secondary" onPress={() => setEtape({ nom: 'sale', article: etape.article })} />
        </ScrollView>
      ) : null}

      {etape.nom === 'litres' ? (
        <ScrollView contentContainerStyle={styles.contenuDefilant}>
          <Text style={styles.detail}>{etape.article.libelle}</Text>
          <Text style={styles.titre}>{savon ? T.combienDeLaitSavon : T.combienDeLitres}</Text>
          <ClavierNumerique valeur={saisie} onChange={setSaisie} virgule />
          {/* Les litres tapés : centrés, non modifiables à la main. */}
          <View style={styles.affichageNumero} accessibilityLabel={`${T.litres} ${saisie}`}>
            <Text style={styles.affichageNumeroTexte}>{saisie}</Text>
          </View>
          <Button
            label={T.valider}
            disabled={!(parseDecimal(saisie) > 0)}
            onPress={() => {
              const litres = parseDecimal(saisie);
              setSaisie('');
              setEtape({ nom: 'nombre', article: etape.article, litres, variante: etape.variante });
            }}
          />
          {/* Un savon peut se faire sans lait de chèvre : on passe cette étape. */}
          {savon ? (
            <Button
              label={T.sansLait}
              variant="secondary"
              onPress={() => {
                setSaisie('');
                setEtape({ nom: 'nombre', article: etape.article });
              }}
            />
          ) : null}
          <Button label={T.retour} variant="secondary" onPress={recommencer} />
        </ScrollView>
      ) : null}

      {etape.nom === 'nombre' ? (
        <ScrollView contentContainerStyle={styles.contenuDefilant}>
          <Text style={styles.detail}>{etape.article.libelle}</Text>
          <Text style={styles.titre}>{fromage ? T.combienDeFromages : T.combienDePieces}</Text>
          <ClavierNumerique valeur={saisie} onChange={setSaisie} />
          {/* Le nombre tapé : centré, non modifiable à la main. */}
          <View style={styles.affichageNumero} accessibilityLabel={`${T.nombre} ${saisie}`}>
            <Text style={styles.affichageNumeroTexte}>{saisie}</Text>
          </View>
          <Button
            label={T.valider}
            disabled={!(Math.round(parseDecimal(saisie)) > 0)}
            onPress={() => fabriquer(etape.article, Math.round(parseDecimal(saisie)), etape.litres, etape.variante)}
          />
          <Button label={T.retour} variant="secondary" onPress={recommencer} />
        </ScrollView>
      ) : null}

      {etape.nom === 'fait' ? (
        <View style={styles.contenu}>
          <MaterialCommunityIcons name="check-circle" size={96} color={colors.primary} style={styles.coche} />
          <Text style={styles.message}>{etape.titre}</Text>
          <Text style={styles.detail}>{etape.detail}</Text>
          <Button label={T.terminer} onPress={onTerminer} />
          <Button label={T.unAutre} variant="secondary" onPress={recommencer} />
        </View>
      ) : null}

      {etape.nom === 'erreur' ? (
        <View style={styles.contenu}>
          <Text style={styles.erreur}>{etape.message}</Text>
          <Button label={T.reessayer} onPress={recommencer} />
          <Button label={T.retour} variant="secondary" onPress={onTerminer} />
        </View>
      )  : null}
    </View>
  );
}
