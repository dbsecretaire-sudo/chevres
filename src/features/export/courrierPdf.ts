import { echapper, ecrireEtPartagerPdf } from '@/features/export/services/htmlPdf';
import type { CourrierCompose } from '@/features/exploitation/services/courrier';
import { FORMAT_EXPORT } from '@/shared/constants/export';
import { TEXTES } from '@/shared/textes';

const T = TEXTES.exploitation.controles.courrier;

const lignes = (l: string[]) => l.map(echapper).join('<br/>');

/** La lettre sur une page A4, selon les usages : l'expéditeur à gauche, le destinataire à droite, le lieu et la date, l'objet, le message, la politesse, la signature. */
function courrierHtml(c: CourrierCompose): string {
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<style>
  * { box-sizing: border-box; }
  body { font-family: Georgia, 'Times New Roman', serif; color: #111; padding: 40px 56px; font-size: 12px; line-height: 1.5; }
  .expediteur { white-space: normal; }
  .destinataire { margin: 34px 0 0 52%; }
  .lieu-date { margin: 26px 0 0 52%; }
  .objet { margin: 28px 0 22px; font-weight: 700; }
  p { margin: 0 0 12px; text-align: left; white-space: pre-wrap; }
  .politesse { margin-top: 20px; }
  .signature { margin: 38px 0 0 52%; font-weight: 700; }
</style>
</head>
<body>
  <div class="expediteur">${lignes(c.expediteur)}</div>
  <div class="destinataire">${lignes(c.destinataire)}</div>
  <div class="lieu-date">${echapper(c.lieuDate)}</div>
  <div class="objet">Objet : ${echapper(c.objet)}</div>
  <p>${echapper(c.appel)}</p>
  ${c.paragraphes.map((p) => `<p>${echapper(p)}</p>`).join('\n  ')}
  <p class="politesse">${echapper(c.politesse)}</p>
  <div class="signature">${lignes(c.signature)}</div>
</body>
</html>`;
}

/** Le courrier en PDF : il s'ouvre dans le menu d'envoi ou d'impression de l'appareil. */
export async function exporterCourrierPdf(c: CourrierCompose): Promise<void> {
  await ecrireEtPartagerPdf(courrierHtml(c), `${T.pdfFichier}.${FORMAT_EXPORT.PDF}`, c.objet || T.pdfTitre);
}
