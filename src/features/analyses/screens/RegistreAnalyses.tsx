import { useCallback, useState } from 'react';
import { Alert, Text, View } from 'react-native';
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
import { exporterRegistreAnalysesPdf } from '@/features/export/documents/registreAnalysesPdf';
import { BlocLignes } from '@/shared/components/BlocListe';
import { Button } from '@/shared/components/Button';
import { Fab } from '@/shared/components/Fab';
import { TableauDeDonnees, type ColonneDuTableau } from '@/shared/components/TableauDeDonnees';
import { useDispositionComptable } from '@/shared/hooks/useDispositionComptable';
import { OptionsModal } from '@/shared/components/OptionsModal';
import { SectionDeroulante } from '@/shared/components/SectionDeroulante';
import { GroupeAccueil } from '@/features/accueil/components/GroupeAccueil';
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

/** Une fabrication du registre, telle que la rend `fabricationsDuRegistre`. */
type Fabrication = ReturnType<typeof fabricationsDuRegistre>[number];

/** Les colonnes du tableau d'un produit (poste de comptabilité) : la fabrication, ses lots, ses analyses et le jugement de la dernière. */
const COLONNES: readonly ColonneDuTableau<Fabrication>[] = [
  { cle: 'date', titre: 'Date', poids: 1.1, valeur: (f) => f.date, texte: (f) => formatDateShortFR(f.date) },
  { cle: 'fabrication', titre: 'Fabrication', poids: 2.2, valeur: (f) => f.libelle },
  { cle: 'lots', titre: 'Lots', poids: 2, valeur: (f) => R.lots(f.numeros) },
  { cle: 'analyses', titre: 'Analyses', poids: 1.2, valeur: (f) => f.analyses.length, texte: (f) => (f.analyses.length > 0 ? R.analyses(f.analyses.length) : R.aAnalyser) },
  { cle: 'derniere', titre: 'Dernière analyse', poids: 1.4, valeur: (f) => f.analyses[0]?.date ?? '', texte: (f) => (f.analyses[0] ? formatDateFR(f.analyses[0].date) : '') },
  {
    cle: 'jugement',
    titre: 'Jugement',
    poids: 1.4,
    valeur: (f) => (f.verdict ? T.verdicts[f.verdict] : ''),
    rendu: (f) =>
      f.verdict ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <Ionicons name={APPARENCE[f.verdict].icone} size={16} color={APPARENCE[f.verdict].couleur} />
          <Text style={{ fontSize: 13, color: colors.text }}>{T.verdicts[f.verdict]}</Text>
        </View>
      ) : (
        <Ionicons name="flask-outline" size={16} color={colors.textMuted} />
      ),
  },
];

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
  const comptable = useDispositionComptable();
  const { settings } = useAppSettings();
  const [archive, setArchive] = useState<ArchiveStock | null>(null);
  const [impression, setImpression] = useState(false);
  /** Le produit déroulé (téléphone) : un seul à la fois, tous enroulés au départ. */
  const [ouvert, setOuvert] = useState<string | null>(null);
  const imprimer = (liste: readonly ProduitAnalyse[]) => {
    setImpression(false);
    exporterRegistreAnalysesPdf(liste).catch((e: unknown) => Alert.alert(R.erreurImpression, e instanceof Error ? e.message : ''));
  };
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

  /** Un appui sur une fabrication : sa dernière analyse, ou une nouvelle déjà rattachée à elle. */
  const ouvrirFabrication = (produit: ProduitAnalyse, f: Fabrication) => {
    const derniere = f.analyses[0];
    router.push((derniere ? ROUTES.analyseProduit(produit, derniere.id) : ROUTES.analyseProduit(produit, undefined, f.id)) as never);
  };

  return (
    <Screen>
      <Text style={commonStyles.note}>{R.intro}</Text>
      {/* Une page à garder : une ligne par analyse (rien à signaler, ou à signaler), pour un produit ou pour tous. */}
      <Button variant="secondary" label={R.imprimer} onPress={() => setImpression(true)} />
      {produits.map((produit: ProduitAnalyse) => {
        const fabrications = archive ? fabricationsDuRegistre(archive, analyses, produit) : [];
        const horsLots = analysesSansFabrication(analyses, produit, fabrications);
        // Le poste de comptabilité : un tableau par produit, et les ajouts dessous (comme « Ajouter au cheptel »).
        if (comptable) {
          return (
            <GroupeAccueil key={produit} titre={T.produits[produit].titre}>
              <TableauDeDonnees
                integre
                colonnes={COLONNES}
                lignes={fabrications}
                cleDeLaLigne={(fab) => fab.id}
                tri={{ cle: 'date', decroissant: true }}
                vide={R.aucuneFabrication}
                onLigne={(fab) => ouvrirFabrication(produit, fab)}
              />
              <Fab
                options={[
                  { label: T.nouvelle, icon: 'add', onPress: () => router.push(ROUTES.analyseProduit(produit) as never) },
                  { label: R.toutes(T.produits[produit].nom), icon: 'list', color: colors.text, onPress: () => router.push(ROUTES.analysesProduit(produit) as never) },
                  ...(horsLots.length > 0
                    ? [{ label: R.horsLots(horsLots.length), icon: 'flask-outline' as const, color: colors.text, onPress: () => router.push(ROUTES.analysesProduit(produit) as never) }]
                    : []),
                ]}
              />
            </GroupeAccueil>
          );
        }
        return (
          <SectionDeroulante
            key={produit}
            titre={T.produits[produit].titre}
            nombre={fabrications.length}
            accordeon
            ouverte={ouvert === produit}
            onBasculer={() => setOuvert((actuel) => (actuel === produit ? null : produit))}
          >
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
          </SectionDeroulante>
        );
      })}
      <OptionsModal
        visible={impression}
        onClose={() => setImpression(false)}
        title={R.imprimerQuoi}
        options={[
          ...produits.map((p) => ({
            label: T.produits[p].titre,
            icon: 'print-outline' as const,
            onPress: () => imprimer([p]),
          })),
          { label: R.imprimerTout, icon: 'documents-outline' as const, onPress: () => imprimer(produits) },
        ]}
      />
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
