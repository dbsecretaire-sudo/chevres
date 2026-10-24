import { useCallback, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { enregistrerEtapeAccueil, lireArchiveCommercial } from '@/features/commercial/repository';
import { etapesAccueilManquantes } from '@/features/commercial/services/accueilPublic';
import type { ArchiveCommercial } from '@/features/commercial/types';
import { ListeDeChoix } from '@/features/production/simple/ListeDeChoix';
import { Button } from '@/shared/components/Button';
import { Checkbox } from '@/shared/components/Checkbox';
import { DateField } from '@/shared/components/DateField';
import { FormField } from '@/shared/components/FormField';
import { ETAPE_ACCUEIL, ETAPES_ACCUEIL_OBLIGATOIRES } from '@/shared/constants/agritourisme';
import { styles } from '@/shared/styles/roles/Roles.styles';
import { TEXTES } from '@/shared/textes';
import { todayISO } from '@/shared/utils/dates';

const T = TEXTES.commercial.agritourisme.accueilPublic;
const S = TEXTES.commercial.agritourisme.simple;

/** Les démarches dans l'ordre où on les fait : les obligatoires d'abord. */
const ETAPES: string[] = Object.values(ETAPE_ACCUEIL).sort(
  (a, b) => Number(ETAPES_ACCUEIL_OBLIGATOIRES.includes(b)) - Number(ETAPES_ACCUEIL_OBLIGATOIRES.includes(a)),
);

/**
 * Les obligations pour accueillir du public, au plus simple : une tuile par démarche (obligatoire ou non, faite ou à faire). Un appui l'explique en quelques lignes, puis
 * demande ce qu'il faut : est-elle faite, quel jour, et sa référence. Les pièces jointes et les liens se trouvent dans la page complète.
 */
export function AccueilPublicSimple({ onTerminer }: { onTerminer: () => void }) {
  const [archive, setArchive] = useState<ArchiveCommercial | null>(null);
  const [choisie, setChoisie] = useState<string | null>(null);
  const [fait, setFait] = useState(false);
  const [date, setDate] = useState('');
  const [reference, setReference] = useState('');
  const [enCours, setEnCours] = useState(false);

  const charger = useCallback(
    () =>
      lireArchiveCommercial()
        .then(setArchive)
        .catch(() => undefined),
    [],
  );
  useFocusEffect(
    useCallback(() => {
      charger();
    }, [charger]),
  );

  const ouvrir = (etape: string) => {
    const donnees = archive?.accueilPublic?.[etape] ?? {};
    setFait(!!donnees.fait);
    setDate(donnees.date ?? '');
    setReference(donnees.reference ?? '');
    setChoisie(etape);
  };

  const enregistrer = async (etape: string) => {
    if (enCours) return;
    setEnCours(true);
    try {
      await enregistrerEtapeAccueil(etape, {
        fait: fait || undefined,
        date: fait ? date || todayISO() : date || undefined,
        reference: reference.trim() || undefined,
      });
      await charger();
      setChoisie(null);
    } finally {
      setEnCours(false);
    }
  };

  if (choisie) {
    const textes = T.etapes[choisie as keyof typeof T.etapes];
    return (
      <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }} keyboardShouldPersistTaps="handled">
        <Text style={styles.detail}>{ETAPES_ACCUEIL_OBLIGATOIRES.includes(choisie) ? T.obligatoire : T.facultatif}</Text>
        <Text style={styles.titre}>{textes.titre}</Text>
        <Text style={styles.detail}>{textes.aide}</Text>
        <Checkbox label={T.fait} value={fait} onChange={setFait} />
        <DateField label={T.date} value={date} onChange={setDate} />
        <FormField label={textes.reference} value={reference} onChangeText={setReference} />
        <Button label={S.enregistrer} loading={enCours} onPress={() => enregistrer(choisie)} />
        <Button label={S.retour} variant="secondary" onPress={() => setChoisie(null)} />
      </ScrollView>
    );
  }

  const manque = archive ? etapesAccueilManquantes(archive) : [];
  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
      <Text style={styles.titre}>{T.titre}</Text>
      {archive ? (
        <Text style={styles.detail}>
          {manque.length === 0 ? T.enRegle : S.nObligationsAFaire(manque.length)}
        </Text>
      ) : null}
      <ListeDeChoix
        presentation="tuiles"
        choix={ETAPES.map((e) => {
          const fini = !!archive?.accueilPublic?.[e]?.fait;
          return {
            cle: e,
            libelle: `${T.etapes[e as keyof typeof T.etapes].titre}\n${ETAPES_ACCUEIL_OBLIGATOIRES.includes(e) ? T.obligatoire : T.facultatif} · ${fini ? T.fait : S.aFaire}`,
            icone: fini ? ('check-circle' as const) : ('alert-circle-outline' as const),
          };
        })}
        onChoisir={(c) => ouvrir(c.cle)}
      />
      <View>
        <Pressable style={styles.discret} onPress={onTerminer} accessibilityRole="button">
          <Text style={styles.discretTexte}>{S.retour}</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}
