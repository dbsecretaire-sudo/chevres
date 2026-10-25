import { useState } from 'react';
import { Alert, Pressable, ScrollView, Text } from 'react-native';
import { exporterListeLotsPdf, type ProduitDeLaListe } from '@/features/export/documents/listeLotsPdf';
import { ListeDeChoix, type PresentationDesChoix } from '@/features/production/simple/ListeDeChoix';
import { PRODUIT_A_LOTS } from '@/shared/constants/stock';
import { styles } from '@/shared/styles/roles/Roles.styles';
import { TEXTES } from '@/shared/textes';

const T = TEXTES.production.imprimerLotsSimple;
const L = TEXTES.production.lots;

/** Ce qu'on peut imprimer : les lots d'un produit, ou tous. */
const CHOIX = [
  { cle: PRODUIT_A_LOTS.FROMAGE, libelle: L.fromages, icone: 'cheese' as const },
  { cle: PRODUIT_A_LOTS.CHARCUTERIE, libelle: L.charcuterie, icone: 'knife' as const },
  { cle: PRODUIT_A_LOTS.PLAT, libelle: L.plats, icone: 'pot-steam' as const },
  { cle: PRODUIT_A_LOTS.SAVON, libelle: L.savons, icone: 'hand-wash' as const },
  { cle: 'tous', libelle: T.tous, icone: 'format-list-bulleted' as const },
];

/**
 * « Imprimer les lots » : on choisit un produit (ou tous), et la liste de ses lots — numéro, fabrication, contrôle, état, client et prix pour un lot vendu — se prépare en PDF,
 * prête à imprimer ou à partager. Ce n'est pas l'étiquette d'un lot : c'est la liste.
 */
export function ImprimerLotsSimple({ presentation = 'tuiles', onRetour }: { presentation?: PresentationDesChoix; onRetour?: () => void }) {
  const [enCours, setEnCours] = useState(false);
  const imprimer = async (cle: string) => {
    const choix = CHOIX.find((c) => c.cle === cle);
    if (!choix || enCours) return;
    setEnCours(true);
    try {
      await exporterListeLotsPdf(cle as ProduitDeLaListe, choix.libelle);
    } catch (e: unknown) {
      Alert.alert(T.erreur, e instanceof Error ? e.message : String(e));
    } finally {
      setEnCours(false);
    }
  };
  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
      <Text style={styles.titre}>{T.titre}</Text>
      <Text style={styles.detail}>{enCours ? T.enCours : T.aide}</Text>
      <ListeDeChoix presentation={presentation} choix={CHOIX} onChoisir={(c) => imprimer(c.cle)} />
      {onRetour ? (
        <Pressable style={styles.discret} onPress={onRetour} accessibilityRole="button">
          <Text style={styles.discretTexte}>{TEXTES.production.fabricationSimple.retour}</Text>
        </Pressable>
      ) : null}
    </ScrollView>
  );
}
