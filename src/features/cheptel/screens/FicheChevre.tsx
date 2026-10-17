import { useState } from 'react';
import { Pressable, ScrollView, Text } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/shared/theme/colors';
import { Screen } from '@/shared/components/Screen';
import { PucesDefilantes } from '@/shared/components/PucesDefilantes';
import { OptionsModal } from '@/shared/components/OptionsModal';
import { ConfirmModal } from '@/shared/components/ConfirmModal';
import { InfoModal } from '@/shared/components/InfoModal';
import { useAppSettings } from '@/features/settings/context/AppSettingsContext';
import { identificationCheptel } from '@/features/settings/settings';
import { especeDe } from '@/features/cheptel/utils/espece';
import { useFicheChevre } from '@/features/cheptel/hooks/useFicheChevre';
import { ChevreEntete } from '@/features/cheptel/components/ficheChevre/ChevreEntete';
import { ChevreFormulaire } from '@/features/cheptel/components/ficheChevre/ChevreFormulaire';
import { ChevreResume } from '@/features/cheptel/components/ficheChevre/ChevreResume';
import { ChevreSuiviAnnuel } from '@/features/cheptel/components/ficheChevre/ChevreSuiviAnnuel';
import { ChevreSortie, ChevreStatutDeclaration } from '@/features/cheptel/components/ficheChevre/ChevreStatut';
import {
  ChevreDescendance,
  ChevreSante,
  familleDuControle,
} from '@/features/cheptel/components/ficheChevre/ChevreHistorique';
import { ChevreSortieFab } from '@/features/cheptel/components/ficheChevre/ChevreSortieFab';
import { libelleChevre, statutLabel } from '@/features/cheptel/utils/chevreLabel';
import { STATUT_CHEVRE, VUE_FICHE_CHEVRE } from '@/shared/constants/cheptel';
import { ChevreTraitements } from '@/features/cheptel/components/ChevreTraitements';
import { ROUTES } from '@/shared/constants/routes';
import { styles } from '@/shared/styles/cheptel/FicheChevre.styles';
import { commonStyles } from '@/shared/styles/commonStyles';
import { TEXTES } from '@/shared/textes';

type OngletFiche = 'fiche' | 'sante' | 'suivi';

