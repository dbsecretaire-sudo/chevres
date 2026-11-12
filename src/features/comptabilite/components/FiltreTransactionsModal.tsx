import { useState } from 'react';
import { Modal, Pressable, Text, View } from 'react-native';
import { FormField } from '@/shared/components/FormField';
import { DateField } from '@/shared/components/DateField';
import { Button } from '@/shared/components/Button';
import { ChoixPastilles } from '@/shared/components/ChoixPastilles';
import { OngletsSaisie } from '@/shared/components/OngletsSaisie';
import { SelectField } from '@/shared/components/SelectField';
import { categoriesClient } from '@/shared/dictionnaire/categoriesClient';
import { categoriesFournisseur } from '@/shared/dictionnaire/categoriesFournisseur';
import { styles } from '@/shared/styles/comptabilite/FiltreTransactionsModal.styles';
import { commonStyles } from '@/shared/styles/commonStyles';
import { TEXTES } from '@/shared/textes';

export interface FiltresTransactions {
  dateDebut: string;
  dateFin: string;
  montantMin: string;
  montantMax: string;
  /** Les seules sorties (débit) ou les seules entrées (crédit) ; absent : les deux. */
  sens?: 'debit' | 'credit';
  /** Une partie du nom du tiers (la ligne de l'écriture) ; vide : tous les tiers. */
  tiers?: string;
  /** La catégorie du tiers (client ou fournisseur) ; absent : toutes. */
  categorieTiers?: string;
}

/** Les volets de la fenêtre, dans ses onglets : la période, le montant, le sens, le tiers. */
type Volet = 'periode' | 'montant' | 'sens' | 'tiers';

interface Props {
  visible: boolean;
  onClose: () => void;
  valeur: FiltresTransactions;
  onChange: (v: FiltresTransactions) => void;
  /** L'année active : les dates du filtre sont de cette année (seuls le mois et le jour se saisissent). */
  annee: number;
  /** Vrai quand « Tout » est choisi : l'année des dates du filtre est libre. */
  anneeLibre: boolean;
}

export function FiltreTransactionsModal({ visible, onClose, valeur, onChange, annee, anneeLibre }: Props) {
  const maj = (patch: Partial<FiltresTransactions>) => onChange({ ...valeur, ...patch });
  const [volet, setVolet] = useState<Volet>('periode');
  const T = TEXTES.comptabilite.filtreTransactionsModal;
  // Les catégories de tiers : celles des clients puis des fournisseurs, une fois chacune (lues à l'ouverture, elles suivent les réglages).
  const categoriesTiers = (() => {
    const vues = new Map<string, string>();
    for (const categorie of [...categoriesFournisseur(), ...categoriesClient()]) {
      if (!vues.has(categorie.id)) vues.set(categorie.id, categorie.nom);
    }
    return [...vues].map(([value, label]) => ({ value, label }));
  })();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={commonStyles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet}>
          <Text style={styles.titre}>{TEXTES.commun.general.filtrer}</Text>

          {/* Un volet à la fois : la période, le montant, le débit ou le crédit, le tiers. */}
          <OngletsSaisie<Volet>
            onglets={[
              { value: 'periode', label: T.periode },
              { value: 'montant', label: T.ongletMontant },
              { value: 'sens', label: T.ongletSens },
              { value: 'tiers', label: T.ongletTiers },
            ]}
            valeur={volet}
            onChange={setVolet}
          />

          {volet === 'periode' ? (
            <View style={commonStyles.row}>
              <View style={commonStyles.flex1}>
                <DateField
                  label={T.du}
                  value={valeur.dateDebut}
                  onChange={(v) => maj({ dateDebut: v })}
                  anneeImposee={anneeLibre ? undefined : annee}
                  jourMoisAnnee
                />
              </View>
              <View style={commonStyles.flex1}>
                <DateField
                  label={T.au}
                  value={valeur.dateFin}
                  onChange={(v) => maj({ dateFin: v })}
                  anneeImposee={anneeLibre ? undefined : annee}
                  jourMoisAnnee
                />
              </View>
            </View>
          ) : null}

          {volet === 'montant' ? (
            <View style={commonStyles.row}>
              <View style={commonStyles.flex1}>
                <FormField
                  label={T.min}
                  value={valeur.montantMin}
                  onChangeText={(v) => maj({ montantMin: v })}
                  keyboardType="decimal-pad"
                  placeholder="0"
                />
              </View>
              <View style={commonStyles.flex1}>
                <FormField
                  label={T.max}
                  value={valeur.montantMax}
                  onChangeText={(v) => maj({ montantMax: v })}
                  keyboardType="decimal-pad"
                  placeholder={T.ex500}
                />
              </View>
            </View>
          ) : null}

          {/* Des pastilles, comme le choix de l'année : un seul sens actif, sans ressembler aux boutons Réinitialiser et Appliquer. */}
          {volet === 'sens' ? (
            <ChoixPastilles
              options={[
                { value: 'tous', label: T.tousLesSens },
                { value: 'debit', label: T.debit },
                { value: 'credit', label: T.credit },
              ]}
              value={valeur.sens ?? 'tous'}
              onChange={(v) => maj({ sens: v === 'tous' ? undefined : v })}
            />
          ) : null}

          {volet === 'tiers' ? (
            <View style={{ gap: 10 }}>
              <FormField
                label={T.tiers}
                value={valeur.tiers ?? ''}
                onChangeText={(v) => maj({ tiers: v })}
                placeholder={T.exempleTiers}
              />
              <SelectField
                label={T.categorieTiers}
                value={valeur.categorieTiers ?? ''}
                options={[{ value: '', label: T.toutesCategories }, ...categoriesTiers]}
                onChange={(v) => maj({ categorieTiers: v || undefined })}
              />
            </View>
          ) : null}

          <View style={commonStyles.row}>
            <Button
              style={commonStyles.flex1}
              variant="secondary"
              label={T.reinitialiser}
              onPress={() => onChange({ dateDebut: '', dateFin: '', montantMin: '', montantMax: '' })}
            />
            <Button
              style={commonStyles.flex1}
              label={TEXTES.comptabilite.filtreTransactionsModal.appliquer}
              onPress={onClose}
            />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
