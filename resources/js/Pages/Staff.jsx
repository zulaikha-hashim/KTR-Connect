import { useEffect, useMemo, useState } from 'react';
import { useForm } from '@inertiajs/react';
import AppLayout from '../Components/AppLayout';

const staffNavigation = [
  {
    title: 'Student Resident',
    items: [
      { label: 'Merit & Room Eligibility', icon: 'verified', path: 'student-merit-and-room-eligibility', href: '#' },
      { label: 'Activity Directory & Details', icon: 'event_available', path: 'student-activity-directory', href: '#' },
    ],
  },
  {
    title: 'Felo & Staff Operations',
    items: [
      { label: 'Manage Activities', icon: 'post_add', path: 'manage-activities-and-proposals', href: '/', active: true },
      { label: 'Record Participation (CSV/Excel)', icon: 'upload_file', path: 'record-participation-upload', href: '#' },
      { label: 'Merit Status Reports', icon: 'summarize', path: 'staff-merit-analytics-reports', href: '#' },
    ],
  },
  {
    title: 'Collegiate Administration',
    items: [
      { label: 'Activity Review & Approvals', icon: 'fact_check', path: 'activity-reviews-and-approvals', href: '/admin' },
    ],
  },
];

const staffProfile = {
  name: 'Muhammad Afiq',
  description: 'A23CS0120 • Block TR-B04',
};

