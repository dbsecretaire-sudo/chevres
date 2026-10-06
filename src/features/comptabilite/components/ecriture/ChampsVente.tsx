import { useEffect, useRef, useState } from 'react';
import { Modal, Pressable, Text, View } from 'react-native';
import { formatMontant } from '@/shared/utils/dates';
import { parseDecimal } from '@/shared/utils/nombres';
import { useRouter } from 'expo-router';
import { SelectFieldEditable } from '@/shared/components/SelectFieldEditable';
import { useAdresseCourante } from '@/shared/hooks/useAdresseCourante';
import { useNiveauxStock } from '@/features/stock/hooks/useNiveauxStock';
import { useViandesDuStock } from '@/features/stock/hooks/useViandesDuStock';
import {
  cleJeunes,
  roleDeLaViande,
  type ArticleAffiche,
  type FiltreStock,
} from '@/features/stock/services/stock';
import { DICTIONNAIRE_ANIMAUX, especeCourante, type EspeceAnimale } from '@/shared/dictionnaire/animaux';
import { ACTIVITE_COMMUNE } from '@/shared/constants/etablissements';
import { ROUTES } from '@/shared/constants/routes';
import { Button } from '@/shared/components/Button';
import { FormField } from '@/shared/components/FormField';
import { SelectField } from '@/shared/components/SelectField';
import { ChampMontantTtc } from '@/features/comptabilite/components/ecriture/ChampsEcriture';
import type { EtatNouvelleEcriture } from '@/features/comptabilite/hooks/useNouvelleEcriture';
import { OPTIONS_TAUX_TVA } from '@/features/comptabilite/utils/tva';
import type { TypeAide, TypeFromage } from '@/features/comptabilite/types';
import { useFromagesDuStock } from '@/features/stock/hooks/useFromagesDuStock';
import { TYPE_AIDE, TYPE_FROMAGE } from '@/shared/constants/comptabilite';
import { PREFIXE_FROMAGE_AJOUTE, ROLE_VIANDE } from '@/shared/constants/stock';
import { styles } from '@/shared/styles/comptabilite/NouvelleEcriture.styles';
import { commonStyles } from '@/shared/styles/commonStyles';
import { TEXTES } from '@/shared/textes';
import { LABEL_TYPE_AIDE, LABEL_TYPE_FROMAGE } from '@/shared/textes/libelles';

type Props = { e: EtatNouvelleEcriture };

const OPTIONS_TYPE_AIDE = Object.entries(LABEL_TYPE_AIDE).map(([value, label]) => ({
  value: value as TypeAide,
  label,
}));
const OPTIONS_TYPE_FROMAGE = Object.entries(LABEL_TYPE_FROMAGE).map(([value, label]) => ({
  value: value as TypeFromage,
  label,
}));

/**
 * Préremplit le prix total d'une vente avec le prix de vente de l'article (fixé dans le stock) × la quantité. Un prix saisi à
 * la main n'est jamais écrasé : seul un prix vide ou celui qu'on avait proposé se met à jour.
 */
function useMontantParDefaut(e: EtatNouvelleEcriture) {
  const derniereProposition = useRef('');
  return (prixUnitaire: number | undefined, quantite: string) => {
    const nombre = parseDecimal(quantite);
    if (!prixUnitaire || !(nombre > 0)) return;
    if (e.montant.trim() !== '' && e.montant !== derniereProposition.current) return;
    const total = (Math.round(prixUnitaire * nombre * 100) / 100).toFixed(2).replace('.', ',');
    derniereProposition.current = total;
    e.setMontant(total);
  };
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
          <FormField
            label={TEXTES.comptabilite.nouvelleEcriture.tauxDImposition}
            value={e.tauxImpositionLibre}
            onChangeText={e.setTauxImpositionLibre}
            keyboardType="decimal-pad"
            placeholder="0-100"
          />
        </View>
      </View>
      <Text style={commonStyles.note}>{TEXTES.comptabilite.nouvelleEcriture.partDuMontantIncluseDans}</Text>
    </>
  );
}

