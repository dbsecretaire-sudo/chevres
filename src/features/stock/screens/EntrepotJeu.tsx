import { useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { RubriquesDeCartes } from '@/features/stock/components/CartesDuStock';
import { CadreDeJeu } from '@/features/stock/components/CadreDeJeu';
import { useEntrepot } from '@/features/stock/hooks/useEntrepot';
import { BoutonPlat } from '@/shared/components/BoutonPlat';
import { useDispositionComptable } from '@/shared/hooks/useDispositionComptable';
import { useRole } from '@/features/roles/context/RoleContext';
import { ROLE } from '@/shared/constants/roles';
import { COMPTE_PAR_SECTION_INVENTAIRE } from '@/shared/constants/planComptable';
import { ROUTES } from '@/shared/constants/routes';
import { noterOrigine } from '@/shared/navigation/origineRetour';
import { colors } from '@/shared/theme/colors';
import { TEXTES } from '@/shared/textes';

/**
 * L'entrepôt (la grange, le stock des boucles), comme sur la maquette du stock : une pastille par catégorie du stock, puis les rubriques de la
 * catégorie en cartes blanches, chacune avec ses articles et leur quantité à droite. Il lit le stock lui-même : tout changement du stock s'y
 * retrouve, et chaque carte ouvre sa rubrique du stock.
 */
export default function EntrepotJeu({
  seulement,
  titre,
  sauf,
  sections,
  lieu,
  avecCompte,
  sansFermer,
}: {
  seulement?: string;
  titre?: string;
  /** Les rubriques du stock (leur section, ou « liste:identifiant » pour une liste ajoutée) qu'on ne montre pas : la grange n'a pas le stock de boucles. */
  sauf?: readonly string[];
  /** Seulement ces rubriques du stock (leur section), de toutes les catégories, dans cet ordre : le stock de boucles, le stock de l'atelier. Sans onglets. */
  sections?: readonly string[];
  /** La page où l'on est (le lieu) : la flèche de retour des pages qu'elle ouvre y ramène. */
  lieu?: string;
  /** Vrai : chaque rubrique porte en titre son compte du plan comptable (« 601100 Achats stockés — Aliments du bétail »). */
  avecCompte?: boolean;
  /** Vrai : l'entrepôt est dans une autre page (le stock de la page Boucles) : pas de bouton de fermeture. */
  sansFermer?: boolean;
}) {
  const router = useRouter();
  const comptable = useDispositionComptable();
  // Le mode normal n'a pas le stock complet.
  const { role } = useRole();
  const { categories: toutes, groupesParCategorie } = useEntrepot();
  // La page où l'on est : la grange ou l'entrepôt ; la flèche de retour des pages qu'elle ouvre y ramène.
  const origine = ROUTES.lieu(lieu ?? (seulement ? 'grange' : 'entrepot'));
  /** Une page sans pastilles : une seule catégorie (la grange) ou des rubriques choisies. */
  const sansOnglets = !!seulement || !!sections;
  const categories = seulement ? toutes.filter((c) => c.categorie === seulement) : toutes;
  const [onglet, setOnglet] = useState<string | null>(null);
  const defilement = useRef<ScrollView>(null);

  const actuelle = categories.find((c) => c.categorie === onglet) ?? categories[0];
  const groupesDeLaCategorie = sections
    ? sections.flatMap((s) =>
        toutes.flatMap((c) => groupesParCategorie.get(c.categorie) ?? []).filter((g) => g.cle === s),
      )
    : actuelle
      ? (groupesParCategorie.get(actuelle.categorie) ?? [])
      : [];
  const sansExclues = sauf
    ? groupesDeLaCategorie
        .filter((g) => !sauf.includes(g.cle))
        .map((g) => ({ ...g, cartes: g.cartes.filter((c) => !sauf.includes(c.section)) }))
        .filter((g) => g.cartes.length > 0)
    : groupesDeLaCategorie;
  // Le compte du plan comptable de la rubrique, en titre : « 601500 Boucles d'identification ».
  const groupes = avecCompte
    ? sansExclues.map((g) => {
        const compte = COMPTE_PAR_SECTION_INVENTAIRE[g.cle as keyof typeof COMPTE_PAR_SECTION_INVENTAIRE];
        return compte ? { ...g, titre: `${compte.numero} ${compte.libelle}` } : g;
      })
    : sansExclues;
  const choisir = (categorie: string) => {
    setOnglet(categorie);
    defilement.current?.scrollTo({ y: 0, animated: false });
  };

  const intitule = titre ?? (actuelle ? TEXTES.stock.enteteCategorie(actuelle.classe, actuelle.nom) : '');
  // Le poste de comptabilité : pas de cadre de jeu ; la catégorie en titre (avec ses onglets en boutons), puis les rubriques en tableaux.
  if (comptable) {
    return (
      <ScrollView contentContainerStyle={styles.fiche}>
        <Text style={styles.titreFiche}>{intitule}</Text>
        {sansOnglets ? null : (
          <View style={styles.boutons}>
            {categories.map((c) => (
              <BoutonPlat
                key={c.categorie}
                libelle={TEXTES.stock.enteteCategorie(c.classe, c.nom)}
                couleur={c.categorie === actuelle?.categorie ? colors.primaryDark : colors.text}
                onPress={() => choisir(c.categorie)}
              />
            ))}
          </View>
        )}
        <RubriquesDeCartes groupes={groupes} origine={origine} />
        {role === ROLE.BERGER ? null : (
          <View style={styles.boutons}>
            <BoutonPlat
              icone="list"
              libelle={TEXTES.production.lieux.entrepot.stockComplet}
              onPress={() => {
                noterOrigine(origine, ROUTES.COMPTABILITE_STOCKS);
                router.push(ROUTES.COMPTABILITE_STOCKS as never);
              }}
            />
          </View>
        )}
      </ScrollView>
    );
  }
  return (
    <CadreDeJeu
      onFermer={sansFermer ? undefined : () => router.replace('/')}
      onToutLeStock={() => {
        noterOrigine(origine, ROUTES.COMPTABILITE_STOCKS);
        router.push(ROUTES.COMPTABILITE_STOCKS as never);
      }}
      haut={
        <>
          {sansOnglets ? null : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pastilles}>
              {categories.map((c) => {
                const actif = c.categorie === actuelle?.categorie;
                return (
                  <Pressable
                    key={c.categorie}
                    style={[styles.pastille, actif ? styles.pastilleActive : null]}
                    onPress={() => choisir(c.categorie)}
                    accessibilityRole="button"
                    accessibilityState={{ selected: actif }}
                    accessibilityLabel={TEXTES.stock.enteteCategorie(c.classe, c.nom)}
                  >
                    <Text style={[styles.pastilleTexte, actif ? styles.pastilleTexteActive : null]}>{c.nom}</Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          )}
          {actuelle || sections ? <Text style={styles.titre}>{intitule}</Text> : null}
        </>
      }
    >
      <ScrollView ref={defilement} style={styles.defile} contentContainerStyle={styles.rubriques} showsVerticalScrollIndicator={false}>
        <RubriquesDeCartes groupes={groupes} origine={origine} />
      </ScrollView>
    </CadreDeJeu>
  );
}

const styles = StyleSheet.create({
  fiche: { gap: 12, padding: 12 },
  titreFiche: { fontSize: 16, fontWeight: '800', color: colors.text },
  boutons: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  pastilles: { gap: 8, paddingVertical: 4 },
  pastille: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  pastilleActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  pastilleTexte: { fontWeight: '600', color: colors.text },
  pastilleTexteActive: { color: colors.blanc },
  titre: { fontSize: 18, fontWeight: '800', color: colors.text },
  defile: { flex: 1 },
  rubriques: { gap: 14, paddingBottom: 10 },
});
