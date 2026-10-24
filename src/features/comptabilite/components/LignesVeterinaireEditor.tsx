import { useCallback, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '@/shared/components/Button';
import { Card } from '@/shared/components/Card';
import { DateField } from '@/shared/components/DateField';
import { FormField } from '@/shared/components/FormField';
import { SelectModalMultiple } from '@/shared/components/SelectModalMultiple';
import { deEspeceCourante } from '@/features/cheptel/utils/espece';
import { numerosDeBoucles } from '@/features/cheptel/utils/numerosBoucles';
import { listToutesVisitesVeterinaire } from '@/features/sante/repository/visitesVeterinaire';
import { bouclesDeLaVisite } from '@/features/sante/services/carnetSanitaire';
import { CATEGORIE_STOCKAGE } from '@/shared/constants/stockage';
import { ROUTES } from '@/shared/constants/routes';
import { loadAllYears } from '@/shared/storage/localStore';
import { ligneVeterinaireVide } from '@/features/comptabilite/forms/lignesVeterinaire';
import type { LigneVeterinaire } from '@/features/comptabilite/types';
import { colors } from '@/shared/theme/colors';
import { commonStyles } from '@/shared/styles/commonStyles';
import { styles } from '@/shared/styles/comptabilite/LignesVeterinaireEditor.styles';
import { TEXTES } from '@/shared/textes';
import { todayISO } from '@/shared/utils/dates';

const T = TEXTES.carnet.lignes;

interface Props {
  lignes: LigneVeterinaire[];
  onChange: (lignes: LigneVeterinaire[]) => void;
  /** La date de la facture, celle de la visite : celle que prend une date facultative qu'on ajoute (à défaut, aujourd'hui), et le jour des boucles proposées. */
  dateParDefaut?: string;
  /** La visite vétérinaire de la facture, quand elle existe : où ajouter les numéros des boucles quand la liste est vide. */
  visiteId?: string;
  /** L'écran à retrouver au retour de la visite (la flèche de retour y ramène). */
  retour?: string;
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
  if (!valeur)
    return <Button variant="secondary" label={T.ajouterDate(label)} onPress={() => onChange(parDefaut)} />;
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
 * Tout ce qui a été fait lors d'une visite du vétérinaire (actes, traitements). Chaque ligne commence par les animaux concernés, choisis
 * dans la liste des boucles présentes à l'exploitation le jour de la visite et contrôlées ce jour-là (le « N° de boucle concerné » de la
 * visite) : le reste de la ligne — l'ordonnance, les dates du traitement, le médicament (voie, dose, rythme), la remise en vente de la
 * viande et du lait, le motif — ne s'affiche qu'ensuite. Sans boucle à proposer, il reste bloqué et un message demande d'ajouter les
 * numéros dans les détails de la visite. Ces lignes ne changent pas le montant de la facture : elles alimentent le carnet sanitaire.
 */
export function LignesVeterinaireEditor({ lignes, onChange, dateParDefaut, visiteId, retour }: Props) {
  const router = useRouter();
  const defaut = dateParDefaut || todayISO();
  /** Les boucles des animaux présents et contrôlés le jour de la visite, que la liste propose. */
  const [boucles, setBoucles] = useState<string[]>([]);
  /** La ligne dont on choisit les animaux dans la liste. */
  const [ligneAChoisir, setLigneAChoisir] = useState<string | null>(null);
  // La liste est relue à chaque retour sur l'écran : les numéros qu'on vient d'ajouter à la visite y sont.
  useFocusEffect(
    useCallback(() => {
      let actif = true;
      Promise.all([loadAllYears(CATEGORIE_STOCKAGE.CHEPTEL), listToutesVisitesVeterinaire()])
        .then(([animaux, visites]) => {
          if (actif) setBoucles(bouclesDeLaVisite(defaut, deEspeceCourante(animaux), visites));
        })
        .catch(() => undefined);
      return () => {
        actif = false;
      };
    }, [defaut]),
  );
  const maj = (id: string, changement: Partial<LigneVeterinaire>) =>
    onChange(lignes.map((l) => (l.id === id ? { ...l, ...changement } : l)));
  const ouvrirLaVisite = () => {
    if (!visiteId) return;
    const suite = retour ? `&retour=${encodeURIComponent(retour)}` : '';
    router.push(`${ROUTES.santeVisite(visiteId)}${suite}` as never);
  };

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
          <View style={commonStyles.gap6}>
            <Text style={commonStyles.lineSemiBold}>{T.animauxConcernes}</Text>
            <Pressable
              style={styles.champAnimaux}
              onPress={() => boucles.length > 0 && setLigneAChoisir(l.id)}
              accessibilityLabel={T.animauxConcernes}
            >
              <Text style={[styles.texteAnimaux, !l.animal && styles.placeholder]} numberOfLines={2}>
                {l.animal || T.choisirLesAnimaux}
              </Text>
              <Ionicons name="chevron-down" size={18} color={colors.textMuted} />
            </Pressable>
          </View>
          {l.animal ? (
            <>
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
            </>
          ) : boucles.length === 0 ? (
            <View style={commonStyles.gap8}>
              <Text style={commonStyles.required}>{T.aucuneBoucle}</Text>
              {visiteId ? (
                <Button variant="secondary" label={T.modifierVisite} onPress={ouvrirLaVisite} />
              ) : (
                <Text style={commonStyles.required}>{T.sansVisite}</Text>
              )}
            </View>
          ) : (
            <Text style={commonStyles.note}>{T.choisirAbord}</Text>
          )}
        </View>
      ))}
      <Button
        variant="secondary"
        label={T.ajouter}
        onPress={() => onChange([...lignes, ligneVeterinaireVide()])}
      />
      <Text style={commonStyles.note}>{T.aideAnimaux}</Text>
      <SelectModalMultiple<string>
        key={ligneAChoisir ?? 'fermee'}
        visible={ligneAChoisir !== null}
        titre={T.titreChoixAnimaux}
        options={boucles.map((b) => ({ value: b, label: b }))}
        initiales={numerosDeBoucles(lignes.find((l) => l.id === ligneAChoisir)?.animal)}
        libelleValider={T.validerChoix}
        numeroDe={(b) => (/^\d+$/.test(b) ? Number(b) : undefined)}
        onValider={(choisies) => {
          if (ligneAChoisir) maj(ligneAChoisir, { animal: choisies.join(', ') });
          setLigneAChoisir(null);
        }}
        onClose={() => setLigneAChoisir(null)}
      />
    </Card>
  );
}
