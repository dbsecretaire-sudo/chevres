import { useState } from 'react';
import { Text, View } from 'react-native';
import { NomModal } from '@/features/dossiers/components/NomModal';
import { assurerEntreeDuContact } from '@/features/contacts/repository';
import type { Contact } from '@/features/contacts/services/contacts';
import type { ElementLie } from '@/features/contacts/services/fiche';
import { choisirFichiers, piecesDisponibles, rangerFichier } from '@/features/fichiers/services/pieces';
import { enregistrerContenu, modifierEntree } from '@/features/exploitation/repository/controles';
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
import { STATUT_ELEMENT } from '@/shared/constants/dossiers';
import { TYPES_FICHIERS_ACCEPTES } from '@/shared/constants/fichiers';
import { FAMILLE_CONTROLE } from '@/shared/constants/controles';
import { ROUTES } from '@/shared/constants/routes';
import { commonStyles } from '@/shared/styles/commonStyles';
import { TEXTES } from '@/shared/textes';
import { formatDateFR, todayISO } from '@/shared/utils/dates';

const D = TEXTES.production.lieux.groupement.dossiers;
const N = TEXTES.exploitation.controles.natureGroupement;

/** L'entrée de l'association ou de la coopérative parmi les contenus des partenaires : celle qui est liée à sa fiche. */
export const entreeDuContact = (controles: readonly Controle[], contact: Pick<Contact, 'client' | 'fournisseur'>): Controle | undefined =>
  controles.find(
    (c) =>
      c.famille === FAMILLE_CONTROLE.GROUPEMENT &&
      ((!!contact.fournisseur && c.fournisseurId === contact.fournisseur.id) ||
        (!!contact.client && c.clientId === contact.client.id)),
  );

/**
 * Les dossiers d'une association ou d'une coopérative, rangés comme dans le secrétariat : des dossiers dans des dossiers, et des contenus (courriers, démarches, aides,
 * documents) dans chacun. Le type d'un contenu se choisit avant de le créer ; un fichier de l'appareil devient un contenu terminé. Seuls les contenus de cette
 * association y sont montrés.
 */
