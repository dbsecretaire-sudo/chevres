import { useCallback, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Stack, useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { NomModal } from '@/features/dossiers/components/NomModal';
import { CarteDossier } from '@/features/dossiers/components/CarteDossier';
import { ResultatsDossiers } from '@/features/contacts/components/ResultatsDossiers';
import { ChampRecherche } from '@/shared/components/ChampRecherche';
import { entreeDuContact } from '@/features/contacts/components/DossiersDuContact';
import { getContact } from '@/features/contacts/repository';
import type { Contact } from '@/features/contacts/services/contacts';
import { choisirFichiers, piecesDisponibles, rangerFichier } from '@/features/fichiers/services/pieces';
import {
  enregistrerContenu,
  listTousControles,
  modifierEntree,
} from '@/features/exploitation/repository/controles';
import {
  avecDossier,
  avecDossierRenomme,
  cheminDuDossier,
  contenusDuDossier,
  dossiersEnfants,
  nombreDeContenus,
  sansDossier,
} from '@/features/exploitation/services/dossiersDeContenus';
import { naturesDuPartenaire } from '@/features/exploitation/services/partenaires';
import type { Controle } from '@/features/exploitation/types';
import { BlocLignes } from '@/shared/components/BlocListe';
import { Button } from '@/shared/components/Button';
import { ConfirmModal } from '@/shared/components/ConfirmModal';
import { InfoModal } from '@/shared/components/InfoModal';
import { ListRow } from '@/shared/components/ListRow';
import { OptionsModal } from '@/shared/components/OptionsModal';
import { Screen } from '@/shared/components/Screen';
import { STATUT_ELEMENT } from '@/shared/constants/dossiers';
import { TYPES_FICHIERS_ACCEPTES } from '@/shared/constants/fichiers';
import { ROUTES } from '@/shared/constants/routes';
import { useOuvrir } from '@/shared/navigation/useOuvrir';
import { commonStyles } from '@/shared/styles/commonStyles';
import { styles } from '@/shared/styles/dossiers/Dossiers.styles';
import { colors } from '@/shared/theme/colors';
import { TEXTES } from '@/shared/textes';
import { formatDateFR, todayISO } from '@/shared/utils/dates';

const D = TEXTES.production.lieux.groupement.dossiers;
const N = TEXTES.exploitation.controles.natureGroupement;

/**
 * Un dossier d'un contact (un organisme comme l'ODARC, une association) : son chemin, de quoi y créer un contenu ou y importer un fichier, ses dossiers en
 * grille (comme au secrétariat, avec une case « + » pour en ajouter un) et ses contenus. Le menu de l'en-tête renomme ou supprime le dossier.
 */
export default function DossierDuContact() {
  const router = useRouter();
  const ouvrir = useOuvrir();
  const { contact: contactId, dossier: dossierId } = useLocalSearchParams<{
    contact: string;
    dossier?: string;
  }>();
  const [contact, setContact] = useState<Contact | undefined>();
  const [entree, setEntree] = useState<Controle | undefined>();
  const [chargee, setChargee] = useState(false);
  const [nomOuvert, setNomOuvert] = useState<'nouveau' | 'renommer' | null>(null);
  const [typeOuvert, setTypeOuvert] = useState(false);
  const [menuOuvert, setMenuOuvert] = useState(false);
  const [suppressionOuverte, setSuppressionOuverte] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  /** Les mots cherchés dans ce dossier et ceux qu'il contient. */
  const [requete, setRequete] = useState('');
  const cherche = requete.trim().length > 0;

  const charger = useCallback(async () => {
    const c = contactId ? await getContact(contactId) : undefined;
    setContact(c);
    setEntree(c ? entreeDuContact(await listTousControles(), c) : undefined);
    setChargee(true);
  }, [contactId]);

  useFocusEffect(
    useCallback(() => {
      charger().catch(() => undefined);
    }, [charger]),
  );

  const chemin = cheminDuDossier(entree?.dossiers, dossierId);
  const actuel = chemin[chemin.length - 1];
  const enfants = dossiersEnfants(entree?.dossiers, dossierId);
  const contenus = contenusDuDossier(entree?.contenus, dossierId);
  const natures = contact ? naturesDuPartenaire(contact.fournisseur, contact.client) : [];

  const creerDossier = async (nom: string) => {
    setNomOuvert(null);
    if (!entree) return;
    await modifierEntree(entree.id, (e) => avecDossier(e, nom, dossierId));
    await charger();
  };
  const renommer = async (nom: string) => {
    setNomOuvert(null);
    if (entree && actuel) await modifierEntree(entree.id, (e) => avecDossierRenomme(e, actuel.id, nom));
    await charger();
  };
  const supprimer = async () => {
    setSuppressionOuverte(false);
    if (!entree || !actuel) return;
    await modifierEntree(entree.id, (e) => sansDossier(e, actuel.id));
    router.back();
  };

  /** Chaque fichier choisi (Word, Excel, PDF, image) devient un contenu terminé de ce dossier. */
  const importer = async () => {
    if (!entree) return;
    if (!piecesDisponibles()) return setErreur(TEXTES.fichiers.indisponibleWeb);
    try {
      for (const choisi of await choisirFichiers(TYPES_FICHIERS_ACCEPTES, true)) {
        const piece = await rangerFichier(choisi);
        await enregistrerContenu(entree.id, {
          titre: choisi.nom.replace(/\.[^.]+$/, ''),
          nature: 'document',
          date: todayISO(),
          statut: STATUT_ELEMENT.TERMINE,
          fichiers: [piece],
          dossierId,
        });
      }
      await charger();
    } catch (e: unknown) {
      setErreur(e instanceof Error ? e.message : TEXTES.fichiers.erreurAjout);
    }
  };

  /** Le type choisi, puis l'écran du contenu : la nature et le dossier sont déjà réglés. */
  const creerContenu = (nature: string) => {
    setTypeOuvert(false);
    if (entree)
      ouvrir(
        `${ROUTES.contactContenu(entree.id)}&nature=${nature}${dossierId ? `&dossier=${dossierId}` : ''}`,
      );
  };

  if (chargee && (!contact || !entree || !actuel)) {
    return (
      <Screen>
        <Text style={commonStyles.notFound}>{TEXTES.dossiers.sousDossier.introuvable}</Text>
      </Screen>
    );
  }

  return (
    <Screen>
      <Stack.Screen
        options={{
          title: contact?.nom ?? '',
          headerRight: () => (
            <Pressable style={styles.boutonEntete} onPress={() => setMenuOuvert(true)} hitSlop={8}>
              <Ionicons name="ellipsis-vertical" size={22} color={colors.blanc} />
            </Pressable>
          ),
        }}
      />
      <Text style={commonStyles.lineBold}>{`${chemin.map((d) => d.nom).join(' > ')} >`}</Text>

      <View style={commonStyles.row}>
        <Button style={commonStyles.flex1} label={D.nouveauContenu} onPress={() => setTypeOuvert(true)} />
        <Button
          style={commonStyles.flex1}
          variant="secondary"
          label={TEXTES.fichiers.importerUnFichier}
          onPress={importer}
        />
      </View>

      <ChampRecherche value={requete} onChangeText={setRequete} placeholder={D.rechercherDansCeDossier} />

      {cherche ? (
        <ResultatsDossiers
          entree={entree}
          requete={requete}
          dansDossier={dossierId}
          contactCle={contactId}
          ouvrir={ouvrir}
        />
      ) : (
        <View style={styles.grille}>
          {enfants.map((d) => (
            <CarteDossier
              key={d.id}
              titre={d.nom}
              detail={D.contenus(entree ? nombreDeContenus(entree, d.id) : 0)}
              onPress={() => ouvrir(ROUTES.contactDossier(contactId, d.id))}
            />
          ))}
          <CarteDossier icone="add-circle" titre={D.nouveauDossier} onPress={() => setNomOuvert('nouveau')} />
        </View>
      )}

      {!cherche && contenus.length === 0 && enfants.length === 0 ? (
        <Text style={commonStyles.mutedItalic}>{D.dossierVide}</Text>
      ) : null}
      {!cherche && contenus.length > 0 ? (
        <BlocLignes>
          {contenus.map((c) => (
            <ListRow
              key={c.id}
              title={c.titre}
              subtitle={[
                formatDateFR(c.date),
                c.nature ? (N[c.nature as keyof typeof N] ?? undefined) : undefined,
                c.fichiers && c.fichiers.length > 0 ? TEXTES.fichiers.nombre(c.fichiers.length) : undefined,
              ]
                .filter(Boolean)
                .join(' · ')}
              icone="document-text"
              onPress={() => entree && ouvrir(ROUTES.contactContenu(entree.id, c.id))}
            />
          ))}
        </BlocLignes>
      ) : null}

      <OptionsModal
        visible={typeOuvert}
        onClose={() => setTypeOuvert(false)}
        title={D.typeDeContenu}
        options={natures.map((n) => ({
          label: N[n as keyof typeof N] ?? n,
          icon: 'document-text' as const,
          onPress: () => creerContenu(n),
        }))}
      />
      <OptionsModal
        visible={menuOuvert}
        onClose={() => setMenuOuvert(false)}
        options={[
          {
            label: D.renommer,
            icon: 'pencil',
            onPress: () => {
              setMenuOuvert(false);
              setNomOuvert('renommer');
            },
          },
          {
            label: D.supprimer,
            icon: 'trash',
            color: colors.danger,
            onPress: () => {
              setMenuOuvert(false);
              setSuppressionOuverte(true);
            },
          },
        ]}
      />
      <NomModal
        visible={nomOuvert !== null}
        titre={nomOuvert === 'renommer' ? D.renommer : D.nouveauDossier}
        placeholder={D.nomDuDossier}
        valeurInitiale={nomOuvert === 'renommer' ? actuel?.nom : undefined}
        onValider={nomOuvert === 'renommer' ? renommer : creerDossier}
        onAnnuler={() => setNomOuvert(null)}
      />
      <ConfirmModal
        visible={suppressionOuverte}
        title={D.supprimerQuestion}
        message={D.supprimerMessage(actuel?.nom ?? '')}
        confirmLabel={TEXTES.commun.general.supprimer}
        onCancel={() => setSuppressionOuverte(false)}
        onConfirm={supprimer}
      />
      <InfoModal visible={!!erreur} title={erreur ?? ''} onClose={() => setErreur(null)} />
    </Screen>
  );
}
