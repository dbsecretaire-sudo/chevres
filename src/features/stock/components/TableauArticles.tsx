import { Pressable, Text } from 'react-native';
import type { ArticleAffiche } from '@/features/stock/services/stock';
import { TableauDeDonnees, type ColonneDuTableau } from '@/shared/components/TableauDeDonnees';
import { colors } from '@/shared/theme/colors';
import { formatMontant } from '@/shared/utils/dates';

/** Un article de l'inventaire avec ce qu'en dit le tableau : sa quantité (déjà écrite avec son unité), son niveau et sa note. */
export interface LigneArticle {
  article: ArticleAffiche;
  quantite: string;
  niveau: number;
  note?: string;
}

interface Props {
  lignes: readonly LigneArticle[];
  onOuvrir: (ligne: LigneArticle, rang: number) => void;
  /** Le crayon (renommer, changer de compte, supprimer…) ; absent : pas de bouton sur la ligne. */
  onModifier?: (ligne: LigneArticle) => void;
  libelleModifier: string;
}

/**
 * Les articles d'une rubrique de l'inventaire en tableau (affichage sobre sur un grand écran) : le nom, la quantité en stock (en rouge quand elle est négative), le prix
 * unitaire, une note, et « Modifier ». Un clic sur la ligne ouvre l'article (mouvement, lots, historique).
 */
export function TableauArticles({ lignes, onOuvrir, onModifier, libelleModifier }: Props) {
  const colonnes: readonly ColonneDuTableau<LigneArticle>[] = [
    { cle: 'article', titre: 'Article', poids: 3, valeur: (l) => l.article.libelle },
    {
      cle: 'quantite',
      titre: 'En stock',
      poids: 1.3,
      aligne: 'droite',
      valeur: (l) => l.niveau,
      rendu: (l) => <Text style={[{ fontSize: 13, color: colors.text }, l.niveau < 0 && { color: colors.danger, fontWeight: '800' }]}>{l.quantite}</Text>,
    },
    {
      cle: 'prix',
      titre: 'Prix unitaire',
      poids: 1.2,
      aligne: 'droite',
      valeur: (l) => l.article.prix,
      texte: (l) => (l.article.prix !== undefined ? formatMontant(l.article.prix) : ''),
    },
    { cle: 'note', titre: 'Note', poids: 3, valeur: (l) => l.note ?? '' },
    ...(onModifier
      ? [
          {
            cle: 'modifier',
            titre: '',
            poids: 1,
            aligne: 'droite' as const,
            triable: false,
            valeur: () => '',
            rendu: (l: LigneArticle) => (
              <Pressable onPress={() => onModifier(l)} hitSlop={6} accessibilityRole="button" accessibilityLabel={`${libelleModifier} ${l.article.libelle}`}>
                <Text style={{ fontSize: 13, fontWeight: '700', color: colors.primaryDark, textDecorationLine: 'underline' }}>{libelleModifier}</Text>
              </Pressable>
            ),
          },
        ]
      : []),
  ];
  return (
    <TableauDeDonnees
      integre
      colonnes={colonnes}
      lignes={lignes}
      cleDeLaLigne={(l) => l.article.cle}
      vide="Aucun article."
      onLigne={(l) => onOuvrir(l, lignes.indexOf(l))}
    />
  );
}
