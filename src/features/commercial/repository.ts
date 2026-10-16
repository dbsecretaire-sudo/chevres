import AsyncStorage from '@react-native-async-storage/async-storage';
import { cleStockage } from '@/features/etablissements/repository';
import type { ArchiveCommercial, Commande } from '@/features/commercial/types';
import { PREFIXE_NUMERO_COMMANDE } from '@/shared/constants/commercial';
import { CLE_STOCKAGE } from '@/shared/constants/stockage';
import { generateId } from '@/shared/utils/id';

const cle = () => cleStockage(CLE_STOCKAGE.COMMERCIAL);

/** Remet une archive lue (ou reçue d'une sauvegarde) dans sa forme : rien ne manque. */
export function normaliserArchiveCommercial(
  archive: Partial<ArchiveCommercial> | undefined,
): ArchiveCommercial {
  const tarifs: ArchiveCommercial['tarifs'] = {};
  for (const [article, parCategorie] of Object.entries(archive?.tarifs ?? {})) {
    if (parCategorie && typeof parCategorie === 'object') tarifs[article] = { ...parCategorie };
  }
  return {
    commandes: Array.isArray(archive?.commandes) ? archive.commandes : [],
    formules: Array.isArray(archive?.formules) ? archive.formules : [],
    visites: Array.isArray(archive?.visites) ? archive.visites : [],
    elementsFormule: Array.isArray(archive?.elementsFormule)
      ? archive.elementsFormule.filter((e) => e && typeof e.id === 'string' && typeof e.nom === 'string')
      : undefined,
    tarifs,
  };
}

/** Les commandes et les tarifs de l'établissement actif (rien s'il n'y en a pas encore). */
export async function lireArchiveCommercial(): Promise<ArchiveCommercial> {
  const raw = await AsyncStorage.getItem(cle());
  if (!raw) return normaliserArchiveCommercial(undefined);
  try {
    return normaliserArchiveCommercial(JSON.parse(raw));
  } catch {
    return normaliserArchiveCommercial(undefined);
  }
}

/** Remplace tout — utilisé par la restauration d'une sauvegarde et le tirage depuis Google Drive. */
export async function remplacerArchiveCommercial(archive: ArchiveCommercial): Promise<void> {
  await AsyncStorage.setItem(cle(), JSON.stringify(archive));
}

export async function getCommande(id: string): Promise<Commande | undefined> {
  return (await lireArchiveCommercial()).commandes.find((c) => c.id === id);
}

/** Le numéro d'une nouvelle commande : « C-année-001 », le rang suivant de l'année. */
export function numeroDeCommande(commandes: Commande[], date: string): string {
  const prefixe = PREFIXE_NUMERO_COMMANDE;
  const annee = date.slice(0, 4);
  const debut = `${prefixe}-${annee}-`;
  const rangs = commandes
    .filter((c) => c.numero.startsWith(debut))
    .map((c) => Number(c.numero.slice(debut.length)) || 0);
  return `${debut}${String(Math.max(0, ...rangs) + 1).padStart(3, '0')}`;
}

/** Enregistre une commande : la crée (avec son numéro) ou remplace celle de même identifiant. */
export async function enregistrerCommande(
  commande: Omit<Commande, 'id' | 'numero'> & { id?: string; numero?: string },
): Promise<Commande> {
  const archive = await lireArchiveCommercial();
  const existante = commande.id ? archive.commandes.find((c) => c.id === commande.id) : undefined;
  const complete: Commande = {
    ...commande,
    id: existante?.id ?? commande.id ?? generateId(),
    numero: existante?.numero ?? commande.numero ?? numeroDeCommande(archive.commandes, commande.date),
  };
  const commandes = existante
    ? archive.commandes.map((c) => (c.id === complete.id ? complete : c))
    : [...archive.commandes, complete];
  await remplacerArchiveCommercial({ ...archive, commandes });
  return complete;
}

export async function supprimerCommande(id: string): Promise<void> {
  const archive = await lireArchiveCommercial();
  await remplacerArchiveCommercial({ ...archive, commandes: archive.commandes.filter((c) => c.id !== id) });
}

/** Fixe (ou retire, avec `undefined`) le prix d'un fromage pour une catégorie de client. */
export async function definirTarif(
  article: string,
  categorieClient: string,
  prix: number | undefined,
): Promise<void> {
  const archive = await lireArchiveCommercial();
  const parCategorie = { ...(archive.tarifs[article] ?? {}) };
  if (prix === undefined) delete parCategorie[categorieClient];
  else parCategorie[categorieClient] = prix;
  const tarifs = { ...archive.tarifs };
  if (Object.keys(parCategorie).length === 0) delete tarifs[article];
  else tarifs[article] = parCategorie;
  await remplacerArchiveCommercial({ ...archive, tarifs });
}
