import { useMemo, useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { ChampRecherche } from '@/shared/components/ChampRecherche';
import { EmptyState } from '@/shared/components/EmptyState';
import { Screen } from '@/shared/components/ScreenList';
import { PCG_COMPLET, type ComptePcgReference } from '@/shared/constants/pcgComplet';
import { commonStyles } from '@/shared/styles/commonStyles';
import { colors } from '@/shared/theme/colors';
import { TEXTES } from '@/shared/textes';

const T = TEXTES.comptesPcg.planGeneral;

type Ligne =
  | { type: 'classe'; cle: string; classe: string; titre: string }
  | { type: 'compte'; cle: string; compte: ComptePcgReference };

/** Un texte sans accent ni majuscule, pour que « electricite » trouve « Énergie, électricité ». */
const simple = (texte: string): string =>
  texte
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();

/** Les lignes à montrer : les classes, et sous chacune ses comptes qui répondent à la recherche (un numéro qui commence ainsi, ou tous les mots dans le libellé ou la note). */
export function lignesDuPlan(recherche: string): Ligne[] {
  const mots = simple(recherche).split(/\s+/).filter(Boolean);
  const lignes: Ligne[] = [];
  for (const { classe, titre, comptes } of PCG_COMPLET) {
    const trouves =
      mots.length === 0
        ? comptes
        : comptes.filter((c) => {
            const texte = simple(`${c.libelle} ${c.note ?? ''}`);
            return mots.every((m) => (/^\d+$/.test(m) ? c.numero.startsWith(m) : texte.includes(m)));
          });
    if (trouves.length === 0) continue;
    lignes.push({ type: 'classe', cle: `classe-${classe}`, classe, titre });
    for (const compte of trouves) lignes.push({ type: 'compte', cle: compte.numero, compte });
  }
  return lignes;
}

/**
 * Le plan comptable général en consultation : toutes les classes, les comptes à deux, trois et quatre chiffres, avec une note qui aide à choisir quand on hésite entre
 * deux comptes. On cherche par numéro (« 616 ») ou par mot (« assurance », « carburant »). Ce n'est pas la liste des comptes de l'application (« Comptes PCG »).
 */
export default function PlanComptableGeneral() {
  const [recherche, setRecherche] = useState('');
  const lignes = useMemo(() => lignesDuPlan(recherche), [recherche]);
  return (
    <Screen scroll={false}>
      <View style={commonStyles.topPadded}>
        <ChampRecherche value={recherche} onChangeText={setRecherche} placeholder={T.rechercher} />
        <Text style={commonStyles.note}>{T.intro}</Text>
      </View>
      <FlatList
        data={lignes}
        keyExtractor={(l) => l.cle}
        contentContainerStyle={commonStyles.listFab}
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={<EmptyState title={T.aucun} />}
        renderItem={({ item }) =>
          item.type === 'classe' ? (
            <Text style={styles.classe}>{T.classe(item.classe, item.titre)}</Text>
          ) : (
            <View style={[styles.compte, { paddingLeft: 12 + Math.max(0, item.compte.numero.length - 3) * 10 }]}>
              <Text style={[styles.numero, item.compte.numero.length <= 2 && styles.gras]}>{item.compte.numero}</Text>
              <View style={commonStyles.flex1}>
                <Text style={[styles.libelle, item.compte.numero.length <= 2 && styles.gras]}>{item.compte.libelle}</Text>
                {item.compte.note ? <Text style={commonStyles.note}>{item.compte.note}</Text> : null}
              </View>
            </View>
          )
        }
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  classe: {
    marginTop: 14,
    paddingVertical: 6,
    paddingHorizontal: 12,
    fontSize: 13,
    fontWeight: '800',
    color: colors.primaryDark,
    backgroundColor: colors.badgeBg,
    borderRadius: 8,
    overflow: 'hidden',
  },
  compte: {
    flexDirection: 'row',
    gap: 10,
    paddingVertical: 6,
    paddingRight: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  numero: { width: 56, fontSize: 14, color: colors.text, fontVariant: ['tabular-nums'] },
  libelle: { fontSize: 14, color: colors.text },
  gras: { fontWeight: '800' },
});
