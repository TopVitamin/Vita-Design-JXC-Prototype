import { useState, type ReactNode } from "react";
import { CalendarDays, ChevronDown, ChevronLeft, ChevronRight, ChevronUp, ChevronsUpDown, Search } from "lucide-react";
import { cn } from "../utils/cn";

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
    <div className="flex flex-col gap-3 border-b border-line-1 pb-5 lg:flex-row lg:items-start lg:justify-between">
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
      ? "h-8 w-8 justify-center rounded-md px-0"
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
}: {
  value: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  className?: string;
}) {
  return (
    <input
      value={value}
      onChange={(event) => onChange?.(event.target.value)}
      placeholder={placeholder}
      className={cn(
        "h-8 w-full rounded-md border border-line-2 bg-fill-1 px-3 text-[13px] text-text-1 outline-none transition focus:border-brand-6 focus:bg-white placeholder:text-text-3",
        className,
      )}
    />
  );
}

export function Select({
  value,
  onChange,
  options,
  placeholder = "请选择",
  className,
}: {
  value: string;
  onChange?: (value: string) => void;
  options: string[];
  placeholder?: string;
  className?: string;
}) {
  return (
    <label
      className={cn(
        "flex h-8 w-full cursor-pointer items-center justify-between rounded-md border border-line-2 bg-fill-1 px-3 text-[13px] text-text-2 transition focus-within:border-brand-6 focus-within:bg-white",
        className,
      )}
    >
      <select
        value={value}
        onChange={(event) => onChange?.(event.target.value)}
        className="w-full appearance-none bg-transparent text-text-1 outline-none"
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
      <ChevronDown size={16} className="shrink-0 text-text-3" />
    </label>
  );
}

export function DateField({
  value,
  onChange,
  placeholder = "请选择日期",
  className,
}: {
  value: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  className?: string;
}) {
  return (
    <label
      className={cn(
        "flex h-8 items-center gap-2 rounded-md border border-line-2 bg-fill-1 px-3 text-[13px] transition focus-within:border-brand-6 focus-within:bg-white",
        className,
      )}
    >
      <input
        type="date"
        value={value}
        onChange={(event) => onChange?.(event.target.value)}
        placeholder={placeholder}
        className="w-full bg-transparent text-text-1 outline-none"
      />
      <CalendarDays size={16} className="text-text-3" />
    </label>
  );
}

export function TextArea({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange?: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <textarea
      value={value}
      onChange={(event) => onChange?.(event.target.value)}
      placeholder={placeholder}
      rows={4}
      className="min-h-[88px] w-full rounded-md border border-line-2 bg-fill-1 px-3 py-2.5 text-[13px] leading-6 text-text-1 outline-none transition focus:border-brand-6 focus:bg-white placeholder:text-text-3"
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
  className,
}: {
  checked?: boolean;
  defaultChecked?: boolean;
  onChange?: (checked: boolean) => void;
  className?: string;
}) {
  const [internalChecked, setInternalChecked] = useState(defaultChecked);
  const isControlled = controlledChecked !== undefined;
  const checked = isControlled ? controlledChecked : internalChecked;

  return (
    <div
      onClick={(e) => {
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
    <div className={cn("mt-4 flex flex-col gap-3 text-sm text-text-2 lg:flex-row lg:items-center lg:justify-between", className)}>
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
               const num = Number(e.target.value);
               if (num >= 1 && num <= totalPages) onPageChange(num);
             }}
             className="h-8 w-12 rounded border border-line-2 text-center text-text-2 focus:border-brand-6 outline-none transition"
           />
           <span className="text-text-2">页</span>
        </div>
      </div>
    </div>
  );
}
