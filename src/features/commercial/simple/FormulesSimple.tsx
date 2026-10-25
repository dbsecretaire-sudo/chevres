import { useCallback, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { lireArchiveCommercial } from '@/features/commercial/repository';
import { noterAEnvoyer } from '@/shared/storage/aEnvoyer';
import { elementsDeFormule, enregistrerFormule } from '@/features/commercial/services/agritourisme';
import type { ElementFormule, FormuleAgritourisme } from '@/features/commercial/types';
import { VisitesSimple } from '@/features/commercial/simple/VisitesSimple';
import { ListeDeChoix } from '@/features/production/simple/ListeDeChoix';
import { Button } from '@/shared/components/Button';
import { Checkbox } from '@/shared/components/Checkbox';
import { FormField } from '@/shared/components/FormField';
import { styles } from '@/shared/styles/roles/Roles.styles';
import { colors } from '@/shared/theme/colors';
import { TEXTES } from '@/shared/textes';
import { formatMontant } from '@/shared/utils/dates';
import { generateId } from '@/shared/utils/id';
import { parseDecimal } from '@/shared/utils/nombres';

const T = TEXTES.commercial.agritourisme.simple;

/** Le choix « Ajouter une formule », en tête de la liste des formules. */
const AJOUT = 'ajout';

type Etape =
  | { nom: 'liste' }
  | { nom: 'visites'; formule: FormuleAgritourisme }
  | { nom: 'ajout' }
  | { nom: 'fait'; formule: FormuleAgritourisme };

/**
 * Les formules en tuiles, au plus simple : « Ajouter une formule » (son nom, son prix par personne, puis ce qu'elle comprend, à cocher) et les formules existantes ; un
 * appui sur une formule montre ses visites.
 */
export function FormulesSimple({ onTerminer }: { onTerminer: () => void }) {
  const [formules, setFormules] = useState<FormuleAgritourisme[] | null>(null);
  const [elements, setElements] = useState<ElementFormule[]>([]);
  const [etape, setEtape] = useState<Etape>({ nom: 'liste' });
  const [nom, setNom] = useState('');
  const [prix, setPrix] = useState('');
  const [coches, setCoches] = useState<string[]>([]);
  const [enCours, setEnCours] = useState(false);

  const charger = useCallback(
    () =>
      lireArchiveCommercial()
        .then((archive) => {
          setFormules(archive.formules);
          setElements(elementsDeFormule(archive));
        })
        .catch(() => undefined),
    [],
  );
  useFocusEffect(
    useCallback(() => {
      charger();
    }, [charger]),
  );

  const enregistrer = async () => {
    if (enCours) return;
    setEnCours(true);
    try {
      const formule: FormuleAgritourisme = { id: generateId(), nom: nom.trim(), prix: parseDecimal(prix), elements: coches };
      await enregistrerFormule(formule);
      await noterAEnvoyer();
      await charger();
      setEtape({ nom: 'fait', formule });
    } finally {
      setEnCours(false);
    }
  };

  if (etape.nom === 'visites')
    return <VisitesSimple formuleId={etape.formule.id} titre={etape.formule.nom} onRetour={() => setEtape({ nom: 'liste' })} />;

  if (etape.nom === 'ajout')
    return (
      <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }} keyboardShouldPersistTaps="handled">
        <Text style={styles.titre}>{T.ajouterUneFormule}</Text>
        <FormField label={T.nomDeLaFormule} value={nom} onChangeText={setNom} autoFocus />
        <FormField label={T.prixParPersonneEuros} value={prix} onChangeText={setPrix} keyboardType="decimal-pad" />
        <Text style={styles.message}>{T.ceQuellComprend}</Text>
        {elements.map((e) => (
          <Checkbox
            key={e.id}
            label={e.nom}
            value={coches.includes(e.id)}
            onChange={(c) => setCoches((actuels) => (c ? [...actuels, e.id] : actuels.filter((x) => x !== e.id)))}
          />
        ))}
        <Button label={T.enregistrerLaFormule} loading={enCours} disabled={!nom.trim() || !(parseDecimal(prix) >= 0) || prix.trim() === ''} onPress={enregistrer} />
        <Button label={T.retour} variant="secondary" onPress={() => setEtape({ nom: 'liste' })} />
      </ScrollView>
    );

  if (etape.nom === 'fait')
    return (
      <View style={styles.contenu}>
        <Ionicons name="checkmark-circle" size={96} color={colors.primary} style={styles.coche} />
        <Text style={styles.message}>{T.formuleEnregistree}</Text>
        <Text style={styles.detail}>{`${etape.formule.nom} · ${T.parPersonne(formatMontant(etape.formule.prix))}`}</Text>
        <Button
          label={T.terminer}
          onPress={() => {
            setNom('');
            setPrix('');
            setCoches([]);
            setEtape({ nom: 'liste' });
          }}
        />
      </View>
    );

  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
      <Text style={styles.titre}>{TEXTES.accueil.ferme.terrain.tuiles.formules}</Text>
      <ListeDeChoix
        presentation="tuiles"
        choix={[
          { cle: AJOUT, libelle: T.ajouterUneFormule, icone: 'plus-circle' as const },
          ...(formules ?? []).map((f) => ({
            cle: f.id,
            libelle: `${f.nom}\n${[
              elements
                .filter((e) => f.elements.includes(e.id))
                .map((e) => e.court ?? e.nom)
                .join(' + '),
              T.parPersonne(formatMontant(f.prix)),
            ]
              .filter(Boolean)
              .join(' · ')}`,
            icone: 'silverware-fork-knife' as const,
          })),
        ]}
        onChoisir={(c) => {
          if (c.cle === AJOUT) {
            setNom('');
            setPrix('');
            setCoches([]);
            return setEtape({ nom: 'ajout' });
          }
          const formule = (formules ?? []).find((f) => f.id === c.cle);
          if (formule) setEtape({ nom: 'visites', formule });
        }}
      />
      <Pressable style={styles.discret} onPress={onTerminer} accessibilityRole="button">
        <Text style={styles.discretTexte}>{T.retour}</Text>
      </Pressable>
    </ScrollView>
  );
}
