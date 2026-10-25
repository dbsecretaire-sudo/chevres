import { Text, View } from 'react-native';
import { Checkbox } from '@/shared/components/Checkbox';
import { FormField } from '@/shared/components/FormField';
import { SelectField } from '@/shared/components/SelectField';
import { comparerAlphabetique } from '@/shared/utils/personne';
import { ChampCircuit } from '@/features/commercial/components/ChampCircuit';
import type { FormulaireContact } from '@/features/contacts/services/fiche';
import { CATEGORIES_ASSOCIATION } from '@/shared/constants/fournisseurs';
import { VOLET_COOPERATIVE } from '@/shared/constants/comptabilite';
import { LABEL_VOLET_COOPERATIVE } from '@/shared/textes/libelles';
import { commonStyles } from '@/shared/styles/commonStyles';
import { TEXTES } from '@/shared/textes';

const T = TEXTES.contacts.formulaire;

interface Props {
  form: FormulaireContact;
  onChange: (form: FormulaireContact) => void;
  /** Les catégories qu'on peut choisir (celles des clients et des fournisseurs, une ligne par identifiant). */
  categories: { id: string; nom: string }[];
}

/**
 * Les champs d'un contact, pour sa création et sa modification : sa catégorie (une seule), son nom, ses coordonnées, et les cases qui
 * disent s'il reçoit des recettes (client), fait des dépenses (fournisseur), ou les deux. Le SIRET, la TVA et le RIB, qui servent aux
 * dépenses, n'apparaissent que si « dépenses » est coché.
 */
export function FormulaireContactChamps({ form, onChange, categories }: Props) {
  const maj = (patch: Partial<FormulaireContact>) => onChange({ ...form, ...patch });
  return (
    <>
      {/* Une seule ligne : recettes et dépenses, cochées l'une ou l'autre. */}
      <View style={commonStyles.row}>
        <View style={commonStyles.flex1}>
          <Checkbox label={T.recettes} value={form.recettes} onChange={(recettes) => maj({ recettes })} />
        </View>
        <View style={commonStyles.flex1}>
          <Checkbox label={T.depenses} value={form.depenses} onChange={(depenses) => maj({ depenses })} />
        </View>
      </View>

      <SelectField
        label={T.categorie}
        required
        value={form.categorie}
        placeholder={T.choisirCategorie}
        onChange={(categorie) => maj({ categorie })}
        options={[...categories]
          .sort((a, b) => comparerAlphabetique(a.nom, b.nom))
          .map((c) => ({ value: c.id, label: c.nom }))}
        searchable
        aide={T.aideCategorie}
      />
      {/* Une association ou une coopérative agricole : ce qu'elle fait pour l'exploitation ; ses écritures ne proposent que ces volets. */}
      {CATEGORIES_ASSOCIATION.includes(form.categorie) ? (
        <>
          <Text style={commonStyles.lineSemiBold}>{T.volets}</Text>
          <Text style={commonStyles.note}>{T.aideVolets}</Text>
          {Object.values(VOLET_COOPERATIVE).map((v) => (
            <Checkbox
              key={v}
              label={LABEL_VOLET_COOPERATIVE[v]}
              value={form.volets.includes(v)}
              onChange={(coche) =>
                maj({ volets: coche ? [...form.volets, v] : form.volets.filter((x) => x !== v) })
              }
            />
          ))}
        </>
      ) : null}
      {/* Un contact qui reçoit des recettes a son circuit de vente privilégié : ses ventes, ses réservations et ses commandes le reprennent. */}
      {form.recettes ? (
        <ChampCircuit
          label={T.circuitPrivilegie}
          aide={T.aideCircuit}
          required
          value={form.circuit}
          onChange={(circuit) => maj({ circuit })}
        />
      ) : null}
      <FormField label={T.nom} required value={form.nom} onChangeText={(nom) => maj({ nom })} />
      <FormField
        label={T.prenom}
        value={form.prenom}
        onChangeText={(prenom) => maj({ prenom })}
        placeholder={T.facultatif}
      />
      <FormField
        label={T.personne}
        value={form.personne}
        onChangeText={(personne) => maj({ personne })}
        placeholder={T.facultatif}
      />
      {form.depenses ? (
        <>
          <FormField
            label={T.siret}
            value={form.siret}
            onChangeText={(siret) => maj({ siret })}
            keyboardType="number-pad"
            placeholder={T.facultatif}
          />
          <FormField
            label={T.tva}
            value={form.tva}
            onChangeText={(tva) => maj({ tva })}
            placeholder={T.facultatif}
          />
          <FormField
            label={T.rib}
            value={form.rib}
            onChangeText={(rib) => maj({ rib })}
            placeholder={T.facultatif}
          />
        </>
      ) : null}
      <FormField
        label={T.adresse}
        value={form.adressePostale}
        onChangeText={(adressePostale) => maj({ adressePostale })}
        multiline
        style={commonStyles.textarea}
        placeholder={T.facultatif}
      />
      <FormField
        label={T.telephone}
        value={form.telephone}
        onChangeText={(telephone) => maj({ telephone })}
        keyboardType="phone-pad"
        placeholder={T.facultatif}
      />
      <FormField
        label={T.email}
        value={form.email}
        onChangeText={(email) => maj({ email })}
        keyboardType="email-address"
        autoCapitalize="none"
        placeholder={T.facultatif}
      />
    </>
  );
}
