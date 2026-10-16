import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '@/shared/components/Button';
import { Card } from '@/shared/components/Card';
import { DateField } from '@/shared/components/DateField';
import { FormField } from '@/shared/components/FormField';
import { ligneVeterinaireVide } from '@/features/comptabilite/forms/lignesVeterinaire';
import type { LigneVeterinaire } from '@/features/comptabilite/types';
import { colors } from '@/shared/theme/colors';
import { commonStyles } from '@/shared/styles/commonStyles';
import { TEXTES } from '@/shared/textes';
import { todayISO } from '@/shared/utils/dates';

const T = TEXTES.carnet.lignes;

interface Props {
  lignes: LigneVeterinaire[];
  onChange: (lignes: LigneVeterinaire[]) => void;
  /** La date de la facture : celle que prend une date facultative qu'on ajoute (à défaut, aujourd'hui). */
  dateParDefaut?: string;
}

/** Une date facultative : un bouton pour l'ajouter, puis le champ avec une croix rouge pour la retirer. */
function DateFacultative({
  label,
  valeur,
  parDefaut,
  onChange,
}: {
  label: string;
  valeur: string | undefined;
  parDefaut: string;
  onChange: (valeur: string | undefined) => void;
}) {
  if (!valeur) return <Button variant="secondary" label={T.ajouterDate(label)} onPress={() => onChange(parDefaut)} />;
  return (
    <View style={commonStyles.rowFin}>
      <View style={commonStyles.flex1}>
        <DateField label={label} value={valeur} onChange={onChange} />
      </View>
      <Pressable
        onPress={() => onChange(undefined)}
        hitSlop={8}
        accessibilityLabel={T.retirerDate}
        style={commonStyles.boutonPastille}
      >
        <Ionicons name="close-circle" size={32} color={colors.danger} />
      </Pressable>
    </View>
  );
}

/**
 * Tout ce qui a été fait lors d'une visite du vétérinaire (actes, traitements) : chaque ligne porte ce que demande le carnet sanitaire —
 * l'animal ou le lot, l'ordonnance, les dates du traitement, le médicament (voie, dose, rythme), la remise en vente de la viande et du lait,
 * le motif. Ces lignes ne changent pas le montant de la facture : elles alimentent le carnet.
 */
export function LignesVeterinaireEditor({ lignes, onChange, dateParDefaut }: Props) {
  const defaut = dateParDefaut || todayISO();
  const maj = (id: string, changement: Partial<LigneVeterinaire>) =>
    onChange(lignes.map((l) => (l.id === id ? { ...l, ...changement } : l)));

  return (
    <Card style={commonStyles.gap10}>
      <Text style={commonStyles.lineBold}>{T.titre}</Text>
      <Text style={commonStyles.note}>{T.aide}</Text>
      {lignes.map((l) => (
        <View key={l.id} style={commonStyles.gap8}>
          <View style={commonStyles.rowFin}>
            <View style={commonStyles.flex1}>
              <FormField
                label={T.designation}
                value={l.libelle}
                onChangeText={(libelle) => maj(l.id, { libelle })}
                placeholder={T.exempleDesignation}
              />
            </View>
            <Pressable
              style={commonStyles.boutonPastille}
              onPress={() => onChange(lignes.filter((x) => x.id !== l.id))}
              accessibilityLabel={T.retirer}
            >
              <Ionicons name="close-circle" size={28} color={colors.danger} />
            </Pressable>
          </View>
          <FormField
            label={T.animal}
            value={l.animal ?? ''}
            onChangeText={(animal) => maj(l.id, { animal })}
            placeholder={T.exempleAnimal}
          />
          <FormField
            label={T.ordonnance}
            value={l.ordonnance ?? ''}
            onChangeText={(ordonnance) => maj(l.id, { ordonnance })}
          />
          <View style={commonStyles.row}>
            <View style={commonStyles.flex1}>
              <DateFacultative
                label={T.debut}
                valeur={l.dateDebut}
                parDefaut={defaut}
                onChange={(dateDebut) => maj(l.id, { dateDebut })}
              />
            </View>
            <View style={commonStyles.flex1}>
              <DateFacultative
                label={T.fin}
                valeur={l.dateFin}
                parDefaut={defaut}
                onChange={(dateFin) => maj(l.id, { dateFin })}
              />
            </View>
          </View>
          <Text style={commonStyles.lineSemiBold}>{T.medicament}</Text>
          <View style={commonStyles.row}>
            <View style={commonStyles.flex1}>
              <FormField
                label={T.voie}
                value={l.voie ?? ''}
                onChangeText={(voie) => maj(l.id, { voie })}
                placeholder={T.exempleVoie}
              />
            </View>
            <View style={commonStyles.flex1}>
              <FormField
                label={T.dose}
                value={l.dose ?? ''}
                onChangeText={(dose) => maj(l.id, { dose })}
                placeholder={T.exempleDose}
              />
            </View>
            <View style={commonStyles.flex1}>
              <FormField
                label={T.rythme}
                value={l.rythme ?? ''}
                onChangeText={(rythme) => maj(l.id, { rythme })}
                placeholder={T.exempleRythme}
              />
            </View>
          </View>
          <DateFacultative
            label={T.remise}
            valeur={l.remiseEnVente}
            parDefaut={defaut}
            onChange={(remiseEnVente) => maj(l.id, { remiseEnVente })}
          />
          <FormField
            label={T.observations}
            value={l.observations ?? ''}
            onChangeText={(observations) => maj(l.id, { observations })}
            multiline
          />
        </View>
      ))}
      <Button variant="secondary" label={T.ajouter} onPress={() => onChange([...lignes, ligneVeterinaireVide()])} />
    </Card>
  );
}
