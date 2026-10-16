import { useCallback, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '@/shared/components/Card';
import { FormField } from '@/shared/components/FormField';
import { Button } from '@/shared/components/Button';
import { SelectField } from '@/shared/components/SelectField';
import { ligneChambreVide, type LigneChambreForm } from '@/features/comptabilite/forms/lignesChambre';
import { estLigneEquarrissage } from '@/features/comptabilite/utils/equarrissage';
import { estEquarrisseur } from '@/features/exploitation/services/partenaires';
import { listFournisseurs } from '@/features/fournisseurs/repository';
import type { Fournisseur } from '@/features/fournisseurs/types';
import { colors } from '@/shared/theme/colors';
import { commonStyles } from '@/shared/styles/commonStyles';
import { TEXTES } from '@/shared/textes';

const T = TEXTES.fournisseurs.chambre;

interface Props {
  lignes: LigneChambreForm[];
  onChange: (lignes: LigneChambreForm[]) => void;
}

/**
 * Les articles d'une facture de la Chambre d'agriculture (forfait d'identification, équarrissage ATM, conseils et analyses) : le nom et
 * le montant TTC de chacun. Les articles proposés se modifient, se retirent, et on en ajoute d'autres. Une ligne d'équarrissage se lie
 * à un équarrisseur (une fiche fournisseur de la catégorie « Équarrissage ») : elle apparaît alors dans ses factures, dans Groupements.
 */
export function LignesChambreEditor({ lignes, onChange }: Props) {
  const [equarrisseurs, setEquarrisseurs] = useState<Fournisseur[]>([]);

  // La liste est relue à chaque retour sur l'écran : un équarrisseur qu'on vient de créer y apparaît.
  useFocusEffect(
    useCallback(() => {
      listFournisseurs().then((liste) => setEquarrisseurs(liste.filter(estEquarrisseur)));
    }, []),
  );

  const maj = (key: string, changement: Partial<LigneChambreForm>) =>
    onChange(lignes.map((l) => (l.key === key ? { ...l, ...changement } : l)));

  /** Sans choix, la ligne va à l'unique équarrisseur ; avec plusieurs, il faut le choisir. */
  const choixParDefaut =
    equarrisseurs.length === 1 ? T.equarrisseurAuto(equarrisseurs[0].nomEntreprise) : T.equarrisseurAChoisir;

  return (
    <Card style={commonStyles.gap10}>
      <Text style={commonStyles.lineBold}>{T.titre}</Text>
      <Text style={commonStyles.note}>{T.aide}</Text>
      {lignes.map((ligne) => (
        <View key={ligne.key} style={commonStyles.gap8}>
          <View style={commonStyles.rowFin}>
            <View style={commonStyles.flex2}>
              <FormField
                label={T.article}
                value={ligne.libelle}
                onChangeText={(libelle) => maj(ligne.key, { libelle })}
              />
            </View>
            <View style={commonStyles.flex1}>
              <FormField
                label={T.montant}
                value={ligne.montant}
                onChangeText={(montant) => maj(ligne.key, { montant })}
                keyboardType="decimal-pad"
                placeholder="0,00"
              />
            </View>
            <Pressable
              style={commonStyles.boutonPastille}
              onPress={() => onChange(lignes.filter((l) => l.key !== ligne.key))}
              accessibilityLabel={T.retirer}
            >
              <Ionicons name="close-circle" size={28} color={colors.danger} />
            </Pressable>
          </View>
          {equarrisseurs.length > 0 && (estLigneEquarrissage(ligne.libelle) || ligne.equarrisseurId) ? (
            <SelectField<string>
              label={T.equarrisseur}
              value={ligne.equarrisseurId}
              onChange={(equarrisseurId) => maj(ligne.key, { equarrisseurId })}
              options={[
                { value: '', label: choixParDefaut },
                ...equarrisseurs.map((f) => ({ value: f.id, label: f.nomEntreprise })),
              ]}
              aide={T.equarrisseurAide}
            />
          ) : null}
        </View>
      ))}
      <Button
        variant="secondary"
        label={T.ajouter}
        onPress={() => onChange([...lignes, ligneChambreVide()])}
      />
    </Card>
  );
}
