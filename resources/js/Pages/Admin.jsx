import { router } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';
import AppLayout from '../Components/AppLayout';
import Chatbot from './Chatbot';

const adminNavigation = [
  {
    title: 'Hostel Management',
    items: [
      {
        label: 'Room Inventory',
        icon: 'meeting_room',
        path: 'admin-hostel-rooms',
        href: '/admin/hostel/rooms',
      },
    ],
  },
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
        href: '/admin',
      },
      {
        label: 'Activity Review & Approvals',
        icon: 'fact_check',
        path: 'activity-reviews-and-approvals',
        href: '/admin',
        active: true,
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
    title: 'Master Data Management',
    items: [
      {
        label: 'Roles Management',
        icon: 'badge',
        href: '#',
      },
      {
        label: 'Status Management',
        icon: 'toggle_on',
        href: '#',
      },
      {
        label: 'Merit Management',
        icon: 'military_tech',
        href: '/admin/master-data/merit',
      },
    ],
  },
];

const adminProfile = {
  name: 'Admin Name',
  description: 'Administrator',
};

const organizationNames = {
  jkm_sports: 'JKM Biro Sukan & Rekreasi',
  jkm_academic: 'JKM Biro Akademik & Kerjaya',
  jkm_cultural: 'JKM Biro Kebudayaan & Kesenian',
  jkm_welfare: 'JKM Biro Kebajikan & Kerohanian',
  felo_office: 'Pejabat Felo Kolej Tun Razak',
};

function formatDate(value, options = { dateStyle: 'medium' }) {
  if (!value) return 'Not provided';

  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? 'Not provided'
    : new Intl.DateTimeFormat(undefined, options).format(date);
}

function toReviewApplication(application) {
  const year = application.created_at
    ? new Date(application.created_at).getFullYear()
    : new Date().getFullYear();

  return {
    ...application,
    reference: `ACT-${year}-${String(application.id).padStart(3, '0')}`,
    title: application.activity_name || 'Untitled draft',
    directorName: application.director_name || 'Not provided',
    submitted: formatDate(application.created_at),
    dates: `${formatDate(application.start_at, { dateStyle: 'medium', timeStyle: 'short' })} – ${formatDate(application.end_at, { dateStyle: 'medium', timeStyle: 'short' })}`,
    submitter: organizationNames[application.organization] || application.organization || 'Organization not specified',
    role: 'Club Name',
  };
}

function Icon({ children, className = '' }) {
  return <span className={`material-symbols-outlined ${className}`}>{children}</span>;
}

