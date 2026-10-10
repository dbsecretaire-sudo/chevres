import { useEffect, useState } from 'react';
import { BackHandler, ScrollView, Text, View } from 'react-native';
import { Screen } from '@/shared/components/ScreenList';
import { BlocLignes } from '@/shared/components/BlocListe';
import { Button } from '@/shared/components/Button';
import { ConfirmModal } from '@/shared/components/ConfirmModal';
import { InfoModal } from '@/shared/components/InfoModal';
import { Fab } from '@/shared/components/Fab';
import { useATraiter } from '@/features/a-traiter/hooks/useATraiter';
import type { ATraiter } from '@/features/a-traiter/types';
import { CarteEtablissement } from '@/features/etablissements/components/CarteEtablissement';
import { FormulaireEtablissement } from '@/features/etablissements/components/FormulaireEtablissement';
import type { DonneesEtablissement, Etablissement } from '@/features/etablissements/repository';
import { styles } from '@/shared/styles/etablissements/SelecteurEtablissement.styles';
import { commonStyles } from '@/shared/styles/commonStyles';
import { TEXTES } from '@/shared/textes';

interface Props {
  etablissements: Etablissement[];
  actifId: string;
  onChoisir: (id: string) => void;
  /** Ouvre l'établissement d'une chose à traiter, sur l'écran qui la concerne. */
  onOuvrirATraiter: (item: ATraiter) => void;
  onCreer: (donnees: DonneesEtablissement) => Promise<void>;
  onModifier: (id: string, donnees: DonneesEtablissement) => Promise<void>;
  onSupprimer: (id: string) => Promise<void>;
  onFermer: () => void;
}

/** Ce que l'écran affiche : la liste des cartes, le formulaire de création, ou celui d'un établissement. */
type Mode = { type: 'liste' } | { type: 'creation' } | { type: 'edition'; id: string };

/** Écran de choix de l'établissement : cartes, bouton « + » pour en créer, crayon pour modifier. */
export function SelecteurEtablissement({
  etablissements,
  actifId,
  onChoisir,
  onOuvrirATraiter,
  onCreer,
  onModifier,
  onSupprimer,
  onFermer,
}: Props) {
  const [mode, setMode] = useState<Mode>({ type: 'liste' });
  const [aSupprimer, setASupprimer] = useState<Etablissement | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [creationEnCours, setCreationEnCours] = useState(false);
  const aTraiter = useATraiter(etablissements);
  /** Les établissements dont on a déplié la cloche : tout est replié au départ. */
  const [ouverts, setOuverts] = useState<Record<string, boolean>>({});
  const duEtablissement = (id: string) => aTraiter.filter((i) => i.etablissementId === id);
  const estOuvert = (id: string) => ouverts[id] ?? false;

  // Plus de bouton « Retour » : le bouton retour d'Android revient à la liste, puis ferme l'écran.
  useEffect(() => {
    const abonnement = BackHandler.addEventListener('hardwareBackPress', () => {
      if (mode.type === 'liste') onFermer();
      else setMode({ type: 'liste' });
      return true;
    });
    return () => abonnement.remove();
  }, [mode.type, onFermer]);

  const t = TEXTES.etablissements.selecteurEtablissement;
  const enEdition = mode.type === 'edition' ? etablissements.find((e) => e.id === mode.id) : undefined;
  const dernier = etablissements.length <= 1;

  return (
    <Screen scroll={false} avecBordBas>
      {/* « handled » : avec le clavier ouvert, un seul appui sur « Créer » suffit (sinon le premier ne fait que fermer le clavier). */}
      <ScrollView
        style={commonStyles.flex1}
        contentContainerStyle={styles.contenu}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.top}>
          <Text style={commonStyles.heading}>{t.choisirUnEtablissement}</Text>
          {aTraiter.length > 0 ? (
            <Text style={commonStyles.muted}>{TEXTES.aTraiter.resume(aTraiter.length)}</Text>
          ) : null}
        </View>

        {mode.type === 'creation' && (
          <FormulaireEtablissement
            titre={t.nouvelEtablissement}
            libelleValider={t.creerEtOuvrir}
            enCours={creationEnCours}
            onValider={async (donnees) => {
              if (creationEnCours) return;
              setCreationEnCours(true);
              try {
                await onCreer(donnees);
              } catch (e: any) {
                setErreur(e?.message ?? String(e));
              } finally {
                setCreationEnCours(false);
              }
            }}
            onAnnuler={() => setMode({ type: 'liste' })}
          />
        )}

        {enEdition && (
          <>
            <FormulaireEtablissement
              initial={enEdition}
              titre={t.modifierLEtablissement}
              libelleValider={TEXTES.commun.general.enregistrer}
              onValider={async (donnees) => {
                await onModifier(enEdition.id, donnees);
                setMode({ type: 'liste' });
              }}
              onAnnuler={() => setMode({ type: 'liste' })}
            />
            {dernier && <Text style={commonStyles.muted}>{t.auMoinsUnEtablissement}</Text>}
            <Button
              style={styles.supprimer}
              variant="danger"
              label={t.supprimerCetEtablissement}
              disabled={dernier}
              onPress={() => setASupprimer(enEdition)}
            />
          </>
        )}

        {mode.type === 'liste' && (
          <>
            <BlocLignes>
              {etablissements.map((e) => (
                <CarteEtablissement
                  key={e.id}
                  etablissement={e}
                  actif={e.id === actifId}
                  onChoisir={() => onChoisir(e.id)}
                  onModifier={() => setMode({ type: 'edition', id: e.id })}
                  aTraiter={duEtablissement(e.id)}
                  ouvert={estOuvert(e.id)}
                  onBasculer={() => setOuverts((actuels) => ({ ...actuels, [e.id]: !estOuvert(e.id) }))}
                  onOuvrirATraiter={onOuvrirATraiter}
                />
              ))}
            </BlocLignes>
          </>
        )}
      </ScrollView>

      {mode.type === 'liste' && (
        <Fab
          options={[
            {
              label: t.ajouterUnEtablissement,
              icon: 'add-circle',
              onPress: () => setMode({ type: 'creation' }),
            },
          ]}
        />
      )}

      <InfoModal
        visible={!!erreur}
        title={t.creationImpossible}
        message={erreur ?? undefined}
        onClose={() => setErreur(null)}
      />

      <ConfirmModal
        visible={!!aSupprimer}
        title={t.supprimerCetEtablissementQuestion}
        message={t.toutesLesDonneesLocalesDe(aSupprimer?.nom ?? '')}
        confirmLabel={TEXTES.commun.general.supprimerDefinitivement}
        onCancel={() => setASupprimer(null)}
        onConfirm={async () => {
          const cible = aSupprimer;
          setASupprimer(null);
          if (cible) await onSupprimer(cible.id);
          setMode({ type: 'liste' });
        }}
      />
    </Screen>
  );
}
