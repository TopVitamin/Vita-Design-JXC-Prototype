import { useState, useRef, useEffect, useLayoutEffect, useCallback, useMemo, createContext, useContext, type CSSProperties, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { CalendarDays, ChevronDown, ChevronLeft, ChevronRight, ChevronUp, ChevronsUpDown, Search, X, Clock, Info, CheckCircle, AlertTriangle, XCircle, ListFilter } from "lucide-react";
import { cn } from "../utils/cn";

/** 日期 / Select / 批量搜索等 Portal 浮层 z-index，需高于卡片 overflow、表头 sticky */
const FLOATING_PANEL_Z = 320;

const TABLE_WIDTH_STORAGE_PREFIX = "jxc-table-widths:";

type SelectUsage = "form" | "filter";

const SelectUsageContext = createContext<SelectUsage>("form");

function isFilterAllValue(value: string) {
  return value.trim().startsWith("全部");
}

function resolveSelectUsage({
  usage,
  contextUsage,
  placeholder,
  options,
}: {
  usage?: SelectUsage;
  contextUsage: SelectUsage;
  placeholder: string;
  options: string[];
}) {
  if (usage) return usage;
  if (contextUsage === "filter") return "filter";
  if (isFilterAllValue(placeholder)) return "filter";
  if (options.some((option) => isFilterAllValue(option))) return "filter";
  return "form";
}

export type ResizableColumnConfig = {
  key: string;
  width?: number;
  minWidth?: number;
  maxWidth?: number;
  resizable?: boolean;
};

function canUseStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function readStoredWidths(tableId: string) {
  if (!canUseStorage()) return {} as Record<string, number>;
  try {
    const raw = window.localStorage.getItem(`${TABLE_WIDTH_STORAGE_PREFIX}${tableId}`);
    return raw ? (JSON.parse(raw) as Record<string, number>) : {};
  } catch {
    return {};
  }
}

function writeStoredWidths(tableId: string, widths: Record<string, number>) {
  if (!canUseStorage()) return;
  window.localStorage.setItem(`${TABLE_WIDTH_STORAGE_PREFIX}${tableId}`, JSON.stringify(widths));
}

function resolveDefaultWidth(column: ResizableColumnConfig) {
  return column.width ?? column.minWidth ?? 140;
}

function clampColumnWidth(width: number, column: ResizableColumnConfig) {
  const minWidth = column.minWidth ?? 100;
  const maxWidth = column.maxWidth ?? 520;
  return Math.min(Math.max(width, minWidth), maxWidth);
}

export function useResizableColumns(tableId: string, columns: ResizableColumnConfig[]) {
  const columnsRef = useRef(columns);
  columnsRef.current = columns;
  const containerRef = useRef<HTMLDivElement | null>(null);
  const columnSignature = JSON.stringify(columns.map((column) => ({
    key: column.key,
    width: column.width,
    minWidth: column.minWidth,
    maxWidth: column.maxWidth,
    resizable: column.resizable,
  })));
  const [containerWidth, setContainerWidth] = useState(0);

  const [widths, setWidths] = useState<Record<string, number>>(() => {
    const stored = readStoredWidths(tableId);
    return columns.reduce<Record<string, number>>((acc, column) => {
      acc[column.key] = clampColumnWidth(stored[column.key] ?? resolveDefaultWidth(column), column);
      return acc;
    }, {});
  });

  useEffect(() => {
    const stored = readStoredWidths(tableId);
    setWidths(
      columns.reduce<Record<string, number>>((acc, column) => {
        acc[column.key] = clampColumnWidth(stored[column.key] ?? widths[column.key] ?? resolveDefaultWidth(column), column);
        return acc;
      }, {}),
    );
  }, [tableId, columnSignature]);

  useEffect(() => {
    writeStoredWidths(tableId, widths);
  }, [tableId, widths]);

  useEffect(() => {
    const element = containerRef.current;
    if (!element || typeof ResizeObserver === "undefined") return;

    const updateWidth = () => setContainerWidth(element.clientWidth);
    updateWidth();

    const observer = new ResizeObserver(() => updateWidth());
    observer.observe(element);
    return () => observer.disconnect();
  }, [tableId, columnSignature]);

  const startResize = useCallback((columnKey: string, startClientX: number) => {
    const targetColumn = columnsRef.current.find((column) => column.key === columnKey);
    if (!targetColumn || targetColumn.resizable === false) return;

    const startWidth = widths[columnKey] ?? resolveDefaultWidth(targetColumn);

    const handlePointerMove = (event: MouseEvent) => {
      const delta = event.clientX - startClientX;
      setWidths((current) => ({
        ...current,
        [columnKey]: clampColumnWidth(startWidth + delta, targetColumn),
      }));
    };

    const handlePointerUp = () => {
      window.removeEventListener("mousemove", handlePointerMove);
      window.removeEventListener("mouseup", handlePointerUp);
    };

    window.addEventListener("mousemove", handlePointerMove);
    window.addEventListener("mouseup", handlePointerUp);
  }, [widths]);

  const resetWidths = useCallback(() => {
    const nextWidths = columns.reduce<Record<string, number>>((acc, column) => {
      acc[column.key] = resolveDefaultWidth(column);
      return acc;
    }, {});
    setWidths(nextWidths);
    writeStoredWidths(tableId, nextWidths);
  }, [columnSignature, tableId]);

  const getColumnWidth = useCallback((columnKey: string, fallbackWidth?: number) => {
    const targetColumn = columnsRef.current.find((column) => column.key === columnKey);
    return widths[columnKey] ?? fallbackWidth ?? (targetColumn ? resolveDefaultWidth(targetColumn) : 140);
  }, [widths]);

  const getColumnStyle = useCallback((columnKey: string) => {
    const targetColumn = columnsRef.current.find((column) => column.key === columnKey);
    const width = getColumnWidth(columnKey, targetColumn?.width);
    return {
      width,
      minWidth: targetColumn?.minWidth ?? width,
      maxWidth: targetColumn?.maxWidth,
    } as const;
  }, [getColumnWidth]);

  const effectiveWidths = useMemo(() => {
    const baseWidths = columns.reduce<Record<string, number>>((acc, column) => {
      acc[column.key] = getColumnWidth(column.key, column.width);
      return acc;
    }, {});

    const totalBaseWidth = Object.values(baseWidths).reduce((sum, width) => sum + width, 0);
    const stretchableColumns = columns.filter((column) => column.resizable !== false);

    if (!containerWidth || totalBaseWidth >= containerWidth || stretchableColumns.length === 0) {
      return baseWidths;
    }

    const extraWidth = containerWidth - totalBaseWidth;
    const extraPerColumn = extraWidth / stretchableColumns.length;

    return columns.reduce<Record<string, number>>((acc, column) => {
      const nextWidth = column.resizable === false ? baseWidths[column.key] : baseWidths[column.key] + extraPerColumn;
      acc[column.key] = clampColumnWidth(nextWidth, column);
      return acc;
    }, {});
  }, [columns, containerWidth, getColumnWidth]);

  const totalWidth = Math.max(
    containerWidth,
    columns.reduce((sum, column) => sum + (effectiveWidths[column.key] ?? getColumnWidth(column.key, column.width)), 0),
  );

  return {
    containerRef,
    widths,
    effectiveWidths,
    totalWidth,
    startResize,
    resetWidths,
    getColumnWidth,
    getColumnStyle: (columnKey: string) => {
      const targetColumn = columnsRef.current.find((column) => column.key === columnKey);
      const width = effectiveWidths[columnKey] ?? getColumnWidth(columnKey, targetColumn?.width);
      return {
        width,
        minWidth: targetColumn?.minWidth ?? width,
        maxWidth: targetColumn?.maxWidth,
      } as const;
    },
  };
}

export function ResizableHeaderCell({
  children,
  width,
  minWidth,
  maxWidth,
  className,
  resizable = true,
  onResizeStart,
  style,
}: {
  children: ReactNode;
  width: number;
  minWidth?: number;
  maxWidth?: number;
  className?: string;
  resizable?: boolean;
  onResizeStart?: (clientX: number) => void;
  style?: CSSProperties;
}) {
  const [armed, setArmed] = useState(false);
  const edgeThreshold = 8;

  return (
    <th
      className={cn("relative border-b border-r border-line-1 px-4 whitespace-nowrap", armed && resizable && "cursor-col-resize", className)}
      style={{ width, minWidth: minWidth ?? width, maxWidth, ...style }}
      onMouseMove={(event) => {
        if (!resizable) return;
        const rect = event.currentTarget.getBoundingClientRect();
        setArmed(rect.right - event.clientX <= edgeThreshold);
      }}
      onMouseLeave={() => setArmed(false)}
      onMouseDown={(event) => {
        if (!resizable || !armed) return;
        event.preventDefault();
        event.stopPropagation();
        onResizeStart?.(event.clientX);
      }}
    >
      <div className={cn("relative flex items-center", resizable && armed && "cursor-col-resize")}>
        <div className="min-w-0 flex-1 overflow-hidden">{children}</div>
        {resizable && armed ? (
          <span className="pointer-events-none absolute right-[-1px] top-1/2 z-10 h-[60%] w-px -translate-y-1/2 bg-brand-6/70" />
        ) : null}
      </div>
    </th>
  );
}

export function PageTitle({
  title,
  actions,
  children,
}: {
  title: string;
  actions?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
      <div>
        <h1 className="text-[22px] font-semibold text-text-1 lg:text-2xl">{title}</h1>
        {children ? <div className="mt-2 text-sm text-text-3">{children}</div> : null}
      </div>
      {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
    </div>
  );
}

export function Surface({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <section className={cn("rounded-lg bg-white shadow-soft", className)}>{children}</section>;
}

export function Button({
  children,
  tone = "default",
  size = "md",
  icon,
  className,
  onClick,
}: {
  children?: ReactNode;
  tone?: "primary" | "default" | "ghost";
  size?: "md" | "sm" | "icon";
  icon?: ReactNode;
  className?: string;
  onClick?: () => void;
}) {
  const toneClass =
    tone === "primary"
      ? "border-brand-6 bg-brand-6 text-white hover:bg-brand-7"
      : tone === "ghost"
        ? "border-transparent bg-transparent text-text-3 hover:bg-fill-2"
        : "border-line-2 bg-white text-text-2 hover:border-brand-3 hover:text-brand-6";

  const sizeClass =
    size === "icon"
      ? "h-8 w-8 justify-center rounded-md px-0 py-0"
      : size === "sm"
        ? "h-7 rounded-md px-3 text-[13px]"
        : "h-8 rounded-md px-3 text-[13px]";

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 border font-medium transition",
        toneClass,
        sizeClass,
        className,
      )}
    >
      {icon}
      {children}
    </button>
  );
}

