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
        label: 'Manage Activities',
        icon: 'post_add',
        path: 'manage-activities-and-proposals',
        href: '/',
      },
      {
        label: 'Record Participation (CSV/Excel)',
        icon: 'upload_file',
        path: 'record-participation-upload',
        href: '#',
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
        label: 'Activity Review & Approvals',
        icon: 'fact_check',
        path: 'activity-reviews-and-approvals',
        href: '/admin',
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

function mergeNavigation(pageSections) {
  const merged = [];
  const existingItems = new Map();

  for (const section of [...sharedNavigation, ...pageSections]) {
    let group = merged.find(
      (item) => item.title === section.title
    );

    if (!group) {
      group = {
        title: section.title,
        items: [],
      };

      merged.push(group);
    }

    for (const item of section.items) {
      const key = item.path || item.label;

      if (existingItems.has(key)) {
        // Keep page-specific link details without duplicating the item.
        Object.assign(existingItems.get(key), item);
      } else {
        const copy = { ...item };

        group.items.push(copy);
        existingItems.set(key, copy);
      }
    }
  }

  return merged.filter((section) => section.items.length > 0);
}

export default function AppLayout({
  children,
  navigationSections = [],
  profile,
  sessionLabel,
}) {
  const { url } = usePage();
  const currentPath = url.split(/[?#]/)[0];

  const sections = mergeNavigation(navigationSections).map(
    (section) => ({
      ...section,
      items: section.items.map((item) => ({
        ...item,
        active:
          typeof item.href === 'string'
          && item.href.startsWith('/')
          && item.href.split(/[?#]/)[0] === currentPath,
      })),
    })
  );

  return (
    <div className="app-layout bg-background font-body-md text-on-surface antialiased">
      <AppSidebar sections={sections} />

      <div className="pl-72">
        <AppTopbar
          sessionLabel={sessionLabel}
          profile={profile}
        />

        <main className="relative pt-16 w-full px-gutter bg-background min-h-screen">
          {children}
        </main>
      </div>
    </div>
  );
}