export default function FicheChevre() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { settings } = useAppSettings();
  const fiche = useFicheChevre(id);
  const { chevre, form } = fiche;
  const [onglet, setOnglet] = useState<OngletFiche>('fiche');
  /** La confirmation de « Remettre dans le cheptel actif » : on pouvait vouloir seulement corriger la date de sortie. */
  const [confirmerReactivation, setConfirmerReactivation] = useState(false);

  if (!chevre || !form) {
    return (
      <Screen>
        <Text style={commonStyles.notFound}>{TEXTES.cheptel.ficheChevre.chevreIntrouvable}</Text>
      </Screen>
    );
  }

  const estVivante = chevre.statut === STATUT_CHEVRE.VIVANTE;

  const ajouterUnCabri = async () => {
    const boucleMere = form.numeroBoucle ?? '';
    const ok = await fiche.enregistrerModifications();
    if (!ok) return;
    router.push({ pathname: ROUTES.CHEPTEL_NAISSANCE_NOUVELLE, params: { mereNumeroBoucle: boucleMere } });
  };

  return (
    <Screen scroll={false}>
      <ScrollView style={commonStyles.flex1} contentContainerStyle={styles.scrollContentFab}>
        {/* Le menu burger, à droite du titre : visites, contrôles, et la suppression définitive de l'animal. */}
        <Stack.Screen
          options={{
            headerRight: () => (
              <Pressable
                style={commonStyles.boutonEnteteDroite}
                onPress={() => fiche.setMenuOuvert(true)}
                hitSlop={10}
                accessibilityLabel={TEXTES.cheptel.ficheChevre.menu}
              >
                <Ionicons name="menu" size={26} color={colors.blanc} />
              </Pressable>
            ),
          }}
        />
        <ChevreEntete chevre={chevre} />

        <OptionsModal
          visible={fiche.menuOuvert}
          onClose={() => fiche.setMenuOuvert(false)}
          title={libelleChevre(chevre)}
          options={[
            {
              label: TEXTES.commun.general.supprimerDefinitivement,
              icon: 'trash',
              onPress: () => fiche.setVueSecondaire(VUE_FICHE_CHEVRE.SUPPRESSION),
            },
          ]}
        />

        {/* Des onglets plutôt qu'une seule longue page : la fiche, la santé, le suivi (lots de l'année, descendance). */}
        <PucesDefilantes<OngletFiche>
          puces={[
            { valeur: 'fiche', label: TEXTES.cheptel.ficheChevre.onglets.fiche },
            { valeur: 'sante', label: TEXTES.cheptel.ficheChevre.onglets.sante },
            { valeur: 'suivi', label: TEXTES.cheptel.ficheChevre.onglets.suivi(fiche.descendance.length) },
          ]}
          valeur={onglet}
          onChoisir={setOnglet}
        />

        {onglet === 'fiche' ? (
          <>
            {fiche.editing ? (
              <ChevreFormulaire
                chevre={chevre}
                form={form}
                onChange={fiche.setForm}
                onEnregistrer={() => fiche.enregistrerModifications()}
                onAjouterCabri={ajouterUnCabri}
              />
            ) : (
              <ChevreResume
                chevre={chevre}
                indicatif={identificationCheptel(settings.exploitation, especeDe(chevre)).indicatifMarquage}
                onModifier={() => fiche.setEditing(true)}
              />
            )}

            {estVivante && fiche.showStatutForm && (
              <ChevreStatutDeclaration
                chevre={chevre}
                statut={fiche.statutForm}
                date={fiche.dateStatutForm}
                onDateChange={fiche.setDateStatutForm}
                poidsKg={fiche.poidsStatutForm}
                onPoidsChange={fiche.setPoidsStatutForm}
                onAnnuler={() => fiche.setShowStatutForm(false)}
                onConfirmer={fiche.enregistrerStatut}
              />
            )}

            {!estVivante && (
              <ChevreSortie
                key={chevre.dateStatut}
                chevre={chevre}
                onEnregistrerDate={fiche.enregistrerDateSortie}
                onReactiver={() => setConfirmerReactivation(true)}
              />
            )}
          </>
        ) : null}

        {onglet === 'sante' ? (
          <>
            <ChevreSante
              chevre={chevre}
              visites={fiche.visites}
              controles={fiche.controles}
              onOuvrirVisite={(v) => router.push(`${ROUTES.santeVisite(v.id)}&retour=${encodeURIComponent(ROUTES.ficheChevre(chevre.id))}` as never)}
              onOuvrirControle={(c) => router.push(ROUTES.santeControleModifier(familleDuControle(c), c.id))}
            />

            <ChevreTraitements chevre={chevre} />
          </>
        ) : null}

        {onglet === 'suivi' ? (
          <>
            <ChevreSuiviAnnuel chevre={chevre} />

            {fiche.descendance.length > 0 ? (
              <ChevreDescendance
                descendance={fiche.descendance}
                onOuvrir={(idPetit) => router.push(ROUTES.ficheChevre(idPetit))}
              />
            ) : (
              <Text style={commonStyles.mutedItalic}>{TEXTES.cheptel.ficheChevre.aucuneDescendance}</Text>
            )}
          </>
        ) : null}
      </ScrollView>

      <ConfirmModal
        visible={fiche.vueSecondaire === VUE_FICHE_CHEVRE.SUPPRESSION}
        title={TEXTES.commun.general.supprimerDefinitivementQuestion}
        message={TEXTES.cheptel.ficheChevre.contrairementAValeurAbattoirValeur2(
          statutLabel(STATUT_CHEVRE.MORTE, chevre.sexe),
          statutLabel(STATUT_CHEVRE.VENDUE, chevre.sexe),
          libelleChevre(chevre),
          statutLabel(STATUT_CHEVRE.MORTE, chevre.sexe).toLowerCase(),
          statutLabel(STATUT_CHEVRE.VENDUE, chevre.sexe).toLowerCase(),
        )}
        confirmLabel={TEXTES.commun.general.supprimerDefinitivement}
        onCancel={() => fiche.setVueSecondaire(null)}
        onConfirm={fiche.supprimerDefinitivement}
      />

      <ConfirmModal
        visible={confirmerReactivation}
        title={TEXTES.cheptel.ficheChevre.reactivationQuestion}
        message={TEXTES.cheptel.ficheChevre.reactivationMessage(statutLabel(chevre.statut, chevre.sexe).toLowerCase())}
        confirmLabel={TEXTES.cheptel.ficheChevre.remettreDansLeCheptelActif}
        onCancel={() => setConfirmerReactivation(false)}
        onConfirm={() => {
          setConfirmerReactivation(false);
          fiche.reactiver();
        }}
      />

      <InfoModal
        visible={!!fiche.erreur}
        title={TEXTES.commun.general.nDeBoucleDejaUtilise}
        message={fiche.erreur ?? undefined}
        onClose={() => fiche.setErreur(null)}
      />

      {estVivante && !fiche.showStatutForm && (
        <ChevreSortieFab chevre={chevre} onChoisir={fiche.choisirStatut} />
      )}
    </Screen>
  );
}
