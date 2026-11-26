import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useForm } from '@inertiajs/react';
import AppLayout from '../Components/AppLayout';

const VenueMap = lazy(() => import('../Components/VenueMap'));

const staffProfile = {
  name: 'Staff Name',
  description: 'S250002',
};

const filters = [
  { value: 'all', label: 'All' },
  { value: 'draft', label: 'Draft' },
  { value: 'pending', label: 'Pending' },
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

const emptyForm = {
  activity_name: '',
  director_name: '',
  academic_year: '2026/2027',
  semester: '1',
  organization: '',
  participant_quota: '',
  start_date: '',
  start_time: '',
  end_date: '',
  end_time: '',
  venue: '',
  google_sheet_url: '',
  remarks: '',
  latitude: '',
  longitude: '',
  proposal_documents: [],
};

const statusStyles = {
  draft: 'bg-surface-container text-secondary',
  pending: 'bg-amber-50 text-amber-800',
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

function toDateTimeLocal(value) {
  if (!value) return '';
  return String(value).replace(' ', 'T').slice(0, 16);
}

function getTodayDateTimeMinimum() {
  const localToday = new Date();
  localToday.setMinutes(localToday.getMinutes() - localToday.getTimezoneOffset());
  return `${localToday.toISOString().slice(0, 10)}T00:00`;
}

function getTodayDateMinimum() {
  const localToday = new Date();
  localToday.setMinutes(localToday.getMinutes() - localToday.getTimezoneOffset());
  return localToday.toISOString().slice(0, 10);
}

function splitDateTime(value) {
  if (!value) return { date: '', time: '' };
  const [date = '', time = ''] = toDateTimeLocal(value).split('T');
  return { date, time };
}

function combineDateTime(date, time) {
  return date && time ? `${date}T${time}` : '';
}

function getReference(application) {
  const year = application.created_at ? new Date(application.created_at).getFullYear() : new Date().getFullYear();
  const prefix = application.status === 'draft' ? 'DFT' : 'ACT';

  return `${prefix}-${year}-${String(application.id).padStart(3, '0')}`;
}

function FieldError({ message }) {
  return message ? <p className="font-body-sm text-body-sm text-error" role="alert">{message}</p> : null;
}

export default function ActivityApplication({ applications = [] }) {
  const [activeFilter, setActiveFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [clubFilter, setClubFilter] = useState('');
  const [sessionFilter, setSessionFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [directorFilter, setDirectorFilter] = useState('');
  const [isProposalModalOpen, setIsProposalModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [detailsId, setDetailsId] = useState(null);
  const [toast, setToast] = useState('');
  const [programType, setProgramType] = useState('one_day');
  const [venueLookupStatus, setVenueLookupStatus] = useState('');
  const [venueLookupError, setVenueLookupError] = useState('');
  const form = useForm(emptyForm);
  const venueAddressRef = useRef(form.data.venue);
  const venueLookupTimer = useRef(null);
  const venueLookupController = useRef(null);
  const editingApplication = applications.find(({ id }) => id === editingId);
  const detailsApplication = applications.find(({ id }) => id === detailsId);
  const venuePosition = useMemo(() => (
    form.data.latitude !== '' && form.data.longitude !== ''
      ? [Number(form.data.latitude), Number(form.data.longitude)]
      : null
  ), [form.data.latitude, form.data.longitude]);
  const todayDateMinimum = getTodayDateMinimum();

  const cancelVenueLookup = () => {
    window.clearTimeout(venueLookupTimer.current);
    venueLookupController.current?.abort();
    venueLookupTimer.current = null;
    venueLookupController.current = null;
  };

  const handleVenuePin = (latitude, longitude) => {
    cancelVenueLookup();
    const venueAtPin = venueAddressRef.current;
    form.setData((data) => ({
      ...data,
      latitude: latitude.toFixed(7),
      longitude: longitude.toFixed(7),
    }));
    setVenueLookupError('');
    setVenueLookupStatus('loading');

    venueLookupTimer.current = window.setTimeout(async () => {
      const controller = new AbortController();
      venueLookupController.current = controller;

      try {
        const query = new URLSearchParams({
          lat: String(latitude),
          lon: String(longitude),
          format: 'jsonv2',
        });
        const response = await fetch(`https://nominatim.openstreetmap.org/reverse?${query}`, {
          signal: controller.signal,
          headers: { Accept: 'application/json' },
        });
        if (!response.ok) throw new Error('Location lookup request failed.');

        const result = await response.json();
        if (!result.display_name) throw new Error('No address was found for this pin.');
        if (venueLookupController.current !== controller) return;

        if (venueAddressRef.current === venueAtPin) {
          venueAddressRef.current = result.display_name;
          form.setData('venue', result.display_name);
        }
        setVenueLookupStatus('complete');
      } catch (error) {
        if (error.name === 'AbortError' || venueLookupController.current !== controller) return;
        setVenueLookupStatus('');
        setVenueLookupError('Could not retrieve an address for this pin. You can enter the venue address manually.');
      }
    }, 1000);
  };

  useEffect(() => () => cancelVenueLookup(), []);

  const filteredApplications = useMemo(() => {
    const query = search.trim().toLowerCase();
    const directorQuery = directorFilter.trim().toLowerCase();

    return applications.filter((application) => {
      const matchesStatus = activeFilter === 'all' || application.status === activeFilter;
      const clubQuery = clubFilter.trim().toLowerCase();
      const matchesClub = !clubQuery
        || String(application.organization || '').toLowerCase().includes(clubQuery)
        || String(application.organization && organizations[application.organization] || '').toLowerCase().includes(clubQuery);
      const matchesSession = !sessionFilter
        || `${application.semester || ''}|${application.academic_year || ''}` === sessionFilter;
      const matchesDate = !dateFilter
        || String(application.start_at || '').slice(0, 10) === dateFilter;
      const matchesDirector = !directorQuery
        || String(application.director_name || '').toLowerCase().includes(directorQuery);
      const searchableText = [
        application.activity_name,
        application.organization,
        application.organization && organizations[application.organization],
        application.venue,
        application.director_name,
        application.academic_year,
        application.semester ? `Semester ${application.semester}` : '',
        getReference(application),
      ].join(' ').toLowerCase();

      return matchesStatus
        && matchesClub
        && matchesSession
        && matchesDate
        && matchesDirector
        && (!query || searchableText.includes(query));
    });
  }, [activeFilter, applications, search, clubFilter, sessionFilter, dateFilter, directorFilter]);

  const countByStatus = (status) =>
    status === 'all'
      ? applications.length
      : applications.filter((application) => application.status === status).length;

  const openForm = (application = null) => {
    if (application && !['draft', 'rejected'].includes(application.status)) return;

    cancelVenueLookup();
    setVenueLookupStatus('');
    setVenueLookupError('');
    form.clearErrors();
    setEditingId(application?.id ?? null);
    if (application) {
      venueAddressRef.current = application.venue || '';
      const start = splitDateTime(application.start_at);
      const end = splitDateTime(application.end_at);
      setProgramType(start.date && end.date && start.date !== end.date ? 'duration' : 'one_day');
      form.setData({
        activity_name: application.activity_name || '',
        director_name: application.director_name || '',
        academic_year: application.academic_year || '2026/2027',
        semester: application.semester ? String(application.semester) : '1',
        organization: organizations[application.organization] || application.organization || '',
        participant_quota: application.participant_quota ?? '',
        start_date: start.date,
        start_time: start.time,
        end_date: end.date,
        end_time: end.time,
        venue: application.venue || '',
        google_sheet_url: application.google_sheet_url || '',
        remarks: application.remarks || '',
        latitude: application.latitude ?? '',
        longitude: application.longitude ?? '',
        proposal_documents: [],
      });
    } else {
      venueAddressRef.current = '';
      setProgramType('one_day');
      form.reset();
    }
    setIsProposalModalOpen(true);
  };

  const closeForm = () => {
    if (!form.processing) {
      cancelVenueLookup();
      setIsProposalModalOpen(false);
      setEditingId(null);
    }
  };

  const saveApplication = (status) => {
    form.clearErrors('start_at', 'end_at');
    const startAt = combineDateTime(form.data.start_date, form.data.start_time);
    const endDate = programType === 'one_day' ? form.data.start_date : form.data.end_date;
    const endAt = combineDateTime(endDate, form.data.end_time);
    const dateErrors = {};
    if (startAt && startAt < getTodayDateTimeMinimum()) {
      dateErrors.start_at = 'The start date must be today or later.';
    }
    if (endAt && endAt < getTodayDateTimeMinimum()) {
      dateErrors.end_at = 'The end date must be today or later.';
    } else if (startAt && endAt && endAt < startAt) {
      dateErrors.end_at = 'The end date must be the same as or later than the start date.';
    }
    Object.entries(dateErrors).forEach(([field, message]) => form.setError(field, message));
    if (Object.keys(dateErrors).length > 0) return;

    const data = { ...form.data, end_date: endDate, start_at: startAt, end_at: endAt, status };
    if (editingApplication) data._method = 'patch';
    form.transform(() => data);
    form.post(editingApplication
      ? `/activity-applications/${editingApplication.id}`
      : '/activity-applications', {
      forceFormData: true,
      preserveScroll: true,
      onSuccess: () => {
        cancelVenueLookup();
        venueAddressRef.current = '';
        form.reset();
        setIsProposalModalOpen(false);
        setEditingId(null);
        setActiveFilter('all');
        setToast(editingApplication
          ? status === 'draft'
            ? 'Activity changes saved as a draft.'
            : 'Activity changes submitted for approval.'
          : status === 'draft'
            ? 'Activity application saved as a draft.'
            : 'Activity application submitted for approval.');
      },
    });
  };

  useEffect(() => {
    document.body.style.overflow = isProposalModalOpen || detailsApplication ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [isProposalModalOpen, detailsApplication]);

  useEffect(() => {
    if (!toast) return undefined;

    const timeout = window.setTimeout(() => setToast(''), 5000);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  useEffect(() => {
    if (!isProposalModalOpen && !detailsApplication) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        closeForm();
        setDetailsId(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isProposalModalOpen, detailsApplication, form.processing]);

  const getFilterTabClass = (status) =>
    `filter-tab px-3.5 py-1.5 rounded-lg font-label-md text-label-md transition-colors ${
      activeFilter === status
        ? 'bg-primary text-on-primary shadow-sm'
        : 'text-secondary hover:bg-surface-container-high'
    }`;

  return (
    <AppLayout
      profile={staffProfile}
      sessionLabel="Academic Session: Sem 1, 2026/2027"
    >
      <div className="flex w-full flex-col pb-space-xl">
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

        <section className="mb-space-xl flex flex-col justify-between gap-space-md border-b border-surface-container pb-space-md pt-space-lg xl:flex-row xl:items-center">
          <div>
            <div className="mb-1 flex flex-wrap items-center gap-2">
              <span className="font-label-sm text-label-sm font-semibold uppercase tracking-wider text-primary">
                Student's Activity Application Management
              </span>
            </div>
            <h1 className="font-headline-lg text-headline-lg font-bold tracking-tight text-on-surface">Student's Activities Applications</h1>
            <p className="mt-1 font-body-md text-body-md text-secondary">Create student's activity paperwork</p>
          </div>
          
          <button
            className="flex h-10 items-center gap-2 rounded-lg bg-primary px-5 font-label-lg text-label-lg text-on-primary shadow-md transition-all hover:bg-primary-container"
            onClick={() => openForm()}
            type="button"
          >
            <span className="material-symbols-outlined text-[20px]">add_box</span>
            Create New Activity Application
          </button>
        </section>

        <div className="mb-space-xl grid w-full grid-cols-1 gap-space-md sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: 'Total Applications', value: countByStatus('all'), icon: 'folder_special', tone: 'text-primary' },
            { label: 'Pending', value: countByStatus('pending'), icon: 'pending_actions', tone: 'text-primary' },
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

        <section className="w-full">
          <div className="flex flex-col overflow-hidden rounded-xl bg-surface-container-lowest shadow-sm">
            <div className="flex items-center justify-between p-space-lg">
              <div>
                <h2 className="font-headline-sm text-headline-sm text-on-surface">Registered Activity Applications</h2>
                <p className="font-body-sm text-body-sm text-secondary">Applications saved in the database.</p>
              </div>
              <span className="font-code text-code text-secondary">{filteredApplications.length} records</span>
            </div>
            <div className="flex flex-col gap-space-md border-y border-surface-container p-space-md">
              <div className="flex flex-col justify-between gap-space-md md:flex-row md:items-center">
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
              <div className="grid grid-cols-1 gap-space-sm sm:grid-cols-2 lg:grid-cols-4">
                <label className="space-y-1">
                  <span className="block font-label-sm text-label-sm font-semibold text-secondary">Club</span>
                  <input
                    className="h-9 w-full rounded-lg bg-surface-container-low px-3 font-body-sm text-body-sm text-on-surface focus:outline-none"
                    value={clubFilter}
                    onChange={(event) => setClubFilter(event.target.value)}
                    placeholder="Type club name"
                    type="text"
                  />
                </label>
                <label className="space-y-1">
                  <span className="block font-label-sm text-label-sm font-semibold text-secondary">Semester / Sesi</span>
                  <select
                    className="h-9 w-full rounded-lg bg-surface-container-low px-3 font-body-sm text-body-sm text-on-surface focus:outline-none"
                    value={sessionFilter}
                    onChange={(event) => setSessionFilter(event.target.value)}
                  >
                    <option value="">All semesters / sessions</option>
                    {[...new Map(applications
                      .filter((application) => application.semester || application.academic_year)
                      .map((application) => [
                        `${application.semester || ''}|${application.academic_year || ''}`,
                        {
                          value: `${application.semester || ''}|${application.academic_year || ''}`,
                          label: `${application.semester ? `Semester ${application.semester}` : 'Semester not set'}${application.academic_year ? ` - ${application.academic_year}` : ''}`,
                        },
                      ])).values()].map((session) => (
                        <option key={session.value} value={session.value}>{session.label}</option>
                      ))}
                  </select>
                </label>
                <label className="space-y-1">
                  <span className="block font-label-sm text-label-sm font-semibold text-secondary">Date</span>
                  <input
                    className="h-9 w-full rounded-lg bg-surface-container-low px-3 font-body-sm text-body-sm text-on-surface focus:outline-none"
                    type="date"
                    value={dateFilter}
                    onChange={(event) => setDateFilter(event.target.value)}
                  />
                </label>
                <label className="space-y-1">
                  <span className="block font-label-sm text-label-sm font-semibold text-secondary">Pengarah</span>
                  <input
                    className="h-9 w-full rounded-lg bg-surface-container-low px-3 font-body-sm text-body-sm text-on-surface placeholder:text-secondary focus:outline-none"
                    placeholder="Find by director..."
                    value={directorFilter}
                    onChange={(event) => setDirectorFilter(event.target.value)}
                  />
                </label>
              </div>
            </div>
            <div className="max-h-[26rem] overflow-auto">
              <table className="w-full text-left" id="paperwork-table">
                <thead className="sticky top-0 z-10 bg-surface-container-low font-label-sm text-label-sm uppercase tracking-wider text-secondary">
                  <tr>
                    <th className="px-space-lg py-3">Activity &amp; Proposer</th>
                    <th className="px-space-md py-3">Schedule &amp; Venue</th>
                    <th className="px-space-md py-3">Status</th>
                    <th className="px-space-md py-3">Reference</th>
                    <th className="px-space-lg py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-container text-body-md">
                  {filteredApplications.map((application) => (
                    <tr key={application.id} className="transition-colors hover:bg-surface-container-low/50">
                      <td className="px-space-lg py-4">
                        <div className="font-label-lg text-label-lg text-on-surface">{application.activity_name || 'Untitled draft'}</div>
                        <div className="mt-0.5 font-body-sm text-body-sm text-secondary">
                          {organizations[application.organization] || application.organization || 'Organization not selected'}
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
                        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-label-sm text-label-sm font-semibold ${statusStyles[application.status] || statusStyles.draft}`}>
                          <span className="h-1.5 w-1.5 rounded-full bg-current" />
                          {application.status === 'pending' ? 'Pending' : `${application.status[0].toUpperCase()}${application.status.slice(1)}`}
                        </span>
                      </td>
                      <td className="px-space-md py-4 font-code text-code text-secondary">{getReference(application)}</td>
                      <td className="px-space-lg py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            aria-label={`View details for ${application.activity_name || 'untitled application'}`}
                            className="rounded-lg bg-surface-container-high p-2 text-on-surface transition-colors hover:bg-surface-variant"
                            onClick={() => setDetailsId(application.id)}
                            title="View application details"
                            type="button"
                          >
                            <span className="material-symbols-outlined text-[18px]">visibility</span>
                          </button>
                          <button
                            aria-label={`Edit ${application.activity_name || 'untitled application'}`}
                            className="rounded-lg bg-surface-container-high p-2 text-primary transition-colors hover:bg-surface-variant disabled:cursor-not-allowed disabled:opacity-40"
                            disabled={!['draft', 'rejected'].includes(application.status)}
                            onClick={() => openForm(application)}
                            title={['draft', 'rejected'].includes(application.status) ? 'Edit application' : 'Only draft or rejected applications can be edited'}
                            type="button"
                          >
                            <span className="material-symbols-outlined text-[18px]">edit</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredApplications.length === 0 && (
                    <tr>
                      <td className="px-space-lg py-12 text-center font-body-md text-body-md text-secondary" colSpan="6">
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
                  Application {getReference(detailsApplication)}
                </p>
                <h2 className="mt-1 font-headline-md text-headline-md font-bold text-on-surface" id="application-details-title">
                  {detailsApplication.activity_name || 'Untitled draft'}
                </h2>
                <p className="font-body-sm text-body-sm text-secondary">
                  {organizations[detailsApplication.organization] || detailsApplication.organization || 'Organization not selected'}
                </p>
              </div>
              <button
                aria-label="Close application details"
                className="rounded-lg p-2 text-secondary hover:bg-surface-container"
                onClick={() => setDetailsId(null)}
                type="button"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </header>
            <div className="space-y-space-md p-space-lg">
              <div>
                <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 font-label-sm text-label-sm font-semibold ${statusStyles[detailsApplication.status] || statusStyles.draft}`}>
                  <span className="h-2 w-2 rounded-full bg-current" />
                  {detailsApplication.status === 'pending' ? 'Pending Review' : `${detailsApplication.status[0].toUpperCase()}${detailsApplication.status.slice(1)}`}
                </span>
              </div>
              <div className="grid gap-space-md sm:grid-cols-2">
              {[
                ['Director name', detailsApplication.director_name || 'Not provided'],
                ['Semester', detailsApplication.semester ? `Semester ${detailsApplication.semester}` : 'Not provided'],
                ['Sesi', detailsApplication.academic_year || 'Not provided'],
                ['Start', formatDate(detailsApplication.start_at)],
                ['End', formatDate(detailsApplication.end_at)],
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
                <p className="mt-1 break-words whitespace-pre-wrap font-body-md text-body-md font-semibold text-on-surface">
                  {detailsApplication.remarks || 'No remarks provided.'}
                </p>
              </div>
              {detailsApplication.review_notes && (
                <div className="rounded-lg bg-error-container p-space-md sm:col-span-2">
                  <p className="font-label-sm text-label-sm font-semibold text-error">Admin review notes</p>
                  <p className="mt-1 break-words whitespace-pre-wrap font-body-md text-body-md text-on-error-container">
                    {detailsApplication.review_notes}
                  </p>
                </div>
              )}
              </div>
            </div>
            <footer className="flex justify-end gap-2 border-t border-surface-container bg-surface-container-low p-space-lg">
              <Link
                className="mr-auto inline-flex items-center gap-2 rounded-lg bg-tertiary px-4 py-2 font-label-md text-label-md text-on-tertiary hover:brightness-95"
                href={`/activity-applications/${detailsApplication.id}/students`}
              >
                <span className="material-symbols-outlined text-[18px]">groups</span>
                List of Students
              </Link>
              <button
                className="rounded-lg px-4 py-2 font-label-md text-label-md text-secondary hover:bg-surface-container"
                onClick={() => setDetailsId(null)}
                type="button"
              >
                Close
              </button>
              <button
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 font-label-md text-label-md text-on-primary disabled:cursor-not-allowed disabled:opacity-40"
                disabled={!['draft', 'rejected'].includes(detailsApplication.status)}
                onClick={() => {
                  setDetailsId(null);
                  openForm(detailsApplication);
                }}
                title={['draft', 'rejected'].includes(detailsApplication.status) ? 'Edit application' : 'Only draft or rejected applications can be edited'}
                type="button"
              >
                <span className="material-symbols-outlined text-[18px]">edit</span>
                Edit application
              </button>
            </footer>
          </section>
        </div>
      )}

      {isProposalModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto p-space-md" role="dialog" aria-modal="true" aria-labelledby="modal-title">
          <button className="fixed inset-0 h-full w-full cursor-default bg-on-surface/60 backdrop-blur-sm" onClick={closeForm} aria-label="Close application form" />
          <div className="relative z-10 flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-xl bg-surface-container-lowest shadow-2xl">
              <div className="flex flex-shrink-0 items-center justify-between border-b border-surface-container bg-surface-container-low px-space-xl py-space-lg">
                <div>
                  <div className="mb-0.5 flex items-center gap-2">
                    <span className="rounded bg-primary-fixed px-2 py-0.5 font-label-sm text-label-sm font-bold text-primary">Activity Application</span>
                  </div>
                  <h2 className="font-headline-md text-headline-md font-bold leading-tight text-on-surface" id="modal-title">{editingApplication ? 'Edit Activity Paperwork' : 'New Activity Paperwork'}</h2>
                  <p className="font-body-sm text-body-sm text-secondary">
                    {editingApplication?.status === 'rejected'
                      ? 'Update the rejected application and resubmit it for approval.'
                      : 'Enter activity details and submit for approval or save a draft.'}
                  </p>
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

                {editingApplication?.status === 'rejected' && editingApplication.review_notes && (
                  <div className="rounded-lg bg-error-container p-space-md">
                    <p className="font-label-md text-label-md font-semibold text-error">Admin rejection reason</p>
                    <p className="mt-1 whitespace-pre-wrap font-body-md text-body-md text-on-error-container">
                      {editingApplication.review_notes}
                    </p>
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
                    <label className="block font-label-md text-label-md font-semibold text-on-surface" htmlFor="director_name">Director Name <span className="text-error">*</span></label>
                    <input id="director_name" className="h-11 w-full rounded-lg bg-surface-container-low px-3.5 font-body-md text-body-md text-on-surface focus:bg-surface-container focus:outline-none" value={form.data.director_name} onChange={(event) => form.setData('director_name', event.target.value)} required />
                    <FieldError message={form.errors.director_name} />
                  </div>

                  <div className="grid grid-cols-1 gap-space-md sm:grid-cols-2">
                    <div className="space-y-space-xs">
                      <label className="block font-label-md text-label-md font-semibold text-on-surface" htmlFor="semester">Semester <span className="text-error">*</span></label>
                      <select id="semester" className="h-11 w-full rounded-lg bg-surface-container-low px-3.5 font-body-md text-body-md text-on-surface focus:outline-none" value={form.data.semester} onChange={(event) => form.setData('semester', event.target.value)} required>
                        <option value="1">Semester 1</option>
                        <option value="2">Semester 2</option>
                      </select>
                      <FieldError message={form.errors.semester} />
                    </div>
                    <div className="space-y-space-xs">
                      <label className="block font-label-md text-label-md font-semibold text-on-surface" htmlFor="academic_year">Sesi <span className="text-error">*</span></label>
                      <input id="academic_year" className="h-11 w-full rounded-lg bg-surface-container-low px-3.5 font-body-md text-body-md text-on-surface focus:bg-surface-container focus:outline-none" value={form.data.academic_year} onChange={(event) => form.setData('academic_year', event.target.value)} placeholder="2026/2027" required />
                      <FieldError message={form.errors.academic_year} />
                    </div>
                  </div>

                  <div className="space-y-space-xs">
                    <label className="block font-label-md text-label-md font-semibold text-on-surface" htmlFor="organization">Club Name <span className="text-error">*</span></label>
                    <input id="organization" className="h-11 w-full rounded-lg bg-surface-container-low px-3.5 font-body-md text-body-md text-on-surface focus:bg-surface-container focus:outline-none" value={form.data.organization} onChange={(event) => form.setData('organization', event.target.value)} placeholder="Enter club name" type="text" required />
                    <FieldError message={form.errors.organization} />
                  </div>

                  <div className="space-y-space-xs">
                    <label className="block font-label-md text-label-md font-semibold text-on-surface" htmlFor="participant_quota">Target Total Student Involvement <span className="text-error">*</span></label>
                    <p className="font-body-sm text-body-sm text-secondary">Include MT, crew, participants, and volunteers in the total.</p>
                    <input id="participant_quota" className="h-11 w-full rounded-lg bg-surface-container-low px-3.5 font-body-md text-body-md text-on-surface focus:bg-surface-container focus:outline-none" value={form.data.participant_quota} onChange={(event) => form.setData('participant_quota', event.target.value)} placeholder="Enter target student involvement" type="number" min="1" step="1" required />
                    <FieldError message={form.errors.participant_quota} />
                  </div>

                  <fieldset className="space-y-space-xs">
                    <legend className="font-label-md text-label-md font-semibold text-on-surface">Program Type</legend>
                    <div className="flex flex-wrap gap-space-md">
                      <label className="flex items-center gap-2 font-body-md text-body-md text-on-surface">
                        <input
                          type="radio"
                          name="program_type"
                          value="one_day"
                          checked={programType === 'one_day'}
                          onChange={() => setProgramType('one_day')}
                          className="accent-primary"
                        />
                        One day program
                      </label>
                      <label className="flex items-center gap-2 font-body-md text-body-md text-on-surface">
                        <input
                          type="radio"
                          name="program_type"
                          value="duration"
                          checked={programType === 'duration'}
                          onChange={() => setProgramType('duration')}
                          className="accent-primary"
                        />
                        Duration program
                      </label>
                    </div>
                  </fieldset>

                  <div className={`grid grid-cols-1 gap-space-md ${programType === 'duration' ? 'sm:grid-cols-2' : ''}`}>
                    <div className="space-y-space-xs">
                      <label className="block font-label-md text-label-md font-semibold text-on-surface" htmlFor="start_date">Target Start Date <span className="text-error">*</span></label>
                      <input id="start_date" className="h-11 w-full rounded-lg bg-surface-container-low px-3 font-body-sm text-body-sm text-on-surface focus:outline-none" type="date" min={todayDateMinimum} value={form.data.start_date} onChange={(event) => {
                        form.clearErrors('start_at', 'end_at');
                        form.setData((data) => ({ ...data, start_date: event.target.value }));
                      }} required />
                    </div>
                    {programType === 'duration' && (
                      <div className="space-y-space-xs">
                        <label className="block font-label-md text-label-md font-semibold text-on-surface" htmlFor="end_date">Target End Date <span className="text-error">*</span></label>
                        <input id="end_date" className="h-11 w-full rounded-lg bg-surface-container-low px-3 font-body-sm text-body-sm text-on-surface focus:outline-none" type="date" min={form.data.start_date || todayDateMinimum} value={form.data.end_date} onChange={(event) => {
                          form.clearErrors('start_at', 'end_at');
                          form.setData((data) => ({ ...data, end_date: event.target.value }));
                        }} required />
                      </div>
                    )}
                  </div>
                  <FieldError message={form.errors.start_at} />

                  <div className="grid grid-cols-1 gap-space-md sm:grid-cols-2">
                    <div className="space-y-space-xs">
                      <label className="block font-label-md text-label-md font-semibold text-on-surface" htmlFor="start_time">Target Start Time <span className="text-error">*</span></label>
                      <input id="start_time" className="h-11 w-full rounded-lg bg-surface-container-low px-3 font-body-sm text-body-sm text-on-surface focus:outline-none" type="time" value={form.data.start_time} onChange={(event) => {
                        form.clearErrors('start_at', 'end_at');
                        form.setData((data) => ({ ...data, start_time: event.target.value }));
                      }} required />
                    </div>
                    <div className="space-y-space-xs">
                      <label className="block font-label-md text-label-md font-semibold text-on-surface" htmlFor="end_time">Target End Time <span className="text-error">*</span></label>
                      <input id="end_time" className="h-11 w-full rounded-lg bg-surface-container-low px-3 font-body-sm text-body-sm text-on-surface focus:outline-none" type="time" value={form.data.end_time} onChange={(event) => {
                        form.clearErrors('start_at', 'end_at');
                        form.setData((data) => ({ ...data, end_time: event.target.value }));
                      }} required />
                    </div>
                  </div>
                  <FieldError message={form.errors.end_at} />

                  <div className="space-y-space-xs">
                    <p className="font-label-md text-label-md font-semibold text-on-surface">Pin the venue on the map <span className="text-error">*</span></p>
                    <Suspense fallback={<div className="h-72 animate-pulse rounded-lg bg-surface-container" role="status">Loading map...</div>}>
                      <VenueMap
                        onPin={handleVenuePin}
                        position={venuePosition}
                      />
                    </Suspense>
                    <p className="font-body-sm text-body-sm text-secondary">Click the map to place or move the pin.</p>
                    {venueLookupStatus === 'loading' && (
                      <p className="font-body-sm text-body-sm text-secondary" role="status">Retrieving the pinned location...</p>
                    )}
                    {venueLookupStatus === 'complete' && (
                      <p className="font-body-sm text-body-sm text-tertiary" role="status">Pinned location retrieved.</p>
                    )}
                    {venueLookupError && <p className="font-body-sm text-body-sm text-error" role="alert">{venueLookupError}</p>}
                    <FieldError message={form.errors.latitude || form.errors.longitude} />
                  </div>
                  <div className="space-y-space-xs">
                    <label className="block font-label-md text-label-md font-semibold text-on-surface" htmlFor="venue">Full venue address <span className="text-error">*</span></label>
                    <textarea id="venue" className="min-h-20 w-full rounded-lg bg-surface-container-low p-3 font-body-md text-body-md text-on-surface focus:outline-none" value={form.data.venue} onChange={(event) => {
                      venueAddressRef.current = event.target.value;
                      setVenueLookupError('');
                      form.setData('venue', event.target.value);
                    }} required />
                    <FieldError message={form.errors.venue} />
                  </div>
                  <div className="space-y-space-xs">
                    <label className="block font-label-md text-label-md font-semibold text-on-surface" htmlFor="remarks">Remarks <span className="font-body-sm font-normal text-secondary">(Optional)</span></label>
                    <textarea id="remarks" className="min-h-24 w-full rounded-lg bg-surface-container-low p-3 font-body-md text-body-md text-on-surface focus:bg-surface-container focus:outline-none focus:ring-2 focus:ring-primary/20" value={form.data.remarks} onChange={(event) => form.setData('remarks', event.target.value)} placeholder="Add any additional information about this activity..." maxLength={2000} />
                    <FieldError message={form.errors.remarks} />
                  </div>
                </section>

                <section className="space-y-space-md">
                  <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface">Paperwork Document</h3>
                  <div className="rounded-xl border-2 border-dashed border-outline-variant bg-surface-container-low p-space-lg">
                    <div className="mb-3 flex items-center gap-3">
                      <span className="material-symbols-outlined text-[28px] text-primary">cloud_upload</span>
                      <div>
                        <p className="font-label-md text-label-md font-semibold text-on-surface">Choose a paperwork PDF</p>
                        <p className="font-body-sm text-body-sm text-secondary">
                          Optional, maximum 3 PDF files per application and 10 MB each.
                          {editingApplication?.paperwork_document_count > 0
                            ? ` ${editingApplication.paperwork_document_count} already uploaded.`
                            : ''}
                        </p>
                      </div>
                    </div>
                    <input
                      className="block w-full rounded-lg border border-outline-variant bg-surface-container-lowest p-2 font-body-sm text-body-sm text-on-surface file:mr-3 file:rounded-md file:border-0 file:bg-primary file:px-3 file:py-2 file:font-label-sm file:text-label-sm file:text-on-primary"
                      type="file"
                      accept=".pdf,application/pdf"
                      multiple
                      disabled={Boolean(editingApplication && editingApplication.paperwork_document_count >= 3)}
                      onChange={(event) => {
                        const files = Array.from(event.currentTarget.files || []);
                        const remainingSlots = editingApplication
                          ? Math.max(0, 3 - (editingApplication.paperwork_document_count || 0))
                          : 3;
                        form.clearErrors('proposal_documents');

                        if (!files.length) {
                          form.setData('proposal_documents', []);
                          return;
                        }

                        if (files.length > remainingSlots) {
                          event.currentTarget.value = '';
                          form.setData('proposal_documents', []);
                          form.setError('proposal_documents', `You can add up to ${remainingSlots} more PDF file${remainingSlots === 1 ? '' : 's'} to this application.`);
                          return;
                        }

                        const invalidFile = files.find((file) => (
                          !(file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf'))
                          || file.size > 10 * 1024 * 1024
                        ));

                        if (invalidFile) {
                          event.currentTarget.value = '';
                          form.setData('proposal_documents', []);
                          form.setError(
                            'proposal_documents',
                            invalidFile.size > 10 * 1024 * 1024
                              ? `${invalidFile.name} exceeds the 10 MB file limit.`
                              : `${invalidFile.name} is not a PDF file.`,
                          );
                          return;
                        }

                        form.setData('proposal_documents', files);
                      }}
                    />
                  </div>
                  {form.data.proposal_documents.length > 0 && (
                    <ul className="space-y-1 font-body-sm text-body-sm text-secondary">
                      {form.data.proposal_documents.map((file) => (
                        <li key={`${file.name}-${file.lastModified}`}>{file.name}</li>
                      ))}
                    </ul>
                  )}
                  <FieldError message={form.errors.proposal_documents || form.errors['proposal_documents.0']} />
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
                  {editingApplication?.status === 'rejected' ? 'Resubmit for Admin Approval' : 'Submit for Admin Approval'}
                </button>
              </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
