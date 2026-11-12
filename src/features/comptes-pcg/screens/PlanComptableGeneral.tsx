import { useMemo, useState } from 'react';
import { FlatList, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ChampRecherche } from '@/shared/components/ChampRecherche';
import { EmptyState } from '@/shared/components/EmptyState';
import { Screen } from '@/shared/components/ScreenList';
import { PCG_COMPLET, type ClassePcg, type ComptePcgReference } from '@/shared/constants/pcgComplet';
import { commonStyles } from '@/shared/styles/commonStyles';
import { colors } from '@/shared/theme/colors';
import { TEXTES } from '@/shared/textes';

const T = TEXTES.comptesPcg.planGeneral;

type Ligne =
  | { type: 'classe'; cle: string; classe: string; titre: string }
  | { type: 'compte'; cle: string; compte: ComptePcgReference; groupe: boolean; ouvert?: boolean };

/** Un texte sans accent ni majuscule, pour que « electricite » trouve « Énergie, électricité ». */
const simple = (texte: string): string =>
  texte
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();

/** Les lignes d'une recherche : les classes, et sous chacune ses comptes qui répondent (un numéro qui commence ainsi, ou tous les mots dans le libellé ou la note). */
function lignesDuPlan(recherche: string): Ligne[] {
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
    for (const compte of trouves) {
      lignes.push({ type: 'compte', cle: compte.numero, compte, groupe: compte.numero.length <= 2 });
    }
  }
  return lignes;
}

/**
 * Les lignes d'une classe, comme sur la maquette : un compte à deux chiffres est une bande teintée (qu'on replie ou déplie), et les comptes qui
 * suivent, à trois ou quatre chiffres, sont des cartes rangées sous lui. Les comptes fermés (`fermes`) ne montrent pas les leurs.
 */
function lignesDeLaClasse(classe: ClassePcg, fermes: ReadonlySet<string>): Ligne[] {
  const lignes: Ligne[] = [];
  let groupe: string | null = null;
  for (const compte of classe.comptes) {
    if (compte.numero.length <= 2) {
      groupe = compte.numero;
      lignes.push({ type: 'compte', cle: compte.numero, compte, groupe: true, ouvert: !fermes.has(compte.numero) });
      continue;
    }
    if (groupe !== null && compte.numero.startsWith(groupe) && fermes.has(groupe)) continue;
    lignes.push({ type: 'compte', cle: compte.numero, compte, groupe: false });
  }
  return lignes;
}

/**
 * Le plan comptable général en consultation, comme sur la maquette : les pastilles des classes (1 à 7), les comptes de la classe choisie (les bandes
 * à deux chiffres se replient) et la recherche par numéro (« 616 ») ou par mot (« assurance », « carburant »). Ce n'est pas la liste des comptes de
 * l'application (« Comptes PCG »).
 */
export default function PlanComptableGeneral() {
  const [recherche, setRecherche] = useState('');
  const [classeChoisie, setClasseChoisie] = useState(PCG_COMPLET[0].classe);
  const [fermes, setFermes] = useState<ReadonlySet<string>>(new Set());
  const estRecherche = recherche.trim().length > 0;
  const classe = PCG_COMPLET.find((c) => c.classe === classeChoisie) ?? PCG_COMPLET[0];
  const lignes = useMemo(
    () => (estRecherche ? lignesDuPlan(recherche) : lignesDeLaClasse(classe, fermes)),
    [estRecherche, recherche, classe, fermes],
  );
  const basculer = (numero: string) =>
    setFermes((actuels) => {
      const suite = new Set(actuels);
      if (suite.has(numero)) suite.delete(numero);
      else suite.add(numero);
      return suite;
    });

  return (
    <Screen scroll={false}>
      <View style={commonStyles.topPadded}>
        <ChampRecherche value={recherche} onChangeText={setRecherche} placeholder={T.rechercher} />
        {estRecherche ? null : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.classes}>
            {PCG_COMPLET.map((c) => {
              const actif = c.classe === classe.classe;
              return (
                <Pressable
                  key={c.classe}
                  accessibilityRole="button"
                  accessibilityState={{ selected: actif }}
                  accessibilityLabel={T.classe(c.classe, c.titre)}
                  onPress={() => setClasseChoisie(c.classe)}
                  style={[styles.classe, actif ? styles.classeActive : null]}
                >
                  <Text style={[styles.classeTexte, actif ? styles.classeTexteActive : null]}>{c.classe}</Text>
                </Pressable>
              );
            })}
          </ScrollView>
        )}
        {estRecherche ? null : <Text style={styles.titreClasse}>{T.classe(classe.classe, classe.titre)}</Text>}
        {estRecherche ? <Text style={commonStyles.note}>{T.intro}</Text> : null}
      </View>
      <FlatList
        data={lignes}
        keyExtractor={(l) => (l.type === 'classe' ? l.cle : `${l.cle}`)}
        contentContainerStyle={[commonStyles.listeBlocAvecFab, { paddingHorizontal: 8 }]}
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={<EmptyState title={T.aucun} />}
        renderItem={({ item }) => {
          if (item.type === 'classe') return <Text style={styles.titreClasse}>{T.classe(item.classe, item.titre)}</Text>;
          const { compte, groupe, ouvert } = item;
          const retrait = Math.max(0, compte.numero.length - 3) * 16;
          return (
            <Pressable
              disabled={!groupe}
              onPress={() => basculer(compte.numero)}
              accessibilityRole={groupe ? 'button' : undefined}
              accessibilityState={groupe ? { expanded: ouvert } : undefined}
              style={[groupe ? styles.groupe : styles.carte, { marginLeft: retrait }]}
            >
              <Text style={styles.numero}>{compte.numero}</Text>
              <View style={styles.texte}>
                <Text style={styles.libelle}>{compte.libelle}</Text>
                {compte.note ? <Text style={commonStyles.note}>{compte.note}</Text> : null}
              </View>
              {groupe ? <Ionicons name={ouvert ? 'chevron-down' : 'chevron-forward'} size={20} color={colors.textMuted} /> : null}
            </Pressable>
          );
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  classes: { gap: 8, paddingVertical: 8 },
  classe: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  classeActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  classeTexte: { fontSize: 15, fontWeight: '700', color: colors.text },
  classeTexteActive: { color: colors.blanc },
  titreClasse: { marginTop: 8, fontSize: 13, fontWeight: '700', color: colors.textMuted },
  // Les lignes se suivent sans espace : un fin trait sépare chacune de la suivante.
  groupe: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    backgroundColor: colors.badgeBg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  carte: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  numero: { minWidth: 44, fontSize: 15, fontWeight: '800', color: colors.text, fontVariant: ['tabular-nums'] },
  texte: { flex: 1, gap: 2 },
  libelle: { fontSize: 15, fontWeight: '600', color: colors.text },
});
