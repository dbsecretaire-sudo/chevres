import { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { Screen } from '@/shared/components/ScreenList';
import { Button } from '@/shared/components/Button';
import { ConfirmModal } from '@/shared/components/ConfirmModal';
import { Fab } from '@/shared/components/Fab';
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
  onCreer,
  onModifier,
  onSupprimer,
  onFermer,
}: Props) {
  const [mode, setMode] = useState<Mode>({ type: 'liste' });
  const [aSupprimer, setASupprimer] = useState<Etablissement | null>(null);

  const t = TEXTES.etablissements.selecteurEtablissement;
  const enEdition = mode.type === 'edition' ? etablissements.find((e) => e.id === mode.id) : undefined;
  const dernier = etablissements.length <= 1;

  return (
    <Screen scroll={false}>
      <ScrollView style={commonStyles.flex1} contentContainerStyle={styles.contenu}>
        <View style={styles.top}>
          <Text style={commonStyles.heading}>{t.choisirUnEtablissement}</Text>
          <Text style={commonStyles.muted}>{t.chaqueEtablissementASonPropre}</Text>
        </View>

        {mode.type === 'creation' && (
          <FormulaireEtablissement
            titre={t.nouvelEtablissement}
            libelleValider={t.creerEtOuvrir}
            onValider={onCreer}
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
            <View style={styles.grille}>
              {etablissements.map((e) => (
                <CarteEtablissement
                  key={e.id}
                  etablissement={e}
                  actif={e.id === actifId}
                  onChoisir={() => onChoisir(e.id)}
                  onModifier={() => setMode({ type: 'edition', id: e.id })}
                />
              ))}
            </View>

            <Button
              style={styles.retour}
              label={TEXTES.commun.general.retour}
              variant="secondary"
              onPress={onFermer}
            />
            <View style={styles.espaceFab} />
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
