import { useCallback, useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { appeler, exploitationDeLaConnexion, lireConnexion } from '@/features/sync/synchronisation';
import { DetailDeLaSaisie, type SaisieAffichee } from '@/features/administration/components/DetailDeLaSaisie';
import { libelleZone, resumerSaisie } from '@/features/administration/services/resumeSaisie';
import { colors } from '@/shared/theme/colors';
import { commonStyles } from '@/shared/styles/commonStyles';

/** Une saisie décidée (validée ou refusée) : ce qu'elle était, et qui a décidé. */
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

const LIBELLE_DECISION = { validee: 'Validée', refusee: 'Refusée' } as const;

/** Toutes les valeurs d'une donnée, à plat : les textes, les nombres et les noms des champs (pour que la recherche les trouve). */
function valeursDe(valeur: unknown, sortie: string[] = []): string[] {
  if (valeur === null || valeur === undefined) return sortie;
  if (typeof valeur === 'object') {
    if (Array.isArray(valeur)) valeur.forEach((v) => valeursDe(v, sortie));
    else
      for (const [cle, v] of Object.entries(valeur)) {
        sortie.push(cle);
        valeursDe(v, sortie);
      }
    return sortie;
  }
  sortie.push(String(valeur));
  return sortie;
}

/** La date de décision sous les formes qu'on tape : 2026-11-13 17:09:59, 13/11/2026 et 13/11/26. */
function formesDeLaDate(date: string): string[] {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(date);
  return m ? [date, `${m[3]}/${m[2]}/${m[1]}`, `${m[3]}/${m[2]}/${m[1].slice(2)}`] : [date];
}

/** Sans accents ni majuscules : « oriolacci » trouve « Oriolacci », « validee » trouve « Validée ». */
const normaliser = (texte: string): string => texte.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

/** Tout ce qu'une décision porte, où la recherche regarde : zone, compte, auteur, décideur, date, décision, données lues et écrites. */
function texteDeRecherche(d: Decision): string {
  return [
    libelleZone(d.zone),
    d.zone,
    d.identifiant,
    d.auteur,
    d.decide_par,
    LIBELLE_DECISION[d.decision],
    d.decision,
    ...formesDeLaDate(d.decide_le),
    ...resumerSaisie(d.zone, d.actuel, d.contenu),
    ...valeursDe(d.contenu),
    ...valeursDe(d.actuel),
  ].join(' ');
}

/** Ce que le détail affiche pour une décision (la même fenêtre que les saisies à valider). */
function versDetail(d: Decision): SaisieAffichee {
  return {
    zone: d.zone,
    contenu: d.contenu,
    actuel: d.actuel,
    auteur: d.auteur,
    cree_le: `${LIBELLE_DECISION[d.decision]} par ${d.decide_par} le ${d.decide_le}`,
  };
}

/**
 * L'historique des saisies décidées, sur sa propre page (depuis le bouton « Historique » des saisies à valider). Un champ de recherche
 * trouve une décision par sa date, son compte, son auteur, son décideur, sa décision et toutes les données qu'elle contient.
 */
export default function HistoriqueSaisies() {
  const [decisions, setDecisions] = useState<Decision[]>([]);
  const [recherche, setRecherche] = useState('');
  const [detail, setDetail] = useState<SaisieAffichee | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const charger = useCallback(async () => {
    try {
      const connexion = await lireConnexion();
      if (!connexion) return setMessage('Connecte-toi pour voir l’historique.');
      const reponse = await appeler('attentes-historique', 'GET', {
        jeton: connexion.jeton,
        parametres: `&etablissement=${await exploitationDeLaConnexion()}`,
      });
      if (reponse.statut === 200) {
        setDecisions(reponse.json.decisions ?? []);
        setMessage(null);
      } else setMessage(reponse.json.erreur ?? 'Chargement de l’historique impossible.');
    } catch {
      setMessage('Chargement de l’historique impossible.');
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void charger();
    }, [charger]),
  );

  // Chaque décision est indexée une fois ; la recherche garde celles qui contiennent tous les mots tapés (dans n'importe quel ordre).
  const indexees = useMemo(() => decisions.map((d) => ({ d, texte: normaliser(texteDeRecherche(d)) })), [decisions]);
  const mots = normaliser(recherche).trim().split(/\s+/).filter(Boolean);
  const trouvees = indexees.filter(({ texte }) => mots.every((mot) => texte.includes(mot))).map(({ d }) => d);
  const nombre = mots.length ? trouvees.length : decisions.length;

  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }} style={{ backgroundColor: colors.background }}>
      <TextInput
        value={recherche}
        onChangeText={setRecherche}
        placeholder="Date, compte, auteur, donnée…"
        placeholderTextColor={colors.textMuted}
        autoCorrect={false}
        clearButtonMode="while-editing"
        style={{
          backgroundColor: colors.surface,
          borderRadius: 10,
          borderWidth: 1,
          borderColor: colors.border,
          paddingVertical: 10,
          paddingHorizontal: 12,
          color: colors.text,
        }}
      />
      {message ? <Text style={{ color: colors.danger }}>{message}</Text> : null}
      <Text style={commonStyles.muted}>
        {nombre} {mots.length ? (nombre > 1 ? 'résultats' : 'résultat') : nombre > 1 ? 'saisies décidées' : 'saisie décidée'}
      </Text>
      {decisions.length === 0 ? <Text style={commonStyles.muted}>Aucune saisie décidée pour l’instant.</Text> : null}
      {mots.length > 0 && decisions.length > 0 && trouvees.length === 0 ? (
        <Text style={commonStyles.muted}>Aucune saisie ne correspond à cette recherche.</Text>
      ) : null}
      {trouvees.map((d) => (
        <Pressable
          key={d.id}
          accessibilityRole="button"
          onPress={() => setDetail(versDetail(d))}
          style={{
            backgroundColor: colors.surface,
            borderRadius: 14,
            borderWidth: 1,
            borderColor: colors.border,
            padding: 14,
            gap: 6,
          }}
        >
          <Text style={{ fontWeight: '700', color: colors.text }}>{libelleZone(d.zone)}</Text>
          <Text style={{ color: colors.text }}>
            {LIBELLE_DECISION[d.decision]} par {d.decide_par} · saisie de {d.auteur}
          </Text>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={commonStyles.muted}>{d.decide_le}</Text>
            <Text style={commonStyles.muted}>{d.identifiant}</Text>
          </View>
        </Pressable>
      ))}
      {detail ? <DetailDeLaSaisie attente={detail} onFermer={() => setDetail(null)} /> : null}
    </ScrollView>
  );
}
