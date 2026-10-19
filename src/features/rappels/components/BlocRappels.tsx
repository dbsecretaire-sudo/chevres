import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { BlocLignes } from '@/shared/components/BlocListe';
import { ConfirmModal } from '@/shared/components/ConfirmModal';
import { PastilleAlerte } from '@/shared/components/PastilleAlerte';
import { RappelSauvegarde } from '@/features/sauvegarde/components/RappelSauvegarde';
import { useRappels } from '@/features/rappels/hooks/useRappels';
import { useRappelsCirculation } from '@/features/rappels/hooks/useRappelsCirculation';
import { useDocumentsCirculationManquants } from '@/features/comptabilite/hooks/useDocumentsCirculationManquants';
import { anneesDesEcritures } from '@/features/comptabilite/services/documentsCirculation';
import { useAppSettings } from '@/features/settings/context/AppSettingsContext';
import { useLotsARappeler, type RappelDeLot } from '@/features/stock/hooks/useLotsARappeler';
import { destinationRappel } from '@/features/rappels/services/destination';
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
  const rappels = [...declarations, ...envois].sort((a, b) => a.echeance.localeCompare(b.echeance));
  const { aRappeler: lots, aValider, valider: validerLot } = useLotsARappeler();
  /** Les ventes et dépenses d'animaux vivants dont le document de circulation n'est pas déposé : rappelés tant qu'il manque. */
  const manquantsCirculation = useDocumentsCirculationManquants();
  const circulation = manquantsCirculation.length;
  const { settings } = useAppSettings();
  /** Les années (autres que celle choisie) où des documents manquent : l'accueil le dit. */
  const anneesAilleurs = settings.toutesAnnees
    ? []
    : anneesDesEcritures(manquantsCirculation.filter((e) => !e.date.startsWith(String(settings.anneeActive))));
  const nAilleurs = manquantsCirculation.filter((e) => !e.date.startsWith(String(settings.anneeActive))).length;
  /** Le rappel de lot dont on confirme la validation. */
  const [lotAValider, setLotAValider] = useState<RappelDeLot | null>(null);
  // Les activités qui ont des rappels gardent le bloc (et son historique) même quand rien n'est à valider.
  if (rappels.length === 0 && lots === 0 && aValider.length === 0 && genres.length === 0 && circulation === 0) return null;
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
      {rappels.length === 0 && lots === 0 && aValider.length === 0 && circulation === 0 ? (
        <Text style={commonStyles.mutedItalic}>{T.aucun}</Text>
      ) : null}
      <BlocLignes>
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
            <Pressable onPress={() => valider(r)} hitSlop={10} accessibilityLabel={T.validerLeRappel}>
              <Ionicons name="checkmark-circle-outline" size={30} color={colors.primary} />
            </Pressable>
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
