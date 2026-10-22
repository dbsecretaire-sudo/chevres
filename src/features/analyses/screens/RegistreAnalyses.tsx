import { useCallback, useState } from 'react';
import { Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { verdictDeLAnalyse, type Verdict } from '@/features/analyses/services/analysesProduits';
import {
  analysesSansFabrication,
  fabricationsDuRegistre,
  PRODUITS_DU_REGISTRE,
} from '@/features/analyses/services/registreAnalyses';
import { laiterieActive } from '@/features/comptabilite/utils/recettes';
import { useAppSettings } from '@/features/settings/context/AppSettingsContext';
import type { ProduitAnalyse } from '@/features/settings/settings';
import { lireArchiveStock } from '@/features/stock/repository';
import type { ArchiveStock } from '@/features/stock/types';
import { especeCourante } from '@/shared/dictionnaire/animaux';
import { BlocLignes } from '@/shared/components/BlocListe';
import { GroupeAccueil } from '@/shared/components/GroupeAccueil';
import { ListRow } from '@/shared/components/ListRow';
import { Screen } from '@/shared/components/Screen';
import { FAMILLE_CONTROLE } from '@/shared/constants/controles';
import { ROUTES } from '@/shared/constants/routes';
import { colors } from '@/shared/theme/colors';
import { commonStyles } from '@/shared/styles/commonStyles';
import { TEXTES } from '@/shared/textes';
import { formatDateFR, formatDateShortFR } from '@/shared/utils/dates';

const T = TEXTES.analysesProduits;
const R = T.registre;

/** La couleur et l'icône de chaque jugement. */
const APPARENCE: Record<Verdict, { icone: keyof typeof Ionicons.glyphMap; couleur: string }> = {
  conforme: { icone: 'checkmark-circle', couleur: colors.success },
  surveiller: { icone: 'alert-circle', couleur: '#C98A2B' },
  non_conforme: { icone: 'close-circle', couleur: colors.danger },
};

/**
 * Le registre des analyses de l'atelier : pour chaque produit qu'on fabrique (fromages, charcuterie, plats préparés, savons), ses fabrications — les lots nés ensemble —
 * avec leurs analyses : celle qui a été faite et son jugement, ou « À analyser ». Un appui ouvre l'analyse (ou en note une nouvelle, déjà rattachée à la fabrication) ;
 * les analyses faites hors suivi des lots se retrouvent dans la liste de chaque produit.
 */
export default function RegistreAnalyses() {
  const router = useRouter();
  const { settings } = useAppSettings();
  const [archive, setArchive] = useState<ArchiveStock | null>(null);
  useFocusEffect(
    useCallback(() => {
      lireArchiveStock()
        .then(setArchive)
        .catch(() => undefined);
    }, []),
  );
  const analyses = settings.exploitation?.analysesProduits;
  // Le fromage et le savon se font avec du lait : seulement pour une espèce laitière.
  const produits = PRODUITS_DU_REGISTRE.filter((p) => (p === 'fromage' || p === 'savon' ? laiterieActive(especeCourante()) : true));

  return (
    <Screen>
      <Text style={commonStyles.note}>{R.intro}</Text>
      {produits.map((produit: ProduitAnalyse) => {
        const fabrications = archive ? fabricationsDuRegistre(archive, analyses, produit) : [];
        const horsLots = analysesSansFabrication(analyses, produit, fabrications);
        return (
          <GroupeAccueil key={produit} titre={T.produits[produit].titre}>
            <BlocLignes>
              {fabrications.length === 0 ? <Text style={commonStyles.mutedItalic}>{R.aucuneFabrication}</Text> : null}
              {fabrications.map((f) => {
                const apparence = f.verdict ? APPARENCE[f.verdict] : undefined;
                const derniere = f.analyses[0];
                return (
                  <ListRow
                    key={f.id}
                    title={`${f.libelle} · ${formatDateShortFR(f.date)}`}
                    subtitle={[
                      R.lots(f.numeros),
                      derniere
                        ? `${R.analyses(f.analyses.length)} · ${formatDateFR(derniere.date)}${f.verdict ? ` · ${T.verdicts[f.verdict]}` : ''}`
                        : R.aAnalyser,
                    ].join(' · ')}
                    trailing={
                      apparence ? (
                        <View>
                          <Ionicons name={apparence.icone} size={26} color={apparence.couleur} />
                        </View>
                      ) : (
                        <Ionicons name="flask-outline" size={24} color={colors.textMuted} />
                      )
                    }
                    onPress={() =>
                      router.push(
                        (derniere
                          ? ROUTES.analyseProduit(produit, derniere.id)
                          : ROUTES.analyseProduit(produit, undefined, f.id)) as never,
                      )
                    }
                  />
                );
              })}
              {horsLots.length > 0 ? (
                <ListRow
                  title={R.horsLots(horsLots.length)}
                  subtitle={`${formatDateFR(horsLots[0].date)}${verdictDeLAnalyse(horsLots[0]) ? ` · ${T.verdicts[verdictDeLAnalyse(horsLots[0]) as Verdict]}` : ''}`}
                  onPress={() => router.push(ROUTES.analysesProduit(produit) as never)}
                />
              ) : null}
              <ListRow
                title={R.toutes(T.produits[produit].nom)}
                icone="list"
                onPress={() => router.push(ROUTES.analysesProduit(produit) as never)}
              />
              <ListRow
                title={T.nouvelle}
                icone="add-circle"
                onPress={() => router.push(ROUTES.analyseProduit(produit) as never)}
              />
            </BlocLignes>
          </GroupeAccueil>
        );
      })}
      <GroupeAccueil titre={R.laitTitre}>
        <BlocLignes>
          <ListRow
            title={R.laitLien}
            icone="flask"
            onPress={() => router.push(ROUTES.santeControles(FAMILLE_CONTROLE.LAITIER) as never)}
          />
        </BlocLignes>
      </GroupeAccueil>
    </Screen>
  );
}
