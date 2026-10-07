import { useCallback, useState } from 'react';
import { Modal, Pressable, Text, View } from 'react-native';
import { Stack, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '@/shared/components/Button';
import { Card } from '@/shared/components/Card';
import { ConfirmModal } from '@/shared/components/ConfirmModal';
import { FormField } from '@/shared/components/FormField';
import { Screen } from '@/shared/components/Screen';
import { SelectField } from '@/shared/components/SelectField';
import { listComptesPcg } from '@/features/comptes-pcg/repository';
import {
  chargerChoixGroupesRecette,
  enregistrerChoixGroupesRecette,
} from '@/features/comptabilite/repository/groupesRecette';
import { groupesActifsEspece, groupesCochables } from '@/features/comptabilite/utils/recettes';
import {
  PREFIXE_CATEGORIE_AJOUTEE,
  type CategorieAjoutee,
} from '@/features/comptabilite/utils/choixGroupesRecette';
import { ESPECES_LAITIERES, TOUS_GROUPES_RECETTE_ANIMAUX } from '@/shared/constants/comptabilite';
import { especesActives } from '@/shared/dictionnaire/animaux';
import { colors } from '@/shared/theme/colors';
import { generateId } from '@/shared/utils/id';
import { commonStyles } from '@/shared/styles/commonStyles';
import { TEXTES } from '@/shared/textes';
import { LABEL_ACTIVITE_COMPTABLE, LABEL_GROUPE_RECETTE } from '@/shared/textes/libelles';

const T = TEXTES.comptabilite.nouvelleEcriture.choixCategories;

/** Les comptes de recette (classe 7) du plan comptable, où une catégorie ajoutée inscrit ses ventes. */
const PREFIXE_COMPTES_RECETTE = '7';

const idAjoutee = (c: CategorieAjoutee) => `${PREFIXE_CATEGORIE_AJOUTEE}${c.id}`;

/**
 * Les catégories de recette, sur un écran à part : toutes les ventes existantes (et celles qu'on ajoute avec le +) en menus
 * déroulants — une seule déroulée à la fois — qui montrent les espèces de l'exploitation l'une sous l'autre, avec une case
 * chacune. Ce qui est coché est proposé dans la liste « Catégorie de recette » de cette espèce ; chaque case s'enregistre
 * aussitôt.
 */
export default function CategoriesRecette() {
  const especes = especesActives();
  const [coches, setCoches] = useState<Record<string, string[]>>({});
  const [ajoutees, setAjoutees] = useState<CategorieAjoutee[]>([]);
  const [ouverte, setOuverte] = useState<string | null>(null);
  const [comptes, setComptes] = useState<{ value: string; label: string; shortLabel: string }[]>([]);
  const [ajout, setAjout] = useState<{ nom: string; compte: string } | null>(null);
  const [aSupprimer, setASupprimer] = useState<CategorieAjoutee | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      chargerChoixGroupesRecette().then((archive) => {
        setAjoutees(archive.ajoutees);
        setCoches(
          Object.fromEntries(
            especes.map((e) => [
              e,
              [
                ...groupesActifsEspece(e),
                ...archive.ajoutees
                  .filter((c) => (archive.choix[e] ?? []).includes(idAjoutee(c)))
                  .map(idAjoutee),
              ],
            ]),
          ),
        );
      });
      listComptesPcg().then((liste) =>
        setComptes(
          liste
            .filter((c) => c.numero.startsWith(PREFIXE_COMPTES_RECETTE))
            .map((c) => ({ value: c.numero, label: `${c.numero} — ${c.libelle}`, shortLabel: c.numero })),
        ),
      );
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []),
  );

  /** Enregistre aussitôt : les catégories d'office dans l'ordre de la liste, puis celles ajoutées. */
  const enregistrer = async (nouveauxCoches: Record<string, string[]>, nouvelles: CategorieAjoutee[]) => {
    setCoches(nouveauxCoches);
    setAjoutees(nouvelles);
    const choix = Object.fromEntries(
      especes.map((espece) => {
        const choisies = nouveauxCoches[espece] ?? [];
        return [
          espece,
          [
            ...groupesCochables(espece)
              .map((g) => g.groupe as string)
              .filter((g) => choisies.includes(g)),
            ...nouvelles.map(idAjoutee).filter((c) => choisies.includes(c)),
          ],
        ];
      }),
    );
    await enregistrerChoixGroupesRecette(choix, nouvelles);
  };

  const basculer = (espece: string, categorie: string) => {
    const liste = coches[espece] ?? [];
    // Une espèce garde toujours au moins une catégorie.
    if (liste.includes(categorie) && liste.length === 1) return setErreur(T.auMoinsUne);
    setErreur(null);
    enregistrer(
      {
        ...coches,
        [espece]: liste.includes(categorie) ? liste.filter((c) => c !== categorie) : [...liste, categorie],
      },
      ajoutees,
    );
  };

  const validerAjout = () => {
    if (!ajout) return;
    if (!ajout.nom.trim()) return setErreur(T.nomRequis);
    if (!ajout.compte) return setErreur(T.compteRequis);
    const categorie: CategorieAjoutee = { id: generateId(), nom: ajout.nom.trim(), compte: ajout.compte };
    // Une catégorie ajoutée est d'abord proposée à toutes les espèces : on décoche celles qui n'en veulent pas.
    enregistrer(Object.fromEntries(especes.map((e) => [e, [...(coches[e] ?? []), idAjoutee(categorie)]])), [
      ...ajoutees,
      categorie,
    ]);
    setAjout(null);
    setErreur(null);
    setOuverte(idAjoutee(categorie));
  };

  const supprimer = () => {
    if (!aSupprimer) return;
    enregistrer(
      Object.fromEntries(
        Object.entries(coches).map(([e, liste]) => [e, liste.filter((c) => c !== idAjoutee(aSupprimer))]),
      ),
      ajoutees.filter((c) => c.id !== aSupprimer.id),
    );
    setASupprimer(null);
  };

  /** Un menu déroulant : le titre de la catégorie et, une fois déroulé, une case par espèce l'une sous l'autre. */
  const menu = (cle: string, titre: string, laiterie = false, categorie?: CategorieAjoutee) => {
    const ouvert = ouverte === cle;
    return (
      <Card key={cle} style={commonStyles.gap10}>
        <View style={commonStyles.rowSpaceBetween}>
          <Pressable
            style={[commonStyles.rowFin, commonStyles.flex1]}
            onPress={() => setOuverte(ouvert ? null : cle)}
            accessibilityRole="button"
            accessibilityState={{ expanded: ouvert }}
          >
            <Ionicons name={ouvert ? 'chevron-down' : 'chevron-forward'} size={20} color={colors.textMuted} />
            <Text style={commonStyles.lineBold}>{titre}</Text>
          </Pressable>
          {categorie ? (
            <Pressable onPress={() => setASupprimer(categorie)} hitSlop={8} accessibilityLabel={T.supprimer}>
              <Ionicons name="trash" size={20} color={colors.danger} />
            </Pressable>
          ) : null}
        </View>
        {ouvert ? (
          <View style={commonStyles.gap10}>
            {especes.map((espece) => {
              const possible = !laiterie || ESPECES_LAITIERES.includes(espece);
              const coche = possible && (coches[espece] ?? []).includes(cle);
              return (
                <Pressable
                  key={espece}
                  style={[commonStyles.rowFin, !possible && commonStyles.verrouille]}
                  disabled={!possible}
                  onPress={() => basculer(espece, cle)}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: coche, disabled: !possible }}
                >
                  <Ionicons
                    name={coche ? 'checkbox' : 'square-outline'}
                    size={24}
                    color={coche ? colors.ajout : colors.textMuted}
                  />
                  <Text style={commonStyles.valueText}>
                    {LABEL_ACTIVITE_COMPTABLE[espece as keyof typeof LABEL_ACTIVITE_COMPTABLE]}
                  </Text>
                </Pressable>
              );
            })}
            {laiterie && especes.some((e) => !ESPECES_LAITIERES.includes(e)) ? (
              <Text style={commonStyles.mutedItalic}>{T.laiterieReservee}</Text>
            ) : null}
          </View>
        ) : null}
      </Card>
    );
  };

  return (
    <Screen>
      <Stack.Screen
        options={{
          title: T.titre,
          headerRight: () => (
            <Pressable
              onPress={() => setAjout({ nom: '', compte: '' })}
              hitSlop={8}
              accessibilityLabel={T.ajouter}
            >
              <Ionicons name="add-circle" size={30} color={colors.blanc} />
            </Pressable>
          ),
        }}
      />
      <Text style={commonStyles.note}>{T.aide}</Text>
      {TOUS_GROUPES_RECETTE_ANIMAUX.map(({ groupe }) =>
        menu(groupe, LABEL_GROUPE_RECETTE[groupe], groupe === 'laiterie'),
      )}
      {ajoutees.map((c) => menu(idAjoutee(c), c.nom, false, c))}
      {erreur && !ajout ? <Text style={commonStyles.required}>{erreur}</Text> : null}

      {/* Le + ouvre une fenêtre : le nom de la catégorie et le compte du plan comptable où ses ventes s'inscrivent. */}
      <Modal visible={!!ajout} transparent animationType="fade" onRequestClose={() => setAjout(null)}>
        <Pressable style={commonStyles.backdrop} onPress={() => setAjout(null)}>
          <Pressable style={commonStyles.modalSheet} onPress={(ev) => ev.stopPropagation()}>
            <Text style={commonStyles.subheading}>{T.ajouter}</Text>
            <FormField
              label={T.nom}
              required
              value={ajout?.nom ?? ''}
              onChangeText={(nom) => ajout && setAjout({ ...ajout, nom })}
            />
            <SelectField<string>
              label={T.compte}
              required
              searchable
              placeholder={T.choixDuCompte}
              value={ajout?.compte ?? ''}
              onChange={(compte) => ajout && setAjout({ ...ajout, compte })}
              options={comptes}
            />
            {erreur ? <Text style={commonStyles.required}>{erreur}</Text> : null}
            <View style={commonStyles.row}>
              <Button
                style={commonStyles.flex1}
                variant="secondary"
                label={TEXTES.commun.general.annuler}
                onPress={() => {
                  setAjout(null);
                  setErreur(null);
                }}
              />
              <Button style={commonStyles.flex1} label={T.validerAjout} onPress={validerAjout} />
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      <ConfirmModal
        visible={!!aSupprimer}
        title={T.supprimer}
        message={aSupprimer?.nom ?? ''}
        confirmLabel={TEXTES.commun.general.supprimer}
        onCancel={() => setASupprimer(null)}
        onConfirm={supprimer}
      />
    </Screen>
  );
}