export function SearchInput({
  value,
  onChange,
  placeholder = "搜索",
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}) {
  return (
    <label
      className={cn(
        "flex h-8 items-center gap-2 rounded-md border border-line-2 bg-fill-1 px-3 text-[13px] text-text-3 transition focus-within:border-brand-6 focus-within:bg-white",
        className,
      )}
    >
      <Search size={16} />
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full bg-transparent text-text-1 outline-none placeholder:text-text-3"
      />
    </label>
  );
}

export function Input({
  value,
  onChange,
  placeholder,
  className,
  maxLength,
  readOnly = false,
}: {
  value: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  className?: string;
  maxLength?: number;
  readOnly?: boolean;
}) {
  return (
    <input
      value={value}
      onChange={(event) => onChange?.(event.target.value)}
      placeholder={placeholder}
      maxLength={maxLength}
      readOnly={readOnly}
      className={cn(
        "h-8 w-full rounded-md border border-line-2 bg-fill-1 px-3 text-[13px] text-text-1 outline-none transition focus:border-brand-6 focus:bg-white placeholder:text-text-3",
        readOnly && "cursor-not-allowed bg-fill-2 text-text-2 focus:border-line-2 focus:bg-fill-2",
        className,
      )}
    />
  );
}

export function BatchSearchInput({
  value,
  onChange,
  placeholder = "支持批量，精确匹配",
  dialogTitle,
  dialogPlaceholder = "可直接从Excel复制整列粘贴至此，最多1000条数据\n支持：换行、中文/英文逗号/分号、制表符（Tab）或空格",
  maxItems = 1000,
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  dialogTitle?: string;
  dialogPlaceholder?: string;
  maxItems?: number;
  className?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [draft, setDraft] = useState(value);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const [popoverStyle, setPopoverStyle] = useState<CSSProperties>({});

  useEffect(() => {
    if (!isOpen) {
      setDraft(value);
    }
  }, [value, isOpen]);

  const updatePopoverPosition = useCallback(() => {
    const el = triggerRef.current;
    if (!el || !isOpen) return;
    const rect = el.getBoundingClientRect();
    const minW = Math.max(320, rect.width);
    let left = rect.left;
    if (typeof window !== "undefined") {
      left = Math.min(left, window.innerWidth - minW - 8);
      left = Math.max(8, left);
    }
    setPopoverStyle({
      position: "fixed",
      top: rect.bottom + 4,
      left,
      minWidth: minW,
      zIndex: FLOATING_PANEL_Z,
    });
  }, [isOpen]);

  useLayoutEffect(() => {
    if (!isOpen) {
      setPopoverStyle({});
      return;
    }
    updatePopoverPosition();
    window.addEventListener("scroll", updatePopoverPosition, true);
    window.addEventListener("resize", updatePopoverPosition);
    return () => {
      window.removeEventListener("scroll", updatePopoverPosition, true);
      window.removeEventListener("resize", updatePopoverPosition);
    };
  }, [isOpen, updatePopoverPosition]);

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      const t = e.target as Node;
      if (triggerRef.current?.contains(t) || popoverRef.current?.contains(t)) return;
      setIsOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const itemCount = useMemo(() => {
    return draft
      .split(/[\n,，;；\t ]+/)
      .map((item) => item.trim())
      .filter(Boolean)
      .length;
  }, [draft]);

  const panel = (
    <div
      ref={popoverRef}
      style={popoverStyle}
      className="max-h-[min(520px,calc(100vh-24px))] overflow-hidden rounded-xl border border-line-1 bg-white shadow-dropdown"
    >
          <div className="border-b border-line-1 px-4 py-3 text-[14px] font-semibold text-text-1">
            {dialogTitle || "批量精确匹配"}
          </div>
          <div className="p-3">
            <textarea
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder={dialogPlaceholder}
              className="min-h-[200px] w-full resize-none rounded-lg border border-line-2 bg-white px-3 py-2 text-[13px] leading-7 text-text-1 outline-none transition focus:border-brand-6"
            />
          </div>
          <div className="flex items-end justify-between border-t border-line-1 px-4 py-3">
            <div>
              <div className="text-xs text-text-2">有效项</div>
              <div className="mt-0.5 text-lg font-semibold text-brand-6">{Math.min(itemCount, maxItems)}</div>
            </div>
            <div className="flex items-center gap-4">
              <button
                type="button"
                className="text-[14px] text-text-2 transition hover:text-text-1"
                onClick={() => setDraft("")}
              >
                清空
              </button>
              <Button onClick={() => { setIsOpen(false); setDraft(value); }}>取消</Button>
              <Button
                tone="primary"
                onClick={() => {
                  const normalized = draft
                    .split(/[\n,，;；\t ]+/)
                    .map((item) => item.trim())
                    .filter(Boolean)
                    .slice(0, maxItems)
                    .join("\n");
                  onChange(normalized);
                  setIsOpen(false);
                }}
              >
                确认
              </Button>
            </div>
          </div>
    </div>
  );

  return (
    <div className="relative">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex h-8 w-full items-center justify-between rounded-md border border-line-2 bg-fill-1 px-3 text-[13px] transition hover:border-brand-3 hover:bg-white",
          className,
        )}
      >
        <span className={value.trim() ? "truncate text-text-1" : "truncate text-text-3"}>{value.trim() ? `${itemCount} 项已录入` : placeholder}</span>
        <ListFilter size={16} className="shrink-0 text-text-3" />
      </button>

      {typeof document !== "undefined" && isOpen ? createPortal(panel, document.body) : null}
    </div>
  );
}

// ==================== Select 组件 ====================
interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  value: string;
  onChange?: (value: string) => void;
  options: string[];
  placeholder?: string;
  className?: string;
  allowSearch?: boolean;
  allowCreate?: boolean;
  usage?: SelectUsage;
}

