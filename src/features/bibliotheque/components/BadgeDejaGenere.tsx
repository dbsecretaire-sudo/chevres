import { Badge } from '@/shared/components/Badge';
import type { DocumentGenere } from '@/features/bibliotheque/types';
import { colors } from '@/shared/theme/colors';
import { formatDateFR } from '@/shared/utils/dates';
import { TEXTES } from '@/shared/textes';

/** Un repère vert sur un document déjà généré : la date du dernier, et leur nombre quand il y en a plusieurs. */
export function BadgeDejaGenere({ faits }: { faits: DocumentGenere[] }) {
  if (faits.length === 0) return null;
  const date = formatDateFR(faits[0].genereLe.slice(0, 10));
  return (
    <Badge
      label={faits.length > 1 ? TEXTES.export.bibliotheque.dejaGenereN(date, faits.length) : TEXTES.export.bibliotheque.dejaGenere(date)}
      color={colors.primary}
    />
  );
}
