import { EnTeteApplication, type PropsEnTeteApplication } from '@/shared/components/EnTeteApplication';
import { estBureau } from '@/shared/utils/plateforme';

/**
 * À ajouter aux `screenOptions` d'une pile ou d'une barre d'onglets : sur le téléphone, chaque écran prend le bandeau de la ferme (la maison, la
 * balance, les rappels) à la place de l'en-tête de navigation. Sous Windows, les menus du haut restent la navigation : rien ne change.
 */
export const enteteApplication = () =>
  estBureau()
    ? {}
    : {
        header: (props: unknown) => <EnTeteApplication {...(props as PropsEnTeteApplication)} />,
      };