export default function Admin({
  applications: submittedApplications = [],
  chatbot = null,
  showChatbot = false,
  successMessage = null,
  notificationWarning = null,
}) {
  const applications = useMemo(
    () => submittedApplications.map(toReviewApplication),
    [submittedApplications],
  );
  const [selectedId, setSelectedId] = useState(null);
  const [activeFilter, setActiveFilter] = useState('pending');
  const [search, setSearch] = useState('');
  const [detailsId, setDetailsId] = useState(null);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [toast, setToast] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [reviewError, setReviewError] = useState('');
  const [deleteId, setDeleteId] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [pendingAlertIndex, setPendingAlertIndex] = useState(0);

  const selectedApplication = applications.find(({ id }) => id === selectedId);
  const detailsApplication = applications.find(({ id }) => id === detailsId);
  const deleteApplication = applications.find(({ id }) => id === deleteId);
  const pendingApplications = useMemo(
    () => applications.filter(({ status }) => status === 'pending'),
    [applications],
  );
  const pendingCount = pendingApplications.length;
  const approvedCount = applications.filter(({ status }) => status === 'approved').length;
  const rejectedCount = applications.filter(({ status }) => status === 'rejected').length;
  const activePendingAlertIndex = pendingCount ? pendingAlertIndex % pendingCount : 0;
  const pendingAlert = pendingApplications[activePendingAlertIndex];

  const rotatePendingAlert = (direction) => {
    if (pendingApplications.length < 2) return;

    setPendingAlertIndex((index) => (
      index + direction + pendingApplications.length
    ) % pendingApplications.length);
  };

  useEffect(() => {
    if (!applications.some(({ id }) => id === selectedId)) {
      setSelectedId(applications.find(({ status }) => status === 'pending')?.id ?? applications[0]?.id ?? null);
    }
  }, [applications, selectedId]);

  useEffect(() => {
    setPendingAlertIndex((index) => (
      pendingApplications.length ? index % pendingApplications.length : 0
    ));

    if (pendingApplications.length < 2) return undefined;

    const interval = window.setInterval(() => {
      setPendingAlertIndex((index) => (index + 1) % pendingApplications.length);
    }, 5000);

    return () => window.clearInterval(interval);
  }, [pendingApplications.length]);

  const visibleApplications = useMemo(() => {
    const query = search.trim().toLowerCase();

    return applications.filter((application) => {
      const matchesStatus =
        activeFilter === 'all' ||
        application.status === activeFilter;
      const matchesSearch =
        !query ||
        `${application.reference} ${application.title} ${application.submitter}`
          .toLowerCase()
          .includes(query);

      return matchesStatus && matchesSearch;
    });
  }, [activeFilter, applications, search]);

  useEffect(() => {
    const isModalOpen = isRejectModalOpen || detailsApplication || deleteApplication;
    document.body.style.overflow = isModalOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [isRejectModalOpen, detailsApplication, deleteApplication]);

  useEffect(() => {
    if (!toast) return undefined;

    const timeout = window.setTimeout(() => setToast(null), 5500);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  useEffect(() => {
    if (notificationWarning) {
      setToast({ status: 'warning', title: notificationWarning, message: '' });
    } else if (successMessage) {
      setToast({ status: 'approved', title: successMessage, message: '' });
    }
  }, [successMessage, notificationWarning]);

  useEffect(() => {
    if (!isRejectModalOpen && !detailsApplication && !deleteApplication) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setIsRejectModalOpen(false);
        setDetailsId(null);
        setDeleteId(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isRejectModalOpen, detailsApplication, deleteApplication]);

  const updateApplicationStatus = (status, reviewNotes = '') => {
    if (!selectedApplication) return;

    setReviewError('');
    router.patch(`/admin/activity-applications/${selectedApplication.id}`, {
      status,
      review_notes: reviewNotes,
    }, {
      preserveScroll: true,
      onStart: () => setIsUpdating(true),
      onSuccess: () => {
        setActiveFilter('all');
        setIsRejectModalOpen(false);
        setDetailsId(null);
        setRejectionReason('');
        setToast({
          status,
          title: status === 'approved' ? 'Application approved' : 'Application rejected',
          message: `${selectedApplication.title} (${selectedApplication.reference})`,
        });
      },
      onError: (errors) => {
        setReviewError(errors.review_notes || 'The application could not be updated. Refresh and try again.');
      },
      onFinish: () => setIsUpdating(false),
    });
  };

  const handleReject = (event) => {
    event.preventDefault();
    if (!rejectionReason.trim() || rejectionReason.trim().length > 400) return;

    updateApplicationStatus('rejected', rejectionReason.trim());
  };

  const deleteSelectedApplication = () => {
    if (!deleteApplication) return;

    setDeleteError('');
    router.delete(`/admin/activity-applications/${deleteApplication.id}`, {
      preserveScroll: true,
      onStart: () => setIsDeleting(true),
      onSuccess: () => {
        setDeleteId(null);
        setDetailsId(null);
        setToast({
          status: 'approved',
          title: `${deleteApplication.reference} moved to deleted items`,
          message: 'The application record and paperwork are retained.',
        });
      },
      onError: (errors) => {
        setDeleteError(Object.values(errors)[0] || 'The application could not be moved to deleted items.');
      },
      onFinish: () => setIsDeleting(false),
    });
  };

  return (
    <AppLayout
      profile={adminProfile}
      sessionLabel="Academic Session: Sem 1, 2026/2027"
    >
      {showChatbot ? (
        <Chatbot chatbot={chatbot} chatbotLogs={chatbotLogs} successMessage={successMessage} />
      ) : (
        <>
      <div className="mx-auto w-full max-w-[1800px] pb-space-xl">
        {toast && (
          <div
            aria-live="polite"
            className={`mb-space-md flex items-start justify-between gap-space-md rounded-xl p-space-md shadow-md ${
              toast.status === 'rejected'
                ? 'bg-error text-on-error'
                : toast.status === 'warning'
                  ? 'bg-amber-100 text-amber-950'
                  : 'bg-tertiary text-on-tertiary'
            }`}
            role="status"
          >
            <div className="flex items-start gap-space-sm">
              <Icon className="text-[20px]">
                {toast.status === 'rejected' ? 'do_not_disturb_on' : toast.status === 'warning' ? 'warning' : 'check_circle'}
              </Icon>
              <div>
                <p className="font-label-lg text-label-lg">{toast.title}</p>
                {toast.message && <p className="font-body-sm text-body-sm opacity-90">{toast.message}</p>}
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
                Student's Activity Application Management
              </span>
            </div>
            <h1 className="font-headline-lg text-headline-lg font-bold tracking-tight text-on-surface">
              Student's Activities Applications
            </h1>
            <p className="mt-1 font-body-md text-body-md text-secondary">New applications will remain pending until reviewed and approved by an administrator</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-2 rounded-lg bg-surface-container-lowest px-3 py-1.5 text-on-surface shadow-sm">
              <span className="font-label-md text-label-md text-secondary">Total Paperwork</span>
              <span className="font-headline-sm text-headline-sm font-bold">{applications.length}</span>
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
                {approvedCount}
              </span>
            </div>
            <div className="flex items-center gap-2 rounded-lg bg-surface-container-lowest px-3 py-1.5 shadow-sm">
              <span className="h-2 w-2 rounded-full bg-error" />
              <span className="font-label-md text-label-md text-secondary">Rejected</span>
              <span className="font-headline-sm text-headline-sm font-bold text-error">
                {rejectedCount}
              </span>
            </div>
          </div>
        </section>

        {pendingAlert && (
          <section
            aria-live="polite"
            className="mt-space-md flex items-center gap-space-md rounded-xl border border-amber-200 bg-amber-50 p-space-md shadow-sm"
            role="status"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-800">
              <Icon>notifications_active</Icon>
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-label-sm text-label-sm font-semibold uppercase tracking-wide text-amber-800">
                New applications awaiting review · {pendingCount} pending
              </p>
              <div
                className="pending-alert-slide-up flex min-h-12 items-center justify-between gap-space-sm"
                key={pendingAlert.id}
              >
                <div className="min-w-0">
                  <p className="truncate font-label-lg text-label-lg font-semibold text-on-surface">
                    {pendingAlert.title}
                  </p>
                  <p className="truncate font-body-sm text-body-sm text-secondary">
                    {pendingAlert.submitter} · {pendingAlert.reference} · Submitted {pendingAlert.submitted}
                  </p>
                </div>
                <button
                  className="shrink-0 rounded-lg px-3 py-1.5 font-label-md text-label-md font-semibold text-primary hover:bg-amber-100"
                  onClick={() => {
                    setActiveFilter('pending');
                    setSelectedId(pendingAlert.id);
                    setDetailsId(pendingAlert.id);
                  }}
                  type="button"
                >
                  Review
                </button>
              </div>
            </div>
            {pendingCount > 1 && (
              <div className="flex shrink-0 flex-col items-center">
                <button
                  aria-label="Show previous pending application"
                  className="rounded p-1 text-amber-800 hover:bg-amber-100"
                  onClick={() => rotatePendingAlert(-1)}
                  type="button"
                >
                  <Icon className="text-[18px]">keyboard_arrow_up</Icon>
                </button>
                <span className="font-code text-code text-amber-900">
                  {activePendingAlertIndex + 1}/{pendingCount}
                </span>
                <button
                  aria-label="Show next pending application"
                  className="rounded p-1 text-amber-800 hover:bg-amber-100"
                  onClick={() => rotatePendingAlert(1)}
                  type="button"
                >
                  <Icon className="text-[18px]">keyboard_arrow_down</Icon>
                </button>
              </div>
            )}
          </section>
        )}

        <div className="flex flex-col gap-space-md pt-space-md">
          <section className="flex flex-col overflow-hidden rounded-xl bg-surface-container-lowest shadow-sm">
            <div className="flex flex-col justify-between gap-space-md p-space-md md:flex-row md:items-center">
              <div className="flex flex-wrap items-center gap-1">
                {[
                  { id: 'pending', label: 'Pending', count: pendingCount },
                  { id: 'all', label: 'All applications', count: applications.length },
                  { id: 'approved', label: 'Approved', count: approvedCount },
                  { id: 'rejected', label: 'Rejected', count: rejectedCount },
                ].map((filter) => (
                  <button
                    aria-pressed={activeFilter === filter.id}
                    className={`rounded-lg px-3.5 py-1.5 font-label-md text-label-md transition-colors ${
                      activeFilter === filter.id
                        ? 'bg-primary text-on-primary shadow-sm'
                        : 'text-secondary hover:bg-surface-container-high'
                    }`}
                    key={filter.id}
                    onClick={() => setActiveFilter(filter.id)}
                    type="button"
                  >
                    {filter.label} ({filter.count})
                  </button>
                ))}
              </div>
              <label className="relative block w-full md:w-72">
                <Icon className="absolute left-3 top-2.5 text-[18px] text-secondary">search</Icon>
                <input
                  className="h-9 w-full rounded-lg bg-surface-container-low py-2 pl-10 pr-3 font-body-sm text-body-sm text-on-surface placeholder:text-secondary/70 focus:outline-none focus:ring-2 focus:ring-primary/20"
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search ID, title, or organization..."
                  type="search"
                  value={search}
                  aria-label="Search submitted applications"
                />
              </label>
            </div>

            <div className="flex items-center justify-between px-space-lg pb-space-md">
              <div>
                <h2 className="font-headline-sm text-headline-sm text-on-surface">Submitted Activity Applications</h2>
                <p className="font-body-sm text-body-sm text-secondary">Select a row to review the application and its paperwork.</p>
              </div>
              <span className="font-code text-code text-secondary">{visibleApplications.length} records</span>
            </div>

            <div className="application-table-scroll max-h-[28rem] overflow-auto">
              <table className="w-full text-left">
                <thead className="sticky top-0 z-10 bg-surface-container-low font-label-sm text-label-sm uppercase tracking-wider text-secondary">
                  <tr>
                    <th className="px-space-lg py-3">Activity &amp; Organization</th>
                    <th className="px-space-md py-3">Schedule &amp; Venue</th>
                    <th className="px-space-md py-3">Submitted</th>
                    <th className="px-space-md py-3">Status</th>
                    <th className="px-space-lg py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-container text-body-md">
                  {visibleApplications.map((application) => (
                    <tr
                      className={`transition-colors hover:bg-surface-container-low/50 ${application.id === selectedId ? 'bg-surface-container-low/50' : ''}`}
                      key={application.id}
                    >
                      <td className="px-space-lg py-4">
                        <div className="font-label-lg text-label-lg text-on-surface">{application.title}</div>
                        <div className="mt-0.5 font-body-sm text-body-sm text-secondary">
                          {application.submitter} · {application.reference}
                        </div>
                      </td>
                      <td className="px-space-md py-4">
                        <div className="font-body-sm text-body-sm font-medium text-on-surface">{application.dates}</div>
                        <div className="mt-0.5 font-body-sm text-body-sm text-secondary">{application.venue || 'Venue not provided'}</div>
                      </td>
                      <td className="px-space-md py-4 font-body-sm text-body-sm text-on-surface">{application.submitted}</td>
                      <td className="px-space-md py-4">
                        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-label-sm text-label-sm font-semibold ${
                          application.status === 'pending'
                            ? 'bg-amber-100 text-amber-800'
                            : application.status === 'approved'
                              ? 'bg-tertiary-fixed text-tertiary'
                              : 'bg-error-container text-error'
                        }`}>
                          <span className="h-1.5 w-1.5 rounded-full bg-current" />
                          {application.status === 'pending' ? 'Pending' : `${application.status[0].toUpperCase()}${application.status.slice(1)}`}
                        </span>
                      </td>
                      <td className="px-space-lg py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            aria-label={`View details for ${application.title}`}
                            className="rounded-lg bg-surface-container-high p-2 text-on-surface transition-colors hover:bg-surface-variant"
                            title="View application details"
                            onClick={() => {
                              setSelectedId(application.id);
                              setDetailsId(application.id);
                            }}
                            type="button"
                          >
                            <Icon className="text-[18px]">visibility</Icon>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {visibleApplications.length === 0 && (
                    <tr>
                      <td className="px-space-lg py-12 text-center font-body-md text-body-md text-secondary" colSpan="5">
                        {applications.length === 0
                          ? 'No submitted applications yet. New submissions will appear here for review.'
                          : 'No applications match this filter or search.'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </div>

      {detailsApplication && (
        <div
          aria-labelledby="application-details-title"
          aria-modal="true"
          className="fixed inset-0 z-[60] flex items-center justify-center bg-on-surface/60 p-space-md backdrop-blur-sm"
          onClick={() => setDetailsId(null)}
          role="dialog"
        >
          <section
            className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-xl bg-surface-container-lowest shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <header className="sticky top-0 flex items-start justify-between gap-space-md border-b border-surface-container bg-surface-container-lowest p-space-lg">
              <div>
                <p className="font-label-sm text-label-sm font-semibold uppercase tracking-wider text-secondary">
                  Application {detailsApplication.reference}
                </p>
                <h2 className="mt-1 font-headline-md text-headline-md font-bold text-on-surface" id="application-details-title">
                  {detailsApplication.title}
                </h2>
                <p className="font-body-sm text-body-sm text-secondary">{detailsApplication.submitter}</p>
              </div>
              <button
                aria-label="Close application details"
                className="rounded-lg p-2 text-secondary hover:bg-surface-container"
                onClick={() => setDetailsId(null)}
                type="button"
              >
                <Icon>close</Icon>
              </button>
            </header>

            <div className="space-y-space-md p-space-lg">
              <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 font-label-sm text-label-sm font-semibold ${
                detailsApplication.status === 'pending'
                  ? 'bg-amber-100 text-amber-800'
                  : detailsApplication.status === 'approved'
                    ? 'bg-tertiary-fixed text-tertiary'
                    : detailsApplication.status === 'rejected'
                      ? 'bg-error-container text-error'
                      : 'bg-surface-container text-secondary'
              }`}>
                <span className="h-2 w-2 rounded-full bg-current" />
                {detailsApplication.status === 'pending' ? 'Pending' : `${detailsApplication.status[0].toUpperCase()}${detailsApplication.status.slice(1)}`}
              </span>
              <div className="grid gap-space-md sm:grid-cols-2">
              {[
                ['Submitted', detailsApplication.submitted],
                ['Director name', detailsApplication.directorName],
                ['Semester', detailsApplication.semester ? `Semester ${detailsApplication.semester}` : 'Not provided'],
                ['Sesi', detailsApplication.academic_year || 'Not provided'],
                ['Start', formatDate(detailsApplication.start_at, { dateStyle: 'medium', timeStyle: 'short' })],
                ['End', formatDate(detailsApplication.end_at, { dateStyle: 'medium', timeStyle: 'short' })],
              ].map(([label, value]) => (
                <div className="min-w-0 rounded-lg bg-surface-container-low p-space-md" key={label}>
                  <p className="font-label-sm text-label-sm text-secondary">{label}</p>
                  <p className="mt-0.5 font-body-md text-body-md font-semibold text-on-surface">{value}</p>
                </div>
              ))}
              <div className="min-w-0 rounded-lg bg-surface-container-low p-space-md sm:col-span-2">
                <p className="font-label-sm text-label-sm text-secondary">Venue</p>
                <p className="mt-1 break-words whitespace-pre-wrap font-body-md text-body-md font-semibold text-on-surface">
                  {detailsApplication.venue || 'Not provided'}
                </p>
              </div>
              <div className="min-w-0 rounded-lg bg-surface-container-low p-space-md sm:col-span-2">
                <p className="font-label-sm text-label-sm text-secondary">Remarks</p>
                <p className="mt-1 break-words whitespace-pre-wrap font-body-md text-body-md text-on-surface">
                  {detailsApplication.remarks || 'No remarks provided.'}
                </p>
              </div>
              <div className="min-w-0 rounded-lg bg-surface-container-low p-space-md sm:col-span-2">
                <p className="font-label-sm text-label-sm font-semibold text-on-surface">Uploaded paperwork</p>
                {detailsApplication.paperwork_files?.length ? (
                  <ul className="mt-2 space-y-2">
                    {detailsApplication.paperwork_files.map((file) => (
                      <li key={file.url}>
                        <a
                          className="inline-flex items-center gap-2 font-body-md text-body-md text-primary underline"
                          href={file.url}
                          download
                        >
                          <Icon className="text-[18px]">download</Icon>
                          {file.name}
                        </a>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-1 font-body-md text-body-md text-secondary">No paperwork files uploaded.</p>
                )}
              </div>
              {detailsApplication.review_notes && (
                <div className="rounded-lg bg-error-container p-space-md sm:col-span-2">
                  <p className="font-label-sm text-label-sm font-semibold text-error">Admin review notes</p>
                  <p className="mt-0.5 whitespace-pre-wrap font-body-md text-body-md text-on-error-container">
                    {detailsApplication.review_notes}
                  </p>
                </div>
              )}
              </div>
            </div>

            <footer className="flex items-center justify-between gap-space-sm border-t border-surface-container bg-surface-container-low p-space-lg">
              <button
                className="rounded-lg px-4 py-2 font-label-md text-label-md text-secondary hover:bg-surface-container"
                onClick={() => setDetailsId(null)}
                type="button"
              >
                Close
              </button>
              <div className="flex justify-end gap-2">
                {detailsApplication.status === 'rejected' && (
                  <button
                    className="inline-flex items-center gap-2 rounded-lg bg-error px-4 py-2 font-label-md text-label-md text-on-error"
                    onClick={() => {
                      setDeleteError('');
                      setDetailsId(null);
                      setDeleteId(detailsApplication.id);
                    }}
                    type="button"
                  >
                    <Icon className="text-[18px]">delete</Icon>
                    Delete application
                  </button>
                )}
                {detailsApplication.status === 'pending' && (
                  <>
                    <button
                      className="rounded-lg bg-error px-4 py-2 font-label-md text-label-md text-on-error disabled:opacity-50"
                      disabled={isUpdating}
                      onClick={() => {
                        setReviewError('');
                        setRejectionReason('');
                        setDetailsId(null);
                        setIsRejectModalOpen(true);
                      }}
                      type="button"
                    >
                      Reject
                    </button>
                    <button
                      className="rounded-lg bg-tertiary-container px-4 py-2 font-label-md text-label-md text-on-tertiary disabled:opacity-50"
                      disabled={isUpdating}
                      onClick={() => updateApplicationStatus('approved')}
                      type="button"
                    >
                      {isUpdating ? 'Saving…' : 'Approve'}
                    </button>
                  </>
                )}
              </div>
            </footer>
          </section>
        </div>
      )}

      {deleteApplication && (
        <div
          aria-labelledby="delete-application-title"
          aria-modal="true"
          className="fixed inset-0 z-[60] flex items-center justify-center bg-on-surface/60 p-space-md backdrop-blur-sm"
          onClick={() => !isDeleting && setDeleteId(null)}
          role="dialog"
        >
          <section
            className="w-full max-w-lg overflow-hidden rounded-xl bg-surface-container-lowest shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <header className="flex items-start gap-space-md border-b border-surface-container p-space-lg">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-error-container text-error">
                <Icon>delete</Icon>
              </span>
              <div>
                <h2 className="font-headline-sm text-headline-sm font-bold text-on-surface" id="delete-application-title">
                  Move application to deleted items?
                </h2>
                <p className="mt-1 font-body-sm text-body-sm text-secondary">
                  {deleteApplication.title} will be hidden from the review list. Its record and uploaded paperwork will be retained.
                </p>
              </div>
              <button
                aria-label="Close delete confirmation"
                className="ml-auto rounded-lg p-1 text-secondary hover:bg-surface-container"
                disabled={isDeleting}
                onClick={() => setDeleteId(null)}
                type="button"
              >
                <Icon className="text-[18px]">close</Icon>
              </button>
            </header>
            {deleteError && <p className="px-space-lg pt-space-md font-body-sm text-body-sm text-error" role="alert">{deleteError}</p>}
            <footer className="flex justify-end gap-2 bg-surface-container-low px-space-lg py-space-md">
              <button
                className="rounded-lg px-4 py-2 font-label-md text-label-md text-secondary hover:bg-surface-container disabled:opacity-50"
                disabled={isDeleting}
                onClick={() => setDeleteId(null)}
                type="button"
              >
                Cancel
              </button>
              <button
                className="inline-flex items-center gap-2 rounded-lg bg-error px-4 py-2 font-label-md text-label-md text-on-error disabled:opacity-50"
                disabled={isDeleting}
                onClick={deleteSelectedApplication}
                type="button"
              >
                <Icon className="text-[18px]">{isDeleting ? 'progress_activity' : 'delete'}</Icon>
                {isDeleting ? 'Moving...' : 'Move to deleted items'}
              </button>
            </footer>
          </section>
        </div>
      )}

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
                  Add a clear reason for {selectedApplication.reference}. This note will be saved with the decision.
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
              {reviewError && <p className="mt-2 font-body-sm text-body-sm text-error" role="alert">{reviewError}</p>}
              <div className="mt-1 flex items-center justify-between gap-2">
                <span
                  className={`font-body-sm text-body-sm ${
                    rejectionReason.trim().length > 0
                      ? 'text-tertiary-container'
                      : 'text-secondary'
                  }`}
                >
                  {rejectionReason.trim().length > 0
                    ? 'Reason is ready to submit'
                    : 'A reason is required to reject.'}
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
                disabled={!rejectionReason.trim() || isUpdating}
                type="submit"
              >
                <Icon className="text-[18px]">cancel</Icon>
                Confirm rejection
              </button>
            </div>
          </form>
        </div>
      )}
        </>
      )}
    </AppLayout>
  );
}