/** Vente de lait : litrage, prix (facultatif) et TVA. */
export function ChampsVenteLait({ e }: Props) {
  return (
    <>
      <FormField
        label={TEXTES.comptabilite.nouvelleEcriture.litrage}
        required
        value={e.quantite}
        onChangeText={e.setQuantite}
        keyboardType="decimal-pad"
        placeholder={TEXTES.comptabilite.nouvelleEcriture.ex125}
      />
      <View style={commonStyles.row}>
        <View style={commonStyles.flex1}>
          <ChampMontantTtc
            label={TEXTES.comptabilite.nouvelleEcriture.prixTotalTtc}
            value={e.montant}
            onChange={e.setMontant}
            required={false}
            placeholder={TEXTES.commun.general.facultatif}
          />
        </View>
        <View style={commonStyles.flex1}>
          <ChampTauxTvaVente e={e} />
        </View>
      </View>
    </>
  );
}

/** Vente de fromage (à la pièce) : type, nombre de sacs, quantité, prix et TVA. */
export function ChampsVenteFromage({ e }: Props) {
  // Les types de fromage viennent du stock : un fromage ajouté là se vend ici, à sa place dans la liste.
  const fromages = useFromagesDuStock();
  const options =
    fromages.length > 0
      ? fromages.map((f) => ({
          value: f.id ? `${PREFIXE_FROMAGE_AJOUTE}${f.id}` : f.cle.split(':')[1],
          label: f.libelle,
        }))
      : OPTIONS_TYPE_FROMAGE;
  const proposerMontant = useMontantParDefaut(e);
  const valeurDe = (f: (typeof fromages)[number]) =>
    f.id ? `${PREFIXE_FROMAGE_AJOUTE}${f.id}` : f.cle.split(':')[1];
  const ajouteChoisi = fromages.find(
    (f) =>
      f.id &&
      e.typeFromage === TYPE_FROMAGE.AUTRE &&
      e.typeFromageLibre.trim().toLowerCase() === f.libelle.trim().toLowerCase(),
  );
  /** Le prix de vente défini au stock pour le fromage choisi (le premier par défaut), s'il y en a un. */
  const prixDuChoix = fromages.find(
    (f) => valeurDe(f) === (ajouteChoisi ? valeurDe(ajouteChoisi) : e.typeFromage),
  )?.prix;
  // Dès que le fromage et son prix sont connus, le prix total est proposé (pour 1 tant qu'aucune quantité n'est saisie).
  useEffect(() => {
    if (prixDuChoix && e.montant.trim() === '') proposerMontant(prixDuChoix, e.quantite || '1');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prixDuChoix]);
  /** Un fromage ajouté se note comme « autre » avec son nom : c'est ainsi que la vente retrouve son stock. */
  const choisirFromage = (valeur: string) => {
    proposerMontant(fromages.find((f) => valeurDe(f) === valeur)?.prix, e.quantite || '1');
    if (valeur.startsWith(PREFIXE_FROMAGE_AJOUTE)) {
      const ajoute = fromages.find((f) => f.id === valeur.slice(PREFIXE_FROMAGE_AJOUTE.length));
      e.setTypeFromage(TYPE_FROMAGE.AUTRE);
      e.setTypeFromageLibre(ajoute?.libelle ?? '');
    } else {
      e.setTypeFromage(valeur as TypeFromage);
      e.setTypeFromageLibre('');
    }
  };

  return (
    <>
      <View style={commonStyles.row}>
        <View style={commonStyles.flex1}>
          <SelectField
            label={TEXTES.comptabilite.nouvelleEcriture.typeDeFromage}
            required
            value={ajouteChoisi ? `${PREFIXE_FROMAGE_AJOUTE}${ajouteChoisi.id}` : e.typeFromage}
            onChange={choisirFromage}
            options={options}
          />
        </View>
        <View style={commonStyles.flex1}>
          <FormField
            label={TEXTES.comptabilite.nouvelleEcriture.nombreDeSacs}
            value={e.sacs}
            onChangeText={e.setSacs}
            keyboardType="number-pad"
            placeholder={TEXTES.commun.general.facultatif}
          />
        </View>
      </View>
      {e.typeFromage === TYPE_FROMAGE.AUTRE && !ajouteChoisi && (
        <FormField
          label={TEXTES.comptabilite.nouvelleEcriture.preciserLeType}
          value={e.typeFromageLibre}
          onChangeText={e.setTypeFromageLibre}
        />
      )}
      <View style={styles.row3}>
        <View style={commonStyles.flex1}>
          <FormField
            label={TEXTES.commun.general.quantite}
            required
            value={e.quantite}
            onChangeText={(v) => {
              e.setQuantite(v);
              proposerMontant(prixDuChoix, v);
            }}
            keyboardType="decimal-pad"
            placeholder={TEXTES.comptabilite.nouvelleEcriture.ex2}
          />
        </View>
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
      {prixDuChoix ? (
        <Text style={commonStyles.note}>
          {TEXTES.comptabilite.nouvelleEcriture.prixDuStock(formatMontant(prixDuChoix))}
        </Text>
      ) : null}
    </>
  );
}

