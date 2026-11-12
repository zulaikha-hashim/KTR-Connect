import { Head, router } from '@inertiajs/react';
import { useState } from 'react';
import AppLayout from '../../Components/AppLayout';
import RoomDetailsDialog from '../../Components/Hostel/RoomDetailsDialog';
import BedStatusBadge from '../../Components/Hostel/BedStatusBadge';
import ManageAvailabilityDialog from '../../Components/Hostel/ManageAvailabilityDialog';

const categoryLabels = {
  single_standard: 'Single Standard',
  single_attached_bathroom: 'Single with Attached Bathroom',
  double_sharing: 'Double Sharing',
};

const navigation = [
  {
    title: 'Hostel Management',
    items: [
      {
        label: 'Room Inventory',
        icon: 'meeting_room',
        path: 'admin-hostel-rooms',
        href: '/admin/hostel/rooms',
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

function FilterSelect({ label, value, onChange, options }) {
  return (
    <label className="flex min-w-0 flex-col gap-1 text-sm text-slate-600">
      <span>{label}</span>

      <select
        className={controlClass}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export default function AdminInventory({
  rooms = [],
  academicSessions = [],
  selectedSessionId = null,
}) {  
    const [search, setSearch] = useState('');
    const [zone, setZone] = useState('all');
    const [block, setBlock] = useState('all');
    const [floor, setFloor] = useState('all');
    const [category, setCategory] = useState('all');
    const [bedStatus, setBedStatus] = useState('all');
    const [selectedRoom, setSelectedRoom] = useState(null);
    const [availabilityRoom, setAvailabilityRoom] = useState(null);
    const [availabilityMessage, setAvailabilityMessage] = useState('');

    const [isChangingSession, setIsChangingSession] = useState(false);
    const [sessionError, setSessionError] = useState('');

    const selectedSession = academicSessions.find(
    (session) => String(session.id) === String(selectedSessionId)
    );

    function changeSession(sessionId) {
    if (!sessionId) return;

    setSelectedRoom(null);
    setAvailabilityRoom(null);
    setAvailabilityMessage('');
    setSessionError('');

    router.get(
        '/admin/hostel/rooms',
        { session: sessionId },
        {
        preserveState: true,
        preserveScroll: true,
        onStart: () => setIsChangingSession(true),
        onError: () => {
            setSessionError(
            'The session could not be selected. Refresh the page and try again.'
            );
        },
        onFinish: () => setIsChangingSession(false),
        }
    );
}

  const blocks = [
    ...new Map(
      rooms.map((room) => [room.block.id, room.block])
    ).values(),
  ].sort((a, b) => a.code.localeCompare(b.code));

  const floors = [
    ...new Set(rooms.map((room) => room.floor_level)),
  ].sort((a, b) => a - b);

  const query = search.trim().toLowerCase();

  const visibleRooms = rooms.filter((room) => (
    (!query || room.room_number.toLowerCase().includes(query))
    && (zone === 'all' || room.block.residential_zone === zone)
    && (block === 'all' || String(room.block.id) === block)
    && (floor === 'all' || String(room.floor_level) === floor)
    && (category === 'all' || room.category === category)
    && (
      bedStatus === 'all'
      || room.beds.some(
        (bed) => bed.availability_status === bedStatus
      )
    )
  ));

  const visibleBedRecords = visibleRooms.flatMap(
    (room) => room.beds
  );

  const visibleBeds = visibleBedRecords.length;

  const availableBeds = visibleBedRecords.filter(
    (bed) => bed.availability_status === 'available'
  ).length;

  const occupiedBeds = visibleBedRecords.filter(
    (bed) => bed.availability_status === 'occupied'
  ).length;

  const heldBeds = visibleBedRecords.filter(
    (bed) => bed.availability_status === 'held'
  ).length;

  const unavailableBeds = visibleBedRecords.filter(
    (bed) => bed.availability_status === 'unavailable'
  ).length;

  function clearFilters() {
    setSearch('');
    setZone('all');
    setBlock('all');
    setFloor('all');
    setCategory('all');
    setBedStatus('all');
  }

  return (
    <AppLayout
      navigationSections={navigation}
      profile={profile}
      sessionLabel={
        selectedSession
            ? `Academic Session: ${selectedSession.name}`
            : 'No academic session configured'
      }
    >
      <Head title="Admin Hostel Inventory" />

      <div className="mx-auto max-w-[1600px] py-6">
        <header className="mb-6">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#7A1C2D]">
            Hostel Management · Sample development inventory
          </p>

          <h1 className="text-2xl font-bold text-slate-900">
            Room Inventory
          </h1>

          <p className="mt-2 text-sm text-slate-600">
            Browse rooms and bed capacity loaded from the database.
          </p>
        </header>

        {availabilityMessage && (
          <p
            role="status"
            className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800"
          >
            {availabilityMessage}
          </p>
        )}

        <section
        aria-label="Academic session selection"
        className="mb-6 rounded-xl border border-slate-200 bg-white p-4"
        >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <label className="flex w-full flex-col gap-1 text-sm text-slate-600 sm:max-w-sm">
            <span>Academic session</span>

            <select
                className={controlClass}
                value={
                selectedSessionId === null
                    ? ''
                    : String(selectedSessionId)
                }
                disabled={
                isChangingSession || academicSessions.length === 0
                }
                onChange={(event) => changeSession(event.target.value)}
            >
                {academicSessions.length === 0 && (
                <option value="">No sessions configured</option>
                )}

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

            <p
            aria-live="polite"
            className="text-sm text-slate-500"
            >
            {isChangingSession
                ? 'Loading selected session…'
                : 'Physical room inventory is shared across academic sessions.'}
            </p>
        </div>

        {sessionError && (
            <p role="alert" className="mt-3 text-sm text-red-700">
            {sessionError}
            </p>
        )}
        </section>

        <section
          aria-label="Filtered inventory totals"
          className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3"
        >
        {[
          ['Rooms', visibleRooms.length],
          ['Total Beds', visibleBeds],
          ['Available Beds', selectedSession ? availableBeds : '—'],
          ['Held Beds', selectedSession ? heldBeds : '—'],
          ['Occupied Beds', selectedSession ? occupiedBeds : '—'],
          ['Unavailable Beds', selectedSession ? unavailableBeds : '—'],
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

              <p className="mt-1 text-xs text-slate-500">
                All beds in displayed rooms
              </p>
            </div>
          ))}
        </section>

        <section
          aria-label="Inventory filters"
          className="mb-6 rounded-xl border border-slate-200 bg-white p-4"
        >
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <label className="flex flex-col gap-1 text-sm text-slate-600">
              <span>Room number</span>

              <input
                type="search"
                className={controlClass}
                placeholder="e.g. K11-02-214"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </label>

            <FilterSelect
              label="Residential zone"
              value={zone}
              onChange={setZone}
              options={[
                { value: 'all', label: 'All zones' },
                { value: 'male', label: 'Male' },
                { value: 'female', label: 'Female' },
              ]}
            />

            <FilterSelect
              label="Block"
              value={block}
              onChange={setBlock}
              options={[
                { value: 'all', label: 'All blocks' },
                ...blocks.map((item) => ({
                  value: String(item.id),
                  label: item.name,
                })),
              ]}
            />

            <FilterSelect
              label="Floor"
              value={floor}
              onChange={setFloor}
              options={[
                { value: 'all', label: 'All floors' },
                ...floors.map((level) => ({
                  value: String(level),
                  label: level === 0
                    ? 'Ground floor'
                    : `Level ${level}`,
                })),
              ]}
            />

            <FilterSelect
              label="Category"
              value={category}
              onChange={setCategory}
              options={[
                { value: 'all', label: 'All categories' },
                ...Object.entries(categoryLabels).map(
                  ([value, label]) => ({
                    value,
                    label,
                  })
                ),
              ]}
            />

            <FilterSelect
              label="Bed status"
              value={bedStatus}
              onChange={setBedStatus}
              options={[
                { value: 'all', label: 'All statuses' },
                { value: 'available', label: 'Available' },
                { value: 'held', label: 'Held' },
                { value: 'occupied', label: 'Occupied' },
                { value: 'unavailable', label: 'Unavailable' },
              ]}
            />
          </div>

          <p className="mt-3 text-xs text-slate-500">
            The status filter shows rooms containing at least one matching bed.
            All beds in each matching room remain visible and are included in
            the summary counts.
          </p>

          <button
            type="button"
            onClick={clearFilters}
            className="mt-4 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-[#7A1C2D] hover:bg-slate-50"
          >
            Clear Filters
          </button>
        </section>

        <p className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          {selectedSession
            ? 'Availability reflects bookings and applicable restrictions when the page was loaded. Local preview edits are recorded under Demo Hostel Administrator. Maintenance affects all academic sessions; administrative blocks affect the selected session.'
            : 'No academic session is configured. Physical inventory is shown, but booking availability has not been assessed.'}
        </p>

        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <caption className="sr-only">
                Hostel rooms matching the selected filters
              </caption>

              <thead className="bg-slate-50 text-xs uppercase text-slate-600">
                <tr>
                  {[
                    'Room',
                    'Block / Zone',
                    'Location',
                    'Category',
                    'Beds',
                    'Actions',
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
                {visibleRooms.map((room) => (
                  <tr key={room.id} className="hover:bg-slate-50">
                    <td className="whitespace-nowrap px-4 py-4 font-semibold text-slate-900">
                      {room.room_number}
                    </td>

                    <td className="px-4 py-4">
                      <div>{room.block.name}</div>

                      <div className="text-xs capitalize text-slate-500">
                        {room.block.residential_zone}
                      </div>
                    </td>

                    <td className="px-4 py-4">
                      {room.floor_level === 0
                        ? 'Ground floor'
                        : `Level ${room.floor_level}`}

                      {room.wing && ` · Wing ${room.wing}`}
                    </td>

                    <td className="px-4 py-4">
                      {categoryLabels[room.category] || room.category}
                    </td>

                    <td className="px-4 py-4">
                      <div className="flex flex-wrap gap-2">
                        {room.beds.map((bed) => (
                            <div
                                key={bed.id}
                                className="flex items-center gap-2 rounded-lg border border-slate-200 px-2 py-1.5"
                            >
                                <span className="whitespace-nowrap text-xs font-medium text-slate-700">
                                Bed {bed.label}
                                </span>

                                <BedStatusBadge
                                  status={bed.availability_status}
                                  restrictions={bed.restrictions || []}
                                />
                            </div>
                        ))}

                        {room.beds.length === 0 && 'No beds configured'}
                      </div>
                    </td>
                        <td className="px-4 py-4">
                          <div className="flex flex-col items-start gap-2">
                            <button
                              type="button"
                              aria-label={`View details for ${room.room_number}`}
                              onClick={() => setSelectedRoom(room)}
                              className="whitespace-nowrap rounded-lg border border-[#7A1C2D] px-3 py-2 text-sm font-medium text-[#7A1C2D] hover:bg-rose-50 focus:outline-none focus:ring-2 focus:ring-[#7A1C2D]"
                            >
                              View Details
                            </button>

                            <button
                              type="button"
                              aria-label={`Manage availability for ${room.room_number}`}
                              disabled={
                                !selectedSessionId
                                || isChangingSession
                                || room.beds.length === 0
                              }
                              onClick={() => {
                                setSelectedRoom(null);
                                setAvailabilityMessage('');
                                setAvailabilityRoom(room);
                              }}
                              className="whitespace-nowrap rounded-lg bg-[#7A1C2D] px-3 py-2 text-sm font-medium text-white hover:bg-[#651725] focus:outline-none focus:ring-2 focus:ring-[#7A1C2D] disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              Manage Availability
                            </button>
                          </div>
                        </td>
                  </tr>
                ))}

                {visibleRooms.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-4 py-10 text-center text-slate-500"
                    >
                      {rooms.length === 0
                        ? 'No rooms have been configured yet.'
                        : 'No rooms match these filters. Try clearing the filters.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <footer
            aria-live="polite"
            className="border-t border-slate-200 px-4 py-3 text-sm text-slate-600"
          >
            Showing {visibleRooms.length} of {rooms.length} loaded rooms
          </footer>
        </section>

        <RoomDetailsDialog
          room={selectedRoom}
          onClose={() => setSelectedRoom(null)}
        />

        {availabilityRoom && (
          <ManageAvailabilityDialog
            key={`${selectedSessionId}-${availabilityRoom.id}`}
            room={availabilityRoom}
            sessionId={selectedSessionId}
            onClose={() => setAvailabilityRoom(null)}
            onSaved={(message) => {
              setAvailabilityRoom(null);
              setAvailabilityMessage(message);
            }}
          />
        )}
      </div>
    </AppLayout>
  );
}