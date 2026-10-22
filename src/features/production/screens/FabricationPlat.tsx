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
import { alerterSiStockInsuffisant } from '@/features/production/services/alerteStock';
import {
  ingredientsProposables,
  lotsPrisPourIngredient,
  type SaisieIngredient,
} from '@/features/production/services/ingredientsPlat';
import { lireArchiveStock } from '@/features/stock/repository';
import { derniereBoucle } from '@/features/stock/services/boucles';
import {
  articlesDuProduit,
  erreurFabrication,
  fabriquerPlats,
  numeroDeLot,
} from '@/features/stock/services/lots';
import { ajouterArticle } from '@/features/stock/services/stock';
import type { ArchiveStock } from '@/features/stock/types';
import { GENRE_ARTICLE, PRODUIT_A_LOTS } from '@/shared/constants/stock';
import { useAjoutTabBarBleu } from '@/shared/hooks/useAjoutTabBarBleu';
import { AccentColorProvider } from '@/shared/theme/AccentColorContext';
import { colors } from '@/shared/theme/colors';
import { commonStyles } from '@/shared/styles/commonStyles';
import { TEXTES } from '@/shared/textes';
import { todayISO } from '@/shared/utils/dates';
import { parseDecimal } from '@/shared/utils/nombres';

const T = TEXTES.production.fabricationPlat;
/** La valeur du choix « + Nouveau plat… » dans la liste des plats. */
const NOUVEAU = '__nouveau__';

/**
 * La fabrication de plats préparés (conserves, bocaux) : le plat, la date, le nombre de pièces et le numéro de leur premier lot, la stérilisation et la date de
 * durabilité minimale, puis les ingrédients du stock (avec leurs lots) qui en sortent. Un lot par pièce entre au stock ; chacun garde de quoi il est fait.
 */
export default function FabricationPlat() {
  useAjoutTabBarBleu();
  const router = useRouter();
  const { espece } = useEtablissement();
  const [archive, setArchive] = useState<ArchiveStock | null>(null);
  const [article, setArticle] = useState('');
  const [date, setDate] = useState(todayISO());
  const [quantite, setQuantite] = useState('');
  const [premierSaisi, setPremierSaisi] = useState<string | null>(null);
  /** La stérilisation suit la date de fabrication tant qu'on ne l'a pas changée. */
  const [sterilisationSaisie, setSterilisationSaisie] = useState<string | null>(null);
  const [ddm, setDdm] = useState('');
  const [ingredients, setIngredients] = useState<SaisieIngredient[]>([]);
  /** L'explicatif de la fabrication : celui d'une recette reprise, ou ce qu'on y note. */
  const [notes, setNotes] = useState('');
  const [nouveauOuvert, setNouveauOuvert] = useState(false);
  const [enregistrement, setEnregistrement] = useState(false);

  const charger = (choisir?: string) =>
    lireArchiveStock().then((a) => {
      setArchive(a);
      setArticle(
        (deja) => choisir ?? (deja || articlesDuProduit(PRODUIT_A_LOTS.PLAT, a, espece)[0]?.cle || ''),
      );
    });
  useEffect(() => {
    charger().catch(() => undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [espece]);

  const plats = useMemo(
    () => (archive ? articlesDuProduit(PRODUIT_A_LOTS.PLAT, archive, espece) : []),
    [archive, espece],
  );
  const proposables = useMemo(
    () =>
      archive
        ? ingredientsProposables(archive, {
            fromages: T.ingredients.groupeFromages,
            charcuterie: T.ingredients.groupeCharcuterie,
            autres: T.ingredients.groupeAutres,
          })
        : [],
    [archive],
  );

  const premier = premierSaisi ?? (archive && article && date ? numeroDeLot(archive, article, date) : '');
  const nombre = Math.round(Number(quantite) || 0);
  const dernier = nombre > 0 && premier ? derniereBoucle(premier, nombre) : undefined;
  const sterilisation = sterilisationSaisie ?? date;

  const creerPlat = async (nom: string) => {
    setNouveauOuvert(false);
    if (!nom.trim()) return;
    const cle = await ajouterArticle(GENRE_ARTICLE.PLAT, nom);
    setPremierSaisi(null);
    await charger(cle);
  };

  const fabriquer = async (confirme = false) => {
    if (!archive) return;
    if (!article) return Alert.alert(T.erreurPlat);
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
    if (!confirme && alerterSiStockInsuffisant(archive, utilises, () => fabriquer(true))) return;
    setEnregistrement(true);
    try {
      await fabriquerPlats({
        article,
        date,
        quantite: nombre,
        debut: premier,
        dateSterilisation: sterilisation,
        ddm: ddm || undefined,
        notes: notes || undefined,
        ingredients: utilises,
      });
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
          placeholder={T.aucunPlat}
          onChange={(v) => {
            if (v === NOUVEAU) return setNouveauOuvert(true);
            setArticle(v);
            setPremierSaisi(null);
          }}
          options={[
            ...plats.map((a) => ({ value: a.cle, label: a.libelle })),
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
        <DateField label={T.sterilisation} value={sterilisation} onChange={setSterilisationSaisie} />
        <Text style={commonStyles.note}>{T.sterilisationAide}</Text>
        <DateField label={T.ddm} value={ddm} onChange={setDdm} />
        <Text style={commonStyles.note}>{T.ddmAide}</Text>
        <SectionForm titre={TEXTES.production.recettes.sectionTitre} aide={TEXTES.production.recettes.sectionAide}>
          <ChampRecette
            produit={PRODUIT_A_LOTS.PLAT}
            article={article}
            notes={notes}
            archive={archive}
            ingredients={ingredients}
            quantite={quantite}
            onChange={() => charger()}
            onAppliquer={(r) => {
              if (r.notes) setNotes(r.notes);
              setIngredients(
                r.ingredients.map((i, rang) => ({
                  cle: `r${rang}-${i.article}`,
                  article: i.article,
                  quantite: String(i.quantite).replace('.', ','),
                })),
              );
              if (r.quantite) setQuantite(String(r.quantite));
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
        <FormField label={TEXTES.production.recettes.notes} value={notes} onChangeText={setNotes} multiline style={commonStyles.textarea} />
        <Button label={T.enregistrer} onPress={() => fabriquer()} loading={enregistrement} />
      </Screen>
      <NomModal
        visible={nouveauOuvert}
        titre={T.nouveauTitre}
        placeholder={T.nomDuPlat}
        onValider={creerPlat}
        onAnnuler={() => setNouveauOuvert(false)}
      />
    </AccentColorProvider>
  );
}