/** Vente de cabris : nombre, poids (facultatif), prix et TVA. */
export function ChampsVenteCabris({ e }: Props) {
  return (
    <>
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

/** Commentaire facultatif pour préciser de quoi il s'agissait. */
function ChampPrecision({ e }: Props) {
  return (
    <FormField
      label={TEXTES.comptabilite.nouvelleEcriture.precision}
      value={e.precision}
      onChangeText={e.setPrecision}
      placeholder={TEXTES.comptabilite.nouvelleEcriture.precisionPlaceholder}
    />
  );
}

/**
 * Vente de viande, de charcuterie ou d'animaux : le détail de la vente se choisit dans la liste du stock (le crayon y mène),
 * avec la quantité, le prix et la TVA. Tant que le stock n'a rien à proposer, la précision reste libre.
 */
export function ChampsVenteViande({ e }: Props) {
  const router = useRouter();
  const retour = useAdresseCourante();
  const viandes = useViandesDuStock(
    e.activite === ACTIVITE_COMMUNE ? undefined : (e.activite as FiltreStock),
  );
  const proposerMontant = useMontantParDefaut(e);
  const niveaux = useNiveauxStock();
  const choisie = viandes.find((x) => x.libelle === e.precision);
  const prixDuDetail = choisie?.prix;
  /** Les animaux (petits, sur pied, vivants) se vendent au kilo ; la charcuterie et les autres lignes, à la quantité. */
  const auKilo = !!choisie && roleDeLaViande(choisie.cle) !== undefined;
  /** Un animal sur pied ou vivant vient d'être choisi : on demande s'il s'agit d'un petit ou d'un adulte. */
  const [question, setQuestion] = useState<ArticleAffiche | null>(null);
  const espece: EspeceAnimale =
    e.activite === ACTIVITE_COMMUNE ? especeCourante() : (e.activite as EspeceAnimale);
  const petit = DICTIONNAIRE_ANIMAUX[espece].petit.singulier;
  /** Prix total d'un animal vendu au kilo : le poids × le prix au kilo du stock (pour 1 kg tant qu'aucun poids n'est saisi). */
  const totalAuKilo = (poids: string, prixAuKilo = prixDuDetail) => {
    if (!prixAuKilo) return;
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
  const repondre = (jeune: boolean) => {
    e.setJeune(jeune);
    limiterAnimaux(maximumAnimaux(question ?? undefined, jeune));
    setQuestion(null);
  };
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
        required={viandes.length > 0}
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
          else proposerMontant(nouvelle?.prix, e.quantite || '1');
          if (role === ROLE_VIANDE.SUR_PIED || role === ROLE_VIANDE.VIVANT) setQuestion(nouvelle ?? null);
          else e.setJeune(undefined);
        }}
        options={viandes.map((v) => ({ value: v.libelle, label: v.libelle }))}
        onEdit={() =>
          router.push(
            ROUTES.stockDepuis(retour, 'viande', e.activite === ACTIVITE_COMMUNE ? undefined : e.activite),
          )
        }
      />
      {viandes.length === 0 ? (
        <Text style={commonStyles.note}>{TEXTES.comptabilite.nouvelleEcriture.aucuneViandeAuStock}</Text>
      ) : null}
      {auKilo ? (
        <>
          <SelectField<string>
            label={TEXTES.comptabilite.nouvelleEcriture.nombreDAnimaux}
            value={e.quantite || '1'}
            onChange={e.setQuantite}
            options={optionsAnimaux}
          />
          <View style={styles.row3}>
            <View style={commonStyles.flex1}>
              <FormField
                label={TEXTES.commun.general.poidsKg}
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
            editable={false}
            style={commonStyles.verrouille}
          />
        </>
      ) : (
        <View style={styles.row3}>
          <View style={commonStyles.flex1}>
            <FormField
              label={TEXTES.commun.general.quantite}
              value={e.quantite}
              onChangeText={(v) => {
                e.setQuantite(v);
                proposerMontant(prixDuDetail, v || '1');
              }}
              keyboardType="decimal-pad"
              placeholder="1"
            />
          </View>
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
      )}
      {e.jeune !== undefined ? (
        <Text style={commonStyles.note}>
          {e.jeune
            ? TEXTES.comptabilite.nouvelleEcriture.petitNote(petit)
            : TEXTES.comptabilite.nouvelleEcriture.adulteNote}
        </Text>
      ) : null}
      {prixDuDetail ? (
        <Text style={commonStyles.note}>
          {auKilo ? null : TEXTES.comptabilite.nouvelleEcriture.prixDuStock(formatMontant(prixDuDetail))}
        </Text>
      ) : null}
      {viandes.length === 0 ? <ChampPrecision e={e} /> : null}

      <Modal visible={!!question} transparent animationType="fade" onRequestClose={() => setQuestion(null)}>
        <Pressable style={commonStyles.backdrop} onPress={() => setQuestion(null)}>
          <Pressable style={commonStyles.modalSheet} onPress={(ev) => ev.stopPropagation()}>
            <Text style={commonStyles.subheading}>
              {TEXTES.comptabilite.nouvelleEcriture.petitOuAdulte(question?.libelle ?? '', petit)}
            </Text>
            <View style={commonStyles.row}>
              <Button
                style={commonStyles.flex1}
                label={TEXTES.comptabilite.nouvelleEcriture.unPetit(petit)}
                onPress={() => repondre(true)}
              />
              <Button
                style={commonStyles.flex1}
                variant="secondary"
                label={TEXTES.comptabilite.nouvelleEcriture.adulte}
                onPress={() => repondre(false)}
              />
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

/** Vente d'œufs : nombre d'œufs, prix et TVA. */
export function ChampsVenteOeufs({ e }: Props) {
  return (
    <>
      <FormField
        label={TEXTES.comptabilite.nouvelleEcriture.nombreDOeufs}
        required
        value={e.quantite}
        onChangeText={e.setQuantite}
        keyboardType="decimal-pad"
        placeholder={TEXTES.comptabilite.nouvelleEcriture.ex2}
      />
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

/** Vente d'un animal sur pied ou vivant : nombre de têtes, poids (facultatif), prix, TVA et précision facultative. */
export function ChampsVenteAnimal({ e }: Props) {
  return (
    <>
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
      <ChampPrecision e={e} />
    </>
  );
}
