import { useState } from 'react';
import { Pressable, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '@/shared/components/Card';
import { Checkbox } from '@/shared/components/Checkbox';
import { SectionDeroulante } from '@/shared/components/SectionDeroulante';
import { TableauDeDonnees, type ColonneDuTableau } from '@/shared/components/TableauDeDonnees';
import { useDispositionComptable } from '@/shared/hooks/useDispositionComptable';
import { colors } from '@/shared/theme/colors';
import { commonStyles } from '@/shared/styles/commonStyles';

/** Une option que chaque catégorie applique ou non (une case à cocher dans le réglage de la catégorie). */
export interface OptionParCategorie {
  cle: string;
  titre: string;
  coche: (categorieId: string) => boolean;
  definir: (categorieId: string, coche: boolean) => void;
}

/** Des options du même sujet (l'affichage dans les factures, les recettes permises…), sous un titre. */
export interface GroupeDOptions {
  titre: string;
  options: OptionParCategorie[];
}

interface Props {
  categories: { id: string; nom: string }[];
  groupes: GroupeDOptions[];
}

type Categorie = Props['categories'][number];

/**
 * Les réglages des catégories vus à l'envers : pour chaque option, la liste des catégories, qu'on coche pour qu'elles l'appliquent.
 * Ce sont les mêmes réglages que dans la vue par catégorie, sous une autre présentation. Une seule option se déroule à la fois ; son
 * titre dit combien de catégories l'appliquent. Le poste de comptabilité les montre en tableaux : les options d'un sujet, avec le nombre de
 * catégories qui les appliquent ; un clic sur une option ouvre dessous le tableau des catégories, à cocher.
 */
export function ReglagesParOption({ categories, groupes }: Props) {
  const [ouverte, setOuverte] = useState<string | null>(null);
  const comptable = useDispositionComptable();
  if (comptable) {
    return (
      <>
        {groupes.map((groupe) => {
          const choisie = groupe.options.find((option) => ouverte === `${groupe.titre}|${option.cle}`);
          const colonnesOptions: ColonneDuTableau<OptionParCategorie>[] = [
            {
              cle: 'option',
              titre: 'Option',
              poids: 5,
              valeur: (option) => option.titre,
              rendu: (option) => (
                <Text style={{ fontSize: 13, fontWeight: choisie?.cle === option.cle ? '800' : '500', color: colors.text }}>{option.titre}</Text>
              ),
            },
            {
              cle: 'categories',
              titre: 'Catégories',
              poids: 1.5,
              aligne: 'centre',
              valeur: (option) => categories.filter((c) => option.coche(c.id)).length,
              texte: (option) => `${categories.filter((c) => option.coche(c.id)).length} sur ${categories.length}`,
            },
          ];
          const colonnesCategories: ColonneDuTableau<Categorie>[] = choisie
            ? [
                { cle: 'nom', titre: 'Catégorie', poids: 4, valeur: (c) => c.nom },
                {
                  cle: 'coche',
                  titre: choisie.titre,
                  poids: 2,
                  aligne: 'centre',
                  valeur: (c) => (choisie.coche(c.id) ? 1 : 0),
                  rendu: (c) => (
                    <Pressable
                      onPress={() => choisie.definir(c.id, !choisie.coche(c.id))}
                      hitSlop={8}
                      accessibilityRole="checkbox"
                      accessibilityState={{ checked: choisie.coche(c.id) }}
                      accessibilityLabel={`${choisie.titre} : ${c.nom}`}
                    >
                      <Ionicons
                        name={choisie.coche(c.id) ? 'checkbox' : 'square-outline'}
                        size={20}
                        color={choisie.coche(c.id) ? colors.primary : colors.textMuted}
                      />
                    </Pressable>
                  ),
                },
              ]
            : [];
          return (
            <Card key={groupe.titre}>
              <Text style={commonStyles.cardTitle}>{groupe.titre}</Text>
              <TableauDeDonnees
                integre
                colonnes={colonnesOptions}
                lignes={groupe.options}
                cleDeLaLigne={(option) => option.cle}
                vide=""
                onLigne={(option) => {
                  const cle = `${groupe.titre}|${option.cle}`;
                  setOuverte((actuelle) => (actuelle === cle ? null : cle));
                }}
              />
              {choisie ? (
                <TableauDeDonnees integre colonnes={colonnesCategories} lignes={categories} cleDeLaLigne={(c) => c.id} tri={{ cle: 'nom' }} vide="" />
              ) : null}
            </Card>
          );
        })}
      </>
    );
  }
  return (
    <>
      {groupes.map((groupe) => (
        <Card key={groupe.titre}>
          <Text style={commonStyles.cardTitle}>{groupe.titre}</Text>
          {groupe.options.map((option) => {
            const cle = `${groupe.titre}|${option.cle}`;
            const nombre = categories.filter((c) => option.coche(c.id)).length;
            return (
              <SectionDeroulante
                key={cle}
                titre={option.titre}
                nombre={nombre}
                accordeon
                ouverte={ouverte === cle}
                onBasculer={() => setOuverte((actuelle) => (actuelle === cle ? null : cle))}
              >
                {categories.map((c) => (
                  <Checkbox
                    key={c.id}
                    label={c.nom}
                    value={option.coche(c.id)}
                    onChange={(coche) => option.definir(c.id, coche)}
                  />
                ))}
              </SectionDeroulante>
            );
          })}
        </Card>
      ))}
    </>
  );
}
