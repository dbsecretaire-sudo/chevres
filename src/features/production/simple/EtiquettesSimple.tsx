import { useEffect, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { exporterEtiquettesLotPdf } from '@/features/export/documents/etiquettesLotPdf';
import { useEtablissement } from '@/features/etablissements/context/EtablissementContext';
import { lireArchiveStock } from '@/features/stock/repository';
import { articlesDuProduit } from '@/features/stock/services/lots';
import type { ArticleAffiche } from '@/features/stock/services/stock';
import type { ArchiveStock, LotFromage } from '@/features/stock/types';
import { Button } from '@/shared/components/Button';
import { FormField } from '@/shared/components/FormField';
import { GrosBouton } from '@/shared/components/GrosBouton';
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

type Etape =
  | { nom: 'produit' }
  | { nom: 'article'; produit: Produit }
  | { nom: 'fabrication'; article: ArticleAffiche }
  | { nom: 'nombre'; fabrication: Fabrication }
  | { nom: 'fait'; nombre: number }
  | { nom: 'erreur' };

/**
 * Imprimer des étiquettes au plus simple, en très grands boutons : le produit (fromage, charcuterie, plat, savon), puis le produit précis, puis sa fabrication
 * (la plus récente d'abord), puis le nombre d'étiquettes voulu. Le PDF se partage ensuite pour l'imprimer.
 */
export function EtiquettesSimple({ onTerminer }: { onTerminer: () => void }) {
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
          {PRODUITS.map((p) => (
            <GrosBouton
              key={p}
              libelle={E.produits[p]}
              onPress={() => setEtape({ nom: 'article', produit: p })}
              icone={<MaterialCommunityIcons name={ICONE[p]} size={44} color={colors.blanc} />}
            />
          ))}
          <Pressable style={styles.discret} onPress={onTerminer} accessibilityRole="button">
            <Text style={styles.discretTexte}>{T.retour}</Text>
          </Pressable>
        </ScrollView>
      ) : null}

      {etape.nom === 'article' ? (
        <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
          <Text style={styles.titre}>{E.produits[etape.produit]}</Text>
          {archive
            ? articlesDuProduit(etape.produit, archive, espece)
                .filter((a) => fabricationsDe(archive, a.cle).length > 0)
                .map((a) => (
                  <GrosBouton key={a.cle} libelle={a.libelle} onPress={() => setEtape({ nom: 'fabrication', article: a })} />
                ))
            : null}
          <Pressable style={styles.discret} onPress={recommencer} accessibilityRole="button">
            <Text style={styles.discretTexte}>{T.retour}</Text>
          </Pressable>
        </ScrollView>
      ) : null}

      {etape.nom === 'fabrication' && archive ? (
        <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
          <Text style={styles.titre}>{E.fabrication}</Text>
          {fabricationsDe(archive, etape.article.cle)
            .slice(0, 8)
            .map((f) => (
              <GrosBouton
                key={f.lot.id}
                libelle={E.fabrication_(f.lot.numero, f.nombre, formatDateFR(f.lot.dateFabrication))}
                onPress={() => {
                  setSaisie('');
                  setEtape({ nom: 'nombre', fabrication: f });
                }}
              />
            ))}
          <Pressable style={styles.discret} onPress={recommencer} accessibilityRole="button">
            <Text style={styles.discretTexte}>{T.retour}</Text>
          </Pressable>
        </ScrollView>
      ) : null}

      {etape.nom === 'nombre' ? (
        <View style={styles.contenu}>
          <Text style={styles.detail}>{etape.fabrication.lot.numero}</Text>
          <Text style={styles.titre}>{E.combien}</Text>
          <FormField label={E.nombre} value={saisie} onChangeText={setSaisie} keyboardType="number-pad" autoFocus />
          <Button
            label={E.imprimer}
            disabled={!(Math.round(parseDecimal(saisie)) > 0)}
            onPress={() => imprimer(etape.fabrication, Math.min(500, Math.round(parseDecimal(saisie))))}
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
