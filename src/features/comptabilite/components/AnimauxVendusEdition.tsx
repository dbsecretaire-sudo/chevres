import { useCallback, useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '@/shared/components/Card';
import { ChampDateAbattoir } from '@/features/comptabilite/components/ChampDateAbattoir';
import { SelectField } from '@/shared/components/SelectField';
import { SelectModal } from '@/shared/components/SelectModal';
import { SelectModalMultiple } from '@/shared/components/SelectModalMultiple';
import {
  estPetitLe,
  getChevre,
  listAnimauxAbattusDe,
  listAnimauxVivantsDe,
} from '@/features/cheptel/repository/chevres';
import type { Chevre } from '@/features/cheptel/types';
import { poidsTotal } from '@/features/cheptel/utils/poids';
import { useFraisAbattoir } from '@/features/exploitation/hooks/useFraisAbattoir';
import { listToutesVentes } from '@/features/comptabilite/repository/ventes';
import type { Vente } from '@/features/comptabilite/types';
import { activiteVente } from '@/features/comptabilite/utils/activite';
import {
  joursAbattusAFacturer,
  libelleAnimalVendu,
  resumeBoucles,
  roleDuDetailDeVente,
  UN_PAR_UN,
  type JourAbattu,
} from '@/features/comptabilite/utils/animauxVendus';
import { idsDesAnimaux, venteADeclarer } from '@/features/comptabilite/utils/ventes';
import { CATEGORIE_VENTE, SEPARATEUR_ANIMAUX } from '@/shared/constants/comptabilite';
import { ACTIVITE_COMMUNE } from '@/shared/constants/etablissements';
import { ROLE_VIANDE } from '@/shared/constants/stock';
import { especeCourante, type EspeceAnimale } from '@/shared/dictionnaire/animaux';
import { colors } from '@/shared/theme/colors';
import { commonStyles } from '@/shared/styles/commonStyles';
import { TEXTES } from '@/shared/textes';
import { formatDateFR } from '@/shared/utils/dates';

const T = TEXTES.comptabilite.nouvelleEcriture;

interface Props {
  form: Vente;
  onChange: (form: Vente) => void;
}

/**
 * Les animaux d'une vente en cours de modification, comme à la création : un jour d'abattage est un lot (« Abattoir du … »), pris d'un
 * coup avec tous ses animaux et affiché sur une seule ligne (le détail se déroule pour en retirer) ; les animaux vivants se désignent
 * un par un avec le +. Le poids des fiches remplit le poids de la vente, et le prix suit. Rien quand le détail de la vente n'est pas
 * un animal.
 */
export function AnimauxVendusEdition({ form, onChange }: Props) {
  const activite = activiteVente(form);
  const espece = (activite === ACTIVITE_COMMUNE ? especeCourante() : activite) as EspeceAnimale;
  const [role, setRole] = useState<string | undefined>();
  const [vivants, setVivants] = useState<Chevre[]>([]);
  const [choisis, setChoisis] = useState<Chevre[]>([]);
  const [jours, setJours] = useState<JourAbattu[]>([]);
  const [ouvert, setOuvert] = useState(false);
  const [abattusOuvert, setAbattusOuvert] = useState(false);
  const [unParUn, setUnParUn] = useState(false);
  const [detailOuvert, setDetailOuvert] = useState(false);
  const ids = idsDesAnimaux(form);
  const cle = ids.join(SEPARATEUR_ANIMAUX);
  const fraisDuJour = useFraisAbattoir();

  useEffect(() => {
    roleDuDetailDeVente(activite, form.precision).then(setRole);
  }, [activite, form.precision]);

  useFocusEffect(
    useCallback(() => {
      listAnimauxVivantsDe(espece).then(setVivants);
      // Les jours d'abattage à facturer : les animaux de cette vente y restent (ils sont à elle).
      Promise.all([listAnimauxAbattusDe(espece), listToutesVentes()]).then(([abattus, ventes]) =>
        setJours(joursAbattusAFacturer(abattus, ventes, form.id)),
      );
    }, [espece, form.id]),
  );

  useEffect(() => {
    Promise.all(cle.split(SEPARATEUR_ANIMAUX).filter(Boolean).map(getChevre)).then((trouves) =>
      setChoisis(trouves.filter((a): a is Chevre => !!a)),
    );
  }, [cle]);

  if (!role) return null;
  const petits = role === ROLE_VIANDE.JEUNE;
  const declaree = venteADeclarer(form);
  // Vente déclarée (facture) : l'animal a obligatoirement une boucle ; sinon, il n'en a pas.
  const proposes = vivants.filter(
    (a) => !ids.includes(a.id) && estPetitLe(a, form.date) === petits && !!a.numeroBoucle === declaree,
  );
  const joursProposes = jours
    .map((j) => ({ date: j.date, animaux: j.animaux.filter((a) => !!a.numeroBoucle === declaree) }))
    .filter((j) => j.animaux.length > 0);
  /** Le lot de la vente : un jour d'abattage dont tous les animaux choisis font partie. */
  const jourChoisi = joursProposes.find(
    (j) =>
      j.date === form.dateAbattoir && choisis.length > 0 && choisis.every((a) => j.animaux.some((x) => x.id === a.id)),
  );
  const abattusProposes = (jourChoisi?.animaux ?? []).filter((a) => !ids.includes(a.id));

  /** Applique la liste d'animaux : leur nombre, leur âge et, quand chacun a son poids, le poids de la vente (le prix suit). */
  const appliquer = (liste: Chevre[], supplement: Partial<Vente> = {}) => {
    const poids = poidsTotal(liste);
    // Les frais d'abattoir du lot : proposés pour la part des animaux de la vente.
    const jour = 'dateAbattoir' in supplement ? supplement.dateAbattoir : form.dateAbattoir;
    const frais = liste.length > 0 ? fraisDuJour(jour, liste.length) : undefined;
    onChange({
      ...form,
      animaux: liste.length > 0 ? liste.map((a) => a.id).join(SEPARATEUR_ANIMAUX) : undefined,
      quantite: Math.max(1, liste.length),
      jeune: liste.length > 0 && petits ? true : undefined,
      ...(poids !== undefined ? { poidsKg: poids } : {}),
      ...(frais ? { fraisAbattoir: frais.montant, tauxTvaFrais: frais.tauxTva ?? form.tauxTvaFrais } : {}),
      ...(liste.length === 0 ? { fraisAbattoir: undefined, tauxTvaFrais: undefined } : {}),
      ...supplement,
    });
  };
  /** Prend tout le lot d'un jour d'abattage. */
  const choisirJour = (date: string) => {
    const jour = joursProposes.find((j) => j.date === date);
    if (jour) appliquer(jour.animaux, { dateAbattoir: date });
  };

  return (
    <View style={commonStyles.gap6}>
      {/* Des animaux déjà à l'abattoir : un jour d'abattage est un lot, choisi en une fois avec tous ses animaux. */}
      {joursProposes.length > 0 ? (
        <SelectField<string>
          label={T.abattoirAFacturer}
          required
          value={jourChoisi?.date ?? (unParUn ? UN_PAR_UN : '')}
          placeholder={T.choisirAbattoir}
          onChange={(valeur) => {
            if (valeur === UN_PAR_UN) {
              setUnParUn(true);
              appliquer([], { dateAbattoir: undefined });
              setOuvert(true);
              return;
            }
            setUnParUn(false);
            choisirJour(valeur);
          }}
          options={[
            ...joursProposes.map((j) => ({
              value: j.date,
              label: T.jourAbattu(formatDateFR(j.date), j.animaux.length),
            })),
            { value: UN_PAR_UN, label: T.unParUn },
          ]}
        />
      ) : null}
      {/* Le lot : une ligne (le jour, le nombre d'animaux, leurs boucles et leur poids) ; le détail se déroule au besoin. */}
      {jourChoisi && choisis.length > 0 ? (
        <Card style={commonStyles.gap10}>
          <View style={commonStyles.rowSpaceBetween}>
            <View style={commonStyles.flex1}>
              <Text style={commonStyles.lineSemiBold}>{T.abattoirDu(formatDateFR(jourChoisi.date))}</Text>
              <Text style={commonStyles.muted}>{T.lotResume(choisis.length, resumeBoucles(choisis), poidsTotal(choisis))}</Text>
            </View>
            <Pressable
              onPress={() => {
                appliquer([], { dateAbattoir: undefined });
                setDetailOuvert(false);
              }}
              hitSlop={8}
              accessibilityLabel={T.retirerAbattoir}
            >
              <Ionicons name="close-circle" size={22} color={colors.danger} />
            </Pressable>
          </View>
          <Pressable onPress={() => setDetailOuvert((o) => !o)}>
            <Text style={commonStyles.lien}>{detailOuvert ? T.masquerDetail : T.voirDetail}</Text>
          </Pressable>
          {detailOuvert ? (
            <>
              {choisis.map((animal) => (
                <View key={animal.id} style={commonStyles.rowSpaceBetween}>
                  <Text style={commonStyles.valueText}>{libelleAnimalVendu(animal)}</Text>
                  <Pressable
                    onPress={() => appliquer(choisis.filter((a) => a.id !== animal.id))}
                    hitSlop={8}
                    accessibilityLabel={T.retirerAnimal}
                  >
                    <Ionicons name="close-circle" size={22} color={colors.danger} />
                  </Pressable>
                </View>
              ))}
              {abattusProposes.length > 0 ? (
                <Pressable onPress={() => setAbattusOuvert(true)}>
                  <Text style={commonStyles.lien}>{T.remettreDesAnimaux(abattusProposes.length)}</Text>
                </Pressable>
              ) : null}
            </>
          ) : null}
        </Card>
      ) : null}
      {/* Sans lot à facturer (ou en choisissant un par un) : les animaux se désignent un à un. */}
      {!jourChoisi && (joursProposes.length === 0 || unParUn) ? (
        <>
          <View style={commonStyles.rowSpaceBetween}>
            <Text style={commonStyles.lineSemiBold}>
              {T.animauxVendus}
              <Text style={commonStyles.required}> *</Text>
            </Text>
            <Pressable style={commonStyles.boutonPastille} onPress={() => setOuvert(true)} accessibilityLabel={T.ajouterUnAnimal}>
              <Ionicons name="add-circle" size={28} color={colors.ajout} />
            </Pressable>
          </View>
          {choisis.length > 0 ? (
            <Card style={commonStyles.gap10}>
              {choisis.map((animal) => (
                <View key={animal.id} style={commonStyles.rowSpaceBetween}>
                  <Text style={commonStyles.valueText}>{libelleAnimalVendu(animal)}</Text>
                  <Pressable
                    onPress={() => appliquer(choisis.filter((a) => a.id !== animal.id))}
                    hitSlop={8}
                    accessibilityLabel={T.retirerAnimal}
                  >
                    <Ionicons name="close-circle" size={22} color={colors.danger} />
                  </Pressable>
                </View>
              ))}
            </Card>
          ) : null}
        </>
      ) : null}
      {choisis.some((a) => a.poidsKg === undefined) && choisis.length > 0 ? (
        <Text style={commonStyles.note}>{T.poidsManquant(choisis.filter((a) => a.poidsKg === undefined).length)}</Text>
      ) : null}
      {!jourChoisi && ids.length > 0 && form.categorie === CATEGORIE_VENTE.VIANDE && declaree ? (
        <ChampDateAbattoir
          dateVente={form.date}
          value={form.dateAbattoir}
          onChange={(dateAbattoir) => onChange({ ...form, dateAbattoir })}
        />
      ) : null}
      {/* Les animaux d'un jour d'abattage retirés : on les remet (tous cochés d'office, ou une plage de numéros). */}
      <SelectModalMultiple<string>
        key={`${form.dateAbattoir ?? ''}-${abattusProposes.length}`}
        visible={abattusOuvert}
        titre={T.animauxAbattusLe(formatDateFR(jourChoisi?.date))}
        options={abattusProposes.map((a) => ({ value: a.id, label: libelleAnimalVendu(a) }))}
        initiales={abattusProposes.map((a) => a.id)}
        libelleValider={T.ajouterLesAnimaux}
        onValider={(valeurs) => {
          setAbattusOuvert(false);
          appliquer([...choisis, ...abattusProposes.filter((a) => valeurs.includes(a.id))]);
        }}
        onClose={() => setAbattusOuvert(false)}
        numeroDe={(id) => {
          const chiffres = /(\d+)$/.exec(abattusProposes.find((a) => a.id === id)?.numeroBoucle ?? '');
          return chiffres ? Number(chiffres[1]) : undefined;
        }}
      />
      <SelectModal<string>
        visible={ouvert}
        titre={T.animalVendu(form.precision ?? '')}
        value=""
        options={proposes.map((a) => ({ value: a.id, label: libelleAnimalVendu(a) }))}
        onSelect={(id) => {
          const animal = proposes.find((a) => a.id === id);
          if (animal) appliquer([...choisis, animal]);
          setOuvert(false);
        }}
        onClose={() => setOuvert(false)}
        searchable
      />
    </View>
  );
}
