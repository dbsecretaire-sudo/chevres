import { useCallback, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { montantVisite } from '@/features/commercial/services/agritourisme';
import { lireArchiveCommercial } from '@/features/commercial/repository';
import type { VisiteAgritourisme } from '@/features/commercial/types';
import { ListeDeChoix } from '@/features/production/simple/ListeDeChoix';
import { Button } from '@/shared/components/Button';
import { ROUTES } from '@/shared/constants/routes';
import { styles } from '@/shared/styles/roles/Roles.styles';
import { TEXTES } from '@/shared/textes';
import { formatDateFR, formatMontant } from '@/shared/utils/dates';

const T = TEXTES.commercial.agritourisme.simple;

/** Les visites, de la plus récente à la plus ancienne (celles d'une formule seulement quand `formuleId` est donné). */
export const visitesTriees = (visites: VisiteAgritourisme[], formuleId?: string): VisiteAgritourisme[] =>
  visites.filter((v) => !formuleId || v.formuleId === formuleId).sort((a, b) => b.date.localeCompare(a.date));

/**
 * Les visites en tuiles, au plus simple : le groupe, le jour, la formule, le nombre de personnes et le prix. Un appui montre la visite en quelques lignes, avec un lien vers
 * sa fiche. `formuleId` : seulement les visites de cette formule ; `titre` et `onRetour` : le titre de la page et ce que « Retour » fait (l'écran d'avant sinon).
 */
export function VisitesSimple({ formuleId, titre, onRetour }: { formuleId?: string; titre?: string; onRetour?: () => void }) {
  const router = useRouter();
  const [visites, setVisites] = useState<VisiteAgritourisme[] | null>(null);
  const [choisie, setChoisie] = useState<VisiteAgritourisme | null>(null);

  useFocusEffect(
    useCallback(() => {
      lireArchiveCommercial()
        .then((archive) => setVisites(visitesTriees(archive.visites, formuleId)))
        .catch(() => undefined);
    }, [formuleId]),
  );

  const retour = onRetour ?? (() => router.back());

  if (choisie)
    return (
      <View style={styles.contenu}>
        <Text style={styles.detail}>{T.statuts[choisie.statut]}</Text>
        <Text style={styles.titre}>{choisie.client}</Text>
        <Text style={styles.message}>{formatDateFR(choisie.date)}</Text>
        <Text style={styles.detail}>{`${choisie.formule} · ${T.nPersonnes(choisie.participants)}`}</Text>
        <Text style={styles.message}>{formatMontant(montantVisite(choisie))}</Text>
        <Button label={T.ouvrirLaFiche} onPress={() => router.push(ROUTES.visiteAgritourisme(choisie.id) as never)} />
        <Button label={T.retour} variant="secondary" onPress={() => setChoisie(null)} />
      </View>
    );

  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
      <Text style={styles.titre}>{titre ?? T.lesVisites}</Text>
      {visites !== null && visites.length === 0 ? <Text style={styles.detail}>{T.aucuneVisite}</Text> : null}
      <ListeDeChoix
        presentation="tuiles"
        choix={(visites ?? []).map((v) => ({
          cle: v.id,
          libelle: `${v.client}\n${formatDateFR(v.date)} · ${v.formule} · ${T.nPersonnes(v.participants)} · ${formatMontant(montantVisite(v))}`,
          icone: 'calendar-check' as const,
        }))}
        onChoisir={(c) => setChoisie((visites ?? []).find((v) => v.id === c.cle) ?? null)}
      />
      <Pressable style={styles.discret} onPress={retour} accessibilityRole="button">
        <Text style={styles.discretTexte}>{T.retour}</Text>
      </Pressable>
    </ScrollView>
  );
}
