/**
 * Generates a realistic high-definition Côte d'Ivoire Wave transaction receipt canvas as a data URL.
 * Also provides utilities to read uploaded user screenshots.
 */

export function generateRealisticWaveReceipt(
  senderName: string = "Camara Esther",
  senderPhone: string = "+225 07 48 92 11 34",
  amount: number = 35000,
  referenceId: string = "WAVE-CI-784910283"
): string {
  if (typeof document === 'undefined') return '';
  const canvas = document.createElement('canvas');
  canvas.width = 720;
  canvas.height = 1100;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  const safeRoundRect = (
    c: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    r: number | number[]
  ) => {
    if (typeof c.roundRect === 'function') {
      c.roundRect(x, y, w, h, r);
    } else {
      const radius = Array.isArray(r) ? r[0] : r;
      c.rect(x, y, w, h);
    }
  };

  // Background
  ctx.fillStyle = '#F4F7FB';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Card Background with soft shadow
  ctx.fillStyle = '#FFFFFF';
  ctx.beginPath();
  safeRoundRect(ctx, 40, 50, 640, 1000, 24);
  ctx.fill();

  // Wave Brand Header Top Banner
  ctx.fillStyle = '#00B2FF'; // Wave blue
  ctx.beginPath();
  safeRoundRect(ctx, 40, 50, 640, 190, [24, 24, 0, 0]);
  ctx.fill();

  // Wave Penguin icon / text logo representation
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 36px "Plus Jakarta Sans", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('wave', 360, 120);

  ctx.font = '500 17px "Plus Jakarta Sans", sans-serif';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
  ctx.fillText('Reçu de paiement Wave Côte d\'Ivoire', 360, 155);
  ctx.fillText('Marchand : Béni Amar', 360, 185);

  // Status Badge circle
  ctx.fillStyle = '#10B981';
  ctx.beginPath();
  ctx.arc(360, 240, 36, 0, Math.PI * 2);
  ctx.fill();

  // Checkmark inside status badge
  ctx.strokeStyle = '#FFFFFF';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(346, 240);
  ctx.lineTo(356, 250);
  ctx.lineTo(376, 230);
  ctx.stroke();

  // "Paiement réussi"
  ctx.fillStyle = '#0F172A';
  ctx.font = 'bold 24px "Plus Jakarta Sans", sans-serif';
  ctx.fillText('Paiement Réussi', 360, 315);

  // Montant principal
  ctx.font = '800 52px "JetBrains Mono", sans-serif';
  ctx.fillStyle = '#00B2FF';
  ctx.fillText('35 000 FCFA', 360, 380);

  ctx.font = '500 15px "Plus Jakarta Sans", sans-serif';
  ctx.fillStyle = '#64748B';
  ctx.fillText('Frais de transfert : 0 FCFA (Pris en charge)', 360, 412);

  // Divider dashed line
  ctx.strokeStyle = '#E2E8F0';
  ctx.lineWidth = 2;
  ctx.setLineDash([8, 8]);
  ctx.beginPath();
  ctx.moveTo(80, 445);
  ctx.lineTo(640, 445);
  ctx.stroke();
  ctx.setLineDash([]);

  // Detail rows helper
  const drawRow = (label: string, value: string, y: number, isBold: boolean = false, isAccent: boolean = false) => {
    ctx.textAlign = 'left';
    ctx.font = '500 16px "Plus Jakarta Sans", sans-serif';
    ctx.fillStyle = '#64748B';
    ctx.fillText(label, 80, y);

    ctx.textAlign = 'right';
    ctx.font = isBold ? '700 16px "Plus Jakarta Sans", sans-serif' : '600 16px "Plus Jakarta Sans", sans-serif';
    ctx.fillStyle = isAccent ? '#00B2FF' : '#0F172A';
    ctx.fillText(value, 640, y);
  };

  const now = new Date();
  const dateFormatted = now.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  }) + ' à ' + now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

  let y = 495;
  drawRow('Bénéficiaire marchand', 'Béni Amar (M-Ris)', y, true);
  y += 50;
  drawRow('Lien marchand officiel', 'pay.wave.com/m/M_ci_Xs2kj...', y, false, true);
  y += 50;
  drawRow('Expéditeur', senderName, y, true);
  y += 50;
  drawRow('Numéro Wave client', senderPhone, y);
  y += 50;
  drawRow('Motif', 'Abonnement M-Ris 30 Jours', y);
  y += 50;
  drawRow('Date & Heure', dateFormatted, y);
  y += 50;
  drawRow('Référence Wave (ID)', referenceId, y, true);
  y += 50;
  drawRow('Mode de paiement', 'Solde Wave CI', y);
  y += 50;
  drawRow('Statut transaction', 'Validé par Wave CI', y, true);

  // Bottom security notice
  ctx.fillStyle = '#F8FAFC';
  ctx.beginPath();
  safeRoundRect(ctx, 80, 920, 560, 90, 14);
  ctx.fill();

  ctx.textAlign = 'center';
  ctx.font = '500 13px "Plus Jakarta Sans", sans-serif';
  ctx.fillStyle = '#64748B';
  ctx.fillText('Ce reçu certifie le règlement de 35 000 FCFA à Béni Amar via Wave Business.', 360, 955);
  ctx.fillText('Transmettez cette capture pour activation manuelle de l\'abonnement M-Ris.', 360, 980);

  return canvas.toDataURL('image/png');
}

export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
}
