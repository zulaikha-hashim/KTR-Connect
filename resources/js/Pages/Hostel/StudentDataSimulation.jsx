import { Head, router, useForm } from '@inertiajs/react';
import { useEffect } from 'react';
import AppLayout from '../../Components/AppLayout';

const profile = {
  name: 'Simulation Preview',
  description: 'Local development',
};

const buttonClass =
  'rounded-lg border border-slate-300 px-4 py-2 text-sm ' +
  'font-medium text-[#7A1C2D] hover:bg-slate-50 ' +
  'disabled:cursor-not-allowed disabled:opacity-50';

function formatTime(value) {
  if (!value) return 'Not imported';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return '—';

  return new Intl.DateTimeFormat('en-MY', {
    timeZone: 'Asia/Kuala_Lumpur',
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

function StudentTable({ students, imported = false }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[700px] text-left text-sm">
        <caption className="sr-only">
          {imported
            ? 'Simulated students imported into KTR-Connect'
            : 'Students in the mock university source'}
        </caption>

        <thead className="bg-slate-50 text-xs uppercase text-slate-600">
          <tr>
            {[
              'Matric number',
              'Full name',
              'Faculty',
              'Gender',
              ...(imported ? ['Last imported (MYT)'] : []),
            ].map((heading) => (
              <th
                key={heading}
                scope="col"
                className="px-4 py-3"
              >
                {heading}
              </th>
            ))}
          </tr>
        </thead>

        <tbody className="divide-y divide-slate-100">
          {students.map((student) => (
            <tr key={student.matric_number}>
              <td className="px-4 py-4 font-medium">
                {student.matric_number}
              </td>

              <td className="px-4 py-4">
                {student.full_name || 'Not provided'}
              </td>

              <td className="px-4 py-4">
                {student.faculty}
              </td>

              <td className="px-4 py-4 capitalize">
                {student.gender}
              </td>

              {imported && (
                <td className="px-4 py-4">
                  {formatTime(student.synced_at)}
                </td>
              )}
            </tr>
          ))}

          {students.length === 0 && (
            <tr>
              <td
                colSpan={imported ? 5 : 4}
                className="px-4 py-8 text-center text-slate-500"
              >
                {imported
                  ? 'No simulated students have been imported yet.'
                  : 'No valid source preview is available.'}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export default function StudentDataSimulation({
  preview = null,
  sourceErrors = [],
  students = [],
  importResult = null,
}) {
  const {
    data,
    setData,
    post,
    processing,
    errors,
  } = useForm({
    source_hash: preview?.hash ?? '',
  });

  useEffect(() => {
    setData('source_hash', preview?.hash ?? '');
  }, [preview?.hash]);

  function importStudents(event) {
    event.preventDefault();

    if (!preview || processing) return;

    post('/admin/hostel/simulation/students/import', {
      preserveScroll: true,
    });
  }

  function refreshPreview() {
    router.get(
      '/admin/hostel/simulation/students',
      {},
      {
        preserveState: false,
        preserveScroll: true,
      }
    );
  }

  return (
    <AppLayout
      profile={profile}
      sessionLabel="Mock university student-data source"
    >
      <Head title="Student Data Simulation" />

      <div className="mx-auto max-w-[1600px] py-6">
        <header className="mb-6">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#7A1C2D]">
            Hostel Management · Development Simulation
          </p>

          <h1 className="text-2xl font-bold text-slate-900">
            Student Data Simulation
          </h1>

          <p className="mt-2 text-sm text-slate-600">
            Preview fictional university student records and import
            them into KTR-Connect.
          </p>
        </header>

        <p className="mb-6 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          This page simulates an external student-data import.
          It is not connected to UTMDigital. Importing students
          does not assign beds or create bookings.
        </p>

        <section
          aria-label="Simulation summary"
          className="mb-6 grid gap-4 sm:grid-cols-2"
        >
          {[
            ['Students in source preview', preview?.total ?? '—'],
            ['Imported simulated students', students.length],
          ].map(([label, value]) => (
            <div
              key={label}
              className="rounded-xl border border-slate-200 bg-white p-5"
            >
              <p className="text-sm text-slate-500">
                {label}
              </p>

              <p className="mt-2 text-3xl font-bold text-slate-900">
                {value}
              </p>
            </div>
          ))}
        </section>

        {importResult && (
          <div
            role="status"
            className="mb-6 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900"
          >
            <p className="font-semibold">
              Import completed
            </p>

            <p className="mt-1">
              Created: {importResult.created}
              {' · '}
              Updated: {importResult.updated}
              {' · '}
              Unchanged: {importResult.unchanged}
              {' · '}
              Total processed: {importResult.total}
            </p>
          </div>
        )}

        {Object.keys(errors).length > 0 && (
          <div
            role="alert"
            className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800"
          >
            <p className="mb-2 font-semibold">
              Import was not completed
            </p>

            {Object.entries(errors).map(([field, message]) => (
              <p key={field}>{message}</p>
            ))}
          </div>
        )}

        {sourceErrors.length > 0 && (
          <div
            role="alert"
            className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800"
          >
            <p className="mb-2 font-semibold">
              Fix the source file, then refresh the preview.
            </p>

            {sourceErrors.map((message, index) => (
              <p key={index}>{message}</p>
            ))}
          </div>
        )}

        <section className="mb-6 overflow-hidden rounded-xl border border-slate-200 bg-white">
          <div className="border-b border-slate-200 p-4">
            <h2 className="font-semibold text-slate-900">
              Mock University Source Preview
            </h2>

            <p className="mt-1 text-sm text-slate-600">
              These are source-file records. Previewing them does
              not save changes to the database.
            </p>
          </div>

          <StudentTable students={preview?.students ?? []} />

          <form
            onSubmit={importStudents}
            className="flex flex-wrap gap-3 border-t border-slate-200 p-4"
          >
            <button
              type="button"
              disabled={processing}
              onClick={refreshPreview}
              className={buttonClass}
            >
              Refresh Preview
            </button>

            <button
              type="submit"
              disabled={
                !preview
                || !data.source_hash
                || processing
              }
              className="rounded-lg bg-[#7A1C2D] px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              {processing
                ? 'Importing…'
                : 'Import Student Data'}
            </button>
          </form>
        </section>

        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <div className="border-b border-slate-200 p-4">
            <h2 className="font-semibold text-slate-900">
              Imported KTR Student Records
            </h2>

            <p className="mt-1 text-sm text-slate-600">
              Records saved in the local database from the mock
              source. Re-importing matches existing students by
              matric number.
            </p>
          </div>

          <StudentTable students={students} imported />
        </section>
      </div>
    </AppLayout>
  );
}