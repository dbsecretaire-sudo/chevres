import { useCallback, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { optionsDesComptes } from '@/features/comptabilite/utils/optionsComptes';
import { listComptesPcg } from '@/features/comptes-pcg/repository';
import { NomModal } from '@/features/dossiers/components/NomModal';
import { useListesPerso } from '@/features/settings/hooks/useListesPerso';
import {
  categoriesDepenseDOffice,
  circuitsDOffice,
  objetsAssuranceDOffice,
  type CleListePerso,
} from '@/features/settings/services/listesDeChoix';
import {
  avecChoixAjoute,
  avecChoixMasque,
  avecChoixRenomme,
  avecCompteDuChoix,
  choixProposes,
  sansChoixAjoute,
  type Choix,
  type ListePerso,
} from '@/features/settings/services/listesPerso';
import { Button } from '@/shared/components/Button';
import { Fab } from '@/shared/components/Fab';
import { FenetreCategorieDepense } from '@/features/settings/components/FenetreCategorieDepense';
import { FormField } from '@/shared/components/FormField';
import { TableauDeDonnees, type ColonneDuTableau } from '@/shared/components/TableauDeDonnees';
import { useDispositionComptable } from '@/shared/hooks/useDispositionComptable';
import { GroupeAccueil } from '@/features/accueil/components/GroupeAccueil';
import { Screen } from '@/shared/components/Screen';
import { SelectField } from '@/shared/components/SelectField';
import { ACTIVITE_COMMUNE } from '@/shared/constants/etablissements';
import { COMPTE_PAR_DEPENSE } from '@/shared/constants/planComptable';
import { commonStyles } from '@/shared/styles/commonStyles';
import { useAccentColor } from '@/shared/theme/AccentColorContext';
import { colors } from '@/shared/theme/colors';
import { TEXTES } from '@/shared/textes';

const T = TEXTES.settings.listesChoix;

/** Un choix qu'on renomme : la liste et le choix. */
interface ARenommer {
  liste: CleListePerso;
  choix: Choix;
}

/** Tous les choix d'une liste, masqués compris (la case décochée) : d'office, puis ceux de l'utilisateur. */
function tousLesChoix(base: { id: string; nom: string }[], perso: ListePerso | undefined, renommables: boolean): (Choix & { visible: boolean })[] {
  const sansRenom = renommables ? perso : perso ? { ...perso, renommes: undefined } : undefined;
  const ids = [...base.map((b) => b.id), ...(perso?.ajoutes ?? []).map((a) => a.id)];
  return choixProposes(base, sansRenom, ids).map((c) => ({ ...c, visible: !perso?.masques?.includes(c.id) }));
}

/**
 * Organisation › Listes de choix : « Assurance de » (ce qu'une assurance couvre) et « Catégorie de dépense ». Chaque choix a sa case : cochée, il est proposé dans les
 * écritures ; décochée, il est masqué. « Renommer » change son nom (celui d'une catégorie de dépense d'office reste fixe : il porte son sens comptable). Un choix ajouté se
 * retire ; une catégorie de dépense ajoutée est rattachée à un compte du plan comptable, qui reçoit ses écritures (la Rentabilité et la fiscalité les y retrouvent).
 * Une écriture déjà faite garde son choix, même masqué.
 */
export default function ListesDeChoix() {
  const accent = useAccentColor();
  const { listes, changer } = useListesPerso();
  const [comptes, setComptes] = useState<Awaited<ReturnType<typeof listComptesPcg>>>([]);
  useFocusEffect(
    useCallback(() => {
      listComptesPcg()
        .then(setComptes)
        .catch(() => undefined);
    }, []),
  );
  const optionsCompte = useMemo(() => optionsDesComptes(comptes, ACTIVITE_COMMUNE, []).optionsCompteDepense, [comptes]);
  const [aRenommer, setARenommer] = useState<ARenommer | null>(null);
  const comptable = useDispositionComptable();
  /** La liste à laquelle on ajoute un choix (le poste de comptabilité : une fenêtre demande son nom). */
  const [ajoutDans, setAjoutDans] = useState<CleListePerso | null>(null);
  /** La fenêtre d'une catégorie de dépense : une nouvelle (`{}`) ou le compte d'une catégorie ajoutée (`{ choix }`). */
  const [edition, setEdition] = useState<{ choix?: Choix } | null>(null);
  const [nouvelObjet, setNouvelObjet] = useState('');
  const [nouveauCircuit, setNouveauCircuit] = useState('');
  const [nouvelleCategorie, setNouvelleCategorie] = useState('');
  const [compteChoisi, setCompteChoisi] = useState('');

  const objets = tousLesChoix(objetsAssuranceDOffice(), listes.objetsAssurance, true);
  const categories = tousLesChoix(categoriesDepenseDOffice(), listes.categoriesDepense, false);
  const circuits = tousLesChoix(circuitsDOffice(), listes.circuitsVente, true);

  /** Une ligne : la case (cochée : proposé), le nom, puis à droite « Renommer » et, pour un choix ajouté, « Retirer ». */
  const ligne = (liste: CleListePerso, c: Choix & { visible: boolean }, renommable: boolean) => (
    <View key={c.id} style={styles.ligne}>
      <Pressable
        style={styles.case}
        onPress={() => changer(liste, (p) => avecChoixMasque(p, c.id, c.visible))}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: c.visible }}
        accessibilityLabel={c.nom}
      >
        <Ionicons name={c.visible ? 'checkbox' : 'square-outline'} size={22} color={c.visible ? accent : colors.textMuted} />
        <Text style={[commonStyles.valueText, !c.visible && styles.masque]} numberOfLines={2}>
          {c.nom}
        </Text>
      </Pressable>
      {renommable || c.perso ? (
        <Pressable onPress={() => setARenommer({ liste, choix: c })} hitSlop={6} accessibilityRole="button">
          <Text style={[styles.lien, { color: accent }]}>{T.renommer}</Text>
        </Pressable>
      ) : null}
      {c.perso ? (
        <Pressable onPress={() => changer(liste, (p) => sansChoixAjoute(p, c.id))} hitSlop={6} accessibilityRole="button">
          <Text style={[styles.lien, { color: colors.danger }]}>{T.retirer}</Text>
        </Pressable>
      ) : null}
    </View>
  );

  /** Le compte d'une catégorie de dépense, avec son libellé : celui d'office de l'application, ou celui choisi pour une catégorie ajoutée. */
  const compteDe = (c: Choix): string => {
    if (c.perso) {
      const trouve = comptes.find((x) => x.numero === c.compte || x.id === c.compte);
      return trouve ? `${trouve.numero} — ${trouve.libelle}` : (c.compte ?? '');
    }
    const d = COMPTE_PAR_DEPENSE[c.id as keyof typeof COMPTE_PAR_DEPENSE];
    return d ? `${d.numero} — ${d.libelle}` : '';
  };

  /** Le poste de comptabilité : chaque liste est un tableau (case « proposé », nom, actions), avec le bouton d'ajout dessous. */
  const tableau = (liste: CleListePerso, choix: (Choix & { visible: boolean })[], renommable: boolean) => {
    const colonnes: ColonneDuTableau<Choix & { visible: boolean }>[] = [
      {
        cle: 'visible',
        titre: T.propose,
        poids: 1.4,
        aligne: 'centre',
        valeur: (c) => (c.visible ? 1 : 0),
        rendu: (c) => (
          <Pressable
            onPress={() => changer(liste, (p) => avecChoixMasque(p, c.id, c.visible))}
            hitSlop={8}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: c.visible }}
            accessibilityLabel={c.nom}
          >
            <Ionicons name={c.visible ? 'checkbox' : 'square-outline'} size={20} color={c.visible ? accent : colors.textMuted} />
          </Pressable>
        ),
      },
      {
        cle: 'nom',
        titre: T.choix,
        poids: 4,
        valeur: (c) => c.nom,
        // Le nom, puis le crayon qui le renomme (comme pour les catégories de contact) ; pas de crayon pour un choix d'office qui ne se renomme pas.
        rendu: (c) => (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Text style={[commonStyles.valueText, !c.visible && styles.masque, { flexShrink: 1 }]}>{c.nom}</Text>
            {renommable || c.perso ? (
              <Pressable onPress={() => setARenommer({ liste, choix: c })} hitSlop={8} accessibilityRole="button" accessibilityLabel={T.renommer}>
                <Ionicons name="create-outline" size={16} color={colors.textMuted} />
              </Pressable>
            ) : null}
          </View>
        ),
      },
      // Le compte du plan comptable de chaque catégorie : celui que l'application donne aux catégories d'office, celui qu'on a choisi pour une catégorie ajoutée.
      ...(liste === 'categoriesDepense'
        ? [
            {
              cle: 'compte',
              titre: T.compte,
              poids: 3.5,
              valeur: (c: Choix & { visible: boolean }) => compteDe(c),
              // Le compte, et pour une catégorie ajoutée le crayon qui le change (comme le crayon du nom).
              rendu: (c: Choix & { visible: boolean }) => (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Text style={[styles.texteCompte, !c.visible && styles.masque, { flexShrink: 1 }]}>{compteDe(c)}</Text>
                  {c.perso ? (
                    <Pressable onPress={() => setEdition({ choix: c })} hitSlop={8} accessibilityRole="button" accessibilityLabel={T.compte}>
                      <Ionicons name="create-outline" size={16} color={colors.textMuted} />
                    </Pressable>
                  ) : null}
                </View>
              ),
            } satisfies ColonneDuTableau<Choix & { visible: boolean }>,
          ]
        : []),
      // La colonne des actions : « Renommer » et « Retirer » (vide pour un choix d'office qui ne se renomme pas).
      actionsDeLaListe(liste),
    ];
    return <TableauDeDonnees integre colonnes={colonnes} lignes={choix} cleDeLaLigne={(c) => c.id} vide="" />;
  };
  const actionsDeLaListe = (liste: CleListePerso): ColonneDuTableau<Choix & { visible: boolean }> => ({
        cle: 'actions',
        titre: '',
        poids: 1.3,
        triable: false,
        valeur: () => '',
        // « Supprimer », pour un choix qu'on a ajouté (celui d'office se masque seulement, par sa case).
        rendu: (c) =>
          c.perso ? (
            <Pressable onPress={() => changer(liste, (p) => sansChoixAjoute(p, c.id))} hitSlop={6} accessibilityRole="button">
              <Text style={[styles.lien, { color: colors.danger }]}>{TEXTES.commun.general.supprimer}</Text>
            </Pressable>
          ) : null,
  });

  if (comptable) {
    return (
      <Screen>
        <Text style={commonStyles.note}>{T.intro}</Text>
        <GroupeAccueil titre={T.assuranceDe}>
          <Text style={commonStyles.note}>{T.assuranceAide}</Text>
          {tableau('objetsAssurance', objets, true)}
          <Fab options={[{ label: T.nouveauChoix, icon: 'add', onPress: () => setAjoutDans('objetsAssurance') }]} />
        </GroupeAccueil>
        <GroupeAccueil titre={T.circuitDeVente}>
          <Text style={commonStyles.note}>{T.circuitAide}</Text>
          {tableau('circuitsVente', circuits, true)}
          <Fab options={[{ label: T.nouveauChoix, icon: 'add', onPress: () => setAjoutDans('circuitsVente') }]} />
        </GroupeAccueil>
        <GroupeAccueil titre={T.categorieDepense}>
          <Text style={commonStyles.note}>{T.categorieAide}</Text>
          {tableau('categoriesDepense', categories, false)}
          <Fab options={[{ label: T.nouvelleCategorie, icon: 'add', onPress: () => setEdition({}) }]} />
        </GroupeAccueil>
        <FenetreCategorieDepense
          key={edition ? (edition.choix?.id ?? 'nouvelle') : 'fermee'}
          visible={!!edition}
          avecNom={!edition?.choix}
          titre={edition?.choix ? `${T.compte} : ${edition.choix.nom}` : T.nouvelleCategorie}
          compteInitial={edition?.choix?.compte ?? ''}
          options={optionsCompte}
          onValider={(nom, compte) => {
            const choix = edition?.choix;
            setEdition(null);
            if (choix) changer('categoriesDepense', (p) => avecCompteDuChoix(p, choix.id, compte));
            else changer('categoriesDepense', (p) => avecChoixAjoute(p, nom, compte));
          }}
          onAnnuler={() => setEdition(null)}
        />
        <NomModal
          visible={!!aRenommer}
          titre={T.renommerTitre}
          valeurInitiale={aRenommer?.choix.nom}
          onValider={(nom) => {
            const r = aRenommer;
            setARenommer(null);
            if (r) changer(r.liste, (p) => avecChoixRenomme(p, r.choix.id, nom));
          }}
          onAnnuler={() => setARenommer(null)}
        />
        <NomModal
          visible={!!ajoutDans}
          titre={T.nouveauChoix}
          placeholder={ajoutDans === 'circuitsVente' ? T.exempleCircuit : T.exempleAssurance}
          onValider={(nom) => {
            const liste = ajoutDans;
            setAjoutDans(null);
            if (liste) changer(liste, (p) => avecChoixAjoute(p, nom));
          }}
          onAnnuler={() => setAjoutDans(null)}
        />
      </Screen>
    );
  }

  return (
    <Screen>
      <Text style={commonStyles.note}>{T.intro}</Text>

      <GroupeAccueil titre={T.assuranceDe}>
        <Text style={commonStyles.note}>{T.assuranceAide}</Text>
        <View style={styles.bloc}>{objets.map((c) => ligne('objetsAssurance', c, true))}</View>
        <View style={styles.ajout}>
          <FormField label={T.nouveauChoix} value={nouvelObjet} onChangeText={setNouvelObjet} placeholder={T.exempleAssurance} />
          <Button
            label={T.ajouter}
            disabled={!nouvelObjet.trim()}
            onPress={() => {
              changer('objetsAssurance', (p) => avecChoixAjoute(p, nouvelObjet));
              setNouvelObjet('');
            }}
          />
        </View>
      </GroupeAccueil>

      <GroupeAccueil titre={T.circuitDeVente}>
        <Text style={commonStyles.note}>{T.circuitAide}</Text>
        <View style={styles.bloc}>{circuits.map((c) => ligne('circuitsVente', c, true))}</View>
        <View style={styles.ajout}>
          <FormField label={T.nouveauChoix} value={nouveauCircuit} onChangeText={setNouveauCircuit} placeholder={T.exempleCircuit} />
          <Button
            label={T.ajouter}
            disabled={!nouveauCircuit.trim()}
            onPress={() => {
              changer('circuitsVente', (p) => avecChoixAjoute(p, nouveauCircuit));
              setNouveauCircuit('');
            }}
          />
        </View>
      </GroupeAccueil>

      <GroupeAccueil titre={T.categorieDepense}>
        <Text style={commonStyles.note}>{T.categorieAide}</Text>
        <View style={styles.bloc}>
          {categories.map((c) => (
            <View key={c.id}>
              {ligne('categoriesDepense', c, false)}
              {/* Une catégorie ajoutée : son compte du plan comptable, modifiable sous son nom. */}
              {c.perso ? (
                <View style={styles.compte}>
                  <SelectField<string>
                    label={T.compte}
                    searchable
                    value={c.compte ?? ''}
                    onChange={(compte) => changer('categoriesDepense', (p) => avecCompteDuChoix(p, c.id, compte))}
                    options={optionsCompte}
                  />
                </View>
              ) : null}
            </View>
          ))}
        </View>
        <View style={styles.ajout}>
          <FormField label={T.nouvelleCategorie} value={nouvelleCategorie} onChangeText={setNouvelleCategorie} placeholder={T.exempleCategorie} />
          <SelectField<string>
            label={T.compte}
            searchable
            value={compteChoisi}
            onChange={setCompteChoisi}
            options={optionsCompte}
            aide={T.compteAide}
          />
          <Button
            label={T.ajouter}
            disabled={!nouvelleCategorie.trim() || !compteChoisi}
            onPress={() => {
              changer('categoriesDepense', (p) => avecChoixAjoute(p, nouvelleCategorie, compteChoisi));
              setNouvelleCategorie('');
              setCompteChoisi('');
            }}
          />
        </View>
      </GroupeAccueil>

      <NomModal
        visible={!!aRenommer}
        titre={T.renommerTitre}
        valeurInitiale={aRenommer?.choix.nom}
        onValider={(nom) => {
          const r = aRenommer;
          setARenommer(null);
          if (r) changer(r.liste, (p) => avecChoixRenomme(p, r.choix.id, nom));
        }}
        onAnnuler={() => setARenommer(null)}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  bloc: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 12, overflow: 'hidden' },
  ligne: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 12, paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: colors.border },
  case: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  masque: { color: colors.textMuted },
  texteCompte: { fontSize: 13, color: colors.text },
  lien: { fontSize: 14, fontWeight: '700' },
  compte: { paddingHorizontal: 12, paddingBottom: 10 },
  ajout: { gap: 8, marginTop: 6 },
});
