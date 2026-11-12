import { Head, Link, router, useForm } from '@inertiajs/react';
import { useEffect } from 'react';
import AppLayout from '../../Components/AppLayout';

const navigation = [
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
        active: true,
      },
    ],
  },
  {
    title: 'Administration',
    items: [
      {
        label: 'Activity Review & Approvals',
        icon: 'fact_check',
        path: 'activity-reviews-and-approvals',
        href: '/admin',
      },
    ],
  },
];

const profile = {
  name: 'Admin Interface Preview',
  description: 'Local development',
};

const controlClass =
  'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 ' +
  'text-sm text-slate-800 focus:outline-none focus:ring-2 ' +
  'focus:ring-[#7A1C2D]';

const buttonClass =
  'rounded-lg border border-slate-300 px-4 py-2 text-sm ' +
  'font-medium text-[#7A1C2D] hover:bg-slate-50';

function formatTime(value) {
  if (!value) return '—';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return '—';

  return new Intl.DateTimeFormat('en-MY', {
    timeZone: 'Asia/Kuala_Lumpur',
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).format(date);
}

function stateLabel(value) {
  if (value === 'available') return 'Available';
  if (value === 'unavailable') return 'Unavailable';
  return value || '—';
}

export default function AdminActivityHistory({
  logs,
  academicSessions = [],
  filters,
}) {
  const {
    data,
    setData,
    get,
    processing,
    errors,
  } = useForm({
    session: filters.session,
    action: filters.action,
    search: filters.search,
  });

  useEffect(() => {
    setData({
      session: filters.session,
      action: filters.action,
      search: filters.search,
    });
  }, [filters.session, filters.action, filters.search]);

  const selectedSession = academicSessions.find(
    (session) => String(session.id) === filters.session
  );

  function applyFilters(event) {
    event.preventDefault();

    get('/admin/hostel/activity-history', {
      preserveState: true,
      preserveScroll: true,
    });
  }

  function clearFilters() {
    router.get(
      '/admin/hostel/activity-history',
      {},
      {
        preserveState: false,
        preserveScroll: true,
      }
    );
  }

  return (
    <AppLayout
      navigationSections={navigation}
      profile={profile}
      sessionLabel={
        selectedSession
          ? `History scope: ${selectedSession.name}`
          : 'History scope: All academic sessions'
      }
    >
      <Head title="Hostel Activity History" />

      <div className="mx-auto max-w-[1600px] py-6">
        <header className="mb-6">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#7A1C2D]">
            Hostel Management
          </p>

          <h1 className="text-2xl font-bold text-slate-900">
            Activity History
          </h1>

          <p className="mt-2 text-sm text-slate-600">
            Review recorded bed restrictions and restorations.
            All timestamps are shown in Malaysia time (UTC+8).
          </p>
        </header>

        <p className="mb-6 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          Local development preview. History includes demo records.
          Session filters include global maintenance events.
          Records are displayed for review and cannot be edited here.
        </p>

        <form
          onSubmit={applyFilters}
          className="mb-6 rounded-xl border border-slate-200 bg-white p-4"
        >
          <fieldset disabled={processing}>
            <legend className="sr-only">
              Activity history filters
            </legend>

            <div className="grid gap-4 md:grid-cols-3">
              <label className="flex flex-col gap-1 text-sm text-slate-600">
                <span>Academic session</span>

                <select
                  className={controlClass}
                  value={data.session}
                  onChange={(event) =>
                    setData('session', event.target.value)
                  }
                >
                  <option value="">All sessions</option>

                  {academicSessions.map((session) => (
                    <option
                      key={session.id}
                      value={String(session.id)}
                    >
                      {session.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="flex flex-col gap-1 text-sm text-slate-600">
                <span>Action</span>

                <select
                  className={controlClass}
                  value={data.action}
                  onChange={(event) =>
                    setData('action', event.target.value)
                  }
                >
                  <option value="">All actions</option>
                  <option value="restricted">Restricted</option>
                  <option value="restored">Restored</option>
                </select>
              </label>

              <label className="flex flex-col gap-1 text-sm text-slate-600">
                <span>Room number</span>

                <input
                  type="search"
                  className={controlClass}
                  placeholder="e.g. K11-04-468"
                  maxLength={100}
                  value={data.search}
                  onChange={(event) =>
                    setData('search', event.target.value)
                  }
                />
              </label>
            </div>

            <div className="mt-4 flex flex-wrap gap-3">
              <button
                type="submit"
                className="rounded-lg bg-[#7A1C2D] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
              >
                {processing ? 'Loading…' : 'Apply Filters'}
              </button>

              <button
                type="button"
                onClick={clearFilters}
                className={buttonClass}
              >
                Clear Filters
              </button>
            </div>
          </fieldset>

          {Object.keys(errors).length > 0 && (
            <div
              role="alert"
              className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-800"
            >
              {Object.entries(errors).map(([field, message]) => (
                <p key={field}>{message}</p>
              ))}
            </div>
          )}
        </form>

        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <div className="border-b border-slate-200 px-4 py-4">
            <h2 className="font-semibold text-slate-900">
              Recorded Actions
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              {logs.total} matching records · Newest first
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[1100px] text-left text-sm">
              <caption className="sr-only">
                Hostel restriction and restoration audit records
              </caption>

              <thead className="bg-slate-50 text-xs uppercase text-slate-600">
                <tr>
                  {[
                    'Time (MYT)',
                    'Staff member',
                    'Room / Bed',
                    'Action',
                    'Restriction scope',
                    'Recorded change',
                    'Reason',
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
                {logs.data.map((log) => (
                  <tr key={log.id} className="align-top hover:bg-slate-50">
                    <td className="whitespace-nowrap px-4 py-4">
                      {formatTime(log.occurred_at)}

                      <p className="mt-1 text-xs text-slate-500">
                        Event #{log.id}
                      </p>
                    </td>

                    <td className="px-4 py-4">
                      {log.actor_name}
                    </td>

                    <td className="px-4 py-4">
                      <p className="font-medium">
                        {log.room_number} · Bed {log.bed_label}
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        {log.block_name}
                      </p>
                    </td>

                    <td className="px-4 py-4">
                      <span
                        className={
                          'inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ' +
                          (log.action === 'restricted'
                            ? 'border-slate-300 bg-slate-100 text-slate-800'
                            : 'border-emerald-200 bg-emerald-50 text-emerald-800')
                        }
                      >
                        {log.action === 'restricted'
                          ? 'Restricted'
                          : 'Restored'}
                      </span>
                    </td>

                    <td className="px-4 py-4">
                      <p>{log.scope || '—'}</p>

                      <p className="mt-1 text-xs text-slate-500">
                        {log.restriction_type === 'maintenance'
                          ? 'Maintenance'
                          : 'Administrative block'}
                      </p>

                      <p className="mt-1 max-w-52 break-words text-xs text-slate-500">
                        {log.restriction_reference}
                      </p>
                    </td>

                    <td className="px-4 py-4">
                      <p>
                        {stateLabel(log.previous_state)}
                        {' → '}
                        {stateLabel(log.new_state)}
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        Context: {log.event_session}
                      </p>
                    </td>

                    <td className="min-w-56 max-w-sm whitespace-pre-wrap break-words px-4 py-4">
                      {log.reason}
                    </td>
                  </tr>
                ))}

                {logs.data.length === 0 && (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-4 py-10 text-center text-slate-500"
                    >
                      No activity records were found.
                      Try clearing the filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 px-4 py-4">
            <p aria-live="polite" className="text-sm text-slate-600">
              Showing {logs.from ?? 0}–{logs.to ?? 0} of {logs.total}
              {' · '}
              Page {logs.current_page} of {logs.last_page}
            </p>

            <nav
              aria-label="Activity history pagination"
              className="flex gap-2"
            >
              {logs.prev_page_url ? (
                <Link
                  href={logs.prev_page_url}
                  preserveScroll
                  className={buttonClass}
                >
                  Previous
                </Link>
              ) : (
                <button
                  type="button"
                  disabled
                  className={`${buttonClass} opacity-40`}
                >
                  Previous
                </button>
              )}

              {logs.next_page_url ? (
                <Link
                  href={logs.next_page_url}
                  preserveScroll
                  className={buttonClass}
                >
                  Next
                </Link>
              ) : (
                <button
                  type="button"
                  disabled
                  className={`${buttonClass} opacity-40`}
                >
                  Next
                </button>
              )}
            </nav>
          </footer>
        </section>

        <p className="mt-3 text-xs text-slate-500">
          Recorded changes describe availability at the time of the action,
          in the stated context. They do not represent current occupancy.
        </p>
      </div>
    </AppLayout>
  );
}