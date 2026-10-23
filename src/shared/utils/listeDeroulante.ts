/**
 * Le repère d'une liste déroulante (le panneau d'un choix : SelectModal, SelectModalMultiple, OptionsModal). Sur le web et sous Windows il devient un attribut `data-liste` de la
 * page : le poste de comptabilité (affichage sobre) s'en sert pour poser la liste juste sous le champ qui l'a ouverte, au lieu de la faire flotter au milieu de l'écran
 * (voir StyleComptable). Sur téléphone, il n'a aucun effet.
 */
export const LISTE_DEROULANTE = { dataSet: { liste: 'deroulante' } } as object;
