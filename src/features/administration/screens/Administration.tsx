import { useCallback, useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { appeler, exploitationDeLaConnexion, lireConnexion, seDeconnecter, type Connexion } from '@/features/sync/synchronisation';
import { recevoirChangements } from '@/features/sync/moteur';
import { detaillerSaisie, libelleZone, resumerSaisie, type ChampDetail } from '@/features/administration/services/resumeSaisie';
import { ConfirmModal } from '@/shared/components/ConfirmModal';
import { SelectField } from '@/shared/components/SelectField';
import { colors } from '@/shared/theme/colors';
import { commonStyles } from '@/shared/styles/commonStyles';

/** Un compte, tel que le serveur le renvoie : ses exploitations (identifiants techniques) ; l'administrateur les voit toutes. */
interface Compte {
  identifiant: string;
  role: string;
  exploitations: string[];
}

/** Une exploitation (un établissement) : son identifiant technique, et son nom, celui qu'on affiche. */
interface Exploitation {
  etablissement: string;
  nom: string;
}

/** Une saisie d'utilisateur qui attend la validation du modérateur. */
interface Attente {
  id: number;
  zone: string;
  identifiant: string;
  /** La fiche que la saisie veut écrire, et la fiche telle qu'elle est sur le serveur (pour dire ce qui change). */
  contenu: unknown;
  actuel: unknown;
  auteur: string;
  cree_le: string;
}

/** Une saisie déjà décidée (validée ou refusée) : ce qu'elle était, et qui a décidé. */
interface Decision {
  id: number;
  zone: string;
  identifiant: string;
  contenu: unknown;
  actuel: unknown;
  auteur: string;
  decision: 'validee' | 'refusee';
  decide_par: string;
  decide_le: string;
}

/**
 * Un compte tel que reçu. Un serveur qui n'a pas encore les exploitations multiples ne renvoie que « etablissement » : on le prend alors
 * comme seule exploitation, pour que l'écran ne plante pas.
 */
function versCompte(recu: Partial<Compte> & { etablissement?: string | null }): Compte {
  return {
    identifiant: recu.identifiant ?? '',
    role: recu.role ?? 'utilisateur',
    exploitations: recu.exploitations ?? (recu.etablissement ? [recu.etablissement] : []),
  };
}

/** Le nom affiché d'une exploitation, à partir de son identifiant (l'identifiant seul si le nom n'est pas connu). */
function nomDe(exploitations: Exploitation[], identifiant: string): string {
  return exploitations.find((e) => e.etablissement === identifiant)?.nom ?? identifiant;
}

type Role = 'administrateur' | 'moderateur' | 'utilisateur';

/** Les rôles qu'on peut donner, selon le rôle de celui qui gère : un utilisateur ne se donne que « utilisateur », etc. */
const ROLES_DONNABLES: Record<Role, { valeur: Role; libelle: string }[]> = {
  utilisateur: [{ valeur: 'utilisateur', libelle: 'Utilisateur' }],
  moderateur: [
    { valeur: 'utilisateur', libelle: 'Utilisateur' },
    { valeur: 'moderateur', libelle: 'Modérateur' },
  ],
  administrateur: [
    { valeur: 'utilisateur', libelle: 'Utilisateur' },
    { valeur: 'moderateur', libelle: 'Modérateur' },
    { valeur: 'administrateur', libelle: 'Administrateur' },
  ],
};

const LIBELLE_ROLE: Record<string, string> = { administrateur: 'Administrateur', moderateur: 'Modérateur', utilisateur: 'Utilisateur' };


/** Un mot de passe : au moins 9 caractères, comme côté serveur. */
const MOT_DE_PASSE_MINIMUM = 9;

/**
 * L'administration : les comptes, leur rôle et leurs exploitations, et les saisies des utilisateurs à valider.
 * Chacun voit son propre compte ; le modérateur et l'administrateur voient en plus les comptes de leurs exploitations (ou tous, pour l'administrateur).
 */
export default function Administration() {
  const [connexion, setConnexion] = useState<Connexion | null | undefined>(undefined);
  useEffect(() => {
    lireConnexion()
      .then(setConnexion)
      .catch(() => setConnexion(null));
  }, []);
  if (connexion === undefined) return null;
  if (!connexion) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', padding: 24, backgroundColor: colors.background }}>
        <Text style={{ color: colors.textMuted, textAlign: 'center' }}>Connecte-toi pour gérer les comptes.</Text>
      </View>
    );
  }
  return <Gestion connexion={connexion} roleDuViewer={normaliserRole(connexion.role)} />;
}

