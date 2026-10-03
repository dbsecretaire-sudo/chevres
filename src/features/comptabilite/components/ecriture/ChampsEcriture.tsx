import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FormField } from '@/shared/components/FormField';
import { SelectField, type SelectOption } from '@/shared/components/SelectField';
import { colors } from '@/shared/theme/colors';
import type { CompteComptable } from '@/shared/constants/planComptable';
import { commonStyles } from '@/shared/styles/commonStyles';
import { TEXTES } from '@/shared/textes';

interface MontantProps {
  label?: string;
  value: string;
  onChange: (valeur: string) => void;
  required?: boolean;
  placeholder?: string;
}

/** Champ de saisie d'un montant TTC en euros (clavier décimal). */
export function ChampMontantTtc({
  label = TEXTES.comptabilite.nouvelleEcriture.montantTtc,
  value,
  onChange,
  required = true,
  placeholder,
}: MontantProps) {
  return (
    <FormField
      label={label}
      required={required}
      value={value}
      onChangeText={onChange}
      keyboardType="decimal-pad"
      placeholder={placeholder}
    />
  );
}

interface CategorieProps<T extends string> {
  label: string;
  value: T;
  onChange: (valeur: T) => void;
  options: SelectOption<T>[];
  /** Quand la catégorie est « Autre », un compte PCG au choix est demandé à côté. */
  demanderCompte: boolean;
  compte: string;
  onCompteChange: (numero: string) => void;
  optionsCompte: SelectOption<string>[];
  onGererComptes: () => void;
}

/** Liste des catégories ; si « Autre », elle partage la ligne avec le choix du compte PCG et un crayon vers la gestion des comptes. */
export function ChampCategorieCompte<T extends string>({
  label,
  value,
  onChange,
  options,
  demanderCompte,
  compte,
  onCompteChange,
  optionsCompte,
  onGererComptes,
}: CategorieProps<T>) {
  const categorie = (
    <SelectField label={label} required value={value} onChange={onChange} options={options} />
  );
  if (!demanderCompte) return categorie;
  return (
    <View style={commonStyles.rowFin}>
      <View style={commonStyles.flex1}>{categorie}</View>
      <View style={commonStyles.flex1}>
        <SelectField
          label={TEXTES.commun.general.comptePcg}
          required
          searchable
          value={compte}
          onChange={onCompteChange}
          options={optionsCompte}
        />
      </View>
      <Pressable style={commonStyles.boutonIcone} onPress={onGererComptes}>
        <Ionicons name="pencil" size={20} color={colors.ajout} />
      </Pressable>
    </View>
  );
}

/** Rappel, sous la catégorie, du compte PCG qui sera utilisé. */
export function NoteComptePcg({ compte }: { compte: CompteComptable }) {
  return (
    <Text style={commonStyles.note}>
      {TEXTES.comptabilite.nouvelleEcriture.comptePcgIndicatifDeuxPoints}
      {compte.numero} — {compte.libelle}
    </Text>
  );
}
