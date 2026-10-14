import React from 'react';
import { SentEmailNotification } from '../types/subscription';
import { X, Mail, CheckCircle2, Calendar, User, Clock, Copy, Check } from 'lucide-react';

interface EmailModalProps {
  email: SentEmailNotification | null;
  onClose: () => void;
}

export const EmailModal: React.FC<EmailModalProps> = ({ email, onClose }) => {
  const [copied, setCopied] = React.useState(false);

  if (!email) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(email.htmlContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const sentTimeFormatted = new Date(email.sentAt).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-white rounded-2xl max-w-2xl w-full overflow-hidden shadow-2xl flex flex-col max-h-[90vh] border border-slate-200">
        
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Email Automatique Envoyé
                </span>
                <span className="text-xs text-slate-400 font-mono-numbers">
                  {sentTimeFormatted}
                </span>
              </div>
              <h3 className="text-sm font-bold text-white mt-1">
                Notification d'Activation de Compte
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Email Header Meta */}
        <div className="px-6 py-3 bg-slate-50 border-b border-slate-200 text-xs space-y-1.5 text-slate-600">
          <div className="flex items-center justify-between">
            <span><strong>Destinataire :</strong> {email.toName} &lt;{email.toEmail}&gt;</span>
            <button
              onClick={handleCopy}
              className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 hover:text-slate-800 transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'HTML Copié' : 'Copier HTML'}</span>
            </button>
          </div>
          <div>
            <strong>Objet :</strong> <span className="text-slate-900 font-medium">{email.subject}</span>
          </div>
        </div>

        {/* Rendered Email Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-100">
          <div
            className="shadow-md rounded-xl bg-white overflow-hidden max-w-xl mx-auto"
            dangerouslySetInnerHTML={{ __html: email.htmlContent }}
          />
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-white border-t border-slate-200 flex items-center justify-between">
          <span className="text-xs text-slate-500 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            Distribué automatiquement lors du clic [Activer le Compte]
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-900 text-white hover:bg-slate-800 font-semibold text-xs transition-colors"
          >
            Fermer l'aperçu
          </button>
        </div>

      </div>
    </div>
  );
};
