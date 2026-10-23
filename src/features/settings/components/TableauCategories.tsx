import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TableauDeDonnees, type ColonneDuTableau } from '@/shared/components/TableauDeDonnees';
import { colors } from '@/shared/theme/colors';

/** Une option d'une catégorie : son titre, et si elle est cochée. */
export interface CaseDeCategorie {
  cle: string;
  titre: string;
  coche: (id: string) => boolean;
}

interface Ligne {
  id: string;
  nom: string;
}

interface Props {
  categories: readonly Ligne[];
  /** Les options : la colonne « Options » en compte les cochées. */
  cases: readonly CaseDeCategorie[];
  /** La colonne qui résume le reste (les recettes ou les dépenses que la catégorie permet), en toutes lettres. */
  resume: { titre: string; texte: (id: string) => string };
  /** Le crayon d'une catégorie : son libellé pour l'accessibilité, et ce qu'il ouvre (le renommage). */
  renommer: { libelle: string; onRenommer: (id: string) => void };
  /** La catégorie dont le détail est ouvert sous le tableau. */
  choisie: string | null;
  onChoisir: (id: string) => void;
  vide: string;
}

/**
 * Les catégories de contact en vue d'ensemble (poste de comptabilité) : une ligne par catégorie, avec le nombre de ses options cochées et de ce qu'elle permet (les titres des
 * options sont trop longs pour faire une colonne chacun). Un clic sur la ligne ouvre ses réglages sous le tableau ; le crayon la renomme.
 */
export function TableauCategories({ categories, cases, resume, renommer, choisie, onChoisir, vide }: Props) {
  /** Le nombre d'options cochées pour la catégorie, sur toutes celles qu'on peut cocher. */
  const optionsDe = (id: string) => cases.filter((option) => option.coche(id)).length;
  const colonnes: ColonneDuTableau<Ligne>[] = [
    {
      cle: 'nom',
      titre: 'Catégorie',
      poids: 2,
      valeur: (c) => c.nom,
      rendu: (c) => (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Text style={{ fontSize: 13, fontWeight: choisie === c.id ? '800' : '600', color: colors.text, flexShrink: 1 }}>{c.nom}</Text>
          <Pressable onPress={() => renommer.onRenommer(c.id)} hitSlop={8} accessibilityLabel={renommer.libelle}>
            <Ionicons name="create-outline" size={16} color={colors.textMuted} />
          </Pressable>
        </View>
      ),
    },
    {
      cle: 'options',
      titre: 'Options',
      poids: 1.5,
      aligne: 'centre',
      valeur: (c) => optionsDe(c.id),
      texte: (c) => `${optionsDe(c.id)} sur ${cases.length}`,
    },
    {
      cle: 'resume',
      titre: resume.titre,
      poids: 1.5,
      aligne: 'centre',
      valeur: (c) => resume.texte(c.id),
    },
  ];
  return (
    <TableauDeDonnees
      integre
      colonnes={colonnes}
      lignes={categories}
      cleDeLaLigne={(c) => c.id}
      tri={{ cle: 'nom' }}
      vide={vide}
      onLigne={(c) => onChoisir(c.id)}
    />
  );
}
