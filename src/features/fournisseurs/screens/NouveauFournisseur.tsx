import { useState } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen } from '@/shared/components/Screen';
import { FormField } from '@/shared/components/FormField';
import { Button } from '@/shared/components/Button';
import { InfoModal } from '@/shared/components/InfoModal';
import { colors } from '@/shared/theme/colors';
import { AccentColorProvider } from '@/shared/theme/AccentColorContext';
import {
  creerFournisseur,
  importerFournisseur,
  listFournisseursDeEtablissement,
} from '@/features/fournisseurs/repository';
import { ImportEtablissement } from '@/features/etablissements/components/ImportEtablissement';
import { useImportDepuisEtablissement } from '@/features/etablissements/hooks/useImportDepuisEtablissement';
import type { Fournisseur } from '@/features/fournisseurs/types';
import { ChampCategorieFournisseur } from '@/features/fournisseurs/components/ChampCategorieFournisseur';
import { CATEGORIE_FOURNISSEUR_PAR_DEFAUT } from '@/shared/constants/fournisseurs';
import { commonStyles } from '@/shared/styles/commonStyles';
import { TEXTES } from '@/shared/textes';

export default function NouveauFournisseur() {
  const router = useRouter();
  const [nom, setNom] = useState('');
  const [prenom, setPrenom] = useState('');
  const [nomEntreprise, setNomEntreprise] = useState('');
  const [siret, setSiret] = useState('');
  const [tva, setTva] = useState('');
  const [rib, setRib] = useState('');
  const [adressePostale, setAdressePostale] = useState('');
  const [telephone, setTelephone] = useState('');
  const [email, setEmail] = useState('');
  const [categorie, setCategorie] = useState<string>(CATEGORIE_FOURNISSEUR_PAR_DEFAUT);
  const [enregistrement, setEnregistrement] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [importer, setImporter] = useState(false);
  const importFournisseur = useImportDepuisEtablissement<Fournisseur>({
    lister: listFournisseursDeEtablissement,
    copier: importerFournisseur,
    messageDoublon: (f) => TEXTES.fournisseurs.importFournisseur.dejaPresent(f.nomEntreprise),
  });

  const enregistrer = async () => {
    if (!nom.trim()) return setErreur(TEXTES.commun.general.nomRequis);
    if (!nomEntreprise.trim()) return setErreur(TEXTES.commun.general.nomDEntrepriseRequis);
    if (!siret.trim()) return setErreur(TEXTES.commun.general.siretRequis);
    if (!adressePostale.trim()) return setErreur(TEXTES.commun.general.adressePostaleRequise);

    setEnregistrement(true);
    try {
      await creerFournisseur({
        nom: nom.trim(),
        prenom: prenom.trim() || undefined,
        nomEntreprise: nomEntreprise.trim(),
        siret: siret.trim(),
        tva: tva.trim() || undefined,
        rib: rib.trim() || undefined,
        adressePostale: adressePostale.trim(),
        telephone: telephone.trim() || undefined,
        email: email.trim() || undefined,
        categorie,
      });
      router.back();
    } finally {
      setEnregistrement(false);
    }
  };

  return (
    <AccentColorProvider color={colors.ajout} softColor={colors.ajoutBadgeBg}>
      <Screen>
        <ImportEtablissement
          etat={importFournisseur}
          importer={importer}
          onBasculer={() => setImporter((v) => !v)}
          libelleImporter={TEXTES.fournisseurs.importFournisseur.importerDepuisUnAutreEtablissement}
          libelleSaisir={TEXTES.fournisseurs.importFournisseur.saisirUnNouveauFournisseur}
          consigne={TEXTES.fournisseurs.importFournisseur.choisissezUnEtablissement}
          texteVide={TEXTES.fournisseurs.importFournisseur.aucunFournisseurDansCetEtablissement}
          ligne={(f) => ({
            titre: f.nomEntreprise,
            sousTitre: TEXTES.fournisseurs.listeFournisseurs.nomValeurSiretSiret(
              f.nom,
              f.prenom ? ` ${f.prenom}` : '',
              f.siret,
            ),
          })}
        />

        {/* Le formulaire est enroulé quand on choisit d'importer un fournisseur d'un autre établissement. */}
        {!importer && (
          <>
            <ChampCategorieFournisseur value={categorie} onChange={setCategorie} />
            <FormField
              label={TEXTES.commun.general.nomDEntreprise}
              required
              value={nomEntreprise}
              onChangeText={setNomEntreprise}
              placeholder={TEXTES.fournisseurs.nouveauFournisseur.exCooperativeAgricoleDuNord}
            />
            <FormField
              label={TEXTES.commun.general.nom}
              required
              value={nom}
              onChangeText={setNom}
              placeholder={TEXTES.fournisseurs.nouveauFournisseur.nomDuContact}
            />
            <FormField
              label={TEXTES.commun.general.prenom}
              value={prenom}
              onChangeText={setPrenom}
              placeholder={TEXTES.commun.general.facultatif}
            />
            <FormField
              label={TEXTES.commun.general.adressePostale}
              required
              value={adressePostale}
              onChangeText={setAdressePostale}
              multiline
              style={commonStyles.textarea}
              placeholder={TEXTES.fournisseurs.nouveauFournisseur.numeroRueCodePostalVille}
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
              autoCapitalize="none"
              placeholder={TEXTES.commun.general.facultatif}
            />
            <FormField
              label={TEXTES.commun.general.siret}
              required
              value={siret}
              onChangeText={setSiret}
              keyboardType="number-pad"
              placeholder={TEXTES.fournisseurs.nouveauFournisseur.t14Chiffres}
            />
            <FormField
              label={TEXTES.commun.general.tvaIntracommunautaire}
              value={tva}
              onChangeText={setTva}
              placeholder={TEXTES.commun.general.facultatif}
            />
            <FormField
              label={TEXTES.commun.general.rib}
              value={rib}
              onChangeText={setRib}
              placeholder={TEXTES.fournisseurs.nouveauFournisseur.facultatifIbanBic}
            />

            <View style={commonStyles.row}>
              <Button
                style={commonStyles.flex1}
                variant="secondary"
                label={TEXTES.commun.general.annuler}
                onPress={() => router.back()}
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