export function Select({
  value,
  onChange,
  options,
  placeholder = "请选择",
  className,
  allowSearch = false,
  allowCreate = false,
  usage,
}: SelectProps) {
  const contextUsage = useContext(SelectUsageContext);
  const effectiveUsage = resolveSelectUsage({ usage, contextUsage, placeholder, options });
  const filterAllValue = effectiveUsage === "filter" ? options.find((option) => isFilterAllValue(option)) ?? "" : "";
  const normalizedValue = effectiveUsage === "filter" && isFilterAllValue(value) ? "" : value;
  const emptyLabel = effectiveUsage === "filter" ? "全部" : placeholder;
  const [isOpen, setIsOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const triggerRef = useRef<HTMLDivElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const [popoverStyle, setPopoverStyle] = useState<CSSProperties>({});
  const inputRef = useRef<HTMLInputElement>(null);

  const selectOptions: SelectOption[] = options
    .filter((opt) => !(effectiveUsage === "filter" && isFilterAllValue(opt)))
    .map((opt) => (typeof opt === "string" ? { value: opt, label: opt } : opt));

  const filteredOptions = selectOptions.filter((opt) =>
    opt.label.toLowerCase().includes(searchValue.toLowerCase())
  );

  const showCreateOption =
    allowCreate && searchValue && !selectOptions.some((opt) => opt.label === searchValue);

  const displayedOptions = [
    ...(effectiveUsage === "filter" ? [{ value: filterAllValue, label: "全部" }] : []),
    ...(showCreateOption
      ? [...filteredOptions, { value: searchValue, label: `创建 "${searchValue}"` }]
      : filteredOptions),
  ];

  useEffect(() => {
    if (isOpen && allowSearch && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen, allowSearch]);

  const updatePopoverPosition = useCallback(() => {
    const el = triggerRef.current;
    if (!el || !isOpen) return;
    const rect = el.getBoundingClientRect();
    const minW = Math.max(200, rect.width);
    let left = rect.left;
    if (typeof window !== "undefined") {
      left = Math.min(left, window.innerWidth - minW - 8);
      left = Math.max(8, left);
    }
    setPopoverStyle({
      position: "fixed",
      top: rect.bottom + 4,
      left,
      minWidth: minW,
      zIndex: FLOATING_PANEL_Z,
    });
  }, [isOpen]);

  useLayoutEffect(() => {
    if (!isOpen) {
      setPopoverStyle({});
      return;
    }
    updatePopoverPosition();
    window.addEventListener("scroll", updatePopoverPosition, true);
    window.addEventListener("resize", updatePopoverPosition);
    return () => {
      window.removeEventListener("scroll", updatePopoverPosition, true);
      window.removeEventListener("resize", updatePopoverPosition);
    };
  }, [isOpen, updatePopoverPosition]);

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      const t = e.target as Node;
      if (triggerRef.current?.contains(t) || popoverRef.current?.contains(t)) return;
      setIsOpen(false);
      setSearchValue("");
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === "Enter" || e.key === " ") {
        setIsOpen(true);
      }
      return;
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setHighlightedIndex((prev) => Math.min(prev + 1, displayedOptions.length - 1));
        break;
      case "ArrowUp":
        e.preventDefault();
        setHighlightedIndex((prev) => Math.max(prev - 1, 0));
        break;
      case "Enter":
        e.preventDefault();
        if (displayedOptions[highlightedIndex]) {
          onChange?.(displayedOptions[highlightedIndex].value);
          setIsOpen(false);
          setSearchValue("");
        }
        break;
      case "Escape":
        setIsOpen(false);
        setSearchValue("");
        break;
    }
  };

  const selectedOption = selectOptions.find((opt) => opt.value === normalizedValue);

  const panel = (
    <div
      ref={popoverRef}
      style={popoverStyle}
      className="flex max-h-[min(320px,calc(100vh-24px))] flex-col overflow-hidden rounded-md border border-line-2 bg-white py-1 shadow-dropdown"
    >
      {allowSearch && (
        <div className="shrink-0 p-2">
          <div className="relative">
            <Search size={14} className="absolute left-2 top-1/2 -translate-y-1/2 text-text-3" />
            <input
              ref={inputRef}
              type="text"
              value={searchValue}
              onChange={(e) => {
                setSearchValue(e.target.value);
                setHighlightedIndex(0);
              }}
              placeholder="搜索..."
              className="h-7 w-full rounded border border-line-2 bg-fill-1 pl-7 pr-3 text-[13px] outline-none focus:border-brand-6"
            />
          </div>
        </div>
      )}

      <div className="min-h-0 flex-1 overflow-y-auto">
        {displayedOptions.length === 0 ? (
          <div className="px-3 py-2 text-[13px] text-text-3">无匹配结果</div>
        ) : (
          displayedOptions.map((option, index) => (
            <div
              key={option.value}
              className={cn(
                "cursor-pointer px-3 py-2 text-[13px]",
                (
                  option.value === normalizedValue ||
                  (effectiveUsage === "filter" && normalizedValue === "" && option.value === filterAllValue)
                ) ? "bg-brand-1 text-brand-6" : "text-text-1",
                index === highlightedIndex && "bg-fill-2"
              )}
              onClick={() => {
                onChange?.(option.value);
                setIsOpen(false);
                setSearchValue("");
              }}
              onMouseEnter={() => setHighlightedIndex(index)}
            >
              {option.label}
            </div>
          ))
        )}
      </div>
    </div>
  );

  return (
    <div className={cn("relative", className)} onKeyDown={handleKeyDown}>
      <div
        ref={triggerRef}
        className={cn(
          "flex h-8 w-full cursor-pointer items-center justify-between rounded-md border border-line-2 bg-fill-1 px-3 text-[13px] transition focus-within:border-brand-6 focus-within:bg-white",
          isOpen && "border-brand-6"
        )}
        onClick={() => setIsOpen(!isOpen)}
        tabIndex={0}
      >
        <span className={selectedOption ? "text-text-1" : "text-text-3"}>
          {selectedOption?.label || emptyLabel}
        </span>
        <ChevronDown
          size={16}
          className={cn("shrink-0 text-text-3 transition-transform", isOpen && "rotate-180")}
        />
      </div>

      {typeof document !== "undefined" && isOpen ? createPortal(panel, document.body) : null}
    </div>
  );
}

