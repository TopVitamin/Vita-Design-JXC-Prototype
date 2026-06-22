import { DateRangeField, FilterField, SearchInput, Select, BatchSearchInput } from "./Ui";

type FilterConfig = {
  key: string;
  label: string;
  type: "search" | "batch" | "select" | "dateRange";
  placeholder?: string;
  options?: string[];
};

interface FilterItemProps {
  filter: FilterConfig;
  keyword: string;
  onKeywordChange: (value: string) => void;
  value: string;
  onValueChange: (value: string) => void;
  dateRangeValue?: { start: string; end: string };
  onDateRangeChange?: (value: { start: string; end: string }) => void;
}

export function FilterItem({
  filter,
  keyword,
  onKeywordChange,
  value,
  onValueChange,
  dateRangeValue,
  onDateRangeChange,
}: FilterItemProps) {
  if (filter.type === "search") {
    return (
      <FilterField label={filter.label}>
        <SearchInput value={keyword} onChange={onKeywordChange} placeholder={filter.placeholder ?? "搜索"} className="w-[220px] bg-white" />
        {/* value 和 onValueChange 在 search 类型下不适用，通过下划线标记为有意未使用 */}
      </FilterField>
    );
  }

  if (filter.type === "batch") {
    return (
      <FilterField label={filter.label}>
        <div className="w-[220px]">
          <BatchSearchInput
            value={value}
            onChange={onValueChange}
            placeholder={filter.placeholder ?? "支持批量，精确匹配"}
            dialogTitle={`${filter.label}批量精确匹配`}
          />
        </div>
      </FilterField>
    );
  }

  if (filter.type === "select") {
    return (
      <FilterField label={filter.label}>
        <div className="w-[220px]">
          <Select value={value} onChange={onValueChange} options={filter.options ?? []} placeholder={filter.label} className="bg-white" />
        </div>
      </FilterField>
    );
  }

  if (filter.type === "dateRange") {
    return (
      <FilterField label={filter.label}>
        <DateRangeField
          value={dateRangeValue ?? { start: "", end: "" }}
          onChange={onDateRangeChange ?? (() => {})}
          placeholder="请选择日期范围"
          className="w-[220px]"
        />
      </FilterField>
    );
  }

  return null;
}
