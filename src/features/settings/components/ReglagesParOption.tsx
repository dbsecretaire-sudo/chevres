import { useState } from 'react';
import { Text } from 'react-native';
import { Card } from '@/shared/components/Card';
import { Checkbox } from '@/shared/components/Checkbox';
import { SectionDeroulante } from '@/shared/components/SectionDeroulante';
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

/**
 * Les réglages des catégories vus à l'envers : pour chaque option, la liste des catégories, qu'on coche pour qu'elles l'appliquent.
 * Ce sont les mêmes réglages que dans la vue par catégorie, sous une autre présentation. Une seule option se déroule à la fois ; son
 * titre dit combien de catégories l'appliquent.
 */
export function ReglagesParOption({ categories, groupes }: Props) {
  const [ouverte, setOuverte] = useState<string | null>(null);
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
