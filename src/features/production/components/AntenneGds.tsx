import { Alert, Linking, Pressable, Text } from 'react-native';
import { Button } from '@/shared/components/Button';
import { Card } from '@/shared/components/Card';
import type { Contact } from '@/features/contacts/services/contacts';
import { creerFournisseur, listFournisseurs } from '@/features/fournisseurs/repository';
import { ANTENNE_GDS_CORSE } from '@/shared/constants/gds';
import { CATEGORIE_FOURNISSEUR } from '@/shared/constants/fournisseurs';
import { commonStyles } from '@/shared/styles/commonStyles';
import { TEXTES } from '@/shared/textes';

const T = TEXTES.gds.antenne;

/** Vrai quand ce contact est l'antenne du GDS (par son courriel ou son nom) : elle est alors déjà dans les contacts. */
export const estLAntenneGds = (contact: Contact): boolean => {
  const f = contact.fournisseur;
  return (
    !!f &&
    (f.email?.trim().toLowerCase() === ANTENNE_GDS_CORSE.email ||
      (f.nomEntreprise || f.nom) === ANTENNE_GDS_CORSE.nom)
  );
};

/**
 * L'antenne du GDS Corse (Haute-Corse) : ses coordonnées, d'un appui le téléphone ou le courriel s'ouvrent, et un bouton l'ajoute aux contacts
 * (comme groupement sanitaire) — seulement quand on le demande, et une seule fois.
 */
export function AntenneGds({ onAjoutee }: { onAjoutee?: () => void }) {
  const ajouter = async () => {
    const existants = await listFournisseurs();
    const dejaLa = existants.some(
      (f) =>
        f.email?.trim().toLowerCase() === ANTENNE_GDS_CORSE.email ||
        f.nomEntreprise === ANTENNE_GDS_CORSE.nom,
    );
    if (dejaLa) return Alert.alert(T.dejaAjoute);
    await creerFournisseur({
      nom: ANTENNE_GDS_CORSE.nom,
      nomEntreprise: ANTENNE_GDS_CORSE.nom,
      siret: '',
      adressePostale: ANTENNE_GDS_CORSE.adressePostale,
      telephone: ANTENNE_GDS_CORSE.telephone,
      email: ANTENNE_GDS_CORSE.email,
      categorie: CATEGORIE_FOURNISSEUR.GROUPEMENT_SANITAIRE,
    });
    onAjoutee?.();
    Alert.alert(T.ajoute);
  };
  return (
    <Card style={commonStyles.gap8}>
      <Text style={commonStyles.cardTitle}>{T.titre}</Text>
      <Text style={commonStyles.lineSemiBold}>{ANTENNE_GDS_CORSE.nom}</Text>
      <Text style={commonStyles.line}>{ANTENNE_GDS_CORSE.adressePostale}</Text>
      <Pressable
        onPress={() => Linking.openURL(`tel:${ANTENNE_GDS_CORSE.telephone.replace(/\s/g, '')}`)}
        accessibilityRole="link"
      >
        <Text style={commonStyles.lien}>
          {T.appeler} · {ANTENNE_GDS_CORSE.telephone}
        </Text>
      </Pressable>
      <Pressable
        onPress={() => Linking.openURL(`mailto:${ANTENNE_GDS_CORSE.email}`)}
        accessibilityRole="link"
      >
        <Text style={commonStyles.lien}>
          {T.ecrire} · {ANTENNE_GDS_CORSE.email}
        </Text>
      </Pressable>
      <Button variant="secondary" label={T.ajouter} onPress={ajouter} />
    </Card>
  );
}
