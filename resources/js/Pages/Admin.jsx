import { useEffect, useMemo, useState } from 'react';
import AppLayout from '../Components/AppLayout';

const adminNavigation = [
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
        label: 'Manage Activities & Proposal',
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
        active: true,
      },
    ],
  },
];

const adminRoles = [
  { label: 'Student: M. Afiq' },
  { label: 'Felo: Dr. Kamil' },
  { label: 'Admin: En. Razak', active: true },
];

const adminProfile = {
  name: 'En. Razak',
  description: 'Collegiate Administrator',
};

const initialApplications = [
  {
    id: 'ACT-2026-088',
    title: 'Inter-Block Esports & Cultural Night 2026',
    description:
      'Residential block competition uniting blocks TR-A through TR-F with cultural showcases, an MLBB tournament, and communal fellowship banquet.',
    submitted: '18 Feb 2026',
    dates: '14 – 15 Mar 2026',
    turnout: 300,
    redMerit: '2 Red (Comm)',
    blueMerit: '1 Blue (Part)',
    submitter: 'Dr. Ahmad Kamil',
    role: 'Senior Residential Fellow',
    phone: '+60 19-712 4490',
    status: 'pending',
    icon: 'stadia_controller',
  },
  {
    id: 'ACT-2026-094',
    title: 'Inter-Block Futsal Championship',
    description:
      'A two-day inter-block tournament to promote teamwork and active living among residential college students.',
    submitted: '20 Feb 2026',
    dates: '25 – 27 Nov 2026',
    turnout: 180,
    redMerit: '2 Red (Comm)',
    blueMerit: '1 Blue (Player)',
    submitter: 'Dr. Farah Nadia',
    role: 'Residential Fellow',
    phone: '+60 12-882 1044',
    status: 'pending',
    icon: 'sports_soccer',
  },
  {
    id: 'ACT-2026-102',
    title: 'Block TR-D Annual Iftar & Community Outreach',
    description:
      'A community iftar bringing residents together with a meal service and outreach activities for the local community.',
    submitted: '22 Feb 2026',
    dates: '28 Mar 2026',
    turnout: 240,
    redMerit: '2 Red (Exco)',
    blueMerit: '1 Blue (Audience)',
    submitter: 'Ustaz Zulkifli',
    role: 'Residential Fellow',
    phone: '+60 13-440 8862',
    status: 'pending',
    icon: 'diversity_3',
  },
];

function Icon({ children, className = '' }) {
  return <span className={`material-symbols-outlined ${className}`}>{children}</span>;
}