// ==================== 日期选择组件 ====================
interface DateFieldProps {
  value: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function DateField({ value, onChange, placeholder, className }: DateFieldProps) {
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLDivElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const [popoverStyle, setPopoverStyle] = useState<CSSProperties>({});

  const parseValue = (val: string) => {
    if (!val) {
      const now = new Date();
      return { year: now.getFullYear(), month: now.getMonth() + 1, day: now.getDate() };
    }
    const parts = val.includes("/") ? val.split("/") : val.split("-");
    const [year, month, day] = parts.map(Number);
    return { year: year || 2024, month: month || 1, day: day || 1 };
  };

  const { year, month, day } = parseValue(value);
  const [viewYear, setViewYear] = useState(year);
  const [viewMonth, setViewMonth] = useState(month);

  const updatePopoverPosition = useCallback(() => {
    const el = triggerRef.current;
    if (!el || !isOpen) return;
    const rect = el.getBoundingClientRect();
    const minW = Math.max(280, rect.width);
    let left = rect.left;
    if (typeof window !== "undefined") {
      left = Math.min(left, window.innerWidth - minW - 8);
      left = Math.max(8, left);
    }
    setPopoverStyle({
      position: "fixed",
      top: rect.bottom + 4,
      left,
      minWidth: minW,
      zIndex: FLOATING_PANEL_Z,
    });
  }, [isOpen]);

  useLayoutEffect(() => {
    if (!isOpen) {
      setPopoverStyle({});
      return;
    }
    updatePopoverPosition();
    window.addEventListener("scroll", updatePopoverPosition, true);
    window.addEventListener("resize", updatePopoverPosition);
    return () => {
      window.removeEventListener("scroll", updatePopoverPosition, true);
      window.removeEventListener("resize", updatePopoverPosition);
    };
  }, [isOpen, updatePopoverPosition]);

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      const t = e.target as Node;
      if (triggerRef.current?.contains(t) || popoverRef.current?.contains(t)) return;
      setIsOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const getDaysInMonth = (y: number, m: number) => new Date(y, m, 0).getDate();
  const firstDayOfMonth = new Date(viewYear, viewMonth - 1, 1).getDay();
  const daysInMonth = getDaysInMonth(viewYear, viewMonth);

  const days: (number | null)[] = [];
  for (let i = 0; i < firstDayOfMonth; i++) days.push(null);
  for (let i = 1; i <= daysInMonth; i++) days.push(i);

  const years = Array.from({ length: 10 }, (_, i) => viewYear - 5 + i);
  const months = Array.from({ length: 12 }, (_, i) => i + 1);

  const handleSelectDay = (d: number) => {
    onChange?.(`${viewYear}-${String(viewMonth).padStart(2, "0")}-${String(d).padStart(2, "0")}`);
    setIsOpen(false);
  };

  const panel = (
    <div
      ref={popoverRef}
      style={popoverStyle}
      className="overflow-hidden rounded-lg border border-line-2 bg-white shadow-dropdown"
    >
          {/* 年月导航 */}
          <div className="flex items-center justify-between border-b border-line-1 px-3 py-2">
            <button type="button" onClick={() => setViewMonth((m) => (m === 1 ? 12 : m - 1))} className="flex h-7 w-7 items-center justify-center rounded hover:bg-fill-2">
              <ChevronLeft size={16} />
            </button>
            <div className="flex gap-2">
              <select value={viewYear} onChange={(e) => setViewYear(Number(e.target.value))} className="rounded border border-line-2 bg-fill-1 px-1 text-[13px]">
                {years.map((y) => <option key={y} value={y}>{y}</option>)}
              </select>
              <select value={viewMonth} onChange={(e) => setViewMonth(Number(e.target.value))} className="rounded border border-line-2 bg-fill-1 px-1 text-[13px]">
                {months.map((m) => <option key={m} value={m}>{m}月</option>)}
              </select>
            </div>
            <button type="button" onClick={() => setViewMonth((m) => (m === 12 ? 1 : m + 1))} className="flex h-7 w-7 items-center justify-center rounded hover:bg-fill-2">
              <ChevronRight size={16} />
            </button>
          </div>

          {/* 星期标题 */}
          <div className="grid grid-cols-7 border-b border-line-1 py-1.5 text-center text-[12px] text-text-3">
            {["日", "一", "二", "三", "四", "五", "六"].map((d) => <div key={d}>{d}</div>)}
          </div>

          {/* 日期网格 */}
          <div className="grid grid-cols-7 p-2">
            {days.map((d, i) => {
              const isSelected = d === day && viewMonth === month && viewYear === year;
              const isToday = d === new Date().getDate() && viewMonth === new Date().getMonth() + 1 && viewYear === new Date().getFullYear();
              return (
                <div key={i} className="aspect-square p-0.5">
                  {d && (
                    <button
                      type="button"
                      onClick={() => handleSelectDay(d)}
                      className={cn(
                        "flex h-full w-full items-center justify-center rounded text-[13px]",
                        isSelected && "bg-brand-6 text-white",
                        !isSelected && isToday && "border border-brand-6 text-brand-6",
                        !isSelected && !isToday && "hover:bg-fill-2"
                      )}
                    >
                      {d}
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {/* 底部操作 */}
          <div className="flex justify-end gap-2 border-t border-line-1 px-3 py-2">
            <button type="button" onClick={() => setIsOpen(false)} className="rounded px-3 py-1 text-[13px] hover:bg-fill-2">取消</button>
            <button type="button" onClick={() => setIsOpen(false)} className="rounded bg-brand-6 px-3 py-1 text-[13px] text-white hover:bg-brand-7">确定</button>
          </div>
    </div>
  );

  return (
    <div className={cn("relative", className)}>
      <div
        ref={triggerRef}
        className="flex h-8 w-full cursor-pointer items-center justify-between rounded-md border border-line-2 bg-fill-1 px-3 text-[13px] transition focus-within:border-brand-6 focus-within:bg-white"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className={value ? "text-text-1" : "text-text-3"}>{value || placeholder || "请选择日期"}</span>
        <CalendarDays size={16} className="text-text-3" />
      </div>

      {typeof document !== "undefined" && isOpen ? createPortal(panel, document.body) : null}
    </div>
  );
}

// ==================== 日期范围选择组件 ====================
interface DateRangeFieldProps {
  value: { start: string; end: string };
  onChange?: (value: { start: string; end: string }) => void;
  placeholder?: string;
  className?: string;
}

export function DateRangeField({ value, onChange, placeholder, className }: DateRangeFieldProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<"start" | "end">("start");
  const triggerRef = useRef<HTMLDivElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const [popoverStyle, setPopoverStyle] = useState<CSSProperties>({});

  const parseValue = (val: string) => {
    if (!val) {
      const now = new Date();
      return { year: now.getFullYear(), month: now.getMonth() + 1, day: now.getDate() };
    }
    const parts = val.includes("/") ? val.split("/") : val.split("-");
    const [year, month, day] = parts.map(Number);
    return { year: year || 2024, month: month || 1, day: day || 1 };
  };

  const startParsed = parseValue(value?.start || "");
  const endParsed = parseValue(value?.end || "");
  const [viewYear, setViewYear] = useState(startParsed.year);
  const [viewMonth, setViewMonth] = useState(startParsed.month);

  const updatePopoverPosition = useCallback(() => {
    const el = triggerRef.current;
    if (!el || !isOpen) return;
    const rect = el.getBoundingClientRect();
    const minW = Math.max(320, rect.width);
    let left = rect.left;
    if (typeof window !== "undefined") {
      left = Math.min(left, window.innerWidth - minW - 8);
      left = Math.max(8, left);
    }
    setPopoverStyle({
      position: "fixed",
      top: rect.bottom + 4,
      left,
      minWidth: minW,
      zIndex: FLOATING_PANEL_Z,
    });
  }, [isOpen]);

  useLayoutEffect(() => {
    if (!isOpen) {
      setPopoverStyle({});
      return;
    }
    updatePopoverPosition();
    window.addEventListener("scroll", updatePopoverPosition, true);
    window.addEventListener("resize", updatePopoverPosition);
    return () => {
      window.removeEventListener("scroll", updatePopoverPosition, true);
      window.removeEventListener("resize", updatePopoverPosition);
    };
  }, [isOpen, updatePopoverPosition]);

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      const t = e.target as Node;
      if (triggerRef.current?.contains(t) || popoverRef.current?.contains(t)) return;
      setIsOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const getDaysInMonth = (y: number, m: number) => new Date(y, m, 0).getDate();
  const firstDayOfMonth = new Date(viewYear, viewMonth - 1, 1).getDay();
  const daysInMonth = getDaysInMonth(viewYear, viewMonth);

  const days: (number | null)[] = [];
  for (let i = 0; i < firstDayOfMonth; i++) days.push(null);
  for (let i = 1; i <= daysInMonth; i++) days.push(i);

  const years = Array.from({ length: 10 }, (_, i) => viewYear - 5 + i);
  const months = Array.from({ length: 12 }, (_, i) => i + 1);

  const handleSelectDay = (d: number) => {
    const selected = `${viewYear}-${String(viewMonth).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    if (mode === "start") {
      onChange?.({ start: selected, end: value?.end || "" });
      setMode("end");
    } else {
      onChange?.({ start: value?.start || "", end: selected });
      setIsOpen(false);
      setMode("start");
    }
  };

  const isStartSelected = (d: number) =>
    d === startParsed.day && viewMonth === startParsed.month && viewYear === startParsed.year;
  const isEndSelected = (d: number) =>
    d === endParsed.day && viewMonth === endParsed.month && viewYear === endParsed.year;

  const displayValue = () => {
    if (value?.start && value?.end) return `${value.start} ~ ${value.end}`;
    if (value?.start) return `${value.start} ~`;
    return "";
  };

  const panel = (
    <div
      ref={popoverRef}
      style={popoverStyle}
      className="overflow-hidden rounded-lg border border-line-2 bg-white shadow-dropdown"
    >
          {/* 当前选择提示 */}
          <div className="border-b border-line-1 px-3 py-2 text-center text-[13px] text-text-3">
            {mode === "start" ? "请选择开始日期" : "请选择结束日期"}
          </div>

          {/* 年月导航 */}
          <div className="flex items-center justify-between border-b border-line-1 px-3 py-2">
            <button type="button" onClick={() => setViewMonth((m) => (m === 1 ? 12 : m - 1))} className="flex h-7 w-7 items-center justify-center rounded hover:bg-fill-2">
              <ChevronLeft size={16} />
            </button>
            <div className="flex gap-2">
              <select value={viewYear} onChange={(e) => setViewYear(Number(e.target.value))} className="rounded border border-line-2 bg-fill-1 px-1 text-[13px]">
                {years.map((y) => <option key={y} value={y}>{y}</option>)}
              </select>
              <select value={viewMonth} onChange={(e) => setViewMonth(Number(e.target.value))} className="rounded border border-line-2 bg-fill-1 px-1 text-[13px]">
                {months.map((m) => <option key={m} value={m}>{m}月</option>)}
              </select>
            </div>
            <button type="button" onClick={() => setViewMonth((m) => (m === 12 ? 1 : m + 1))} className="flex h-7 w-7 items-center justify-center rounded hover:bg-fill-2">
              <ChevronRight size={16} />
            </button>
          </div>

          {/* 星期标题 */}
          <div className="grid grid-cols-7 border-b border-line-1 py-1.5 text-center text-[12px] text-text-3">
            {["日", "一", "二", "三", "四", "五", "六"].map((d) => <div key={d}>{d}</div>)}
          </div>

          {/* 日期网格 */}
          <div className="grid grid-cols-7 p-2">
            {days.map((d, i) => {
              const startSel = isStartSelected(d || 0);
              const endSel = isEndSelected(d || 0);
              const isInRange = d !== null && !startSel && !endSel &&
                value?.start && value?.end &&
                new Date(`${viewYear}/${String(viewMonth).padStart(2, "0")}/${String(d).padStart(2, "0")}`) >= new Date(value.start) &&
                new Date(`${viewYear}/${String(viewMonth).padStart(2, "0")}/${String(d).padStart(2, "0")}`) <= new Date(value.end);
              return (
                <div key={i} className="aspect-square p-0.5">
                  {d && (
                    <button
                      type="button"
                      onClick={() => handleSelectDay(d)}
                      className={cn(
                        "flex h-full w-full items-center justify-center rounded text-[13px]",
                        startSel && "bg-brand-6 text-white",
                        endSel && "bg-brand-6 text-white",
                        isInRange && "bg-brand-1 text-brand-6",
                        !startSel && !endSel && !isInRange && "hover:bg-fill-2"
                      )}
                    >
                      {d}
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {/* 底部操作 */}
          <div className="flex justify-between border-t border-line-1 px-3 py-2">
            <button
              type="button"
              onClick={() => {
                onChange?.({ start: "", end: "" });
                setIsOpen(false);
                setMode("start");
              }}
              className="rounded px-3 py-1 text-[13px] hover:bg-fill-2"
            >
              清空
            </button>
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                setMode("start");
              }}
              className="rounded bg-brand-6 px-3 py-1 text-[13px] text-white hover:bg-brand-7"
            >
              确定
            </button>
          </div>
    </div>
  );

  return (
    <div className={cn("relative", className)}>
      <div
        ref={triggerRef}
        className="flex h-8 w-full cursor-pointer items-center justify-between rounded-md border border-line-2 bg-fill-1 px-3 text-[13px] transition focus-within:border-brand-6 focus-within:bg-white"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className={displayValue() ? "text-text-1" : "text-text-3"}>
          {displayValue() || placeholder || "请选择日期范围"}
        </span>
        <CalendarDays size={16} className="text-text-3" />
      </div>

      {typeof document !== "undefined" && isOpen ? createPortal(panel, document.body) : null}
    </div>
  );
}

// ==================== 时间选择组件 ====================
interface TimeFieldProps {
  value: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function TimeField({ value, onChange, placeholder, className }: TimeFieldProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const parseValue = (val: string) => {
    if (!val) return { hour: 12, minute: 0 };
    const [h, m] = val.split(":").map(Number);
    return { hour: h || 0, minute: m || 0 };
  };

  const { hour, minute } = parseValue(value);
  const [selectedHour, setSelectedHour] = useState(hour);
  const [selectedMinute, setSelectedMinute] = useState(minute);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const hours = Array.from({ length: 24 }, (_, i) => i);
  const minutes = [0, 15, 30, 45];

  const handleConfirm = () => {
    onChange?.(`${String(selectedHour).padStart(2, "0")}:${String(selectedMinute).padStart(2, "0")}`);
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <div
        className="flex h-8 w-full cursor-pointer items-center justify-between rounded-md border border-line-2 bg-fill-1 px-3 text-[13px] transition focus-within:border-brand-6 focus-within:bg-white"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className={value ? "text-text-1" : "text-text-3"}>{value || placeholder || "请选择时间"}</span>
        <Clock size={16} className="text-text-3" />
      </div>

      {isOpen && (
        <div className="absolute left-0 top-full z-50 mt-1 min-w-[200px] overflow-hidden rounded-lg border border-line-2 bg-white shadow-dropdown">
          {/* 时间网格 */}
          <div className="flex border-b border-line-1">
            <div className="flex-1 border-r border-line-1 p-2">
              <div className="mb-1 text-center text-[12px] text-text-3">时</div>
              <div className="grid grid-cols-6 gap-1">
                {hours.map((h) => (
                  <button
                    key={h}
                    type="button"
                    onClick={() => setSelectedHour(h)}
                    className={cn(
                      "rounded py-1 text-[13px]",
                      selectedHour === h ? "bg-brand-6 text-white" : "hover:bg-fill-2"
                    )}
                  >
                    {String(h).padStart(2, "0")}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex-1 p-2">
              <div className="mb-1 text-center text-[12px] text-text-3">分</div>
              <div className="grid grid-cols-4 gap-1">
                {minutes.map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setSelectedMinute(m)}
                    className={cn(
                      "rounded py-1 text-[13px]",
                      selectedMinute === m ? "bg-brand-6 text-white" : "hover:bg-fill-2"
                    )}
                  >
                    {String(m).padStart(2, "0")}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 底部操作 */}
          <div className="flex justify-end gap-2 border-t border-line-1 px-3 py-2">
            <button type="button" onClick={() => setIsOpen(false)} className="rounded px-3 py-1 text-[13px] hover:bg-fill-2">取消</button>
            <button type="button" onClick={handleConfirm} className="rounded bg-brand-6 px-3 py-1 text-[13px] text-white hover:bg-brand-7">确定</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ==================== 日期时间选择组件 ====================
interface DateTimeFieldProps {
  value: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function DateTimeField({ value, onChange, placeholder, className }: DateTimeFieldProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showTime, setShowTime] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const parseDate = (val: string) => {
    if (!val) {
      const now = new Date();
      return { year: now.getFullYear(), month: now.getMonth() + 1, day: now.getDate() };
    }
    const datePart = val.split(" ")[0];
    const [year, month, day] = datePart?.split("/").map(Number) || [2024, 1, 1];
    return { year: year || 2024, month: month || 1, day: day || 1 };
  };

  const parseTime = (val: string) => {
    if (!val) return { hour: 12, minute: 0 };
    const timePart = val.split(" ")[1] || "12:00";
    const [h, m] = timePart.split(":").map(Number);
    return { hour: h || 0, minute: m || 0 };
  };

  const { year, month, day } = parseDate(value);
  const { hour, minute } = parseTime(value);
  const [viewYear, setViewYear] = useState(year);
  const [viewMonth, setViewMonth] = useState(month);
  const [selectedHour, setSelectedHour] = useState(hour);
  const [selectedMinute, setSelectedMinute] = useState(minute);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setShowTime(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getDaysInMonth = (y: number, m: number) => new Date(y, m, 0).getDate();
  const firstDayOfMonth = new Date(viewYear, viewMonth - 1, 1).getDay();
  const daysInMonth = getDaysInMonth(viewYear, viewMonth);

  const days: (number | null)[] = [];
  for (let i = 0; i < firstDayOfMonth; i++) days.push(null);
  for (let i = 1; i <= daysInMonth; i++) days.push(i);

  const years = Array.from({ length: 10 }, (_, i) => viewYear - 5 + i);
  const months = Array.from({ length: 12 }, (_, i) => i + 1);
  const hours = Array.from({ length: 24 }, (_, i) => i);
  const minutes = [0, 15, 30, 45];

  const handleSelectDay = (d: number) => {
    const dateStr = `${viewYear}-${String(viewMonth).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    const timeStr = `${String(selectedHour).padStart(2, "0")}:${String(selectedMinute).padStart(2, "0")}`;
    onChange?.(`${dateStr} ${timeStr}`);
    setShowTime(true);
  };

  const displayValue = () => {
    if (!value) return "";
    return value;
  };

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <div
        className="flex h-8 w-full cursor-pointer items-center justify-between rounded-md border border-line-2 bg-fill-1 px-3 text-[13px] transition focus-within:border-brand-6 focus-within:bg-white"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className={displayValue() ? "text-text-1" : "text-text-3"}>{displayValue() || placeholder || "请选择日期和时间"}</span>
        <CalendarDays size={16} className="text-text-3" />
      </div>

      {isOpen && (
        <div className="absolute left-0 top-full z-50 mt-1 min-w-[280px] overflow-hidden rounded-lg border border-line-2 bg-white shadow-dropdown">
          {!showTime ? (
            <>
              {/* 年月导航 */}
              <div className="flex items-center justify-between border-b border-line-1 px-3 py-2">
                <button type="button" onClick={() => setViewMonth((m) => (m === 1 ? 12 : m - 1))} className="flex h-7 w-7 items-center justify-center rounded hover:bg-fill-2">
                  <ChevronLeft size={16} />
                </button>
                <div className="flex gap-2">
                  <select value={viewYear} onChange={(e) => setViewYear(Number(e.target.value))} className="rounded border border-line-2 bg-fill-1 px-1 text-[13px]">
                    {years.map((y) => <option key={y} value={y}>{y}</option>)}
                  </select>
                  <select value={viewMonth} onChange={(e) => setViewMonth(Number(e.target.value))} className="rounded border border-line-2 bg-fill-1 px-1 text-[13px]">
                    {months.map((m) => <option key={m} value={m}>{m}月</option>)}
                  </select>
                </div>
                <button type="button" onClick={() => setViewMonth((m) => (m === 12 ? 1 : m + 1))} className="flex h-7 w-7 items-center justify-center rounded hover:bg-fill-2">
                  <ChevronRight size={16} />
                </button>
              </div>

              {/* 星期标题 */}
              <div className="grid grid-cols-7 border-b border-line-1 py-1.5 text-center text-[12px] text-text-3">
                {["日", "一", "二", "三", "四", "五", "六"].map((d) => <div key={d}>{d}</div>)}
              </div>

              {/* 日期网格 */}
              <div className="grid grid-cols-7 p-2">
                {days.map((d, i) => {
                  const isSelected = d === day && viewMonth === month && viewYear === year;
                  const isToday = d === new Date().getDate() && viewMonth === new Date().getMonth() + 1 && viewYear === new Date().getFullYear();
                  return (
                    <div key={i} className="aspect-square p-0.5">
                      {d && (
                        <button
                          type="button"
                          onClick={() => handleSelectDay(d)}
                          className={cn(
                            "flex h-full w-full items-center justify-center rounded text-[13px]",
                            isSelected && "bg-brand-6 text-white",
                            !isSelected && isToday && "border border-brand-6 text-brand-6",
                            !isSelected && !isToday && "hover:bg-fill-2"
                          )}
                        >
                          {d}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <>
              {/* 切换回日期 */}
              <div className="border-b border-line-1 px-3 py-2">
                <button
                  type="button"
                  onClick={() => setShowTime(false)}
                  className="text-[13px] text-brand-6 hover:text-brand-7"
                >
                  ← 返回日期
                </button>
              </div>

              {/* 时间网格 */}
              <div className="flex border-b border-line-1">
                <div className="flex-1 border-r border-line-1 p-2">
                  <div className="mb-1 text-center text-[12px] text-text-3">时</div>
                  <div className="grid grid-cols-6 gap-1">
                    {hours.map((h) => (
                      <button
                        key={h}
                        type="button"
                        onClick={() => setSelectedHour(h)}
                        className={cn(
                          "rounded py-1 text-[13px]",
                          selectedHour === h ? "bg-brand-6 text-white" : "hover:bg-fill-2"
                        )}
                      >
                        {String(h).padStart(2, "0")}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex-1 p-2">
                  <div className="mb-1 text-center text-[12px] text-text-3">分</div>
                  <div className="grid grid-cols-4 gap-1">
                    {minutes.map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setSelectedMinute(m)}
                        className={cn(
                          "rounded py-1 text-[13px]",
                          selectedMinute === m ? "bg-brand-6 text-white" : "hover:bg-fill-2"
                        )}
                      >
                        {String(m).padStart(2, "0")}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}

          {/* 底部操作 */}
          <div className="flex justify-end gap-2 border-t border-line-1 px-3 py-2">
            <button type="button" onClick={() => { setIsOpen(false); setShowTime(false); }} className="rounded px-3 py-1 text-[13px] hover:bg-fill-2">取消</button>
            <button
              type="button"
              onClick={() => {
                if (!showTime) {
                  const now = new Date();
                  setViewYear(now.getFullYear());
                  setViewMonth(now.getMonth() + 1);
                }
                const dateStr = showTime
                  ? `${viewYear}/${String(viewMonth).padStart(2, "0")}/${String(day).padStart(2, "0")}`
                  : `${viewYear}/${String(viewMonth).padStart(2, "0")}/01`;
                const timeStr = `${String(selectedHour).padStart(2, "0")}:${String(selectedMinute).padStart(2, "0")}`;
                onChange?.(`${dateStr} ${timeStr}`);
                setIsOpen(false);
                setShowTime(false);
              }}
              className="rounded bg-brand-6 px-3 py-1 text-[13px] text-white hover:bg-brand-7"
            >
              确定
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export function TextArea({
  value,
  onChange,
  placeholder,
  className,
  maxLength,
  readOnly = false,
}: {
  value: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  className?: string;
  maxLength?: number;
  readOnly?: boolean;
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "32px";
    el.style.height = `${Math.max(el.scrollHeight, 32)}px`;
  }, [value]);

  return (
    <textarea
      ref={textareaRef}
      value={value}
      onChange={(event) => onChange?.(event.target.value)}
      placeholder={placeholder}
      maxLength={maxLength}
      readOnly={readOnly}
      rows={1}
      className={cn(
        "min-h-8 w-full resize-none overflow-hidden rounded-md border border-line-2 bg-fill-1 px-3 py-1.5 text-[13px] leading-[22px] text-text-1 outline-none transition focus:border-brand-6 focus:bg-white placeholder:text-text-3",
        readOnly && "cursor-not-allowed bg-fill-2 text-text-2 focus:border-line-2 focus:bg-fill-2",
        className,
      )}
    />
  );
}

export function SectionHeader({
  title,
  tip,
}: {
  title: string;
  tip?: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="h-4 w-1 rounded-sm bg-brand-6" />
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="text-[20px] font-semibold text-text-1">{title}</h2>
        {tip ? <span className="text-sm text-text-3">{tip}</span> : null}
      </div>
    </div>
  );
}

export function HintBox({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-sm border border-brand-4 bg-[rgba(232,243,255,0.66)] px-4 py-3 text-[13px] leading-6 text-text-2">
      {children}
    </div>
  );
}

export function FormField({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <div className="mb-2 text-[13px] text-text-2">
        {required ? <span className="mr-1 text-danger">*</span> : null}
        {label}
      </div>
      {children}
    </label>
  );
}

export function FilterField({
  label,
  children,
  className,
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <SelectUsageContext.Provider value="filter">
      <div className={cn("flex min-w-[160px] flex-col gap-2", className)}>
        <div className="text-[13px] text-text-2">{label}</div>
        {children}
      </div>
    </SelectUsageContext.Provider>
  );
}

export function FilterActions({
  primaryLabel = "查询",
  secondaryLabel = "重置",
  extra,
  onPrimaryClick,
  onSecondaryClick,
}: {
  primaryLabel?: string;
  secondaryLabel?: string;
  extra?: ReactNode;
  onPrimaryClick?: () => void;
  onSecondaryClick?: () => void;
}) {
  return (
    <div className="flex items-end gap-2 self-end">
      <Button tone="primary" className="min-w-[72px] justify-center" onClick={onPrimaryClick}>
        {primaryLabel}
      </Button>
      <Button className="min-w-[72px] justify-center" onClick={onSecondaryClick}>
        {secondaryLabel}
      </Button>
      {extra}
    </div>
  );
}

export function TabBar<T extends string>({
  items,
  activeKey,
  onChange,
  className,
  variant = "pill",
}: {
  items: Array<{ key: T; label: React.ReactNode }>;
  activeKey: T;
  onChange: (key: T) => void;
  className?: string;
  /** pill：独立描边按钮；segmented：浅底分段控件；underline：Ant 式横线 Tab，底部分割线 + 选中项蓝色字与 2px 下划线 */
  variant?: "pill" | "segmented" | "underline";
}) {
  if (variant === "segmented") {
    return (
      <div className={cn(className)}>
        <div
          role="tablist"
          className="inline-flex max-w-full flex-wrap items-stretch gap-0.5 rounded-lg bg-fill-2 p-1 ring-1 ring-inset ring-black/[0.06]"
        >
          {items.map((item) => {
            const isActive = activeKey === item.key;
            return (
              <button
                key={item.key}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => onChange(item.key)}
                className={cn(
                  "min-h-8 shrink-0 rounded-md px-3 py-1.5 text-[13px] font-medium transition-all duration-150",
                  isActive
                    ? "bg-white text-text-1 shadow-sm ring-1 ring-black/[0.06]"
                    : "text-text-2 hover:bg-white/70 hover:text-text-1",
                )}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  if (variant === "underline") {
    return (
      <div
        role="tablist"
        className={cn("flex flex-wrap items-stretch gap-1 border-b border-line-1", className)}
      >
        {items.map((item) => {
          const isActive = activeKey === item.key;
          return (
            <button
              key={item.key}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => onChange(item.key)}
              className={cn(
                "relative shrink-0 px-4 pb-3 pt-2 text-[14px] transition-colors duration-150",
                isActive
                  ? "font-medium text-brand-6 after:pointer-events-none after:absolute after:bottom-0 after:left-1/2 after:h-[2px] after:w-8 after:-translate-x-1/2 after:rounded-sm after:bg-brand-6"
                  : "font-normal text-text-2 hover:text-brand-6/90",
              )}
            >
              {item.label}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className={cn("mb-4 flex flex-wrap items-center gap-2", className)}>
      {items.map((item) => {
        const isActive = activeKey === item.key;
        return (
          <button
            key={item.key}
            type="button"
            onClick={() => onChange(item.key)}
            className={cn(
              "relative flex items-center justify-center rounded-lg px-4 py-1.5 text-[14px] font-medium transition-all duration-200 border",
              isActive
                ? "bg-brand-1 text-brand-7 border-brand-3 shadow-sm"
                : "bg-white text-text-2 border-transparent hover:bg-fill-2 hover:text-text-1",
            )}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}

export function StatusPill({
  children,
  tone,
  className,
}: {
  children: ReactNode;
  tone: "green" | "blue" | "orange" | "red" | "gray";
  className?: string;
}) {
  const toneClass = {
    green: "bg-success/10 text-success",
    blue: "bg-brand-1 text-brand-6",
    orange: "bg-warning/10 text-warning",
    red: "bg-danger/10 text-danger",
    gray: "bg-fill-2 text-text-3",
  }[tone];

  return <span className={cn("inline-flex items-center justify-center rounded px-2 py-1 text-xs font-medium", toneClass, className)}>{children}</span>;
}

export function Checkbox({
  checked: controlledChecked,
  defaultChecked = false,
  onChange,
  disabled = false,
  className,
}: {
  checked?: boolean;
  defaultChecked?: boolean;
  onChange?: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
}) {
  const [internalChecked, setInternalChecked] = useState(defaultChecked);
  const isControlled = controlledChecked !== undefined;
  const checked = isControlled ? controlledChecked : internalChecked;

  return (
    <div
      onClick={(e) => {
        if (disabled) return;
        e.stopPropagation();
        if (!isControlled) {
          setInternalChecked(!checked);
        }
        onChange?.(!checked);
      }}
      className={cn(
        "flex h-4 w-4 cursor-pointer items-center justify-center rounded-[2px] border transition-colors",
        checked
          ? "border-brand-6 bg-brand-6 text-white"
          : "border-line-3 bg-white hover:border-brand-6",
        disabled && "cursor-not-allowed opacity-50",
        className
      )}
    >
      {checked && (
        <svg viewBox="0 0 10 7" fill="none" className="h-[7px] w-[10px]">
          <path
            d="M1 3.5L3.5 6L9 1"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
    </div>
  );
}

// ==================== 单选框组件 ====================
interface RadioOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface RadioProps {
  value?: string;
  onChange?: (value: string) => void;
  options: RadioOption[];
  disabled?: boolean;
  className?: string;
}

export function RadioGroup({ value, onChange, options, disabled = false, className }: RadioProps) {
  return (
    <div className={cn("flex flex-wrap gap-4", className)}>
      {options.map((option) => {
        const isSelected = value === option.value;
        return (
          <div
            key={option.value}
            onClick={() => {
              if (disabled || option.disabled) return;
              onChange?.(option.value);
            }}
            className={cn(
              "flex items-center gap-2 cursor-pointer",
              (disabled || option.disabled) && "cursor-not-allowed opacity-50"
            )}
          >
            <div
              className={cn(
                "flex h-4 w-4 items-center justify-center rounded-full border transition-colors",
                isSelected
                  ? "border-brand-6 bg-brand-6"
                  : "border-line-3 bg-white hover:border-brand-6"
              )}
            >
              {isSelected && <div className="h-1.5 w-1.5 rounded-full bg-white" />}
            </div>
            <span className="text-[13px] text-text-1">{option.label}</span>
          </div>
        );
      })}
    </div>
  );
}

// ==================== 开关组件 ====================
interface SwitchProps {
  checked?: boolean;
  defaultChecked?: boolean;
  onChange?: (checked: boolean) => void;
  disabled?: boolean;
  size?: "small" | "default";
  className?: string;
}

export function Switch({
  checked: controlledChecked,
  defaultChecked = false,
  onChange,
  disabled = false,
  size = "default",
  className,
}: SwitchProps) {
  const [internalChecked, setInternalChecked] = useState(defaultChecked);
  const isControlled = controlledChecked !== undefined;
  const checked = isControlled ? controlledChecked : internalChecked;

  const handleClick = () => {
    if (disabled) return;
    if (!isControlled) {
      setInternalChecked(!checked);
    }
    onChange?.(!checked);
  };

  return (
    <div
      onClick={handleClick}
      className={cn(
        "relative cursor-pointer rounded-full transition-colors",
        size === "small" ? "h-5 w-9" : "h-6 w-11",
        checked ? "bg-brand-6" : "bg-line-3",
        disabled && "cursor-not-allowed opacity-50",
        className
      )}
    >
      <div
        className={cn(
          "absolute top-0.5 rounded-full bg-white shadow transition-transform",
          size === "small" ? "h-4 w-4" : "h-5 w-5",
          checked
            ? size === "small" ? "translate-x-4" : "translate-x-5"
            : "translate-x-0.5"
        )}
      />
    </div>
  );
}

// ==================== 上传组件 ====================
interface UploadFile {
  id: string;
  name: string;
  size: number;
  status: "uploading" | "success" | "error";
  url?: string;
  progress?: number;
}

interface UploadProps {
  value?: UploadFile[];
  onChange?: (files: UploadFile[]) => void;
  accept?: string;
  multiple?: boolean;
  disabled?: boolean;
  className?: string;
}

export function Upload({
  value = [],
  onChange,
  accept,
  multiple = false,
  disabled = false,
  className,
}: UploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = (fileList: FileList) => {
    const newFiles: UploadFile[] = Array.from(fileList).map((file, index) => ({
      id: `${Date.now()}-${index}`,
      name: file.name,
      size: file.size,
      status: "success" as const,
      url: URL.createObjectURL(file),
    }));
    const updated = multiple ? [...value, ...newFiles] : newFiles.slice(0, 1);
    onChange?.(updated);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (disabled) return;
    handleFiles(e.dataTransfer.files);
  };

  const handleRemove = (id: string) => {
    onChange?.(value.filter((f) => f.id !== id));
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className={cn("space-y-3", className)}>
      {/* 上传区域 */}
      <div
        onClick={() => !disabled && inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); if (!disabled) setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={cn(
          "flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 transition-colors cursor-pointer",
          isDragging ? "border-brand-6 bg-brand-1" : "border-line-2 bg-fill-1 hover:border-brand-6 hover:bg-white",
          disabled && "cursor-not-allowed opacity-50"
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          disabled={disabled}
          onChange={(e) => e.target.files && handleFiles(e.target.files)}
          className="hidden"
        />
        <div className="text-3xl text-text-3 mb-2">+</div>
        <div className="text-[13px] text-text-2">
          <span className="text-brand-6">点击上传</span> 或拖拽文件到此处
        </div>
        <div className="mt-1 text-[12px] text-text-3">
          {accept ? `支持 ${accept} 格式` : "支持图片、文档等文件"}
        </div>
      </div>

      {/* 文件列表 */}
      {value.length > 0 && (
        <div className="space-y-2">
          {value.map((file) => (
            <div
              key={file.id}
              className="flex items-center gap-3 rounded-lg border border-line-1 bg-fill-1 px-3 py-2"
            >
              <div className="flex-1 min-w-0">
                <div className="truncate text-[13px] text-text-1">{file.name}</div>
                <div className="text-[12px] text-text-3">{formatSize(file.size)}</div>
              </div>
              {file.status === "uploading" && (
                <div className="text-[12px] text-text-3">{file.progress || 0}%</div>
              )}
              {file.status === "success" && (
                <div className="text-[12px] text-success">上传成功</div>
              )}
              {file.status === "error" && (
                <div className="text-[12px] text-danger">上传失败</div>
              )}
              <button
                type="button"
                onClick={() => handleRemove(file.id)}
                className="text-text-3 hover:text-danger"
              >
                <X size={16} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function TableSortHeader({
  label,
  sortKey,
  currentSort,
  onSort,
  align = "left",
}: {
  label: string;
  sortKey: string;
  currentSort: { key: string; direction: "asc" | "desc" } | null;
  onSort: (key: string) => void;
  align?: "left" | "right";
}) {
  const isActive = currentSort?.key === sortKey;
  
  return (
    <div 
      className={cn("flex items-center gap-1 cursor-pointer hover:text-text-1 transition select-none", align === "right" && "justify-end")} 
      onClick={() => onSort(sortKey)}
    >
      {label}
      {isActive ? (
        currentSort.direction === "asc" 
          ? <ChevronUp size={14} className="text-brand-6 opacity-100" />
          : <ChevronDown size={14} className="text-brand-6 opacity-100" />
      ) : (
        <ChevronsUpDown size={14} className="opacity-40" />
      )}
    </div>
  );
}

export function Pagination({
  total,
  currentPage,
  pageSize,
  onPageChange,
  onPageSizeChange,
  className,
  children,
}: {
  total: number;
  currentPage: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  className?: string;
  children?: ReactNode;
}) {
  const [isPageSizeOpen, setIsPageSizeOpen] = useState(false);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const pages = Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1);

  return (
    <div className={cn("flex flex-col gap-3 text-sm text-text-2 lg:flex-row lg:items-center lg:justify-between", className)}>
      <div>
        {children}
        共计 {total} 条记录
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1 overflow-x-auto">
          <button
            type="button"
            disabled={currentPage === 1}
            onClick={() => onPageChange(Math.max(1, currentPage - 1))}
            className="rounded border border-line-2 p-1.5 text-text-3 hover:bg-fill-2 disabled:opacity-50 transition h-8 flex items-center justify-center cursor-pointer"
          >
            <ChevronLeft size={14} />
          </button>
          
          {pages.map((page) => (
            <button
              key={page}
              type="button"
              onClick={() => onPageChange(page)}
              className={cn(
                "h-8 min-w-[32px] rounded border px-2 cursor-pointer transition",
                page === currentPage ? "border-brand-6 bg-brand-1 text-brand-6 font-medium" : "border-transparent bg-white text-text-2 hover:bg-fill-2",
              )}
            >
              {page}
            </button>
          ))}

          <button
            type="button"
            disabled={currentPage === totalPages}
            onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
            className="rounded border border-line-2 p-1.5 text-text-3 hover:bg-fill-2 disabled:opacity-50 transition h-8 flex items-center justify-center cursor-pointer"
          >
            <ChevronRight size={14} />
          </button>
        </div>
        
        <div className="relative">
          <div
            onClick={() => setIsPageSizeOpen(!isPageSizeOpen)}
            className="flex items-center h-8 rounded border border-line-2 px-2.5 cursor-pointer hover:border-brand-6 transition text-text-2 gap-2 bg-white"
          >
             <span>{pageSize}条/页</span>
             <ChevronDown size={14} className={cn("text-text-3 transition-transform", isPageSizeOpen && "rotate-180")} />
          </div>
          
          {isPageSizeOpen ? (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setIsPageSizeOpen(false)} />
              <div className="absolute bottom-[calc(100%+4px)] left-0 z-50 w-full min-w-[90px] overflow-hidden rounded-md border border-line-2 bg-white py-1 shadow-dropdown">
                {[10, 20, 50, 100].map((size) => (
                  <div
                    key={size}
                    onClick={() => {
                      onPageSizeChange(size);
                      setIsPageSizeOpen(false);
                    }}
                    className={cn(
                      "cursor-pointer px-3 py-1.5 text-[13px] transition hover:bg-fill-2",
                      size === pageSize ? "font-medium text-brand-6 bg-brand-1" : "text-text-2"
                    )}
                  >
                    {size}条/页
                  </div>
                ))}
              </div>
            </>
          ) : null}
        </div>

        <div className="flex items-center gap-2">
           <span className="text-text-2">前往</span>
           <input
             type="text"
             value={currentPage}
             onChange={(e) => {
               const val = e.target.value;
               const num = Number(val);
               if (val === "" || (num >= 1 && num <= totalPages)) {
                 if (val !== "") onPageChange(num);
               }
             }}
             onKeyDown={(e) => {
               if (e.key === "Enter") {
                 const num = Number((e.target as HTMLInputElement).value);
                 if (num >= 1 && num <= totalPages) onPageChange(num);
               }
             }}
             className="h-8 w-12 rounded border border-line-2 text-center text-text-2 focus:border-brand-6 outline-none transition"
           />
           <span className="text-text-2">页</span>
        </div>
      </div>
    </div>
  );
}

// ==================== 全局消息提示组件 ====================
type MessageType = "info" | "normal" | "success" | "warning" | "error";

interface MessageInstance {
  id: number;
  type: MessageType;
  content: ReactNode;
  duration: number;
  closable: boolean;
  onClose?: () => void;
}

interface MessageContextType {
  addMessage: (msg: Omit<MessageInstance, "id">) => number;
  removeMessage: (id: number) => void;
}

const MessageContext = createContext<MessageContextType | null>(null);

export function useMessage() {
  const context = useContext(MessageContext);
  if (!context) {
    // 如果没有 provider，返回一个空的实现
    const noop = () => 0;
    return { addMessage: noop, removeMessage: noop, success: noop, error: noop, warning: noop, info: noop, normal: noop };
  }
  return context;
}

// 全局消息列表
let messageList: MessageInstance[] = [];
let messageCount = 0;
let setMessageListFn: React.Dispatch<React.SetStateAction<MessageInstance[]>> | null = null;

function updateMessageList(updater: React.SetStateAction<MessageInstance[]>) {
  if (setMessageListFn) {
    setMessageListFn(updater);
  }
}

function generateId() {
  return ++messageCount;
}

export const Message: MessageContextType & {
  info: (content: ReactNode, duration?: number) => number;
  normal: (content: ReactNode, duration?: number) => number;
  success: (content: ReactNode, duration?: number) => number;
  warning: (content: ReactNode, duration?: number) => number;
  error: (content: ReactNode, duration?: number) => number;
  open: (options: { type?: MessageType; content: ReactNode; duration?: number; closable?: boolean; onClose?: () => void }) => number;
  remove: (id: number) => void;
  removeAll: () => void;
} = {
  addMessage: (msg) => {
    const id = generateId();
    updateMessageList((list) => [...list, { ...msg, id }]);
    return id;
  },

  removeMessage: (id) => {
    updateMessageList((list) => list.filter((msg) => msg.id !== id));
  },

  info: (content, duration = 2000) => {
    return Message.addMessage({ type: "info", content, duration, closable: false });
  },

  normal: (content, duration = 2000) => {
    return Message.addMessage({ type: "normal", content, duration, closable: false });
  },

  success: (content, duration = 2000) => {
    return Message.addMessage({ type: "success", content, duration, closable: false });
  },

  warning: (content, duration = 3000) => {
    return Message.addMessage({ type: "warning", content, duration, closable: false });
  },

  error: (content, duration = 3000) => {
    return Message.addMessage({ type: "error", content, duration, closable: false });
  },

  open: ({ type = "normal", content, duration = type === "warning" || type === "error" ? 3000 : 2000, closable = false, onClose }) => {
    return Message.addMessage({ type, content, duration, closable, onClose });
  },

  remove: (id) => {
    Message.removeMessage(id);
  },

  removeAll: () => {
    updateMessageList([]);
  },
};

// 消息提示框渲染组件（需要在 App 中放置一次）
export function MessageContainer() {
  const [list, setList] = useState<MessageInstance[]>([]);

  useEffect(() => {
    messageList = list;
  }, [list]);

  useEffect(() => {
    setMessageListFn = setList;
    return () => {
      setMessageListFn = null;
    };
  }, []);

  // 定时关闭
  useEffect(() => {
    const timers = list.map((msg) => {
      if (msg.duration > 0 && !msg.closable) {
        return setTimeout(() => {
          Message.removeMessage(msg.id);
        }, msg.duration);
      }
      return null;
    });

    return () => {
      timers.forEach((timer) => timer && clearTimeout(timer));
    };
  }, [list]);

  if (list.length === 0) return null;

  return (
    <div className="pointer-events-none fixed left-1/2 top-5 z-[9999] flex -translate-x-1/2 flex-col items-center gap-2.5">
      {list.map((msg) => (
        <MessageItem key={msg.id} msg={msg} onRemove={() => Message.removeMessage(msg.id)} />
      ))}
    </div>
  );
}

function MessageItem({ msg, onRemove }: { msg: MessageInstance; onRemove: () => void }) {
  const typeConfig = {
    info: {
      iconWrap: "bg-brand-1 text-brand-6",
      icon: <Info size={16} />,
    },
    normal: {
      iconWrap: "bg-fill-2 text-text-2",
      icon: <Info size={16} />,
    },
    success: {
      iconWrap: "bg-success/10 text-success",
      icon: <CheckCircle size={16} />,
    },
    warning: {
      iconWrap: "bg-warning/10 text-warning",
      icon: <AlertTriangle size={16} />,
    },
    error: {
      iconWrap: "bg-danger/10 text-danger",
      icon: <XCircle size={16} />,
    },
  };

  const config = typeConfig[msg.type];

  return (
    <div
      className={cn(
        "pointer-events-auto flex min-w-[280px] max-w-[520px] items-center gap-3 rounded-xl border border-line-1 bg-white px-4 py-3 text-text-1 shadow-soft",
      )}
      style={{ animation: "fadeUp 0.3s ease-out" }}
    >
      <span className={cn("flex h-7 w-7 shrink-0 items-center justify-center rounded-full", config.iconWrap)}>
        {config.icon}
      </span>
      <div className="flex-1 text-sm leading-6 text-text-1">{msg.content}</div>
      {msg.closable && (
        <button
          type="button"
          onClick={() => {
            msg.onClose?.();
            onRemove();
          }}
          className="text-text-3 transition hover:text-text-1"
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
}
