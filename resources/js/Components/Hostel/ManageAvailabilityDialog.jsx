import { useEffect, useRef, useState } from 'react';
import { useForm } from '@inertiajs/react';
import BedStatusBadge from './BedStatusBadge';

const controlClass =
  'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 ' +
  'text-sm text-slate-800 focus:outline-none focus:ring-2 ' +
  'focus:ring-[#7A1C2D]';

export default function ManageAvailabilityDialog({
  room,
  sessionId,
  onClose,
  onSaved,
}) {
  const dialogRef = useRef(null);

  const [bedId, setBedId] = useState(
    String(room.beds[0]?.id ?? '')
  );

  const firstBed = room.beds[0];

  const [restrictionId, setRestrictionId] = useState(
    String(firstBed?.restrictions?.[0]?.id ?? '')
  );

  const {
    data,
    setData,
    post,
    patch,
    processing,
    errors,
    clearErrors,
  } = useForm({
    session: sessionId,
    type: 'maintenance',
    reason: '',
  });

  const bed = room.beds.find(
    (item) => String(item.id) === bedId
  );

  const restrictions = bed?.restrictions ?? [];
  const isRestoring = restrictions.length > 0;

  const restriction = restrictions.find(
    (item) => String(item.id) === restrictionId
  );

  const canSubmit = Boolean(
    sessionId
    && bed
    && (
      isRestoring
        ? restriction
        : bed.availability_status === 'available'
    )
  );

  useEffect(() => {
    const dialog = dialogRef.current;
    const previousOverflow = document.body.style.overflow;

    document.body.style.overflow = 'hidden';

    if (!dialog.open) {
      dialog.showModal();
    }

    return () => {
      dialog.close();
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  function changeBed(value) {
    const nextBed = room.beds.find(
      (item) => String(item.id) === value
    );

    setBedId(value);
    setRestrictionId(
      String(nextBed?.restrictions?.[0]?.id ?? '')
    );

    setData({
      session: sessionId,
      type: 'maintenance',
      reason: '',
    });

    clearErrors();
  }

  function submit(event) {
    event.preventDefault();

    if (!canSubmit || processing) return;

    const options = {
      preserveScroll: true,
      onSuccess: () => {
        onSaved(
          isRestoring
            ? `Restriction ended for ${room.room_number}, Bed ${bed.label}.`
            : `Restriction added to ${room.room_number}, Bed ${bed.label}.`
        );
      },
    };

    if (isRestoring) {
      patch(
        `/admin/hostel/beds/${bed.id}/restrictions/${restriction.id}/restore`,
        options
      );
    } else {
      post(
        `/admin/hostel/beds/${bed.id}/restrictions`,
        options
      );
    }
  }

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="manage-availability-title"
      className="m-auto w-[calc(100%-2rem)] max-w-xl overflow-hidden rounded-2xl bg-white p-0 text-slate-900 shadow-xl backdrop:bg-black/50"
      onCancel={(event) => {
        event.preventDefault();

        if (!processing) {
          onClose();
        }
      }}
    >
      <form
        onSubmit={submit}
        className="flex max-h-[85dvh] flex-col"
      >
        <header className="flex items-start justify-between gap-4 border-b border-slate-200 px-6 py-5">
          <div>
            <h2
              id="manage-availability-title"
              className="text-lg font-bold"
            >
              Manage Availability
            </h2>

            <p className="mt-1 text-sm text-slate-600">
              {room.room_number} · {room.block.name}
            </p>
          </div>

          <button
            type="button"
            aria-label="Close availability dialog"
            disabled={processing}
            onClick={onClose}
            className="rounded-lg border border-slate-300 px-3 py-1 text-lg disabled:opacity-50"
          >
            ×
          </button>
        </header>

        <div className="space-y-5 overflow-y-auto px-6 py-5">
          <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-900">
            Local development preview. Actions are recorded under
            Demo Hostel Administrator.
          </p>

          <label className="flex flex-col gap-1 text-sm text-slate-600">
            <span>Bed</span>

            <select
              autoFocus
              className={controlClass}
              value={bedId}
              disabled={processing || room.beds.length === 0}
              onChange={(event) => changeBed(event.target.value)}
            >
              {room.beds.length === 0 && (
                <option value="">No beds configured</option>
              )}

              {room.beds.map((item) => (
                <option key={item.id} value={String(item.id)}>
                  Bed {item.label}
                </option>
              ))}
            </select>
          </label>

          {bed && (
            <div className="flex items-center gap-3">
              <span className="text-sm text-slate-600">
                Current status
              </span>

              <BedStatusBadge
                status={bed.availability_status}
                restrictions={restrictions}
              />
            </div>
          )}

          {!sessionId && (
            <p role="alert" className="text-sm text-red-700">
              Configure and select an academic session before editing.
            </p>
          )}

          {isRestoring ? (
            <>
              <label className="flex flex-col gap-1 text-sm text-slate-600">
                <span>Restriction to end</span>

                <select
                  className={controlClass}
                  value={restrictionId}
                  disabled={processing}
                  onChange={(event) => {
                    setRestrictionId(event.target.value);
                    setData('reason', '');
                    clearErrors();
                  }}
                >
                  {restrictions.map((item) => (
                    <option key={item.id} value={String(item.id)}>
                      {item.reference}
                    </option>
                  ))}
                </select>
              </label>

              {restriction && (
                <div className="space-y-2 rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm">
                  <p className="font-semibold">
                    {restriction.type === 'maintenance'
                      ? 'Maintenance'
                      : 'Administrative block'}
                  </p>

                  <p>{restriction.reason}</p>

                  <p className="text-slate-600">
                    Scope: {restriction.scope}
                  </p>

                  <p className="text-slate-600">
                    Ending this restriction preserves its history.
                    Other restrictions or bookings may still prevent
                    this bed from becoming available.
                  </p>
                </div>
              )}
            </>
          ) : bed?.availability_status === 'available' ? (
            <>
              <label className="flex flex-col gap-1 text-sm text-slate-600">
                <span>Restriction type</span>

                <select
                  className={controlClass}
                  value={data.type}
                  disabled={processing}
                  onChange={(event) => {
                    setData('type', event.target.value);
                    clearErrors();
                  }}
                >
                  <option value="maintenance">
                    Maintenance
                  </option>

                  <option value="administrative_block">
                    Administrative block
                  </option>
                </select>
              </label>

              <p className="rounded-lg bg-slate-50 p-3 text-sm text-slate-600">
                {data.type === 'maintenance'
                  ? 'Maintenance applies across all academic sessions. The server checks for conflicting bookings and restrictions across those sessions.'
                  : 'An administrative block withholds this bed from booking for the selected academic session only.'}
              </p>
            </>
          ) : (
            <p className="rounded-lg bg-slate-50 p-3 text-sm text-slate-700">
              A new restriction cannot be added to this bed.
              Occupied beds and active holds must be resolved first.
              Availability must also be assessed for an academic session.
            </p>
          )}

          {canSubmit && (
            <label className="flex flex-col gap-1 text-sm text-slate-600">
              <span>
                {isRestoring
                  ? 'Reason for ending the restriction'
                  : 'Reason for restricting the bed'}
              </span>

              <textarea
                className={controlClass}
                rows={4}
                required
                minLength={3}
                maxLength={1000}
                value={data.reason}
                disabled={processing}
                placeholder={
                  isRestoring
                    ? 'e.g. Fan repaired and room checked.'
                    : 'e.g. Ceiling fan requires repair.'
                }
                onChange={(event) => setData('reason', event.target.value)}
              />
            </label>
          )}

          {Object.keys(errors).length > 0 && (
            <div
              role="alert"
              className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800"
            >
              {Object.entries(errors).map(([field, message]) => (
                <p key={field}>{message}</p>
              ))}
            </div>
          )}
        </div>

        <footer className="flex justify-end gap-3 border-t border-slate-200 bg-slate-50 px-6 py-4">
          <button
            type="button"
            disabled={processing}
            onClick={onClose}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={!canSubmit || processing}
            className="rounded-lg bg-[#7A1C2D] px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            {processing
              ? 'Saving…'
              : isRestoring
                ? 'End Restriction'
                : 'Add Restriction'}
          </button>
        </footer>
      </form>
    </dialog>
  );
}