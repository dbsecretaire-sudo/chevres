/** Une ligne d'équarrissage : « Équarrissage ATM », « Equarissage »… (une ou deux r). */
export const estLigneEquarrissage = (libelle: string): boolean => /[eé]quar{1,2}issage/i.test(libelle);
