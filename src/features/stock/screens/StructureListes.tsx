import { useCallback, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useFocusEffect, useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '@/shared/components/Button';
import { Card } from '@/shared/components/Card';
import { ConfirmModal } from '@/shared/components/ConfirmModal';
import { Screen } from '@/shared/components/Screen';
import { SelectFieldEditable } from '@/shared/components/SelectFieldEditable';
import { NomModal } from '@/features/dossiers/components/NomModal';
import { lireArchiveStock } from '@/features/stock/repository';
import {
  ajouterListe,
  comptesAutorises,
  renommerListe,
  supprimerListe,
} from '@/features/stock/services/structure';
import type { ListeInventaire } from '@/features/stock/types';
import {
  CATEGORIES,
  CATEGORIES_GITE,
  SECTIONS,
  SECTIONS_GITE,
  type Categorie,
} from '@/features/stock/utils/categories';
import { ACTIVITE_SOCIETE } from '@/shared/constants/etablissements';
import { activitesEtablissement, modeEntreprise } from '@/shared/dictionnaire/entreprise';
import {
  COMPTE_PAR_SECTION_INVENTAIRE,
  COMPTE_PAR_SECTION_INVENTAIRE_GITE,
  type CompteComptable,
} from '@/shared/constants/planComptable';
import { ROUTES } from '@/shared/constants/routes';
import { CLASSE_INVENTAIRE, PREFIXES_COMPTE_PAR_CATEGORIE } from '@/shared/constants/stock';
import { colors } from '@/shared/theme/colors';
import { commonStyles } from '@/shared/styles/commonStyles';
import { TEXTES } from '@/shared/textes';

const T = TEXTES.stock;

/**
 * La structure des listes de l'inventaire : pour chaque catégorie (35. Produits finis, 31. Matières premières…), ses listes
 * d'office, puis celles que l'utilisateur ajoute. Une liste ajoutée correspond impérativement à un compte du plan comptable :
 * seuls les comptes de 6 chiffres que la catégorie autorise (par exemple 701… pour les produits finis) sont proposés.
 */
export default function StructureListes() {
  const router = useRouter();
  const navigation = useNavigation();
  /** Au retour des comptes du plan comptable : la catégorie dont on créait une liste (la fenêtre d'ajout se rouvre). */
  const { ajout: ajoutDemande } = useLocalSearchParams<{ ajout?: string }>();
  const [listes, setListes] = useState<ListeInventaire[]>([]);
  /** La catégorie à laquelle on ajoute une liste (la fenêtre d'ajout est fermée quand elle est absente). */
  const [ajout, setAjout] = useState<Categorie | null>(null);
  /** Les comptes que la catégorie de l'ajout autorise, et celui qui est choisi. */
  const [comptes, setComptes] = useState<CompteComptable[]>([]);
  const [compteChoisi, setCompteChoisi] = useState('');
  const [renomme, setRenomme] = useState<ListeInventaire | null>(null);
  const [aSupprimer, setASupprimer] = useState<ListeInventaire | null>(null);

  /** Un gîte a ses propres catégories (marchandises, autres approvisionnements, immobilisations) et ses listes d'office. */
  const gite = modeEntreprise() && activitesEtablissement().includes(ACTIVITE_SOCIETE.ASSOCIATION);
  const categories = gite ? CATEGORIES_GITE : CATEGORIES;
  const listesDOffice = (categorie: Categorie) =>
    gite
      ? SECTIONS_GITE.filter((x) => x.categorie === categorie).map((x) => ({
          cle: x.section,
          titre: x.titre,
          compte: COMPTE_PAR_SECTION_INVENTAIRE_GITE[x.section],
        }))
      : SECTIONS.filter((x) => x.categorie === categorie).map((x) => ({
          cle: x.section,
          titre: x.titre,
          compte: COMPTE_PAR_SECTION_INVENTAIRE[x.section],
        }));

  const charger = useCallback(async () => setListes((await lireArchiveStock()).listes ?? []), []);

  useFocusEffect(
    useCallback(() => {
      charger();
    }, [charger]),
  );

  const ouvrirAjout = async (categorie: Categorie) => {
    const autorises = await comptesAutorises(categorie);
    setComptes(autorises);
    setCompteChoisi(autorises[0]?.numero ?? '');
    setAjout(categorie);
  };

  // Au retour des comptes du plan comptable, la fenêtre d'ajout de la liste se rouvre (avec les comptes à jour).
  useFocusEffect(
    useCallback(() => {
      const categorie = categories.find((c) => c.categorie === ajoutDemande)?.categorie;
      if (!categorie) return;
      comptesAutorises(categorie).then((autorises) => {
        setComptes(autorises);
        setCompteChoisi(autorises[0]?.numero ?? '');
        setAjout(categorie);
      });
      navigation.setParams({ ajout: undefined } as never);
    }, [ajoutDemande, navigation, categories]),
  );

  const creer = async (nom: string) => {
    const compte = comptes.find((c) => c.numero === compteChoisi);
    if (ajout && compte) await ajouterListe(ajout, nom, compte);
    setAjout(null);
    charger();
  };

  const retirer = async () => {
    if (aSupprimer) await supprimerListe(aSupprimer.id);
    setASupprimer(null);
    charger();
  };

  return (
    <Screen>
      <Text style={commonStyles.muted}>{T.structure.aide}</Text>

      {categories.map(({ categorie, nom }) => (
        <Card key={categorie} style={commonStyles.gap10}>
          <Text style={commonStyles.cardTitle}>{T.enteteCategorie(CLASSE_INVENTAIRE[categorie], nom)}</Text>
          <Text style={commonStyles.note}>
            {T.structure.comptesAutorises(PREFIXES_COMPTE_PAR_CATEGORIE[categorie].join(', '))}
          </Text>

          <Text style={commonStyles.lineSemiBold}>{T.structure.listesDOffice}</Text>
          {listesDOffice(categorie).map(({ cle, titre, compte }) => (
            <Text key={cle} style={commonStyles.muted}>
              {titre} · {T.compte(compte.numero, compte.libelle)}
            </Text>
          ))}

          {listes
            .filter((l) => l.categorie === categorie)
            .map((l) => (
              <View key={l.id} style={commonStyles.rowSpaceBetween}>
                <View style={commonStyles.flex1}>
                  <Text style={commonStyles.lineBold}>{l.nom}</Text>
                  <Text style={commonStyles.note}>{T.compte(l.compte, l.libelleCompte)}</Text>
                </View>
                <View style={commonStyles.headerDroite}>
                  <Pressable
                    onPress={() => setRenomme(l)}
                    hitSlop={8}
                    accessibilityLabel={T.structure.renommer}
                  >
                    <Ionicons name="pencil" size={20} color={colors.primary} />
                  </Pressable>
                  <Pressable
                    onPress={() => setASupprimer(l)}
                    hitSlop={8}
                    accessibilityLabel={T.structure.supprimerListe}
                  >
                    <Ionicons name="trash" size={20} color={colors.danger} />
                  </Pressable>
                </View>
              </View>
            ))}

          <Button
            variant="secondary"
            label={T.structure.ajouterListe}
            onPress={() => ouvrirAjout(categorie)}
          />
        </Card>
      ))}

      <NomModal
        visible={!!ajout}
        titre={T.structure.ajouterListe}
        placeholder={T.structure.exempleNomListe}
        onValider={creer}
        onAnnuler={() => setAjout(null)}
        enfants={
          comptes.length > 0 ? (
            <SelectFieldEditable<string>
              label={T.structure.compte}
              searchable
              value={compteChoisi}
              onChange={setCompteChoisi}
              options={comptes.map((c) => ({ value: c.numero, label: T.compte(c.numero, c.libelle) }))}
              onEdit={() => {
                // On y va depuis la création d'une liste : la flèche de retour y ramène, la fenêtre rouverte.
                const categorie = ajout;
                setAjout(null);
                router.push(
                  ROUTES.comptesPcgDepuis(
                    `${ROUTES.STOCK_STRUCTURE}${categorie ? `?ajout=${categorie}` : ''}`,
                  ),
                );
              }}
            />
          ) : (
            <View style={commonStyles.gap6}>
              <Text style={commonStyles.required}>{T.structure.aucunCompte}</Text>
              <Button
                variant="secondary"
                label={T.structure.ajouterUnCompte}
                onPress={() => {
                  setAjout(null);
                  router.push(ROUTES.COMPTE_PCG_NOUVEAU);
                }}
              />
            </View>
          )
        }
      />
      <NomModal
        visible={!!renomme}
        titre={T.structure.renommer}
        valeurInitiale={renomme?.nom}
        onValider={async (nom) => {
          if (renomme) await renommerListe(renomme.id, nom);
          setRenomme(null);
          charger();
        }}
        onAnnuler={() => setRenomme(null)}
      />
      <ConfirmModal
        visible={!!aSupprimer}
        title={T.structure.supprimerTitre}
        message={T.structure.supprimerMessage(aSupprimer?.nom ?? '')}
        confirmLabel={TEXTES.commun.general.supprimer}
        onCancel={() => setASupprimer(null)}
        onConfirm={retirer}
      />
    </Screen>
  );
}
