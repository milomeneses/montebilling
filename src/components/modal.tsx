"use client";

import { type ReactNode, useEffect, useRef } from "react";

type ModalProps = {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  widthClassName?: string;
};

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  widthClassName = "max-w-3xl",
}: ModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return undefined;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [onClose, open]);

  useEffect(() => {
    if (!open) return;
    const timeout = window.setTimeout(() => {
      dialogRef.current?.focus();
    }, 0);
    return () => window.clearTimeout(timeout);
  }, [open]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 px-4 py-8"
      onClick={onClose}
    >
      <div
        ref={dialogRef}
        tabIndex={-1}
        className={`surface relative max-h-[90vh] w-full overflow-y-auto ${widthClassName}`}
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full border border-[color:var(--border-subtle)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--text-secondary)] hover:border-[color:var(--text-primary)]"
        >
          Cerrar
        </button>
        {title && (
          <div className="pr-16">
            <h2 className="text-2xl font-semibold text-[color:var(--text-primary)]">{title}</h2>
            {description ? (
              <p className="mt-1 text-sm text-[color:var(--text-secondary)]">{description}</p>
            ) : null}
          </div>
        )}
        <div className={title ? "mt-6" : ""}>{children}</div>
        {footer ? <div className="mt-8 flex flex-wrap justify-end gap-3">{footer}</div> : null}
      </div>
    </div>
  );
}