const filters = [
  { value: 'all', label: 'All' },
  { value: 'draft', label: 'Draft' },
  { value: 'pending', label: 'Pending Approval' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
];

const organizations = {
  jkm_sports: 'JKM Biro Sukan & Rekreasi',
  jkm_academic: 'JKM Biro Akademik & Kerjaya',
  jkm_cultural: 'JKM Biro Kebudayaan & Kesenian',
  jkm_welfare: 'JKM Biro Kebajikan & Kerohanian',
  felo_office: 'Pejabat Felo Kolej Tun Razak',
};

const meritTiers = {
  standard: 'Standard Tier',
  high_impact: 'High Impact Collegiate',
  trainer_special: 'Technical Facilitator Role',
};

const emptyForm = {
  activity_name: '',
  organization: '',
  start_at: '',
  end_at: '',
  venue: '',
  expected_turnout: '',
  committee_quota: '',
  participant_quota: '',
  merit_tier: '',
  merit_notes: '',
  proposal_document: null,
};

const statusStyles = {
  draft: 'bg-surface-container text-secondary',
  pending: 'bg-primary-fixed text-primary',
  approved: 'bg-tertiary-fixed text-tertiary',
  rejected: 'bg-error-container text-error',
};

function formatDate(value) {
  if (!value) return 'Not scheduled';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Not scheduled';

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

function getReference(application) {
  const year = application.created_at ? new Date(application.created_at).getFullYear() : new Date().getFullYear();
  const prefix = application.status === 'draft' ? 'DFT' : 'ACT';

  return `${prefix}-${year}-${String(application.id).padStart(3, '0')}`;
}

function FieldError({ message }) {
  return message ? <p className="font-body-sm text-body-sm text-error" role="alert">{message}</p> : null;
}

export default function Staff({ applications = [] }) {
  const [activeFilter, setActiveFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [isProposalModalOpen, setIsProposalModalOpen] = useState(false);
  const [toast, setToast] = useState('');
  const form = useForm(emptyForm);

  const filteredApplications = useMemo(() => {
    const query = search.trim().toLowerCase();

    return applications.filter((application) => {
      const matchesStatus = activeFilter === 'all' || application.status === activeFilter;
      const searchableText = [
        application.activity_name,
        application.organization && organizations[application.organization],
        application.venue,
        getReference(application),
      ].join(' ').toLowerCase();

      return matchesStatus && (!query || searchableText.includes(query));
    });
  }, [activeFilter, applications, search]);

  const countByStatus = (status) =>
    status === 'all'
      ? applications.length
      : applications.filter((application) => application.status === status).length;

  const openForm = () => {
    form.reset();
    form.clearErrors();
    setIsProposalModalOpen(true);
  };

  const closeForm = () => {
    if (!form.processing) setIsProposalModalOpen(false);
  };

  const saveApplication = (status) => {
    form.transform((data) => ({ ...data, status }));
    form.post('/activity-applications', {
      forceFormData: true,
      preserveScroll: true,
      onSuccess: () => {
        form.reset();
        setIsProposalModalOpen(false);
        setActiveFilter('all');
        setToast(status === 'draft' ? 'Activity application saved as a draft.' : 'Activity application submitted for approval.');
      },
    });
  };

  useEffect(() => {
    document.body.style.overflow = isProposalModalOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [isProposalModalOpen]);

  useEffect(() => {
    if (!toast) return undefined;

    const timeout = window.setTimeout(() => setToast(''), 5000);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  useEffect(() => {
    if (!isProposalModalOpen) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') closeForm();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isProposalModalOpen, form.processing]);

  const getFilterTabClass = (status) =>
    `filter-tab px-3.5 py-1.5 rounded-lg font-label-md text-label-md transition-colors ${
      activeFilter === status
        ? 'bg-primary text-on-primary shadow-sm'
        : 'text-secondary hover:bg-surface-container-high'
    }`;

  return (
    <AppLayout
      navigationSections={staffNavigation}
      profile={staffProfile}
      sessionLabel="Academic Session: Sem 1, 2026/2027"
    >
      <div className="flex w-full flex-col">
        {toast && (
          <div className="mb-space-lg flex items-center justify-between rounded-xl bg-tertiary p-space-md text-on-tertiary shadow-md" role="status" aria-live="polite">
            <div className="flex items-center gap-space-md">
              <span className="material-symbols-outlined">check_circle</span>
              <p className="font-label-lg text-label-lg">{toast}</p>
            </div>
            <button className="rounded-lg p-1 hover:bg-tertiary-container" onClick={() => setToast('')} aria-label="Dismiss notification">
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          </div>
        )}

        <section className="mb-space-xl flex flex-col justify-between gap-space-lg lg:flex-row lg:items-end">
          <div>
            <div className="mb-1 flex items-center gap-2">
              <span className="font-label-sm text-label-sm uppercase tracking-wider text-secondary">Felo Operations • Kolej Tun Razak</span>
              <span className="h-1 w-1 rounded-full bg-secondary" />
              <span className="font-code text-code font-semibold text-primary">Activity Applications</span>
            </div>
            <h1 className="font-display-lg text-display-lg tracking-tight text-on-surface">Manage Student Activities</h1>
            <p className="mt-1 font-body-md text-body-md text-secondary">Create activity proposals and track their approval status.</p>
          </div>
          <button
            className="flex h-10 items-center gap-2 rounded-lg bg-primary px-5 font-label-lg text-label-lg text-on-primary shadow-md transition-all hover:bg-primary-container"
            onClick={openForm}
          >
            <span className="material-symbols-outlined text-[20px]">add_box</span>
            Create New Activity Application
          </button>
        </section>

        <div className="mb-space-xl grid w-full grid-cols-1 gap-space-md sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: 'Total Applications', value: countByStatus('all'), icon: 'folder_special', tone: 'text-primary' },
            { label: 'Awaiting Approval', value: countByStatus('pending'), icon: 'pending_actions', tone: 'text-primary' },
            { label: 'Approved', value: countByStatus('approved'), icon: 'verified', tone: 'text-tertiary' },
            { label: 'Drafts', value: countByStatus('draft'), icon: 'save', tone: 'text-secondary' },
          ].map((metric) => (
            <div key={metric.label} className="flex items-center justify-between rounded-xl bg-surface-container-lowest p-space-lg shadow-sm">
              <div>
                <p className="font-label-sm text-label-sm uppercase tracking-wider text-secondary">{metric.label}</p>
                <span className={`mt-1 block font-headline-lg text-headline-lg font-bold ${metric.tone}`}>{metric.value}</span>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-surface-container">
                <span className={`material-symbols-outlined text-[26px] ${metric.tone}`}>{metric.icon}</span>
              </div>
            </div>
          ))}
        </div>

        <section className="flex w-full flex-col gap-space-md">
          <div className="flex flex-col justify-between gap-space-md rounded-xl bg-surface-container-lowest p-space-md shadow-sm md:flex-row md:items-center">
            <div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0">
              {filters.map((filter) => (
                <button key={filter.value} className={getFilterTabClass(filter.value)} onClick={() => setActiveFilter(filter.value)}>
                  {filter.label} <span className="ml-1 opacity-80">({countByStatus(filter.value)})</span>
                </button>
              ))}
            </div>
            <div className="relative w-full md:w-64">
              <span className="material-symbols-outlined absolute left-2.5 top-2.5 text-[18px] text-secondary">search</span>
              <input
                className="h-9 w-full rounded-lg bg-surface-container-low pl-9 pr-3 font-body-sm text-body-sm text-on-surface placeholder:text-secondary focus:bg-surface-container focus:outline-none"
                placeholder="Search applications..."
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                aria-label="Search activity applications"
              />
            </div>
          </div>

          <div className="flex flex-col overflow-hidden rounded-xl bg-surface-container-lowest shadow-sm">
            <div className="flex items-center justify-between p-space-lg">
              <div>
                <h2 className="font-headline-sm text-headline-sm text-on-surface">Registered Activity Applications</h2>
                <p className="font-body-sm text-body-sm text-secondary">Applications saved in the database.</p>
              </div>
              <span className="font-code text-code text-secondary">{filteredApplications.length} records</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left" id="proposals-table">
                <thead className="bg-surface-container-low font-label-sm text-label-sm uppercase tracking-wider text-secondary">
                  <tr>
                    <th className="px-space-lg py-3">Activity &amp; Proposer</th>
                    <th className="px-space-md py-3">Schedule &amp; Venue</th>
                    <th className="px-space-md py-3">Merit Allocation</th>
                    <th className="px-space-md py-3">Status</th>
                    <th className="px-space-lg py-3 text-right">Reference</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-container text-body-md">
                  {filteredApplications.map((application) => (
                    <tr key={application.id} className="transition-colors hover:bg-surface-container-low/50">
                      <td className="px-space-lg py-4">
                        <div className="font-label-lg text-label-lg text-on-surface">{application.activity_name || 'Untitled draft'}</div>
                        <div className="mt-0.5 font-body-sm text-body-sm text-secondary">
                          {organizations[application.organization] || 'Organization not selected'}
                        </div>
                      </td>
                      <td className="px-space-md py-4">
                        <div className="font-body-sm text-body-sm font-medium text-on-surface">
                          {application.start_at ? formatDate(application.start_at) : 'Not scheduled'}
                          {application.end_at ? ` – ${formatDate(application.end_at)}` : ''}
                        </div>
                        <div className="mt-0.5 font-body-sm text-body-sm text-secondary">{application.venue || 'Venue not set'}</div>
                      </td>
                      <td className="px-space-md py-4">
                        <div className="font-label-sm text-label-sm font-semibold text-primary">
                          {application.committee_quota ?? '—'} committee
                        </div>
                        <div className="font-label-sm text-label-sm text-secondary">
                          {application.participant_quota ?? '—'} participants
                        </div>
                      </td>
                      <td className="px-space-md py-4">
                        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-label-sm text-label-sm font-semibold ${statusStyles[application.status] || statusStyles.draft}`}>
                          <span className="h-1.5 w-1.5 rounded-full bg-current" />
                          {application.status === 'pending' ? 'Pending Approval' : `${application.status[0].toUpperCase()}${application.status.slice(1)}`}
                        </span>
                      </td>
                      <td className="px-space-lg py-4 text-right font-code text-code text-secondary">{getReference(application)}</td>
                    </tr>
                  ))}
                  {filteredApplications.length === 0 && (
                    <tr>
                      <td className="px-space-lg py-12 text-center font-body-md text-body-md text-secondary" colSpan="5">
                        {applications.length === 0
                          ? 'No activity applications yet. Create one to get started.'
                          : 'No applications match this filter or search.'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </div>

      {isProposalModalOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden" role="dialog" aria-modal="true" aria-labelledby="modal-title">
          <button className="fixed inset-0 h-full w-full cursor-default bg-on-surface/60 backdrop-blur-sm" onClick={closeForm} aria-label="Close application form" />
          <div className="fixed inset-y-0 right-0 flex max-w-full pl-10">
            <div className="relative z-10 flex w-screen max-w-2xl flex-col bg-surface-container-lowest shadow-2xl">
              <div className="flex flex-shrink-0 items-center justify-between border-b border-surface-container bg-surface-container-low px-space-xl py-space-lg">
                <div>
                  <div className="mb-0.5 flex items-center gap-2">
                    <span className="rounded bg-primary-fixed px-2 py-0.5 font-label-sm text-label-sm font-bold text-primary">Activity Application</span>
                  </div>
                  <h2 className="font-headline-md text-headline-md font-bold leading-tight text-on-surface" id="modal-title">New Activity Proposal</h2>
                  <p className="font-body-sm text-body-sm text-secondary">Enter activity details and submit for approval or save a draft.</p>
                </div>
                <button className="flex h-9 w-9 items-center justify-center rounded-lg text-secondary hover:bg-surface-container hover:text-on-surface" onClick={closeForm} aria-label="Close form">
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              <form className="flex-1 space-y-space-lg overflow-y-auto p-space-xl" id="activity-form" onSubmit={(event) => { event.preventDefault(); saveApplication('pending'); }}>
                {Object.keys(form.errors).length > 0 && (
                  <div className="rounded-lg bg-error-container p-space-md font-body-sm text-body-sm text-error" role="alert">
                    Please correct the highlighted fields before submitting.
                  </div>
                )}

                <section className="space-y-space-md border-b border-surface-container pb-space-lg">
                  <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface">Basic Activity Information</h3>
                  <div className="space-y-space-xs">
                    <label className="block font-label-md text-label-md font-semibold text-on-surface" htmlFor="activity_name">Activity Name / Program Title <span className="text-error">*</span></label>
                    <input id="activity_name" className="h-11 w-full rounded-lg bg-surface-container-low px-3.5 font-body-md text-body-md text-on-surface focus:bg-surface-container focus:outline-none" value={form.data.activity_name} onChange={(event) => form.setData('activity_name', event.target.value)} required />
                    <FieldError message={form.errors.activity_name} />
                  </div>

                  <div className="space-y-space-xs">
                    <label className="block font-label-md text-label-md font-semibold text-on-surface" htmlFor="organization">Proposing Organization / Bureau <span className="text-error">*</span></label>
                    <select id="organization" className="h-11 w-full rounded-lg bg-surface-container-low px-3.5 font-body-md text-body-md text-on-surface focus:outline-none" value={form.data.organization} onChange={(event) => form.setData('organization', event.target.value)} required>
                      <option value="">Select an organization</option>
                      {Object.entries(organizations).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                    </select>
                    <FieldError message={form.errors.organization} />
                  </div>

                  <div className="grid grid-cols-1 gap-space-md sm:grid-cols-2">
                    <div className="space-y-space-xs">
                      <label className="block font-label-md text-label-md font-semibold text-on-surface" htmlFor="start_at">Target Start Date &amp; Time <span className="text-error">*</span></label>
                      <input id="start_at" className="h-11 w-full rounded-lg bg-surface-container-low px-3 font-body-sm text-body-sm text-on-surface focus:outline-none" type="datetime-local" value={form.data.start_at} onChange={(event) => form.setData('start_at', event.target.value)} required />
                      <FieldError message={form.errors.start_at} />
                    </div>
                    <div className="space-y-space-xs">
                      <label className="block font-label-md text-label-md font-semibold text-on-surface" htmlFor="end_at">Target End Date &amp; Time <span className="text-error">*</span></label>
                      <input id="end_at" className="h-11 w-full rounded-lg bg-surface-container-low px-3 font-body-sm text-body-sm text-on-surface focus:outline-none" type="datetime-local" value={form.data.end_at} onChange={(event) => form.setData('end_at', event.target.value)} required />
                      <FieldError message={form.errors.end_at} />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-space-md sm:grid-cols-2">
                    <div className="space-y-space-xs">
                      <label className="block font-label-md text-label-md font-semibold text-on-surface" htmlFor="venue">Venue / Location <span className="text-error">*</span></label>
                      <input id="venue" className="h-11 w-full rounded-lg bg-surface-container-low px-3 font-body-md text-body-md text-on-surface focus:outline-none" value={form.data.venue} onChange={(event) => form.setData('venue', event.target.value)} required />
                      <FieldError message={form.errors.venue} />
                    </div>
                    <div className="space-y-space-xs">
                      <label className="block font-label-md text-label-md font-semibold text-on-surface" htmlFor="expected_turnout">Expected Turnout <span className="text-error">*</span></label>
                      <input id="expected_turnout" className="h-11 w-full rounded-lg bg-surface-container-low px-3 font-body-md text-body-md text-on-surface focus:outline-none" type="number" min="1" value={form.data.expected_turnout} onChange={(event) => form.setData('expected_turnout', event.target.value)} required />
                      <FieldError message={form.errors.expected_turnout} />
                    </div>
                  </div>
                </section>

                <section className="space-y-space-md border-b border-surface-container pb-space-lg">
                  <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface">Merit Allocation &amp; Quota</h3>
                  <div className="grid grid-cols-1 gap-space-md sm:grid-cols-2">
                    <div className="space-y-space-xs">
                      <label className="block font-label-md text-label-md font-semibold text-on-surface" htmlFor="committee_quota">Committee Quota <span className="text-error">*</span></label>
                      <input id="committee_quota" className="h-11 w-full rounded-lg bg-surface-container-low px-3 font-body-md text-body-md text-on-surface focus:outline-none" type="number" min="0" value={form.data.committee_quota} onChange={(event) => form.setData('committee_quota', event.target.value)} required />
                      <FieldError message={form.errors.committee_quota} />
                    </div>
                    <div className="space-y-space-xs">
                      <label className="block font-label-md text-label-md font-semibold text-on-surface" htmlFor="participant_quota">Participant Quota <span className="text-error">*</span></label>
                      <input id="participant_quota" className="h-11 w-full rounded-lg bg-surface-container-low px-3 font-body-md text-body-md text-on-surface focus:outline-none" type="number" min="0" value={form.data.participant_quota} onChange={(event) => form.setData('participant_quota', event.target.value)} required />
                      <FieldError message={form.errors.participant_quota} />
                    </div>
                  </div>
                  <div className="space-y-space-xs">
                    <label className="block font-label-md text-label-md font-semibold text-on-surface" htmlFor="merit_tier">Special Roles &amp; Merit Tier <span className="text-error">*</span></label>
                    <select id="merit_tier" className="h-11 w-full rounded-lg bg-surface-container-low px-3.5 font-body-md text-body-md text-on-surface focus:outline-none" value={form.data.merit_tier} onChange={(event) => form.setData('merit_tier', event.target.value)} required>
                      <option value="">Select a merit tier</option>
                      {Object.entries(meritTiers).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                    </select>
                    <FieldError message={form.errors.merit_tier} />
                  </div>
                  <div className="space-y-space-xs">
                    <label className="block font-label-md text-label-md font-semibold text-on-surface" htmlFor="merit_notes">Additional Merit Notes</label>
                    <textarea id="merit_notes" className="min-h-24 w-full rounded-lg bg-surface-container-low p-3 font-body-sm text-body-sm text-on-surface focus:outline-none" maxLength="2000" value={form.data.merit_notes} onChange={(event) => form.setData('merit_notes', event.target.value)} />
                    <FieldError message={form.errors.merit_notes} />
                  </div>
                </section>

                <section className="space-y-space-md">
                  <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface">Proposal Document (Optional)</h3>
                  <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-outline-variant bg-surface-container-low p-space-lg text-center transition-colors hover:bg-surface-container">
                    <span className="material-symbols-outlined mb-2 text-[28px] text-primary">cloud_upload</span>
                    <span className="font-label-md text-label-md font-semibold text-on-surface">Choose a proposal PDF</span>
                    <span className="font-body-sm text-body-sm text-secondary">PDF only, maximum 10 MB</span>
                    <input className="sr-only" type="file" accept="application/pdf,.pdf" onChange={(event) => form.setData('proposal_document', event.target.files?.[0] || null)} />
                  </label>
                  {form.data.proposal_document && (
                    <p className="font-body-sm text-body-sm text-secondary">{form.data.proposal_document.name}</p>
                  )}
                  <FieldError message={form.errors.proposal_document} />
                </section>
              </form>

              <div className="flex flex-shrink-0 flex-col justify-between gap-space-sm border-t border-surface-container bg-surface-container-low px-space-xl py-space-md sm:flex-row">
                <div className="flex gap-2">
                  <button className="flex h-10 items-center gap-1.5 rounded-lg bg-surface-container-high px-4 font-label-md text-label-md text-on-surface transition-colors hover:bg-surface-variant disabled:opacity-50" onClick={() => saveApplication('draft')} type="button" disabled={form.processing}>
                    <span className="material-symbols-outlined text-[18px]">save</span>
                    Save as Draft
                  </button>
                  <button className="h-10 rounded-lg px-4 font-label-md text-label-md text-secondary hover:bg-surface-container" onClick={closeForm} type="button" disabled={form.processing}>Cancel</button>
                </div>
                <button className="flex h-10 items-center justify-center gap-2 rounded-lg bg-primary px-5 font-label-md text-label-md text-on-primary shadow-md transition-colors hover:bg-primary-container disabled:opacity-50" form="activity-form" type="submit" disabled={form.processing}>
                  <span className="material-symbols-outlined text-[18px]">{form.processing ? 'progress_activity' : 'send'}</span>
                  Submit for Admin Approval
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
