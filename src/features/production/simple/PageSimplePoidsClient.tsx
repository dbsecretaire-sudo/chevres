import { useState } from 'react';
import { Text, View } from 'react-native';
import type { Client } from '@/features/clients/types';
import { lirePoids } from '@/features/cheptel/utils/poids';
import { Button } from '@/shared/components/Button';
import { FormField } from '@/shared/components/FormField';
import { SelectField } from '@/shared/components/SelectField';
import { styles } from '@/shared/styles/roles/Roles.styles';
import { TEXTES } from '@/shared/textes';
import { nomComplet } from '@/shared/utils/personne';

const S = TEXTES.production.viande.simple;

/**
 * La page de deux réponses de la viande : le poids total (kg) — celui qu'on connaît est proposé — et le client à facturer. `onValider` rend le poids saisi (rien s'il est vide ou
 * invalide) et l'identifiant du client choisi (vide si aucun).
 */
export function PageSimplePoidsClient({
  titre,
  detail,
  poidsInitial,
  clients,
  libelleValider,
  enCours,
  onValider,
  onRetour,
}: {
  titre: string;
  detail: string;
  poidsInitial?: number;
  clients: Client[];
  libelleValider: string;
  enCours: boolean;
  onValider: (poids: number | undefined, clientId: string) => void;
  onRetour: () => void;
}) {
  const [poids, setPoids] = useState(poidsInitial ? String(poidsInitial).replace('.', ',') : '');
  const [clientId, setClientId] = useState('');
  return (
    <View style={styles.contenu}>
      <Text style={styles.detail}>{detail}</Text>
      <Text style={styles.titre}>{titre}</Text>
      <FormField label={S.poidsTotal} value={poids} onChangeText={setPoids} keyboardType="decimal-pad" autoFocus />
      <SelectField<string>
        label={S.clientAFacturer}
        value={clientId}
        placeholder={S.choisirUnClient}
        searchable
        options={clients.map((c) => ({ value: c.id, label: nomComplet(c) }))}
        onChange={setClientId}
      />
      <Button label={libelleValider} onPress={() => onValider(lirePoids(poids), clientId)} loading={enCours} />
      <Button label={TEXTES.production.fabricationSimple.retour} variant="secondary" onPress={onRetour} />
    </View>
  );
}
