import { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { listClients } from '@/features/clients/repository';
import type { Client } from '@/features/clients/types';
import { ClavierNumerique } from '@/features/berger/components/ClavierNumerique';
import { annulerVenteVivante, enregistrerVenteVivante } from '@/features/berger/services/venteVivante';
import { dateDuJour } from '@/features/berger/services/soin';
import type { Chevre } from '@/features/cheptel/types';
import { useEtablissement } from '@/features/etablissements/context/EtablissementContext';
import { Button } from '@/shared/components/Button';
import { DateField } from '@/shared/components/DateField';
import { colors } from '@/shared/theme/colors';
import { commonStyles } from '@/shared/styles/commonStyles';
import { TEXTES } from '@/shared/textes';
import { parseDecimal } from '@/shared/utils/nombres';
import { nomComplet } from '@/shared/utils/personne';

const T = TEXTES.roles.berger;

interface Props {
  animal: Chevre;
  /** Enregistré : l'écran de confirmation, avec de quoi annuler (la fonction reçoit les identifiants enregistrés). */
  onFait: (titre: string, detail: string, annuler: () => Promise<void>, ids: { venteId: string; recetteId: string }) => void;
}

/** La vente d'une chèvre vivante : l'acheteur, le prix, la date. Sans acheteur, pas de document de circulation : il faut en choisir un. */
export function VenteVivanteSimple({ animal, onFait }: Props) {
  const { espece } = useEtablissement();
  const [clients, setClients] = useState<Client[]>([]);
  const [client, setClient] = useState<Client | undefined>(undefined);
  const [prix, setPrix] = useState('');
  const [date, setDate] = useState(dateDuJour());
  const [enCours, setEnCours] = useState(false);
  const boucle = (animal.numeroBoucle ?? '').trim();
  const montant = parseDecimal(prix);
  const valide = !!client && montant > 0;

  useEffect(() => {
    listClients().then(setClients).catch(() => setClients([]));
  }, []);

  const valider = async () => {
    if (!client || !valide) return;
    setEnCours(true);
    try {
      const ids = await enregistrerVenteVivante(animal, { activite: espece, date, prix: montant, client });
      onFait(T.venteVivanteFaite, T.venteVivanteDetail(boucle, nomComplet(client)), () => annulerVenteVivante(animal, ids), ids);
    } catch (erreur) {
      Alert.alert(T.erreur, erreur instanceof Error ? erreur.message : String(erreur));
    } finally {
      setEnCours(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={commonStyles.gap10}>
      <Text style={commonStyles.cardTitle}>{T.venteVivanteAcheteur}</Text>
      {clients.length === 0 ? <Text style={commonStyles.muted}>{T.venteVivanteSansClient}</Text> : null}
      <View style={commonStyles.row}>
        {clients.map((c) => (
          <Pressable
            key={c.id}
            accessibilityRole="button"
            onPress={() => setClient(c)}
            style={[commonStyles.chip, c.id === client?.id && { backgroundColor: colors.primary }]}
          >
            <Text style={[{ fontWeight: '600', color: colors.text }, c.id === client?.id && commonStyles.textWhite]}>{nomComplet(c)}</Text>
          </Pressable>
        ))}
      </View>

      <Text style={commonStyles.cardTitle}>{T.venteVivantePrix}</Text>
      <ClavierNumerique valeur={prix} onChange={setPrix} virgule />

      <DateField label={T.mouvementDate} value={date} onChange={setDate} />

      <Button label={T.venteVivanteValider} onPress={valider} loading={enCours} disabled={!valide} />
    </ScrollView>
  );
}