/** Un rôle inconnu, ou absent sur un serveur ancien, est traité comme modérateur. Un utilisateur reste utilisateur. */
function normaliserRole(role: string | undefined): Role {
  if (role === 'administrateur' || role === 'utilisateur') return role;
  return 'moderateur';
}

function Gestion({ connexion, roleDuViewer }: { connexion: Connexion; roleDuViewer: Role }) {
  const { jeton } = connexion;
  const estModerateur = roleDuViewer !== 'utilisateur';
  const [comptes, setComptes] = useState<Compte[]>([]);
  const [exploitationsConnues, setExploitationsConnues] = useState<Exploitation[]>([]);
  const [attentes, setAttentes] = useState<Attente[]>([]);
  /** L'historique des saisies décidées : affiché sous les saisies à valider, sur demande (bouton « Historique »). */
  const [historiqueOuvert, setHistoriqueOuvert] = useState(false);
  const [decisions, setDecisions] = useState<Decision[]>([]);
  const [selection, setSelection] = useState<string | null>(null);
  /** La saisie dont on regarde le détail (la fenêtre s'ouvre quand elle n'est pas vide). */
  const [detail, setDetail] = useState<Attente | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  /** La confirmation avant de déconnecter toutes les sessions. */
  const [confirmerSessions, setConfirmerSessions] = useState(false);

  const charger = useCallback(async () => {
    const reponses = await Promise.all([
      appeler('utilisateurs', 'GET', { jeton }),
      appeler('exploitations', 'GET', { jeton }),
      estModerateur ? appeler('attentes', 'GET', { jeton, parametres: `&etablissement=${await exploitationDeLaConnexion()}` }) : null,
    ]);
    const [comptesReponse, exploitationsReponse, attentesReponse] = reponses;
    if (comptesReponse.statut === 200) setComptes((comptesReponse.json.utilisateurs ?? []).map(versCompte));
    // La liste des exploitations n'est qu'un choix de cases : si le serveur ne la donne pas, on n'affiche pas d'erreur (les exploitations du compte restent visibles).
    setExploitationsConnues(
      exploitationsReponse.statut === 200
        ? (exploitationsReponse.json.exploitations ?? []).map((e: { etablissement: string; nom?: string }) => ({
            etablissement: e.etablissement,
            nom: e.nom || e.etablissement,
          }))
        : [],
    );
    if (attentesReponse?.statut === 200) setAttentes(attentesReponse.json.attentes ?? []);
    const erreur = [comptesReponse, attentesReponse].find((r) => r && r.statut !== 200);
    setMessage(erreur ? (erreur.json.erreur ?? 'Chargement impossible.') : null);
  }, [jeton, estModerateur]);

  // Chargement à chaque retour sur la page (elle reste ouverte en arrière-plan : sans cela, les saisies arrivées entre-temps n'apparaissent pas), puis après chaque action.
  useFocusEffect(
    useCallback(() => {
      void charger();
    }, [charger]),
  );

  /** Valide ou refuse une saisie, puis recharge la liste. */
  const decider = async (action: 'valider' | 'refuser', id: number) => {
    const reponse = await appeler(action, 'POST', {
      jeton,
      parametres: `&etablissement=${await exploitationDeLaConnexion()}`,
      corps: { ids: [id] },
    });
    setMessage(reponse.statut === 200 ? null : (reponse.json.erreur ?? 'Action impossible.'));
    // Validée ou refusée : cet appareil reçoit tout de suite la version du serveur. Refusée, la saisie disparaît de sa copie locale ; validée, elle y apparaît
    // (sinon elle n'arrive qu'à la prochaine synchronisation).
    if (reponse.statut === 200) await recevoirChangements().catch(() => undefined);
    await charger();
    if (historiqueOuvert) await chargerHistorique();
  };

  /** Recharge l'historique des décisions de l'exploitation. */
  const chargerHistorique = async () => {
    const reponse = await appeler('attentes-historique', 'GET', {
      jeton,
      parametres: `&etablissement=${await exploitationDeLaConnexion()}`,
    });
    if (reponse.statut === 200) setDecisions(reponse.json.decisions ?? []);
    else setMessage(reponse.json.erreur ?? 'Chargement de l’historique impossible.');
  };

  /** Affiche ou masque l'historique ; à l'affichage, il est rechargé. */
  const basculerHistorique = async () => {
    const ouvrir = !historiqueOuvert;
    setHistoriqueOuvert(ouvrir);
    if (ouvrir) await chargerHistorique();
  };

  /** Déconnecte toutes les sessions (tous les comptes, tous les appareils). La session de l'administrateur en fait partie : cet appareil revient à la connexion. */
  const deconnecterToutesLesSessions = async () => {
    setConfirmerSessions(false);
    const reponse = await appeler('deconnecter-toutes-sessions', 'POST', { jeton });
    if (reponse.statut !== 200) {
      setMessage(reponse.json.erreur ?? 'Action impossible.');
      return;
    }
    await seDeconnecter();
  };

  // Les comptes triés par ordre alphabétique (sans tenir compte des majuscules).
  const comptesTries = [...comptes].sort((a, b) => a.identifiant.localeCompare(b.identifiant, 'fr', { sensitivity: 'base' }));

  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 14 }} style={{ backgroundColor: colors.background }}>
      {message ? <Text style={{ color: colors.danger }}>{message}</Text> : null}

      {estModerateur ? (
        <View style={{ gap: 10 }}>
          <View style={[commonStyles.rowSpaceBetween, { alignItems: 'center' }]}>
            <Text style={commonStyles.cardTitle}>Saisies à valider</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ expanded: historiqueOuvert }}
              onPress={basculerHistorique}
              style={[bouton, { borderWidth: 1, borderColor: colors.primary }]}
            >
              <Text style={{ color: colors.primary, fontWeight: '700' }}>Historique</Text>
            </Pressable>
          </View>
          {attentes.length === 0 ? <Text style={commonStyles.muted}>Aucune saisie en attente.</Text> : null}
          {attentes.map((attente) => (
            <View key={attente.id} style={carte}>
              {/* Un appui sur le résumé ouvre toutes les informations de la saisie. */}
              <Pressable accessibilityRole="button" onPress={() => setDetail(attente)} style={{ gap: 8 }}>
                <Text style={{ fontWeight: '700', color: colors.text }}>{libelleZone(attente.zone)}</Text>
                {resumerSaisie(attente.zone, attente.actuel, attente.contenu).map((ligne, i) => (
                  <Text key={`${i}-${ligne}`} style={{ color: colors.text }}>
                    • {ligne}
                  </Text>
                ))}
                <Text style={{ color: colors.primary, fontWeight: '600' }}>Voir le détail</Text>
              </Pressable>
              <View style={commonStyles.row}>
                <Pressable accessibilityRole="button" onPress={() => decider('valider', attente.id)} style={[bouton, { backgroundColor: colors.primary }]}>
                  <Text style={{ color: colors.blanc, fontWeight: '700' }}>Valider</Text>
                </Pressable>
                <Pressable accessibilityRole="button" onPress={() => decider('refuser', attente.id)} style={[bouton, { borderWidth: 1, borderColor: colors.danger }]}>
                  <Text style={{ color: colors.danger, fontWeight: '700' }}>Refuser</Text>
                </Pressable>
              </View>
            </View>
          ))}
          {historiqueOuvert ? (
            <View style={{ gap: 10, marginTop: 6 }}>
              <Text style={commonStyles.cardTitle}>Historique</Text>
              {decisions.length === 0 ? <Text style={commonStyles.muted}>Aucune saisie décidée pour l’instant.</Text> : null}
              {decisions.map((decision) => (
                <Pressable
                  key={decision.id}
                  accessibilityRole="button"
                  onPress={() =>
                    setDetail({
                      id: decision.id,
                      zone: decision.zone,
                      identifiant: decision.identifiant,
                      contenu: decision.contenu,
                      actuel: decision.actuel,
                      auteur: decision.auteur,
                      cree_le: `${decision.decision === 'validee' ? 'Validée' : 'Refusée'} par ${decision.decide_par} le ${decision.decide_le}`,
                    })
                  }
                  style={carte}
                >
                  <Text style={{ fontWeight: '700', color: colors.text }}>{libelleZone(decision.zone)}</Text>
                  <Text style={{ color: colors.text }}>
                    {decision.decision === 'validee' ? 'Validée' : 'Refusée'} par {decision.decide_par} · saisie de {decision.auteur}
                  </Text>
                  <Text style={commonStyles.muted}>{decision.decide_le}</Text>
                </Pressable>
              ))}
            </View>
          ) : null}
        </View>
      ) : null}

      <View style={{ gap: 4 }}>
        <Text style={commonStyles.cardTitle}>Comptes</Text>
        <Text style={commonStyles.muted}>Touche un compte pour voir son rôle et ses exploitations.</Text>
      </View>
      <View style={[carte, { padding: 6, gap: 4 }]}>
        {comptesTries.map((compte) => {
          const selectionne = compte.identifiant === selection;
          const exploitations =
            compte.role === 'administrateur' ? 'Toutes les exploitations' : compte.exploitations.map((id) => nomDe(exploitationsConnues, id)).join(', ');
          // Le compte se déplie sur place, sous sa ligne : rôle, exploitations et « Enregistrer » apparaissent dessous, administrateur compris.
          return (
            <View key={compte.identifiant} style={{ borderRadius: 10, backgroundColor: colors.surface, overflow: 'hidden' }}>
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ expanded: selectionne }}
                onPress={() => setSelection(selectionne ? null : compte.identifiant)}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12, paddingHorizontal: 12 }}
              >
                <View style={{ flex: 1, gap: 2 }}>
                  <Text style={{ fontWeight: '700', color: colors.text }} numberOfLines={1}>
                    {compte.identifiant}
                    {compte.identifiant === connexion.identifiant ? '  · moi' : ''}
                  </Text>
                  <Text style={commonStyles.muted} numberOfLines={1}>
                    {LIBELLE_ROLE[compte.role] ?? compte.role}
                    {exploitations ? ` · ${exploitations}` : ''}
                  </Text>
                </View>
                <Ionicons name={selectionne ? 'chevron-up' : 'chevron-down'} size={18} color={colors.textMuted} />
              </Pressable>
              {selectionne ? (
                <View style={{ paddingHorizontal: 12, paddingBottom: 14 }}>
                  <DetailCompte
                    key={compte.identifiant}
                    compte={compte}
                    roleDuViewer={roleDuViewer}
                    estMoi={compte.identifiant === connexion.identifiant}
                    jeton={jeton}
                    exploitationsConnues={exploitationsConnues}
                    onApres={async (erreur) => {
                      setMessage(erreur ?? null);
                      await charger();
                    }}
                  />
                </View>
              ) : null}
            </View>
          );
        })}
        {comptesTries.length === 0 ? <Text style={[commonStyles.muted, { padding: 12 }]}>Aucun compte à afficher.</Text> : null}
      </View>

      {roleDuViewer === 'administrateur' ? (
        <View style={{ gap: 6, marginTop: 8 }}>
          <Pressable
            accessibilityRole="button"
            onPress={() => setConfirmerSessions(true)}
            style={[bouton, { borderWidth: 1, borderColor: colors.danger, alignSelf: 'flex-start' }]}
          >
            <Text style={{ color: colors.danger, fontWeight: '700' }}>Déconnecter toutes les sessions</Text>
          </Pressable>
          <Text style={commonStyles.muted}>Tous les comptes et tous les appareils, le vôtre compris, devront se reconnecter.</Text>
        </View>
      ) : null}

      <ConfirmModal
        visible={confirmerSessions}
        title="Déconnecter toutes les sessions"
        message="Voulez-vous vraiment déconnecter tous les comptes et tous les appareils ? Vous serez déconnecté aussi."
        confirmLabel="Déconnecter tout"
        onCancel={() => setConfirmerSessions(false)}
        onConfirm={deconnecterToutesLesSessions}
      />

      {detail ? <DetailDeLaSaisie attente={detail} onFermer={() => setDetail(null)} /> : null}
    </ScrollView>
  );
}

