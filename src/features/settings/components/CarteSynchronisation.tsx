import { useState } from 'react';
import { Text, View } from 'react-native';
import { Button } from '@/shared/components/Button';
import { Card } from '@/shared/components/Card';
import { FormField } from '@/shared/components/FormField';
import { useAppSettings } from '@/features/settings/context/AppSettingsContext';
import { useSynchronisation } from '@/features/sync/useSynchronisation';
import { LOCALE } from '@/shared/constants/format';
import { commonStyles } from '@/shared/styles/commonStyles';
import { TEXTES } from '@/shared/textes';

const T = TEXTES.synchronisation;

/** La connexion au serveur de la ferme, et l'envoi ou la réception des données. */
export function CarteSynchronisation() {
  const { settings } = useAppSettings();
  const sync = useSynchronisation();
  const [identifiant, setIdentifiant] = useState('');
  const [motDePasse, setMotDePasse] = useState('');
  const occupe = sync.occupe !== null;

  const connecter = async () => {
    await sync.seConnecterAvec(identifiant.trim(), motDePasse);
    setMotDePasse('');
  };

  return (
    <Card>
      <Text style={commonStyles.cardTitle}>{T.titre}</Text>
      <Text style={commonStyles.muted}>{T.aide}</Text>

      {!sync.connexion ? (
        <View style={commonStyles.gap10}>
          <FormField
            label={T.identifiant}
            value={identifiant}
            onChangeText={setIdentifiant}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <FormField
            label={T.motDePasse}
            value={motDePasse}
            onChangeText={setMotDePasse}
            secureTextEntry
            autoCapitalize="none"
          />
          <Button
            label={T.seConnecter}
            onPress={connecter}
            loading={sync.occupe === 'connexion'}
            disabled={occupe || !identifiant.trim() || !motDePasse}
          />
        </View>
      ) : (
        <View style={commonStyles.gap10}>
          <Text style={commonStyles.line}>{T.connecteEn(sync.connexion.identifiant)}</Text>
          <Text style={commonStyles.muted}>
            {settings.derniereSynchronisation
              ? T.derniere(new Date(settings.derniereSynchronisation).toLocaleString(LOCALE))
              : T.jamais}
          </Text>
          <View style={commonStyles.row}>
            <Button
              style={commonStyles.flex1}
              label={sync.occupe === 'envoi' ? T.envoiEnCours : T.envoyer}
              onPress={sync.envoyer}
              loading={sync.occupe === 'envoi'}
              disabled={occupe}
            />
            <Button
              style={commonStyles.flex1}
              variant="secondary"
              label={T.recevoir}
              onPress={sync.recevoir}
              loading={sync.occupe === 'reception'}
              disabled={occupe}
            />
          </View>
          <Button variant="secondary" label={T.seDeconnecter} onPress={sync.deconnecter} disabled={occupe} />
        </View>
      )}
    </Card>
  );
}
