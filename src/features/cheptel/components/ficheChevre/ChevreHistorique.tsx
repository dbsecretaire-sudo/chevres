import { Text } from 'react-native';
import { Badge } from '@/shared/components/Badge';
import { Card } from '@/shared/components/Card';
import { ListRow } from '@/shared/components/ListRow';
import { SectionDeroulante } from '@/shared/components/SectionDeroulante';
import { colors, statutColors } from '@/shared/theme/colors';
import { formatDateFR } from '@/shared/utils/dates';
import { demonstratifAnimal, libelleChevre, statutLabel } from '@/features/cheptel/utils/chevreLabel';
import type { Chevre } from '@/features/cheptel/types';
import type { Controle, VisiteVeterinaire } from '@/features/exploitation/types';
import { FAMILLE_CONTROLE } from '@/shared/constants/controles';
import { SEXE } from '@/shared/constants/cheptel';
import { commonStyles } from '@/shared/styles/commonStyles';
import { TEXTES } from '@/shared/textes';

/** La mère de l'animal (cliquable pour ouvrir sa fiche) ; sa boucle seule quand elle n'est pas dans le cheptel. */
export function ChevreAscendance({
  mere,
  boucleMere,
  onOuvrir,
  ouverte,
  onBasculer,
}: {
  mere: Chevre | null;
  boucleMere?: string;
  onOuvrir: (id: string) => void;
  ouverte: boolean;
  onBasculer: () => void;
}) {
  return (
    <SectionDeroulante titre={TEXTES.cheptel.ficheChevre.ascendance} ouverte={ouverte} onBasculer={onBasculer}>
      {mere ? (
        <ListRow
          title={libelleChevre(mere)}
          subtitle={TEXTES.commun.general.accordNeLeDate(
            TEXTES.cheptel.ficheChevre.nee,
            formatDateFR(mere.dateNaissance),
          )}
          trailing={<Badge label={statutLabel(mere.statut, mere.sexe)} color={statutColors[mere.statut]} />}
          onPress={() => onOuvrir(mere.id)}
        />
      ) : (
        <ListRow title={boucleMere ?? ''} subtitle={TEXTES.cheptel.ficheChevre.mereHorsCheptel} />
      )}
    </SectionDeroulante>
  );
}

/** Liste des petits d'une chèvre (cliquables pour ouvrir leur fiche), dans une section qui se déroule. */
export function ChevreDescendance({
  descendance,
  onOuvrir,
  ouverte,
  onBasculer,
}: {
  descendance: Chevre[];
  onOuvrir: (id: string) => void;
  ouverte: boolean;
  onBasculer: () => void;
}) {
  return (
    <SectionDeroulante
      titre={TEXTES.cheptel.ficheChevre.descendance}
      nombre={descendance.length}
      ouverte={ouverte}
      onBasculer={onBasculer}
    >
      {descendance.map((d) => (
        <ListRow
          key={d.id}
          title={libelleChevre(d)}
          subtitle={TEXTES.commun.general.accordNeLeDate(
            d.sexe === SEXE.FEMELLE ? TEXTES.cheptel.ficheChevre.nee : TEXTES.cheptel.ficheChevre.ne,
            formatDateFR(d.dateNaissance),
          )}
          trailing={<Badge label={statutLabel(d.statut, d.sexe)} color={statutColors[d.statut]} />}
          onPress={() => onOuvrir(d.id)}
        />
      ))}
    </SectionDeroulante>
  );
}

/**
 * La santé de l'animal : ses visites vétérinaires et ses contrôles, les plus récents d'abord. Un appui ouvre la visite ou le contrôle.
 * Une visite ou un contrôle qui nomme plusieurs boucles figure sur la fiche de chacun des animaux.
 */
export function ChevreSante({
  chevre,
  visites,
  controles,
  onOuvrirVisite,
  onOuvrirControle,
}: {
  chevre: Chevre;
  visites: VisiteVeterinaire[];
  controles: Controle[];
  onOuvrirVisite: (visite: VisiteVeterinaire) => void;
  onOuvrirControle: (controle: Controle) => void;
}) {
  const T = TEXTES.cheptel.ficheChevre.sante;
  const lignes = [
    ...visites.map((v) => ({
      cle: `visite:${v.id}`,
      date: v.date,
      titre: v.motif,
      detail: [v.rapportEssais ? T.rapportEssais(v.numeroRapport) : undefined, v.description]
        .filter(Boolean)
        .join(' · '),
      badge: <Badge label={T.visite} color={colors.primary} />,
      ouvrir: () => onOuvrirVisite(v),
    })),
    ...controles.map((c) => ({
      cle: `controle:${c.id}`,
      date: c.date,
      titre: c.type,
      detail: c.resultat ?? '',
      badge: <Badge label={T.controle} color={colors.accent} />,
      ouvrir: () => onOuvrirControle(c),
    })),
  ].sort((a, b) => b.date.localeCompare(a.date));
  return (
    <Card>
      <Text style={commonStyles.cardTitle}>{T.titre(lignes.length)}</Text>
      {lignes.length === 0 ? (
        <Text style={commonStyles.muted}>{T.aucun(demonstratifAnimal(chevre))}</Text>
      ) : (
        lignes.map((l) => (
          <ListRow
            key={l.cle}
            title={`${formatDateFR(l.date)} — ${l.titre}`}
            subtitle={l.detail || undefined}
            trailing={l.badge}
            onPress={l.ouvrir}
          />
        ))
      )}
    </Card>
  );
}

/** La famille d'un contrôle (sans famille : un contrôle des animaux), pour ouvrir sa fiche. */
export const familleDuControle = (c: Controle): string => c.famille ?? FAMILLE_CONTROLE.ANIMAUX;
