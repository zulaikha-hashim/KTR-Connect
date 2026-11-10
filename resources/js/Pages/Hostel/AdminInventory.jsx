import { Head } from '@inertiajs/react';
import { useState } from 'react';
import AppLayout from '../../Components/AppLayout';
import RoomDetailsDialog from '../../Components/Hostel/RoomDetailsDialog';

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

export default function AdminInventory({ rooms = [] }) {
  const [search, setSearch] = useState('');
  const [zone, setZone] = useState('all');
  const [block, setBlock] = useState('all');
  const [floor, setFloor] = useState('all');
  const [category, setCategory] = useState('all');
  const [selectedRoom, setSelectedRoom] = useState(null);

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
  ));

  const visibleBeds = visibleRooms.reduce(
    (total, room) => total + room.beds.length,
    0
  );

  const visibleBlocks = new Set(
    visibleRooms.map((room) => room.block.id)
  ).size;

  function clearFilters() {
    setSearch('');
    setZone('all');
    setBlock('all');
    setFloor('all');
    setCategory('all');
  }

  return (
    <AppLayout
      navigationSections={navigation}
      profile={profile}
      sessionLabel="Hostel inventory · Local preview"
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

        <section
          aria-label="Filtered inventory totals"
          className="mb-6 grid gap-4 sm:grid-cols-3"
        >
          {[
            ['Rooms', visibleRooms.length],
            ['Beds', visibleBeds],
            ['Blocks', visibleBlocks],
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
                Current filter results
              </p>
            </div>
          ))}
        </section>

        <section
          aria-label="Inventory filters"
          className="mb-6 rounded-xl border border-slate-200 bg-white p-4"
        >
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
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
          </div>

          <button
            type="button"
            onClick={clearFilters}
            className="mt-4 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-[#7A1C2D] hover:bg-slate-50"
          >
            Clear Filters
          </button>
        </section>

        <p className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          Capacity records are connected. Booking and restriction records
          are not connected yet, so availability is not shown.
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
                          <span
                            key={bed.id}
                            className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-700"
                          >
                            Bed {bed.label}
                          </span>
                        ))}

                        {room.beds.length === 0 && 'No beds configured'}
                      </div>
                    </td>
                        <td className="px-4 py-4">
                        <button
                            type="button"
                            aria-label={`View details for ${room.room_number}`}
                            onClick={() => setSelectedRoom(room)}
                            className="whitespace-nowrap rounded-lg border border-[#7A1C2D] px-3 py-2 text-sm font-medium text-[#7A1C2D] hover:bg-rose-50 focus:outline-none focus:ring-2 focus:ring-[#7A1C2D]"
                        >
                            View Details
                        </button>
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
      </div>
    </AppLayout>
  );
}