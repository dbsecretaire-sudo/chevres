import { Text } from 'react-native';
import { useRouter } from 'expo-router';
import { Button } from '@/shared/components/Button';
import { Card } from '@/shared/components/Card';
import { ROUTES } from '@/shared/constants/routes';
import { commonStyles } from '@/shared/styles/commonStyles';
import { TEXTES } from '@/shared/textes';

const T = TEXTES.contacts.lien;

/** Sur l'ancienne fiche d'un client ou d'un fournisseur : le chemin vers la fiche contact, où ses deux côtés sont réunis. */
export function ContactLie({ id }: { id: string }) {
  const router = useRouter();
  return (
    <Card style={commonStyles.gap8}>
      <Text style={commonStyles.cardTitle}>{T.titre}</Text>
      <Text style={commonStyles.note}>{T.aide}</Text>
      <Button variant="secondary" label={T.ouvrir} onPress={() => router.push(ROUTES.ficheContact(id) as never)} />
    </Card>
  );
}
