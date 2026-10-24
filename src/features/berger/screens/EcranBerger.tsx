import { useEffect, useState, type ReactNode } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScannerBoucleCore } from '@/features/cheptel/components/ScannerBoucleCore';
import type { Chevre } from '@/features/cheptel/types';
import {
  animalDeLaBoucle,
  animauxDuTroupeau,
  annulerUneMort,
  annulerUneNaissance,
  enregistrerUneMort,
  enregistrerUneNaissance,
  nombresDePetits,
} from '@/features/berger/services/saisies';
import { useRole } from '@/features/roles/context/RoleContext';
import { useAppSettings } from '@/features/settings/context/AppSettingsContext';
import { useGoogleDriveSansNavigation } from '@/features/settings/hooks/useGoogleDrive';
import { Button } from '@/shared/components/Button';
import { FormField } from '@/shared/components/FormField';
import { nbPetitsMax, SEXE } from '@/shared/constants/cheptel';
import { styles } from '@/shared/styles/roles/Roles.styles';
import { AccentColorProvider } from '@/shared/theme/AccentColorContext';
import { colors } from '@/shared/theme/colors';
import { TEXTES } from '@/shared/textes';

const T = TEXTES.roles.berger;

/** Le temps, après un changement d'écran, pendant lequel les appuis sont ignorés (en millisecondes). */
const DELAI_APRES_UN_CHANGEMENT = 400;

type But = 'naissance' | 'mort';
type Zone = 'chevres' | 'fromagerie' | 'tourisme';

/** Ce que le berger fait : choisir une zone, une saisie, scanner la boucle, (pour une naissance) dire combien de petits, puis voir que c'est enregistré — avec de quoi l'annuler. */
type Etape =
  | { nom: 'accueil' }
  | { nom: 'chevres' }
  | { nom: 'bientot'; zone: Zone }
  | { nom: 'scan'; but: But }
  | { nom: 'main'; but: But }
  | { nom: 'petits'; mere: Chevre }
  | { nom: 'fait'; titre: string; detail: string; annuler: () => Promise<void> }
  | { nom: 'annule' }
  | { nom: 'erreur'; message: string; but: But };

/** Un très grand bouton : l'icône, le mot, rien d'autre. `clair` : un bouton moins haut et sans fond, pour ce qui n'est pas une saisie (Envoyer). */
function GrosBouton({
  libelle,
  onPress,
  icone,
  clair = false,
}: {
  libelle: string;
  onPress: () => void;
  icone: ReactNode;
  clair?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.grosBouton,
        clair ? [styles.grosBoutonClair, styles.grosBoutonBas] : null,
        pressed ? styles.grosBoutonAppuye : null,
      ]}
    >
      {icone}
      <Text style={[styles.grosTexte, clair ? styles.grosTexteClair : null]}>{libelle}</Text>
    </Pressable>
  );
}

/**
 * L'écran du berger, sans menu ni autre page : trois gros boutons au départ (Chèvres, Fromagerie, Tourisme). Chèvres : « Enregistrer une naissance » (on scanne la boucle de la mère, on dit
 * combien de petits, nés aujourd'hui) et « Enregistrer une mort » (on scanne la boucle, morte aujourd'hui). La secrétaire complète le reste à la maison : les fiches sont marquées « à compléter ».
 */
