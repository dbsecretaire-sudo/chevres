import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { ancreDe } from '@/features/didacticiel/components/AncreVisite';
import { useVisiteGuidee } from '@/features/didacticiel/context/VisiteGuidee';
import { centreDuMenu, libelleDuMenu } from '@/features/didacticiel/services/menuHaut';
import { HAUTEUR_BARRE_ONGLETS, zoneDeLaFlecheRetour, zoneDeLOnglet } from '@/features/didacticiel/services/visiteGuidee';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { libellesDesMenus } from '@/shared/navigation/structureMenus';
import { useAppSettings } from '@/features/settings/context/AppSettingsContext';
import { modeEntreprise } from '@/shared/dictionnaire/entreprise';
import { colors } from '@/shared/theme/colors';
import { TEXTES } from '@/shared/textes';
import { afficheBureau } from '@/shared/utils/affichage';

const T = TEXTES.didacticiel.visite;

interface Zone {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** La marge autour de l'élément mis en surbrillance. */
const MARGE = 6;
/** Ce que la barre des onglets du bas occupe : la bulle et la pastille se placent au-dessus. */
const HAUTEUR_BARRE = HAUTEUR_BARRE_ONGLETS + 8;
const VOILE = 'rgba(18, 28, 14, 0.66)';
const LARGEUR_BULLE = 420;
/** La largeur de la flèche qui désigne un menu de la barre du haut (sur Windows). */
const FLECHE = 28;
/** Toute la fenêtre (écrit à la main : le style d'office n'est pas un objet sur toutes les plateformes). */
const PLEIN_ECRAN = { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 } as const;

/** La largeur d'un texte dans la police des menus de Windows (Segoe UI, 12 px). */
function largeurDansLaBarre(texte: string): number {
  const contexte = document.createElement('canvas').getContext('2d');
  if (!contexte) return texte.length * 7;
  contexte.font = '12px "Segoe UI", system-ui, sans-serif';
  return contexte.measureText(texte).width;
}

const memeZone = (a: Zone | null, b: Zone): boolean =>
  !!a && Math.abs(a.x - b.x) < 1 && Math.abs(a.y - b.y) < 1 && Math.abs(a.w - b.w) < 1 && Math.abs(a.h - b.h) < 1;

/**
 * La visite guidée à l'écran : l'élément à toucher est mis en surbrillance (le reste est voilé, mais l'élément reste actif : le toucher
 * ouvre la page suivante), avec une bulle qui présente la page et dit quoi faire. « Suivant » passe à l'étape d'après sans toucher.
 */
export function SuperpositionVisite() {
  const visite = useVisiteGuidee();
  const { settings } = useAppSettings();
  const { width, height } = useWindowDimensions();
  // Sur téléphone l'écran s'étend sous la barre d'état et la barre de navigation : les repères de l'en-tête et des onglets en tiennent compte.
  const { top: insetHaut, bottom: insetBas } = useSafeAreaInsets();
  /** La zone relevée, avec l'étape à laquelle elle appartient (celle d'une étape précédente ne compte plus). */
  const [relevee, setZone] = useState<(Zone & { id: string }) | null>(null);
  const etape = visite.etape;
  // Un élément qui n'est pas à l'écran (page défilée) ne peut pas être montré : la bulle reste alors au centre.
  const zoneRelevee = relevee && etape && relevee.id === etape.id ? relevee : null;
  const zone =
    zoneRelevee && zoneRelevee.y + zoneRelevee.h > 0 && zoneRelevee.y < height && zoneRelevee.x + zoneRelevee.w > 0 && zoneRelevee.x < width
      ? zoneRelevee
      : null;
  const ancre = etape?.ancre;
  const onglet = etape?.onglet;
  const retour = etape?.retour;

  // Où est l'élément à toucher : relu régulièrement (la page peut se charger, ou défiler).
  useEffect(() => {
    if (!visite.actif || !etape || !visite.surLaPage) return;
    const id = etape.id;
    let vivant = true;
    const mesurer = () => {
      try {
        mesurerLElement();
      } catch {
        // Un élément qui vient de disparaître (la page change) : rien à mesurer, la mesure suivante reprend.
      }
    };
    const mesurerLElement = () => {
      if (ancre) {
        ancreDe(ancre)?.measureInWindow((x, y, w, h) => {
          if (vivant && w > 0 && h > 0) setZone((avant) => (avant?.id === id && memeZone(avant, { x, y, w, h }) ? avant : { id, x, y, w, h }));
        });
      } else if (retour && afficheBureau()) {
        // Windows : la flèche de l'en-tête est un élément de la page (absente d'un écran du menu de gauche : rien n'est alors désigné).
        ancreDe('retour')?.measureInWindow((x, y, w, h) => {
          if (vivant && w > 0 && h > 0) setZone((avant) => (avant?.id === id && memeZone(avant, { x, y, w, h }) ? avant : { id, x, y, w, h }));
        });
      } else if (retour) {
        // Téléphone : la flèche est celle de l'en-tête natif, en haut à gauche.
        const flecheRetour = zoneDeLaFlecheRetour(insetHaut);
        setZone((avant) => (avant?.id === id && memeZone(avant, flecheRetour) ? avant : { id, ...flecheRetour }));
      } else if (onglet && !afficheBureau()) {
        const suivante = zoneDeLOnglet(onglet, width, height, insetBas);
        setZone((avant) => (avant?.id === id && memeZone(avant, suivante) ? avant : { id, ...suivante }));
      }
    };
    const depart = setTimeout(mesurer, 0);
    const minuteur = setInterval(mesurer, 400);
    return () => {
      vivant = false;
      clearTimeout(depart);
      clearInterval(minuteur);
    };
  }, [visite.actif, visite.surLaPage, etape, ancre, onglet, retour, width, height, insetHaut, insetBas]);

  // Un clic dans la zone en surbrillance valide l'étape qui attend un toucher (web et Windows ; sur téléphone, la page ouverte la valide).
  const attendUnToucher = visite.actif && visite.surLaPage && !!etape?.clic && !!zone;
  const valider = visite.valider;
  useEffect(() => {
    if (!attendUnToucher || !zone || typeof document === 'undefined') return;
    const surClic = (e: MouseEvent) => {
      if (e.clientX >= zone.x && e.clientX <= zone.x + zone.w && e.clientY >= zone.y && e.clientY <= zone.y + zone.h) valider();
    };
    document.addEventListener('click', surClic, true);
    return () => document.removeEventListener('click', surClic, true);
  }, [attendUnToucher, zone, valider]);

  if (!visite.actif || !etape) return null;

  // Sur Windows, l'onglet est un menu de la barre du haut, que la page ne peut pas entourer : une flèche le désigne, d'après son nom.
  const menuDuHaut = afficheBureau() && onglet && !ancre && !zone ? libelleDuMenu(onglet, !modeEntreprise() && !settings.exploitation?.accueilClassique) : null;
  const centreMenu = menuDuHaut ? centreDuMenu(libellesDesMenus(!!settings.exploitation?.accueilClassique), menuDuHaut, largeurDansLaBarre) : null;

  // Éloigné de la page de l'étape : une pastille propose de reprendre ou de quitter.
  if (!visite.surLaPage) {
    return (
      <View style={styles.racine} pointerEvents="box-none">
        <View style={[styles.pastille, { bottom: HAUTEUR_BARRE + insetBas + 16 }]}>
          <Text style={styles.pastilleTexte}>{T.enCours(visite.index + 1, visite.total)}</Text>
          <Pressable onPress={visite.reprendre} hitSlop={8} accessibilityRole="button">
            <Text style={styles.lienClair}>{T.reprendre}</Text>
          </Pressable>
          <Pressable onPress={visite.quitter} hitSlop={8} accessibilityRole="button">
            <Text style={styles.lienClair}>{T.quitter}</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  const derniere = visite.index + 1 >= visite.total;
  const attendUnClic = !!etape.clic;
  /** Une étape de parcours : l'écran reste utilisable, la bulle se pose en bas. */
  const sansVoile = !!etape.sansVoile;
  const texte = afficheBureau() && etape.texteBureau ? etape.texteBureau : etape.texte;
  const largeurBulle = Math.min(width - 24, LARGEUR_BULLE);

  // Le voile : autour de l'élément (qui reste libre d'être touché), ou sur tout l'écran pour une page qu'on présente ; rien quand on attend
  // un appui sur un élément qu'on ne repère pas (l'écran reste utilisable).
  const haut = zone ? Math.max(0, zone.y - MARGE) : 0;
  const bas = zone ? zone.y + zone.h + MARGE : 0;
  const gauche = zone ? Math.max(0, zone.x - MARGE) : 0;
  const droite = zone ? zone.x + zone.w + MARGE : 0;

  // La bulle : au-dessus ou au-dessous de l'élément (le côté où il y a le plus de place), au centre pour une page sans élément.
  const placement = zone
    ? zone.y + zone.h / 2 > height / 2
      ? { bottom: Math.max(12, height - haut + 12) }
      : { top: bas + 12 }
    : menuDuHaut
      ? { top: 64 }
      : attendUnClic || sansVoile
        ? { bottom: HAUTEUR_BARRE + insetBas + 24 }
      : { top: height * 0.22 };

  return (
    <View style={styles.racine} pointerEvents="box-none">
      {zone ? (
        <>
          <View style={[styles.voile, { top: 0, left: 0, right: 0, height: haut }]} />
          <View style={[styles.voile, { top: bas, left: 0, right: 0, bottom: 0 }]} />
          <View style={[styles.voile, { top: haut, height: bas - haut, left: 0, width: gauche }]} />
          <View style={[styles.voile, { top: haut, height: bas - haut, left: droite, right: 0 }]} />
          <View
            pointerEvents="none"
            style={[styles.anneau, { top: haut, left: gauche, width: droite - gauche, height: bas - haut }]}
          />
        </>
      ) : attendUnClic || sansVoile ? null : (
        <View style={[styles.voile, PLEIN_ECRAN]} />
      )}
      {menuDuHaut ? (
        <View pointerEvents="none" style={[styles.fleche, { left: Math.max(40, centreMenu ?? 40) }]}>
          <Text style={styles.flecheTriangle}>▲</Text>
          <Text style={styles.flecheNom} numberOfLines={1}>{menuDuHaut}</Text>
        </View>
      ) : null}
      <View style={[styles.bulle, placement, { width: largeurBulle, left: (width - largeurBulle) / 2 }]}>
        <Text style={styles.compteur}>
          {visite.parcoursTitre ? `${visite.parcoursTitre} · ` : ''}
          {T.etape(visite.index + 1, visite.total)}
        </Text>
        <Text style={styles.titre}>{etape.titre}</Text>
        <Text style={styles.texte}>{texte}</Text>
        {attendUnClic ? <Text style={styles.invitation}>{zone ? T.touchezLaZone : T.touchezLeBouton}</Text> : null}
        <View style={styles.boutons}>
          <Pressable onPress={visite.quitter} hitSlop={8} accessibilityRole="button">
            <Text style={styles.lien}>{T.quitter}</Text>
          </Pressable>
          <View style={styles.groupeBoutons}>
            {visite.index > 0 ? (
              <Pressable style={styles.precedent} onPress={visite.precedent} accessibilityRole="button">
                <Text style={styles.precedentTexte}>{T.precedent}</Text>
              </Pressable>
            ) : null}
            <Pressable style={styles.suivant} onPress={visite.suivant} accessibilityRole="button">
              <Text style={styles.suivantTexte}>{derniere ? T.terminer : attendUnClic ? T.passer : T.suivant}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  racine: { ...PLEIN_ECRAN, zIndex: 9999, elevation: 9999 },
  voile: { position: 'absolute', backgroundColor: VOILE },
  fleche: { position: 'absolute', top: 0, width: 0, alignItems: 'center' },
  flecheTriangle: { fontSize: FLECHE, lineHeight: FLECHE, color: '#FFD54A' },
  flecheNom: {
    marginTop: 2,
    backgroundColor: '#FFD54A',
    color: colors.primaryDark,
    fontSize: 14,
    fontWeight: '800',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 4,
    overflow: 'hidden',
  },
  anneau: { position: 'absolute', borderWidth: 3, borderColor: '#FFD54A', borderRadius: 12 },
  bulle: {
    position: 'absolute',
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    gap: 6,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 12,
  },
  compteur: { fontSize: 12, fontWeight: '700', color: colors.textMuted },
  titre: { fontSize: 18, fontWeight: '800', color: colors.primaryDark },
  texte: { fontSize: 15, lineHeight: 21, color: colors.text },
  invitation: { fontSize: 14, fontWeight: '700', color: colors.accent },
  boutons: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
  lien: { fontSize: 14, color: colors.textMuted, textDecorationLine: 'underline' },
  groupeBoutons: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  precedent: { borderRadius: 10, paddingVertical: 10, paddingHorizontal: 14, borderWidth: 1, borderColor: colors.primary },
  precedentTexte: { color: colors.primary, fontWeight: '700', fontSize: 15 },
  suivant: { backgroundColor: colors.primary, borderRadius: 10, paddingVertical: 10, paddingHorizontal: 18 },
  suivantTexte: { color: colors.blanc, fontWeight: '700', fontSize: 15 },
  pastille: {
    position: 'absolute',
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: colors.primaryDark,
    borderRadius: 999,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  pastilleTexte: { color: colors.blanc, fontSize: 13, fontWeight: '700' },
  lienClair: { color: '#FFD54A', fontSize: 13, fontWeight: '700', textDecorationLine: 'underline' },
});
