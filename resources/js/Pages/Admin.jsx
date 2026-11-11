import { router } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';
import AppLayout from '../Components/AppLayout';
import Chatbot from './Chatbot';

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
      {
        label: 'Update Chatbot Information',
        icon: 'smart_toy',
        path: 'update-chatbot-information',
        href: '/admin?modal=chatbot',
      },
    ],
  },
];

const adminProfile = {
  name: 'En. Razak',
  description: 'Collegiate Administrator',
};

const organizationNames = {
  jkm_sports: 'JKM Biro Sukan & Rekreasi',
  jkm_academic: 'JKM Biro Akademik & Kerjaya',
  jkm_cultural: 'JKM Biro Kebudayaan & Kesenian',
  jkm_welfare: 'JKM Biro Kebajikan & Kerohanian',
  felo_office: 'Pejabat Felo Kolej Tun Razak',
};

const meritTierNames = {
  standard: 'Standard Tier',
  high_impact: 'High Impact Collegiate',
  trainer_special: 'Technical Facilitator Role',
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
    description: application.merit_notes || 'No additional merit notes were provided.',
    submitted: formatDate(application.created_at),
    dates: `${formatDate(application.start_at, { dateStyle: 'medium', timeStyle: 'short' })} – ${formatDate(application.end_at, { dateStyle: 'medium', timeStyle: 'short' })}`,
    turnout: application.expected_turnout,
    committeeQuota: application.committee_quota,
    participantQuota: application.participant_quota,
    meritTier: meritTierNames[application.merit_tier] || 'Not specified',
    submitter: organizationNames[application.organization] || 'Organization not specified',
    role: 'Proposing organization',
  };
}

function Icon({ children, className = '' }) {
  return <span className={`material-symbols-outlined ${className}`}>{children}</span>;
}

