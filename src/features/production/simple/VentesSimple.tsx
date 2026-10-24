import { useState } from 'react';
import { Pressable, ScrollView, Text } from 'react-native';
import { ListeDeChoix } from '@/features/production/simple/ListeDeChoix';
import { VenteProduitSimple, type ProduitVendu } from '@/features/production/simple/VenteProduitSimple';
import { ViandeAVendreSimple } from '@/features/production/simple/ViandeAVendreSimple';
import { ViandeSimple } from '@/features/production/simple/ViandeSimple';
import { CATEGORIE_VENTE } from '@/shared/constants/comptabilite';
import { PRODUIT_A_LOTS } from '@/shared/constants/stock';
import { styles } from '@/shared/styles/roles/Roles.styles';
import { TEXTES } from '@/shared/textes';

const T = TEXTES.production.ventesSimple;

/** Les produits qu'on vend : leur nom, leur dessin, la catégorie de leur vente, ce que compte leur prix, et d'où viennent leurs articles (rien pour le lait). */
const PRODUITS: ProduitVendu[] = [
  { cle: 'fromage', libelle: T.fromage, icone: 'cheese', categorie: CATEGORIE_VENTE.FROMAGE, unite: 'piece', articles: PRODUIT_A_LOTS.FROMAGE },
  { cle: 'charcuterie', libelle: T.charcuterie, icone: 'knife', categorie: CATEGORIE_VENTE.BOUCHERIE_CHARCUTERIE, unite: 'piece', articles: PRODUIT_A_LOTS.CHARCUTERIE },
  { cle: 'plat', libelle: T.plat, icone: 'pot-steam', categorie: CATEGORIE_VENTE.BOUCHERIE_CHARCUTERIE, unite: 'piece', articles: PRODUIT_A_LOTS.PLAT },
  { cle: 'savon', libelle: T.savon, icone: 'hand-wash', categorie: CATEGORIE_VENTE.SAVONS, unite: 'piece', articles: PRODUIT_A_LOTS.SAVON },
  { cle: 'lait', libelle: T.lait, icone: 'water', categorie: CATEGORIE_VENTE.LAIT, unite: 'litre' },
];

/** La viande a ses pages simples, ici même. */
const AUTRES = { viandeAVendre: 'viandeAVendre', viandeAFacturer: 'viandeAFacturer' } as const;

/**
 * Les ventes, au plus simple : on choisit ce qu'on vend. Fromage, charcuterie, plat, savon ou lait : le client, les lots (le type de fromage s'en déduit), le prix total — le prix
 * de l'inventaire × la quantité, proposé d'avance et demandé s'il manque — puis « Payé ? » ; la vente est notée d'un coup. La viande à vendre (les chèvres sans boucle) et la viande
 * à facturer (les jours d'abattage) ont leurs pages simples. `onRetour` ferme la page.
 */
export function VentesSimple({ onRetour }: { onRetour: () => void }) {
  const [choix, setChoix] = useState<string | null>(null);
  const retourProduits = () => setChoix(null);
  const produit = PRODUITS.find((p) => p.cle === choix);

  if (choix === AUTRES.viandeAVendre) return <ViandeAVendreSimple onRetour={retourProduits} />;
  if (choix === AUTRES.viandeAFacturer) return <ViandeSimple onRetour={retourProduits} />;
  if (produit) return <VenteProduitSimple produit={produit} onRetour={retourProduits} />;

  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
      <Text style={styles.titre}>{T.quoi}</Text>
      <ListeDeChoix
        presentation="tuiles"
        choix={[
          ...PRODUITS.map(({ cle, libelle, icone }) => ({ cle, libelle, icone })),
          { cle: AUTRES.viandeAVendre, libelle: TEXTES.accueil.ferme.terrain.tuiles.viandeAVendre, icone: 'food-steak' as const },
          { cle: AUTRES.viandeAFacturer, libelle: TEXTES.accueil.ferme.terrain.tuiles.viandeAFacturer, icone: 'food-steak' as const },
        ]}
        onChoisir={(c) => setChoix(c.cle)}
      />
      <Pressable style={styles.discret} onPress={onRetour} accessibilityRole="button">
        <Text style={styles.discretTexte}>{T.retour}</Text>
      </Pressable>
    </ScrollView>
  );
}
