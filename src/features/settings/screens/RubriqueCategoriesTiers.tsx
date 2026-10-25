import { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '@/shared/components/Screen';
import { Fab } from '@/shared/components/Fab';
import { TableauCategories } from '@/features/settings/components/TableauCategories';
import { useDispositionComptable } from '@/shared/hooks/useDispositionComptable';
import { ChampRecherche } from '@/shared/components/ChampRecherche';
import { listFournisseurs } from '@/features/fournisseurs/repository';
import { contientTexte } from '@/shared/utils/recherche';
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
  sansAnciennesInutilisees,
  depensesDeLaCategorie,
  offertAffiche,
  pasPayeeAffichee,
  sansFactureAffichee,
  type CategorieFournisseurReglage,
} from '@/shared/dictionnaire/categoriesFournisseur';
import { comparerAlphabetique } from '@/shared/utils/personne';
import { ChoixOperations } from '@/features/contacts/components/ChoixOperations';
import {
  depensesDesOperations,
  lireRubriquesDOperations,
  estPermiseEnDepense,
  operationsDesDepenses,
  sensDansLesDepenses,
  type RubriqueOperations,
} from '@/features/contacts/services/operationsInventaire';
import { CATEGORIE_DEPENSE } from '@/shared/constants/comptabilite';
import { useEnregistrementAuto } from '@/shared/hooks/useEnregistrementAuto';
import { colors } from '@/shared/theme/colors';
import { generateId } from '@/shared/utils/id';
import { styles } from '@/shared/styles/exploitation/InformationsExploitation.styles';
import { commonStyles } from '@/shared/styles/commonStyles';
import { TEXTES } from '@/shared/textes';
import { LABEL_CATEGORIE_DEPENSE } from '@/shared/textes/libelles';

const T = TEXTES.fournisseurs.categories;

/** Les dépenses qui ouvrent une liste de l'inventaire (un achat d'animaux, d'aliments, de fournitures) : elles se règlent par les opérations. */
const DEPENSES_A_LISTE: readonly string[] = [
  CATEGORIE_DEPENSE.ALIMENTATION,
  CATEGORIE_DEPENSE.PRODUCTION,
  CATEGORIE_DEPENSE.ANIMAUX_VIVANTS,
  CATEGORIE_DEPENSE.ANIMAUX_VIVANTS_VENTE,
];
/** Les catégories dans l'ordre alphabétique de leur nom (l'ordre enregistré ne change pas). */const parNom = <C extends { nom: string }>(liste: C[]): C[] => [...liste].sort((a, b) => comparerAlphabetique(a.nom, b.nom));

/**
 * Organisation › Clients et fournisseurs › Catégories de tiers : la liste proposée dans la fiche d'un fournisseur. Chaque catégorie se
 * renomme d'un crayon, se retire (sauf celles dont l'application a besoin) et règle les dépenses que ses fournisseurs peuvent avoir :
 * un vétérinaire n'a que la dépense vétérinaire. Toutes sont enroulées, une seule se déroule à la fois ; tout s'enregistre tout seul.
 */
