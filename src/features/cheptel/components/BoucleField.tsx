import { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/shared/theme/colors';
import { useAccentColor } from '@/shared/theme/AccentColorContext';
import { useAppSettings } from '@/features/settings/context/AppSettingsContext';
import { identificationCheptel, synchroBouclesActive } from '@/features/settings/settings';
import { loadAllYears } from '@/shared/storage/localStore';
import { CATEGORIE_STOCKAGE } from '@/shared/constants/stockage';
import { especeCourante } from '@/shared/dictionnaire/animaux';
import { ScannerBoucleModal } from '@/features/cheptel/components/ScannerBoucleModal';
import { SelectModal, type SelectOption } from '@/shared/components/SelectModal';
import { lireArchiveStock } from '@/features/stock/repository';
import { bouclesDeLInventaire, bouclesSelonLeCheptel, trierBoucles } from '@/features/stock/services/boucles';
import { ARTICLE_BOUCLE, ETAT_BOUCLE, GENRE_ARTICLE, TRI_BOUCLE } from '@/shared/constants/stock';
import { styles } from '@/shared/styles/cheptel/BoucleField.styles';
import { commonStyles } from '@/shared/styles/commonStyles';
import { useFondChamp } from '@/shared/theme/FondChampContext';
import { TEXTES } from '@/shared/textes';

const T = TEXTES.stock.boucles;

interface Props {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  required?: boolean;
  /** Un message d'erreur sous le champ (le n° est déjà utilisé, par exemple) : le champ passe en rouge. */
  erreur?: string;
  /** La boucle rouge (de remplacement) : la liste propose les boucles rouges, sans l'indicatif du cheptel. */
  rouge?: boolean;
}

/**
 * Champ n° de boucle : un appui ouvre la liste des boucles non posées de l'inventaire (celle qu'on choisit est posée sur l'animal
 * dès qu'il est enregistré ; « Aucune » vide le champ) ; un numéro qui n'y est pas se tape dans la recherche de la liste. Le
 * bouton à droite remplit le champ en scannant l'étiquette à la caméra.
 */
export function BoucleField({ label, value, onChangeText, placeholder, required, erreur, rouge }: Props) {
  const accent = useAccentColor();
  const { settings } = useAppSettings();
  // Les animaux saisis ici sont ceux de l'espèce courante : c'est l'indicatif de son cheptel qui précède la boucle.
  const indicatif = rouge
    ? undefined
    : identificationCheptel(settings.exploitation, especeCourante()).indicatifMarquage;
  /** Les sortes proposées : les boucles rouges, ou les boucles et les tiptag. */
  const sortes = (rouge ? [ARTICLE_BOUCLE.ROUGES] : [ARTICLE_BOUCLE.BOUCLES, ARTICLE_BOUCLE.TIPTAG]).map(
    (code) => `${GENRE_ARTICLE.BOUCLE}:${code}`,
  );
  const [scannerOuvert, setScannerOuvert] = useState(false);
  const [listeOuverte, setListeOuverte] = useState(false);
  /** Les boucles de l'inventaire qui ne sont pas encore posées, avec « Aucune » en premier. */
  const [disponibles, setDisponibles] = useState<SelectOption<string>[]>([]);
  const synchro = synchroBouclesActive(settings.exploitation);
  useEffect(() => {
    // Avec la synchronisation, une boucle qu'un animal porte déjà n'est plus proposée, même si l'inventaire n'a pas encore été remis à jour.
    Promise.all([lireArchiveStock(), loadAllYears(CATEGORIE_STOCKAGE.CHEPTEL)]).then(([archive, animaux]) => {
      const boucles = synchro
        ? bouclesSelonLeCheptel(archive.boucles ?? [], animaux)
        : (archive.boucles ?? []);
      setDisponibles(
        trierBoucles(
          bouclesDeLInventaire({ boucles }, ETAT_BOUCLE.NON_POSEE).filter((b) => sortes.includes(b.article)),
          TRI_BOUCLE.NUMERO,
          true,
        ).map((b) => ({ value: b.numero, label: b.numero })),
      );
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rouge, synchro]);
  const fond = useFondChamp();

  return (
    <View style={commonStyles.gap6}>
      <Text style={commonStyles.lineSemiBold}>
        {label}
        {required ? <Text style={commonStyles.required}> *</Text> : null}
        {rouge ? <Text style={commonStyles.muted}>{`  ${T.rougeEtiquette}`}</Text> : null}
      </Text>
      <View style={styles.rowStretch}>
        {indicatif ? (
          <View style={styles.indicatifBadge}>
            <Text style={styles.indicatifTexte}>{indicatif}</Text>
          </View>
        ) : null}
        <Pressable
          style={[
            commonStyles.input,
            commonStyles.flex1,
            styles.champ,
            { backgroundColor: fond },
            erreur && { borderColor: colors.danger },
          ]}
          onPress={() => setListeOuverte(true)}
          accessibilityLabel={T.choisir}
        >
          <Text style={[commonStyles.valueText, !value && { color: colors.textMuted }]} numberOfLines={1}>
            {value || placeholder}
          </Text>
        </Pressable>
        <Pressable style={styles.boutonScan} onPress={() => setScannerOuvert(true)}>
          <Ionicons name="camera" size={22} color={accent} />
        </Pressable>
      </View>

      {erreur ? <Text style={commonStyles.required}>{erreur}</Text> : null}

      <SelectModal
        visible={listeOuverte}
        titre={T.choisir}
        value={value}
        options={[{ value: '', label: T.aucune }, ...disponibles]}
        onSelect={onChangeText}
        onClose={() => setListeOuverte(false)}
        searchable
        placeholderRecherche={T.rechercher}
        libelleSaisieLibre={T.utiliser}
      />

      <ScannerBoucleModal
        visible={scannerOuvert}
        onClose={() => setScannerOuvert(false)}
        onDetected={onChangeText}
      />
    </View>
  );
}
