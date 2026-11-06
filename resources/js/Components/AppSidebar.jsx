export default function AppSidebar({ sections }) {
  return (
    <aside className="fixed left-0 top-0 h-full w-72 bg-surface-container-lowest z-50 flex flex-col shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
      <div className="h-16 flex items-center gap-3 px-space-lg bg-surface-container-lowest">
        <div className="w-10 h-10 rounded-lg bg-primary-container flex items-center justify-center text-on-primary shadow-sm">
          <span className="material-symbols-outlined text-[24px]">school</span>
        </div>
        <div className="flex flex-col">
          <span className="font-headline-sm text-headline-sm text-primary leading-tight">
            Kolej Tun Razak
          </span>
          <span className="font-label-sm text-label-sm text-secondary uppercase tracking-wider">
            UTM Residensi &amp; Merit
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-space-md py-space-md space-y-space-md">
        {sections.map((section) => (
          <div className="space-y-space-xs pt-space-xs" key={section.title}>
            <p className="px-space-sm font-label-sm text-label-sm text-secondary uppercase tracking-wider">
              {section.title}
            </p>
            <nav className="space-y-1">
              {section.items.map((item) => (
                <a
                  aria-current={item.active ? 'page' : undefined}
                  className={`flex items-center gap-3 px-space-sm py-2.5 rounded-lg transition-all ${
                    item.active
                      ? 'bg-primary-container text-on-primary font-label-lg shadow-sm'
                      : 'font-body-md text-body-md text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'
                  }`}
                  data-path={item.path}
                  href={item.href}
                  key={item.label}
                >
                  <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
                  <span>{item.label}</span>
                </a>
              ))}
            </nav>
          </div>
        ))}
      </div>

      <div className="p-space-md bg-surface-container-low">
        <div className="flex items-center justify-between text-on-surface-variant">
          <span className="font-label-sm text-label-sm">UTM Skudai Campus</span>
          <span className="font-code text-code text-secondary">v2.6.4</span>
        </div>
      </div>
    </aside>
  );
}
