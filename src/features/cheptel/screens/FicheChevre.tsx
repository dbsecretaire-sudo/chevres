import { ScrollView, Text } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Screen } from '@/shared/components/Screen';
import { OptionsModal } from '@/shared/components/OptionsModal';
import { ConfirmModal } from '@/shared/components/ConfirmModal';
import { InfoModal } from '@/shared/components/InfoModal';
import { useAppSettings } from '@/features/settings/context/AppSettingsContext';
import { useFicheChevre } from '@/features/cheptel/hooks/useFicheChevre';
import { ChevreEntete } from '@/features/cheptel/components/ficheChevre/ChevreEntete';
import { ChevreFormulaire } from '@/features/cheptel/components/ficheChevre/ChevreFormulaire';
import { ChevreResume } from '@/features/cheptel/components/ficheChevre/ChevreResume';
import {
  ChevreReactivation,
  ChevreStatutDeclaration,
} from '@/features/cheptel/components/ficheChevre/ChevreStatut';
import {
  ChevreControles,
  ChevreDescendance,
  ChevreVisites,
} from '@/features/cheptel/components/ficheChevre/ChevreHistorique';
import { ChevreSortieFab } from '@/features/cheptel/components/ficheChevre/ChevreSortieFab';
import { libelleChevre, statutLabel } from '@/features/cheptel/utils/chevreLabel';
import { STATUT_CHEVRE, VUE_FICHE_CHEVRE } from '@/shared/constants/cheptel';
import { ROUTES } from '@/shared/constants/routes';
import { styles } from '@/shared/styles/cheptel/FicheChevre.styles';
import { commonStyles } from '@/shared/styles/commonStyles';
import { TEXTES } from '@/shared/textes';

export default function FicheChevre() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { settings } = useAppSettings();
  const fiche = useFicheChevre(id);
  const { chevre, form } = fiche;

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
        <ChevreEntete chevre={chevre} onMenu={() => fiche.setMenuOuvert(true)} />

        <OptionsModal
          visible={fiche.menuOuvert}
          onClose={() => fiche.setMenuOuvert(false)}
          title={libelleChevre(chevre)}
          options={[
            {
              label: TEXTES.cheptel.ficheChevre.visitesVeterinairesLength(fiche.visites.length),
              icon: 'medkit',
              onPress: () => fiche.basculerVue(VUE_FICHE_CHEVRE.VISITES),
            },
            {
              label: TEXTES.cheptel.ficheChevre.controlesLength(fiche.controles.length),
              icon: 'clipboard',
              onPress: () => fiche.basculerVue(VUE_FICHE_CHEVRE.CONTROLES),
            },
            {
              label: TEXTES.commun.general.supprimerDefinitivement,
              icon: 'trash',
              onPress: () => fiche.setVueSecondaire(VUE_FICHE_CHEVRE.SUPPRESSION),
            },
          ]}
        />

        {fiche.editing ? (
          <ChevreFormulaire
            chevre={chevre}
            form={form}
            onChange={fiche.setForm}
            onAnnuler={fiche.annulerModifications}
            onEnregistrer={fiche.enregistrerModifications}
            onAjouterCabri={ajouterUnCabri}
          />
        ) : (
          <ChevreResume
            chevre={chevre}
            indicatif={settings.exploitation?.indicatifMarquage}
            onModifier={() => fiche.setEditing(true)}
          />
        )}

        {estVivante && fiche.showStatutForm && (
          <ChevreStatutDeclaration
            chevre={chevre}
            statut={fiche.statutForm}
            date={fiche.dateStatutForm}
            onDateChange={fiche.setDateStatutForm}
            onAnnuler={() => fiche.setShowStatutForm(false)}
            onConfirmer={fiche.enregistrerStatut}
          />
        )}

        {!estVivante && <ChevreReactivation onReactiver={fiche.reactiver} />}

        {fiche.descendance.length > 0 && (
          <ChevreDescendance
            descendance={fiche.descendance}
            onOuvrir={(idPetit) => router.push(ROUTES.ficheChevre(idPetit))}
          />
        )}

        {fiche.vueSecondaire === VUE_FICHE_CHEVRE.VISITES && (
          <ChevreVisites chevre={chevre} visites={fiche.visites} />
        )}
        {fiche.vueSecondaire === VUE_FICHE_CHEVRE.CONTROLES && (
          <ChevreControles chevre={chevre} controles={fiche.controles} />
        )}
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
