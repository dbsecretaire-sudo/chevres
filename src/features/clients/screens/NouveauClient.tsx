import { useState } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen } from '@/shared/components/Screen';
import { FormField } from '@/shared/components/FormField';
import { Button } from '@/shared/components/Button';
import { ChampCategorieClient } from '@/features/clients/components/ChampCategorieClient';
import { CATEGORIE_CLIENT_PAR_DEFAUT } from '@/shared/constants/clients';
import { InfoModal } from '@/shared/components/InfoModal';
import { colors } from '@/shared/theme/colors';
import { AccentColorProvider } from '@/shared/theme/AccentColorContext';
import { creerClient, importerClient, listClientsDeEtablissement } from '@/features/clients/repository';
import { ImportEtablissement } from '@/features/etablissements/components/ImportEtablissement';
import { useImportDepuisEtablissement } from '@/features/etablissements/hooks/useImportDepuisEtablissement';
import type { Client } from '@/features/clients/types';
import { nomDeContactPris } from '@/features/contacts/repository';
import { nomComplet } from '@/shared/utils/personne';
import { commonStyles } from '@/shared/styles/commonStyles';
import { TEXTES } from '@/shared/textes';
import { retournerALaPageDAvant } from '@/shared/navigation/retourAvant';

export default function NouveauClient() {
  const router = useRouter();
  const [nom, setNom] = useState('');
  const [categorie, setCategorie] = useState<string>(CATEGORIE_CLIENT_PAR_DEFAUT);
  const [prenom, setPrenom] = useState('');
  const [telephone, setTelephone] = useState('');
  const [email, setEmail] = useState('');
  const [adressePostale, setAdressePostale] = useState('');
  const [enregistrement, setEnregistrement] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [importer, setImporter] = useState(false);
  const importClient = useImportDepuisEtablissement<Client>({
    lister: listClientsDeEtablissement,
    copier: importerClient,
    messageDoublon: (c) => TEXTES.clients.importClient.dejaPresent(nomComplet(c)),
  });

  const enregistrer = async () => {
    if (!nom.trim()) return setErreur(TEXTES.commun.general.nomRequis);
    // Deux contacts n'ont jamais le même nom.
    if (await nomDeContactPris(nomComplet({ nom: nom.trim(), prenom: prenom.trim() || undefined })))
      return setErreur(TEXTES.contacts.erreurs.nomDejaPris);

    setEnregistrement(true);
    try {
      await creerClient({
        nom: nom.trim(),
        categorie,
        prenom: prenom.trim() || undefined,
        telephone: telephone.trim() || undefined,
        email: email.trim() || undefined,
        adressePostale: adressePostale.trim() || undefined,
      });
      retournerALaPageDAvant(router);
    } finally {
      setEnregistrement(false);
    }
  };

  return (
    <AccentColorProvider color={colors.ajout} softColor={colors.ajoutBadgeBg}>
      <Screen>
        <ImportEtablissement
          etat={importClient}
          importer={importer}
          onBasculer={() => setImporter((v) => !v)}
          libelleImporter={TEXTES.clients.importClient.importerDepuisUnAutreEtablissement}
          libelleSaisir={TEXTES.clients.importClient.saisirUnNouveauClient}
          consigne={TEXTES.clients.importClient.choisissezUnEtablissement}
          texteVide={TEXTES.clients.importClient.aucunClientDansCetEtablissement}
          ligne={(c) => ({
            titre: nomComplet(c),
            sousTitre: [c.telephone, c.email].filter(Boolean).join(' · ') || undefined,
          })}
        />

        {/* Le formulaire est enroulé quand on choisit d'importer un client d'un autre établissement. */}
        {!importer && (
          <>
            <FormField
              label={TEXTES.commun.general.nom}
              required
              value={nom}
              onChangeText={setNom}
              placeholder={TEXTES.clients.nouveauClient.nomDuClient}
            />
            <ChampCategorieClient value={categorie} onChange={setCategorie} />
            <FormField
              label={TEXTES.commun.general.prenom}
              value={prenom}
              onChangeText={setPrenom}
              placeholder={TEXTES.commun.general.facultatif}
            />
            <FormField
              label={TEXTES.commun.general.telephone}
              value={telephone}
              onChangeText={setTelephone}
              keyboardType="phone-pad"
              placeholder={TEXTES.commun.general.facultatif}
            />
            <FormField
              label={TEXTES.commun.general.email}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              placeholder={TEXTES.commun.general.facultatif}
            />
            <FormField
              label={TEXTES.commun.general.adressePostale}
              value={adressePostale}
              onChangeText={setAdressePostale}
              multiline
              style={commonStyles.textarea}
              placeholder={TEXTES.commun.general.facultatif}
            />

            <View style={commonStyles.row}>
              <Button
                style={commonStyles.flex1}
                variant="secondary"
                label={TEXTES.commun.general.annuler}
                onPress={() => retournerALaPageDAvant(router)}
              />
              <Button
                style={commonStyles.flex1}
                label={TEXTES.commun.general.enregistrer}
                onPress={enregistrer}
                loading={enregistrement}
              />
            </View>
          </>
        )}
      </Screen>

      <InfoModal visible={!!erreur} title={erreur ?? ''} onClose={() => setErreur(null)} />
    </AccentColorProvider>
  );
}
