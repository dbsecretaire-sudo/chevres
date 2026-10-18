import { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '@/shared/components/Screen';
import { Button } from '@/shared/components/Button';
import { Card } from '@/shared/components/Card';
import { Checkbox } from '@/shared/components/Checkbox';
import { ConfirmModal } from '@/shared/components/ConfirmModal';
import { NomModal } from '@/features/dossiers/components/NomModal';
import { useAppSettings } from '@/features/settings/context/AppSettingsContext';
import { CATEGORIE_CLIENT_PAR_DEFAUT, CATEGORIES_CLIENT_PROTEGEES } from '@/shared/constants/clients';
import {
  categoriesClientParDefaut,
  groupesRecetteDeLaCategorie,
  pasEncaisseeAffichee,
  type CategorieClientReglage,
} from '@/shared/dictionnaire/categoriesClient';
import { SectionDeroulante } from '@/shared/components/SectionDeroulante';
import { ChoixOperations } from '@/features/contacts/components/ChoixOperations';
import {
  groupesRecetteDesOperations,
  lireRubriquesDOperations,
  operationsDesRecettes,
  type RubriqueOperations,
} from '@/features/contacts/services/operationsInventaire';
import { modeEntreprise } from '@/shared/dictionnaire/entreprise';
import { GROUPE_RECETTE } from '@/shared/constants/comptabilite';
import { ChoixVueCategories } from '@/features/settings/components/ChoixVueCategories';
import { ReglagesParOption } from '@/features/settings/components/ReglagesParOption';
import { groupesRecetteProposes } from '@/features/comptabilite/utils/recettes';
import { LABEL_GROUPE_RECETTE } from '@/shared/textes/libelles';
import { comparerAlphabetique } from '@/shared/utils/personne';
import { useEnregistrementAuto } from '@/shared/hooks/useEnregistrementAuto';
import { colors } from '@/shared/theme/colors';
import { generateId } from '@/shared/utils/id';
import { styles } from '@/shared/styles/exploitation/InformationsExploitation.styles';
import { commonStyles } from '@/shared/styles/commonStyles';
import { TEXTES } from '@/shared/textes';

const T = TEXTES.clients.categories;

/** Les groupes de recette qui ouvrent une liste de l'inventaire (fromages, lait, œufs, animaux, boucherie) : ils se règlent par les opérations. */
const GROUPES_A_LISTE: readonly string[] = [
  GROUPE_RECETTE.FROMAGES,
  GROUPE_RECETTE.LAIT,
  GROUPE_RECETTE.OEUFS,
  GROUPE_RECETTE.VIANDE,
  GROUPE_RECETTE.BOUCHERIE,
];
/** Les catégories dans l'ordre alphabétique de leur nom (l'ordre enregistré ne change pas). */const parNom = <C extends { nom: string }>(liste: C[]): C[] => [...liste].sort((a, b) => comparerAlphabetique(a.nom, b.nom));

/**
 * Organisation › Clients et fournisseurs › Catégories de client : la liste proposée dans la fiche d'un client. Chaque catégorie se renomme
 * d'un crayon, se retire (sauf « Particulier », celle d'office) et règle ce qu'elle change dans les ventes : déclarée d'office ou non,
 * prix libre. On peut en ajouter. Tout s'enregistre tout seul.
 */
export default function RubriqueCategoriesClient() {
  const { settings, loaded, patchSettings } = useAppSettings();
  const infos = settings.exploitation;

  const [categories, setCategories] = useState<CategorieClientReglage[]>(
    () => infos?.categoriesClient ?? categoriesClientParDefaut(),
  );
  /** La catégorie qu'on renomme (son identifiant), ou rien. */
  const [renommage, setRenommage] = useState<string | null>(null);
  const [ajoutOuvert, setAjoutOuvert] = useState(false);
  /** La catégorie déroulée (une seule à la fois) : toutes sont enroulées au départ. */
  const [ouverte, setOuverte] = useState<string | null>(null);
  const groupesProposes = groupesRecetteProposes();
  const [aRetirer, setARetirer] = useState<string | null>(null);
  /** La vue : chaque catégorie et ses options (d'office), ou chaque option et les catégories qui l'appliquent. */
  const [parOption, setParOption] = useState(false);
  /** Les rubriques de l'inventaire et leurs listes : les opérations (vente, achat) se règlent liste par liste (élevage ; une entreprise garde sa liste). */
  const [rubriques, setRubriques] = useState<RubriqueOperations[]>([]);
  useEffect(() => {
    lireRubriquesDOperations().then(setRubriques).catch(() => undefined);
  }, []);
  const parInventaire = !modeEntreprise() && rubriques.length > 0;

  useEffect(() => {
    // Chargement initial unique depuis les réglages.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (loaded) setCategories(settings.exploitation?.categoriesClient ?? categoriesClientParDefaut());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded]);

  const enregistrer = async (): Promise<boolean> => {
    await patchSettings({ exploitation: { ...infos, categoriesClient: categories } });
    return true;
  };
  useEnregistrementAuto({ actif: loaded, signature: JSON.stringify(categories), enregistrer });

  const maj = (id: string, patch: Partial<CategorieClientReglage>) =>
    setCategories((liste) => liste.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  /** Les opérations d'une catégorie : celles réglées, sinon celles que ses recettes d'office ouvraient. */
  const operationsDe = (c: CategorieClientReglage, recettes: readonly string[]) =>
    c.operations ?? operationsDesRecettes(recettes, rubriques);
  /** Les recettes sans liste : celles réglées, sinon celles des recettes d'office qui n'ouvrent pas une liste. */
  const autresDe = (c: CategorieClientReglage, recettes: readonly string[]) =>
    c.autresRecettes ?? recettes.filter((g) => !GROUPES_A_LISTE.includes(g));
  /** Une opération cochée ou décochée : les recettes de la catégorie suivent (celles des listes, plus les autres). */
  const majOperations = (c: CategorieClientReglage, recettes: readonly string[], ops: string[]) => {
    const autres = autresDe(c, recettes);
    maj(c.id, { operations: ops, autresRecettes: autres, recettes: [...new Set([...groupesRecetteDesOperations(ops), ...autres])] });
  };
  const majAutres = (c: CategorieClientReglage, recettes: readonly string[], autres: string[]) => {
    const ops = operationsDe(c, recettes);
    maj(c.id, { operations: ops, autresRecettes: autres, recettes: [...new Set([...groupesRecetteDesOperations(ops), ...autres])] });
  };

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
          categories={parNom(categories)}
          groupes={[
            {
              titre: T.dansLesVentes,
              options: [
                {
                  cle: 'declaree',
                  titre: T.declaree,
                  coche: (id) => !!categories.find((c) => c.id === id)?.declaree,
                  definir: (id, declaree) => maj(id, { declaree }),
                },
                {
                  cle: 'prixLibre',
                  titre: T.prixLibre,
                  coche: (id) => !!categories.find((c) => c.id === id)?.prixLibre,
                  definir: (id, prixLibre) => maj(id, { prixLibre }),
                },
              ],
            },
            {
              titre: T.affichage,
              options: [
                {
                  cle: 'pasEncaissee',
                  titre: TEXTES.comptabilite.tresorerie.paiement.pasEncaissee,
                  coche: (id) => pasEncaisseeAffichee(categories.find((c) => c.id === id)),
                  definir: (id, pasEncaissee) => maj(id, { pasEncaissee }),
                },
              ],
            },
            {
              titre: T.recettes,
              options: groupesProposes.map((g) => ({
                cle: g,
                titre: LABEL_GROUPE_RECETTE[g],
                coche: (id) => {
                  const c = categories.find((x) => x.id === id);
                  return !!c && groupesRecetteDeLaCategorie(c).includes(g);
                },
                definir: (id, cochee) => {
                  const c = categories.find((x) => x.id === id);
                  if (!c) return;
                  const recettes = groupesRecetteDeLaCategorie(c);
                  maj(id, {
                    recettes: cochee ? [...recettes, g] : recettes.filter((x) => x !== g),
                    operations: undefined,
                    autresRecettes: undefined,
                  });
                },
              })),
            },
          ]}
        />
      ) : null}
      {(parOption ? [] : parNom(categories)).map((c) => {
        const recettes = groupesRecetteDeLaCategorie(c);
        return (
          <SectionDeroulante
            key={c.id}
            titre={c.nom}
            accordeon
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
              <Checkbox
                label={T.declaree}
                value={c.declaree}
                onChange={(declaree) => maj(c.id, { declaree })}
              />
              <Checkbox
                label={T.prixLibre}
                value={c.prixLibre}
                onChange={(prixLibre) => maj(c.id, { prixLibre })}
              />
              <Text style={commonStyles.lineSemiBold}>{T.affichage}</Text>
              <Checkbox
                label={TEXTES.comptabilite.tresorerie.paiement.pasEncaissee}
                value={pasEncaisseeAffichee(c)}
                onChange={(pasEncaissee) => maj(c.id, { pasEncaissee })}
              />
              <Text style={commonStyles.note}>{T.aideAffichage}</Text>
              {/* Les recettes que ses clients peuvent recevoir : l'aide n'est cochée que pour un organisme, d'office. */}
              <Text style={commonStyles.lineSemiBold}>{T.recettes}</Text>
              {parInventaire ? (
                <>
                  <Text style={commonStyles.note}>{TEXTES.contacts.operations.aide}</Text>
                  <ChoixOperations
                    rubriques={rubriques}
                    valeur={operationsDe(c, recettes)}
                    onChange={(ops) => majOperations(c, recettes, ops)}
                  />
                  <Text style={commonStyles.lineSemiBold}>{TEXTES.contacts.operations.autresRecettes}</Text>
                  {groupesProposes
                    .filter((g) => !GROUPES_A_LISTE.includes(g))
                    .map((g) => (
                      <Checkbox
                        key={g}
                        label={LABEL_GROUPE_RECETTE[g]}
                        value={autresDe(c, recettes).includes(g)}
                        onChange={(cochee) =>
                          majAutres(
                            c,
                            recettes,
                            cochee ? [...autresDe(c, recettes), g] : autresDe(c, recettes).filter((x) => x !== g),
                          )
                        }
                      />
                    ))}
                </>
              ) : (
                groupesProposes.map((g) => (
                  <Checkbox
                    key={g}
                    label={LABEL_GROUPE_RECETTE[g]}
                    value={recettes.includes(g)}
                    onChange={(cochee) =>
                      maj(c.id, {
                        recettes: cochee ? [...recettes, g] : recettes.filter((x) => x !== g),
                      })
                    }
                  />
                ))
              )}
              <Text style={commonStyles.note}>{T.aideRecettes}</Text>
              {CATEGORIES_CLIENT_PROTEGEES.includes(c.id) ? (
                <Text style={commonStyles.note}>
                  {c.id === CATEGORIE_CLIENT_PAR_DEFAUT ? T.parDefaut : T.protegee}
                </Text>
              ) : (
                <Button variant="danger" label={T.supprimer} onPress={() => setARetirer(c.id)} />
              )}
            </Card>
          </SectionDeroulante>
        );
      })}
      {parOption ? null : <Button variant="secondary" label={T.ajouter} onPress={() => setAjoutOuvert(true)} />}

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
          setCategories((liste) => [...liste, { id: generateId(), nom, declaree: true, prixLibre: false }]);
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
