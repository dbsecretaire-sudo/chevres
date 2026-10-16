import { useCallback, useState } from 'react';
import { Text } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Button } from '@/shared/components/Button';
import { Card } from '@/shared/components/Card';
import type { Client } from '@/features/clients/types';
import type { Fournisseur } from '@/features/fournisseurs/types';
import {
  ajouterCommeClient,
  ajouterCommeFournisseur,
  getContact,
  lierLesFichesDeMemeNom,
} from '@/features/contacts/repository';
import type { Contact } from '@/features/contacts/services/contacts';
import { categorieClientDe } from '@/shared/dictionnaire/categoriesClient';
import { categorieFournisseurDe } from '@/shared/dictionnaire/categoriesFournisseur';
import { ROUTES } from '@/shared/constants/routes';
import { commonStyles } from '@/shared/styles/commonStyles';
import { TEXTES } from '@/shared/textes';

const T = TEXTES.contacts.fiche;

interface Props {
  /** La fiche affichée : celle d'un client ou celle d'un fournisseur. */
  client?: Client;
  fournisseur?: Fournisseur;
}

/**
 * Sur la fiche d'un client ou d'un fournisseur : l'autre côté du même contact. S'il existe, sa catégorie et un bouton pour ouvrir sa
 * fiche ; sinon un bouton pour l'ajouter (la nouvelle fiche reprend les coordonnées).
 */
export function ContactLie({ client, fournisseur }: Props) {
  const router = useRouter();
  const id = client?.id ?? fournisseur?.id;
  const [contact, setContact] = useState<Contact | undefined>();
  const [occupe, setOccupe] = useState(false);

  const charger = useCallback(async () => {
    if (!id) return;
    // Les fiches de même nom se lient d'elles-mêmes : le lien tient ensuite même si l'une est renommée.
    await lierLesFichesDeMemeNom();
    setContact(await getContact(id));
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      charger().catch(() => undefined);
    }, [charger]),
  );

  if (!contact) return null;
  const autreClient = client ? undefined : contact.client;
  const autreFournisseur = fournisseur ? undefined : contact.fournisseur;

  const ajouter = async () => {
    setOccupe(true);
    try {
      if (client) await ajouterCommeFournisseur(client);
      else if (fournisseur) await ajouterCommeClient(fournisseur);
      await charger();
    } finally {
      setOccupe(false);
    }
  };

  return (
    <Card style={commonStyles.gap8}>
      <Text style={commonStyles.cardTitle}>{T.titre}</Text>
      {autreClient ? (
        <>
          <Text style={commonStyles.line}>
            {T.estClient} · {T.categorieDeuxPoints}
            {categorieClientDe(autreClient.categorie).nom}
          </Text>
          <Button
            variant="secondary"
            label={T.ouvrirClient}
            onPress={() => router.push(ROUTES.ficheClient(autreClient.id) as never)}
          />
        </>
      ) : null}
      {autreFournisseur ? (
        <>
          <Text style={commonStyles.line}>
            {T.estFournisseur} · {T.categorieDeuxPoints}
            {categorieFournisseurDe(autreFournisseur.categorie).nom}
          </Text>
          <Button
            variant="secondary"
            label={T.ouvrirFournisseur}
            onPress={() => router.push(ROUTES.ficheFournisseur(autreFournisseur.id) as never)}
          />
        </>
      ) : null}
      {!autreClient && !autreFournisseur ? (
        <>
          <Button
            variant="secondary"
            label={client ? T.ajouterFournisseur : T.ajouterClient}
            loading={occupe}
            onPress={ajouter}
          />
          <Text style={commonStyles.note}>{T.aideAjout}</Text>
        </>
      ) : null}
    </Card>
  );
}
