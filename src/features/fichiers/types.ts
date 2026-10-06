/** Un fichier joint (à un contenu du secrétariat, à un trade) : sa fiche. Le fichier lui-même est rangé dans l'appareil. */
export interface PieceJointe {
  id: string;
  /** Nom d'origine, avec son extension (« devis.docx »). */
  nom: string;
  extension: string;
  mime: string;
  /** Date de l'ajout (AAAA-MM-JJ). */
  ajoutLe: string;
}
