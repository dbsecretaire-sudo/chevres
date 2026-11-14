import { Children, isValidElement, type PropsWithChildren, type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlocListe, BlocLignes, useDansBloc } from '@/shared/components/BlocListe';
import { colors } from '@/shared/theme/colors';
import { commonStyles } from '@/shared/styles/commonStyles';

/*
 * LA présentation d'un groupe de menus ou de contacts, en un seul endroit : un bloc blanc arrondi, dont le premier élément est le titre
 * (qui se replie d'un appui) et dont les lignes suivent, séparées par un fin trait. Tout écran qui affiche des groupes passe par ici.
 */

const styles = StyleSheet.create({
  entete: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  titre: { flex: 1, fontSize: 16, fontWeight: '700', color: colors.text },
  balance: { fontSize: 13, fontWeight: '700' },
  // Le trait au-dessus de chaque ligne du bloc (le titre est au-dessus de la première).
  trait: { borderTopWidth: 1, borderTopColor: colors.border },
});

/** Les lignes d'un groupe : celles d'un `BlocLignes` sont reprises à plat, pour former le même bloc que le titre. */
function lignesDe(children: ReactNode): ReactNode[] {
  return Children.toArray(children).flatMap((enfant) =>
    isValidElement(enfant) && enfant.type === BlocLignes
      ? Children.toArray((enfant.props as PropsWithChildren).children)
      : [enfant],
  );
}

interface Props {
  /** Le titre du groupe. Vide : pas de titre, seulement les lignes. */
  titre?: string;
  /** Le nombre d'éléments, affiché après le titre (même replié). */
  nombre?: number;
  /** Ce qui s'affiche à droite du titre, avant la flèche. */
  droite?: ReactNode;
  /** La balance des écritures du groupe, déjà écrite (en chiffres) ; `balanceNegative` : elle s'affiche en rouge. */
  balance?: string;
  balanceNegative?: boolean;
  /** Vrai : les lignes sont visibles. Faux : seul le titre reste. */
  ouvert?: boolean;
  /** Présent : le titre se replie et se déplie d'un appui. Absent : le titre est fixe. */
  onBasculer?: () => void;
}

/** Un groupe en un seul bloc blanc : son titre (qui se replie), puis ses lignes. */
export function GroupeListe({
  titre,
  nombre,
  droite,
  balance,
  balanceNegative = false,
  ouvert = true,
  onBasculer,
  children,
}: PropsWithChildren<Props>) {
  const libelle = titre && nombre !== undefined ? `${titre} · ${nombre}` : titre;
  const lignes = ouvert ? lignesDe(children) : [];
  const contenuTitre = (
    <>
      <Text style={styles.titre}>{libelle}</Text>
      {balance !== undefined ? (
        <Text style={[styles.balance, { color: balanceNegative ? colors.danger : colors.text }]}>{balance}</Text>
      ) : null}
      {droite}
      {onBasculer ? <Ionicons name={ouvert ? 'chevron-up' : 'chevron-down'} size={20} color={colors.textMuted} /> : null}
    </>
  );
  // Dans un bloc commun (les menus d'une page) : le titre a lui aussi son trait, et chaque ligne aussi ; sinon, le titre est le premier élément du bloc.
  const dansBloc = useDansBloc();
  const entete = titre ? (
    onBasculer ? (
      <Pressable
        onPress={onBasculer}
        accessibilityRole="button"
        accessibilityState={{ expanded: ouvert }}
        style={({ pressed }) => [styles.entete, pressed && commonStyles.pressed]}
      >
        {contenuTitre}
      </Pressable>
    ) : (
      <View style={styles.entete}>{contenuTitre}</View>
    )
  ) : null;
  return (
    <View>
      <BlocListe>
        {entete ? (dansBloc ? <View style={styles.trait}>{entete}</View> : entete) : null}
        {lignes.map((ligne, i) => (
          <View key={i} style={titre || i > 0 || dansBloc ? styles.trait : undefined}>
            {ligne}
          </View>
        ))}
      </BlocListe>
    </View>
  );
}