export function DossiersAssociation({
  contact,
  entree,
  autres,
  ouvrir,
  onChange,
}: {
  contact: Contact;
  /** L'entrée de l'association (absente tant que rien n'y est rangé). */
  entree?: Controle;
  /** Les éléments de son dossier du secrétariat, montrés à la racine. */
  autres: ElementLie[];
  ouvrir: (route: string) => void;
  /** Appelée après chaque changement : la page relit les contenus. */
  onChange: () => void;
}) {
  /** Le dossier ouvert ; absent : la racine. */
  const [courant, setCourant] = useState<string | undefined>();
  const [nomOuvert, setNomOuvert] = useState<'nouveau' | 'renommer' | null>(null);
  const [typeOuvert, setTypeOuvert] = useState(false);
  const [menuOuvert, setMenuOuvert] = useState(false);
  const [suppressionOuverte, setSuppressionOuverte] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  const chemin = cheminDuDossier(entree?.dossiers, courant);
  const actuel = chemin[chemin.length - 1];
  const enfants = dossiersEnfants(entree?.dossiers, courant);
  const contenus = contenusDuDossier(entree?.contenus, courant);
  const natures = naturesDuPartenaire(contact.fournisseur, contact.client);

  /** L'entrée sous laquelle ranger : elle est créée au premier ajout. */
  const entreeId = async (): Promise<string> => entree?.id ?? assurerEntreeDuContact(contact);

  const creerDossier = async (nom: string) => {
    setNomOuvert(null);
    await modifierEntree(await entreeId(), (e) => avecDossier(e, nom, courant));
    onChange();
  };
  const renommer = async (nom: string) => {
    setNomOuvert(null);
    if (entree && actuel) await modifierEntree(entree.id, (e) => avecDossierRenomme(e, actuel.id, nom));
    onChange();
  };
  const supprimer = async () => {
    setSuppressionOuverte(false);
    if (!entree || !actuel) return;
    const parent = actuel.parentId;
    await modifierEntree(entree.id, (e) => sansDossier(e, actuel.id));
    setCourant(parent);
    onChange();
  };

  /** Chaque fichier choisi (Word, Excel, PDF, image) devient un contenu terminé de ce dossier. */
  const importer = async () => {
    if (!piecesDisponibles()) return setErreur(TEXTES.fichiers.indisponibleWeb);
    try {
      const id = await entreeId();
      for (const choisi of await choisirFichiers(TYPES_FICHIERS_ACCEPTES, true)) {
        const piece = await rangerFichier(choisi);
        await enregistrerContenu(id, {
          titre: choisi.nom.replace(/\.[^.]+$/, ''),
          nature: 'document',
          date: todayISO(),
          statut: STATUT_ELEMENT.TERMINE,
          fichiers: [piece],
          dossierId: courant,
        });
      }
      onChange();
    } catch (e: unknown) {
      setErreur(e instanceof Error ? e.message : TEXTES.fichiers.erreurAjout);
    }
  };

  /** Le type choisi, puis l'écran du contenu : la nature et le dossier sont déjà réglés. */
  const creerContenu = async (nature: string) => {
    setTypeOuvert(false);
    const id = await entreeId();
    ouvrir(`${ROUTES.contactContenu(id)}&nature=${nature}${courant ? `&dossier=${courant}` : ''}`);
  };

  return (
    <View style={commonStyles.gap10}>
      {actuel ? (
        <View style={commonStyles.gap6}>
          <Text style={commonStyles.lineBold}>{[D.racine, ...chemin.map((d) => d.nom)].join(' › ')}</Text>
          <View style={commonStyles.row}>
            <Button
              style={commonStyles.flex1}
              variant="secondary"
              label={D.remonter}
              onPress={() => setCourant(actuel.parentId)}
            />
            <Button style={commonStyles.flex1} variant="secondary" label={D.menu} onPress={() => setMenuOuvert(true)} />
          </View>
        </View>
      ) : null}

      <View style={commonStyles.row}>
        <Button style={commonStyles.flex1} variant="secondary" label={D.nouveauDossier} onPress={() => setNomOuvert('nouveau')} />
        <Button style={commonStyles.flex1} label={D.nouveauContenu} onPress={() => setTypeOuvert(true)} />
      </View>
      <Button variant="secondary" label={TEXTES.fichiers.importerUnFichier} onPress={importer} />

      {enfants.length === 0 && contenus.length === 0 && (courant || autres.length === 0) ? (
        <Text style={commonStyles.mutedItalic}>{courant ? D.dossierVide : D.aucun}</Text>
      ) : null}

      <BlocLignes>
        {enfants.map((d) => (
          <ListRow
            key={d.id}
            title={d.nom}
            subtitle={D.contenus(entree ? nombreDeContenus(entree, d.id) : 0)}
            icone="folder"
            onPress={() => setCourant(d.id)}
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
        {/* Les éléments de son dossier du secrétariat : à la racine. */}
        {courant
          ? null
          : autres.map((x) => (
              <ListRow
                key={x.cle}
                title={x.titre}
                subtitle={[formatDateFR(x.date), TEXTES.contacts.fiche.origine[x.origine]].join(' · ')}
                icone="folder-open"
                onPress={() =>
                  ouvrir(
                    x.origine === 'partenaire'
                      ? ROUTES.contactContenu(x.groupementId!, x.contenuId)
                      : ROUTES.element(x.elementId!),
                  )
                }
              />
            ))}
      </BlocLignes>

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
          { label: D.renommer, icon: 'pencil', onPress: () => setNomOuvert('renommer') },
          { label: D.supprimer, icon: 'trash', onPress: () => setSuppressionOuverte(true) },
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
    </View>
  );
}