export default function RubriqueCategoriesTiers() {
  const { settings, loaded, patchSettings } = useAppSettings();
  const infos = settings.exploitation;
  const comptable = useDispositionComptable();

  const [categories, setCategories] = useState<CategorieFournisseurReglage[]>(
    () => infos?.categoriesFournisseur ?? categoriesFournisseurParDefaut(),
  );
  const [renommage, setRenommage] = useState<string | null>(null);
  const [ajoutOuvert, setAjoutOuvert] = useState(false);
  const [aRetirer, setARetirer] = useState<string | null>(null);
  /** La rubrique d'une catégorie déroulée (« id:affichage » ou « id:depenses ») : toutes sont repliées au départ, une seule à la fois. */
  const [sousOuverte, setSousOuverte] = useState<string | null>(null);
  /** La catégorie déroulée (une seule à la fois) : toutes sont enroulées au départ. */
  const [ouverte, setOuverte] = useState<string | null>(null);
  /** La vue : chaque catégorie et ses options (d'office), ou chaque option et les catégories qui l'appliquent. */
  const [parOption, setParOption] = useState(false);
  /** Ce qu'on cherche dans les catégories (leur nom) : la liste ne garde que celles qui le contiennent. */
  const [recherche, setRecherche] = useState('');
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

  /** Les rubriques de l'inventaire et leurs listes : les opérations (vente, achat) se règlent liste par liste (élevage ; une entreprise garde sa liste). */
  const [rubriques, setRubriques] = useState<RubriqueOperations[]>([]);
  useEffect(() => {
    lireRubriquesDOperations().then(setRubriques).catch(() => undefined);
  }, []);
  /** Les catégories que portent les contacts : une ancienne catégorie ne se montre que si l'un d'eux l'a. */
  const [utilisees, setUtilisees] = useState<ReadonlySet<string>>(new Set());
  useEffect(() => {
    listFournisseurs()
      .then((tous) => setUtilisees(new Set(tous.map((f) => f.categorie).filter((c): c is string => !!c))))
      .catch(() => undefined);
  }, []);
  const parInventaire = rubriques.length > 0;
  /** Les opérations d'une catégorie : celles réglées, sinon celles que ses dépenses d'office ouvraient. */
  const operationsDe = (c: CategorieFournisseurReglage, permises: readonly string[]) =>
    c.operations ?? operationsDesDepenses(permises, rubriques);
  /** Les dépenses sans liste : celles réglées, sinon celles des dépenses d'office qui n'ouvrent pas une liste. */
  const autresDe = (c: CategorieFournisseurReglage, permises: readonly string[]) =>
    c.autresDepenses ?? permises.filter((d) => !DEPENSES_A_LISTE.includes(d));
  /** Une opération cochée ou décochée : les dépenses de la catégorie suivent (celles des listes, plus les autres). */
  const majOperations = (c: CategorieFournisseurReglage, permises: readonly string[], ops: string[]) => {
    const autres = autresDe(c, permises);
    maj(c.id, { operations: ops, autresDepenses: autres, depenses: [...new Set([...depensesDesOperations(ops.filter(estPermiseEnDepense)), ...autres])] });
  };
  const majAutres = (c: CategorieFournisseurReglage, permises: readonly string[], autres: string[]) => {
    const ops = operationsDe(c, permises);
    maj(c.id, { operations: ops, autresDepenses: autres, depenses: [...new Set([...depensesDesOperations(ops.filter(estPermiseEnDepense)), ...autres])] });
  };

  /** Le détail d'une catégorie (ses réglages) : sous son titre dans la liste, sous le tableau au poste de comptabilité. */
  const detailDe = (c: CategorieFournisseurReglage) => {
    // Sans réglage, un vétérinaire n'a que la dépense vétérinaire et les autres catégories les ont toutes.
    const permises = depensesDeLaCategorie(c) ?? depensesProposees;
    return (
            <Card>
              <View style={commonStyles.rowSpaceBetween}>
                <Text style={[commonStyles.cardTitle, commonStyles.flex1]}>{c.nom}</Text>
                <Pressable onPress={() => setRenommage(c.id)} hitSlop={8} accessibilityLabel={T.renommer}>
                  <Ionicons name="create-outline" size={24} color={colors.primary} />
                </Pressable>
              </View>
              <SectionDeroulante
                titre={T.affichage}
                accordeon
                ouverte={sousOuverte === `${c.id}:affichage`}
                onBasculer={() => setSousOuverte((a) => (a === `${c.id}:affichage` ? null : `${c.id}:affichage`))}
              >
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
              <Checkbox
                label={TEXTES.comptabilite.nouvelleEcriture.offertFournisseur}
                value={offertAffiche(c)}
                onChange={(offert) => maj(c.id, { offert })}
              />
              <Text style={commonStyles.note}>{T.aideAffichage}</Text>
              </SectionDeroulante>
              <SectionDeroulante
                titre={T.depensesResume(permises.filter((d) => (depensesProposees as readonly string[]).includes(d)).length, depensesProposees.length)}
                accordeon
                ouverte={sousOuverte === `${c.id}:depenses`}
                onBasculer={() => setSousOuverte((a) => (a === `${c.id}:depenses` ? null : `${c.id}:depenses`))}
              >
              {parInventaire ? (
                <>
                  <Text style={commonStyles.note}>{TEXTES.contacts.operations.aideAchats}</Text>
                  <ChoixOperations
                    rubriques={rubriques}
                    sens="achat"
                    sensPermis={sensDansLesDepenses}
                    valeur={operationsDe(c, permises)}
                    onChange={(ops) => majOperations(c, permises, ops)}
                  />
                  <Text style={commonStyles.lineSemiBold}>{TEXTES.contacts.operations.autresDepenses}</Text>
                  {depensesProposees
                    .filter((d) => !DEPENSES_A_LISTE.includes(d))
                    .map((d) => (
                      <Checkbox
                        key={d}
                        label={LABEL_CATEGORIE_DEPENSE[d]}
                        value={autresDe(c, permises).includes(d)}
                        onChange={(cochee) =>
                          majAutres(
                            c,
                            permises,
                            cochee ? [...autresDe(c, permises), d] : autresDe(c, permises).filter((x) => x !== d),
                          )
                        }
                      />
                    ))}
                </>
              ) : (
                depensesProposees.map((d) => (
                  <Checkbox
                    key={d}
                    label={LABEL_CATEGORIE_DEPENSE[d]}
                    value={permises.includes(d)}
                    onChange={(cochee) =>
                      maj(c.id, { depenses: cochee ? [...permises, d] : permises.filter((x) => x !== d) })
                    }
                  />
                ))
              )}
              <Text style={commonStyles.note}>{T.aideDepenses}</Text>
              </SectionDeroulante>
              {CATEGORIES_FOURNISSEUR_PROTEGEES.includes(c.id) ? (
                <Text style={commonStyles.note}>
                  {c.id === CATEGORIE_FOURNISSEUR_PAR_DEFAUT ? T.parDefaut : T.protegee}
                </Text>
              ) : (
                <Button variant="danger" label={T.supprimer} onPress={() => setARetirer(c.id)} />
              )}
            </Card>
    );
  };

  /** Les catégories qui correspondent à la recherche, par ordre alphabétique (sans l'ancienne catégorie « Groupement » quand aucun contact ne la porte). */
  const visibles = parNom(sansAnciennesInutilisees(categories, utilisees)).filter((c) => contientTexte(c.nom, recherche));

  return (
    <Screen>
      <Text style={styles.aide}>{T.aide}</Text>
      <ChoixVueCategories
        parOption={parOption}
        onChange={setParOption}
        libelleParCategorie={T.parCategorie}
        libelleParOption={T.parOption}
      />
      <ChampRecherche value={recherche} onChangeText={setRecherche} />
      {parOption ? <Text style={styles.aide}>{T.aideParOption}</Text> : null}
      {parOption ? (
        <ReglagesParOption
          categories={visibles}
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
                {
                  cle: 'offert',
                  titre: TEXTES.comptabilite.nouvelleEcriture.offertFournisseur,
                  coche: (id) => offertAffiche(categories.find((c) => c.id === id)),
                  definir: (id, offert) => maj(id, { offert }),
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
                  maj(id, {
                    depenses: cochee ? [...permises, d] : permises.filter((x) => x !== d),
                    operations: undefined,
                    autresDepenses: undefined,
                  });
                },
              })),
            },
          ]}
        />
      ) : null}
      {comptable && !parOption ? (
        <>
          <TableauCategories
            categories={visibles}
            cases={[
              { cle: 'pasPayee', titre: TEXTES.comptabilite.tresorerie.paiement.pasPayee, coche: (id) => pasPayeeAffichee(categories.find((c) => c.id === id)) },
              { cle: 'sansFacture', titre: TEXTES.comptabilite.nouvelleEcriture.depenseNonFacturee, coche: (id) => sansFactureAffichee(categories.find((c) => c.id === id)) },
              { cle: 'offert', titre: TEXTES.comptabilite.nouvelleEcriture.offertFournisseur, coche: (id) => offertAffiche(categories.find((c) => c.id === id)) },
            ]}
            resume={{ titre: T.depenses, texte: (id) => { const c = categories.find((x) => x.id === id); return c ? `${(depensesDeLaCategorie(c) ?? depensesProposees).filter((d) => (depensesProposees as readonly string[]).includes(d)).length} sur ${depensesProposees.length}` : ''; } }}
            renommer={{ libelle: T.renommer, onRenommer: setRenommage }}
            choisie={ouverte}
            onChoisir={(id) => setOuverte((actuelle) => (actuelle === id ? null : id))}
            vide={T.ajouter}
          />
          {(() => {
            const choisie = visibles.find((c) => c.id === ouverte);
            return choisie ? detailDe(choisie) : null;
          })()}
          <Fab options={[{ label: T.ajouter.replace(/^\+\s*/, ''), icon: 'add', onPress: () => setAjoutOuvert(true) }]} />
        </>
      ) : (
        <>
          {(parOption ? [] : visibles).map((c) => (
            <SectionDeroulante
              key={c.id}
              titre={c.nom}
              accordeon
              ouverte={ouverte === c.id}
              onBasculer={() => setOuverte((actuelle) => (actuelle === c.id ? null : c.id))}
            >
              {detailDe(c)}
            </SectionDeroulante>
          ))}
          {parOption ? null : <Button variant="secondary" label={T.ajouter} onPress={() => setAjoutOuvert(true)} />}
        </>
      )}
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
