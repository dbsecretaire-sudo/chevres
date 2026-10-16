import { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '@/shared/components/Screen';
import { Button } from '@/shared/components/Button';
import { Card } from '@/shared/components/Card';
import { Checkbox } from '@/shared/components/Checkbox';
import { ConfirmModal } from '@/shared/components/ConfirmModal';
import { SectionDeroulante } from '@/shared/components/SectionDeroulante';
import { ChoixVueCategories } from '@/features/settings/components/ChoixVueCategories';
import { ReglagesParOption } from '@/features/settings/components/ReglagesParOption';
import { NomModal } from '@/features/dossiers/components/NomModal';
import { useAppSettings } from '@/features/settings/context/AppSettingsContext';
import { categoriesDepenseDuMode } from '@/features/comptabilite/utils/categories';
import {
  CATEGORIE_FOURNISSEUR_PAR_DEFAUT,
  CATEGORIES_FOURNISSEUR_PROTEGEES,
} from '@/shared/constants/fournisseurs';
import {
  categoriesFournisseurManquantes,
  categoriesFournisseurParDefaut,
  depensesDeLaCategorie,
  pasPayeeAffichee,
  sansFactureAffichee,
  type CategorieFournisseurReglage,
} from '@/shared/dictionnaire/categoriesFournisseur';
import { useEnregistrementAuto } from '@/shared/hooks/useEnregistrementAuto';
import { colors } from '@/shared/theme/colors';
import { generateId } from '@/shared/utils/id';
import { styles } from '@/shared/styles/exploitation/InformationsExploitation.styles';
import { commonStyles } from '@/shared/styles/commonStyles';
import { TEXTES } from '@/shared/textes';
import { LABEL_CATEGORIE_DEPENSE } from '@/shared/textes/libelles';

const T = TEXTES.fournisseurs.categories;

/**
 * Organisation › Clients et fournisseurs › Catégories de tiers : la liste proposée dans la fiche d'un fournisseur. Chaque catégorie se
 * renomme d'un crayon, se retire (sauf celles dont l'application a besoin) et règle les dépenses que ses fournisseurs peuvent avoir :
 * un vétérinaire n'a que la dépense vétérinaire. Toutes sont enroulées, une seule se déroule à la fois ; tout s'enregistre tout seul.
 */
export default function RubriqueCategoriesTiers() {
  const { settings, loaded, patchSettings } = useAppSettings();
  const infos = settings.exploitation;

  const [categories, setCategories] = useState<CategorieFournisseurReglage[]>(
    () => infos?.categoriesFournisseur ?? categoriesFournisseurParDefaut(),
  );
  const [renommage, setRenommage] = useState<string | null>(null);
  const [ajoutOuvert, setAjoutOuvert] = useState(false);
  const [aRetirer, setARetirer] = useState<string | null>(null);
  /** La catégorie déroulée (une seule à la fois) : toutes sont enroulées au départ. */
  const [ouverte, setOuverte] = useState<string | null>(null);
  /** La vue : chaque catégorie et ses options (d'office), ou chaque option et les catégories qui l'appliquent. */
  const [parOption, setParOption] = useState(false);
  const depensesProposees = categoriesDepenseDuMode();
  const manquantes = categoriesFournisseurManquantes(categories);

  useEffect(() => {
    // Chargement initial unique depuis les réglages.
    if (!loaded) return;
    const choisies = settings.exploitation?.categoriesFournisseur ?? categoriesFournisseurParDefaut();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCategories(choisies);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded]);

  const enregistrer = async (): Promise<boolean> => {
    await patchSettings({ exploitation: { ...infos, categoriesFournisseur: categories } });
    return true;
  };
  useEnregistrementAuto({ actif: loaded, signature: JSON.stringify(categories), enregistrer });

  const maj = (id: string, patch: Partial<CategorieFournisseurReglage>) =>
    setCategories((liste) => liste.map((c) => (c.id === id ? { ...c, ...patch } : c)));

  return (
    <Screen>
      <Text style={styles.aide}>{T.aide}</Text>
      <ChoixVueCategories
        parOption={parOption}
        onChange={setParOption}
        libelleParCategorie={T.parCategorie}
        libelleParOption={T.parOption}
      />
      {parOption ? <Text style={styles.aide}>{T.aideParOption}</Text> : null}
      {parOption ? (
        <ReglagesParOption
          categories={categories}
          groupes={[
            {
              titre: T.affichage,
              options: [
                {
                  cle: 'pasPayee',
                  titre: TEXTES.comptabilite.tresorerie.paiement.pasPayee,
                  coche: (id) => pasPayeeAffichee(categories.find((c) => c.id === id)),
                  definir: (id, pasPayee) => maj(id, { pasPayee }),
                },
                {
                  cle: 'sansFacture',
                  titre: TEXTES.comptabilite.nouvelleEcriture.depenseNonFacturee,
                  coche: (id) => sansFactureAffichee(categories.find((c) => c.id === id)),
                  definir: (id, sansFacture) => maj(id, { sansFacture }),
                },
              ],
            },
            {
              titre: T.depenses,
              options: depensesProposees.map((d) => ({
                cle: d,
                titre: LABEL_CATEGORIE_DEPENSE[d],
                coche: (id) => {
                  const c = categories.find((x) => x.id === id);
                  return !!c && (depensesDeLaCategorie(c) ?? depensesProposees).includes(d);
                },
                definir: (id, cochee) => {
                  const c = categories.find((x) => x.id === id);
                  if (!c) return;
                  const permises = depensesDeLaCategorie(c) ?? depensesProposees;
                  maj(id, { depenses: cochee ? [...permises, d] : permises.filter((x) => x !== d) });
                },
              })),
            },
          ]}
        />
      ) : null}
      {(parOption ? [] : categories).map((c) => {
        // Sans réglage, un vétérinaire n'a que la dépense vétérinaire et les autres catégories les ont toutes.
        const permises = depensesDeLaCategorie(c) ?? depensesProposees;
        return (
          <SectionDeroulante
            key={c.id}
            titre={c.nom}
            ouverte={ouverte === c.id}
            onBasculer={() => setOuverte((actuelle) => (actuelle === c.id ? null : c.id))}
          >
            <Card>
              <View style={commonStyles.rowSpaceBetween}>
                <Text style={[commonStyles.cardTitle, commonStyles.flex1]}>{c.nom}</Text>
                <Pressable onPress={() => setRenommage(c.id)} hitSlop={8} accessibilityLabel={T.renommer}>
                  <Ionicons name="create-outline" size={24} color={colors.primary} />
                </Pressable>
              </View>
              <Text style={commonStyles.lineSemiBold}>{T.affichage}</Text>
              <Checkbox
                label={TEXTES.comptabilite.tresorerie.paiement.pasPayee}
                value={pasPayeeAffichee(c)}
                onChange={(pasPayee) => maj(c.id, { pasPayee })}
              />
              <Checkbox
                label={TEXTES.comptabilite.nouvelleEcriture.depenseNonFacturee}
                value={sansFactureAffichee(c)}
                onChange={(sansFacture) => maj(c.id, { sansFacture })}
              />
              <Text style={commonStyles.note}>{T.aideAffichage}</Text>
              <Text style={commonStyles.lineSemiBold}>{T.depenses}</Text>
              {depensesProposees.map((d) => (
                <Checkbox
                  key={d}
                  label={LABEL_CATEGORIE_DEPENSE[d]}
                  value={permises.includes(d)}
                  onChange={(cochee) =>
                    maj(c.id, { depenses: cochee ? [...permises, d] : permises.filter((x) => x !== d) })
                  }
                />
              ))}
              <Text style={commonStyles.note}>{T.aideDepenses}</Text>
              {CATEGORIES_FOURNISSEUR_PROTEGEES.includes(c.id) ? (
                <Text style={commonStyles.note}>
                  {c.id === CATEGORIE_FOURNISSEUR_PAR_DEFAUT ? T.parDefaut : T.protegee}
                </Text>
              ) : (
                <Button variant="danger" label={T.supprimer} onPress={() => setARetirer(c.id)} />
              )}
            </Card>
          </SectionDeroulante>
        );
      })}
      {parOption ? null : <Button variant="secondary" label={T.ajouter} onPress={() => setAjoutOuvert(true)} />}
      {/* Une liste enregistrée avant l'arrivée de nouvelles catégories d'office : un bouton les ajoute, sans toucher aux vôtres. */}
      {manquantes.length > 0 ? (
        <Button
          variant="secondary"
          label={T.ajouterManquantes(manquantes.length)}
          onPress={() => setCategories((liste) => [...liste, ...manquantes])}
        />
      ) : null}

      <NomModal
        visible={!!renommage}
        titre={T.renommer}
        valeurInitiale={categories.find((c) => c.id === renommage)?.nom ?? ''}
        placeholder={T.exempleNom}
        onValider={(nom) => {
          if (renommage) maj(renommage, { nom });
          setRenommage(null);
        }}
        onAnnuler={() => setRenommage(null)}
      />
      <NomModal
        visible={ajoutOuvert}
        titre={T.nomCategorie}
        placeholder={T.exempleNom}
        onValider={(nom) => {
          setCategories((liste) => [...liste, { id: generateId(), nom }]);
          setAjoutOuvert(false);
        }}
        onAnnuler={() => setAjoutOuvert(false)}
      />
      <ConfirmModal
        visible={!!aRetirer}
        title={T.supprimerQuestion}
        message={T.supprimerMessage}
        confirmLabel={TEXTES.commun.general.supprimer}
        onCancel={() => setARetirer(null)}
        onConfirm={() => {
          setCategories((liste) => liste.filter((c) => c.id !== aRetirer));
          setARetirer(null);
        }}
      />
    </Screen>
  );
}
