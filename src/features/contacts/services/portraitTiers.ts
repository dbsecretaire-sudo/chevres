import { CATEGORIE_CLIENT } from '@/shared/constants/clients';
import { CATEGORIE_FOURNISSEUR } from '@/shared/constants/fournisseurs';

/** Ce qui représente un tiers : son dessin, le décor qui l'entoure, et la couleur de son fond (de quoi faire une fiche vivante). */
export interface PortraitTiers {
  emoji: string;
  decor: string;
  fond: string;
}

const PAR_DEFAUT: PortraitTiers = { emoji: '👤', decor: '📇 ✉️ ☎️', fond: '#E8EEE0' };

/** Les portraits par catégorie (celles d'un client ou d'un fournisseur) : l'abattoir a son usine, la station sa pompe, le vétérinaire sa trousse… */
const PORTRAITS: Record<string, PortraitTiers> = {
  [CATEGORIE_FOURNISSEUR.ALIMENTS]: { emoji: '🚜', decor: '🌾 🌽 🌾', fond: '#EFE6B8' },
  [CATEGORIE_FOURNISSEUR.CARBURANT]: { emoji: '⛽', decor: '🛢️ 🚜 🛢️', fond: '#DDE3EA' },
  [CATEGORIE_FOURNISSEUR.VETERINAIRE]: { emoji: '🩺', decor: '💉 🐐 💊', fond: '#DCEBE6' },
  [CATEGORIE_FOURNISSEUR.ORGANISME]: { emoji: '🏛️', decor: '📄 🖊️ 📄', fond: '#E6E1EE' },
  [CATEGORIE_FOURNISSEUR.CHAMBRE_AGRICULTURE]: { emoji: '🏛️', decor: '🌱 📄 🌱', fond: '#E1EBD5' },
  [CATEGORIE_FOURNISSEUR.GROUPEMENT]: { emoji: '🤝', decor: '🐐 🐐 🐐', fond: '#E3EBD8' },
  [CATEGORIE_FOURNISSEUR.GROUPEMENT_SANITAIRE]: { emoji: '🛡️', decor: '🐐 💉 🐐', fond: '#DCEBE6' },
  [CATEGORIE_FOURNISSEUR.LABORATOIRE]: { emoji: '🔬', decor: '🧪 🥛 🧪', fond: '#DCEBE6' },
  [CATEGORIE_FOURNISSEUR.ABATTOIR]: { emoji: '🏭', decor: '🥩 🔪 🥩', fond: '#EBDADA' },
  [CATEGORIE_FOURNISSEUR.EQUARRISSAGE]: { emoji: '🚛', decor: '🪦 🌫️ 🪦', fond: '#E2E2E2' },
  [CATEGORIE_FOURNISSEUR.GARAGE]: { emoji: '🔧', decor: '🚜 ⚙️ 🔩', fond: '#E4E4DC' },
  [CATEGORIE_FOURNISSEUR.ASSUREUR]: { emoji: '🛡️', decor: '📑 ✍️ 📑', fond: '#DCE6F0' },
  [CATEGORIE_FOURNISSEUR.BANQUE]: { emoji: '🏦', decor: '💶 🪙 💶', fond: '#DCE9DC' },
  [CATEGORIE_FOURNISSEUR.EMBALLAGES]: { emoji: '📦', decor: '🏷️ 📦 🏷️', fond: '#EDE3D2' },
  [CATEGORIE_FOURNISSEUR.TOURISME]: { emoji: '🧭', decor: '🗺️ 🧭 🗺️', fond: '#DCE9EE' },
  [CATEGORIE_FOURNISSEUR.REPAS]: { emoji: '🍽️', decor: '🥖 🍷 🥖', fond: '#F0E4D4' },
  [CATEGORIE_FOURNISSEUR.ETAT]: { emoji: '🏛️', decor: '🇫🇷 📄 🇫🇷', fond: '#DCE2F0' },
  [CATEGORIE_CLIENT.RECOLTEUR]: { emoji: '🚚', decor: '🥛 🥛 🥛', fond: '#E6EEF5' },
  [CATEGORIE_CLIENT.PARTICULIER]: { emoji: '🧑', decor: '🧀 🥩 🛒', fond: '#F2E6D8' },
  [CATEGORIE_CLIENT.SURFACE_COMMERCIALE]: { emoji: '🏬', decor: '🧀 🛒 🥩', fond: '#E8E3EE' },
  [CATEGORIE_CLIENT.ENTREPRISE]: { emoji: '🏢', decor: '🧀 📦 🥩', fond: '#E3E8EE' },
  [CATEGORIE_CLIENT.VISITEUR]: { emoji: '🧳', decor: '🐐 🧀 📷', fond: '#EEE6D6' },
  [CATEGORIE_CLIENT.GROUPE_VISITEURS]: { emoji: '🚌', decor: '🐐 🧀 🚌', fond: '#E6EAD8' },
};

/** Le portrait d'un tiers d'après l'identifiant de sa catégorie (une catégorie ajoutée par l'utilisateur, ou aucune : un portrait neutre). */
export const portraitDeTiers = (categorieId: string | undefined): PortraitTiers => (categorieId && PORTRAITS[categorieId]) || PAR_DEFAUT;
