import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { ListeDeChoix } from '@/features/production/simple/ListeDeChoix';
import { useAppSettings } from '@/features/settings/context/AppSettingsContext';
import { Button } from '@/shared/components/Button';
import { Checkbox } from '@/shared/components/Checkbox';
import { DateField } from '@/shared/components/DateField';
import { FormField } from '@/shared/components/FormField';
import { ETAPES_ATELIER, ETAPES_ATELIER_OBLIGATOIRES } from '@/shared/constants/cadreAtelier';
import { styles } from '@/shared/styles/roles/Roles.styles';
import { TEXTES } from '@/shared/textes';
import { todayISO } from '@/shared/utils/dates';

const T = TEXTES.exploitation.cadreAtelier;
const S = TEXTES.commercial.agritourisme.simple;

/**
 * Le cadre réglementaire de la fromagerie, au plus simple : une tuile par démarche (obligatoire ou à vérifier, faite ou à faire). Un appui l'explique en quelques lignes, puis
 * demande ce qu'il faut : est-elle faite, quel jour, et sa référence. Les pièces jointes, les liens et les notes se trouvent dans la page complète. `onTerminer` ferme la page.
 */
export function CadreAtelierSimple({ onTerminer }: { onTerminer: () => void }) {
  const { settings, patchSettings } = useAppSettings();
  const infos = settings.exploitation;
  const etapes = infos?.cadreAtelier ?? {};
  const [choisie, setChoisie] = useState<string | null>(null);
  const [fait, setFait] = useState(false);
  const [date, setDate] = useState('');
  const [reference, setReference] = useState('');
  const [enCours, setEnCours] = useState(false);

  const ouvrir = (cle: string) => {
    const donnees = etapes[cle] ?? {};
    setFait(!!donnees.fait);
    setDate(donnees.date ?? '');
    setReference(donnees.reference ?? '');
    setChoisie(cle);
  };

  const enregistrer = async (cle: string) => {
    if (enCours) return;
    setEnCours(true);
    try {
      await patchSettings({
        exploitation: {
          ...infos,
          cadreAtelier: {
            ...etapes,
            [cle]: {
              ...(etapes[cle] ?? {}),
              fait: fait || undefined,
              date: fait ? date || todayISO() : date || undefined,
              reference: reference.trim() || undefined,
            },
          },
        },
      });
      setChoisie(null);
    } finally {
      setEnCours(false);
    }
  };

  if (choisie) {
    const textes = T.etapes[choisie as keyof typeof T.etapes];
    return (
      <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }} keyboardShouldPersistTaps="handled">
        <Text style={styles.detail}>{ETAPES_ATELIER_OBLIGATOIRES.includes(choisie) ? T.obligatoire : T.aVerifier}</Text>
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

  const manque = ETAPES_ATELIER_OBLIGATOIRES.filter((e) => !etapes[e]?.fait);
  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
      <Text style={styles.titre}>{T.titre}</Text>
      <Text style={styles.detail}>{manque.length === 0 ? T.enRegle : S.nObligationsAFaire(manque.length)}</Text>
      <ListeDeChoix
        presentation="tuiles"
        choix={ETAPES_ATELIER.map((cle) => {
          const fini = !!etapes[cle]?.fait;
          return {
            cle,
            libelle: `${T.etapes[cle as keyof typeof T.etapes].titre}\n${ETAPES_ATELIER_OBLIGATOIRES.includes(cle) ? T.obligatoire : T.aVerifier} · ${fini ? T.fait : S.aFaire}`,
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
