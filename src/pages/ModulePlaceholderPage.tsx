import { AlertCircle } from "lucide-react";
import { Button, PageTitle, Surface } from "../components/Ui";
import { type PageDepth, type ViewKey, placeholderSummaries } from "../data/mock";

export function ModulePlaceholderPage({ view, depth }: { view: ViewKey; depth: PageDepth }) {
  const summary = placeholderSummaries[view];

  return (
    <div className="space-y-6">
      <PageTitle title={summary.title}>{summary.desc}</PageTitle>

      <Surface className="p-5">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-md bg-brand-1 text-brand-6">
            <AlertCircle size={16} />
          </span>
          <div>
            <div className="text-sm font-semibold text-text-1">
              {depth === "secondary" ? "次要页骨架已预留" : "当前为占位页"}
            </div>
            <p className="mt-2 text-[13px] leading-6 text-text-2">
              当前阶段优先保证核心页可演示。该页面先保留标题、目标和扩展方向，后续可按同一模板继续深化。
            </p>
          </div>
        </div>
      </Surface>
      <Surface className="p-5">
        <div className="text-sm font-semibold text-text-1">当前阶段保留内容</div>
        <ul className="mt-3 space-y-2 text-[13px] text-text-2">
          {summary.bullets.map((item) => (
            <li key={item}>- {item}</li>
          ))}
        </ul>
        <div className="mt-5 flex gap-2">
          <Button>查看规范</Button>
          <Button tone="primary">继续深化</Button>
        </div>
      </Surface>
    </div>
  );
}
