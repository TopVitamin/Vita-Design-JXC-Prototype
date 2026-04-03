import { ArrowRight, BriefcaseBusiness, History, LayoutGrid, ScanLine } from "lucide-react";
import { dashboardFeatureCards, dashboardTools, inventoryShortcuts, recentVisits } from "../data/mock";
import { Button, Surface } from "../components/Ui";

const iconPalette = {
  blue: "bg-brand-6/10 text-brand-6",
  cyan: "bg-cyan-100 text-cyan-600",
  sky: "bg-sky-100 text-sky-600",
  violet: "bg-violet-100 text-violet-600",
  amber: "bg-amber-100 text-amber-600",
  emerald: "bg-emerald-100 text-emerald-600",
};

export function DashboardPage() {
  return (
    <div className="space-y-5">
      <div className="grid gap-4 lg:grid-cols-[280px_minmax(0,1fr)]">
        <div className="space-y-4">
          <Surface className="p-4">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-base font-semibold text-text-1">快捷入口</h3>
              <button type="button" className="text-xs text-text-3">
                配置
              </button>
            </div>
            <div className="space-y-2">
              {inventoryShortcuts.map((item) => (
                <button
                  key={item}
                  type="button"
                  className="flex w-full items-center gap-3 rounded-md bg-fill-1 px-3 py-3 text-left text-sm text-text-2 transition hover:bg-fill-2"
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-md bg-white text-brand-6 shadow-sm">
                    <LayoutGrid size={16} />
                  </span>
                  <span>{item}</span>
                </button>
              ))}
            </div>
          </Surface>

          <Surface className="p-4">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-base font-semibold text-text-1">最近访问</h3>
              <button type="button" className="text-xs text-text-3">
                查看更多
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3">
              {recentVisits.map((item, index) => (
                <button
                  key={`${item}-${index}`}
                  type="button"
                  className="flex flex-col items-center gap-2 rounded-md border border-line-1 px-2 py-4 text-center text-sm text-text-2 transition hover:border-brand-3 hover:bg-fill-1"
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-md bg-fill-1 text-brand-6">
                    <History size={18} />
                  </span>
                  {item}
                </button>
              ))}
            </div>
          </Surface>
        </div>

        <div className="space-y-4">
          <Surface className="p-4">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-text-1">一期核心链路</h2>
                <p className="mt-1 text-sm text-text-3">优先覆盖销售订单、库存查询、零售收银、收款登记与客户往来查询。</p>
              </div>
              <Button tone="primary" size="sm">
                进入演示
              </Button>
            </div>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              {dashboardFeatureCards.map((card) => (
                <article
                  key={card.title}
                  className="flex items-center gap-4 rounded-lg border border-line-1 px-4 py-4 transition hover:-translate-y-0.5 hover:border-brand-3 hover:shadow-soft"
                >
                  <span className={`h-10 w-1 rounded-sm ${card.accent}`} />
                  <div className="min-w-0">
                    <h3 className="text-sm font-semibold text-text-1">{card.title}</h3>
                    <p className="mt-1 text-xs text-text-3">{card.desc}</p>
                  </div>
                </article>
              ))}
            </div>
          </Surface>

          <Surface className="p-4">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-text-1">常用模块</h2>
                <p className="mt-1 text-sm text-text-3">保留一期核心入口，减少重复卡片和说明。</p>
              </div>
              <button type="button" className="text-sm text-text-3">
                全部模块
              </button>
            </div>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {dashboardTools.map((app, index) => (
                <article
                  key={`${app.title}-${index}`}
                  className={`rounded-lg bg-gradient-to-br ${app.color} p-4 transition hover:-translate-y-0.5 hover:shadow-soft`}
                >
                  <div className="flex items-start justify-between">
                    <span className={`flex h-12 w-12 items-center justify-center rounded-xl ${iconPalette[app.icon]}`}>
                      {index % 2 === 0 ? <ScanLine size={20} /> : <BriefcaseBusiness size={20} />}
                    </span>
                    <ArrowRight size={16} className="text-text-3" />
                  </div>
                  <h3 className="mt-8 text-lg font-semibold text-text-1">{app.title}</h3>
                  <p className="mt-2 text-[13px] leading-6 text-text-2">{app.desc}</p>
                </article>
              ))}
            </div>
          </Surface>
        </div>
      </div>
    </div>
  );
}