export default function Admin({ applications: submittedApplications = [], chatbot = null, showChatbot = false }) {
  const applications = useMemo(
    () => submittedApplications.map(toReviewApplication),
    [submittedApplications],
  );
  const [selectedId, setSelectedId] = useState(null);
  const [activeFilter, setActiveFilter] = useState('pending');
  const [search, setSearch] = useState('');
  const [detailsId, setDetailsId] = useState(null);
  const [documentId, setDocumentId] = useState(null);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [toast, setToast] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [reviewError, setReviewError] = useState('');

  const selectedApplication = applications.find(({ id }) => id === selectedId);
  const detailsApplication = applications.find(({ id }) => id === detailsId);
  const documentApplication = applications.find(({ id }) => id === documentId);
  const pendingCount = applications.filter(({ status }) => status === 'pending').length;
  const approvedCount = applications.filter(({ status }) => status === 'approved').length;
  const rejectedCount = applications.filter(({ status }) => status === 'rejected').length;

  useEffect(() => {
    if (!applications.some(({ id }) => id === selectedId)) {
      setSelectedId(applications.find(({ status }) => status === 'pending')?.id ?? applications[0]?.id ?? null);
    }
  }, [applications, selectedId]);

  const visibleApplications = useMemo(() => {
    const query = search.trim().toLowerCase();

    return applications.filter((application) => {
      const matchesStatus =
        activeFilter === 'all' ||
        application.status === activeFilter ||
        (activeFilter === 'high-turnout' && application.expected_turnout > 200);
      const matchesSearch =
        !query ||
        `${application.reference} ${application.title} ${application.submitter}`
          .toLowerCase()
          .includes(query);

      return matchesStatus && matchesSearch;
    });
  }, [activeFilter, applications, search]);

  useEffect(() => {
    const isModalOpen = isRejectModalOpen || detailsApplication || documentApplication;
    document.body.style.overflow = isModalOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [isRejectModalOpen, detailsApplication, documentApplication]);

  useEffect(() => {
    if (!toast) return undefined;

    const timeout = window.setTimeout(() => setToast(null), 5500);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  useEffect(() => {
    if (!isRejectModalOpen && !detailsApplication && !documentApplication) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setIsRejectModalOpen(false);
        setDetailsId(null);
        setDocumentId(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isRejectModalOpen, detailsApplication, documentApplication]);

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
          title: `Application ${selectedApplication.reference} ${status}`,
          message: status === 'approved'
            ? 'The approval has been saved.'
            : 'The rejection and review notes have been saved.',
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
    if (rejectionReason.trim().length < 20 || rejectionReason.trim().length > 400) return;

    updateApplicationStatus('rejected', rejectionReason.trim());
  };

  return (
    <AppLayout
      navigationSections={adminNavigation}
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

        <div className="flex flex-col gap-space-md pt-space-md">
          {selectedApplication && (
            <section className="flex flex-col justify-between gap-space-sm rounded-xl bg-surface-container-lowest p-space-md shadow-sm sm:flex-row sm:items-center">
              <div className="min-w-0">
                <div className="mb-1 flex flex-wrap items-center gap-2">
                  <span className="font-label-sm text-label-sm font-bold uppercase text-secondary">
                    Document review workspace
                  </span>
                  <span className="rounded bg-surface-container px-2 py-0.5 font-code text-code">
                    {selectedApplication.has_proposal_document ? 'Uploaded proposal' : 'Application details'}
                  </span>
                </div>
                <h2 className="truncate font-headline-sm text-headline-sm font-bold text-on-surface">
                  {selectedApplication.title}
                </h2>
              </div>
              {selectedApplication.status === 'pending' ? (
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    className="flex items-center gap-1.5 rounded-lg bg-surface-container-lowest px-3 py-2 font-label-md text-label-md text-error shadow-sm ring-1 ring-error/30 transition-colors hover:bg-error-container disabled:opacity-50"
                    onClick={() => {
                      setReviewError('');
                      setIsRejectModalOpen(true);
                    }}
                    disabled={isUpdating}
                    type="button"
                  >
                    <Icon className="text-[18px]">close</Icon>
                    Reject
                  </button>
                  <button
                    className="flex items-center gap-2 rounded-lg bg-tertiary-container px-4 py-2 font-label-md text-label-md text-on-tertiary shadow-md transition-all hover:bg-tertiary hover:shadow-lg active:scale-[0.98] disabled:opacity-50"
                    onClick={() => updateApplicationStatus('approved')}
                    disabled={isUpdating}
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
            </section>
          )}

          <section className="flex flex-col overflow-hidden rounded-xl bg-surface-container-lowest shadow-sm">
            <div className="flex flex-col justify-between gap-space-md p-space-md md:flex-row md:items-center">
              <div className="flex flex-wrap items-center gap-1">
                {[
                  { id: 'pending', label: 'Pending', count: pendingCount },
                  { id: 'all', label: 'All applications', count: applications.length },
                  { id: 'approved', label: 'Approved', count: approvedCount },
                  { id: 'rejected', label: 'Rejected', count: rejectedCount },
                  { id: 'high-turnout', label: 'High turnout', count: null },
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
                    {filter.label}{filter.count !== null ? ` (${filter.count})` : ' (>200)'}
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
                <p className="font-body-sm text-body-sm text-secondary">Select a row to review the application and its proposal.</p>
              </div>
              <span className="font-code text-code text-secondary">{visibleApplications.length} records</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-surface-container-low font-label-sm text-label-sm uppercase tracking-wider text-secondary">
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
                            ? 'bg-primary-fixed text-primary'
                            : application.status === 'approved'
                              ? 'bg-tertiary-fixed text-tertiary'
                              : 'bg-error-container text-error'
                        }`}>
                          <span className="h-1.5 w-1.5 rounded-full bg-current" />
                          {application.status === 'pending' ? 'Pending Review' : `${application.status[0].toUpperCase()}${application.status.slice(1)}`}
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
                          <button
                            aria-label={`View attached document for ${application.title}`}
                            className="rounded-lg bg-primary p-2 text-on-primary transition-colors hover:bg-primary-container disabled:cursor-not-allowed disabled:opacity-50"
                            disabled={!application.has_proposal_document}
                            onClick={() => {
                              setSelectedId(application.id);
                              setDocumentId(application.id);
                            }}
                            title={application.has_proposal_document ? 'View attached proposal PDF' : 'No document attached'}
                            type="button"
                          >
                            <Icon className="text-[18px]">picture_as_pdf</Icon>
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

            <div className="grid gap-space-md p-space-lg sm:grid-cols-2">
              {[
                ['Status', detailsApplication.status === 'pending' ? 'Pending Review' : detailsApplication.status],
                ['Submitted', detailsApplication.submitted],
                ['Start', formatDate(detailsApplication.start_at, { dateStyle: 'medium', timeStyle: 'short' })],
                ['End', formatDate(detailsApplication.end_at, { dateStyle: 'medium', timeStyle: 'short' })],
                ['Venue', detailsApplication.venue || 'Not provided'],
                ['Expected turnout', detailsApplication.turnout ? `${detailsApplication.turnout} people` : 'Not provided'],
                ['Committee quota', detailsApplication.committeeQuota ?? 'Not provided'],
                ['Participant quota', detailsApplication.participantQuota ?? 'Not provided'],
                ['Merit tier', detailsApplication.meritTier],
              ].map(([label, value]) => (
                <div className="rounded-lg bg-surface-container-low p-space-md" key={label}>
                  <p className="font-label-sm text-label-sm text-secondary">{label}</p>
                  <p className="mt-0.5 font-body-md text-body-md font-semibold text-on-surface">{value}</p>
                </div>
              ))}
              <div className="rounded-lg bg-surface-container-low p-space-md sm:col-span-2">
                <p className="font-label-sm text-label-sm text-secondary">Additional merit notes</p>
                <p className="mt-0.5 whitespace-pre-wrap font-body-md text-body-md text-on-surface">
                  {detailsApplication.merit_notes || 'No additional notes provided.'}
                </p>
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

            <footer className="flex flex-col justify-between gap-space-sm border-t border-surface-container bg-surface-container-low p-space-lg sm:flex-row sm:items-center">
              <button
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 font-label-md text-label-md text-on-primary transition-colors hover:bg-primary-container disabled:cursor-not-allowed disabled:opacity-50"
                disabled={!detailsApplication.has_proposal_document}
                onClick={() => {
                  setDocumentId(detailsApplication.id);
                  setDetailsId(null);
                }}
                type="button"
              >
                <Icon className="text-[18px]">picture_as_pdf</Icon>
                {detailsApplication.has_proposal_document ? 'View attached document' : 'No document attached'}
              </button>
              <div className="flex justify-end gap-2">
                <button
                  className="rounded-lg px-4 py-2 font-label-md text-label-md text-secondary hover:bg-surface-container"
                  onClick={() => setDetailsId(null)}
                  type="button"
                >
                  Close
                </button>
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

      {documentApplication && (
        <div
          aria-labelledby="application-document-title"
          aria-modal="true"
          className="fixed inset-0 z-[60] flex items-center justify-center bg-on-surface/70 p-space-md backdrop-blur-sm"
          onClick={() => setDocumentId(null)}
          role="dialog"
        >
          <section
            className="flex h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-xl bg-surface-container-lowest shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <header className="flex items-center justify-between gap-space-md border-b border-surface-container p-space-md">
              <div className="flex min-w-0 items-center gap-2">
                <Icon className="text-primary">picture_as_pdf</Icon>
                <h2 className="truncate font-headline-sm text-headline-sm font-bold text-on-surface" id="application-document-title">
                  {documentApplication.title} — attached proposal
                </h2>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <a
                  className="rounded-lg bg-surface-container-high px-3 py-2 font-label-sm text-label-sm text-on-surface hover:bg-surface-variant"
                  href={`/admin/activity-applications/${documentApplication.id}/document`}
                  rel="noreferrer"
                  target="_blank"
                >
                  Open in new tab
                </a>
                <button
                  aria-label="Close attached document"
                  className="rounded-lg p-2 text-secondary hover:bg-surface-container"
                  onClick={() => setDocumentId(null)}
                  type="button"
                >
                  <Icon>close</Icon>
                </button>
              </div>
            </header>
            <iframe
              className="min-h-0 flex-1 bg-surface-container"
              src={`/admin/activity-applications/${documentApplication.id}/document`}
              title={`Attached proposal for ${documentApplication.title}`}
            />
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
                disabled={rejectionReason.trim().length < 20 || isUpdating}
                type="submit"
              >
                <Icon className="text-[18px]">cancel</Icon>
                Confirm rejection
              </button>
            </div>
          </form>
        </div>
      )}
      {showChatbot && <Chatbot chatbot={chatbot} />}
    </AppLayout>
  );
}
