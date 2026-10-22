import { useState } from 'react';
import { Text, View } from 'react-native';
import { NomModal } from '@/features/dossiers/components/NomModal';
import { assurerEntreeDuContact } from '@/features/contacts/repository';
import type { Contact } from '@/features/contacts/services/contacts';
import { modifierEntree } from '@/features/exploitation/repository/controles';
import {
  avecDossier,
  contenusDuDossier,
  dossiersEnfants,
  nombreDeContenus,
} from '@/features/exploitation/services/dossiersDeContenus';
import type { Controle } from '@/features/exploitation/types';
import type { PieceDuContact } from '@/features/contacts/services/piecesDuContact';
import { colors } from '@/shared/theme/colors';
import { ResultatsDossiers } from '@/features/contacts/components/ResultatsDossiers';
import { BlocLignes } from '@/shared/components/BlocListe';
import { ChampRecherche } from '@/shared/components/ChampRecherche';
import { ListRow } from '@/shared/components/ListRow';
import { FAMILLE_CONTROLE } from '@/shared/constants/controles';
import { ROUTES } from '@/shared/constants/routes';
import { commonStyles } from '@/shared/styles/commonStyles';
import { TEXTES } from '@/shared/textes';
import { formatDateFR } from '@/shared/utils/dates';

const D = TEXTES.production.lieux.groupement.dossiers;
const N = TEXTES.exploitation.controles.natureGroupement;

/** L'entrée de l'association, de l'organisme ou de tout autre contact parmi les contenus des partenaires : celle qui est liée à sa fiche. */
export const entreeDuContact = (
  controles: readonly Controle[],
  contact: Pick<Contact, 'client' | 'fournisseur'>,
): Controle | undefined =>
  controles.find(
    (c) =>
      c.famille === FAMILLE_CONTROLE.GROUPEMENT &&
      ((!!contact.fournisseur && c.fournisseurId === contact.fournisseur.id) ||
        (!!contact.client && c.clientId === contact.client.id)),
  );

/**
 * Les dossiers d'un contact (une association, un organisme comme l'ODARC et sa Route des Sens Authentiques…), rangés comme dans le secrétariat : une ligne par
 * dossier de la racine, puis ce qui est rangé hors dossier, puis « Nouveau dossier ». Un dossier s'ouvre sur sa propre page (ses dossiers, ses contenus, les
 * fichiers qu'on y importe).
 */
export function DossiersDuContact({
  contact,
  entree,
  pieces = [],
  ouvrir,
  onChange,
}: {
  contact: Contact;
  /** L'entrée du contact (absente tant que rien n'y est rangé). */
  entree?: Controle;
  ouvrir: (route: string) => void;
  /** Les pièces rangées toutes seules (les bons d'équarrissage d'un équarrisseur, les documents de circulation d'un abattoir). */
  pieces?: PieceDuContact[];
  /** Appelée après chaque changement : la page relit les contenus. */
  onChange: () => void;
}) {
  const [nomOuvert, setNomOuvert] = useState(false);
  const [requete, setRequete] = useState('');
  const enfants = dossiersEnfants(entree?.dossiers);
  const contenus = contenusDuDossier(entree?.contenus);

  /** Le nouveau dossier : l'entrée du contact est créée au premier ajout. */
  const creerDossier = async (nom: string) => {
    setNomOuvert(false);
    const id = entree?.id ?? (await assurerEntreeDuContact(contact));
    await modifierEntree(id, (e) => avecDossier(e, nom));
    onChange();
  };

  const cherche = requete.trim().length > 0;
  /** La recherche n'a de sens que quand quelque chose est rangé. */
  const rangement = enfants.length > 0 || contenus.length > 0;

  return (
    <View style={commonStyles.gap10}>
      {rangement ? (
        <ChampRecherche value={requete} onChangeText={setRequete} placeholder={D.rechercher} />
      ) : null}
      {cherche ? (
        <ResultatsDossiers entree={entree} requete={requete} contactCle={contact.cle} ouvrir={ouvrir} />
      ) : (
        <BlocLignes>
          {enfants.map((d) => (
            <ListRow
              key={d.id}
              title={d.nom}
              subtitle={D.contenus(entree ? nombreDeContenus(entree, d.id) : 0)}
              icone="folder"
              onPress={() => ouvrir(ROUTES.contactDossier(contact.cle, d.id))}
            />
          ))}
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
          {pieces.map((p) => (
            <ListRow
              key={p.cle}
              title={p.titre}
              subtitle={<Text style={p.manque ? { color: colors.danger } : undefined}>{p.detail}</Text>}
              icone="document-attach"
              onPress={() => ouvrir(p.route)}
            />
          ))}
          <ListRow title={D.nouveauDossier} icone="add-circle" onPress={() => setNomOuvert(true)} />
        </BlocLignes>
      )}

      <NomModal
        visible={nomOuvert}
        titre={D.nouveauDossier}
        placeholder={D.nomDuDossier}
        onValider={creerDossier}
        onAnnuler={() => setNomOuvert(false)}
      />
    </View>
  );
}
