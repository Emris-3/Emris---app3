import React, { useState } from 'react';
import { SubscriptionRequest } from '../types/subscription';
import { FORMAT_FCFA } from '../utils/constants';
import { 
  X, 
  ZoomIn, 
  ZoomOut, 
  RotateCw, 
  CheckCircle, 
  XCircle, 
  Download,
  Calendar,
  User,
  CreditCard,
  Hash
} from 'lucide-react';

interface ReceiptModalProps {
  subscription: SubscriptionRequest | null;
  onClose: () => void;
  onActivate?: (id: string) => void;
  onReject?: (id: string) => void;
  showAdminActions?: boolean;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  subscription,
  onClose,
  onActivate,
  onReject,
  showAdminActions = false
}) => {
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);

  if (!subscription) return null;

  const handleZoomIn = () => setScale(prev => Math.min(prev + 0.25, 2.5));
  const handleZoomOut = () => setScale(prev => Math.max(prev - 0.25, 0.6));
  const handleRotate = () => setRotation(prev => (prev + 90) % 360);

  const formattedDate = new Date(subscription.submissionDate).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-white rounded-2xl max-w-4xl w-full overflow-hidden shadow-2xl flex flex-col max-h-[90vh] border border-slate-200">
        
        {/* Top Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-sky-500/20 text-sky-400 border border-sky-500/30">
                Preuve de Paiement Wave
              </span>
              <span className="text-xs text-slate-400">
                Réf: {subscription.waveTransactionId || subscription.id}
              </span>
            </div>
            <h2 className="text-base font-bold text-white mt-1">
              Reçu de {subscription.userName} • {FORMAT_FCFA(subscription.amount)}
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Action toolbar for image inspection */}
        <div className="px-6 py-2.5 bg-slate-100 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-700">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 text-slate-600">
              <User className="w-3.5 h-3.5" />
              <strong>{subscription.userName}</strong> ({subscription.userPhone})
            </span>
            <span className="flex items-center gap-1.5 text-slate-600">
              <Calendar className="w-3.5 h-3.5" />
              {formattedDate}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={handleZoomIn}
              className="p-1.5 rounded-md hover:bg-white text-slate-700 hover:shadow-xs transition-all"
              title="Zoom avant"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              onClick={handleZoomOut}
              className="p-1.5 rounded-md hover:bg-white text-slate-700 hover:shadow-xs transition-all"
              title="Zoom arrière"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <button
              onClick={handleRotate}
              className="p-1.5 rounded-md hover:bg-white text-slate-700 hover:shadow-xs transition-all"
              title="Faire pivoter"
            >
              <RotateCw className="w-4 h-4" />
            </button>
            <span className="text-[11px] text-slate-400 font-mono-numbers px-1">
              {Math.round(scale * 100)}%
            </span>
          </div>
        </div>

        {/* Image viewport */}
        <div className="flex-1 overflow-auto bg-slate-900/95 p-6 flex items-center justify-center min-h-[350px]">
          <div
            className="transition-transform duration-200 ease-out origin-center"
            style={{
              transform: `scale(${scale}) rotate(${rotation}deg)`
            }}
          >
            {subscription.receiptImage ? (
              <img
                src={subscription.receiptImage}
                alt={`Reçu de paiement Wave de ${subscription.userName}`}
                className="max-h-[60vh] max-w-full rounded-xl shadow-2xl object-contain border border-slate-700 bg-white"
              />
            ) : (
              <div className="p-8 text-center text-slate-400">
                Aucune image disponible pour ce reçu.
              </div>
            )}
          </div>
        </div>

        {/* Footer with status and admin controls */}
        <div className="px-6 py-4 bg-white border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs text-slate-600">
            {subscription.status === 'pending' && (
              <span className="inline-flex items-center gap-1.5 text-amber-700 font-semibold bg-amber-50 px-2.5 py-1 rounded-md border border-amber-200">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                Statut : En attente de validation manuelle
              </span>
            )}
            {subscription.status === 'active' && (
              <span className="inline-flex items-center gap-1.5 text-emerald-700 font-semibold bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
                <CheckCircle className="w-3.5 h-3.5" />
                Statut : Compte Actif (Validé pour 30 jours)
              </span>
            )}
            {subscription.status === 'rejected' && (
              <span className="inline-flex items-center gap-1.5 text-rose-700 font-semibold bg-rose-50 px-2.5 py-1 rounded-md border border-rose-200">
                <XCircle className="w-3.5 h-3.5" />
                Statut : Rejeté ({subscription.rejectionReason || 'Non conforme'})
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 font-medium text-xs transition-colors"
            >
              Fermer
            </button>

            {showAdminActions && subscription.status === 'pending' && (
              <>
                {onReject && (
                  <button
                    onClick={() => {
                      onReject(subscription.id);
                      onClose();
                    }}
                    className="px-4 py-2 rounded-xl border border-rose-300 bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold text-xs transition-colors"
                  >
                    Rejeter
                  </button>
                )}
                {onActivate && (
                  <button
                    onClick={() => {
                      onActivate(subscription.id);
                      onClose();
                    }}
                    className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition-colors"
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span>Activer le Compte (30 jours)</span>
                  </button>
                )}
              </>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
