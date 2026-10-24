import { useCallback, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { listClients } from '@/features/clients/repository';
import type { Client } from '@/features/clients/types';
import { enregistrerVisite, montantVisite } from '@/features/commercial/services/agritourisme';
import { lireArchiveCommercial } from '@/features/commercial/repository';
import type { FormuleAgritourisme } from '@/features/commercial/types';
import { ListeDeChoix } from '@/features/production/simple/ListeDeChoix';
import { Button } from '@/shared/components/Button';
import { DateField } from '@/shared/components/DateField';
import { FormField } from '@/shared/components/FormField';
import { STATUT_VISITE } from '@/shared/constants/agritourisme';
import { styles } from '@/shared/styles/roles/Roles.styles';
import { colors } from '@/shared/theme/colors';
import { TEXTES } from '@/shared/textes';
import { formatMontant, todayISO } from '@/shared/utils/dates';
import { generateId } from '@/shared/utils/id';
import { parseDecimal } from '@/shared/utils/nombres';
import { nomComplet } from '@/shared/utils/personne';

const T = TEXTES.commercial.agritourisme.simple;

/** Combien de contacts montrer au plus d'un coup (la recherche réduit la liste). */
const CONTACTS_MONTRES = 30;

/** Où l'on en est : le contact, la formule, le nombre de personnes, le prix final, puis la visite est notée. */
type Etape =
  | { nom: 'contact' }
  | { nom: 'formule'; client: Client }
  | { nom: 'personnes'; client: Client; formule: FormuleAgritourisme }
  | { nom: 'prix'; client: Client; formule: FormuleAgritourisme; personnes: number }
  | { nom: 'fait'; resume: string };

/**
 * « Nouvelle visite » au plus simple : le contact, la formule, le nombre de personnes, puis le prix final à payer (le total de la formule, qu'on peut corriger) et le jour.
 * La visite est notée « à venir » ; sa réalisation (recette, stock) se fait dans sa fiche.
 */
export function NouvelleVisiteSimple({ onTerminer }: { onTerminer: () => void }) {
  const [clients, setClients] = useState<Client[]>([]);
  const [formules, setFormules] = useState<FormuleAgritourisme[]>([]);
  const [etape, setEtape] = useState<Etape>({ nom: 'contact' });
  const [recherche, setRecherche] = useState('');
  const [personnes, setPersonnes] = useState('');
  const [prixFinal, setPrixFinal] = useState('');
  const [date, setDate] = useState(todayISO());
  const [enCours, setEnCours] = useState(false);

  useFocusEffect(
    useCallback(() => {
      Promise.all([listClients(), lireArchiveCommercial()])
        .then(([tous, archive]) => {
          setClients(tous);
          setFormules(archive.formules);
        })
        .catch(() => undefined);
    }, []),
  );

  const enregistrer = async (client: Client, formule: FormuleAgritourisme, nombre: number) => {
    if (enCours) return;
    const total = parseDecimal(prixFinal);
    if (!(total >= 0)) return;
    setEnCours(true);
    try {
      const visite = {
        id: generateId(),
        date,
        clientId: client.id,
        client: nomComplet(client),
        formuleId: formule.id,
        formule: formule.nom,
        participants: nombre,
        // Le prix final corrigé se ramène au prix par personne de la visite.
        prixParPersonne: Math.round((total / nombre) * 100) / 100,
        statut: STATUT_VISITE.PREVUE,
      };
      await enregistrerVisite(visite);
      setEtape({ nom: 'fait', resume: T.resume(visite.client, nombre, formatMontant(montantVisite(visite))) });
    } finally {
      setEnCours(false);
    }
  };

  const filtres = clients
    .filter((c) => nomComplet(c).toLowerCase().includes(recherche.trim().toLowerCase()))
    .slice(0, CONTACTS_MONTRES);

  return (
    <View style={{ flex: 1 }}>
      {etape.nom === 'contact' ? (
        <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }} keyboardShouldPersistTaps="handled">
          <Text style={styles.titre}>{T.quelContact}</Text>
          <FormField label={T.rechercher} value={recherche} onChangeText={setRecherche} />
          {clients.length > 0 && filtres.length === 0 ? <Text style={styles.detail}>{T.aucunContact}</Text> : null}
          <ListeDeChoix
            presentation="tuiles"
            choix={filtres.map((c) => ({ cle: c.id, libelle: nomComplet(c), icone: 'account' as const }))}
            onChoisir={(c) => {
              const client = clients.find((x) => x.id === c.cle);
              if (client) setEtape({ nom: 'formule', client });
            }}
          />
          <Pressable style={styles.discret} onPress={onTerminer} accessibilityRole="button">
            <Text style={styles.discretTexte}>{T.retour}</Text>
          </Pressable>
        </ScrollView>
      ) : null}

      {etape.nom === 'formule' ? (
        <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
          <Text style={styles.detail}>{nomComplet(etape.client)}</Text>
          <Text style={styles.titre}>{T.quelleFormule}</Text>
          {formules.length === 0 ? <Text style={styles.detail}>{T.aucuneFormule}</Text> : null}
          <ListeDeChoix
            presentation="tuiles"
            choix={formules.map((f) => ({ cle: f.id, libelle: `${f.nom}\n${T.parPersonne(formatMontant(f.prix))}`, icone: 'silverware-fork-knife' as const }))}
            onChoisir={(c) => {
              const formule = formules.find((x) => x.id === c.cle);
              if (!formule) return;
              setPersonnes('');
              setEtape({ nom: 'personnes', client: etape.client, formule });
            }}
          />
          <Pressable style={styles.discret} onPress={() => setEtape({ nom: 'contact' })} accessibilityRole="button">
            <Text style={styles.discretTexte}>{T.retour}</Text>
          </Pressable>
        </ScrollView>
      ) : null}

      {etape.nom === 'personnes' ? (
        <View style={styles.contenu}>
          <Text style={styles.detail}>{`${nomComplet(etape.client)} · ${etape.formule.nom}`}</Text>
          <Text style={styles.titre}>{T.combienDePersonnes}</Text>
          <FormField label={T.personnes} value={personnes} onChangeText={setPersonnes} keyboardType="number-pad" autoFocus />
          <Button
            label={T.valider}
            disabled={!(Math.round(parseDecimal(personnes)) > 0)}
            onPress={() => {
              const nombre = Math.round(parseDecimal(personnes));
              setPrixFinal(String(Math.round(nombre * etape.formule.prix * 100) / 100).replace('.', ','));
              setEtape({ nom: 'prix', client: etape.client, formule: etape.formule, personnes: nombre });
            }}
          />
          <Button label={T.retour} variant="secondary" onPress={() => setEtape({ nom: 'formule', client: etape.client })} />
        </View>
      ) : null}

      {etape.nom === 'prix' ? (
        <View style={styles.contenu}>
          <Text style={styles.detail}>{`${nomComplet(etape.client)} · ${etape.formule.nom} · ${T.nPersonnes(etape.personnes)}`}</Text>
          <Text style={styles.titre}>{T.prixFinal}</Text>
          <FormField label={T.prixEnEuros} value={prixFinal} onChangeText={setPrixFinal} keyboardType="decimal-pad" autoFocus />
          <DateField label={T.jour} value={date} onChange={setDate} />
          <Button
            label={T.enregistrer}
            loading={enCours}
            disabled={!(parseDecimal(prixFinal) >= 0) || prixFinal.trim() === ''}
            onPress={() => enregistrer(etape.client, etape.formule, etape.personnes)}
          />
          <Button label={T.retour} variant="secondary" onPress={() => setEtape({ nom: 'personnes', client: etape.client, formule: etape.formule })} />
        </View>
      ) : null}

      {etape.nom === 'fait' ? (
        <View style={styles.contenu}>
          <Ionicons name="checkmark-circle" size={96} color={colors.primary} style={styles.coche} />
          <Text style={styles.message}>{T.visiteEnregistree}</Text>
          <Text style={styles.detail}>{etape.resume}</Text>
          <Button label={T.terminer} onPress={onTerminer} />
          <Button
            label={T.uneAutre}
            variant="secondary"
            onPress={() => {
              setRecherche('');
              setEtape({ nom: 'contact' });
            }}
          />
        </View>
      ) : null}
    </View>
  );
}
