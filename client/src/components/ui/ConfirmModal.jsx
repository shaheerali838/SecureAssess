import React from 'react';
import { AlertTriangle, AlertCircle, CheckCircle2, Info, X, Trash2, HelpCircle } from 'lucide-react';
import { Button } from './Button';

export function ConfirmModal({
  isOpen,
  open,
  onClose,
  onConfirm,
  title = 'Confirm Action',
  description,
  message,
  children,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger', // 'danger' | 'warning' | 'primary' | 'info' | 'success'
  type = 'confirm', // 'confirm' | 'alert'
  loading = false,
  icon,
}) {
  const isVisible = isOpen ?? open ?? false;
  if (!isVisible) return null;

  const content = description || message || children;

  const variantStyles = {
    danger: {
      iconBg: 'bg-danger-500/10 text-danger-500 border border-danger-500/20',
      icon: <Trash2 size={22} className="text-danger-500" />,
      buttonVariant: 'danger',
    },
    warning: {
      iconBg: 'bg-warning-500/10 text-warning-500 border border-warning-500/20',
      icon: <AlertTriangle size={22} className="text-warning-500" />,
      buttonVariant: 'primary',
    },
    primary: {
      iconBg: 'bg-primary-500/10 text-primary-500 border border-primary-500/20',
      icon: <HelpCircle size={22} className="text-primary-500" />,
      buttonVariant: 'primary',
    },
    info: {
      iconBg: 'bg-info-500/10 text-info-500 border border-info-500/20',
      icon: <Info size={22} className="text-info-500" />,
      buttonVariant: 'primary',
    },
    success: {
      iconBg: 'bg-success-500/10 text-success-500 border border-success-500/20',
      icon: <CheckCircle2 size={22} className="text-success-500" />,
      buttonVariant: 'success',
    },
  };

  const style = variantStyles[variant] || variantStyles.danger;
  const activeIcon = icon || style.icon;

  const handleConfirm = (e) => {
    e?.preventDefault?.();
    if (onConfirm) {
      onConfirm();
    } else {
      onClose?.();
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Glassmorphic Backdrop */}
      <div
        className="fixed inset-0 bg-accent-950/70 backdrop-blur-sm transition-opacity animate-fade-in"
        onClick={loading ? undefined : onClose}
      />

      {/* Modal Dialog Card */}
      <div className="relative w-full max-w-md bg-white dark:bg-accent-900 rounded-2xl border border-accent-200 dark:border-accent-800 shadow-2xl overflow-hidden animate-scale-in z-10">
        <div className="p-6">
          <div className="flex items-start gap-4">
            {/* Variant Icon */}
            <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${style.iconBg}`}>
              {activeIcon}
            </div>

            {/* Header & Body */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-base font-bold text-accent-900 dark:text-white leading-snug">
                  {title}
                </h3>
                <button
                  type="button"
                  onClick={onClose}
                  disabled={loading}
                  className="text-accent-400 hover:text-accent-700 dark:hover:text-white p-1 rounded-lg hover:bg-accent-100 dark:hover:bg-accent-800 transition-colors cursor-pointer shrink-0"
                >
                  <X size={16} />
                </button>
              </div>

              {content && (
                <div className="mt-2 text-xs text-accent-600 dark:text-accent-300 leading-relaxed">
                  {typeof content === 'string' ? <p>{content}</p> : content}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Action Footer */}
        <div className="flex items-center justify-end gap-2.5 px-6 py-3.5 border-t border-accent-100 dark:border-accent-800 bg-accent-50/60 dark:bg-accent-950/40">
          {type === 'confirm' && (
            <Button
              variant="ghost"
              size="sm"
              type="button"
              onClick={onClose}
              disabled={loading}
            >
              {cancelText}
            </Button>
          )}

          <Button
            variant={style.buttonVariant}
            size="sm"
            type="button"
            loading={loading}
            onClick={handleConfirm}
          >
            {type === 'alert' && confirmText === 'Confirm' ? 'OK' : confirmText}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmModal;
