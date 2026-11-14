import { useRouter } from 'expo-router';
import { GroupeAccueil } from '@/features/accueil/components/GroupeAccueil';
import type { SectionRubrique } from '@/features/accueil/rubriques/rubriquesDuPlus';
import { BlocLignes } from '@/shared/components/BlocListe';
import { ListRow } from '@/shared/components/ListRow';

/**
 * Les groupes de lignes d'une rubrique : un titre par groupe, un écran par ligne. `retour` : la page d'où l'on ouvre (la Santé) ; chaque
 * écran ouvert garde son adresse dans `retour`, et sa flèche y ramène. Les titres se replient quand la page est dans un `MenusRepliables`.
 */
export function SectionsRubrique({ sections, retour }: { sections: SectionRubrique[]; retour?: string }) {
  const router = useRouter();
  const adresseDe = (route: string) =>
    retour ? `${route}${route.includes('?') ? '&' : '?'}retour=${encodeURIComponent(retour)}` : route;
  return (
    <>
      {sections.map((section) => (
        <GroupeAccueil key={section.titre} titre={section.titre}>
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
