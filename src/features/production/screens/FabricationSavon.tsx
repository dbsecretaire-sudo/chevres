import { useEffect, useMemo, useState } from 'react';
import { Alert, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen } from '@/shared/components/Screen';
import { Button } from '@/shared/components/Button';
import { DateField } from '@/shared/components/DateField';
import { FormField } from '@/shared/components/FormField';
import { SectionForm } from '@/shared/components/SectionForm';
import { SelectField } from '@/shared/components/SelectField';
import { NomModal } from '@/features/dossiers/components/NomModal';
import { useEtablissement } from '@/features/etablissements/context/EtablissementContext';
import { ChampRecette } from '@/features/production/components/ChampRecette';
import { ChampIngredientsPlat } from '@/features/production/components/ChampIngredientsPlat';
import {
  ingredientsProposables,
  lotsPrisPourIngredient,
  type SaisieIngredient,
} from '@/features/production/services/ingredientsPlat';
import { lireArchiveStock } from '@/features/stock/repository';
import { derniereBoucle } from '@/features/stock/services/boucles';
import { dossierEnRegle } from '@/features/stock/services/dossiersSavons';
import {
  articlesDuProduit,
  erreurFabrication,
  fabriquerSavons,
  numeroDeLot,
} from '@/features/stock/services/lots';
import { ajouterArticle } from '@/features/stock/services/stock';
import type { ArchiveStock } from '@/features/stock/types';
import { GENRE_ARTICLE, JOURS_DE_CURE_SAVON, PRODUIT_A_LOTS } from '@/shared/constants/stock';
import { useAjoutTabBarBleu } from '@/shared/hooks/useAjoutTabBarBleu';
import { AccentColorProvider } from '@/shared/theme/AccentColorContext';
import { colors } from '@/shared/theme/colors';
import { commonStyles } from '@/shared/styles/commonStyles';
import { TEXTES } from '@/shared/textes';
import { ajouterJours } from '@/shared/utils/calendrier';
import { todayISO } from '@/shared/utils/dates';
import { parseDecimal } from '@/shared/utils/nombres';

const T = TEXTES.production.fabricationSavon;
/** La valeur du choix « + Nouveau savon… » dans la liste des savons. */
const NOUVEAU = '__nouveau__';

/**
 * La fabrication de savons au lait de chèvre : le savon, la date, le nombre de pains et le numéro de leur premier lot, le lait de chèvre pris dans le stock de lait,
 * le jour de la saponification et la fin de la cure (6 semaines d'office), la durabilité, puis les autres ingrédients du stock (huiles, soude…) qui en sortent. Un lot
 * par pain entre au stock ; chacun garde de quoi il est fait. Ses lots ne se vendent qu'après la cure et une fois le dossier réglementaire du savon en règle.
 */
