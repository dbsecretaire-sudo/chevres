import { useCallback, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '@/shared/components/Card';
import { SelectModal } from '@/shared/components/SelectModal';
import { lireArchiveStock } from '@/features/stock/repository';
import { articleDeLaVente, lotsAChoisir } from '@/features/stock/services/lots';
import type { ArchiveStock } from '@/features/stock/types';
import type { Vente } from '@/features/comptabilite/types';
import { colors } from '@/shared/theme/colors';
import { formatDateShortFR } from '@/shared/utils/dates';
import { commonStyles } from '@/shared/styles/commonStyles';
import { TEXTES } from '@/shared/textes';

const T = TEXTES.comptabilite.nouvelleEcriture;

interface Props {
  /** Ce que la vente vend : un fromage (son type) ou de la charcuterie (son détail). */
  vente: Pick<Vente, 'categorie' | 'typeFromage' | 'typeFromageLibre' | 'precision' | 'activite'>;
  /** La vente qu'on modifie : ses lots restent proposés (ils sont à elle). */
  venteId?: string;
  /** Les lots vendus. */
  ids: string[];
  onChange: (ids: string[]) => void;
}

/**
 * Les produits d'une vente de fromage ou de charcuterie, désignés un par un par leur numéro de lot (comme les animaux d'une vente
 * d'animaux) quand le stock de ce produit a des lots : obligatoires (étoile rouge), on en ajoute avec le + et on en retire avec la
 * croix. Le nombre de produits de la vente est leur nombre. Rien quand le produit n'a pas de lot en stock.
 */
export function LotsVendusEdition({ vente, venteId, ids, onChange }: Props) {
  const [archive, setArchive] = useState<ArchiveStock | null>(null);
  const [ouvert, setOuvert] = useState(false);

  useFocusEffect(
    useCallback(() => {
      lireArchiveStock().then(setArchive);
    }, []),
  );

  const article = archive ? articleDeLaVente(vente, archive) : undefined;
  const lots = archive && article ? lotsAChoisir(archive, article, venteId) : [];
  const choisis = lots.filter((l) => ids.includes(l.id));
  const proposes = lots.filter((l) => !ids.includes(l.id));
  // Pas de lot (stock saisi à la main) : la vente se fait par quantité, comme avant.
  if (lots.length === 0 && ids.length === 0) return null;

  return (
    <View style={commonStyles.gap6}>
      <View style={commonStyles.rowSpaceBetween}>
        <Text style={commonStyles.lineSemiBold}>
          {T.lotsVendus}
          <Text style={commonStyles.required}> *</Text>
        </Text>
        <Pressable
          style={commonStyles.boutonPastille}
          onPress={() => setOuvert(true)}
          accessibilityLabel={T.ajouterUnLot}
        >
          <Ionicons name="add-circle" size={28} color={colors.ajout} />
        </Pressable>
      </View>
      {choisis.length > 0 ? (
        <Card style={commonStyles.gap10}>
          {choisis.map((lot) => (
            <View key={lot.id} style={commonStyles.rowSpaceBetween}>
              <Text style={commonStyles.valueText}>
                {lot.numero} · {formatDateShortFR(lot.dateFabrication)}
              </Text>
              <Pressable
                onPress={() => onChange(ids.filter((id) => id !== lot.id))}
                hitSlop={8}
                accessibilityLabel={T.retirerLot}
              >
                <Ionicons name="close-circle" size={22} color={colors.danger} />
              </Pressable>
            </View>
          ))}
        </Card>
      ) : null}
      <SelectModal<string>
        visible={ouvert}
        titre={T.lotVendu}
        value=""
        options={proposes.map((l) => ({
          value: l.id,
          label: `${l.numero} · ${formatDateShortFR(l.dateFabrication)}`,
        }))}
        onSelect={(id) => {
          onChange([...ids, id]);
          setOuvert(false);
        }}
        onClose={() => setOuvert(false)}
        searchable
      />
    </View>
  );
}
