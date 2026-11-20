import { useId } from 'react';
import { cn } from '@/lib/utils';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';
import { useToast } from '@/hooks/useToast';
import type { ToastMessage } from '@/types/toast';

export function ToastViewport() {
  const { toasts, dismissToast } = useToast();

  return (
    <aside
      aria-live="polite"
      aria-label="Notifications"
      className="fixed bottom-20 lg:bottom-6 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none px-4 sm:px-0"
    >
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={() => dismissToast(toast.id)} />
      ))}
    </aside>
  );
}

function ToastItem({
  toast,
  onDismiss,
}: {
  toast: ToastMessage;
  onDismiss: () => void;
}) {
  const toastId = useId();

  const icons = {
    success: <CheckCircle2 className="w-4 h-4 text-cyber-emerald shrink-0" />,
    error: <AlertCircle className="w-4 h-4 text-cyber-rose shrink-0" />,
    warning: <AlertTriangle className="w-4 h-4 text-cyber-amber shrink-0" />,
    info: <Info className="w-4 h-4 text-cyber-cyan shrink-0" />,
  };

  const borders = {
    success: 'border-cyber-emerald-border bg-background-elevated/95',
    error: 'border-cyber-rose-border bg-background-elevated/95',
    warning: 'border-cyber-amber-border bg-background-elevated/95',
    info: 'border-cyber-cyan-border bg-background-elevated/95',
  };

  return (
    <div
      id={toastId}
      role="status"
      className={cn(
        'pointer-events-auto flex items-start gap-3 p-3.5 rounded-lg border shadow-elevated backdrop-blur-sm transition-all duration-200 animate-in slide-in-from-bottom-2',
        borders[toast.type]
      )}
    >
      <div className="mt-0.5">{icons[toast.type]}</div>
      <div className="flex-1 text-left min-w-0">
        {toast.title && (
          <p className="text-xs font-semibold text-foreground tracking-tight">
            {toast.title}
          </p>
        )}
        <p className="text-xs text-foreground-muted leading-relaxed break-words">
          {toast.message}
        </p>
      </div>
      <button
        type="button"
        onClick={onDismiss}
        className="text-foreground-dim hover:text-foreground p-0.5 rounded transition-colors"
        aria-label="Dismiss notification"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
