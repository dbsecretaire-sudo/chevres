import { pont } from '@/bureau/pont';

/**
 * La connexion Google de la version Windows : les mêmes fonctions que @react-native-google-signin/google-signin, mais la connexion se
 * fait dans le navigateur de l'ordinateur (voir bureau/google.js). Internet ne sert qu'ici, pour Google Drive.
 */
export const statusCodes = {
  IN_PROGRESS: 'IN_PROGRESS',
  PLAY_SERVICES_NOT_AVAILABLE: 'PLAY_SERVICES_NOT_AVAILABLE',
} as const;

export const isErrorWithCode = (_erreur: unknown): _erreur is { code: string; message: string } => false;

export const isSuccessResponse = (reponse: { type?: string }): boolean => reponse.type === 'success';

const reussite = (email: string) => ({ type: 'success' as const, data: { user: { email } } });

/** Le message d'une erreur venue de l'ordinateur, sans le préfixe que le pont y ajoute. */
const message = (erreur: unknown): Error =>
  new Error(
    String((erreur as Error)?.message ?? erreur).replace(
      /^Error invoking remote method '[^']+': (Error: )?/,
      '',
    ),
  );

export const GoogleSignin = {
  /** Rien à régler ici : les identifiants sont dans le fichier google.json de l'ordinateur. */
  configure: (_options?: unknown): void => undefined,
  hasPlayServices: async (_options?: unknown): Promise<boolean> => true,
  async signIn() {
    const connexion = await pont()
      .google.connexion()
      .catch((erreur: unknown) => {
        throw message(erreur);
      });
    return connexion ? reussite(connexion.email) : { type: 'cancelled' as const, data: null };
  },
  async signInSilently() {
    const email = await pont().google.email();
    return email === null ? { type: 'noSavedCredentialFound' as const, data: null } : reussite(email);
  },
  async getTokens(): Promise<{ accessToken: string }> {
    const accessToken = await pont().google.jeton();
    if (!accessToken) throw new Error('Pas de connexion Google.');
    return { accessToken };
  },
  hasPreviousSignIn: async (): Promise<boolean> => (await pont().google.email()) !== null,
  revokeAccess: (): Promise<void> => pont().google.deconnexion(),
  signOut: async (): Promise<void> => undefined,
};
