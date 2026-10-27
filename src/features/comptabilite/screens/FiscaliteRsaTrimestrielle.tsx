import { useEffect, useState } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '@/shared/components/Button';
import { Card } from '@/shared/components/Card';
import { ChoixPastilles } from '@/shared/components/ChoixPastilles';
import { Screen } from '@/shared/components/Screen';
import { ecrirePdfBase64EtPartager } from '@/features/export/services/htmlPdf';
import {
  declarationRsaTrimestrielle,
  montantsDuMois,
  moisDeclares,
  type MoisDeLAnnee,
} from '@/features/comptabilite/services/declarationRsaTrimestrielle';
import { recettesPerceuesParMois, type RecettesDuMois } from '@/features/comptabilite/services/fiscalite';
import { colors } from '@/shared/theme/colors';
import { commonStyles } from '@/shared/styles/commonStyles';

const NOMS_MOIS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];

const AUCUNE_RECETTE: RecettesDuMois = { ca: 0, aidesCourantes: 0, ichn: 0 };

/** La déclaration trimestrielle RSA, préremplie d'après les recettes de l'application (la notice de la MSA règle les montants). */
export default function FiscaliteRsaTrimestrielle() {
  const aujourdhui = new Date();
  const [etude, setEtude] = useState<MoisDeLAnnee>({ annee: aujourdhui.getFullYear(), mois: aujourdhui.getMonth() + 1 });
  const [nouvelInstalle, setNouvelInstalle] = useState(false);
  const [recettes, setRecettes] = useState<Record<number, RecettesDuMois[]>>({});

  const mois = moisDeclares(etude);
  const annees = [...new Set(mois.map((m) => m.annee))].join(',');

  useEffect(() => {
    let actif = true;
    Promise.all(annees.split(',').map((a) => recettesPerceuesParMois(Number(a)).then((r) => [Number(a), r] as const))).then((paires) => {
      if (actif) setRecettes(Object.fromEntries(paires));
    });
    return () => {
      actif = false;
    };
  }, [annees]);

  const montants = mois.map((m) => montantsDuMois(recettes[m.annee]?.[m.mois - 1] ?? AUCUNE_RECETTE, nouvelInstalle));
  const ichn = mois.reduce((somme, m) => somme + (recettes[m.annee]?.[m.mois - 1]?.ichn ?? 0), 0);

  const changerEtude = (ecart: number) => {
    const rang = etude.annee * 12 + (etude.mois - 1) + ecart;
    setEtude({ annee: Math.floor(rang / 12), mois: (rang % 12) + 1 });
  };

  const preparer = async () => {
    try {
      const base64 = await declarationRsaTrimestrielle(mois, montants);
      const titre = 'Déclaration trimestrielle RSA';
      await ecrirePdfBase64EtPartager(base64, `declaration-trimestrielle-rsa-${etude.annee}-${etude.mois}.pdf`, titre);
    } catch (e: unknown) {
      Alert.alert(e instanceof Error ? e.message : 'Le formulaire ne peut pas être préparé.');
    }
  };

  return (
    <Screen>
      <Card>
        <Text style={commonStyles.cardTitle}>Étude des droits</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Pressable onPress={() => changerEtude(-1)} hitSlop={8} accessibilityLabel="Mois précédent">
            <Ionicons name="chevron-back" size={24} color={colors.primary} />
          </Pressable>
          <Text style={commonStyles.cardTitle}>
            {NOMS_MOIS[etude.mois - 1]} {etude.annee}
          </Text>
          <Pressable onPress={() => changerEtude(1)} hitSlop={8} accessibilityLabel="Mois suivant">
            <Ionicons name="chevron-forward" size={24} color={colors.primary} />
          </Pressable>
        </View>
        <Text style={commonStyles.muted}>
          Mois déclarés : {mois.map((m) => `${NOMS_MOIS[m.mois - 1]} ${m.annee}`).join(', ')}
        </Text>
      </Card>

      <Card>
        <Text style={commonStyles.cardTitle}>Votre situation</Text>
        <ChoixPastilles
          options={[
            { value: 'impose', label: 'Imposé sur une année complète' },
            { value: 'nouveau', label: 'Nouvel installé' },
          ]}
          value={nouvelInstalle ? 'nouveau' : 'impose'}
          onChange={(v) => setNouvelInstalle(v === 'nouveau')}
        />
        <Text style={commonStyles.muted}>
          {nouvelInstalle
            ? 'Le chiffre d’affaires des trois mois est déclaré après abattement de 87 %.'
            : 'Les revenus sont récupérés par la déclaration annuelle : la case « travailleur non-salarié » est cochée.'}
        </Text>
      </Card>

      <Card>
        <Text style={commonStyles.cardTitle}>Ce qui sera écrit</Text>
        {mois.map((m, i) => (
          <Text key={`${m.annee}-${m.mois}`} style={commonStyles.muted}>
            {NOMS_MOIS[m.mois - 1]} : {nouvelInstalle ? `chiffre d’affaires ${montants[i].ca ?? 0} €, ` : ''}
            autres ressources (PAC) {montants[i].autres ?? 0} €
            {montants[i].aucuneRessource ? ', aucune ressource' : ''}
          </Text>
        ))}
        {ichn > 0 ? (
          <Text style={commonStyles.note}>
            L’ICHN ({ichn} € sur ces mois) n’est pas dans ce formulaire : elle se déclare dans la déclaration annuelle.
          </Text>
        ) : null}
      </Card>

      <Button label="Préparer le formulaire" onPress={preparer} />
      <Text style={commonStyles.note}>
        Le formulaire est prérempli : vérifiez-le, complétez l’identité et signez-le avant de l’envoyer à la MSA.
      </Text>
    </Screen>
  );
}