/** Une ligne du détail : « avant → après » pour un champ modifié, la seule valeur pour un ajout ou une suppression. */
function texteChamp(champ: ChampDetail): string {
  if (champ.apres === undefined) return champ.avant ?? '—';
  if (champ.avant === undefined) return champ.apres;
  return `${champ.avant} → ${champ.apres}`;
}

/** Toutes les informations d'une saisie d'utilisateur, dans une fenêtre : chaque élément, avec ce qui change. */
function DetailDeLaSaisie({ attente, onFermer }: { attente: Attente; onFermer: () => void }) {
  const blocs = detaillerSaisie(attente.actuel, attente.contenu);
  return (
    <Modal transparent animationType="fade" visible onRequestClose={onFermer}>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', padding: 16 }}>
        <View style={{ backgroundColor: colors.surface, borderRadius: 14, padding: 16, maxHeight: '85%', gap: 10 }}>
          <Text style={{ fontWeight: '800', fontSize: 16, color: colors.text }}>{libelleZone(attente.zone)}</Text>
          <Text style={commonStyles.muted}>
            {attente.auteur} · {attente.cree_le}
          </Text>
          <ScrollView>
            <View style={{ gap: 12 }}>
              {blocs.map((bloc, i) => (
                <View key={`${i}-${bloc.titre}`} style={{ gap: 4 }}>
                  <Text style={{ fontWeight: '700', color: colors.text }}>{bloc.titre}</Text>
                  {bloc.champs.map((champ) => (
                    <Text key={champ.nom} style={{ color: colors.text }}>
                      {champ.nom} : {texteChamp(champ)}
                    </Text>
                  ))}
                </View>
              ))}
            </View>
          </ScrollView>
          <Pressable accessibilityRole="button" onPress={onFermer} style={[bouton, { backgroundColor: colors.primary, alignSelf: 'flex-end' }]}>
            <Text style={{ color: colors.blanc, fontWeight: '700' }}>Fermer</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

/** Le détail du compte déplié : son rôle, ses exploitations, « Enregistrer », et (pour soi, si on est modérateur ou administrateur) son mot de passe. */
function DetailCompte({
  compte,
  roleDuViewer,
  estMoi,
  jeton,
  exploitationsConnues,
  onApres,
}: {
  compte: Compte;
  roleDuViewer: Role;
  estMoi: boolean;
  jeton: string;
  exploitationsConnues: Exploitation[];
  onApres: (erreur?: string) => Promise<void>;
}) {
  const [role, setRole] = useState<string>(compte.role);
  // Un compte n'a qu'une seule exploitation : celle qu'on choisit dans la liste.
  const [exploitation, setExploitation] = useState<string>(compte.exploitations[0] ?? '');
  // Seul l'administrateur donne l'exploitation, et seulement aux comptes qui ne sont pas administrateurs.
  const peutChoisirExploitations = roleDuViewer === 'administrateur' && role !== 'administrateur';
  // La liste : les exploitations enregistrées sur le serveur, par leur nom.
  const choix = [...exploitationsConnues].sort((a, b) => a.nom.localeCompare(b.nom, 'fr', { sensitivity: 'base' }));

  const enregistrer = async () => {
    const reponse = await appeler('affecter', 'POST', {
      jeton,
      corps: {
        identifiant: compte.identifiant,
        role,
        ...(roleDuViewer === 'administrateur'
          ? { exploitations: role === 'administrateur' || !exploitation ? [] : [exploitation] }
          : {}),
      },
    });
    await onApres(reponse.statut === 200 ? undefined : (reponse.json.erreur ?? 'Enregistrement impossible.'));
  };

  return (
    <View style={{ gap: 14 }}>
      <View style={separation}>
        <Text style={titreSection}>Rôle</Text>
        {/* Le rôle se choisit dans un menu déroulant : seulement les rôles que celui qui gère peut donner. */}
        <SelectField<string> label="" value={role} onChange={setRole} options={ROLES_DONNABLES[roleDuViewer].map((r) => ({ value: r.valeur, label: r.libelle }))} />
      </View>

      <View style={separation}>
        <Text style={titreSection}>Exploitations</Text>
        {peutChoisirExploitations ? (
          choix.length === 0 ? (
            <Text style={commonStyles.muted}>Aucune exploitation enregistrée sur le serveur.</Text>
          ) : (
            <SelectField<string>
              label=""
              value={exploitation}
              onChange={setExploitation}
              options={choix.map((e) => ({ value: e.etablissement, label: e.nom }))}
            />
          )
        ) : (
          <Text style={{ color: colors.text }}>
            {role === 'administrateur'
              ? 'Toutes les exploitations (administrateur).'
              : compte.exploitations.length > 0
                ? compte.exploitations.map((id) => nomDe(exploitationsConnues, id)).join(', ')
                : 'Aucune exploitation.'}
          </Text>
        )}
      </View>

      <Pressable accessibilityRole="button" onPress={enregistrer} style={[bouton, { backgroundColor: colors.primary, alignItems: 'center' }]}>
        <Text style={{ color: colors.blanc, fontWeight: '700' }}>Enregistrer</Text>
      </Pressable>

      {estMoi && roleDuViewer !== 'utilisateur' ? (
        <View style={separation}>
          <Text style={titreSection}>Mon mot de passe</Text>
          <ChangerMotDePasse jeton={jeton} onApres={onApres} />
        </View>
      ) : null}
    </View>
  );
}

/** Changer son propre mot de passe : pour le modérateur et l'administrateur. */
function ChangerMotDePasse({ jeton, onApres }: { jeton: string; onApres: (erreur?: string) => Promise<void> }) {
  const [ancien, setAncien] = useState('');
  const [nouveau, setNouveau] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [erreur, setErreur] = useState<string | null>(null);
  const [ouvert, setOuvert] = useState(false);

  const changer = async () => {
    if (nouveau.length < MOT_DE_PASSE_MINIMUM) return setErreur(`Le nouveau mot de passe doit faire ${MOT_DE_PASSE_MINIMUM} caractères au moins.`);
    if (nouveau !== confirmation) return setErreur('La confirmation ne correspond pas au nouveau mot de passe.');
    setErreur(null);
    const reponse = await appeler('mot_de_passe', 'POST', { jeton, corps: { ancien, nouveau } });
    if (reponse.statut === 200) {
      setAncien('');
      setNouveau('');
      setConfirmation('');
      setOuvert(false);
    }
    await onApres(reponse.statut === 200 ? 'Mot de passe modifié.' : (reponse.json.erreur ?? 'Changement impossible.'));
  };

  if (!ouvert) {
    return (
      <Pressable accessibilityRole="button" onPress={() => setOuvert(true)} style={[bouton, { borderWidth: 1, borderColor: colors.primary, alignSelf: 'flex-start' }]}>
        <Text style={{ color: colors.primary, fontWeight: '700' }}>Modifier mon mot de passe</Text>
      </Pressable>
    );
  }
  const champ = { backgroundColor: colors.background, borderRadius: 10, borderWidth: 1, borderColor: colors.border, padding: 10, color: colors.text } as const;
  return (
    <View style={{ gap: 8 }}>
      <TextInput value={ancien} onChangeText={setAncien} placeholder="Ancien mot de passe" placeholderTextColor={colors.textMuted} secureTextEntry style={champ} />
      <TextInput value={nouveau} onChangeText={setNouveau} placeholder="Nouveau mot de passe" placeholderTextColor={colors.textMuted} secureTextEntry style={champ} />
      <TextInput value={confirmation} onChangeText={setConfirmation} placeholder="Retape le nouveau mot de passe" placeholderTextColor={colors.textMuted} secureTextEntry style={champ} />
      {erreur ? <Text style={{ color: colors.danger }}>{erreur}</Text> : null}
      <View style={commonStyles.row}>
        <Pressable accessibilityRole="button" onPress={changer} style={[bouton, { backgroundColor: colors.primary }]}>
          <Text style={{ color: colors.blanc, fontWeight: '700' }}>Enregistrer le mot de passe</Text>
        </Pressable>
        <Pressable accessibilityRole="button" onPress={() => setOuvert(false)} style={[bouton, { borderWidth: 1, borderColor: colors.border }]}>
          <Text style={{ color: colors.textMuted, fontWeight: '700' }}>Annuler</Text>
        </Pressable>
      </View>
    </View>
  );
}

const carte = {
  backgroundColor: colors.surface,
  borderRadius: 14,
  borderWidth: 1,
  borderColor: colors.border,
  padding: 14,
  gap: 14,
} as const;

/** Une section du détail : un trait au-dessus, pour séparer les blocs. */
const separation = { gap: 8, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 12 } as const;

const titreSection = { fontSize: 13, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase' } as const;

const bouton = { paddingVertical: 10, paddingHorizontal: 14, borderRadius: 999 } as const;