export default function Admin() {
  const [applications, setApplications] = useState(initialApplications);
  const [selectedId, setSelectedId] = useState(initialApplications[0].id);
  const [activeFilter, setActiveFilter] = useState('pending');
  const [search, setSearch] = useState('');
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [toast, setToast] = useState(null);
  const [page, setPage] = useState(1);
  const [zoom, setZoom] = useState(100);

  const selectedApplication = applications.find(({ id }) => id === selectedId);
  const pendingCount = applications.filter(({ status }) => status === 'pending').length;
  const approvedCount = applications.filter(({ status }) => status === 'approved').length;
  const rejectedCount = applications.filter(({ status }) => status === 'rejected').length;

  const visibleApplications = useMemo(() => {
    const query = search.trim().toLowerCase();

    return applications.filter((application) => {
      const matchesStatus =
        activeFilter === 'all' ||
        (activeFilter === 'pending' && application.status === 'pending') ||
        (activeFilter === 'high-turnout' && application.turnout > 200);
      const matchesSearch =
        !query ||
        `${application.id} ${application.title} ${application.submitter}`
          .toLowerCase()
          .includes(query);

      return matchesStatus && matchesSearch;
    });
  }, [activeFilter, applications, search]);

  useEffect(() => {
    document.body.style.overflow = isRejectModalOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [isRejectModalOpen]);

  useEffect(() => {
    if (!toast) return undefined;

    const timeout = window.setTimeout(() => setToast(null), 5500);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  useEffect(() => {
    if (!isRejectModalOpen) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') setIsRejectModalOpen(false);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isRejectModalOpen]);

  const updateApplicationStatus = (status) => {
    if (!selectedApplication) return;

    setApplications((current) =>
      current.map((application) =>
        application.id === selectedApplication.id ? { ...application, status } : application,
      ),
    );
    setActiveFilter('all');
    setToast({
      status,
      title: `Application ${selectedApplication.id} ${status}`,
      message:
        status === 'approved'
          ? 'The proposal has been approved and the submitter has been notified.'
          : `The proposal decision and your remarks have been recorded for ${selectedApplication.submitter}.`,
    });
  };

  const handleReject = (event) => {
    event.preventDefault();
    if (rejectionReason.trim().length < 20 || rejectionReason.trim().length > 400) return;

    updateApplicationStatus('rejected');
    setIsRejectModalOpen(false);
    setRejectionReason('');
  };

  return (
    <AppLayout
      navigationSections={adminNavigation}
      roles={adminRoles}
      profile={adminProfile}
      sessionLabel="Academic Session: Sem 1, 2026/2027"
    >
      <div className="mx-auto w-full max-w-[1800px] pb-space-xl">
        {toast && (
          <div
            aria-live="polite"
            className={`mb-space-md flex items-start justify-between gap-space-md rounded-xl p-space-md text-on-tertiary shadow-md ${
              toast.status === 'rejected' ? 'bg-error text-on-error' : 'bg-tertiary text-on-tertiary'
            }`}
            role="status"
          >
            <div className="flex items-start gap-space-sm">
              <Icon className="text-[20px]">check_circle</Icon>
              <div>
                <p className="font-label-lg text-label-lg">{toast.title}</p>
                <p className="font-body-sm text-body-sm opacity-90">{toast.message}</p>
              </div>
            </div>
            <button
              aria-label="Dismiss notification"
              className="rounded-lg p-1 hover:bg-white/10"
              onClick={() => setToast(null)}
              type="button"
            >
              <Icon className="text-[18px]">close</Icon>
            </button>
          </div>
        )}

        <section className="flex flex-col justify-between gap-space-md border-b border-surface-container pb-space-md pt-space-lg xl:flex-row xl:items-center">
          <div>
            <div className="mb-1 flex flex-wrap items-center gap-2">
              <span className="font-label-sm text-label-sm font-semibold uppercase tracking-wider text-primary">
                Residential Collegiate Administration • UC-M008 / US 4.9
              </span>
              <span className="rounded-full bg-surface-container-high px-2 py-0.5 font-code text-code text-on-surface-variant">
                Session 26/27
              </span>
            </div>
            <h1 className="font-headline-lg text-headline-lg font-bold tracking-tight text-on-surface">
              Merit Activity Applications &amp; Approvals
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-2 rounded-lg bg-surface-container-lowest px-3 py-1.5 text-on-surface shadow-sm">
              <span className="font-label-md text-label-md text-secondary">Total Proposals</span>
              <span className="font-headline-sm text-headline-sm font-bold">48</span>
            </div>
            <div className="flex items-center gap-2 rounded-lg bg-amber-50 px-3 py-1.5 text-amber-900 shadow-sm">
              <span className="h-2 w-2 animate-pulse rounded-full bg-amber-600" />
              <span className="font-label-md text-label-md font-semibold">Pending Review</span>
              <span className="font-headline-sm text-headline-sm font-bold">{pendingCount}</span>
            </div>
            <div className="flex items-center gap-2 rounded-lg bg-surface-container-lowest px-3 py-1.5 shadow-sm">
              <span className="h-2 w-2 rounded-full bg-tertiary-container" />
              <span className="font-label-md text-label-md text-secondary">Approved</span>
              <span className="font-headline-sm text-headline-sm font-bold text-tertiary-container">
                {41 + approvedCount}
              </span>
            </div>
            <div className="flex items-center gap-2 rounded-lg bg-surface-container-lowest px-3 py-1.5 shadow-sm">
              <span className="h-2 w-2 rounded-full bg-error" />
              <span className="font-label-md text-label-md text-secondary">Rejected</span>
              <span className="font-headline-sm text-headline-sm font-bold text-error">
                {4 + rejectedCount}
              </span>
            </div>
          </div>
        </section>

        <div className="grid items-start gap-space-md pt-space-md lg:grid-cols-[minmax(300px,0.62fr)_minmax(0,1fr)]">
          <aside className="flex min-w-0 flex-col gap-space-md">
            <section className="space-y-space-sm rounded-xl bg-surface-container-lowest p-space-md shadow-sm">
              <div className="flex items-center justify-between gap-2">
                <h2 className="font-headline-sm text-headline-sm text-on-surface">
                  Queue &amp; Submissions
                </h2>
                <span className="font-label-sm text-label-sm font-semibold uppercase text-secondary">
                  {pendingCount} actions needed
                </span>
              </div>
              <label className="relative block">
                <Icon className="absolute left-3 top-2.5 text-[20px] text-secondary">search</Icon>
                <input
                  className="w-full rounded-lg bg-surface-container-low py-2 pl-10 pr-3 font-body-md text-body-md text-on-surface placeholder:text-secondary/70 focus:outline-none focus:ring-2 focus:ring-primary/20"
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search ID, title, or fellow..."
                  type="search"
                  value={search}
                />
              </label>
              <div aria-label="Filter applications" className="flex gap-1.5 overflow-x-auto pb-1">
                {[
                  { id: 'pending', label: `Pending (${pendingCount})` },
                  { id: 'all', label: 'All programs' },
                  { id: 'high-turnout', label: 'High turnout (>200)' },
                ].map((filter) => (
                  <button
                    aria-pressed={activeFilter === filter.id}
                    className={`shrink-0 rounded-full px-3 py-1 font-label-sm text-label-sm transition-colors ${
                      activeFilter === filter.id
                        ? 'bg-primary-container font-semibold text-on-primary'
                        : 'bg-surface-container-low text-secondary hover:text-on-surface'
                    }`}
                    key={filter.id}
                    onClick={() => setActiveFilter(filter.id)}
                    type="button"
                  >
                    {filter.label}
                  </button>
                ))}
              </div>
            </section>

            <div className="flex flex-col gap-space-sm">
              {visibleApplications.map((application) => {
                const isSelected = application.id === selectedId;

                return (
                  <button
                    aria-pressed={isSelected}
                    className={`relative w-full rounded-xl bg-surface-container-lowest p-space-md text-left shadow-sm transition-all hover:shadow-md ${
                      isSelected ? 'ring-2 ring-primary' : 'ring-1 ring-transparent'
                    }`}
                    key={application.id}
                    onClick={() => {
                      setSelectedId(application.id);
                      setPage(1);
                    }}
                    type="button"
                  >
                    {isSelected && (
                      <span className="absolute -left-0.5 top-4 bottom-4 w-1 rounded-r-full bg-primary-container" />
                    )}
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <span className="rounded bg-surface-container-high px-2 py-0.5 font-code text-code font-semibold text-on-surface-variant">
                        {application.id}
                      </span>
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 font-label-sm text-label-sm font-semibold ${
                          application.status === 'pending'
                            ? 'bg-amber-100 text-amber-900'
                            : application.status === 'approved'
                              ? 'bg-tertiary-fixed text-tertiary'
                              : 'bg-error-container text-on-error-container'
                        }`}
                      >
                        <span className="h-1.5 w-1.5 rounded-full bg-current" />
                        {application.status === 'pending'
                          ? 'Awaiting Review'
                          : application.status === 'approved'
                            ? 'Approved'
                            : 'Rejected'}
                      </span>
                    </div>
                    <h3 className="mb-1 font-headline-sm text-headline-sm font-bold leading-snug text-on-surface">
                      {application.title}
                    </h3>
                    <p className="mb-3 line-clamp-2 font-body-sm text-body-sm text-on-surface-variant">
                      {application.description}
                    </p>
                    <div className="mb-3 grid grid-cols-2 gap-2 rounded-lg bg-surface-container-low p-3">
                      <div>
                        <span className="block font-label-sm text-label-sm text-secondary">
                          Submitted
                        </span>
                        <span className="font-body-md text-body-md font-medium text-on-surface">
                          {application.submitted}
                        </span>
                      </div>
                      <div>
                        <span className="block font-label-sm text-label-sm text-secondary">
                          Proposed dates
                        </span>
                        <span className="font-body-md text-body-md font-medium text-on-surface">
                          {application.dates}
                        </span>
                      </div>
                      <div>
                        <span className="block font-label-sm text-label-sm text-secondary">
                          Expected turnout
                        </span>
                        <span className="flex items-center gap-1 font-body-md text-body-md font-semibold text-on-surface">
                          <Icon className="text-[16px] text-primary">groups</Icon>
                          {application.turnout} students
                        </span>
                      </div>
                      <div>
                        <span className="block font-label-sm text-label-sm text-secondary">
                          Proposed merit points
                        </span>
                        <div className="mt-0.5 flex flex-wrap gap-1">
                          <span className="rounded bg-rose-100 px-1.5 py-0.5 text-[11px] font-semibold text-rose-800">
                            {application.redMerit}
                          </span>
                          <span className="rounded bg-sky-100 px-1.5 py-0.5 text-[11px] font-semibold text-sky-800">
                            {application.blueMerit}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary-container text-xs font-bold text-on-primary">
                        {application.submitter
                          .split(' ')
                          .slice(0, 2)
                          .map((name) => name[0])
                          .join('')}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block font-label-md text-label-md font-semibold leading-tight text-on-surface">
                          {application.submitter}
                        </span>
                        <span className="block truncate font-body-sm text-body-sm text-secondary">
                          {application.role} • {application.phone}
                        </span>
                      </span>
                      <Icon className="text-[20px] text-primary">chevron_right</Icon>
                    </div>
                  </button>
                );
              })}
              {visibleApplications.length === 0 && (
                <div className="rounded-xl bg-surface-container-lowest p-space-lg text-center shadow-sm">
                  <Icon className="mb-2 text-[28px] text-secondary">search_off</Icon>
                  <p className="font-label-md text-label-md text-on-surface">No applications found</p>
                  <p className="font-body-sm text-body-sm text-secondary">
                    Try another search or queue filter.
                  </p>
                </div>
              )}
            </div>
          </aside>

          {selectedApplication ? (
            <section aria-label="Selected application review" className="flex min-w-0 flex-col gap-space-md">
              <div className="flex flex-col justify-between gap-space-sm rounded-xl bg-surface-container-lowest p-space-md shadow-sm sm:flex-row sm:items-center">
                <div className="min-w-0">
                  <div className="mb-1 flex flex-wrap items-center gap-2">
                    <span className="font-label-sm text-label-sm font-bold uppercase text-secondary">
                      Document review workspace
                    </span>
                    <span className="rounded bg-surface-container px-2 py-0.5 font-code text-code">
                      PDF / 8 pages
                    </span>
                  </div>
                  <h2 className="truncate font-headline-sm text-headline-sm font-bold text-on-surface">
                    {selectedApplication.title}.pdf
                  </h2>
                </div>
                {selectedApplication.status === 'pending' ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      className="flex items-center gap-1.5 rounded-lg bg-surface-container-lowest px-3 py-2 font-label-md text-label-md text-error shadow-sm ring-1 ring-error/30 transition-colors hover:bg-error-container"
                      onClick={() => setIsRejectModalOpen(true)}
                      type="button"
                    >
                      <Icon className="text-[18px]">close</Icon>
                      Reject
                    </button>
                    <button
                      className="flex items-center gap-2 rounded-lg bg-tertiary-container px-4 py-2 font-label-md text-label-md text-on-tertiary shadow-md transition-all hover:bg-tertiary hover:shadow-lg active:scale-[0.98]"
                      onClick={() => updateApplicationStatus('approved')}
                      type="button"
                    >
                      <Icon className="text-[20px]">task_alt</Icon>
                      Approve application
                    </button>
                  </div>
                ) : (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-container px-3 py-1.5 font-label-md text-label-md font-semibold capitalize text-secondary">
                    <Icon className="text-[18px]">
                      {selectedApplication.status === 'approved' ? 'verified' : 'cancel'}
                    </Icon>
                    {selectedApplication.status}
                  </span>
                )}
              </div>

              <div className="overflow-hidden rounded-xl bg-surface-container shadow-md">
                <div className="flex flex-wrap items-center justify-between gap-2 bg-inverse-surface px-4 py-2.5 text-inverse-on-surface">
                  <div className="flex items-center gap-2">
                    <Icon className="text-[20px] text-inverse-primary">picture_as_pdf</Icon>
                    <span className="font-label-md text-label-md font-semibold tracking-wide">
                      KTR_PROPOSAL_{selectedApplication.id}.pdf
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 rounded-md bg-white/10 px-2 py-1 font-code text-code">
                      <button
                        aria-label="Previous page"
                        className="disabled:opacity-40"
                        disabled={page === 1}
                        onClick={() => setPage((current) => Math.max(1, current - 1))}
                        type="button"
                      >
                        <Icon className="text-[16px]">chevron_left</Icon>
                      </button>
                      <span>Page {page} of 8</span>
                      <button
                        aria-label="Next page"
                        className="disabled:opacity-40"
                        disabled={page === 8}
                        onClick={() => setPage((current) => Math.min(8, current + 1))}
                        type="button"
                      >
                        <Icon className="text-[16px]">chevron_right</Icon>
                      </button>
                    </div>
                    <span className="hidden h-4 w-px bg-white/20 sm:block" />
                    <button
                      aria-label="Zoom out"
                      className="rounded p-1 hover:bg-white/10 disabled:opacity-40"
                      disabled={zoom <= 75}
                      onClick={() => setZoom((current) => Math.max(75, current - 25))}
                      type="button"
                    >
                      <Icon className="text-[16px]">zoom_out</Icon>
                    </button>
                    <span className="min-w-10 text-center font-code text-code">{zoom}%</span>
                    <button
                      aria-label="Zoom in"
                      className="rounded p-1 hover:bg-white/10 disabled:opacity-40"
                      disabled={zoom >= 125}
                      onClick={() => setZoom((current) => Math.min(125, current + 25))}
                      type="button"
                    >
                      <Icon className="text-[16px]">zoom_in</Icon>
                    </button>
                  </div>
                </div>

                <div className="flex max-h-[min(72vh,900px)] justify-center overflow-y-auto bg-surface-container-high/50 p-space-md sm:p-space-lg">
                  <article
                    className="relative min-h-[680px] w-full max-w-3xl origin-top rounded-lg bg-surface-container-lowest p-space-lg text-on-surface shadow-xl sm:p-space-xl"
                    style={{ zoom: `${zoom}%` }}
                  >
                    <div className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden opacity-[0.035]">
                      <Icon className="text-[260px] text-primary">school</Icon>
                    </div>
                    <div className="relative">
                      <header className="mb-space-lg flex flex-wrap items-start justify-between gap-space-md border-b border-surface-container pb-space-md">
                        <div className="flex items-center gap-3">
                          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary font-headline-sm text-headline-sm font-bold text-on-primary">
                            UTM
                          </div>
                          <div>
                            <h3 className="font-headline-sm text-headline-sm font-extrabold uppercase text-primary">
                              Kolej Tun Razak
                            </h3>
                            <p className="font-label-sm text-label-sm text-secondary">
                              Universiti Teknologi Malaysia • Skudai Johor
                            </p>
                          </div>
                        </div>
                        <div className="text-left sm:text-right">
                          <span className="rounded bg-surface-container px-2 py-0.5 font-code text-code font-bold text-on-surface-variant">
                            OFFICIAL DOCUMENT
                          </span>
                          <p className="mt-1 font-label-sm text-label-sm text-secondary">
                            Ref: KTR/HEP/2026/M088
                          </p>
                        </div>
                      </header>

                      <div className="mb-space-lg rounded-lg bg-surface-container-low px-3 py-space-md text-center">
                        <span className="mb-1 block font-label-sm text-label-sm font-bold uppercase tracking-wider text-primary">
                          Student Activity Proposal 2026
                        </span>
                        <h4 className="font-headline-md text-headline-md font-extrabold text-on-surface">
                          {selectedApplication.title}
                        </h4>
                        <p className="mt-1 font-body-sm text-body-sm text-secondary">
                          Submitted by {selectedApplication.submitter} • Kolej Tun Razak
                        </p>
                      </div>

                      <div className="space-y-space-lg">
                        <section>
                          <h5 className="mb-1 flex items-center gap-1.5 font-label-lg text-label-lg font-bold text-primary">
                            1.0 Purpose &amp; objectives
                          </h5>
                          <p className="text-justify font-body-md text-body-md leading-relaxed text-on-surface-variant">
                            {selectedApplication.description} This proposal is submitted for
                            collegiate approval to encourage student participation, strengthen
                            residential community ties, and support holistic student development.
                          </p>
                        </section>

                        <section>
                          <h5 className="mb-2 font-label-lg text-label-lg font-bold text-primary">
                            2.0 Schedule &amp; logistics
                          </h5>
                          <div className="grid grid-cols-1 gap-2 rounded-lg bg-surface-container-low p-space-md text-body-sm sm:grid-cols-2">
                            <p>
                              <strong className="block text-on-surface">Proposed date:</strong>
                              <span className="text-on-surface-variant">
                                {selectedApplication.dates}, 8:00 AM – 11:30 PM
                              </span>
                            </p>
                            <p>
                              <strong className="block text-on-surface">Venue:</strong>
                              <span className="text-on-surface-variant">
                                Dewan Sri Resak &amp; Foyer Blok TR-B
                              </span>
                            </p>
                            <p>
                              <strong className="block text-on-surface">Expected turnout:</strong>
                              <span className="text-on-surface-variant">
                                {selectedApplication.turnout} students
                              </span>
                            </p>
                            <p>
                              <strong className="block text-on-surface">Organiser:</strong>
                              <span className="text-on-surface-variant">
                                Kolej Tun Razak Student Committee
                              </span>
                            </p>
                          </div>
                        </section>

                        <section>
                          <h5 className="mb-2 font-label-lg text-label-lg font-bold text-primary">
                            3.0 Proposed collegiate merit structure
                          </h5>
                          <div className="overflow-x-auto rounded-lg shadow-sm">
                            <table className="w-full text-left font-body-sm text-body-sm">
                              <thead className="bg-surface-container-high font-label-sm uppercase text-on-surface-variant">
                                <tr>
                                  <th className="px-3 py-2">Participant category</th>
                                  <th className="px-3 py-2">Role</th>
                                  <th className="px-3 py-2 text-center">KTR merit</th>
                                  <th className="px-3 py-2">Eligibility</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-surface-container-low bg-surface-container-lowest">
                                <tr>
                                  <td className="px-3 py-2 font-semibold text-on-surface">
                                    Committee members
                                  </td>
                                  <td className="px-3 py-2 text-secondary">Management &amp; technical</td>
                                  <td className="px-3 py-2 text-center font-bold text-rose-700">
                                    {selectedApplication.redMerit}
                                  </td>
                                  <td className="px-3 py-2 font-medium text-tertiary-container">
                                    Block priority
                                  </td>
                                </tr>
                                <tr>
                                  <td className="px-3 py-2 font-semibold text-on-surface">
                                    Event participants
                                  </td>
                                  <td className="px-3 py-2 text-secondary">Competition &amp; activities</td>
                                  <td className="px-3 py-2 text-center font-bold text-sky-700">
                                    {selectedApplication.blueMerit}
                                  </td>
                                  <td className="px-3 py-2 font-medium text-secondary">
                                    Standard residency
                                  </td>
                                </tr>
                              </tbody>
                            </table>
                          </div>
                        </section>

                        <div className="flex flex-col justify-between gap-2 rounded-lg bg-surface-container-low p-space-md sm:flex-row sm:items-center">
                          <div>
                            <span className="font-label-sm text-label-sm font-semibold uppercase text-secondary">
                              Prepared &amp; endorsed by
                            </span>
                            <p className="mt-0.5 font-label-lg text-label-lg font-bold text-on-surface">
                              {selectedApplication.submitter}
                            </p>
                            <p className="font-body-sm text-body-sm text-secondary">
                              {selectedApplication.role}, Kolej Tun Razak
                            </p>
                          </div>
                          <div className="sm:text-right">
                            <span className="inline-flex items-center gap-1 font-label-sm text-label-sm font-semibold text-tertiary-container">
                              <Icon className="text-[16px]">verified</Icon>
                              Fellow endorsement verified
                            </span>
                            <p className="font-code text-code text-secondary">
                              Submitted {selectedApplication.submitted}
                            </p>
                          </div>
                        </div>
                      </div>
                      <footer className="mt-space-lg flex justify-between border-t border-surface-container pt-space-sm font-label-sm text-label-sm text-secondary">
                        <span>KTR Merit &amp; Residence Management System</span>
                        <span>Page {page} / 8</span>
                      </footer>
                    </div>
                  </article>
                </div>
              </div>

              <div className="rounded-xl bg-surface-container-lowest p-space-md shadow-sm">
                <h3 className="mb-space-sm flex items-center gap-2 font-label-lg text-label-lg font-bold text-on-surface">
                  <Icon className="text-[18px] text-primary">fact_check</Icon>
                  Collegiate admin pre-approval criteria
                </h3>
                <div className="grid gap-2 sm:grid-cols-3">
                  {[
                    'Venue reservation confirmed',
                    'No academic exam conflicts',
                    'Fellow endorsement valid',
                  ].map((criterion) => (
                    <div
                      className="flex items-center gap-2 rounded-lg bg-surface-container-low p-2.5"
                      key={criterion}
                    >
                      <Icon className="text-[18px] text-tertiary-container">check_circle</Icon>
                      <span className="font-body-sm text-body-sm text-on-surface">{criterion}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex items-start gap-2.5 rounded-lg bg-surface-container p-space-sm">
                <Icon className="mt-0.5 shrink-0 text-[20px] text-primary">policy</Icon>
                <p className="font-body-sm text-body-sm leading-snug text-on-surface-variant">
                  <strong className="text-on-surface">Administrative SOP US 4.9:</strong> Approval
                  confirms the proposed merit entitlement and prepares the official collegiate
                  clearance record.
                </p>
              </div>
            </section>
          ) : (
            <section className="flex min-h-80 items-center justify-center rounded-xl bg-surface-container-lowest p-space-xl text-center shadow-sm">
              <div>
                <Icon className="mb-2 text-[36px] text-secondary">inbox</Icon>
                <h2 className="font-headline-sm text-headline-sm font-semibold text-on-surface">
                  Select an application
                </h2>
                <p className="font-body-sm text-body-sm text-secondary">
                  Choose a submission from the queue to review its details.
                </p>
              </div>
            </section>
          )}
        </div>
      </div>

      {isRejectModalOpen && selectedApplication && (
        <div
          aria-labelledby="reject-dialog-title"
          aria-modal="true"
          className="fixed inset-0 z-[60] flex items-center justify-center bg-on-surface/60 p-space-md backdrop-blur-sm"
          onClick={() => setIsRejectModalOpen(false)}
          role="dialog"
        >
          <form
            className="w-full max-w-lg overflow-hidden rounded-xl bg-surface-container-lowest shadow-2xl"
            onClick={(event) => event.stopPropagation()}
            onSubmit={handleReject}
          >
            <div className="flex items-start gap-3 border-b border-surface-container p-space-lg">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-error-container text-error">
                <Icon>edit_note</Icon>
              </span>
              <div>
                <h2
                  className="font-headline-sm text-headline-sm font-bold text-on-surface"
                  id="reject-dialog-title"
                >
                  Reject application
                </h2>
                <p className="font-body-sm text-body-sm text-secondary">
                  Add a clear reason for {selectedApplication.id}. The submitter will be notified.
                </p>
              </div>
              <button
                aria-label="Close dialog"
                className="ml-auto rounded-lg p-1 text-secondary hover:bg-surface-container"
                onClick={() => setIsRejectModalOpen(false)}
                type="button"
              >
                <Icon>close</Icon>
              </button>
            </div>
            <div className="p-space-lg">
              <label
                className="mb-1 block font-label-md text-label-md font-semibold text-on-surface"
                htmlFor="rejection-reason"
              >
                Reason for rejection
              </label>
              <textarea
                autoFocus
                className="min-h-32 w-full resize-y rounded-lg bg-surface-container-low p-3 font-body-md text-body-md text-on-surface placeholder:text-secondary focus:outline-none focus:ring-2 focus:ring-primary/20"
                id="rejection-reason"
                maxLength={400}
                onChange={(event) => setRejectionReason(event.target.value)}
                placeholder="Explain what needs to be addressed..."
                value={rejectionReason}
              />
              <div className="mt-1 flex items-center justify-between gap-2">
                <span
                  className={`font-body-sm text-body-sm ${
                    rejectionReason.trim().length >= 20
                      ? 'text-tertiary-container'
                      : 'text-secondary'
                  }`}
                >
                  {rejectionReason.trim().length < 20
                    ? `${20 - rejectionReason.trim().length} more characters required`
                    : 'Reason is ready to submit'}
                </span>
                <span className="font-code text-code text-secondary">
                  {rejectionReason.length}/400
                </span>
              </div>
            </div>
            <div className="flex justify-end gap-2 bg-surface-container-low px-space-lg py-space-md">
              <button
                className="rounded-lg px-4 py-2 font-label-md text-label-md text-secondary transition-colors hover:bg-surface-container"
                onClick={() => setIsRejectModalOpen(false)}
                type="button"
              >
                Cancel
              </button>
              <button
                className="flex items-center gap-2 rounded-lg bg-error px-4 py-2 font-label-md text-label-md text-on-error shadow-sm transition-colors hover:bg-on-error-container disabled:cursor-not-allowed disabled:opacity-50"
                disabled={rejectionReason.trim().length < 20}
                type="submit"
              >
                <Icon className="text-[18px]">cancel</Icon>
                Confirm rejection
              </button>
            </div>
          </form>
        </div>
      )}
    </AppLayout>
  );
}