export default function EcranBerger() {
  const { choisir } = useRole();
  const { settings } = useAppSettings();
  const drive = useGoogleDriveSansNavigation();
  const [etape, setEtape] = useState<Etape>({ nom: 'accueil' });
  const [numero, setNumero] = useState('');
  // Un appui qui suit de trop près un changement d'écran ne compte pas : un double appui (un doigt ganté) ne doit pas déclencher le bouton de l'écran suivant, placé au même endroit.
  const [protege, setProtege] = useState(true);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setProtege(true);
    const fin = setTimeout(() => setProtege(false), DELAI_APRES_UN_CHANGEMENT);
    return () => clearTimeout(fin);
  }, [etape]);
  const accueil = () => setEtape({ nom: 'accueil' });
  const chevres = () => setEtape({ nom: 'chevres' });

  /** Envoyer sur Drive : on se connecte d'abord si l'appareil ne l'est pas, puis on relie le dossier de l'exploitation, puis les données partent. */
  const envoyer = async () => {
    if (drive.syncEnCours || drive.connexionEnCours) return;
    if (!drive.connecte) return drive.seConnecter();
    if (!settings.driveFolderId) return drive.lier();
    await drive.synchroniser('push');
  };

  /** La boucle est connue (scannée ou saisie) : on retrouve l'animal, puis on enregistre la mort ou on demande le nombre de petits. */
  const surBoucle = async (but: But, boucle: string) => {
    try {
      const animal = animalDeLaBoucle(await animauxDuTroupeau(), boucle);
      if (!animal) return setEtape({ nom: 'erreur', but, message: T.introuvable(boucle) });
      if (but === 'naissance') {
        if (animal.sexe !== SEXE.FEMELLE)
          return setEtape({ nom: 'erreur', but, message: T.pasUneFemelle(boucle) });
        return setEtape({ nom: 'petits', mere: animal });
      }
      const avant = await enregistrerUneMort(animal);
      setEtape({
        nom: 'fait',
        titre: T.mortFaite,
        detail: T.mortDetail(boucle),
        annuler: () => annulerUneMort(avant),
      });
    } catch {
      setEtape({ nom: 'erreur', but, message: T.erreur });
    }
  };

  const surPetits = async (mere: Chevre, nombre: number) => {
    try {
      const petits = await enregistrerUneNaissance(mere, nombre);
      setEtape({
        nom: 'fait',
        titre: T.naissanceFaite(nombre),
        detail: T.naissanceDetail((mere.numeroBoucle ?? '').trim()),
        annuler: () => annulerUneNaissance(petits),
      });
    } catch {
      setEtape({ nom: 'erreur', but: 'naissance', message: T.erreur });
    }
  };

  const commencer = (but: But) => {
    setNumero('');
    setEtape({ nom: 'scan', but });
  };

  return (
    <AccentColorProvider color={colors.primary} softColor={colors.badgeBg}>
      <SafeAreaView style={styles.page}>
        <View style={{ flex: 1 }} pointerEvents={protege ? 'none' : 'auto'}>
          {etape.nom === 'accueil' ? (
            <View style={styles.contenu}>
              <Text style={styles.titre}>{T.titre}</Text>
              <GrosBouton
                libelle={T.chevres}
                onPress={chevres}
                icone={<Ionicons name="paw" size={52} color={colors.blanc} />}
              />
              <GrosBouton
                libelle={T.fromagerie}
                onPress={() => setEtape({ nom: 'bientot', zone: 'fromagerie' })}
                icone={<MaterialCommunityIcons name="cheese" size={52} color={colors.blanc} />}
              />
              <GrosBouton
                libelle={T.tourisme}
                onPress={() => setEtape({ nom: 'bientot', zone: 'tourisme' })}
                icone={<Ionicons name="trail-sign" size={52} color={colors.blanc} />}
              />
              <GrosBouton
                libelle={drive.syncEnCours ? T.envoiEnCours : T.envoyer}
                onPress={envoyer}
                clair
                icone={<Ionicons name="cloud-upload" size={40} color={colors.primary} />}
              />
              <Pressable style={styles.discret} onPress={() => choisir(undefined)} accessibilityRole="button">
                <Text style={styles.discretTexte}>{T.changerDeRole}</Text>
              </Pressable>
            </View>
          ) : null}

          {etape.nom === 'chevres' ? (
            <View style={styles.contenu}>
              <GrosBouton
                libelle={T.naissance}
                onPress={() => commencer('naissance')}
                icone={<Ionicons name="heart" size={56} color={colors.blanc} />}
              />
              <GrosBouton
                libelle={T.mort}
                onPress={() => commencer('mort')}
                icone={<MaterialCommunityIcons name="grave-stone" size={56} color={colors.blanc} />}
              />
              <Pressable style={styles.discret} onPress={accueil} accessibilityRole="button">
                <Text style={styles.discretTexte}>{T.retour}</Text>
              </Pressable>
            </View>
          ) : null}

          {etape.nom === 'bientot' ? (
            <View style={styles.contenu}>
              <Text style={styles.titre}>{etape.zone === 'fromagerie' ? T.fromagerie : T.tourisme}</Text>
              <Text style={styles.message}>{T.bientot}</Text>
              <Button label={T.retour} onPress={accueil} />
            </View>
          ) : null}

          {etape.nom === 'scan' ? (
            <View style={styles.scanner}>
              <Text style={[styles.message, styles.messageClair, { padding: 12 }]}>
                {etape.but === 'naissance' ? T.scanNaissance : T.scanMort}
              </Text>
              <ScannerBoucleCore
                onDetected={(boucle) => surBoucle(etape.but, boucle)}
                texteSecondaire={T.saisirAMain}
                onSecondaire={() => setEtape({ nom: 'main', but: etape.but })}
              />
              <Pressable style={styles.discret} onPress={chevres} accessibilityRole="button">
                <Text style={[styles.discretTexte, styles.messageClair]}>{T.retour}</Text>
              </Pressable>
            </View>
          ) : null}

          {etape.nom === 'main' ? (
            <View style={styles.contenu}>
              <FormField
                label={T.numeroAMain}
                value={numero}
                onChangeText={setNumero}
                keyboardType="number-pad"
                autoFocus
              />
              <Button
                label={T.valider}
                disabled={!numero.trim()}
                onPress={() => surBoucle(etape.but, numero)}
              />
              <Button label={T.retour} variant="secondary" onPress={chevres} />
            </View>
          ) : null}

          {etape.nom === 'petits' ? (
            <View style={styles.contenu}>
              <Text style={styles.detail}>{T.mere((etape.mere.numeroBoucle ?? '').trim())}</Text>
              <Text style={styles.titre}>{T.combienDePetits}</Text>
              <View style={styles.rangeeNombres}>
                {nombresDePetits(nbPetitsMax()).map((n) => (
                  <Pressable
                    key={n}
                    accessibilityRole="button"
                    accessibilityLabel={String(n)}
                    onPress={() => surPetits(etape.mere, n)}
                    style={({ pressed }) => [styles.nombre, pressed ? styles.grosBoutonAppuye : null]}
                  >
                    <Text style={styles.nombreTexte}>{n}</Text>
                  </Pressable>
                ))}
              </View>
              <Pressable style={styles.discret} onPress={chevres} accessibilityRole="button">
                <Text style={styles.discretTexte}>{T.retour}</Text>
              </Pressable>
            </View>
          ) : null}

          {etape.nom === 'fait' ? (
            <View style={styles.contenu}>
              <Ionicons name="checkmark-circle" size={96} color={colors.primary} style={styles.coche} />
              <Text style={styles.message}>{etape.titre}</Text>
              <Text style={styles.detail}>{etape.detail}</Text>
              <Button label={T.terminer} onPress={chevres} />
              <Button
                label={T.annuler}
                variant="secondary"
                onPress={async () => {
                  await etape.annuler();
                  setEtape({ nom: 'annule' });
                }}
              />
            </View>
          ) : null}

          {etape.nom === 'annule' ? (
            <View style={styles.contenu}>
              <Text style={styles.message}>{T.annulee}</Text>
              <Button label={T.terminer} onPress={chevres} />
            </View>
          ) : null}

          {etape.nom === 'erreur' ? (
            <View style={styles.contenu}>
              <Text style={styles.erreur}>{etape.message}</Text>
              <Button label={T.reessayer} onPress={() => commencer(etape.but)} />
              <Button label={T.retour} variant="secondary" onPress={chevres} />
            </View>
          ) : null}
        </View>
      </SafeAreaView>
    </AccentColorProvider>
  );
}
