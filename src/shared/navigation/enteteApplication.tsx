import { EnTeteApplication, type PropsEnTeteApplication } from '@/shared/components/EnTeteApplication';

/**
 * À ajouter aux `screenOptions` d'une pile ou d'une barre d'onglets : chaque écran prend le bandeau de la ferme (la maison, la balance, les rappels)
 * à la place de l'en-tête de navigation, sur le téléphone comme sous Windows (où les menus du haut restent au-dessus).
 */
export const enteteApplication = () => ({
  header: (props: unknown) => <EnTeteApplication {...(props as PropsEnTeteApplication)} />,
});
