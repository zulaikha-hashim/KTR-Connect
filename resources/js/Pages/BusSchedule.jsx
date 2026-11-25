import { useRef, useState } from 'react';
import { router, useForm } from '@inertiajs/react';
import AppLayout from '../Components/AppLayout';

const navigationSections = [
  {
    title: 'Collegiate Administration',
    items: [
      {
        label: 'Activity Review & Approvals',
        icon: 'fact_check',
        path: 'activity-reviews-and-approvals',
        href: '/admin',
      },
      {
        label: 'Upload / Update Bus Schedule',
        icon: 'upload_file',
        path: 'bus-schedule',
        href: '/admin/bus-schedule',
        active: true,
      },
    ],
  },
];

const roles = [{ label: 'Admin: En. Razak', active: true }];
const profile = {
  name: 'En. Razak',
  description: 'Collegiate Administrator',
};
const MAX_SIZE = 10 * 1024 * 1024;

function Icon({ children }) {
  return <span className="material-symbols-outlined">{children}</span>;
}

export default function BusSchedule({
  schedule = null,
  sessions = [],
  selectedSession = '',
  hasUnassignedSchedules = false,
}) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [clientError, setClientError] = useState('');
  const [success, setSuccess] = useState('');
  const fileInputRef = useRef(null);

  const { setData, post, transform, processing, errors, reset, clearErrors, progress } = useForm({
    schedule: null,
    academic_session_id: '',
  });

  const chosenSession = sessions.find(
    (session) => String(session.id) === String(selectedSession)
  );
  const canUpload = Boolean(chosenSession);

  const handleSessionChange = (event) => {
    const sessionId = event.target.value;
    setSelectedFile(null);
    setClientError('');
    setSuccess('');
    reset();
    clearErrors();
    if (fileInputRef.current) fileInputRef.current.value = '';

    router.get('/admin/bus-schedule', { session: sessionId }, {
      preserveScroll: true,
      preserveState: false,
    });
  };

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];

    setClientError('');
    setSuccess('');
    setSelectedFile(null);
    setData('schedule', null);

    if (!file) return;

    if (file.type !== 'application/pdf' || !file.name.toLowerCase().endsWith('.pdf')) {
      setClientError('Please select a valid PDF file.');
      event.target.value = '';
      return;
    }

    if (file.size > MAX_SIZE) {
      setClientError('The PDF must be 10 MB or smaller.');
      event.target.value = '';
      return;
    }

    setSelectedFile(file);
    setData('schedule', file);
  };

  const submitUpload = (event) => {
    event.preventDefault();
    if (!selectedFile || !canUpload || processing) return;
    setSuccess('');
    setClientError('');
    transform((form) => ({
      ...form,
      academic_session_id: String(chosenSession.id),
    }));
    post('/admin/bus-schedule', {
      forceFormData: true,
      preserveScroll: true,
      onSuccess: () => {
        setSuccess('Bus schedule uploaded successfully!');
        setSelectedFile(null);
        reset();
        if (fileInputRef.current) fileInputRef.current.value = '';
      },
    });
  };

  return (
    <AppLayout
      navigationSections={navigationSections}
      roles={roles}
      profile={profile}
      sessionLabel={`Academic Session: ${chosenSession?.name ?? 'Not selected'}`}
    >
      <div className="mx-auto w-full max-w-[1400px] pb-space-xl">
        <header className="border-b border-surface-container py-space-lg">
          <p className="font-label-sm font-semibold uppercase tracking-wider text-primary">
            Residential Collegiate Administration
          </p>
          <h1 className="mt-2 font-headline-lg font-bold text-on-surface">
            Upload / Update Bus Schedule
          </h1>
          <p className="mt-2 text-on-surface-variant">
            Manage the official KTR bus schedule PDF by academic session.
          </p>
        </header>

        {success && (
          <div role="status" className="mt-5 flex items-center gap-3 rounded-xl bg-green-100 p-4 text-green-800">
            <Icon>check_circle</Icon>
            <span>{success}</span>
          </div>
        )}

        <section className="mt-6 rounded-xl bg-surface-container-lowest p-6 shadow-sm">
          <label htmlFor="academic-session" className="mb-2 block font-semibold text-on-surface">
            Academic Session
          </label>
          <select
            id="academic-session"
            value={String(selectedSession)}
            onChange={handleSessionChange}
            disabled={processing}
            className="w-full rounded-lg border border-surface-container bg-surface-container-low p-3 text-on-surface md:max-w-md"
          >
            {sessions.length === 0 && <option value="">No sessions available</option>}
            {sessions.map((session) => (
              <option key={session.id} value={String(session.id)}>
                {session.name}{session.is_current ? ' (Current)' : ''}
              </option>
            ))}
            {hasUnassignedSchedules && (
              <option value="unassigned">Unassigned (Older Uploads)</option>
            )}
          </select>
          {selectedSession === 'unassigned' && (
            <p className="mt-2 text-sm text-secondary">
              These older PDFs have not been assigned to an academic session. Select a year before uploading a replacement.
            </p>
          )}
        </section>

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <section className="rounded-xl bg-surface-container-lowest p-6 shadow-sm">
            <h2 className="mb-2 font-headline-sm font-bold text-on-surface">
              {schedule && canUpload ? 'Replace Schedule' : 'Upload New Schedule'}
            </h2>
            <p className="mb-6 text-sm text-on-surface-variant">
              {canUpload
                ? `Choose a PDF for ${chosenSession.name}. Only this session's schedule will be replaced.`
                : 'Choose an academic session before uploading a schedule.'}
            </p>

            <form onSubmit={submitUpload}>
              <label
                htmlFor="schedule-upload"
                className={`flex flex-col items-center gap-3 rounded-xl border-2 border-dashed border-primary/40 bg-surface-container-low p-8 text-center ${canUpload ? 'cursor-pointer' : 'cursor-not-allowed opacity-60'}`}
              >
                <Icon>upload_file</Icon>
                <span className="font-semibold text-on-surface">Click to select a PDF</span>
                <span className="text-sm text-secondary">PDF format only, maximum 10 MB</span>
              </label>
              <input
                ref={fileInputRef}
                id="schedule-upload"
                name="schedule"
                type="file"
                accept=".pdf,application/pdf"
                disabled={!canUpload || processing}
                onChange={handleFileChange}
                className="sr-only"
              />

              {selectedFile && (
                <div className="mt-4 rounded-lg bg-surface-container-low p-4">
                  <p className="break-all font-semibold text-on-surface">{selectedFile.name}</p>
                  <p className="text-sm text-secondary">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              )}

              {(clientError || errors.schedule || errors.academic_session_id) && (
                <p role="alert" className="mt-3 text-sm text-error">
                  {clientError || errors.schedule || errors.academic_session_id}
                </p>
              )}

              {progress && <p className="mt-3 text-sm text-secondary">Uploading: {progress.percentage}%</p>}

              <button
                type="submit"
                disabled={!selectedFile || !canUpload || processing}
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-5 py-3 font-semibold text-on-primary transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Icon>published_with_changes</Icon>
                {processing ? 'Uploading...' : (schedule ? 'Confirm & Replace Schedule' : 'Upload Schedule')}
              </button>
            </form>

            <p className="mt-4 text-sm text-secondary">
              The existing PDF for the selected session is replaced only after the new upload is saved. PDFs belonging to other sessions are preserved.
            </p>
          </section>

          <section className="rounded-xl bg-surface-container-lowest p-6 shadow-sm">
            <h2 className="mb-4 font-headline-sm font-bold text-on-surface">
              {selectedSession === 'unassigned' ? 'Unassigned Schedule' : `Published Schedule${chosenSession ? ` — ${chosenSession.name}` : ''}`}
            </h2>

            {schedule ? (
              <>
                <div className="mb-4 rounded-lg bg-surface-container-low p-4">
                  <div className="flex items-center gap-2">
                    <Icon>picture_as_pdf</Icon>
                    <p className="break-all font-semibold text-on-surface">{schedule.original_name}</p>
                  </div>
                  <p className="mt-2 text-sm text-secondary">Updated: {schedule.updated_at}</p>
                  <p className="text-sm text-secondary">
                    Size: {(schedule.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
                <iframe
                  key={schedule.url}
                  src={schedule.url}
                  title="Bus Schedule PDF"
                  className="h-[500px] w-full rounded-lg border border-surface-container"
                />
                <a
                  href={schedule.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 inline-flex items-center gap-2 font-semibold text-primary underline"
                >
                  <Icon>open_in_new</Icon>
                  Open PDF in New Tab
                </a>
              </>
            ) : (
              <div className="flex min-h-64 flex-col items-center justify-center rounded-xl bg-surface-container-low p-6 text-center">
                <Icon>description</Icon>
                <h3 className="mt-3 font-semibold text-on-surface">No Schedule Uploaded</h3>
                <p className="mt-2 text-sm text-secondary">
                  No bus schedule is available for this selection yet.
                </p>
              </div>
            )}
          </section>
        </div>
      </div>
    </AppLayout>
  );
}
