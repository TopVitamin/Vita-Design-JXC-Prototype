import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { cn } from "../utils/cn";

interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  width?: string;
}

export function Drawer({
  isOpen,
  onClose,
  title,
  children,
  footer,
  width = "max-w-[680px]",
}: DrawerProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return createPortal(
    <div
      ref={overlayRef}
      className="fixed inset-0 z-drawer flex justify-end bg-black/40"
      onClick={(e) => {
        if (e.target === overlayRef.current) onClose();
      }}
    >
      <div
        className={cn(
          "flex h-screen w-full flex-col bg-white shadow-drawer origin-right",
          width
        )}
      >
        <div className="flex h-14 items-center justify-between border-b border-line-1 px-5">
          <div className="text-lg font-semibold text-text-1">{title}</div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-md text-text-3 transition hover:bg-fill-2"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-auto px-6 py-6">
          {children}
        </div>

        {footer && (
          <div className="flex items-center justify-end gap-3 border-t border-line-1 px-5 py-4">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
