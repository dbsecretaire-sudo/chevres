import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { BlocLignes } from '@/shared/components/BlocListe';
import { ConfirmModal } from '@/shared/components/ConfirmModal';
import { PastilleAlerte } from '@/shared/components/PastilleAlerte';
import { RappelSauvegarde } from '@/features/sauvegarde/components/RappelSauvegarde';
import { useRappels } from '@/features/rappels/hooks/useRappels';
import { useRappelsAnalysesPlats } from '@/features/rappels/hooks/useRappelsAnalysesPlats';
import { useRappelsCirculation } from '@/features/rappels/hooks/useRappelsCirculation';
import { GENRE_RAPPEL } from '@/shared/constants/rappels';
import { useDocumentsCirculationManquants } from '@/features/comptabilite/hooks/useDocumentsCirculationManquants';
import { anneesDesEcritures } from '@/features/comptabilite/services/documentsCirculation';
import { useAppSettings } from '@/features/settings/context/AppSettingsContext';
import { useLotsARappeler, type RappelDeLot } from '@/features/stock/hooks/useLotsARappeler';
import { destinationRappel } from '@/features/rappels/services/destination';
import { enlevementsSansBon } from '@/features/exploitation/services/enlevements';
import { ROUTES } from '@/shared/constants/routes';
import { colors } from '@/shared/theme/colors';
import { commonStyles } from '@/shared/styles/commonStyles';
import { formatDateShortFR } from '@/shared/utils/dates';
import { styles } from '@/shared/styles/rappels/Rappels.styles';
import { TEXTES } from '@/shared/textes';

const T = TEXTES.rappels;

/**
 * Les déclarations à valider (RSA trimestriel, URSSAF mensuel) : une ligne par rappel, qui ouvre l'écran de la déclaration ; la
 * coche à droite la marque comme faite. N'affiche rien s'il n'y en a pas.
 */
