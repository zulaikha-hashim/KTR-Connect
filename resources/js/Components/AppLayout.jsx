import { usePage } from '@inertiajs/react';
import '../../css/AppLayout.css';
import AppSidebar from './AppSidebar';
import AppTopbar from './AppTopbar';

const sharedNavigation = [
  {
    title: 'Student Resident',
    items: [
      {
        label: 'Merit & Room Eligibility',
        icon: 'verified',
        path: 'student-merit-and-room-eligibility',
        href: '#',
      },
      {
        label: 'Activity Directory & Details',
        icon: 'event_available',
        path: 'student-activity-directory',
        href: '#',
      },
    ],
  },
  {
    title: 'Felo & Staff Operations',
    items: [
      {
        label: 'Manage Activities & Paperwork',
        icon: 'post_add',
        path: 'manage-activities-and-proposals',
        href: '/',
      },
      {
        label: 'Upload Student Data (CSV)',
        icon: 'upload_file',
        path: 'upload-student-data',
        href: '/admin/students/upload',
      },
      {
        label: 'Merit Status Reports',
        icon: 'summarize',
        path: 'staff-merit-analytics-reports',
        href: '#',
      },
    ],
  },
  {
    title: 'Collegiate Administration',
    items: [
      {
        label: 'Admin Analytics Dashboard',
        icon: 'dashboard',
        path: 'collegiate-admin-dashboard',
        href: '#',
      },
      {
        label: 'Activity Review & Approvals',
        icon: 'fact_check',
        path: 'activity-reviews-and-approvals',
        href: '/admin',
      },
      {
        label: 'Update Chatbot Information',
        icon: 'smart_toy',
        path: 'update-chatbot-information',
        href: '/admin?modal=chatbot',
      },
      {
        label: 'Support & External Links',
        icon: 'link',
        path: 'admin-support',
        href: '/admin/support',
      },
    ],
  },
  {
    title: 'Hostel Management',
    items: [
      {
        label: 'Room Inventory',
        icon: 'meeting_room',
        path: 'admin-hostel-rooms',
        href: '/admin/hostel/rooms',
      },
      {
        label: 'Activity History',
        icon: 'history',
        path: 'admin-hostel-activity-history',
        href: '/admin/hostel/activity-history',
      },
    ],
  },
];

export default function AppLayout({
  children,
  profile,
  sessionLabel,
}) {
  const { url } = usePage();
  const currentPath = url.split(/[?#]/)[0];
  const currentQuery = url.split('?')[1]?.split('#')[0] ?? '';

  const navigation = mergeNavigation(navigationSections);
  const matchingItems = navigation.flatMap((section) =>
    section.items.filter((item) => {
      if (typeof item.href !== 'string' || !item.href.startsWith('/')) {
        return false;
      }

      const [path, query = ''] = item.href.split('?');
      return path === currentPath && query.split('#')[0] === currentQuery;
    })
  );
  const activeItem =
    matchingItems.find((item) => item.active) ?? matchingItems[0];

  const sections = navigation.map(
    (section) => ({
      ...section,
      items: section.items.map((item) => ({
        ...item,
        active: item === activeItem,
      })),
    })
  );

  return (
    <div className="app-layout bg-background font-body-md text-on-surface antialiased">
      <AppSidebar sections={sections} />

      <div className="flex min-h-screen flex-col pl-72">
        <AppTopbar
          sessionLabel={sessionLabel}
          profile={profile}
        />

        <main className="relative w-full flex-1 bg-background px-gutter pt-16">
          {children}
        </main>

        <footer className="border-t border-surface-container bg-surface-container-lowest px-gutter py-space-md">
          <div className="flex flex-col items-center justify-between gap-space-xs font-body-sm text-body-sm text-secondary sm:flex-row">
            <p>© {new Date().getFullYear()} Kolej Tun Razak, Universiti Teknologi Malaysia.</p>
            <p>UTM Skudai Campus</p>
          </div>
        </footer>
      </div>
    </div>
  );
}