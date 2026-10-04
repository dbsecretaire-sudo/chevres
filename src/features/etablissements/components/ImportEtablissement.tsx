import { Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '@/shared/components/Button';
import { InfoModal } from '@/shared/components/InfoModal';
import { ListRow } from '@/shared/components/ListRow';
import type { useImportDepuisEtablissement } from '@/features/etablissements/hooks/useImportDepuisEtablissement';
import { libelleTypesEtablissement } from '@/features/etablissements/utils/typesEtablissement';
import { colors } from '@/shared/theme/colors';
import { styles } from '@/shared/styles/etablissements/ImportEtablissement.styles';
import { commonStyles } from '@/shared/styles/commonStyles';
import { TEXTES } from '@/shared/textes';

interface Props<T extends { id: string }> {
  etat: ReturnType<typeof useImportDepuisEtablissement<T>>;
  /** Vrai quand l'import est choisi : le formulaire de saisie est alors enroulé par l'écran. */
  importer: boolean;
  onBasculer: () => void;
  libelleImporter: string;
  libelleSaisir: string;
  consigne: string;
  texteVide: string;
  /** Texte d'une ligne de la liste des éléments de l'autre établissement. */
  ligne: (element: T) => { titre: string; sousTitre?: string };
}

/**
 * Bloc « OU importer depuis un autre établissement » d'un écran de création : le bouton, puis (une fois choisi)
 * la liste des autres établissements, dépliables un par un, avec leurs éléments à importer.
 * Rien ne s'affiche s'il n'y a pas d'autre établissement.
 */
export function ImportEtablissement<T extends { id: string }>({
  etat,
  importer,
  onBasculer,
  libelleImporter,
  libelleSaisir,
  consigne,
  texteVide,
  ligne,
}: Props<T>) {
  if (etat.autres.length === 0) return null;

  return (
    <>
      {!importer && <Text style={styles.ou}>{TEXTES.etablissements.importEtablissement.ou}</Text>}
      <Button
        variant={importer ? 'secondary' : 'primary'}
        label={importer ? libelleSaisir : libelleImporter}
        onPress={onBasculer}
      />

      {importer && (
        <View style={commonStyles.gap10}>
          <Text style={commonStyles.muted}>{consigne}</Text>

          {etat.autres.map((etablissement) => {
            const ouvert = etat.ouvertId === etablissement.id;
            return (
              <View key={etablissement.id} style={commonStyles.gap10}>
                <ListRow
                  title={etablissement.nom}
                  subtitle={libelleTypesEtablissement(etablissement) || undefined}
                  onPress={() => etat.basculer(etablissement.id)}
                  trailing={
                    <Ionicons
                      name={ouvert ? 'chevron-up' : 'chevron-down'}
                      size={20}
                      color={colors.textMuted}
                    />
                  }
                />
                {ouvert && (
                  <View style={styles.liste}>
                    {etat.elements.length === 0 ? (
                      <Text style={commonStyles.mutedItalic}>{texteVide}</Text>
                    ) : (
                      etat.elements.map((element) => {
                        const { titre, sousTitre } = ligne(element);
                        return (
                          <ListRow
                            key={element.id}
                            title={titre}
                            subtitle={sousTitre}
                            onPress={() => etat.importer(element)}
                            trailing={<Ionicons name="download-outline" size={20} color={colors.primary} />}
                          />
                        );
                      })
                    )}
                  </View>
                )}
              </View>
            );
          })}

          <InfoModal visible={!!etat.erreur} title={etat.erreur ?? ''} onClose={() => etat.setErreur(null)} />
        </View>
      )}
    </>
  );
}