function BlocRappelsDeclarations() {
  const router = useRouter();
  const { rappels: declarations, genres, valider, valides } = useRappels();
  /** Les documents de circulation à envoyer à la chambre d'agriculture : à valider une fois envoyés, comme une déclaration. */
  const envois = useRappelsCirculation(valides);
  /** Les échantillons de plats préparés à envoyer à un laboratoire : validés une fois partis, ils ne passent pas par les réglages. */
  const analyses = useRappelsAnalysesPlats();
  const rappels = [...declarations, ...envois, ...analyses.rappels].sort((a, b) => a.echeance.localeCompare(b.echeance));
  const { aRappeler: lots, aValider, valider: validerLot } = useLotsARappeler();
  /** Les ventes et dépenses d'animaux vivants dont le document de circulation n'est pas déposé : rappelés tant qu'il manque. */
  const manquantsCirculation = useDocumentsCirculationManquants();
  const circulation = manquantsCirculation.length;
  const { settings } = useAppSettings();
  /** Les enlèvements d'équarrissage sans bon : rappelés tant que leur bon n'est pas joint, comme les documents de circulation. */
  const enlevementsSansLeBon = enlevementsSansBon(settings.exploitation?.enlevements);
  const bonsManquants = enlevementsSansLeBon.length;
  /** Un seul enlèvement sans bon : le rappel ouvre sa fiche, là où le bon se joint ; plusieurs : la liste des enlèvements. */
  const routeDuBon = enlevementsSansLeBon.length === 1 ? ROUTES.enlevement(enlevementsSansLeBon[0].id) : ROUTES.ENLEVEMENTS;
  /** Les années (autres que celle choisie) où des documents manquent : l'accueil le dit. */
  const anneesAilleurs = settings.toutesAnnees
    ? []
    : anneesDesEcritures(manquantsCirculation.filter((e) => !e.date.startsWith(String(settings.anneeActive))));
  const nAilleurs = manquantsCirculation.filter((e) => !e.date.startsWith(String(settings.anneeActive))).length;
  /** Le rappel de lot dont on confirme la validation. */
  const [lotAValider, setLotAValider] = useState<RappelDeLot | null>(null);
  // Les activités qui ont des rappels gardent le bloc (et son historique) même quand rien n'est à valider.
  if (rappels.length === 0 && lots === 0 && aValider.length === 0 && genres.length === 0 && circulation === 0 && bonsManquants === 0) return null;
  return (
    <View style={styles.conteneur}>
      <View style={styles.enTete}>
        <Text style={styles.titre}>{T.titre}</Text>
        <View style={styles.icones}>
          <Pressable
            onPress={() => router.push(ROUTES.RAPPELS_HISTORIQUE as never)}
            hitSlop={10}
            accessibilityLabel={T.historique.titre}
          >
            <Ionicons name="time-outline" size={24} color={colors.textMuted} />
          </Pressable>
          <Pressable
            onPress={() => router.push(ROUTES.COMPTABILITE_REGLAGES as never)}
            hitSlop={10}
            accessibilityLabel={T.gerer}
          >
            <Ionicons name="create-outline" size={24} color={colors.textMuted} />
          </Pressable>
        </View>
      </View>
      {rappels.length === 0 && lots === 0 && aValider.length === 0 && circulation === 0 && bonsManquants === 0 ? (
        <Text style={commonStyles.mutedItalic}>{T.aucun}</Text>
      ) : null}
      <BlocLignes>
        {bonsManquants > 0 ? (
          <View style={styles.ligne}>
            <Pressable
              style={styles.texte}
              onPress={() => router.push(routeDuBon as never)}
            >
              <View style={styles.titreLigne}>
                <Text style={styles.libelle}>{TEXTES.cheptel.lots.bonsManquants(bonsManquants)}</Text>
                <PastilleAlerte taille={18} />
              </View>
              <Text style={[styles.detail, styles.detailRetard]}>{TEXTES.cheptel.lots.bonsManquantsDetail}</Text>
            </Pressable>
            <Ionicons name="chevron-forward" size={22} color={colors.textMuted} />
          </View>
        ) : null}
        {circulation > 0 ? (
          <View style={styles.ligne}>
            <Pressable
              style={styles.texte}
              onPress={() => router.push(ROUTES.CHEPTEL_DOCUMENTS_CIRCULATION as never)}
            >
              <View style={styles.titreLigne}>
                <Text style={styles.libelle}>{TEXTES.cheptel.circulation.nManquants(circulation)}</Text>
                <PastilleAlerte taille={18} />
              </View>
              <Text style={[styles.detail, styles.detailRetard]}>{TEXTES.cheptel.circulation.rappelDetail}</Text>
              {nAilleurs > 0 && anneesAilleurs.length > 0 ? (
                <Text style={[styles.detail, styles.detailRetard]}>
                  {TEXTES.cheptel.circulation.autresAnnees(nAilleurs, anneesAilleurs)}
                </Text>
              ) : null}
            </Pressable>
            <Ionicons name="chevron-forward" size={22} color={colors.textMuted} />
          </View>
        ) : null}
        {lots > 0 ? (
          <View style={styles.ligne}>
            <Pressable
              style={styles.texte}
              onPress={() => router.push(ROUTES.PRODUCTION_RAPPELS_LOTS as never)}
            >
              <View style={styles.titreLigne}>
                <Text style={styles.libelle}>{T.lots.libelle(lots)}</Text>
                <PastilleAlerte taille={18} />
              </View>
              <Text style={[styles.detail, styles.detailRetard]}>{T.lots.detail}</Text>
            </Pressable>
            <Ionicons name="chevron-forward" size={22} color={colors.textMuted} />
          </View>
        ) : null}
        {aValider.map((l) => (
          <View key={l.id} style={styles.ligne}>
            <Pressable
              style={styles.texte}
              onPress={() => router.push(ROUTES.PRODUCTION_RAPPELS_LOTS as never)}
            >
              <Text style={styles.libelle}>{T.lots.rappel(l.libelle)}</Text>
              <Text style={styles.detail}>{T.lots.rappele(formatDateShortFR(l.date))}</Text>
            </Pressable>
            <Pressable onPress={() => setLotAValider(l)} hitSlop={10} accessibilityLabel={T.validerLeRappel}>
              <Ionicons name="checkmark-circle-outline" size={30} color={colors.primary} />
            </Pressable>
          </View>
        ))}
        {rappels.map((r) => (
          <View key={r.id} style={styles.ligne}>
            <Pressable
              style={styles.texte}
              onPress={() => router.push((r.cible ?? destinationRappel(r.genre)) as never)}
            >
              <View style={styles.titreLigne}>
                <Text style={styles.libelle}>{r.libelle}</Text>
                {r.enRetard ? <PastilleAlerte taille={18} /> : null}
              </View>
              <Text style={[styles.detail, r.enRetard && styles.detailRetard]}>
                {r.detail ?? (r.enRetard ? T.enRetard : T.avant)(formatDateShortFR(r.echeance))}
              </Text>
            </Pressable>
            {/* Un dossier de savon incomplet n'a rien à cocher : on le complète. */}
            {r.genre === GENRE_RAPPEL.DOSSIER_SAVON || r.genre === GENRE_RAPPEL.ACCUEIL_PUBLIC ? (
              <Ionicons name="chevron-forward" size={22} color={colors.textMuted} />
            ) : (
              <Pressable
                onPress={() =>
                  r.genre === GENRE_RAPPEL.ANALYSE_PLAT && r.fabricationId ? analyses.valider(r.fabricationId) : valider(r)
                }
                hitSlop={10}
                accessibilityLabel={
                  r.genre === GENRE_RAPPEL.ANALYSE_PLAT
                    ? T.analysesPlats.valider
                    : r.genre === GENRE_RAPPEL.STOCK_A_PREVOIR
                      ? T.stockAPrevoir.valider
                      : T.validerLeRappel
                }
              >
                <Ionicons name="checkmark-circle-outline" size={30} color={colors.primary} />
              </Pressable>
            )}
          </View>
        ))}
      </BlocLignes>
      <ConfirmModal
        visible={!!lotAValider}
        title={T.lots.validerQuestion(lotAValider?.libelle ?? '')}
        message={T.lots.validerMessage}
        confirmLabel={T.lots.valider}
        onCancel={() => setLotAValider(null)}
        onConfirm={async () => {
          if (lotAValider) await validerLot(lotAValider.id);
          setLotAValider(null);
        }}
      />
    </View>
  );
}

/** Les rappels de l'accueil : la sauvegarde à faire quand elle date de trop, puis les déclarations et les lots à rappeler. */
export function BlocRappels() {
  return (
    <>
      <RappelSauvegarde />
      <BlocRappelsDeclarations />
    </>
  );
}
