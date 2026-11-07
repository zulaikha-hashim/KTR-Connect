
import { useState } from 'react';
import { useForm } from '@inertiajs/react';
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

const roles = [
  { label: 'Admin: En. Razak', active: true },
];

const profile = {
  name: 'En. Razak',
  description: 'Collegiate Administrator',
};

const MAX_SIZE = 10 * 1024 * 1024;

function Icon({ children }) {
  return (
    <span className="material-symbols-outlined">
      {children}
    </span>
  );
}

export default function BusSchedule({ schedule }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [clientError, setClientError] = useState('');
  const [success, setSuccess] = useState('');

  const { setData, post, processing, errors, reset } = useForm({
    schedule: null,
  });

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];

    setClientError('');
    setSuccess('');
    setSelectedFile(null);
    setData('schedule', null);

    if (!file) return;

    if (
      file.type !== 'application/pdf' ||
      !file.name.toLowerCase().endsWith('.pdf')
    ) {
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

  const handleSubmit = (event) => {
    event.preventDefault();

    if (!selectedFile || processing) return;

    setSuccess('');

    post('/admin/bus-schedule', {
      forceFormData: true,
      preserveScroll: true,

      onSuccess: () => {
        setSuccess('Bus schedule updated successfully!');
        setSelectedFile(null);
        reset();
      },
    });
  };

  return (
    <AppLayout
      navigationSections={navigationSections}
      roles={roles}
      profile={profile}
      sessionLabel="Academic Session: Sem 1, 2026/2027"
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
            Manage the official KTR bus schedule PDF.
          </p>
        </header>

        {success && (
          <div
            role="status"
            className="mt-5 flex items-center gap-3 rounded-xl bg-green-100 p-4 text-green-800"
          >
            <Icon>check_circle</Icon>
            <span>{success}</span>
          </div>
        )}

        <div className="mt-6 grid gap-6 lg:grid-cols-2">

          {/* Upload Section */}
          <section className="rounded-xl bg-surface-container-lowest p-6 shadow-sm">
            <h2 className="mb-2 font-headline-sm font-bold text-on-surface">
              Upload New Schedule
            </h2>

            <p className="mb-6 text-sm text-on-surface-variant">
              Choose a PDF to replace the currently published bus schedule.
            </p>

            <form onSubmit={handleSubmit}>
              <label
                htmlFor="schedule-upload"
                className="flex cursor-pointer flex-col items-center gap-3 rounded-xl border-2 border-dashed border-primary/40 bg-surface-container-low p-8 text-center"
              >
                <Icon>upload_file</Icon>

                <span className="font-semibold text-on-surface">
                  Click to select a PDF
                </span>

                <span className="text-sm text-secondary">
                  PDF format only, maximum 10 MB
                </span>
              </label>

              <input
                id="schedule-upload"
                name="schedule"
                type="file"
                accept=".pdf,application/pdf"
                onChange={handleFileChange}
                className="sr-only"
              />

              {selectedFile && (
                <div className="mt-4 rounded-lg bg-surface-container-low p-4">
                  <p className="font-semibold text-on-surface">
                    {selectedFile.name}
                  </p>
                  <p className="text-sm text-secondary">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              )}

              {(clientError || errors.schedule) && (
                <p role="alert" className="mt-3 text-sm text-error">
                  {clientError || errors.schedule}
                </p>
              )}

              <button
                type="submit"
                disabled={!selectedFile || processing}
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-5 py-3 font-semibold text-on-primary transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Icon>published_with_changes</Icon>
                {processing
                  ? 'Uploading...'
                  : 'Confirm & Replace Schedule'}
              </button>
            </form>

            <p className="mt-4 text-sm text-secondary">
              The current schedule will only be replaced after
              the new upload is successfully saved.
            </p>
          </section>

          {/* Current Schedule Section */}
          <section className="rounded-xl bg-surface-container-lowest p-6 shadow-sm">
            <h2 className="mb-4 font-headline-sm font-bold text-on-surface">
              Current Published Schedule
            </h2>

            {schedule ? (
              <>
                <div className="mb-4 rounded-lg bg-surface-container-low p-4">
                  <div className="flex items-center gap-2">
                    <Icon>picture_as_pdf</Icon>
                    <p className="break-all font-semibold text-on-surface">
                      {schedule.original_name}
                    </p>
                  </div>

                  <p className="mt-2 text-sm text-secondary">
                    Updated: {schedule.updated_at}
                  </p>

                  <p className="text-sm text-secondary">
                    Size: {(schedule.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>

                <iframe
                  key={schedule.url}
                  src={schedule.url}
                  title="Current Bus Schedule PDF"
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

                <h3 className="mt-3 font-semibold text-on-surface">
                  No Schedule Uploaded
                </h3>

                <p className="mt-2 text-sm text-secondary">
                  Upload your first bus schedule to publish it here.
                </p>
              </div>
            )}
          </section>
        </div>
      </div>
    </AppLayout>
  );
}
