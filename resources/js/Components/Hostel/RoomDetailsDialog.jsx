import { useEffect, useRef } from 'react';
import BedStatusBadge from './BedStatusBadge';

const categoryLabels = {
  single_standard: 'Single Standard',
  single_attached_bathroom: 'Single with Attached Bathroom',
  double_sharing: 'Double Sharing',
};

function measurement(value, unit) {
  return value === null || value === undefined || value === ''
    ? 'Not provided'
    : `${value} ${unit}`;
}

export default function RoomDetailsDialog({ room, onClose }) {
  const dialogRef = useRef(null);

  useEffect(() => {
    const dialog = dialogRef.current;

    if (!room) {
      if (dialog.open) dialog.close();
      return undefined;
    }

    if (!dialog.open) dialog.showModal();

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [room]);

  const amenities = Array.isArray(room?.amenities)
    ? room.amenities.filter((item) => typeof item === 'string')
    : [];

  const mattressSize =
    room?.mattress_width_cm != null
    && room?.mattress_length_cm != null
      ? `${room.mattress_width_cm} × ${room.mattress_length_cm} cm`
      : 'Not provided';

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="room-details-title"
      onClose={onClose}
      className="fixed inset-0 m-auto max-h-[85dvh] w-[calc(100%-2rem)] max-w-2xl overflow-hidden rounded-2xl border border-slate-200 bg-white p-0 text-slate-900 shadow-2xl backdrop:bg-black/50 backdrop:backdrop-blur-sm"
    >
      {room && (
        <div className="flex max-h-[85dvh] flex-col">
          <header className="flex shrink-0 items-start justify-between gap-4 border-b border-slate-200 p-5">
            <div>
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-[#7A1C2D]">
                Room Details
              </p>

              <h2
                id="room-details-title"
                className="text-xl font-bold"
              >
                {room.room_number}
              </h2>

              <p className="mt-1 text-sm text-slate-600">
                {room.block.name}
                {' · '}
                {room.floor_level === 0
                  ? 'Ground floor'
                  : `Level ${room.floor_level}`}
                {room.wing && ` · Wing ${room.wing}`}
              </p>
            </div>

            <button
              autoFocus
              type="button"
              aria-label="Close room details"
              onClick={() => dialogRef.current.close()}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xl hover:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-[#7A1C2D]"
            >
              ×
            </button>
          </header>

          <div className="min-h-0 overflow-y-auto p-5">
            <div className="mb-5 flex min-h-36 items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
              <div>
                <p className="font-medium text-slate-700">
                  Room photo not provided
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  A room-type sample image can be added later.
                </p>
              </div>
            </div>

            <section aria-labelledby="room-specifications-title">
              <h3
                id="room-specifications-title"
                className="mb-3 font-semibold"
              >
                Specifications
              </h3>

              <dl className="grid gap-3 sm:grid-cols-2">
                {[
                  [
                    'Category',
                    categoryLabels[room.category] || room.category,
                  ],
                  ['Capacity', `${room.beds.length} bed(s)`],
                  [
                    'Floor area',
                    measurement(room.floor_area_sqm, 'm²'),
                  ],
                  ['Mattress size', mattressSize],
                  [
                    'Ceiling height',
                    measurement(room.ceiling_height_m, 'm'),
                  ],
                  [
                    'Residential zone',
                    room.block.residential_zone === 'male'
                      ? 'Male'
                      : 'Female',
                  ],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    className="rounded-lg bg-slate-50 p-3"
                  >
                    <dt className="text-xs text-slate-500">
                      {label}
                    </dt>
                    <dd className="mt-1 text-sm font-medium">
                      {value}
                    </dd>
                  </div>
                ))}
              </dl>
            </section>

            <section className="mt-5" aria-labelledby="room-amenities-title">
              <h3
                id="room-amenities-title"
                className="mb-3 font-semibold"
              >
                Recorded Amenities
              </h3>

              {amenities.length > 0 ? (
                <ul className="list-inside list-disc space-y-1 text-sm text-slate-700">
                  {amenities.map((amenity, index) => (
                    <li key={`${amenity}-${index}`}>
                      {amenity}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-slate-500">
                  No amenities have been recorded.
                </p>
              )}
            </section>

            <section className="mt-5" aria-labelledby="room-beds-title">
              <h3
                id="room-beds-title"
                className="mb-3 font-semibold"
              >
                Beds
              </h3>

              <div className="grid gap-3 sm:grid-cols-2">
                {room.beds.map((bed) => (
                  <div
                    key={bed.id}
                    className="rounded-xl border border-slate-200 p-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-semibold">
                        Bed {bed.label}
                      </p>

                      <BedStatusBadge
                        status={bed.availability_status}
                        restrictions={bed.restrictions || []}
                      />
                    </div>

                    {bed.reservation ? (
                      <dl className="mt-3 space-y-3 text-sm">
                        <div>
                          <dt className="text-xs text-slate-500">
                            {bed.reservation.status === 'confirmed'
                              ? 'Resident'
                              : 'Held by'}
                          </dt>
                          <dd className="mt-1 font-medium">
                            {bed.reservation.student_name || 'Name not provided'}
                          </dd>
                        </div>

                        <div>
                          <dt className="text-xs text-slate-500">
                            Reservation reference
                          </dt>
                          <dd className="mt-1 break-all">
                            {bed.reservation.reference}
                          </dd>
                        </div>
                      </dl>
                    ) : (
                      <p className="mt-3 text-sm text-slate-500">
                        No confirmed allocation or unexpired hold exists for
                        this bed in the selected academic session.
                      </p>
                    )}

                    {(bed.restrictions || []).map((restriction) => (
                      <section
                        key={restriction.id}
                        className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-3"
                      >
                        <h4 className="text-sm font-semibold text-slate-800">
                          {restriction.type === 'maintenance'
                            ? 'Maintenance restriction'
                            : 'Administrative block'}
                        </h4>

                        <p className="mt-2 whitespace-pre-wrap text-sm text-slate-700">
                          {restriction.reason}
                        </p>

                        <dl className="mt-3 space-y-2 text-xs">
                          <div>
                            <dt className="text-slate-500">Applies to</dt>
                            <dd className="mt-0.5 text-slate-700">
                              {restriction.scope || 'Session not provided'}
                            </dd>
                          </div>

                          <div>
                            <dt className="text-slate-500">Recorded by</dt>
                            <dd className="mt-0.5 text-slate-700">
                              {restriction.created_by_name || 'Name not provided'}
                            </dd>
                          </div>

                          <div>
                            <dt className="text-slate-500">Restriction reference</dt>
                            <dd className="mt-0.5 break-all text-slate-700">
                              {restriction.reference}
                            </dd>
                          </div>
                        </dl>
                      </section>
                    ))}

                  </div>
                ))}

                {room.beds.length === 0 && (
                  <p className="text-sm text-slate-500">
                    No beds have been configured.
                  </p>
                )}
              </div>
            </section>

            {room.description && (
              <section className="mt-5" aria-labelledby="room-description-title">
                <h3
                  id="room-description-title"
                  className="mb-2 font-semibold"
                >
                  Notes
                </h3>
                <p className="whitespace-pre-wrap text-sm text-slate-600">
                  {room.description}
                </p>
              </section>
            )}
          </div>

          <footer className="flex shrink-0 justify-end border-t border-slate-200 bg-slate-50 p-4">
            <button
              type="button"
              onClick={() => dialogRef.current.close()}
              className="rounded-lg bg-[#7A1C2D] px-4 py-2 text-sm font-semibold text-white hover:bg-[#601423] focus:outline-none focus:ring-2 focus:ring-[#7A1C2D] focus:ring-offset-2"
            >
              Close Details
            </button>
          </footer>
        </div>
      )}
    </dialog>
  );
}