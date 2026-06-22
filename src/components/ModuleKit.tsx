import { type ReactNode } from "react";
import { Button, Message } from "./Ui";
import { cn } from "../utils/cn";

/**
 * ModulePages 公共件：从 SalesModulePages / PurchaseModulePages /
 * SalesReturnModulePages / PurchaseReturnModulePages 四个文件里抽取的
 * 重复 UI 组件与工具函数。各模块的业务专用函数（getOrderActions 等）
 * 仍保留在各自文件，不要塞回这里。
 */

// ── 类型 ──────────────────────────────────────────────────────────────────────

export type ConfirmState = {
  title: string;
  content: string;
  confirmText: string;
  onConfirm: () => void;
};

// ── 组件 ──────────────────────────────────────────────────────────────────────

export function SurfaceCard({ title, extra, children }: { title: string; extra?: ReactNode; children: ReactNode }) {
  return (
    <section className="rounded-lg border border-line-1 bg-white shadow-soft">
      <div className="flex items-center justify-between border-b border-line-1 px-4 py-3">
        <div className="text-[15px] font-semibold text-text-1">{title}</div>
        {extra ? <div className="text-[13px] text-text-2">{extra}</div> : null}
      </div>
      <div className="px-4 py-4">{children}</div>
    </section>
  );
}

export function LabeledField({ label, required = false, error, className, children }: { label: string; required?: boolean; error?: string; className?: string; children: ReactNode }) {
  return (
    <div className={className}>
      <div className="mb-1.5 text-[13px] text-text-2">
        {label}
        {required ? <span className="ml-0.5 text-danger">*</span> : null}
      </div>
      {children}
      {error ? <div className="mt-1 text-xs text-danger">{error}</div> : null}
    </div>
  );
}

export function ReadonlyValue({ value, className }: { value: string; className?: string }) {
  return <div className={cn("flex min-h-8 items-center rounded-md border border-line-1 bg-fill-2 px-3 text-[13px] text-text-2", className)}>{value || "-"}</div>;
}

export function ConfirmModal({ state, onCancel }: { state: ConfirmState | null; onCancel: () => void }) {
  if (!state) return null;
  return (
    <div className="fixed inset-0 z-modal flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-[420px] rounded-lg border border-line-1 bg-white shadow-drawer">
        <div className="border-b border-line-1 px-5 py-4 text-[15px] font-semibold text-text-1">{state.title}</div>
        <div className="px-5 py-4 text-[14px] leading-6 text-text-2">{state.content}</div>
        <div className="flex justify-end gap-2 border-t border-line-1 px-5 py-4">
          <Button onClick={onCancel}>取消</Button>
          <Button tone="primary" onClick={state.onConfirm}>{state.confirmText}</Button>
        </div>
      </div>
    </div>
  );
}

export function EmptyStateRow({ colSpan, text = "暂无数据" }: { colSpan: number; text?: string }) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-4 py-10 text-center text-[13px] text-text-3">{text}</td>
    </tr>
  );
}

export function TextAction({ children, onClick }: { children: string; onClick: () => void }) {
  return <button type="button" className="text-[13px] text-brand-6 transition hover:text-brand-7" onClick={onClick}>{children}</button>;
}

export function DetailValue({ label, value, className }: { label: string; value: ReactNode; className?: string }) {
  return <div className={className}><div className="text-[13px] text-text-3">{label}</div><div className="mt-1 text-[14px] text-text-1">{value}</div></div>;
}

// ── 工具函数 ──────────────────────────────────────────────────────────────────

export function openToast(text: string) {
  Message.success(text, 2200);
}

export function openError(text: string) {
  Message.error(text, 2800);
}

export function formatMoney(value: number) {
  return `¥${value.toLocaleString("zh-CN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function parseBatchInput(value: string) {
  return value
    .split(/[\n,，]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export function inDateRange(value: string, range: { start: string; end: string }) {
  if (range.start && value < range.start) return false;
  if (range.end && value > range.end) return false;
  return true;
}