import {
  BarChart3,
  Bell,
  Boxes,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleHelp,
  Cog,
  Download,
  ExternalLink,
  Globe2,
  LogOut,
  Menu,
  MoonStar,
  Package,
  ReceiptText,
  Search,
  Settings2,
  ShoppingCart,
  Sparkles,
  Truck,
  UserRound,
  X,
  type LucideIcon,
} from "lucide-react";
import { type ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { type NavGroup, type ViewKey } from "../app/navigation";
import { cn } from "../utils/cn";

type ShellProps = {
  currentView: ViewKey;
  currentSectionLabel: string;
  currentPageLabel: string;
  currentDescription: string;
  navigationGroups: NavGroup[];
  onNavigate: (view: ViewKey) => void;
  children: ReactNode;
};

export function AppShell({
  currentView,
  currentSectionLabel,
  currentPageLabel,
  navigationGroups,
  onNavigate,
  children,
}: ShellProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [darkModeEnabled, setDarkModeEnabled] = useState(false);
  const [menuKeyword, setMenuKeyword] = useState("");
  const [isMenuSearchOpen, setIsMenuSearchOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(
      navigationGroups.map((group) => [group.id, group.children.some((item) => item.key === currentView)]),
    ),
  );
  const [activeCollapsedGroup, setActiveCollapsedGroup] = useState<string | null>(null);
  const profileRef = useRef<HTMLDivElement | null>(null);
  const searchRef = useRef<HTMLInputElement | null>(null);
  const searchWrapRef = useRef<HTMLLabelElement | null>(null);

  useEffect(() => {
    setIsSidebarOpen(false);
    setActiveCollapsedGroup(null);
    setIsMenuSearchOpen(false);
    setMenuKeyword("");
    setSelectedIndex(-1);
  }, [currentView]);

  useEffect(() => {
    setExpandedGroups((current) =>
      Object.fromEntries(
        navigationGroups.map((group) => [
          group.id,
          current[group.id] ?? group.children.some((item) => item.key === currentView),
        ]),
      ),
    );
  }, [currentView, navigationGroups]);

  useEffect(() => {
    if (!isProfileOpen) {
      return;
    }

    const handlePointerDown = (event: MouseEvent) => {
      if (!profileRef.current?.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsProfileOpen(false);
      }
    };

    window.addEventListener("mousedown", handlePointerDown);
    window.addEventListener("keydown", handleEscape);

    return () => {
      window.removeEventListener("mousedown", handlePointerDown);
      window.removeEventListener("keydown", handleEscape);
    };
  }, [isProfileOpen]);

  useEffect(() => {
    if (!toastMessage) {
      return;
    }

    const timer = window.setTimeout(() => {
      setToastMessage(null);
    }, 1800);

    return () => {
      window.clearTimeout(timer);
    };
  }, [toastMessage]);

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      if (!searchWrapRef.current?.contains(event.target as Node)) {
        setIsMenuSearchOpen(false);
      }
    };

    const handleSlashFocus = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const isTypingTarget =
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLSelectElement ||
        target?.isContentEditable;

      if (event.key === "/" && !isTypingTarget) {
        event.preventDefault();
        searchRef.current?.focus();
        setIsMenuSearchOpen(true);
      }

      if (event.key === "Escape") {
        setIsMenuSearchOpen(false);
      }
    };

    window.addEventListener("mousedown", handlePointerDown);
    window.addEventListener("keydown", handleSlashFocus);

    return () => {
      window.removeEventListener("mousedown", handlePointerDown);
      window.removeEventListener("keydown", handleSlashFocus);
    };
  }, []);

  const filteredMenuItems = useMemo(() => {
    const keyword = menuKeyword.trim().toLowerCase();
    const allItems = navigationGroups.flatMap((group) =>
      group.children.map((item) => ({
        key: item.key,
        label: item.label,
        description: item.description,
        groupLabel: group.label,
      })),
    );

    if (!keyword) {
      return allItems.slice(0, 8);
    }

    return allItems.filter((item) =>
      [item.label, item.description, item.groupLabel].some((value) => value.toLowerCase().includes(keyword)),
    );
  }, [menuKeyword, navigationGroups]);

  const handleMenuSelect = (view: ViewKey) => {
    onNavigate(view);
    setIsMenuSearchOpen(false);
    setMenuKeyword("");
  };

  const showComingSoonToast = () => {
    setToastMessage("功能尚未开发，敬请期待");
  };

  const groupIcons: Record<string, LucideIcon> = {
    dashboard: Package,
    "master-data": Package,
    sales: ShoppingCart,
    purchase: Truck,
    stock: Boxes,
    finance: ReceiptText,
    stats: BarChart3,
    settings: Cog,
  };

  const toggleGroup = (groupId: string) => {
    setExpandedGroups((current) => ({
      ...current,
      [groupId]: !current[groupId],
    }));
  };

  const sidebar = (
    <aside
      className={cn(
        "relative flex h-full flex-col border-r border-line-1 bg-white transition-[width]",
        isSidebarCollapsed ? "w-14" : "w-[200px]",
      )}
    >
      <nav className="flex-1 overflow-y-auto px-2 py-3">
        {navigationGroups.map((group) => {
          const inCurrentGroup = group.children.some((item) => item.key === currentView);
          const GroupIcon = groupIcons[group.id] ?? Package;
          const groupExpanded = expandedGroups[group.id] ?? true;
          const hasChildren = group.children.length > 1;
          const primaryChild = group.children[0];

          return (
            <div key={group.id} className="mb-3">
              {isSidebarCollapsed ? (
                <div className="relative">
                  <button
                    type="button"
                    title={group.label}
                    onClick={() =>
                      setActiveCollapsedGroup((current) => (current === group.id ? null : group.id))
                    }
                    className={cn(
                      "flex h-10 w-full items-center justify-center rounded-md transition",
                      inCurrentGroup
                        ? "bg-brand-1 text-brand-6"
                        : "text-text-2 hover:bg-fill-2",
                    )}
                  >
                    <GroupIcon size={18} />
                  </button>

                  {activeCollapsedGroup === group.id ? (
                    <div className="absolute left-14 top-0 z-20 w-56 overflow-hidden rounded-lg border border-line-2 bg-white shadow-dropdown">
                      <div className="border-b border-line-1 px-4 py-3 text-sm font-semibold text-text-1">
                        {group.label}
                      </div>
                      <div className="p-2">
                        {group.children.map((item) => {
                          const active = currentView === item.key;
                          return (
                            <button
                              key={item.key}
                              type="button"
                              onClick={() => onNavigate(item.key)}
                              className={cn(
                                "flex h-10 w-full items-center rounded-md px-3 text-left text-sm transition",
                                active
                                  ? "bg-brand-1 font-medium text-brand-6"
                                  : "text-text-2 hover:bg-fill-2",
                              )}
                            >
                              <span className="truncate">{item.label}</span>
                              {item.isIncomplete ? <SidebarBadge /> : null}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ) : null}
                </div>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      if (!hasChildren) {
                        onNavigate(primaryChild.key);
                        return;
                      }

                      toggleGroup(group.id);
                    }}
                    className={cn(
                      "flex h-[42px] w-full items-center justify-between rounded-md px-3 text-left text-sm transition",
                      inCurrentGroup
                        ? "font-medium text-brand-6"
                        : "text-text-2 hover:bg-fill-2",
                    )}
                  >
                    <span className="flex items-center gap-3">
                      <GroupIcon size={16} />
                      <span>{group.label}</span>
                    </span>
                    {hasChildren ? (
                      <span className="text-text-3">
                        {groupExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                      </span>
                    ) : null}
                  </button>
                  {groupExpanded ? (
                    <div className="mt-1 space-y-1">
                      {group.children.map((item, index) => {
                        const active = currentView === item.key;

                        if (!hasChildren && index > 0) {
                          return null;
                        }

                        return (
                          <button
                            key={item.key}
                            type="button"
                            onClick={() => onNavigate(item.key)}
                            className={cn(
                              hasChildren
                                ? "flex h-[42px] w-full items-center rounded-md pr-3 pl-9 text-left text-sm transition"
                                : "hidden",
                              active
                                ? "bg-brand-1 font-medium text-brand-6"
                                : "text-text-2 hover:bg-fill-2",
                            )}
                          >
                            <span className="truncate">{item.label}</span>
                            {item.isIncomplete ? <SidebarBadge /> : null}
                          </button>
                        );
                      })}
                    </div>
                  ) : null}
                </>
              )}
            </div>
          );
        })}
      </nav>
      <button
        type="button"
        onClick={() => {
          setIsSidebarCollapsed((current) => !current);
          setActiveCollapsedGroup(null);
        }}
        className={cn(
          "m-2 flex h-[42px] items-center rounded-md px-3 text-sm text-text-3 transition hover:bg-fill-2",
          isSidebarCollapsed ? "justify-center" : "gap-3",
        )}
      >
        {isSidebarCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        {isSidebarCollapsed ? null : "收起菜单"}
      </button>
    </aside>
  );

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-fill-2 text-text-1">
      <header className="relative z-50 flex h-[58px] items-center justify-between px-4 lg:px-5" style={{
        background: "linear-gradient(135deg, #1a4fc8 0%, var(--brand-6) 55%, #3a7fff 100%)",
        boxShadow: "0 1px 0 rgba(255,255,255,0.1), 0 4px 20px rgba(22,93,255,0.35)",
      }}>
        {/* Noise texture overlay */}
        <div className="pointer-events-none absolute inset-0 opacity-[0.035]" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E")`,
          backgroundSize: "180px",
        }} />

        {/* Bottom glow line */}
        <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-px" style={{
          background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.25) 30%, rgba(255,255,255,0.25) 70%, transparent 100%)",
        }} />

        <div className="relative flex items-center gap-3 lg:gap-8">
          <button
            type="button"
            onClick={() => setIsSidebarOpen(true)}
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 text-white/80 transition hover:bg-white/20 lg:hidden"
          >
            <Menu size={16} />
          </button>

          {/* Logo area */}
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/15 backdrop-blur-sm ring-1 ring-white/20">
              <Package size={16} className="text-white" />
            </div>
            <div className="flex flex-col leading-none">
              <span className="text-[15px] font-semibold tracking-wide text-white">强盛进销存</span>
              <span className="mt-0.5 text-[10px] font-medium text-white/40 tracking-widest uppercase">Qiangsheng JXC</span>
            </div>
          </div>

          {/* Search bar */}
          <label
            ref={searchWrapRef}
            className="relative hidden h-8 w-[220px] items-center gap-2 rounded-lg border border-white/15 bg-white/8 px-3 text-sm text-white/70 backdrop-blur-sm transition-colors focus-within:border-white/30 focus-within:bg-white/12 md:flex"
          >
            <Search size={13} className="shrink-0 text-white/50" />
            <input
              ref={searchRef}
              value={menuKeyword}
              onFocus={() => { setIsMenuSearchOpen(true); setSelectedIndex(-1); }}
              onChange={(event) => {
                setMenuKeyword(event.target.value);
                setIsMenuSearchOpen(true);
                setSelectedIndex(-1);
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  const idx = selectedIndex >= 0 ? selectedIndex : 0;
                  if (filteredMenuItems[idx]) {
                    handleMenuSelect(filteredMenuItems[idx].key);
                  }
                }
                if (event.key === "ArrowDown") {
                  event.preventDefault();
                  setSelectedIndex((i) => Math.min(i + 1, filteredMenuItems.length - 1));
                }
                if (event.key === "ArrowUp") {
                  event.preventDefault();
                  setSelectedIndex((i) => Math.max(i - 1, -1));
                }
              }}
              placeholder="搜索菜单，快捷键 /"
              className="w-full bg-transparent outline-none placeholder:text-white/40"
            />

            {isMenuSearchOpen ? (
              <div className="absolute left-0 top-[calc(100%+8px)] z-20 w-full overflow-hidden rounded-xl border border-line-2 bg-white text-text-2 shadow-dropdown">
                <div className="border-b border-line-1 px-3 py-2 text-[12px] text-text-3">
                  {menuKeyword.trim() ? `搜索结果 ${filteredMenuItems.length} 项` : "常用菜单"}
                </div>
                <div className="max-h-[320px] overflow-auto py-1">
                  {filteredMenuItems.length === 0 ? (
                    <div className="px-3 py-8 text-center text-[13px] text-text-3">未找到匹配菜单</div>
                  ) : (
                    filteredMenuItems.map((item, idx) => (
                      <button
                        key={item.key}
                        type="button"
                        onClick={() => handleMenuSelect(item.key)}
                        className={cn(
                          "flex w-full items-start gap-3 px-3 py-2.5 text-left transition",
                          selectedIndex === idx
                            ? "bg-brand-1 text-brand-6"
                            : "hover:bg-fill-2",
                        )}
                      >
                        <Search size={14} className="mt-0.5 shrink-0 text-text-3" />
                        <div className="min-w-0">
                          <div className="text-[13px] font-medium text-text-1">{item.label}</div>
                          <div className="mt-0.5 text-[12px] text-text-3">
                            {item.groupLabel} / {item.description}
                          </div>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>
            ) : null}
          </label>
        </div>
        <div className="relative flex items-center gap-1.5 text-white/80 lg:gap-2">
          <button
            type="button"
            onClick={showComingSoonToast}
            className="hidden h-8 items-center gap-2 rounded-lg px-3 text-xs font-medium text-white/80 transition hover:bg-white/10 sm:flex"
          >
            <Download size={14} />
            下载
          </button>
          <button
            type="button"
            onClick={showComingSoonToast}
            className="relative flex h-8 w-8 items-center justify-center rounded-lg text-white/80 transition hover:bg-white/10"
          >
            <Bell size={15} />
            <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-400 ring-1 ring-white/20" />
          </button>
          <button
            type="button"
            onClick={showComingSoonToast}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-white/80 transition hover:bg-white/10"
            title="AI对话"
          >
            <Sparkles size={15} />
          </button>
          <div className="hidden h-5 w-px bg-white/15 sm:block" />
          <div className="relative" ref={profileRef}>
            <button
              type="button"
              onClick={() => setIsProfileOpen((current) => !current)}
              className="flex h-8 items-center gap-2 rounded-lg px-1.5 py-0.5 transition hover:bg-white/10"
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/15 text-[12px] font-semibold text-white ring-1 ring-white/20">
                维
              </span>
              <span className="hidden text-xs font-medium text-white/90 lg:block">维他命</span>
              <ChevronDown size={12} className="hidden text-white/50 lg:block" />
            </button>

            {isProfileOpen ? (
              <div className="absolute right-0 top-11 z-20 w-[260px] overflow-hidden rounded-lg border border-line-2 bg-white text-text-2 shadow-dropdown">
                <div className="border-b border-line-1 px-4 py-4">
                  <div className="flex items-start gap-3">
                    <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#ffcf8b] text-[15px] font-semibold text-[#7a2f00]">
                      维
                    </span>
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-text-1">维他命</div>
                      <div className="mt-1 text-xs text-text-3">Wechat：vitamin_mpp</div>
                      <div className="mt-1 flex items-center gap-1 text-[12px] text-success">
                        <span className="h-1.5 w-1.5 rounded-full bg-success" />
                        在线
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="mt-4 flex h-8 w-full items-center justify-center rounded-md bg-brand-6 text-[13px] font-medium text-white transition hover:bg-brand-7"
                  >
                    升级
                  </button>
                </div>

                <div className="border-b border-line-1 py-1">
                  <ProfileMenuItem icon={<UserRound size={16} />} label="个人中心" active />
                  <ProfileMenuItem icon={<CircleHelp size={16} />} label="帮助中心" />
                  <ProfileMenuItem icon={<Globe2 size={16} />} label="系统语言" />
                </div>

                <div className="border-b border-line-1 px-4 py-3">
                  <div className="flex items-center justify-between text-[13px] text-text-2">
                    <span className="flex items-center gap-2">
                      <MoonStar size={16} />
                      暗黑模式
                    </span>
                    <button
                      type="button"
                      onClick={() => setDarkModeEnabled((current) => !current)}
                      className={cn("relative h-6 w-10 rounded-full transition", darkModeEnabled ? "bg-brand-6" : "bg-fill-3")}
                    >
                      <span
                        className={cn(
                          "absolute top-1 h-4 w-4 rounded-full bg-white transition",
                          darkModeEnabled ? "left-5" : "left-1",
                        )}
                      />
                    </button>
                  </div>
                </div>

                <div className="border-b border-line-1 px-4 py-3">
                  <button type="button" className="flex w-full items-center justify-between text-left">
                    <span className="text-[13px] font-medium text-text-1">仓库配置完整度</span>
                    <ChevronRight size={14} className="text-text-3" />
                  </button>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-fill-3">
                    <div className="h-full w-[70%] rounded-full bg-brand-6" />
                  </div>
                  <div className="mt-1 text-right text-[12px] text-text-3">70%</div>
                </div>

                <div className="py-1">
                  <ProfileMenuItem icon={<Settings2 size={16} />} label="设置" />
                  <ProfileMenuItem icon={<ExternalLink size={16} />} label="管理后台" />
                  <ProfileMenuItem icon={<LogOut size={16} />} label="退出" danger />
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </header>
      {toastMessage ? (
        <div className="pointer-events-none fixed right-5 top-16 z-[120] rounded-lg bg-[rgba(29,33,41,0.92)] px-4 py-2.5 text-[13px] text-white shadow-dropdown">
          {toastMessage}
        </div>
      ) : null}
      <div className="flex min-h-0 flex-1 overflow-hidden">
        <div className="hidden lg:block">{sidebar}</div>

        {isSidebarOpen ? (
          <div className="fixed inset-0 z-30 bg-black/35 lg:hidden" onClick={() => setIsSidebarOpen(false)}>
            <div className="h-full w-[200px] bg-white shadow-2xl" onClick={(event) => event.stopPropagation()}>
              <div className="flex h-[54px] items-center justify-between border-b border-line-1 px-4">
                <span className="text-sm font-semibold text-text-1">导航菜单</span>
                <button
                  type="button"
                  onClick={() => setIsSidebarOpen(false)}
                  className="flex h-8 w-8 items-center justify-center rounded-md bg-fill-1 text-text-2"
                >
                  <X size={16} />
                </button>
              </div>
              {sidebar}
            </div>
          </div>
        ) : null}

        <main className="min-h-0 flex flex-1 flex-col overflow-hidden p-3 sm:p-4 lg:p-5">
          <div className="flex-none px-1 pb-3 text-[13px] text-text-3">
            {currentSectionLabel} / <span className="font-medium text-text-2">{currentPageLabel}</span>
          </div>
          <div className="min-h-0 flex-1 overflow-auto rounded-lg bg-white p-4 shadow-panel sm:p-5 lg:rounded-xl lg:p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

function SidebarBadge() {
  return (
    <span className="ml-auto shrink-0 rounded-md bg-[rgba(255,125,0,0.12)] px-1.5 py-0.5 text-[11px] leading-4 text-warning">
      未完善
    </span>
  );
}

function ProfileMenuItem({
  icon,
  label,
  active,
  danger,
}: {
  icon: ReactNode;
  label: string;
  active?: boolean;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      className={cn(
        "flex h-10 w-full items-center justify-between px-4 text-[13px] transition hover:bg-fill-2",
        active ? "bg-brand-1 text-brand-6" : danger ? "text-danger" : "text-text-2",
      )}
    >
      <span className="flex items-center gap-2">
        {icon}
        {label}
      </span>
      {!danger && !active ? <ChevronRight size={14} className="text-text-3" /> : null}
    </button>
  );
}
