import { useCallback, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '@/shared/components/Card';
import { FormField } from '@/shared/components/FormField';
import { SelectFieldEditable } from '@/shared/components/SelectFieldEditable';
import { useAdresseCourante } from '@/shared/hooks/useAdresseCourante';
import { lireArchiveStock } from '@/features/stock/repository';
import { derniereBoucle, estArticleBoucle, estBoucleNumerotee } from '@/features/stock/services/boucles';
import {
  ajouterArticle,
  articlesDeFournitures,
  articlesDuGenre,
  rubriquesDeFournitures,
  type ArticleAffiche,
} from '@/features/stock/services/stock';
import { NomModal } from '@/features/dossiers/components/NomModal';
import { GENRE_ARTICLE } from '@/shared/constants/stock';
import type { ArchiveStock, GenreArticle } from '@/features/stock/types';
import { SECTIONS } from '@/features/stock/utils/categories';
import {
  ligneProductionVide,
  type LigneProductionForm,
} from '@/features/comptabilite/forms/lignesProduction';
import { parseDecimal } from '@/shared/utils/nombres';
import { ROUTES } from '@/shared/constants/routes';
import { colors } from '@/shared/theme/colors';
import { commonStyles } from '@/shared/styles/commonStyles';
import { TEXTES } from '@/shared/textes';
import { BoutonCadeau } from '@/features/comptabilite/components/BoutonCadeau';

interface Props {
  lignes: LigneProductionForm[];
  onChange: (lignes: LigneProductionForm[]) => void;
  /** Seules les boucles d'identification sont proposées (les factures de la chambre d'agriculture). */
  seulementBoucles?: boolean;
  /** Le titre de la carte (par défaut : « Détail par fourniture »). */
  titre?: string;
  /** La dépense est offerte par le fournisseur : chaque fourniture a son bouton « Cadeau ». */
  offerte?: boolean;
}

const T = TEXTES.comptabilite.lignesProductionEditor;

/** Le début de la valeur de l'option « Nouvel article » d'une rubrique : la suite est le rang de la rubrique. */
const PREFIXE_AJOUT = 'ajout:';

/** Le titre de la catégorie d'un genre d'article (Emballages, Entretien…), sans le « Achat — » du titre de la liste. */
const groupeDuGenre = (genre: string): string | undefined =>
  SECTIONS.find((s) => s.genre === genre)?.titre.replace(/^(Achat|Ventes) — /, '');

/** La catégorie du stock d'une fourniture : le titre de sa liste (Emballages, Entretien…), ou le nom de la liste ajoutée qui la contient. */
function groupeDeLArticle(cle: string, archive: ArchiveStock): string | undefined {
  const [genre, id] = cle.split(':');
  if (genre === GENRE_ARTICLE.PERSONNALISE) {
    const listeId = archive.articles.find((a) => a.id === id)?.listeId;
    return (archive.listes ?? []).find((l) => l.id === listeId)?.nom;
  }
  return groupeDuGenre(genre);
}

/**
 * Carte « Détail par fourniture » (achat de production) : une facture peut regrouper plusieurs fournitures. Chacune se choisit
 * (avec recherche) dans la liste de l'inventaire — emballages, matériel, boucles… ; le crayon mène à l'inventaire et la liste s'y met
 * à jour. La quantité de chaque fourniture entre au stock ; le total de la facture est la somme des montants.
 */
export function LignesProductionEditor({ lignes, onChange, seulementBoucles, titre, offerte }: Props) {
  const router = useRouter();
  const retour = useAdresseCourante();
  const [articles, setArticles] = useState<(ArticleAffiche & { groupe?: string })[]>([]);
  /** Les rubriques de fournitures (même vides) : chacune propose « Nouvel article » pour y ajouter un article sans quitter la facture. */
  const [rubriques, setRubriques] = useState<{ genre: GenreArticle; listeId?: string; groupe: string }[]>([]);
  /** La rubrique où l'on ajoute un article, et la ligne de la facture qui le recevra. */
  const [ajout, setAjout] = useState<{ rubrique: number; ligne: string } | null>(null);

  // La liste est relue à chaque retour sur l'écran : ce qu'on vient d'ajouter à l'inventaire y apparaît.
  const charger = useCallback(async () => {
    const archive = await lireArchiveStock();
    setArticles(
      (seulementBoucles ? articlesDuGenre(GENRE_ARTICLE.BOUCLE, archive) : articlesDeFournitures(archive)).map((a) => ({
        ...a,
        groupe: groupeDeLArticle(a.cle, archive),
      })),
    );
    setRubriques(
      seulementBoucles
        ? []
        : rubriquesDeFournitures(archive).flatMap((r) => {
            const groupe = r.listeId
              ? (archive.listes ?? []).find((l) => l.id === r.listeId)?.nom
              : groupeDuGenre(r.genre);
            return groupe ? [{ ...r, groupe }] : [];
          }),
    );
  }, [seulementBoucles]);
  useFocusEffect(
    useCallback(() => {
      charger();
    }, [charger]),
  );

  const ajouter = async (nom: string) => {
    const rubrique = ajout ? rubriques[ajout.rubrique] : undefined;
    const ligne = ajout?.ligne;
    setAjout(null);
    if (!rubrique || !ligne) return;
    const cle = await ajouterArticle(rubrique.genre, nom, undefined, rubrique.listeId);
    await charger();
    onChange(lignes.map((l) => (l.key === ligne ? { ...l, article: cle } : l)));
  };

  const maj = (key: string, patch: Partial<LigneProductionForm>) =>
    onChange(lignes.map((l) => (l.key === key ? { ...l, ...patch } : l)));
  const supprimer = (key: string) =>
    onChange(lignes.length > 1 ? lignes.filter((l) => l.key !== key) : lignes);

  return (
    <>
    <Card style={commonStyles.gap10}>
      <View style={commonStyles.rowSpaceBetween}>
        <Text style={commonStyles.lineBold}>{titre ?? T.detailParFourniture}</Text>
        <Pressable
          style={commonStyles.boutonPastille}
          onPress={() => onChange([...lignes, ligneProductionVide()])}
        >
          <Ionicons name="add-circle" size={28} color={colors.ajout} />
        </Pressable>
      </View>

      {lignes.map((ligne, index) => {
        const boucles = estArticleBoucle(ligne.article);
        /** Une boucle rouge n'a pas de numéro à l'achat : seulement sa quantité. */
        const numerotee = estBoucleNumerotee(ligne.article);
        const quantite = parseDecimal(ligne.quantite);
        const dernier =
          numerotee && ligne.bouclesDebut && quantite
            ? derniereBoucle(ligne.bouclesDebut, quantite)
            : undefined;
        return (
          <View key={ligne.key} style={commonStyles.gap8}>
            <View style={commonStyles.rowSpaceBetween}>
              <Text style={commonStyles.lineSemiBold}>{T.fournitureValeur(index + 1)}</Text>
              {lignes.length > 1 ? (
                <Pressable style={commonStyles.boutonPastille} onPress={() => supprimer(ligne.key)}>
                  <Ionicons name="close-circle" size={28} color={colors.danger} />
                </Pressable>
              ) : null}
            </View>
            <View style={commonStyles.rowFin}>
              <View style={commonStyles.flex2}>
                <SelectFieldEditable<string>
                  label={T.fournitureValeur(index + 1)}
                  libelleCache
                  searchable
                  // D'abord les catégories du stock (emballages, entretien, équipement, matériel…), puis les articles de celle qu'on ouvre.
                  parCategories
                  placeholder={T.choixFourniture}
                  value={ligne.article}
                  onChange={(valeur) => {
                    // « Nouvel article » d'une rubrique : on demande son nom, puis il est choisi pour cette ligne.
                    if (valeur.startsWith(PREFIXE_AJOUT)) {
                      setAjout({ rubrique: Number(valeur.slice(PREFIXE_AJOUT.length)), ligne: ligne.key });
                      return;
                    }
                    maj(ligne.key, {
                      article: valeur,
                      ...(valeur ? {} : { quantite: '' }),
                      ...(estBoucleNumerotee(valeur) ? {} : { bouclesDebut: '' }),
                    });
                  }}
                  options={[
                    { value: '', label: T.horsStock },
                    ...articles.map((a) => ({ value: a.cle, label: a.libelle, groupe: a.groupe })),
                    ...rubriques.map((r, i) => ({ value: `${PREFIXE_AJOUT}${i}`, label: T.nouvelArticle, groupe: r.groupe })),
                  ]}
                  onEdit={() => router.push(ROUTES.stockDepuis(retour))}
                />
              </View>
              {ligne.article ? (
                <View style={commonStyles.flex1}>
                  <FormField
                    label={T.quantiteCourt}
                    value={ligne.quantite}
                    onChangeText={(v) => {
                      if (!(boucles ? /^\d*$/ : /^\d*[.,]?\d*$/).test(v)) return;
                      maj(ligne.key, { quantite: v });
                    }}
                    keyboardType={boucles ? 'number-pad' : 'decimal-pad'}
                    placeholder={T.ex100}
                  />
                </View>
              ) : null}
              <View style={commonStyles.flex1}>
                <FormField
                  label={T.montantTtcCourt}
                  value={ligne.montant}
                  onChangeText={(v) => maj(ligne.key, { montant: v })}
                  keyboardType="decimal-pad"
                  placeholder={T.ex120}
                />
              </View>
            </View>
            {/* Dépense offerte : le bouton « Cadeau » de la ligne (actif d'office : elle compte 0 € ; désactivé, elle est facturée). */}
            {offerte ? (
              <BoutonCadeau
                actif={ligne.offert !== false}
                onChange={(actif) => maj(ligne.key, { offert: actif ? undefined : false })}
                ligne={TEXTES.comptabilite.nouvelleEcriture.cadeauLigne}
              />
            ) : null}
            {numerotee ? (
              <>
                <FormField
                  label={T.premiereBoucle}
                  required
                  value={ligne.bouclesDebut}
                  onChangeText={(v) => maj(ligne.key, { bouclesDebut: v.trim() })}
                />
                <Text style={commonStyles.note}>
                  {dernier ? T.derniereBoucle(dernier) : T.premiereBoucleAide}
                </Text>
              </>
            ) : null}
          </View>
        );
      })}
    </Card>
    <NomModal
      visible={!!ajout}
      titre={ajout && rubriques[ajout.rubrique] ? T.nouvelArticleDans(rubriques[ajout.rubrique].groupe) : ''}
      placeholder={T.nomDuNouvelArticle}
      onValider={ajouter}
      onAnnuler={() => setAjout(null)}
    />
    </>
  );
}
