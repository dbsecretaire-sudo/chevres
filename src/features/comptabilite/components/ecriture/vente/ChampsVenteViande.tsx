import { useCallback, useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { estDateISO, formatDateFR, formatMontant, todayISO } from '@/shared/utils/dates';
import { parseDecimal } from '@/shared/utils/nombres';
import { ChampEtatAnimaux } from '@/features/comptabilite/components/ChampEtatAnimaux';
import { estClientAbattoir } from '@/features/clients/services/categorie';
import { reglageEtatAnimaux } from '@/features/comptabilite/utils/ventes';
import { useFocusEffect, useRouter } from 'expo-router';
import { SelectFieldEditable } from '@/shared/components/SelectFieldEditable';
import { useAdresseCourante } from '@/shared/hooks/useAdresseCourante';
import { useNiveauxStock } from '@/features/stock/hooks/useNiveauxStock';
import { useViandesDuStock } from '@/features/stock/hooks/useViandesDuStock';
import { lireArchiveStock } from '@/features/stock/repository';
import { numerosTiptag } from '@/features/stock/services/boucles';
import { estTiptag } from '@/features/cheptel/utils/tiptag';
import { parBoucleCroissante } from '@/features/cheptel/utils/chevreLabel';
import { BoutonCadeau } from '@/features/comptabilite/components/BoutonCadeau';
import { ChampFraisAbattoir } from '@/features/comptabilite/components/ChampFraisAbattoir';
import { useFraisAbattoir } from '@/features/exploitation/hooks/useFraisAbattoir';
import { useInconsommables } from '@/features/exploitation/hooks/useInconsommables';
import { ChampPrixPersonnalise } from '@/features/comptabilite/components/ecriture/ChampPrixPersonnalise';
import { prixUnitaireEffectif } from '@/features/comptabilite/utils/prixPersonnalise';
import { usePoidsDuLot } from '@/features/exploitation/hooks/usePoidsDuLot';
import { cleJeunes, roleDeLaViande, type ArticleAffiche, type FiltreStock } from '@/features/stock/services/stock';
import { especeCourante, type EspeceAnimale } from '@/shared/dictionnaire/animaux';
import { ACTIVITE_COMMUNE } from '@/shared/constants/etablissements';
import { ROUTES } from '@/shared/constants/routes';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '@/shared/components/Card';
import { SelectModalMultiple } from '@/shared/components/SelectModalMultiple';
import { listToutesVentes } from '@/features/comptabilite/repository/ventes';
import { colors } from '@/shared/theme/colors';
import {
  estPetitLe,
  listAnimauxAbattusDe,
  listAnimauxPresentsLe,
} from '@/features/cheptel/repository/chevres';
import {
  joursAbattusAFacturer,
  libelleAnimalVendu,
  resumeBoucles,
  sontDesCabris,
  UN_PAR_UN,
  type JourAbattu,
} from '@/features/comptabilite/utils/animauxVendus';
import { ChampDateAbattoir } from '@/features/comptabilite/components/ChampDateAbattoir';
import { AvertissementDelais } from '@/features/exploitation/components/AvertissementDelais';
import { LotsVendusEdition } from '@/features/comptabilite/components/LotsVendusEdition';
import type { Chevre } from '@/features/cheptel/types';
import { poidsTotal } from '@/features/cheptel/utils/poids';
import { Checkbox } from '@/shared/components/Checkbox';
import { FormField } from '@/shared/components/FormField';
import { SelectField } from '@/shared/components/SelectField';
import { ChampMontantTtc } from '@/features/comptabilite/components/ecriture/ChampsEcriture';
import { CATEGORIE_RECETTE, CATEGORIE_VENTE } from '@/shared/constants/comptabilite';
import { ROLE_VIANDE, SECTION_STOCK } from '@/shared/constants/stock';
import { styles } from '@/shared/styles/comptabilite/NouvelleEcriture.styles';
import { commonStyles } from '@/shared/styles/commonStyles';
import { TEXTES } from '@/shared/textes';
import { useTotalVerrouille, usePrixSelonLeContact, ChampTauxTvaVente, type Props } from '@/features/comptabilite/components/ecriture/vente/outilsVente';

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
  const prixSelonLeContact = usePrixSelonLeContact(e);
  const prixDuDetail = prixSelonLeContact(choisie?.cle, choisie?.prix);
  // Un morceau ou un produit : prix de l'inventaire × quantité (un animal se calcule au kilo, avec son poids).
  const auKiloLigne = !!choisie && roleDeLaViande(choisie.cle) !== undefined;
  /** Un animal vivant (élevage, lait, compagnie) se vend à la tête : son prix est celui d'un animal ; un animal sur pied ou un petit, au kilo. */
  const vivantLigne = !!choisie && roleDeLaViande(choisie.cle) === ROLE_VIANDE.VIVANT;
  /** Des animaux vivants de réforme se vendent au poids vif : le prix au kilo se saisit (celui de l'inventaire est celui d'un animal). */
  const aLaTete = vivantLigne && !e.venduAuPoids;
  useTotalVerrouille(e, prixDuDetail, e.quantite, !auKiloLigne);
  /** Les animaux (petits, sur pied, vivants) se vendent au kilo ; la charcuterie et les autres lignes, à la quantité. */
  const auKilo = !!choisie && roleDeLaViande(choisie.cle) !== undefined;
  /** Un animal sur pied ou vivant vient d'être choisi : on ouvre la liste des animaux de l'espèce pour désigner celui qui est vendu. */
  const [question, setQuestion] = useState<ArticleAffiche | null>(null);
  const espece: EspeceAnimale =
    e.activite === ACTIVITE_COMMUNE ? especeCourante() : (e.activite as EspeceAnimale);
  const [animaux, setAnimaux] = useState<Chevre[]>([]);
  /** Les numéros des tiptag de l'inventaire : un animal qui en porte un est destiné à l'abattoir, il n'est pas proposé comme animal vivant. */
  const [tiptags, setTiptags] = useState<ReadonlySet<string>>(new Set());
  /** Vrai quand les tiptag sont lus : le détail deviné d'après un jour d'abattage attend de les connaître (un tiptag est un cabri). */
  const [tiptagsLus, setTiptagsLus] = useState(false);
  /** Les jours d'abattage dont la viande n'est pas encore facturée : on y choisit tous les animaux, ou certains numéros. */
  const [jours, setJours] = useState<JourAbattu[]>([]);
  const [abattusOuvert, setAbattusOuvert] = useState(false);
  /** Les animaux se choisissent un par un (au lieu de prendre le lot d'un jour d'abattage), et le détail du lot est déroulé. */
  const [unParUn, setUnParUn] = useState(false);
  const [detailOuvert, setDetailOuvert] = useState(false);
  /** Le prix au kilo : le prix personnalisé de la facture (exceptionnel), sinon celui de l'inventaire. */
  const prixEffectif = e.venduAuPoids
    ? parseDecimal(e.prixUnitaireSaisi) > 0
      ? parseDecimal(e.prixUnitaireSaisi)
      : undefined
    : prixUnitaireEffectif(e, prixDuDetail);
  useFocusEffect(
    useCallback(() => {
      // Les animaux présents sur l'exploitation à la date de la facture (pas seulement ceux d'aujourd'hui).
      listAnimauxPresentsLe(espece, estDateISO(e.date) ? e.date : todayISO()).then(setAnimaux);
      lireArchiveStock()
        .then((archive) => {
          setTiptags(numerosTiptag(archive.boucles));
          setTiptagsLus(true);
        })
        .catch(() => setTiptagsLus(true));
      Promise.all([listAnimauxAbattusDe(espece), listToutesVentes()]).then(([abattus, ventes]) =>
        setJours(joursAbattusAFacturer(abattus, ventes)),
      );
    }, [espece, e.date]),
  );
  /** Une ligne de la liste : le n° de boucle (ou le nom), M ou F, et la date de naissance. */
  const libelleAnimal = libelleAnimalVendu;
  /** Prix total d'un animal vendu au kilo : le poids × le prix au kilo du stock (pour 1 kg tant qu'aucun poids n'est saisi). */
  const totalAuKilo = (poids: string, prixAuKilo = prixEffectif, tete = aLaTete) => {
    if (e.prixLibre) return;
    if (!prixAuKilo) return e.setMontant('');
    // À la tête : le prix d'un animal × leur nombre (le poids est facultatif) ; au kilo : le poids (1 kg tant qu'il n'est pas saisi).
    const multiple = tete
      ? Math.max(1, Math.round(parseDecimal(e.quantite)) || 1)
      : parseDecimal(poids) > 0
        ? parseDecimal(poids)
        : 1;
    e.setMontant((Math.round(prixAuKilo * multiple * 100) / 100).toFixed(2).replace('.', ','));
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
  /** Un animal de la liste est un petit (cabri, agneau…) s'il n'a pas encore l'âge de sevrage de son espèce le jour de la vente, ou s'il porte un tiptag (destiné à l'abattoir). */
  const estPetit = (animal: Chevre) => estPetitLe(animal, e.date) || estTiptag(animal, tiptags);
  /** Les animaux déjà choisis : le nombre d'animaux de la vente est leur nombre. */
  // Une bête déclarée inconsommable dans le lot (saisie sanitaire, morte pendant le transport) ne se facture pas au client.
  const inconsommables = useInconsommables();
  const joursProposes = jours
    .map((j) => ({ date: j.date, animaux: j.animaux.filter((a) => !!a.numeroBoucle === e.avecFacture && !inconsommables.has(a.id)) }))
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
   * Les animaux de la liste (cochés : ceux déjà choisis) : ceux de l'espèce de la vente et de la catégorie de la ligne choisie — les
   * petits pour la ligne des petits ; pour un animal sur pied ou vivant, les adultes, boucs compris, sans les tiptag (destinés à l'abattoir).
   */
  /** Un animal sur pied vendu avec facture est déjà passé à l'abattoir : seuls ceux-là (à boucle, sans les tiptag) sont proposés. */
  const surPiedDeclare = !!choisie && roleDeLaViande(choisie.cle) === ROLE_VIANDE.SUR_PIED && e.avecFacture;
  const animauxProposes = surPiedDeclare
    ? [...new Map(joursProposes.flatMap((j) => j.animaux).map((a) => [a.id, a])).values()].filter(
        (a) => !estPetit(a) && !estTiptag(a, tiptags),
      )
    : animaux.filter(
        (a) =>
          // Vente déclarée (facture) : l'animal a obligatoirement une boucle ; sinon, il n'en a pas.
          !!a.numeroBoucle === e.avecFacture &&
          (!lignePetits || estPetit(a)) &&
          (!ligneAdultes || (!estPetit(a) && !estTiptag(a, tiptags))),
      );
  /** La liste à cocher : les animaux proposés, plus ceux déjà choisis qui n'en font plus partie (un animal d'un lot, par exemple). */
  const animauxACocher = [...animauxChoisis.filter((c) => !animauxProposes.some((a) => a.id === c.id)), ...animauxProposes].sort(
    parBoucleCroissante,
  );
  /** Le poids des animaux choisis, quand l'abattoir l'a donné pour chacun : il remplit le poids de la vente, et le total au kilo suit. */
  const reprendrePoids = (choisis: Chevre[]) => {
    // Un animal vivant ne passe ni sur la balance ni par l'abattoir : son poids n'est pas repris des fiches.
    if (vivantLigne) return;
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
  const poidsDuJour = usePoidsDuLot();
  /** Le lot entier d'un jour d'abattage est pris, avec son poids noté dans sa fiche : ce poids ne se modifie pas ici. */
  const poidsDuLotVerrouille = !!jourChoisi && !unParUn && e.animaux.length === jourChoisi.animaux.length && !!poidsDuJour(jourChoisi.date);
  /** Prend tout le lot d'un jour d'abattage (« Abattoir du … ») : ses animaux, leur nombre et leur poids remplissent la vente. */
  const choisirJour = (date: string) => {
    const jour = joursProposes.find((j) => j.date === date);
    if (!jour) return;
    e.setDateAbattoir(date);
    e.setAnimaux(jour.animaux.map((a) => a.id));
    e.setJeune(estPetit(jour.animaux[0]));
    e.setQuantite(String(jour.animaux.length));
    // Le poids de tout le lot, noté dans sa fiche, a la priorité ; sinon, la somme des poids des fiches (quand ils sont tous donnés).
    const poidsDuLotNote = poidsDuJour(date);
    if (poidsDuLotNote) {
      const texte = String(poidsDuLotNote).replace('.', ',');
      e.setPoidsKg(texte);
      totalAuKilo(texte);
    } else reprendrePoids(jour.animaux);
  };
  // Des animaux déjà choisis (depuis un bon de commande) : leur poids, noté sur leur fiche, remplit le poids de la vente.
  useEffect(() => {
    if (e.animaux.length === 0 || animauxChoisis.length !== e.animaux.length || e.poidsKg.trim()) return;
    reprendrePoids(animauxChoisis);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [e.animaux, animauxChoisis.length, e.poidsKg]);
  // Un jour d'abattage d'ouverture (depuis Production › Viande), ou un autre détail de vente : le lot du jour se prend d'office.
  useEffect(() => {
    if (parAnimal && jourChoisi && e.animaux.length === 0 && !unParUn) choisirJour(jourChoisi.date);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [parAnimal, jourChoisi?.date, e.animaux.length, unParUn]);
  // Les frais d'abattoir du lot choisi (sa facture liée, sinon le montant noté) : proposés pour la part des animaux de la vente.
  const fraisDuJour = useFraisAbattoir();
  // Un animal vivant ne passe pas par l'abattoir : jamais de frais d'abattoir à lui refacturer.
  const propositionFrais = jourChoisi && !vivantLigne ? fraisDuJour(jourChoisi.date, e.animaux.length) : undefined;
  /** Facturer ou non les frais au client : la case de ChampFraisAbattoir (d'office, oui). */
  const [fraisRefactures, setFraisRefactures] = useState(true);
  useEffect(() => {
    if (!propositionFrais || !fraisRefactures) return;
    e.setFraisAbattoir(String(propositionFrais.montant).replace('.', ','));
    if (propositionFrais.tauxTva !== undefined) e.setTauxTvaFrais(String(propositionFrais.tauxTva));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [propositionFrais?.montant, propositionFrais?.tauxTva, fraisRefactures]);
  /** Valide les animaux cochés : la vente prend exactement ceux-là (ceux décochés sont retirés), leur nombre, leur âge et leur poids suivent. */
  const choisirAnimaux = (ids: string[]) => {
    setQuestion(null);
    const ordre = [...e.animaux.filter((id) => ids.includes(id)), ...ids.filter((id) => !e.animaux.includes(id))];
    const objets = ordre
      .map((id) => animauxACocher.find((a) => a.id === id))
      .filter((a): a is Chevre => !!a);
    if (objets.length === 0) {
      e.setAnimaux([]);
      e.setJeune(undefined);
      e.setQuantite('1');
      if (jourChoisi) e.setDateAbattoir('');
      return;
    }
    reprendrePoids(objets);
    e.setAnimaux(objets.map((a) => a.id));
    e.setJeune(estPetit(objets[0]));
    e.setQuantite(String(objets.length));
    limiterAnimaux(maximumAnimaux(question ?? choisie, estPetit(objets[0])));
  };
  const retirerAnimal = (id: string) => {
    const liste = e.animaux.filter((x) => x !== id);
    reprendrePoids(animauxChoisis.filter((a) => liste.includes(a.id)));
    e.setAnimaux(liste);
    e.setQuantite(String(Math.max(1, liste.length)));
    if (liste.length === 0) {
      e.setJeune(undefined);
      // Plus aucun animal du lot : le jour d'abattage n'est plus choisi (le lot ne se reprend pas tout seul).
      if (jourChoisi) e.setDateAbattoir('');
    }
  };
  /** Retire tout le lot d'un jour d'abattage. */
  const retirerLot = () => {
    e.setAnimaux([]);
    e.setDateAbattoir('');
    e.setJeune(undefined);
    e.setQuantite('1');
    setDetailOuvert(false);
  };
  // Le prix d'un animal est modifié à l'inventaire, ou le poids est repris des fiches (depuis un bon de commande) : le total (poids × prix
  // au kilo) suit.
  useEffect(() => {
    if (auKiloLigne) totalAuKilo(e.poidsKg);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prixEffectif, e.poidsKg, auKiloLigne, aLaTete ? e.quantite : '']);
  const maximum = maximumAnimaux(choisie, e.jeune);
  /** Choisit le détail de la vente (la ligne de l'inventaire) : la même chose que dans la liste, pour un détail choisi d'office. */
  const choisirDetail = (v: string) => {
          e.setPrecision(v);
          const nouvelle = viandes.find((x) => x.libelle === v);
          const role = nouvelle ? roleDeLaViande(nouvelle.cle) : undefined;
          // Un animal se vend à l'unité d'abord : le nombre d'animaux vaut 1 d'office.
          if (role && !e.quantite.trim()) e.setQuantite('1');
          if (role === ROLE_VIANDE.JEUNE) limiterAnimaux(maximumAnimaux(nouvelle, undefined));
          // Seul un animal vivant se vend au poids vif (réforme) : un autre détail l'annule.
          if (role !== ROLE_VIANDE.VIVANT && e.venduAuPoids) {
            e.setVenduAuPoids(false);
            e.setPrixPersonnalise(false);
          }
          if (role) totalAuKilo(e.poidsKg, prixSelonLeContact(nouvelle?.cle, nouvelle?.prix), role === ROLE_VIANDE.VIVANT && !e.venduAuPoids);
          // Des jours d'abattage à facturer : le lot se choisit d'abord (une seule étape) ; sinon, on désigne l'animal.
          if (role && joursProposes.length === 0) setQuestion(nouvelle ?? null);
          else e.setJeune(undefined);
          // Un autre détail : les animaux et les lots déjà choisis ne valent plus.
          e.setAnimaux([]);
          e.setFromages([]);
  };
  // Un jour d'abattage d'ouverture (depuis la fiche du lot) : la ligne de l'inventaire se choisit d'office — les petits (cabris) ou les adultes.
  useEffect(() => {
    if (e.precision || !e.dateAbattoir || !jourChoisi || viandes.length === 0 || !tiptagsLus) return;
    // Un jour d'abattage dans les deux mois avant la facture : d'office des cabris ; sinon, l'âge des animaux décide.
    const petits = sontDesCabris(jourChoisi.date, e.date, estPetit(jourChoisi.animaux[0]));
    const ligne =
      viandes.find((v) => roleDeLaViande(v.cle) === (petits ? ROLE_VIANDE.JEUNE : ROLE_VIANDE.SUR_PIED)) ??
      viandes.find((v) => roleDeLaViande(v.cle) !== undefined);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (ligne) choisirDetail(ligne.libelle);
    // Le détail se choisit une fois, quand le jour d'abattage et l'inventaire sont lus.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [e.precision, e.dateAbattoir, e.date, jourChoisi?.date, viandes.length, tiptagsLus]);
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
        onChange={choisirDetail}
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
              {/* Des animaux déjà à l'abattoir : un jour d'abattage est un lot, choisi en une fois avec tous ses animaux. */}
              {joursProposes.length > 0 ? (
                <SelectField<string>
                  label={TEXTES.comptabilite.nouvelleEcriture.abattoirAFacturer}
                  required
                  value={jourChoisi?.date ?? (unParUn ? UN_PAR_UN : '')}
                  placeholder={TEXTES.comptabilite.nouvelleEcriture.choisirAbattoir}
                  onChange={(valeur) => {
                    if (valeur === UN_PAR_UN) {
                      setUnParUn(true);
                      e.setDateAbattoir('');
                      e.setAnimaux([]);
                      setQuestion(choisie ?? null);
                      return;
                    }
                    setUnParUn(false);
                    choisirJour(valeur);
                  }}
                  options={[
                    ...joursProposes.map((j) => ({
                      value: j.date,
                      label: TEXTES.comptabilite.nouvelleEcriture.jourAbattu(
                        formatDateFR(j.date),
                        j.animaux.length,
                      ),
                    })),
                    { value: UN_PAR_UN, label: TEXTES.comptabilite.nouvelleEcriture.unParUn },
                  ]}
                />
              ) : null}
              {/* Le lot choisi : une ligne (le jour, le nombre d'animaux, leurs boucles et leur poids) ; le détail se déroule au besoin. */}
              {jourChoisi && animauxChoisis.length > 0 ? (
                <Card style={commonStyles.gap10}>
                  <View style={commonStyles.rowSpaceBetween}>
                    <View style={commonStyles.flex1}>
                      <Text style={commonStyles.lineSemiBold}>
                        {TEXTES.comptabilite.nouvelleEcriture.abattoirDu(formatDateFR(jourChoisi.date))}
                      </Text>
                      <Text style={commonStyles.muted}>
                        {TEXTES.comptabilite.nouvelleEcriture.lotResume(
                          animauxChoisis.length,
                          resumeBoucles(animauxChoisis),
                          poidsTotal(animauxChoisis),
                        )}
                      </Text>
                    </View>
                    <Pressable
                      onPress={retirerLot}
                      hitSlop={8}
                      accessibilityLabel={TEXTES.comptabilite.nouvelleEcriture.retirerAbattoir}
                    >
                      <Ionicons name="close-circle" size={22} color={colors.danger} />
                    </Pressable>
                  </View>
                  <Pressable onPress={() => setDetailOuvert((o) => !o)}>
                    <Text style={commonStyles.lien}>
                      {detailOuvert
                        ? TEXTES.comptabilite.nouvelleEcriture.masquerDetail
                        : TEXTES.comptabilite.nouvelleEcriture.voirDetail}
                    </Text>
                  </Pressable>
                  {detailOuvert ? (
                    <>
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
                      {abattusProposes.length > 0 ? (
                        <Pressable onPress={() => setAbattusOuvert(true)}>
                          <Text style={commonStyles.lien}>
                            {TEXTES.comptabilite.nouvelleEcriture.remettreDesAnimaux(abattusProposes.length)}
                          </Text>
                        </Pressable>
                      ) : null}
                    </>
                  ) : null}
                </Card>
              ) : null}
              {/* Sans lot à facturer (ou en choisissant un par un) : les animaux se désignent un à un. */}
              {!jourChoisi && (joursProposes.length === 0 || unParUn) ? (
                <View style={commonStyles.rowSpaceBetween}>
                  <Text style={commonStyles.lineSemiBold}>
                    {TEXTES.comptabilite.nouvelleEcriture.animauxVendus}
                    <Text style={commonStyles.required}> *</Text>
                  </Text>
                  <Pressable
                    style={commonStyles.boutonPastille}
                    onPress={() => setQuestion(choisie ?? null)}
                    accessibilityLabel={TEXTES.comptabilite.nouvelleEcriture.ajouterUnAnimal}
                  >
                    <Ionicons name="add-circle" size={28} color={colors.ajout} />
                  </Pressable>
                </View>
              ) : null}
              {!vivantLigne && animauxChoisis.some((a) => a.poidsKg === undefined) && animauxChoisis.length > 0 ? (
                <Text style={commonStyles.note}>
                  {TEXTES.comptabilite.nouvelleEcriture.poidsManquant(
                    animauxChoisis.filter((a) => a.poidsKg === undefined).length,
                  )}
                </Text>
              ) : null}
              {!jourChoisi && animauxChoisis.length > 0 ? (
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
              {/* Un animal vivant n'est pas abattu : pas de date d'abattoir (le circuit de l'abattoir est celui des animaux abattus). */}
              {animauxChoisis.length > 0 && e.avecFacture && !vivantLigne ? (
                <ChampDateAbattoir
                  dateVente={e.date}
                  value={e.dateAbattoir}
                  onChange={e.setDateAbattoir}
                  verrouille={!!jourChoisi}
                />
              ) : null}
              {/* Les animaux choisis en délai d'attente pour la viande le jour de la vente (ou de l'abattage). */}
              {animauxChoisis.length > 0 ? (
                <AvertissementDelais
                  type="viande"
                  date={e.dateAbattoir || e.date}
                  boucles={animauxChoisis.map((a) => a.numeroBoucle).filter((b): b is string => !!b)}
                />
              ) : null}
              <Text style={commonStyles.note}>
                {vivantLigne
                  ? TEXTES.comptabilite.nouvelleEcriture.animauxNoteVivants
                  : TEXTES.comptabilite.nouvelleEcriture.animauxNote}
              </Text>
            </View>
          ) : (
            <SelectField<string>
              label={TEXTES.comptabilite.nouvelleEcriture.nombreDAnimaux}
              value={e.quantite || '1'}
              onChange={e.setQuantite}
              options={optionsAnimaux}
            />
          )}
          {/* Les animaux sont remis vivants (au client) ou morts : seuls ceux qui voyagent vivants ont un document de circulation. */}
          <ChampEtatAnimaux
            reglage={reglageEtatAnimaux({
              clientAbattoir: estClientAbattoir(e.clientSelectionne),
              role: choisie ? roleDeLaViande(choisie.cle) : undefined,
              declaree: e.avecFacture,
            })}
            clientAbattoir={estClientAbattoir(e.clientSelectionne)}
            role={choisie ? roleDeLaViande(choisie.cle) : undefined}
            value={e.etatAnimaux}
            onChange={e.setEtatAnimaux}
          />
          {/* Un animal vivant de réforme se vend au kilo vif : le prix au kilo est saisi (sinon, à la tête, au prix de l'inventaire). */}
          {vivantLigne ? (
            <>
              <Checkbox
                label={TEXTES.comptabilite.nouvelleEcriture.venduAuPoids}
                value={e.venduAuPoids}
                onChange={(v) => {
                  e.setVenduAuPoids(v);
                  e.setPrixPersonnalise(v);
                }}
              />
              {e.venduAuPoids ? (
                <Text style={commonStyles.note}>{TEXTES.comptabilite.nouvelleEcriture.venduAuPoidsAide}</Text>
              ) : null}
            </>
          ) : null}
          <View style={styles.row3}>
            {/* Un animal vivant vendu à la tête n'a pas de poids : seuls le prix de l'animal, la TVA et le total comptent. */}
            {aLaTete ? null : (
            <View style={commonStyles.flex1}>
              <FormField
                label={vivantLigne ? TEXTES.comptabilite.nouvelleEcriture.poidsEstime : TEXTES.commun.general.poidsKg}
                required
                value={e.poidsKg}
                onChangeText={(v) => {
                  e.setPoidsKg(v);
                  totalAuKilo(v);
                }}
                editable={!poidsDuLotVerrouille}
                style={poidsDuLotVerrouille ? commonStyles.verrouille : undefined}
                aide={poidsDuLotVerrouille ? TEXTES.comptabilite.nouvelleEcriture.poidsDuLot : undefined}
                keyboardType="decimal-pad"
                placeholder={TEXTES.comptabilite.nouvelleEcriture.ex2}
              />
            </View>
            )}
            <View style={commonStyles.flex1}>
              {/* Le prix unitaire vient du stock ; « Prix du produit personnalisé » le remplace, pour cette vente seulement. */}
              <FormField
                label={aLaTete ? TEXTES.comptabilite.nouvelleEcriture.prixUnitaireAnimal : TEXTES.comptabilite.nouvelleEcriture.prixUnitaireKg}
                value={e.prixPersonnalise ? e.prixUnitaireSaisi : prixDuDetail ? prixDuDetail.toFixed(2).replace('.', ',') : ''}
                onChangeText={e.setPrixUnitaireSaisi}
                editable={e.prixPersonnalise}
                placeholder={prixDuDetail ? prixDuDetail.toFixed(2).replace('.', ',') : ''}
                style={e.prixPersonnalise ? undefined : commonStyles.verrouille}
                keyboardType="decimal-pad"
              />
            </View>
            <View style={commonStyles.flex1}>
              <ChampTauxTvaVente e={e} />
            </View>
          </View>
          <ChampPrixPersonnalise e={e} unite={aLaTete ? 'piece' : 'kg'} prixInventaire={prixDuDetail} sansChamp />
          {/* Le prix total est calculé (poids × prix au kilo, ou prix de l'animal × leur nombre) : on ne le saisit pas. */}
          <FormField
            label={TEXTES.comptabilite.nouvelleEcriture.prixTotalTtc}
            required
            value={e.montant}
            onChangeText={e.setMontant}
            editable={e.prixLibre || e.prixPersonnalise}
            keyboardType="decimal-pad"
            style={e.prixLibre || e.prixPersonnalise ? undefined : commonStyles.verrouille}
          />
          {/* Vente offerte : le bouton « Cadeau » des animaux (actif d'office) ; désactivé, ils sont facturés. */}
          {e.offert ? (
            <BoutonCadeau
              actif={e.cadeauProduit}
              onChange={e.setCadeauProduit}
              ligne={TEXTES.comptabilite.nouvelleEcriture.cadeauAnimaux}
            />
          ) : null}
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
                editable={e.prixLibre || e.prixPersonnalise}
              />
            </View>
            <View style={commonStyles.flex1}>
              <ChampTauxTvaVente e={e} />
            </View>
          </View>
          <ChampPrixPersonnalise e={e} unite="piece" prixInventaire={prixDuDetail} />
        </>
      )}
      {parAnimal && !vivantLigne && e.fraisAbattoirAffiches ? (
        <ChampFraisAbattoir
          valeur={e.fraisAbattoir}
          taux={e.tauxTvaFrais}
          onTaux={e.setTauxTvaFrais}
          tauxParDefaut={e.tauxTvaVente}
          montantViande={e.offert && e.cadeauProduit ? 0 : parseDecimal(e.montant)}
          cadeau={e.offert ? { actif: e.cadeauFrais, onChange: e.setCadeauFrais } : undefined}
          proposition={propositionFrais?.montant}
          duLot={!!jourChoisi}
          onFacturer={(facturer) => {
            setFraisRefactures(facturer);
            e.setFraisAbattoir(
              facturer && propositionFrais ? String(propositionFrais.montant).replace('.', ',') : '',
            );
          }}
        />
      ) : null}
      {e.prixLibre ? (
        <Text style={commonStyles.note}>{TEXTES.comptabilite.nouvelleEcriture.prixLibreRecolteur}</Text>
      ) : choisie && !prixDuDetail && !e.prixPersonnalise ? (
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
      {/* Les animaux vivants : des cases à cocher (ceux déjà choisis sont cochés) ; on valide d'un coup. */}
      <SelectModalMultiple<string>
        key={`vivants-${!!question}-${e.animaux.join(',')}`}
        visible={!!question}
        titre={TEXTES.comptabilite.nouvelleEcriture.animalVendu(question?.libelle ?? '')}
        options={animauxACocher.map((a) => ({ value: a.id, label: libelleAnimal(a) }))}
        initiales={e.animaux}
        libelleValider={TEXTES.comptabilite.nouvelleEcriture.ajouterLesAnimaux}
        onValider={choisirAnimaux}
        onClose={() => setQuestion(null)}
      />
    </>
  );
}
