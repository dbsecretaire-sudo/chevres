import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '@/shared/components/Button';
import { Card } from '@/shared/components/Card';
import { enregistrerVenteBar, totalVenteBar } from '@/features/bar/services/ventes';
import type { Boisson } from '@/features/bar/types';
import { colors } from '@/shared/theme/colors';
import { formatMontant, todayISO } from '@/shared/utils/dates';
import { styles } from '@/shared/styles/bar/Bar.styles';
import { commonStyles } from '@/shared/styles/commonStyles';
import { TEXTES } from '@/shared/textes';

const T = TEXTES.bar.bar;

interface Props {
  boissons: Boisson[];
  /** Appelé après une vente enregistrée (pour recharger les stocks). */
  onVendu: () => void;
}

/**
 * La vente au bar : chaque boisson avec son nom seulement, une quantité à régler en dessous, et le prix (celui fixé dans
 * la gestion des boissons) qui suit la quantité. Une seule vente regroupe toutes les boissons choisies.
 */
export function VenteBar({ boissons, onVendu }: Props) {
  const [quantites, setQuantites] = useState<Record<string, number>>({});
  const [message, setMessage] = useState<string | null>(null);

  const lignes = boissons.map((boisson) => ({ boisson, quantite: quantites[boisson.id] ?? 0 }));
  const total = totalVenteBar(lignes);

  const changer = (id: string, delta: number) => {
    setMessage(null);
    setQuantites((actuelles) => ({ ...actuelles, [id]: Math.max(0, (actuelles[id] ?? 0) + delta) }));
  };

  const vendre = async () => {
    const montant = await enregistrerVenteBar(lignes, todayISO());
    setQuantites({});
    setMessage(T.venteEnregistree(formatMontant(montant)));
    onVendu();
  };

  if (boissons.length === 0) return <Text style={commonStyles.mutedItalic}>{T.aucuneBoisson}</Text>;

  return (
    <View style={commonStyles.gap10}>
      {lignes.map(({ boisson, quantite }) => (
        <View key={boisson.id} style={styles.ligneBoisson}>
          <Text style={styles.nomBoisson}>{boisson.nom}</Text>
          <View style={styles.quantiteLigne}>
            <Pressable
              style={styles.boutonQuantite}
              onPress={() => changer(boisson.id, -1)}
              accessibilityLabel={T.quantiteMoins}
            >
              <Ionicons name="remove" size={22} color={colors.primary} />
            </Pressable>
            <Text style={styles.quantite}>{quantite}</Text>
            <Pressable
              style={styles.boutonQuantite}
              onPress={() => changer(boisson.id, 1)}
              accessibilityLabel={T.quantitePlus}
            >
              <Ionicons name="add" size={22} color={colors.primary} />
            </Pressable>
          </View>
          <Text style={[styles.prixLigne, quantite > 0 && styles.prixLigneActif]}>
            {formatMontant(boisson.prix * quantite)}
          </Text>
        </View>
      ))}
      <Card>
        <Text style={styles.total}>{T.total(formatMontant(total))}</Text>
        <Button label={T.enregistrerVente} disabled={total <= 0} onPress={vendre} />
        {message ? <Text style={commonStyles.note}>{message}</Text> : null}
      </Card>
    </View>
  );
}
