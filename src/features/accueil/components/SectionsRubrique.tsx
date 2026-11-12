import { useState } from 'react';
import { useRouter } from 'expo-router';
import { GroupeAccueil } from '@/features/accueil/components/GroupeAccueil';
import type { SectionRubrique } from '@/features/accueil/rubriques/rubriquesDuPlus';
import { BlocLignes } from '@/shared/components/BlocListe';
import { ListRow } from '@/shared/components/ListRow';

/**
 * Les groupes de lignes d'une rubrique : un titre par groupe, un écran par ligne. `retour` : la page d'où l'on ouvre (la Santé) ; chaque
 * écran ouvert garde son adresse dans `retour`, et sa flèche y ramène.
 * `repliables` : les titres se replient, et un seul groupe est déplié à la fois (la page Documents).
 */
export function SectionsRubrique({ sections, retour, repliables = false }: { sections: SectionRubrique[]; retour?: string; repliables?: boolean }) {
  const router = useRouter();
  const [ouvert, setOuvert] = useState<string | null>(null);
  const adresseDe = (route: string) =>
    retour ? `${route}${route.includes('?') ? '&' : '?'}retour=${encodeURIComponent(retour)}` : route;
  return (
    <>
      {sections.map((section) => (
        <GroupeAccueil
          key={section.titre}
          titre={section.titre}
          ouvert={ouvert === section.titre}
          onBasculer={repliables ? () => setOuvert((actuel) => (actuel === section.titre ? null : section.titre)) : undefined}
        >
          <BlocLignes>
            {section.lignes.map((ligne) => (
              <ListRow
                key={ligne.libelle}
                title={ligne.libelle}
                subtitle={ligne.aide}
                icone={ligne.icone}
                onPress={() => router.push(adresseDe(ligne.route) as never)}
              />
            ))}
          </BlocLignes>
        </GroupeAccueil>
      ))}
    </>
  );
}
