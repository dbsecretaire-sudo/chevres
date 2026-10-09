import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Client } from '@/features/clients/types';
import type { ArchiveDossiers } from '@/features/dossiers/types';
import { lignesDeLaNote, totalDeLaNote } from '@/features/dossiers/services/facturation';
import { cleStockagePour, type Etablissement } from '@/features/etablissements/repository';
import { normaliserArchiveGite } from '@/features/gite/repository';
import type { ArchiveGite } from '@/features/gite/types';
import type { ATraiter } from '@/features/a-traiter/types';
import { GENRE_A_TRAITER, JOURS_SEJOUR_A_ENCAISSER, JOURS_TACHE_PROCHE } from '@/shared/constants/aTraiter';
import { STATUT_ELEMENT } from '@/shared/constants/dossiers';
import { CLE_STOCKAGE } from '@/shared/constants/stockage';
import { ajouterJours } from '@/shared/utils/calendrier';
import { formatDateShortFR, formatMontant } from '@/shared/utils/dates';
import { nomComplet } from '@/shared/utils/personne';
import { TEXTES } from '@/shared/textes';

const T = TEXTES.aTraiter;

/** Ce qui attend dans les dossiers d'un établissement : les tâches en retard ou proches, et les notes des clients à facturer. */
export function aTraiterDossiers(
  archive: ArchiveDossiers,
  clients: Client[],
  aujourdhui: string,
  etablissement: Pick<Etablissement, 'id' | 'nom'>,
): ATraiter[] {
  const nomDuClient = (id: string) => {
    const client = clients.find((c) => c.id === id);
    return client ? nomComplet(client) : '';
  };
  const limite = ajouterJours(aujourdhui, JOURS_TACHE_PROCHE);
  const base = { etablissementId: etablissement.id, etablissementNom: etablissement.nom };

  const taches = archive.elements
    .filter((e) => e.statut !== STATUT_ELEMENT.TERMINE && e.echeance && e.echeance <= limite)
    .sort((a, b) => (a.echeance ?? '').localeCompare(b.echeance ?? ''))
    .map<ATraiter>((e) => {
      const enRetard = (e.echeance ?? '') < aujourdhui;
      const echeance = formatDateShortFR(e.echeance);
      const client = nomDuClient(e.clientId);
      return {
        ...base,
        id: `tache:${e.id}`,
        genre: enRetard ? GENRE_A_TRAITER.TACHE_EN_RETARD : GENRE_A_TRAITER.TACHE_PROCHE,
        libelle: (enRetard ? T.tacheEnRetard : T.tacheProche)(e.titre, client, echeance),
        cibleId: e.id,
      };
    });

  const notes = clients.flatMap<ATraiter>((client) => {
    const lignes = lignesDeLaNote(archive.elements, client.id);
    if (lignes.length === 0) return [];
    return [
      {
        ...base,
        id: `note:${client.id}`,
        genre: GENRE_A_TRAITER.NOTE_A_FACTURER,
        libelle: T.note(nomComplet(client), lignes.length, formatMontant(totalDeLaNote(lignes))),
        cibleId: client.id,
      },
    ];
  });

  return [...taches, ...notes];
}

/** Ce qui attend au gîte : les séjours pas encore encaissés dont l'arrivée est proche (ou passée), du plus ancien au plus récent. */
export function aTraiterGite(
  archive: ArchiveGite,
  aujourdhui: string,
  etablissement: Pick<Etablissement, 'id' | 'nom'>,
): ATraiter[] {
  const limite = ajouterJours(aujourdhui, JOURS_SEJOUR_A_ENCAISSER);
  return archive.sejours
    .filter((s) => !s.abandonne && !s.paye && s.arrivee <= limite)
    .sort((a, b) => a.arrivee.localeCompare(b.arrivee))
    .map((s) => ({
      id: `sejour:${s.id}`,
      etablissementId: etablissement.id,
      etablissementNom: etablissement.nom,
      genre: GENRE_A_TRAITER.SEJOUR_A_ENCAISSER,
      libelle: T.sejour(
        s.nom,
        formatDateShortFR(s.arrivee),
        formatDateShortFR(s.depart),
        formatMontant(Math.max(0, s.prix - (s.acompte?.montant ?? 0))),
      ),
      cibleId: s.id,
    }));
}

async function lireJson<T>(etablissementId: string, suffixe: string): Promise<T | undefined> {
  const brut = await AsyncStorage.getItem(cleStockagePour(etablissementId, suffixe));
  if (!brut) return undefined;
  try {
    return JSON.parse(brut) as T;
  } catch {
    return undefined;
  }
}

/**
 * Ce qui attend dans chacun de ces établissements. Lit les données de chacun directement (sans le rendre actif) : on peut ainsi
 * tout montrer avant d'en ouvrir un.
 */
export async function lireATraiter(etablissements: Etablissement[], aujourdhui: string): Promise<ATraiter[]> {
  const groupes = await Promise.all(
    etablissements.map(async (etablissement) => {
      const [dossiers, gite, clients] = await Promise.all([
        lireJson<Partial<ArchiveDossiers>>(etablissement.id, CLE_STOCKAGE.DOSSIERS),
        lireJson<Parameters<typeof normaliserArchiveGite>[0]>(etablissement.id, CLE_STOCKAGE.GITE),
        lireJson<Client[]>(etablissement.id, CLE_STOCKAGE.CLIENTS),
      ]);
      const archive: ArchiveDossiers = {
        sousDossiers: Array.isArray(dossiers?.sousDossiers) ? dossiers.sousDossiers : [],
        elements: Array.isArray(dossiers?.elements) ? dossiers.elements : [],
      };
      const lignes = [
        ...aTraiterDossiers(archive, Array.isArray(clients) ? clients : [], aujourdhui, etablissement),
        // Un établissement sans séjour n'a pas de gîte : rien à encaisser.
        ...(gite ? aTraiterGite(normaliserArchiveGite(gite), aujourdhui, etablissement) : []),
      ];
      // Le retard d'abord, puis les genres dans l'ordre des constantes (le tri garde l'ordre des dates dans un genre).
      const ordre: string[] = Object.values(GENRE_A_TRAITER);
      return lignes.sort((a, b) => ordre.indexOf(a.genre) - ordre.indexOf(b.genre));
    }),
  );
  return groupes.flat();
}
