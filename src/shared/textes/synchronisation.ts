/** Textes de l'interface — « synchronisation » (le serveur de la ferme, hébergé chez OVH). À modifier ici uniquement. */
export const TEXTES_SYNCHRONISATION = {
  titre: 'Synchronisation',
  aide: 'Les données de la ferme sont partagées entre vos appareils, via le serveur de la ferme.',
  identifiant: 'Identifiant',
  motDePasse: 'Mot de passe',
  seConnecter: 'Se connecter',
  seDeconnecter: 'Se déconnecter',
  connecteEn: (identifiant: string) => `Connecté en tant que ${identifiant}.`,
  derniere: (date: string) => `Dernière synchronisation : ${date}`,
  enAttente: (nombre: number) =>
    nombre === 0 ? 'Rien en attente d’envoi.' : `${nombre} modification${nombre > 1 ? 's' : ''} en attente d’envoi.`,
  jamais: 'Jamais synchronisé.',
  envoyer: 'Envoyer',
  recevoir: 'Recevoir',
  envoiEnCours: 'Envoi…',
  refusees: (nombre: number) =>
    `${nombre} modification${nombre > 1 ? 's' : ''} n’${nombre > 1 ? 'ont' : 'a'} pas pu partir (fiche trop lourde ou refusée). ${nombre > 1 ? 'Elles restent' : 'Elle reste'} sur cet appareil.`,
  envoyee: 'Sauvegarde envoyée',
  envoyeeTexte: 'Les données de la ferme sont sur le serveur.',
  recue: 'Sauvegarde reçue',
  recueTexte: 'Les données de la ferme ont été mises à jour sur cet appareil.',
  conflitTitre: 'Version plus récente sur le serveur',
  conflitTexte: 'Des données ont été envoyées depuis ta dernière réception. Reçois d’abord, puis envoie.',
  connexionExpiree: 'Connexion expirée',
  reconnecteToi: 'Reconnecte-toi pour continuer.',
  erreurTitre: 'Erreur de synchronisation',
  connexionRequise: 'Connecte-toi d’abord pour envoyer les données.',
  envoiSuspectTitre: 'Envoi bloqué',
  envoiSuspect: (locale: number, connue: number) =>
    `Les données de cet appareil pèsent ${Math.round(locale / 1000)} Ko, contre ${Math.round(connue / 1000)} Ko à la dernière synchronisation. Un envoi pourrait effacer les données du serveur : vérifie avant d’envoyer.`,
  envoyerQuandMeme: 'Envoyer quand même',
  annuler: 'Annuler',
} as const;
