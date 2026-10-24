import { useEffect, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { exporterEtiquettesLotPdf } from '@/features/export/documents/etiquettesLotPdf';
import { useEtablissement } from '@/features/etablissements/context/EtablissementContext';
import { lireArchiveStock } from '@/features/stock/repository';
import { emojiDeLArticle } from '@/features/stock/services/entrepotJeu';
import { articlesDuProduit } from '@/features/stock/services/lots';
import type { ArticleAffiche } from '@/features/stock/services/stock';
import type { ArchiveStock, GenreArticle, LotFromage } from '@/features/stock/types';
import { Button } from '@/shared/components/Button';
import { FormField } from '@/shared/components/FormField';
import { ListeDeChoix, type Choix, type PresentationDesChoix } from '@/features/production/simple/ListeDeChoix';
import { PRODUIT_A_LOTS } from '@/shared/constants/stock';
import { styles } from '@/shared/styles/roles/Roles.styles';
import { colors } from '@/shared/theme/colors';
import { TEXTES } from '@/shared/textes';
import { formatDateFR } from '@/shared/utils/dates';
import { parseDecimal } from '@/shared/utils/nombres';

const T = TEXTES.production.fabricationSimple;
const E = T.etiquettes;

type Produit = (typeof PRODUIT_A_LOTS)[keyof typeof PRODUIT_A_LOTS];
const PRODUITS: Produit[] = [PRODUIT_A_LOTS.FROMAGE, PRODUIT_A_LOTS.CHARCUTERIE, PRODUIT_A_LOTS.PLAT, PRODUIT_A_LOTS.SAVON];
const ICONE: Record<string, 'cheese' | 'knife' | 'pot-steam' | 'hand-wash'> = {
  [PRODUIT_A_LOTS.FROMAGE]: 'cheese',
  [PRODUIT_A_LOTS.CHARCUTERIE]: 'knife',
  [PRODUIT_A_LOTS.PLAT]: 'pot-steam',
  [PRODUIT_A_LOTS.SAVON]: 'hand-wash',
};

/** Une fabrication : ses lots (ils ont le même mouvement de stock), le premier qui les représente. */
interface Fabrication {
  lot: LotFromage;
  nombre: number;
}

/** Les fabrications d'un article, de la plus récente à la plus ancienne. */
function fabricationsDe(archive: ArchiveStock, article: string): Fabrication[] {
  const parFabrication = new Map<string, Fabrication>();
  for (const l of (archive.lots ?? []).filter((x) => x.article === article)) {
    const cle = l.mouvementId ?? l.id;
    const connue = parFabrication.get(cle);
    if (connue) {
      connue.nombre += 1;
      if (l.numero < connue.lot.numero) connue.lot = l;
    } else parFabrication.set(cle, { lot: l, nombre: 1 });
  }
  return [...parFabrication.values()].sort((a, b) => b.lot.dateFabrication.localeCompare(a.lot.dateFabrication));
}

/** Le choix « Réimprimer des étiquettes », au milieu des produits. */
const REIMPRESSION = 'reimpression';

type Etape =
  | { nom: 'produit' }
  | { nom: 'reimpression' }
  | { nom: 'article'; produit: Produit }
  | { nom: 'fabrication'; article: ArticleAffiche }
  | { nom: 'nombre'; fabrication: Fabrication }
  | { nom: 'fait'; nombre: number }
  | { nom: 'erreur' };

/**
 * Imprimer des étiquettes au plus simple, en très grands boutons : le produit (fromage, charcuterie, plat, savon), puis le produit précis, puis sa fabrication
 * (la plus récente d'abord), puis le nombre d'étiquettes voulu. Le PDF se partage ensuite pour l'imprimer.
 */
export function EtiquettesSimple({
  onTerminer,
  presentation = 'gros',
}: {
  onTerminer: () => void;
  /** Les choix en très grands boutons (mode normal) ou en tuiles (mode avancé). */
  presentation?: PresentationDesChoix;
}) {
  const { espece } = useEtablissement();
  const [archive, setArchive] = useState<ArchiveStock | null>(null);
  const [etape, setEtape] = useState<Etape>({ nom: 'produit' });
  const [saisie, setSaisie] = useState('');

  useEffect(() => {
    lireArchiveStock().then(setArchive);
  }, []);

  const imprimer = async (fabrication: Fabrication, nombre: number) => {
    try {
      await exporterEtiquettesLotPdf(fabrication.lot.id, undefined, nombre);
      setEtape({ nom: 'fait', nombre });
    } catch {
      setEtape({ nom: 'erreur' });
    }
  };

  const recommencer = () => {
    setSaisie('');
    setEtape({ nom: 'produit' });
  };

  return (
    <View style={{ flex: 1 }}>
      {etape.nom === 'produit' ? (
        <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
          <Text style={styles.titre}>{E.quoi}</Text>
          <ListeDeChoix
            presentation={presentation}
            choix={[
              ...PRODUITS.map((p): Choix => ({ cle: p, libelle: E.produits[p], icone: ICONE[p] })),
              { cle: REIMPRESSION, libelle: E.reimprimer, icone: 'printer' },
            ]}
            onChoisir={(c) => setEtape(c.cle === REIMPRESSION ? { nom: 'reimpression' } : { nom: 'article', produit: c.cle as Produit })}
          />
          <Pressable style={styles.discret} onPress={onTerminer} accessibilityRole="button">
            <Text style={styles.discretTexte}>{T.retour}</Text>
          </Pressable>
        </ScrollView>
      ) : null}

      {etape.nom === 'reimpression' ? (
        <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
          <Text style={styles.titre}>{E.dejaImprimees}</Text>
          {archive && (archive.etiquettesImprimees ?? []).length === 0 ? <Text style={styles.detail}>{E.aucuneReimpression}</Text> : null}
          {archive ? (
            <ListeDeChoix
              presentation={presentation}
              choix={[...(archive.etiquettesImprimees ?? [])]
                .reverse()
                .slice(0, 12)
                .flatMap((i) => {
                  const lot = (archive.lots ?? []).find((l) => l.id === i.lotId);
                  return lot ? [{ cle: i.id, libelle: E.fabrication_(lot.numero, i.nombre, formatDateFR(i.date)) }] : [];
                })}
              onChoisir={(c) => {
                const impression = (archive.etiquettesImprimees ?? []).find((i) => i.id === c.cle);
                const lot = impression && (archive.lots ?? []).find((l) => l.id === impression.lotId);
                if (!impression || !lot) return;
                // Le même nombre est proposé : on peut le changer.
                setSaisie(String(impression.nombre));
                const fabrication = fabricationsDe(archive, lot.article).find((f) => (f.lot.mouvementId ?? f.lot.id) === (lot.mouvementId ?? lot.id));
                setEtape({ nom: 'nombre', fabrication: fabrication ?? { lot, nombre: impression.nombre } });
              }}
            />
          ) : null}
          <Pressable style={styles.discret} onPress={recommencer} accessibilityRole="button">
            <Text style={styles.discretTexte}>{T.retour}</Text>
          </Pressable>
        </ScrollView>
      ) : null}

      {etape.nom === 'article' ? (
        <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
          <Text style={styles.titre}>{E.produits[etape.produit]}</Text>
          {archive ? (
            <ListeDeChoix
              presentation={presentation}
              choix={articlesDuProduit(etape.produit, archive, espece)
                .filter((a) => fabricationsDe(archive, a.cle).length > 0)
                .map((a) => ({
                  cle: a.cle,
                  libelle: a.libelle,
                  image: { cle: a.cle, emoji: emojiDeLArticle(a.cle.split(':')[0] as GenreArticle, a.libelle) },
                }))}
              onChoisir={(c) => {
                const article = articlesDuProduit(etape.produit, archive, espece).find((a) => a.cle === c.cle);
                if (article) setEtape({ nom: 'fabrication', article });
              }}
            />
          ) : null}
          <Pressable style={styles.discret} onPress={recommencer} accessibilityRole="button">
            <Text style={styles.discretTexte}>{T.retour}</Text>
          </Pressable>
        </ScrollView>
      ) : null}

      {etape.nom === 'fabrication' && archive ? (
        <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
          <Text style={styles.titre}>{E.fabrication}</Text>
          <ListeDeChoix
            presentation={presentation}
            choix={fabricationsDe(archive, etape.article.cle)
              .slice(0, 8)
              .map((f) => ({ cle: f.lot.id, libelle: E.fabrication_(f.lot.numero, f.nombre, formatDateFR(f.lot.dateFabrication)) }))}
            onChoisir={(c) => {
              const fabrication = fabricationsDe(archive, etape.article.cle).find((f) => f.lot.id === c.cle);
              if (!fabrication) return;
              // Le nombre de fromages de la fabrication est proposé : on peut le changer.
              setSaisie(String(fabrication.nombre));
              setEtape({ nom: 'nombre', fabrication });
            }}
          />
          <Pressable style={styles.discret} onPress={recommencer} accessibilityRole="button">
            <Text style={styles.discretTexte}>{T.retour}</Text>
          </Pressable>
        </ScrollView>
      ) : null}

      {etape.nom === 'nombre' ? (
        <View style={styles.contenu}>
          <Text style={styles.detail}>{etape.fabrication.lot.numero}</Text>
          <Text style={styles.titre}>{E.combienFait(etape.fabrication.nombre)}</Text>
          <FormField label={E.nombre} value={saisie} onChangeText={setSaisie} keyboardType="number-pad" autoFocus />
          <Button
            label={E.imprimer}
            disabled={!(Math.round(parseDecimal(saisie)) > 0) || Math.round(parseDecimal(saisie)) > etape.fabrication.nombre}
            onPress={() => imprimer(etape.fabrication, Math.round(parseDecimal(saisie)))}
          />
          <Button label={T.retour} variant="secondary" onPress={recommencer} />
        </View>
      ) : null}

      {etape.nom === 'fait' ? (
        <View style={styles.contenu}>
          <Ionicons name="checkmark-circle" size={96} color={colors.primary} style={styles.coche} />
          <Text style={styles.message}>{E.fait(etape.nombre)}</Text>
          <Text style={styles.detail}>{E.faitDetail}</Text>
          <Button label={T.terminer} onPress={onTerminer} />
          <Button label={T.unAutre} variant="secondary" onPress={recommencer} />
        </View>
      ) : null}

      {etape.nom === 'erreur' ? (
        <View style={styles.contenu}>
          <Text style={styles.erreur}>{T.erreur}</Text>
          <Button label={T.reessayer} onPress={recommencer} />
          <Button label={T.retour} variant="secondary" onPress={onTerminer} />
        </View>
      ) : null}
    </View>
  );
}
