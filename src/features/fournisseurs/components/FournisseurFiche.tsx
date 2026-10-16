import { Text, View } from 'react-native';
import { Button } from '@/shared/components/Button';
import { Card } from '@/shared/components/Card';
import { FormField } from '@/shared/components/FormField';
import type { Fournisseur } from '@/features/fournisseurs/types';
import { ChampCategorieFournisseur } from '@/features/fournisseurs/components/ChampCategorieFournisseur';
import { categorieFournisseurDe } from '@/shared/dictionnaire/categoriesFournisseur';
import { commonStyles } from '@/shared/styles/commonStyles';
import { TEXTES } from '@/shared/textes';

/** Fiche d'un fournisseur en lecture seule. */
export function FournisseurLecture({
  fournisseur,
  onModifier,
}: {
  fournisseur: Fournisseur;
  onModifier: () => void;
}) {
  return (
    <Card>
      <Text style={commonStyles.line}>
        {TEXTES.fournisseurs.categories.champ} : {categorieFournisseurDe(fournisseur.categorie).nom}
      </Text>
      <Text style={commonStyles.line}>
        {TEXTES.fournisseurs.ficheFournisseur.nomDEntrepriseDeuxPoints}
        {fournisseur.nomEntreprise}
      </Text>
      {fournisseur.nom || fournisseur.prenom ? (
        <Text style={commonStyles.line}>
          {TEXTES.fournisseurs.ficheFournisseur.contactDeuxPoints}
          {fournisseur.nom}
          {fournisseur.prenom ? ` ${fournisseur.prenom}` : ''}
        </Text>
      ) : null}
      {fournisseur.siret ? (
        <Text style={commonStyles.line}>
          {TEXTES.fournisseurs.ficheFournisseur.siretDeuxPoints}
          {fournisseur.siret}
        </Text>
      ) : null}
      {fournisseur.tva ? (
        <Text style={commonStyles.line}>
          {TEXTES.fournisseurs.ficheFournisseur.tvaIntracommunautaireDeuxPoints}
          {fournisseur.tva}
        </Text>
      ) : null}
      {fournisseur.rib ? (
        <Text style={commonStyles.line}>
          {TEXTES.fournisseurs.ficheFournisseur.ribDeuxPoints}
          {fournisseur.rib}
        </Text>
      ) : null}
      {fournisseur.adressePostale ? (
        <Text style={commonStyles.line}>
          {TEXTES.commun.general.adresseDeuxPoints}
          {fournisseur.adressePostale}
        </Text>
      ) : null}
      {fournisseur.telephone ? (
        <Text style={commonStyles.line}>
          {TEXTES.clients.ficheClient.telephoneDeuxPoints}
          {fournisseur.telephone}
        </Text>
      ) : null}
      {fournisseur.email ? (
        <Text style={commonStyles.line}>
          {TEXTES.clients.ficheClient.emailDeuxPoints}
          {fournisseur.email}
        </Text>
      ) : null}

      <Button label={TEXTES.commun.general.modifierLaFiche} variant="secondary" onPress={onModifier} />
    </Card>
  );
}

interface FormulaireProps {
  form: Fournisseur;
  onChange: (form: Fournisseur) => void;
  onAnnuler: () => void;
  onEnregistrer: () => void;
}

/** Formulaire de modification d'un fournisseur. */
export function FournisseurFormulaire({ form, onChange, onAnnuler, onEnregistrer }: FormulaireProps) {
  return (
    <Card>
      <Text style={commonStyles.cardTitle}>{TEXTES.commun.general.modifierLaFiche}</Text>

      <ChampCategorieFournisseur
        value={categorieFournisseurDe(form.categorie).id}
        onChange={(categorie) => onChange({ ...form, categorie })}
      />
      <FormField
        label={TEXTES.commun.general.nomDEntreprise}
        required
        value={form.nomEntreprise}
        onChangeText={(v) => onChange({ ...form, nomEntreprise: v })}
      />
      <FormField
        label={TEXTES.commun.general.nom}
        value={form.nom}
        onChangeText={(v) => onChange({ ...form, nom: v })}
      />
      <FormField
        label={TEXTES.commun.general.prenom}
        value={form.prenom ?? ''}
        onChangeText={(v) => onChange({ ...form, prenom: v })}
        placeholder={TEXTES.commun.general.facultatif}
      />
      <FormField
        label={TEXTES.commun.general.siret}
        value={form.siret}
        onChangeText={(v) => onChange({ ...form, siret: v })}
        keyboardType="number-pad"
      />
      <FormField
        label={TEXTES.commun.general.tvaIntracommunautaire}
        value={form.tva ?? ''}
        onChangeText={(v) => onChange({ ...form, tva: v })}
        placeholder={TEXTES.commun.general.facultatif}
      />
      <FormField
        label={TEXTES.commun.general.rib}
        value={form.rib ?? ''}
        onChangeText={(v) => onChange({ ...form, rib: v })}
        placeholder={TEXTES.commun.general.facultatif}
      />
      <FormField
        label={TEXTES.commun.general.adressePostale}
        value={form.adressePostale}
        onChangeText={(v) => onChange({ ...form, adressePostale: v })}
        multiline
        style={commonStyles.textarea}
      />
      <FormField
        label={TEXTES.commun.general.telephone}
        value={form.telephone ?? ''}
        onChangeText={(v) => onChange({ ...form, telephone: v })}
        keyboardType="phone-pad"
        placeholder={TEXTES.commun.general.facultatif}
      />
      <FormField
        label={TEXTES.commun.general.email}
        value={form.email ?? ''}
        onChangeText={(v) => onChange({ ...form, email: v })}
        keyboardType="email-address"
        autoCapitalize="none"
        placeholder={TEXTES.commun.general.facultatif}
      />

      <View style={commonStyles.row}>
        <Button
          style={commonStyles.flex1}
          variant="secondary"
          label={TEXTES.commun.general.annuler}
          onPress={onAnnuler}
        />
        <Button
          style={commonStyles.flex1}
          label={TEXTES.commun.general.enregistrer}
          onPress={onEnregistrer}
        />
      </View>
    </Card>
  );
}
