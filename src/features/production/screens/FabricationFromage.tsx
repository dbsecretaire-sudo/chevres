import { useEffect, useMemo, useState } from 'react';
import { Alert, Text } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Screen } from '@/shared/components/Screen';
import { SectionForm } from '@/shared/components/SectionForm';
import { ChampIngredientsPlat } from '@/features/production/components/ChampIngredientsPlat';
import { ChampRecette } from '@/features/production/components/ChampRecette';
import { alerterSiStockInsuffisant } from '@/features/production/services/alerteStock';
import {
  ingredientsProposables,
  lotsPrisPourIngredient,
  type SaisieIngredient,
} from '@/features/production/services/ingredientsPlat';
import FabricationPlat from '@/features/production/screens/FabricationPlat';
import FabricationSavon from '@/features/production/screens/FabricationSavon';
import { Button } from '@/shared/components/Button';
import { DateField } from '@/shared/components/DateField';
import { FormField } from '@/shared/components/FormField';
import { SelectField } from '@/shared/components/SelectField';
import type { TypeLait } from '@/features/stock/services/dlc';
import { useEtablissement } from '@/features/etablissements/context/EtablissementContext';
import { exporterGuideLotsPdf } from '@/features/export/documents/guideLotsPdf';
import { lireArchiveStock } from '@/features/stock/repository';
import { derniereBoucle } from '@/features/stock/services/boucles';
import {
  articlesDuProduit,
  erreurFabrication,
  fabriquerFromages,
  numeroDeLot,
} from '@/features/stock/services/lots';
import { definirLitresParFromage } from '@/features/stock/services/stock';
import type { ArticleAffiche } from '@/features/stock/services/stock';
import type { ArchiveStock } from '@/features/stock/types';
import { PRODUIT_A_LOTS } from '@/shared/constants/stock';
import { useAjoutTabBarBleu } from '@/shared/hooks/useAjoutTabBarBleu';
import { colors } from '@/shared/theme/colors';
import { AccentColorProvider } from '@/shared/theme/AccentColorContext';
import { parseDecimal } from '@/shared/utils/nombres';
import { todayISO } from '@/shared/utils/dates';
import { commonStyles } from '@/shared/styles/commonStyles';
import { TEXTES } from '@/shared/textes';
import { retournerALaPageDAvant } from '@/shared/navigation/retourAvant';

/**
 * La fabrication de fromages ou de charcuterie (paramètre `produit`) : un lot par produit, numérotés à la suite du premier, qui
 * entrent au stock (avec les litres de lait pour un fromage).
 */
export default function FabricationFromage() {
  const { produit } = useLocalSearchParams<{ produit?: string }>();
  // Les plats préparés ont leur propre écran (leurs ingrédients, leur stérilisation) : l'adresse est la même, avec `produit=plat`.
  if (produit === PRODUIT_A_LOTS.SAVON) return <FabricationSavon />;
  return produit === PRODUIT_A_LOTS.PLAT ? <FabricationPlat /> : <FabricationDeLots />;
}

