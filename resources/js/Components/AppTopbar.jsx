export default function AppTopbar({ sessionLabel, profile }) {
  return (
    <header className="fixed top-0 left-72 right-0 h-16 bg-surface-container-lowest/90 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)] z-40 px-space-lg flex items-center justify-between">
      <div className="flex items-center gap-space-md">
        <div className="inline-flex items-center gap-2 px-space-sm py-1 rounded-full bg-surface-container font-label-sm text-label-sm text-on-surface-variant">
          <span className="w-2 h-2 rounded-full bg-tertiary-container"></span>
          <span>{sessionLabel}</span>
        </div>
      </div>

      <div className="flex items-center gap-space-md">
        <button
          aria-label="Notifications"
          className="relative w-9 h-9 rounded-lg flex items-center justify-center text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors"
          type="button"
        >
          <span className="material-symbols-outlined text-[20px]">notifications</span>
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-error"></span>
        </button>
        <div className="flex items-center gap-space-sm pl-space-xs">
          <div className="text-right hidden sm:block">
            <div className="font-label-lg text-label-lg text-on-surface leading-none">
              {profile.name}
            </div>
            <div className="font-body-sm text-body-sm text-secondary">{profile.description}</div>
          </div>
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
            <span className="material-symbols-outlined text-on-primary text-[18px]">person</span>
          </div>
        </div>
      </div>
    </header>
  );
}
