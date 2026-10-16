import { useCallback, useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { formatDateFR, formatMontant } from '@/shared/utils/dates';
import { parseDecimal } from '@/shared/utils/nombres';
import { useFocusEffect, useRouter } from 'expo-router';
import { ChampTauxImposition } from '@/features/comptabilite/components/ChampTauxImposition';
import { SelectFieldEditable } from '@/shared/components/SelectFieldEditable';
import { useAdresseCourante } from '@/shared/hooks/useAdresseCourante';
import { useNiveauxStock } from '@/features/stock/hooks/useNiveauxStock';
import { useViandesDuStock } from '@/features/stock/hooks/useViandesDuStock';
import { lireArchiveStock } from '@/features/stock/repository';
import {
  cleJeunes,
  prixDesOeufs,
  roleDeLaViande,
  type ArticleAffiche,
  type FiltreStock,
} from '@/features/stock/services/stock';
import { especeCourante, type EspeceAnimale } from '@/shared/dictionnaire/animaux';
import { ACTIVITE_COMMUNE } from '@/shared/constants/etablissements';
import { ROUTES } from '@/shared/constants/routes';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '@/shared/components/Card';
import { SelectModal } from '@/shared/components/SelectModal';
import { SelectModalMultiple } from '@/shared/components/SelectModalMultiple';
import { listToutesVentes } from '@/features/comptabilite/repository/ventes';
import { colors } from '@/shared/theme/colors';
import { estPetitLe, listAnimauxAbattusDe, listAnimauxVivantsDe } from '@/features/cheptel/repository/chevres';
import {
  joursAbattusAFacturer,
  libelleAnimalVendu,
  type JourAbattu,
} from '@/features/comptabilite/utils/animauxVendus';
import { ChampDateAbattoir } from '@/features/comptabilite/components/ChampDateAbattoir';
import { AvertissementDelais } from '@/features/exploitation/components/AvertissementDelais';
import { LotsVendusEdition } from '@/features/comptabilite/components/LotsVendusEdition';
import type { Chevre } from '@/features/cheptel/types';
import { poidsTotal } from '@/features/cheptel/utils/poids';
import { FormField } from '@/shared/components/FormField';
import { SelectField } from '@/shared/components/SelectField';
import { ChampMontantTtc } from '@/features/comptabilite/components/ecriture/ChampsEcriture';
import type { EtatNouvelleEcriture } from '@/features/comptabilite/hooks/useNouvelleEcriture';
import { OPTIONS_TAUX_TVA } from '@/features/comptabilite/utils/tva';
import type { TypeAide } from '@/features/comptabilite/types';
import { useFromagesDuStock } from '@/features/stock/hooks/useFromagesDuStock';
import { CATEGORIE_RECETTE, CATEGORIE_VENTE, TYPE_AIDE, TYPE_FROMAGE } from '@/shared/constants/comptabilite';
import {
  fromageAjouteChoisi,
  optionsFromages,
  typeDuChoix,
  valeurFromage,
} from '@/features/comptabilite/utils/fromages';
import { CLE_PRIX_LAIT, ROLE_VIANDE, SECTION_STOCK } from '@/shared/constants/stock';
import { styles } from '@/shared/styles/comptabilite/NouvelleEcriture.styles';
import { commonStyles } from '@/shared/styles/commonStyles';
import { TEXTES } from '@/shared/textes';
import { LABEL_TYPE_AIDE } from '@/shared/textes/libelles';

type Props = { e: EtatNouvelleEcriture };

const OPTIONS_TYPE_AIDE = Object.entries(LABEL_TYPE_AIDE).map(([value, label]) => ({
  value: value as TypeAide,
  label,
}));

/**
 * Le prix total d'une vente dont le prix vient de l'inventaire : prix défini là × quantité, jamais saisi. Il se recalcule dès que
 * le prix (modifié à l'inventaire), la quantité ou le détail change ; sans prix défini, le total reste vide (et la vente bloquée).
 * `actif` faux : un autre calcul s'en charge (le poids d'un animal).
 */
function useTotalVerrouille(
  e: EtatNouvelleEcriture,
  prixUnitaire: number | undefined,
  quantite: string,
  actif = true,
) {
  const { setMontant, prixLibre } = e;
  useEffect(() => {
    // Le prix d'un récolteur est libre : il se saisit, l'inventaire ne le fixe pas.
    if (!actif || prixLibre) return;
    const nombre = parseDecimal(quantite);
    setMontant(
      prixUnitaire && nombre > 0
        ? (Math.round(prixUnitaire * nombre * 100) / 100).toFixed(2).replace('.', ',')
        : '',
    );
  }, [actif, prixLibre, prixUnitaire, quantite, setMontant]);
}

/** Le prix de vente défini à l'inventaire pour le lait (€ le litre) ou l'œuf (€ pièce, 0,50 € d'office). */
function usePrixInventaire(genre: 'lait' | 'oeufs'): number | undefined {
  const [prix, setPrix] = useState<number | undefined>();
  useFocusEffect(
    useCallback(() => {
      lireArchiveStock().then((archive) =>
        setPrix(genre === 'lait' ? archive.prix[CLE_PRIX_LAIT] : prixDesOeufs(archive)),
      );
    }, [genre]),
  );
  return prix;
}

function ChampTauxTvaVente({ e }: Props) {
  return (
    <SelectField
      label={TEXTES.commun.general.tauxDeTva}
      value={e.tauxTvaVente}
      onChange={e.setTauxTvaVente}
      options={OPTIONS_TAUX_TVA}
    />
  );
}

/** Type d'aide (DPB, écorégime, ICHN…) : remplace le numéro de facture pour une aide / subvention. */
export function ChampTypeAide({ e }: Props) {
  return (
    <>
      <SelectField
        label={TEXTES.comptabilite.nouvelleEcriture.typeDAide}
        required
        value={e.typeAide}
        onChange={e.changerTypeAide}
        options={OPTIONS_TYPE_AIDE}
      />
      {e.typeAide === TYPE_AIDE.AUTRE && (
        <FormField
          label={TEXTES.comptabilite.nouvelleEcriture.preciserLeTypeDAide}
          value={e.typeAideLibre}
          onChangeText={e.setTypeAideLibre}
          placeholder={TEXTES.comptabilite.nouvelleEcriture.exAideGnrGuerreUkrainePoints}
        />
      )}
    </>
  );
}

/** Montant et taux d'imposition d'une aide / subvention (son type se choisit en haut du formulaire). */
export function ChampsAide({ e }: Props) {
  return (
    <>
      <View style={commonStyles.row}>
        <View style={commonStyles.flex1}>
          <ChampMontantTtc value={e.montant} onChange={e.setMontant} />
        </View>
        <View style={commonStyles.flex1}>
          <ChampTauxImposition value={e.tauxImpositionLibre} onChange={e.setTauxImpositionLibre} />
        </View>
      </View>
      <Text style={commonStyles.note}>{TEXTES.comptabilite.nouvelleEcriture.partDuMontantIncluseDans}</Text>
    </>
  );
}

/** Vente de lait : litrage, prix (facultatif) et TVA. */
export function ChampsVenteLait({ e }: Props) {
  const prixDuLitre = usePrixInventaire('lait');
  useTotalVerrouille(e, prixDuLitre, e.quantite);
  return (
    <>
      {/* Des femelles traitées, dont le lait ne doit pas être livré : l'avertissement s'affiche tant que leur délai court. */}
      <AvertissementDelais type="lait" date={e.date} />
      {/* Un réajustement n'a pas de litrage. */}
      {e.reajustement ? null : (
        <FormField
          label={TEXTES.comptabilite.nouvelleEcriture.litrage}
          required
          value={e.quantite}
          onChangeText={e.setQuantite}
          keyboardType="decimal-pad"
          placeholder={TEXTES.comptabilite.nouvelleEcriture.ex125}
          aide={e.prixLibre ? undefined : TEXTES.comptabilite.nouvelleEcriture.aideLitrage}
        />
      )}
      <View style={commonStyles.row}>
        <View style={commonStyles.flex1}>
          <ChampMontantTtc
            label={TEXTES.comptabilite.nouvelleEcriture.prixTotalTtc}
            value={e.montant}
            onChange={e.setMontant}
            editable={e.prixLibre}
          />
        </View>
        <View style={commonStyles.flex1}>
          <ChampTauxTvaVente e={e} />
        </View>
      </View>
      {e.prixLibre ? (
        <Text style={commonStyles.note}>{TEXTES.comptabilite.nouvelleEcriture.prixLibreRecolteur}</Text>
      ) : (
        <Text style={commonStyles.note}>
          {prixDuLitre
            ? TEXTES.comptabilite.nouvelleEcriture.prixLitreInventaire(formatMontant(prixDuLitre))
            : TEXTES.comptabilite.nouvelleEcriture.aucunPrixInventaire}
        </Text>
      )}
    </>
  );
}

/** Vente de fromage (à la pièce) : type, quantité, prix et TVA. */
export function ChampsVenteFromage({ e }: Props) {
  // Les types de fromage viennent du stock : un fromage ajouté là se vend ici, à sa place dans la liste.
  const fromages = useFromagesDuStock();
  const options = optionsFromages(fromages);
  const router = useRouter();
  const retour = useAdresseCourante();
  const ajouteChoisi = fromageAjouteChoisi(fromages, e.typeFromage, e.typeFromageLibre);
  /** Le prix de vente défini au stock pour le fromage choisi (le premier par défaut), s'il y en a un. */
  const prixDuChoix = fromages.find(
    (f) => valeurFromage(f) === (ajouteChoisi ? valeurFromage(ajouteChoisi) : e.typeFromage),
  )?.prix;
  // Le prix total est celui de l'inventaire × la quantité : recalculé dès que le fromage, son prix ou la quantité change.
  useTotalVerrouille(e, prixDuChoix, e.quantite);
  /** Un fromage ajouté se note comme « autre » avec son nom : c'est ainsi que la vente retrouve son stock. */
  const choisirFromage = (valeur: string) => {
    const choix = typeDuChoix(fromages, valeur);
    e.setTypeFromage(choix.typeFromage);
    e.setTypeFromageLibre(choix.typeFromageLibre);
    // Les lots choisis sont ceux d'un autre fromage.
    e.setFromages([]);
  };

  return (
    <>
      <AvertissementDelais type="lait" date={e.date} />
      <SelectFieldEditable
        label={TEXTES.comptabilite.nouvelleEcriture.typeDeFromage}
        required
        value={ajouteChoisi ? valeurFromage(ajouteChoisi) : e.typeFromage}
        onChange={choisirFromage}
        options={options}
        onEdit={() =>
          router.push(
            ROUTES.stockDepuis(
              retour,
              SECTION_STOCK.FROMAGES,
              e.activite === ACTIVITE_COMMUNE ? undefined : e.activite,
            ),
          )
        }
      />
      {e.typeFromage === TYPE_FROMAGE.AUTRE && !ajouteChoisi && (
        <FormField
          label={TEXTES.comptabilite.nouvelleEcriture.preciserLeType}
          value={e.typeFromageLibre}
          onChangeText={(texte) => {
            e.setTypeFromageLibre(texte);
            e.setFromages([]);
          }}
        />
      )}
      {/* Un fromage qui a des lots se vend lot par lot : le nombre de fromages est celui des lots choisis. */}
      <LotsVendusEdition
        vente={{
          categorie: CATEGORIE_VENTE.FROMAGE,
          typeFromage: e.typeFromage,
          typeFromageLibre: e.typeFromageLibre,
          activite: e.activite,
        }}
        ids={e.fromages}
        onChange={(ids) => {
          e.setFromages(ids);
          if (ids.length > 0) e.setQuantite(String(ids.length));
        }}
      />
      <View style={styles.row3}>
        <View style={commonStyles.flex1}>
          <FormField
            label={TEXTES.commun.general.quantite}
            required
            value={e.quantite}
            onChangeText={e.setQuantite}
            editable={e.fromages.length === 0}
            keyboardType="decimal-pad"
            placeholder={TEXTES.comptabilite.nouvelleEcriture.ex2}
          />
        </View>
        <View style={commonStyles.flex1}>
          <ChampMontantTtc
            label={TEXTES.comptabilite.nouvelleEcriture.prixTotalTtc}
            value={e.montant}
            onChange={e.setMontant}
            // Le prix défini à l'inventaire fait le total (quantité × prix) : on ne le saisit pas.
            editable={e.prixLibre}
          />
        </View>
        <View style={commonStyles.flex1}>
          <ChampTauxTvaVente e={e} />
        </View>
      </View>
      {e.prixLibre ? (
        <Text style={commonStyles.note}>{TEXTES.comptabilite.nouvelleEcriture.prixLibreRecolteur}</Text>
      ) : (
        <Text style={commonStyles.note}>
          {prixDuChoix
            ? TEXTES.comptabilite.nouvelleEcriture.prixDuStock(formatMontant(prixDuChoix))
            : TEXTES.comptabilite.nouvelleEcriture.aucunPrixInventaire}
        </Text>
      )}
    </>
  );
}

/** Vente de cabris : nombre, poids (facultatif), prix et TVA. */
export function ChampsVenteCabris({ e }: Props) {
  return (
    <>
      <AvertissementDelais type="viande" date={e.date} petitsSeulement />
      <View style={commonStyles.row}>
        <View style={commonStyles.flex1}>
          <FormField
            label={TEXTES.comptabilite.nouvelleEcriture.nombreDeCabris}
            required
            value={e.quantite}
            onChangeText={e.setQuantite}
            keyboardType="decimal-pad"
            placeholder={TEXTES.comptabilite.nouvelleEcriture.ex2}
          />
        </View>
        <View style={commonStyles.flex1}>
          <FormField
            label={TEXTES.commun.general.poidsKg}
            value={e.poidsKg}
            onChangeText={e.setPoidsKg}
            keyboardType="decimal-pad"
            placeholder={TEXTES.commun.general.facultatif}
          />
        </View>
      </View>
      <View style={commonStyles.row}>
        <View style={commonStyles.flex1}>
          <ChampMontantTtc
            label={TEXTES.comptabilite.nouvelleEcriture.prixTotalTtc}
            value={e.montant}
            onChange={e.setMontant}
          />
        </View>
        <View style={commonStyles.flex1}>
          <ChampTauxTvaVente e={e} />
        </View>
      </View>
    </>
  );
}

/**
 * Vente de viande, de charcuterie ou d'animaux : le détail de la vente se choisit dans la liste du stock (le crayon y mène),
 * avec la quantité, le prix et la TVA. Tant que le stock n'a rien à proposer, la précision reste libre.
 */
export function ChampsVenteViande({ e }: Props) {
  const router = useRouter();
  const retour = useAdresseCourante();
  const toutesViandes = useViandesDuStock(
    e.activite === ACTIVITE_COMMUNE ? undefined : (e.activite as FiltreStock),
  );
  // « Vente viande » : les animaux entiers (liste « Animaux ») ; « Vente boucherie / charcuterie » : les produits et morceaux.
  const animalEntier = e.categorieRecette === CATEGORIE_RECETTE.VIANDE;
  const viandes = toutesViandes.filter((v) => (roleDeLaViande(v.cle) !== undefined) === animalEntier);
  const niveaux = useNiveauxStock();
  const choisie = viandes.find((x) => x.libelle === e.precision);
  const prixDuDetail = choisie?.prix;
  // Un morceau ou un produit : prix de l'inventaire × quantité (un animal se calcule au kilo, avec son poids).
  const auKiloLigne = !!choisie && roleDeLaViande(choisie.cle) !== undefined;
  useTotalVerrouille(e, prixDuDetail, e.quantite, !auKiloLigne);
  /** Les animaux (petits, sur pied, vivants) se vendent au kilo ; la charcuterie et les autres lignes, à la quantité. */
  const auKilo = !!choisie && roleDeLaViande(choisie.cle) !== undefined;
  /** Un animal sur pied ou vivant vient d'être choisi : on ouvre la liste des animaux de l'espèce pour désigner celui qui est vendu. */
  const [question, setQuestion] = useState<ArticleAffiche | null>(null);
  const espece: EspeceAnimale =
    e.activite === ACTIVITE_COMMUNE ? especeCourante() : (e.activite as EspeceAnimale);
  const [animaux, setAnimaux] = useState<Chevre[]>([]);
  /** Les jours d'abattage dont la viande n'est pas encore facturée : on y choisit tous les animaux, ou certains numéros. */
  const [jours, setJours] = useState<JourAbattu[]>([]);
  const [abattusOuvert, setAbattusOuvert] = useState(false);
  useFocusEffect(
    useCallback(() => {
      listAnimauxVivantsDe(espece).then(setAnimaux);
      Promise.all([listAnimauxAbattusDe(espece), listToutesVentes()]).then(([abattus, ventes]) =>
        setJours(joursAbattusAFacturer(abattus, ventes)),
      );
    }, [espece]),
  );
  /** Une ligne de la liste : le n° de boucle (ou le nom), M ou F, et la date de naissance. */
  const libelleAnimal = libelleAnimalVendu;
  /** Prix total d'un animal vendu au kilo : le poids × le prix au kilo du stock (pour 1 kg tant qu'aucun poids n'est saisi). */
  const totalAuKilo = (poids: string, prixAuKilo = prixDuDetail) => {
    if (e.prixLibre) return;
    if (!prixAuKilo) return e.setMontant('');
    const kilos = parseDecimal(poids) > 0 ? parseDecimal(poids) : 1;
    e.setMontant((Math.round(prixAuKilo * kilos * 100) / 100).toFixed(2).replace('.', ','));
  };
  /**
   * Le plus d'animaux qu'on peut vendre : ce qu'il reste dans la ligne des petits pour un petit (la ligne choisie, ou celle des
   * petits quand on vend un animal sur pied ou vivant jeune), au moins 1 ; sans limite de stock (50) pour un adulte.
   */
  const maximumAnimaux = (ligne: ArticleAffiche | undefined, jeune: boolean | undefined): number => {
    const role = ligne ? roleDeLaViande(ligne.cle) : undefined;
    if (!ligne || !role) return 50;
    if (role === ROLE_VIANDE.JEUNE) return Math.max(1, Math.floor(niveaux.get(ligne.cle) ?? 0));
    return jeune ? Math.max(1, Math.floor(niveaux.get(cleJeunes(espece)) ?? 0)) : 50;
  };
  /** Ramène le nombre d'animaux saisi au maximum possible. */
  const limiterAnimaux = (maximum: number) => {
    if (Math.round(parseDecimal(e.quantite)) > maximum) e.setQuantite(String(maximum));
  };
  /** Un animal de la liste est un petit (cabri, agneau…) s'il n'a pas encore l'âge de sevrage de son espèce le jour de la vente. */
  const estPetit = (animal: Chevre) => estPetitLe(animal, e.date);
  /** Les animaux déjà choisis : le nombre d'animaux de la vente est leur nombre. */
  const joursProposes = jours
    .map((j) => ({ date: j.date, animaux: j.animaux.filter((a) => !!a.numeroBoucle === e.avecFacture) }))
    .filter((j) => j.animaux.length > 0);
  const jourChoisi = joursProposes.find((j) => j.date === e.dateAbattoir);
  const animauxChoisis = e.animaux
    .map((id) => [...animaux, ...jours.flatMap((j) => j.animaux)].find((a) => a.id === id))
    .filter((a): a is Chevre => !!a);
  /** Une vente d'animaux (petits, sur pied, vivants) se fait animal par animal : on les désigne, plutôt que d'en saisir le nombre. */
  const parAnimal = !!choisie && roleDeLaViande(choisie.cle) !== undefined;
  /** La ligne des petits ne propose que des petits. */
  const lignePetits = !!choisie && roleDeLaViande(choisie.cle) === ROLE_VIANDE.JEUNE;
  /** Les animaux d'un animal sur pied ou vivant sont des adultes : ceux qui ont l'âge de sevrage de leur espèce, pas les petits. */
  const ligneAdultes = parAnimal && !lignePetits;
  /**
   * Les animaux qu'on peut encore ajouter : ceux de l'espèce de la vente qui ne sont pas déjà choisis, et de la catégorie de la
   * ligne choisie — les petits pour la ligne des petits, les adultes pour un animal sur pied ou vivant.
   */
  const animauxProposes = animaux.filter(
    (a) =>
      !e.animaux.includes(a.id) &&
      // Vente déclarée (facture) : l'animal a obligatoirement une boucle ; sinon, il n'en a pas.
      !!a.numeroBoucle === e.avecFacture &&
      (!lignePetits || estPetit(a)) &&
      (!ligneAdultes || !estPetit(a)) &&
      (animauxChoisis.length === 0 || estPetit(a) === estPetit(animauxChoisis[0])),
  );
  /** Le poids des animaux choisis, quand l'abattoir l'a donné pour chacun : il remplit le poids de la vente, et le total au kilo suit. */
  const reprendrePoids = (choisis: Chevre[]) => {
    const total = poidsTotal(choisis);
    if (total === undefined) return;
    const texte = String(total).replace('.', ',');
    e.setPoidsKg(texte);
    totalAuKilo(texte);
  };
  /** Les animaux du jour d'abattage choisi qu'on peut encore ajouter (avec facture, ceux qui ont une boucle). */
  const abattusProposes = (jourChoisi?.animaux ?? []).filter((a) => !e.animaux.includes(a.id));
  /** Ajoute d'un coup les animaux cochés du jour d'abattage : tous, ou certains numéros. */
  const ajouterAbattus = (ids: string[]) => {
    const nouveaux = abattusProposes.filter((a) => ids.includes(a.id));
    setAbattusOuvert(false);
    if (nouveaux.length === 0) return;
    const liste = [...e.animaux, ...nouveaux.map((a) => a.id)];
    reprendrePoids([...animauxChoisis, ...nouveaux]);
    e.setAnimaux(liste);
    e.setJeune(estPetit(nouveaux[0]));
    e.setQuantite(String(liste.length));
  };
  const ajouterAnimal = (id: string) => {
    const animal = animaux.find((a) => a.id === id);
    if (!animal) return;
    const liste = [...e.animaux, id];
    reprendrePoids([...animauxChoisis, animal]);
    e.setAnimaux(liste);
    e.setJeune(estPetit(animal));
    e.setQuantite(String(liste.length));
    limiterAnimaux(maximumAnimaux(question ?? choisie, estPetit(animal)));
    setQuestion(null);
  };
  const retirerAnimal = (id: string) => {
    const liste = e.animaux.filter((x) => x !== id);
    reprendrePoids(animauxChoisis.filter((a) => liste.includes(a.id)));
    e.setAnimaux(liste);
    e.setQuantite(String(Math.max(1, liste.length)));
    if (liste.length === 0) e.setJeune(undefined);
  };
  // Le prix d'un animal est modifié à l'inventaire : le total (poids × prix au kilo) suit.
  useEffect(() => {
    if (auKiloLigne) totalAuKilo(e.poidsKg);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prixDuDetail]);
  const maximum = maximumAnimaux(choisie, e.jeune);
  const optionsAnimaux = Array.from(
    { length: Math.max(maximum, Math.round(parseDecimal(e.quantite)) || 1) },
    (_, i) => ({
      value: String(i + 1),
      label: String(i + 1),
    }),
  );
  return (
    <>
      <SelectFieldEditable<string>
        label={TEXTES.comptabilite.nouvelleEcriture.detailDeLaVente}
        required
        searchable
        placeholder={TEXTES.comptabilite.nouvelleEcriture.choixDuDetail}
        value={e.precision}
        onChange={(v) => {
          e.setPrecision(v);
          const nouvelle = viandes.find((x) => x.libelle === v);
          const role = nouvelle ? roleDeLaViande(nouvelle.cle) : undefined;
          // Un animal se vend à l'unité d'abord : le nombre d'animaux vaut 1 d'office.
          if (role && !e.quantite.trim()) e.setQuantite('1');
          if (role === ROLE_VIANDE.JEUNE) limiterAnimaux(maximumAnimaux(nouvelle, undefined));
          if (role) totalAuKilo(e.poidsKg, nouvelle?.prix);
          if (role) setQuestion(nouvelle ?? null);
          else e.setJeune(undefined);
          // Un autre détail : les animaux et les lots déjà choisis ne valent plus.
          e.setAnimaux([]);
          e.setFromages([]);
        }}
        options={viandes.map((v) => ({ value: v.libelle, label: v.libelle }))}
        onEdit={() =>
          router.push(
            ROUTES.stockDepuis(
              retour,
              parAnimal ? SECTION_STOCK.ANIMAUX : SECTION_STOCK.VIANDE,
              e.activite === ACTIVITE_COMMUNE ? undefined : e.activite,
            ),
          )
        }
      />
      {viandes.length === 0 ? (
        <Text style={commonStyles.note}>{TEXTES.comptabilite.nouvelleEcriture.aucuneViandeAuStock}</Text>
      ) : null}
      {auKilo ? (
        <>
          {parAnimal ? (
            <View style={commonStyles.gap6}>
              {/* Des animaux déjà à l'abattoir : la facture désigne ceux d'un jour d'abattage. */}
              {joursProposes.length > 0 ? (
                <SelectField<string>
                  label={TEXTES.comptabilite.nouvelleEcriture.animauxAbattus}
                  value={jourChoisi?.date ?? ''}
                  placeholder={TEXTES.comptabilite.nouvelleEcriture.animauxVivants}
                  onChange={(date) => {
                    e.setDateAbattoir(date);
                    e.setAnimaux([]);
                    if (date) setAbattusOuvert(true);
                  }}
                  options={[
                    { value: '', label: TEXTES.comptabilite.nouvelleEcriture.animauxVivants },
                    ...joursProposes.map((j) => ({
                      value: j.date,
                      label: TEXTES.comptabilite.nouvelleEcriture.jourAbattu(formatDateFR(j.date), j.animaux.length),
                    })),
                  ]}
                />
              ) : null}
              <View style={commonStyles.rowSpaceBetween}>
                <Text style={commonStyles.lineSemiBold}>
                  {TEXTES.comptabilite.nouvelleEcriture.animauxVendus}
                  <Text style={commonStyles.required}> *</Text>
                </Text>
                <Pressable
                  style={commonStyles.boutonPastille}
                  onPress={() => (jourChoisi ? setAbattusOuvert(true) : setQuestion(choisie ?? null))}
                  accessibilityLabel={TEXTES.comptabilite.nouvelleEcriture.ajouterUnAnimal}
                >
                  <Ionicons name="add-circle" size={28} color={colors.ajout} />
                </Pressable>
              </View>
              {animauxChoisis.some((a) => a.poidsKg === undefined) && animauxChoisis.length > 0 ? (
                <Text style={commonStyles.note}>
                  {TEXTES.comptabilite.nouvelleEcriture.poidsManquant(animauxChoisis.filter((a) => a.poidsKg === undefined).length)}
                </Text>
              ) : null}
              {animauxChoisis.length > 0 ? (
                <Card style={commonStyles.gap10}>
                  {animauxChoisis.map((animal) => (
                    <View key={animal.id} style={commonStyles.rowSpaceBetween}>
                      <Text style={commonStyles.valueText}>{libelleAnimal(animal)}</Text>
                      <Pressable
                        onPress={() => retirerAnimal(animal.id)}
                        hitSlop={8}
                        accessibilityLabel={TEXTES.comptabilite.nouvelleEcriture.retirerAnimal}
                      >
                        <Ionicons name="close-circle" size={22} color={colors.danger} />
                      </Pressable>
                    </View>
                  ))}
                </Card>
              ) : null}
              {animauxChoisis.length > 0 && e.avecFacture ? (
                <ChampDateAbattoir dateVente={e.date} value={e.dateAbattoir} onChange={e.setDateAbattoir} />
              ) : null}
              {/* Les animaux choisis en délai d'attente pour la viande le jour de la vente (ou de l'abattage). */}
              {animauxChoisis.length > 0 ? (
                <AvertissementDelais
                  type="viande"
                  date={e.dateAbattoir || e.date}
                  boucles={animauxChoisis.map((a) => a.numeroBoucle).filter((b): b is string => !!b)}
                />
              ) : null}
              <Text style={commonStyles.note}>{TEXTES.comptabilite.nouvelleEcriture.animauxNote}</Text>
            </View>
          ) : (
            <SelectField<string>
              label={TEXTES.comptabilite.nouvelleEcriture.nombreDAnimaux}
              value={e.quantite || '1'}
              onChange={e.setQuantite}
              options={optionsAnimaux}
            />
          )}
          <View style={styles.row3}>
            <View style={commonStyles.flex1}>
              <FormField
                label={TEXTES.commun.general.poidsKg}
                required
                value={e.poidsKg}
                onChangeText={(v) => {
                  e.setPoidsKg(v);
                  totalAuKilo(v);
                }}
                keyboardType="decimal-pad"
                placeholder={TEXTES.comptabilite.nouvelleEcriture.ex2}
              />
            </View>
            <View style={commonStyles.flex1}>
              {/* Le prix unitaire vient du stock : on ne le change pas ici. */}
              <FormField
                label={TEXTES.comptabilite.nouvelleEcriture.prixUnitaireKg}
                value={prixDuDetail ? prixDuDetail.toFixed(2).replace('.', ',') : ''}
                editable={false}
                style={commonStyles.verrouille}
              />
            </View>
            <View style={commonStyles.flex1}>
              <ChampTauxTvaVente e={e} />
            </View>
          </View>
          {/* Le prix total est calculé (poids × prix au kilo) : on ne le saisit pas. */}
          <FormField
            label={TEXTES.comptabilite.nouvelleEcriture.prixTotalTtc}
            required
            value={e.montant}
            onChangeText={e.setMontant}
            editable={e.prixLibre}
            keyboardType="decimal-pad"
            style={e.prixLibre ? undefined : commonStyles.verrouille}
          />
        </>
      ) : (
        <>
          {/* La charcuterie est identifiée lot par lot : le nombre de produits est celui des lots choisis. */}
          <LotsVendusEdition
            vente={{
              categorie: CATEGORIE_VENTE.BOUCHERIE_CHARCUTERIE,
              precision: e.precision,
              activite: e.activite,
            }}
            ids={e.fromages}
            onChange={(ids) => {
              e.setFromages(ids);
              if (ids.length > 0) e.setQuantite(String(ids.length));
            }}
          />
          <View style={styles.row3}>
            <View style={commonStyles.flex1}>
              <FormField
                label={TEXTES.commun.general.quantite}
                required
                value={e.quantite}
                onChangeText={e.setQuantite}
                editable={e.fromages.length === 0}
                keyboardType="decimal-pad"
                placeholder="1"
              />
            </View>
            <View style={commonStyles.flex1}>
              <ChampMontantTtc
                label={TEXTES.comptabilite.nouvelleEcriture.prixTotalTtc}
                value={e.montant}
                onChange={e.setMontant}
                editable={e.prixLibre}
              />
            </View>
            <View style={commonStyles.flex1}>
              <ChampTauxTvaVente e={e} />
            </View>
          </View>
        </>
      )}
      {e.prixLibre ? (
        <Text style={commonStyles.note}>{TEXTES.comptabilite.nouvelleEcriture.prixLibreRecolteur}</Text>
      ) : choisie && !prixDuDetail ? (
        <Text style={commonStyles.note}>{TEXTES.comptabilite.nouvelleEcriture.aucunPrixInventaire}</Text>
      ) : prixDuDetail ? (
        <Text style={commonStyles.note}>
          {auKilo ? null : TEXTES.comptabilite.nouvelleEcriture.prixDuStock(formatMontant(prixDuDetail))}
        </Text>
      ) : null}

      {/* Les animaux d'un jour d'abattage : tous cochés d'office, on en décoche, ou on tape une plage de numéros. */}
      <SelectModalMultiple<string>
        key={`${e.dateAbattoir}-${abattusProposes.length}`}
        visible={abattusOuvert}
        titre={TEXTES.comptabilite.nouvelleEcriture.animauxAbattusLe(formatDateFR(jourChoisi?.date))}
        options={abattusProposes.map((a) => ({ value: a.id, label: libelleAnimal(a) }))}
        initiales={abattusProposes.map((a) => a.id)}
        libelleValider={TEXTES.comptabilite.nouvelleEcriture.ajouterLesAnimaux}
        onValider={ajouterAbattus}
        onClose={() => setAbattusOuvert(false)}
        numeroDe={(id) => {
          const chiffres = /(\d+)$/.exec(abattusProposes.find((a) => a.id === id)?.numeroBoucle ?? '');
          return chiffres ? Number(chiffres[1]) : undefined;
        }}
      />
      <SelectModal<string>
        visible={!!question}
        titre={TEXTES.comptabilite.nouvelleEcriture.animalVendu(question?.libelle ?? '')}
        value=""
        options={animauxProposes.map((a) => ({ value: a.id, label: libelleAnimal(a) }))}
        onSelect={ajouterAnimal}
        onClose={() => setQuestion(null)}
        searchable
      />
    </>
  );
}

/** Vente d'œufs : nombre d'œufs, prix et TVA. */
export function ChampsVenteOeufs({ e }: Props) {
  // Choisir « vente d'œufs » lie la vente à la liste des œufs de l'inventaire (0,50 € l'œuf d'office).
  const router = useRouter();
  const retour = useAdresseCourante();
  const prixDeLOeuf = usePrixInventaire('oeufs');
  useTotalVerrouille(e, prixDeLOeuf, e.quantite);
  return (
    <>
      <View style={styles.row3}>
        <View style={commonStyles.flex1}>
          <FormField
            label={TEXTES.comptabilite.nouvelleEcriture.nombreDOeufs}
            required
            value={e.quantite}
            onChangeText={e.setQuantite}
            keyboardType="decimal-pad"
            placeholder={TEXTES.comptabilite.nouvelleEcriture.ex2}
          />
        </View>
        <View style={commonStyles.flex1}>
          <ChampMontantTtc
            label={TEXTES.comptabilite.nouvelleEcriture.prixTotalTtc}
            value={e.montant}
            onChange={e.setMontant}
            editable={e.prixLibre}
          />
        </View>
        <View style={commonStyles.flex1}>
          <ChampTauxTvaVente e={e} />
        </View>
      </View>
      {/* Le crayon mène à la liste des œufs de l'inventaire, où se change le prix (le total se recalcule au retour). */}
      <View style={commonStyles.rowSpaceBetween}>
        <Text style={[commonStyles.note, commonStyles.flex1]}>
          {prixDeLOeuf
            ? TEXTES.comptabilite.nouvelleEcriture.prixOeufInventaire(formatMontant(prixDeLOeuf))
            : TEXTES.comptabilite.nouvelleEcriture.aucunPrixInventaire}
        </Text>
        <Pressable
          onPress={() =>
            router.push(
              ROUTES.stockDepuis(
                retour,
                SECTION_STOCK.OEUFS,
                e.activite === ACTIVITE_COMMUNE ? undefined : e.activite,
              ),
            )
          }
          hitSlop={8}
          accessibilityLabel={TEXTES.comptabilite.nouvelleEcriture.modifierLePrixOeuf}
        >
          <Ionicons name="pencil" size={20} color={colors.ajout} />
        </Pressable>
      </View>
    </>
  );
}

/** Vente d'un animal sur pied ou vivant : nombre de têtes, poids (facultatif), prix, TVA et précision facultative. */
export function ChampsVenteAnimal({ e }: Props) {
  return (
    <>
      <AvertissementDelais type="viande" date={e.dateAbattoir || e.date} />
      <View style={commonStyles.row}>
        <View style={commonStyles.flex1}>
          <FormField
            label={TEXTES.comptabilite.nouvelleEcriture.nombreDeTetes}
            required
            value={e.quantite}
            onChangeText={e.setQuantite}
            keyboardType="decimal-pad"
            placeholder={TEXTES.comptabilite.nouvelleEcriture.ex2}
          />
        </View>
        <View style={commonStyles.flex1}>
          <FormField
            label={TEXTES.commun.general.poidsKg}
            value={e.poidsKg}
            onChangeText={e.setPoidsKg}
            keyboardType="decimal-pad"
            placeholder={TEXTES.commun.general.facultatif}
          />
        </View>
      </View>
      <View style={commonStyles.row}>
        <View style={commonStyles.flex1}>
          <ChampMontantTtc
            label={TEXTES.comptabilite.nouvelleEcriture.prixTotalTtc}
            value={e.montant}
            onChange={e.setMontant}
          />
        </View>
        <View style={commonStyles.flex1}>
          <ChampTauxTvaVente e={e} />
        </View>
      </View>
    </>
  );
}
