"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Cancel01Icon } from "hugeicons-react";

interface GenericModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
}

const SIZE_CLASSES = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-xl",
};

export function GenericModal({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  size = "md",
}: GenericModalProps) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => onOpenChange(false)}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
          >
            <div
              className={`bg-white border border-carbon_black-600 rounded-lg shadow-2xl ${SIZE_CLASSES[size]} w-full max-h-[90vh] overflow-y-auto pointer-events-auto`}
            >
              <div className="flex items-center justify-between p-6 border-b border-carbon_black-600">
                <div>
                  <h2 className="text-lg font-semibold text-carbon_black">
                    {title}
                  </h2>
                  {description && (
                    <p className="text-sm text-silver-400 mt-1">
                      {description}
                    </p>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onOpenChange(false)}
                  className="text-silver-400 hover:text-carbon_black hover:bg-silver-100"
                >
                  <Cancel01Icon size={20} />
                </Button>
              </div>
              <div className="p-6">{children}</div>
              {footer && (
                <div className="flex justify-end gap-2 p-6 border-t border-carbon_black-600">
                  {footer}
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

interface ConfirmModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  onConfirm: () => void;
  onCancel?: () => void;
  confirmText?: string;
  cancelText?: string;
  variant?: "default" | "destructive";
  loading?: boolean;
}

export function ConfirmModal({
  open,
  onOpenChange,
  title,
  description,
  onConfirm,
  onCancel,
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  variant = "default",
  loading = false,
}: ConfirmModalProps) {
  const handleCancel = () => {
    onCancel?.();
    onOpenChange(false);
  };

  const handleConfirm = () => {
    onConfirm();
  };

  return (
    <GenericModal
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description={description}
      size="sm"
      footer={
        <>
          <Button variant="outline" onClick={handleCancel} disabled={loading}>
            {cancelText}
          </Button>
          <Button variant={variant} onClick={handleConfirm} disabled={loading}>
            {loading ? "Procesando..." : confirmText}
          </Button>
        </>
      }
    >
      <p className="text-sm text-slate-600">{description}</p>
    </GenericModal>
  );
}