function FabricationDeLots() {
  useAjoutTabBarBleu();
  const router = useRouter();
  const { produit: param } = useLocalSearchParams<{ produit?: string }>();
  const produit = param === PRODUIT_A_LOTS.CHARCUTERIE ? PRODUIT_A_LOTS.CHARCUTERIE : PRODUIT_A_LOTS.FROMAGE;
  const fromage = produit === PRODUIT_A_LOTS.FROMAGE;
  const T = fromage ? TEXTES.production.fabrication : TEXTES.production.fabricationCharcuterie;
  const { espece } = useEtablissement();
  const [archive, setArchive] = useState<ArchiveStock | null>(null);
  const [articles, setArticles] = useState<ArticleAffiche[]>([]);
  const [article, setArticle] = useState('');
  const [date, setDate] = useState(todayISO());
  const [quantite, setQuantite] = useState('');
  /** Le numéro du premier lot tapé à la main (vide : celui qui est proposé d'après le produit et la date). */
  const [premierSaisi, setPremierSaisi] = useState<string | null>(null);
  /** Les litres de lait par fromage, demandés une seule fois quand l'inventaire ne les a pas encore. */
  const [litresSaisis, setLitresSaisis] = useState('');
  /** Un fromage : salé ou non, et son lait (la DLC en dépend) ; à préciser à chaque fabrication. */
  const [sale, setSale] = useState<'oui' | 'non' | ''>('');
  const [lait, setLait] = useState<TypeLait | ''>('');
  /** Ce qui sort du stock pour cette fabrication (présure, sel, ferments…) et l'explicatif de la recette. */
  const [ingredients, setIngredients] = useState<SaisieIngredient[]>([]);
  const [notes, setNotes] = useState('');
  const [enregistrement, setEnregistrement] = useState(false);

  useEffect(() => {
    lireArchiveStock().then((a) => {
      const proposes = articlesDuProduit(produit, a, espece);
      setArchive(a);
      setArticles(proposes);
      if (proposes[0]) setArticle(proposes[0].cle);
    });
  }, [espece, produit]);

  // Les ingrédients d'une fromagerie : la présure, le sel et les ferments, puis les articles des listes de l'inventaire.
  const proposables = useMemo(
    () =>
      archive
        ? ingredientsProposables(
            archive,
            {
              fromages: '',
              charcuterie: '',
              autres: TEXTES.production.fabricationPlat.ingredients.groupeAutres,
              fromagerie: TEXTES.production.recettes.groupeFromagerie,
              animaux: TEXTES.production.recettes.groupeAnimaux,
            },
            { fromagerie: true },
          )
        : [],
    [archive],
  );

  // Le numéro du premier lot se propose d'après le produit et la date (on peut le modifier ensuite).
  const premier = premierSaisi ?? (archive && article && date ? numeroDeLot(archive, article, date) : '');

  const choisirArticle = (cle: string) => {
    setArticle(cle);
    setPremierSaisi(null);
  };
  const changerDate = (nouvelle: string) => {
    setDate(nouvelle);
    setPremierSaisi(null);
  };

  const nombre = Math.round(Number(quantite) || 0);
  /** Les litres de lait par fromage : ceux de l'inventaire, sinon ceux qu'on vient d'indiquer. */
  const litresDeLInventaire = archive?.litresParFromage?.[article];
  const litresParFromage = litresDeLInventaire ?? parseDecimal(litresSaisis);
  const laitUtilise = Math.round(nombre * litresParFromage * 100) / 100;
  const dernier = nombre > 0 && premier ? derniereBoucle(premier, nombre) : undefined;

  const fabriquer = async (confirme = false) => {
    if (!archive) return;
    const erreur = erreurFabrication(archive, article, premier, nombre);
    if (erreur) return Alert.alert(erreur);
    if (fromage && (!sale || !lait)) return Alert.alert(TEXTES.production.fabrication.varianteRequise);
    // Le lait utilisé est une entrée de l'inventaire : il faut le dire pour un fromage.
    if (fromage && !(litresParFromage > 0)) return Alert.alert(TEXTES.production.fabrication.litresRequis);
    const utilises = ingredients
      .map((i) => ({ i, q: parseDecimal(i.quantite) }))
      .filter(({ i, q }) => i.article && q > 0)
      .map(({ i, q }) => ({ article: i.article, quantite: q, lotIds: lotsPrisPourIngredient(archive, i, q) }));
    if (!confirme && alerterSiStockInsuffisant(archive, utilises, () => fabriquer(true))) return;
    setEnregistrement(true);
    try {
      // Les litres par fromage indiqués ici sont gardés dans l'inventaire : on ne les redemande plus.
      if (fromage && litresDeLInventaire === undefined)
        await definirLitresParFromage(article, litresParFromage);
      await fabriquerFromages({
        article,
        date,
        quantite: nombre,
        debut: premier,
        litres: fromage ? laitUtilise : undefined,
        sale: fromage ? sale === 'oui' : undefined,
        lait: fromage && lait ? lait : undefined,
        ingredients: utilises,
        notes: notes || undefined,
      });
      retournerALaPageDAvant(router);
    } finally {
      setEnregistrement(false);
    }
  };

  return (
    <AccentColorProvider color={colors.ajout} softColor={colors.ajoutBadgeBg}>
      <Screen>
        <SelectField
          label={T.type}
          required
          value={article}
          onChange={choisirArticle}
          options={articles.map((a) => ({ value: a.cle, label: a.libelle }))}
        />
        {fromage ? (
          <>
            <SelectField
              label={TEXTES.production.fabrication.sale}
              required
              value={sale}
              onChange={(v) => setSale(v as 'oui' | 'non')}
              options={[
                { value: 'non', label: TEXTES.production.fabrication.non },
                { value: 'oui', label: TEXTES.production.fabrication.oui },
              ]}
            />
            <SelectField
              label={TEXTES.production.fabrication.lait}
              required
              value={lait}
              onChange={(v) => setLait(v as TypeLait)}
              options={[
                { value: 'cru', label: TEXTES.production.fabrication.laitCru },
                { value: 'pasteurise', label: TEXTES.production.fabrication.laitPasteurise },
                { value: 'uht', label: TEXTES.production.fabrication.laitUht },
              ]}
            />
          </>
        ) : null}
        <DateField label={T.date} required value={date} onChange={changerDate} />
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
        <Button
          variant="secondary"
          label={TEXTES.production.fabrication.guide}
          onPress={() => exporterGuideLotsPdf(espece)}
        />
        {fromage ? (
          litresDeLInventaire ? (
            nombre > 0 ? (
              <Text style={commonStyles.note}>
                {TEXTES.production.fabrication.laitUtilise(
                  nombre,
                  String(litresDeLInventaire).replace('.', ','),
                  String(laitUtilise).replace('.', ','),
                )}
              </Text>
            ) : null
          ) : (
            <>
              <FormField
                label={TEXTES.production.fabrication.litresParFromage}
                required
                value={litresSaisis}
                onChangeText={setLitresSaisis}
                keyboardType="decimal-pad"
                placeholder="0"
              />
              <Text style={commonStyles.note}>{TEXTES.production.fabrication.litresParFromageAide}</Text>
            </>
          )
        ) : null}
        <SectionForm titre={TEXTES.production.recettes.sectionTitre} aide={TEXTES.production.recettes.sectionAideFromagerie}>
          <ChampRecette
            produit={produit}
            article={article}
            notes={notes}
            archive={archive}
            ingredients={ingredients}
            quantite={quantite}
            onChange={() => lireArchiveStock().then(setArchive)}
            onAppliquer={(r) => {
              setIngredients(
                r.ingredients.map((i, rang) => ({
                  cle: `r${rang}-${i.article}`,
                  article: i.article,
                  quantite: String(i.quantite).replace('.', ','),
                })),
              );
              if (r.notes) setNotes(r.notes);
              if (r.quantite) setQuantite(String(r.quantite));
            }}
          />
        </SectionForm>
        <SectionForm titre={TEXTES.production.fabricationPlat.ingredients.titre} aide={TEXTES.production.recettes.ingredientsFromagerieAide}>
          <ChampIngredientsPlat valeur={ingredients} onChange={setIngredients} archive={archive} proposables={proposables} />
        </SectionForm>
        <FormField label={TEXTES.production.recettes.notes} value={notes} onChangeText={setNotes} multiline style={commonStyles.textarea} />
        <Button label={T.enregistrer} onPress={() => fabriquer()} loading={enregistrement} />
      </Screen>
    </AccentColorProvider>
  );
}