export default function FabricationSavon() {
  useAjoutTabBarBleu();
  const router = useRouter();
  const { espece } = useEtablissement();
  const [archive, setArchive] = useState<ArchiveStock | null>(null);
  const [article, setArticle] = useState('');
  const [date, setDate] = useState(todayISO());
  const [quantite, setQuantite] = useState('');
  const [premierSaisi, setPremierSaisi] = useState<string | null>(null);
  const [litres, setLitres] = useState('');
  /** La saponification suit la date de fabrication, et la fin de cure la saponification, tant qu'on ne les a pas changées. */
  const [saponificationSaisie, setSaponificationSaisie] = useState<string | null>(null);
  const [finCureSaisie, setFinCureSaisie] = useState<string | null>(null);
  const [ddm, setDdm] = useState('');
  const [ingredients, setIngredients] = useState<SaisieIngredient[]>([]);
  const [nouveauOuvert, setNouveauOuvert] = useState(false);
  const [enregistrement, setEnregistrement] = useState(false);

  const charger = (choisir?: string) =>
    lireArchiveStock().then((a) => {
      setArchive(a);
      setArticle(
        (deja) => choisir ?? (deja || articlesDuProduit(PRODUIT_A_LOTS.SAVON, a, espece)[0]?.cle || ''),
      );
    });
  useEffect(() => {
    charger().catch(() => undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [espece]);

  const savons = useMemo(
    () => (archive ? articlesDuProduit(PRODUIT_A_LOTS.SAVON, archive, espece) : []),
    [archive, espece],
  );
  const proposables = useMemo(
    () =>
      archive
        ? ingredientsProposables(
            archive,
            {
              fromages: T.ingredients.groupeFromages,
              charcuterie: T.ingredients.groupeCharcuterie,
              autres: T.ingredients.groupeAutres,
            },
            { listesSeulement: true },
          )
        : [],
    [archive],
  );

  const premier = premierSaisi ?? (archive && article && date ? numeroDeLot(archive, article, date) : '');
  const nombre = Math.round(Number(quantite) || 0);
  const dernier = nombre > 0 && premier ? derniereBoucle(premier, nombre) : undefined;
  const saponification = saponificationSaisie ?? date;
  const finCure = finCureSaisie ?? ajouterJours(saponification, JOURS_DE_CURE_SAVON);

  const creerSavon = async (nom: string) => {
    setNouveauOuvert(false);
    if (!nom.trim()) return;
    const cle = await ajouterArticle(GENRE_ARTICLE.SAVON, nom);
    setPremierSaisi(null);
    await charger(cle);
  };

  const fabriquer = async () => {
    if (!archive) return;
    if (!article) return Alert.alert(T.erreurSavon);
    const erreur = erreurFabrication(archive, article, premier, nombre);
    if (erreur) return Alert.alert(erreur);
    const utilises = ingredients
      .map((i) => ({ i, q: parseDecimal(i.quantite) }))
      .filter(({ i, q }) => i.article && q > 0)
      .map(({ i, q }) => ({
        article: i.article,
        quantite: q,
        lotIds: lotsPrisPourIngredient(archive, i, q),
      }));
    // Jamais plus de lots que de quantité entière.
    const trop = utilises.find((u) => u.lotIds.length > Math.max(0, Math.floor(u.quantite)));
    if (trop) return Alert.alert(T.ingredients.tropDeLots(Math.max(0, Math.floor(trop.quantite))));
    setEnregistrement(true);
    try {
      await fabriquerSavons({
        article,
        date,
        quantite: nombre,
        debut: premier,
        litresLait: parseDecimal(litres) || undefined,
        dateSaponification: saponification,
        finCure,
        ddm: ddm || undefined,
        ingredients: utilises,
      });
      // Le savon est fabriqué ; on prévient s'il ne pourra pas se vendre tant que son dossier n'est pas en règle.
      if (!dossierEnRegle(archive, article)) Alert.alert(T.dossierIncomplet);
      router.back();
    } catch (e: unknown) {
      Alert.alert(e instanceof Error ? e.message : '');
    } finally {
      setEnregistrement(false);
    }
  };

  return (
    <AccentColorProvider color={colors.ajout} softColor={colors.ajoutBadgeBg}>
      <Screen>
        <SelectField<string>
          label={T.type}
          required
          value={article}
          placeholder={T.aucunSavon}
          onChange={(v) => {
            if (v === NOUVEAU) return setNouveauOuvert(true);
            setArticle(v);
            setPremierSaisi(null);
          }}
          options={[
            ...savons.map((a) => ({ value: a.cle, label: a.libelle })),
            { value: NOUVEAU, label: T.nouveau },
          ]}
        />
        <DateField
          label={T.date}
          required
          value={date}
          onChange={(d) => {
            setDate(d);
            setPremierSaisi(null);
          }}
        />
        <FormField
          label={T.quantite}
          required
          value={quantite}
          onChangeText={(v) => /^\d*$/.test(v) && setQuantite(v)}
          keyboardType="number-pad"
        />
        <FormField
          label={T.premier}
          required
          explication={TEXTES.production.fabrication.explicationNumero}
          value={premier}
          onChangeText={(v) => setPremierSaisi(v.trim())}
        />
        <Text style={commonStyles.note}>{dernier ? T.dernier(dernier) : T.premierAide}</Text>
        <FormField
          label={T.lait}
          value={litres}
          onChangeText={(v) => /^\d*[.,]?\d*$/.test(v) && setLitres(v)}
          keyboardType="decimal-pad"
        />
        <Text style={commonStyles.note}>{T.laitAide}</Text>
        <DateField label={T.saponification} value={saponification} onChange={setSaponificationSaisie} />
        <Text style={commonStyles.note}>{T.saponificationAide}</Text>
        <DateField label={T.finCure} value={finCure} onChange={setFinCureSaisie} />
        <Text style={commonStyles.note}>{T.finCureAide}</Text>
        <DateField label={T.ddm} value={ddm} onChange={setDdm} />
        <Text style={commonStyles.note}>{T.ddmAide}</Text>
        <SectionForm titre={TEXTES.production.recettes.sectionTitre} aide={TEXTES.production.recettes.sectionAide}>
          <ChampRecette
            produit={PRODUIT_A_LOTS.SAVON}
            archive={archive}
            ingredients={ingredients}
            quantite={quantite}
            litres={litres}
            joursCure={Math.round((Date.parse(finCure) - Date.parse(saponification)) / 86_400_000)}
            onChange={() => charger()}
            onAppliquer={(r) => {
              setIngredients(
                r.ingredients.map((i, rang) => ({
                  cle: `r${rang}-${i.article}`,
                  article: i.article,
                  quantite: String(i.quantite).replace('.', ','),
                })),
              );
              if (r.quantite) setQuantite(String(r.quantite));
              if (r.litresLait) setLitres(String(r.litresLait).replace('.', ','));
              if (r.joursCure) setFinCureSaisie(ajouterJours(saponification, r.joursCure));
            }}
          />
        </SectionForm>
        <SectionForm titre={T.ingredients.titre} aide={T.ingredients.aide}>
          <ChampIngredientsPlat
            valeur={ingredients}
            onChange={setIngredients}
            archive={archive}
            proposables={proposables}
          />
        </SectionForm>
        <Button label={T.enregistrer} onPress={fabriquer} loading={enregistrement} />
      </Screen>
      <NomModal
        visible={nouveauOuvert}
        titre={T.nouveauTitre}
        placeholder={T.nomDuSavon}
        onValider={creerSavon}
        onAnnuler={() => setNouveauOuvert(false)}
      />
    </AccentColorProvider>
  );
}
