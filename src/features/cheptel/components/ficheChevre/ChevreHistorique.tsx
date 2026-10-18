import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Badge } from '@/shared/components/Badge';
import { Card } from '@/shared/components/Card';
import { ListRow } from '@/shared/components/ListRow';
import { SectionDeroulante } from '@/shared/components/SectionDeroulante';
import { SelectModal } from '@/shared/components/SelectModal';
import { useParentsPossibles } from '@/features/cheptel/hooks/useMeresPossibles';
import { stylesAscendance } from '@/shared/styles/cheptel/SuiviAnnuel.styles';
import { colors, statutColors } from '@/shared/theme/colors';
import { formatDateFR } from '@/shared/utils/dates';
import { demonstratifAnimal, detailDeLAnimal, libelleChevre, statutLabel } from '@/features/cheptel/utils/chevreLabel';
import type { Chevre } from '@/features/cheptel/types';
import type { Controle, VisiteVeterinaire } from '@/features/exploitation/types';
import { FAMILLE_CONTROLE } from '@/shared/constants/controles';
import { SEXE } from '@/shared/constants/cheptel';
import { commonStyles } from '@/shared/styles/commonStyles';
import { TEXTES } from '@/shared/textes';

/**
 * L'ascendance : la mère et le père connus (une ligne chacun, un appui ouvre sa fiche ; leur boucle seule quand ils ne sont pas dans le
 * cheptel), et pour chaque parent inconnu un bouton rond (♀ la mère, ♂ le père) qui propose les animaux présents à la naissance.
 */
export function ChevreAscendance({
  dateNaissance,
  mere,
  boucleMere,
  pere,
  bouclePere,
  onOuvrir,
  onChoisir,
  ouverte,
  onBasculer,
}: {
  dateNaissance: string;
  mere: Chevre | null;
  boucleMere?: string;
  pere: Chevre | null;
  bouclePere?: string;
  onOuvrir: (id: string) => void;
  onChoisir: (parent: 'mere' | 'pere', boucle: string) => void;
  ouverte: boolean;
  onBasculer: () => void;
}) {
  const T = TEXTES.cheptel.ficheChevre;
  const [choix, setChoix] = useState<'mere' | 'pere' | null>(null);
  const meres = useParentsPossibles(dateNaissance, SEXE.FEMELLE);
  const peres = useParentsPossibles(dateNaissance, SEXE.MALE);
  const parents = [
    { cle: 'mere' as const, animal: mere, boucle: boucleMere, icone: 'female' as const, absent: T.mereHorsCheptel, choisir: T.choisirLaMere },
    { cle: 'pere' as const, animal: pere, boucle: bouclePere, icone: 'male' as const, absent: T.pereHorsCheptel, choisir: T.choisirLePere },
  ];
  /** Le crayon d'un parent connu : il rouvre le choix (où « Aucune / inconnue » le retire). */
  const crayon = (cle: 'mere' | 'pere', libelle: string) => (
    <Pressable onPress={() => setChoix(cle)} hitSlop={10} accessibilityRole="button" accessibilityLabel={libelle}>
      <Ionicons name="create-outline" size={22} color={colors.textMuted} />
    </Pressable>
  );
  const connus = parents.filter((p) => p.animal || p.boucle);
  const inconnus = parents.filter((p) => !p.animal && !p.boucle);
  return (
    <SectionDeroulante titre={T.ascendance} ouverte={ouverte} onBasculer={onBasculer}>
      {connus.map((p) =>
        p.animal ? (
          <ListRow
            key={p.cle}
            icone={p.icone}
            title={libelleChevre(p.animal)}
            subtitle={detailDeLAnimal(p.animal)}
            trailing={
              <View style={commonStyles.row}>
                <Badge label={statutLabel(p.animal.statut, p.animal.sexe)} color={statutColors[p.animal.statut]} />
                {crayon(p.cle, p.choisir)}
              </View>
            }
            onPress={() => onOuvrir(p.animal!.id)}
          />
        ) : (
          <ListRow key={p.cle} icone={p.icone} title={p.boucle ?? ''} subtitle={p.absent} trailing={crayon(p.cle, p.choisir)} />
        ),
      )}
      {inconnus.length > 0 ? (
        <View style={stylesAscendance.boutons}>
          {inconnus.map((p) => (
            <Pressable
              key={p.cle}
              style={stylesAscendance.rond}
              onPress={() => setChoix(p.cle)}
              accessibilityRole="button"
              accessibilityLabel={p.choisir}
            >
              <Ionicons name={p.icone} size={28} color={colors.ajout} />
            </Pressable>
          ))}
        </View>
      ) : null}
      <SelectModal<string>
        visible={choix !== null}
        titre={choix === 'pere' ? T.choisirLePere : T.choisirLaMere}
        value=""
        searchable
        // Un parent déjà connu peut aussi être retiré : « Aucune / inconnue » vide son n° de boucle.
        options={[
          ...(choix && connus.some((p) => p.cle === choix) ? [{ value: '', label: T.parentInconnu }] : []),
          ...(choix === 'pere' ? peres : meres),
        ]}
        onSelect={(boucle) => {
          if (choix) onChoisir(choix, boucle);
          setChoix(null);
        }}
        onClose={() => setChoix(null)}
      />
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
          subtitle={detailDeLAnimal(d)}
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
