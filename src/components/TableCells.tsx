import { type CSSProperties, type ReactNode } from "react";
import { Checkbox, ResizableHeaderCell, StatusPill, TableSortHeader } from "./Ui";
import { formatMoney } from "./ModuleKit";
import { cn } from "../utils/cn";
import type { Tone } from "../contracts/types";

/**
 * 列表表表格单元格组件套件。
 *
 * 只覆盖"列表表"族(border-r + px-4 + getColumnStyle),不覆盖
 * "文档明细表"族(px-3 py-2.5,可编辑表格内),后者语义不同。
 *
 * 设计约定:
 * - style 由调用方算好传入(getColumnStyle 结果或合并对象),组件不耦合 hook
 * - nowrap 无默认值,调用方必须显式传(两种风格各占一半,默认会误导)
 * - className 作为染色逃生口,内部 cn 顺序放最后以覆盖默认
 */

// ── 普通数据单元格 ────────────────────────────────────────────────────────────

type DataCellProps = {
  style: CSSProperties;
  align?: "left" | "right" | "center";
  nowrap?: boolean;
  truncate?: boolean;
  title?: string;
  emphasis?: boolean;
  muted?: boolean;
  link?: boolean;
  isLast?: boolean;
  className?: string;
  children: ReactNode;
};

export function DataCell({ style, align, nowrap, truncate, title, emphasis, muted, link, isLast, className, children }: DataCellProps) {
  return (
    <td
      className={cn(
        "border-r border-line-1 px-4",
        align === "right" && "text-right",
        align === "center" && "text-center",
        nowrap && "whitespace-nowrap",
        emphasis && "font-medium text-text-1",
        muted && "text-text-3",
        link && "text-brand-6",
        isLast && "border-r-0",
        className,
      )}
      style={style}
      title={title}
    >
      {truncate ? <div className="overflow-hidden text-ellipsis">{children}</div> : children}
    </td>
  );
}

// ── 金额单元格 ────────────────────────────────────────────────────────────────

type MoneyCellProps = {
  style: CSSProperties;
  value: number;
  format?: (v: number) => string;
  emphasis?: boolean;
  muted?: boolean;
  nowrap?: boolean;
  isLast?: boolean;
};

export function MoneyCell({ style, value, format = formatMoney, emphasis, muted, nowrap, isLast }: MoneyCellProps) {
  return (
    <DataCell style={style} align="right" nowrap={nowrap} emphasis={emphasis} muted={muted} isLast={isLast}>
      {format(value)}
    </DataCell>
  );
}

// ── 状态徽章单元格 ──────────────────────────────────────────────────────────────

type StatusCellProps = {
  style: CSSProperties;
  tone: Tone;
  label: ReactNode;
  nowrap?: boolean;
  isLast?: boolean;
};

export function StatusCell({ style, tone, label, nowrap, isLast }: StatusCellProps) {
  return (
    <DataCell style={style} nowrap={nowrap} isLast={isLast}>
      <StatusPill tone={tone}>{label}</StatusPill>
    </DataCell>
  );
}

// ── sticky 选择列单元格 ────────────────────────────────────────────────────────

type StickySelectCellProps = {
  style: CSSProperties;
  variant: "header" | "body";
  checked: boolean;
  onChange: (checked: boolean) => void;
};

export function StickySelectCell({ style, variant, checked, onChange }: StickySelectCellProps) {
  const className = cn(
    "sticky left-0 z-10 border-r border-line-1 px-3",
    variant === "header" ? "border-b bg-fill-2" : "bg-white group-hover:bg-hover-bg",
  );
  const Tag = variant === "header" ? "th" : "td";
  return (
    <Tag className={className} style={style}>
      <Checkbox checked={checked} onChange={onChange} />
    </Tag>
  );
}

// ── sticky 第一数据列单元格 ─────────────────────────────────────────────────────

type StickyFirstColumnCellProps = {
  bodyStyle: CSSProperties;
  children: ReactNode;
};

export function StickyFirstColumnCell({ bodyStyle, children }: StickyFirstColumnCellProps) {
  return (
    <td className="sticky z-10 border-r border-line-1 bg-white px-4 group-hover:bg-hover-bg" style={bodyStyle}>
      {children}
    </td>
  );
}

// ── sticky 第一列表头 ───────────────────────────────────────────────────────────

type StickyFirstColumnHeaderProps = {
  width: number;
  minWidth?: number;
  left: number;
  onResizeStart: (clientX: number) => void;
  label: string;
  sortKey: string;
  currentSort: { key: string; direction: "asc" | "desc" } | null;
  onSort: (key: string) => void;
};

export function StickyFirstColumnHeader({ width, minWidth, left, onResizeStart, label, sortKey, currentSort, onSort }: StickyFirstColumnHeaderProps) {
  return (
    <ResizableHeaderCell width={width} minWidth={minWidth} className="sticky z-10 bg-fill-2" style={{ left }} onResizeStart={onResizeStart}>
      <TableSortHeader label={label} sortKey={sortKey} currentSort={currentSort} onSort={onSort} />
    </ResizableHeaderCell>
  );
}

// ── 操作列单元格 ────────────────────────────────────────────────────────────────

type ActionsCellProps = {
  style: CSSProperties;
  nowrap?: boolean;
  children: ReactNode;
};

export function ActionsCell({ style, nowrap, children }: ActionsCellProps) {
  return (
    <DataCell style={style} nowrap={nowrap} isLast>
      <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1">{children}</div>
    </DataCell>
  );
}

// ── tfoot 合计行 ──────────────────────────────────────────────────────────────────

type SummaryFooterProps = {
  colSpan: number;
  children: ReactNode;
  className?: string;
  /** 明细行数，为 0 时不显示合计，改为展示空数据提示 */
  lineCount?: number;
  emptyText?: string;
};

export function SummaryFooter({ colSpan, children, className, lineCount, emptyText = "暂无明细数据，请添加商品行" }: SummaryFooterProps) {
  const isEmpty = lineCount === 0;
  return (
    <tfoot className={className ?? "bg-zinc-100"}>
      <tr className={cn("h-[42px]", isEmpty ? "text-text-3" : "font-semibold text-text-1")}>
        <td colSpan={colSpan} className="px-4">{isEmpty ? emptyText : children}</td>
      </tr>
    </tfoot>
  );
}