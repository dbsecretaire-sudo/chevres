import { Text, View } from 'react-native';
import { ListRow } from '@/shared/components/ListRow';
import { CarteDeStock, grilleDeCartes } from '@/features/stock/components/CartesDuStock';
import type { BilanLait } from '@/features/stock/services/stock';
import type { LaitJour } from '@/features/stock/types';
import { NOMS_MOIS } from '@/shared/textes/libelles';
import { formatDateFR } from '@/shared/utils/dates';
import { commonStyles } from '@/shared/styles/commonStyles';
import { TEXTES } from '@/shared/textes';

const T = TEXTES.stock.laitJour;

/** Un nombre de litres à l'écran : au plus deux décimales, virgule comme séparateur. */
const enLitres = (nombre: number): string => String(Math.round(nombre * 100) / 100).replace('.', ',');

/**
 * Le lait produit, jour par jour : les plus récents d'abord, avec le total de chaque mois au-dessus de ses jours. Un appui
 * sur un jour le modifie.
 */
export function JournalLait({
  lait,
  bilan,
  prix,
  onModifierPrix,
  onOuvrir,
}: {
  lait: LaitJour[];
  /** Le bilan du lait : produit, utilisé, vendu et restant. */
  bilan: BilanLait;
  /** Le prix de vente du lait (€ le litre), quand il est défini : c'est lui qui fait le prix des ventes de lait. */
  prix?: number;
  onModifierPrix: () => void;
  onOuvrir: (entree: LaitJour) => void;
}) {
  // La carte du lait, comme celles des autres articles : son dessin, son nom (et le prix en petit), le crayon qui change le prix, et quatre pastilles :
  // ce qu'il en reste, ce qui a été produit, utilisé en fromagerie et vendu.
  const carteBilan = (
    <View style={grilleDeCartes}>
      <CarteDeStock
        cle="lait"
        rang={0}
        large
        emoji="🥛"
        titre={T.carte}
        sous={prix ? T.prixLitre(enLitres(prix)) : T.prixAFixer}
        quantite={T.ligne(enLitres(bilan.restant))}
        niveau={bilan.restant}
        onRenommer={onModifierPrix}
        pastilles={[
          // Le produit est toujours vert et ce qui est utilisé en fromagerie toujours rouge sombre, même à 0 L ; le restant et le vendu suivent le signe affiché : vert si positif, rouge si négatif (le vendu s'affiche en négatif), gris à 0.
          { icone: 'piece', quantite: T.ligne(enLitres(bilan.restant)), niveau: bilan.restant },
          { icone: '🥛', quantite: T.ligne(enLitres(bilan.produit)), niveau: bilan.produit, couleur: 'vert' },
          { icone: '🧀', quantite: T.ligne(enLitres(-bilan.utilise)), niveau: bilan.utilise, couleur: 'rouge' },
          { icone: '💶', quantite: T.ligne(enLitres(-bilan.vendu)), niveau: -bilan.vendu },
        ]}
      />
    </View>
  );
  if (lait.length === 0)
    return (
      <View style={commonStyles.gap10}>
        {carteBilan}
        <Text style={commonStyles.mutedItalic}>{T.aucun}</Text>
      </View>
    );

  const tries = [...lait].sort((a, b) => b.date.localeCompare(a.date));
  const mois = [...new Set(tries.map((l) => l.date.slice(0, 7)))];

  return (
    <View style={commonStyles.gap10}>
      {carteBilan}
      {mois.map((m) => {
        const duMois = tries.filter((l) => l.date.startsWith(m));
        const total = duMois.reduce((somme, l) => somme + l.litres, 0);
        return (
          <View key={m} style={commonStyles.gap10}>
            <Text style={commonStyles.cardTitle}>
              {T.totalDuMois(`${NOMS_MOIS[Number(m.slice(5, 7)) - 1]} ${m.slice(0, 4)}`, enLitres(total))}
            </Text>
            {duMois.map((l) => (
              <ListRow
                key={l.id}
                title={formatDateFR(l.date)}
                trailing={<Text style={commonStyles.lineBold}>{T.ligne(enLitres(l.litres))}</Text>}
                onPress={() => onOuvrir(l)}
              />
            ))}
          </View>
        );
      })}
    </View>
  );
}
