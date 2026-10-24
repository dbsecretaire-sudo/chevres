import { Text } from 'react-native';
import { Button } from '@/shared/components/Button';
import { Card } from '@/shared/components/Card';
import { FormField } from '@/shared/components/FormField';
import { ChampCategorieClient } from '@/features/clients/components/ChampCategorieClient';
import { ChampCircuit } from '@/features/commercial/components/ChampCircuit';
import { categorieClientDe } from '@/shared/dictionnaire/categoriesClient';
import { categorieDuClient } from '@/features/clients/services/categorie';
import type { Client } from '@/features/clients/types';
import { nomComplet } from '@/shared/utils/personne';
import { commonStyles } from '@/shared/styles/commonStyles';
import { TEXTES } from '@/shared/textes';

/** Fiche d'un client en lecture seule. */
export function ClientLecture({ client, onModifier }: { client: Client; onModifier: () => void }) {
  return (
    <Card>
      <Text style={commonStyles.line}>
        {TEXTES.commun.general.nomDeuxPoints}
        {nomComplet(client)}
      </Text>
      <Text style={commonStyles.line}>
        {TEXTES.clients.ficheClient.categorieDeuxPoints}
        {categorieClientDe(client.categorie).nom}
      </Text>
      {client.telephone ? (
        <Text style={commonStyles.line}>
          {TEXTES.clients.ficheClient.telephoneDeuxPoints}
          {client.telephone}
        </Text>
      ) : null}
      {client.email ? (
        <Text style={commonStyles.line}>
          {TEXTES.clients.ficheClient.emailDeuxPoints}
          {client.email}
        </Text>
      ) : null}
      {client.adressePostale ? (
        <Text style={commonStyles.line}>
          {TEXTES.commun.general.adresseDeuxPoints}
          {client.adressePostale}
        </Text>
      ) : null}
      <Button label={TEXTES.commun.general.modifierLaFiche} variant="secondary" onPress={onModifier} />
    </Card>
  );
}

interface FormulaireProps {
  form: Client;
  onChange: (form: Client) => void;
}

/** Formulaire de modification d'un client. */
export function ClientFormulaire({ form, onChange }: FormulaireProps) {
  return (
    <Card>
      <Text style={commonStyles.cardTitle}>{TEXTES.commun.general.modifierLaFiche}</Text>

      <FormField
        label={TEXTES.commun.general.nom}
        required
        value={form.nom}
        onChangeText={(v) => onChange({ ...form, nom: v })}
      />
      <ChampCategorieClient
        value={categorieDuClient(form)}
        onChange={(categorie) => onChange({ ...form, categorie })}
      />
      <ChampCircuit
        label={TEXTES.contacts.formulaire.circuitPrivilegie}
        aide={TEXTES.contacts.formulaire.aideCircuit}
        value={form.circuit ?? ''}
        onChange={(circuit) => onChange({ ...form, circuit: circuit || undefined })}
      />
      <FormField
        label={TEXTES.commun.general.prenom}
        value={form.prenom ?? ''}
        onChangeText={(v) => onChange({ ...form, prenom: v })}
        placeholder={TEXTES.commun.general.facultatif}
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
        placeholder={TEXTES.commun.general.facultatif}
      />
      <FormField
        label={TEXTES.commun.general.adressePostale}
        value={form.adressePostale ?? ''}
        onChangeText={(v) => onChange({ ...form, adressePostale: v })}
        multiline
        style={commonStyles.textarea}
        placeholder={TEXTES.commun.general.facultatif}
      />
    </Card>
  );
}
