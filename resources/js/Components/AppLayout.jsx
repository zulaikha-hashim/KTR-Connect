import '../../css/AppLayout.css';
import AppSidebar from './AppSidebar';
import AppTopbar from './AppTopbar';

export default function AppLayout({ children, navigationSections, roles, profile, sessionLabel }) {
  return (
    <div className="app-layout bg-background font-body-md text-on-surface antialiased">
      <AppSidebar sections={navigationSections} />
      <div className="pl-72">
        <AppTopbar sessionLabel={sessionLabel} roles={roles} profile={profile} />
        <main className="relative pt-16 w-full px-gutter bg-background min-h-screen">
          {children}
        </main>
      </div>
    </div>
  );
}
