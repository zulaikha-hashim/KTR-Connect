import { Head, router, useForm } from '@inertiajs/react';
import AppLayout from '../../Components/AppLayout';

const controlClass =
  'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#7A1C2D]';

const profile = {
  name: 'Simulation Preview',
  description: 'Local development',
};

function formatTime(value) {
  if (!value) return '—';

  return new Intl.DateTimeFormat('en-MY', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Asia/Kuala_Lumpur',
  }).format(new Date(value));
}

export default function AllocationSimulation({
  academicSessions = [],
  selectedSessionId = null,
  students = [],
  beds = [],
  allocations = [],
  successMessage = null,
}) {
  const form = useForm({
    student_profile_id: '',
    hostel_academic_session_id: selectedSessionId ?? '',
    hostel_bed_id: '',
  });

  const selectedSession = academicSessions.find(
    (session) => String(session.id) === String(selectedSessionId)
  );

  const selectedStudent = students.find(
    (student) =>
      String(student.id) === String(form.data.student_profile_id)
  );

  const availableBeds = selectedStudent
    ? beds.filter(
        (bed) =>
          bed.available && bed.gender === selectedStudent.gender
      )
    : [];

  const canSubmit =
    selectedSessionId &&
    selectedStudent &&
    !selectedStudent.has_active_allocation &&
    form.data.hostel_bed_id &&
    !form.processing;

  function changeSession(event) {
    router.get(
      '/admin/hostel/simulation/allocations',
      { session: event.target.value },
      {
        preserveState: false,
        preserveScroll: true,
      }
    );
  }

  function changeStudent(event) {
    form.setData({
      ...form.data,
      student_profile_id: event.target.value,
      hostel_bed_id: '',
    });

    form.clearErrors();
  }

  function submit(event) {
    event.preventDefault();

    if (!canSubmit) return;

    form.post('/admin/hostel/simulation/allocations', {
      preserveScroll: true,
      onSuccess: () => {
        form.reset('student_profile_id', 'hostel_bed_id');
      },
    });
  }

  return (
    <AppLayout
      profile={profile}
      sessionLabel={
        selectedSession
          ? `Academic Session: ${selectedSession.name}`
          : 'Allocation simulation'
      }
    >
      <Head title="Hostel Allocation Simulation" />

      <div className="space-y-6 py-6">
        <div>
          <p className="text-sm font-semibold uppercase text-[#7A1C2D]">
            Hostel Management · Development Simulation
          </p>
          <h1 className="mt-2 text-3xl font-bold">
            Allocation Simulation
          </h1>
          <p className="mt-2 text-slate-600">
            Connect imported simulated students to beds in a selected
            academic session.
          </p>
        </div>

        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-900">
          Local demonstration only. Saving creates a confirmed
          reservation in your local database and changes the selected
          session’s occupancy. Registration dates are not enforced by
          this simulation.
        </div>

        {successMessage && (
          <div
            className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-emerald-900"
            role="status"
          >
            {successMessage}
          </div>
        )}

        <section className="rounded-xl border border-slate-200 bg-white p-5">
          <label
            htmlFor="allocation-session"
            className="mb-2 block font-medium"
          >
            Academic session
          </label>

          <select
            id="allocation-session"
            className={controlClass}
            value={selectedSessionId ?? ''}
            onChange={changeSession}
            disabled={form.processing || academicSessions.length === 0}
          >
            {academicSessions.length === 0 && (
              <option value="">No academic sessions available</option>
            )}

            {academicSessions.map((session) => (
              <option key={session.id} value={session.id}>
                {session.name}
              </option>
            ))}
          </select>
        </section>

        <form
          onSubmit={submit}
          className="space-y-5 rounded-xl border border-slate-200 bg-white p-5"
        >
          <h2 className="text-xl font-semibold">
            Create a simulation allocation
          </h2>

          {Object.keys(form.errors).length > 0 && (
            <div
              className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-800"
              role="alert"
            >
              {Object.entries(form.errors).map(([field, message]) => (
                <p key={field}>{message}</p>
              ))}
            </div>
          )}

          <div>
            <label
              htmlFor="simulation-student"
              className="mb-2 block font-medium"
            >
              Imported student
            </label>

            <select
              id="simulation-student"
              className={controlClass}
              value={form.data.student_profile_id}
              onChange={changeStudent}
              disabled={form.processing || !selectedSessionId}
              required
            >
              <option value="">Select an imported student</option>

              {students.map((student) => (
                <option
                  key={student.id}
                  value={student.id}
                  disabled={student.has_active_allocation}
                >
                  {student.matric_number} · {student.full_name}
                  {student.has_active_allocation
                    ? ' — Already has a booking or hold'
                    : ''}
                </option>
              ))}
            </select>

            {students.length === 0 && (
              <p className="mt-2 text-sm text-slate-600">
                Import students through Student Data Simulation first.
              </p>
            )}
          </div>

          {selectedStudent && (
            <div className="rounded-lg bg-slate-50 p-4 text-sm text-slate-700">
              <p>
                <strong>Faculty:</strong> {selectedStudent.faculty}
              </p>
              <p className="mt-1">
                <strong>Gender:</strong>{' '}
                {selectedStudent.gender === 'male' ? 'Male' : 'Female'}
              </p>
            </div>
          )}

          <div>
            <label
              htmlFor="simulation-bed"
              className="mb-2 block font-medium"
            >
              Available bed
            </label>

            <select
              id="simulation-bed"
              className={controlClass}
              value={form.data.hostel_bed_id}
              onChange={(event) =>
                form.setData('hostel_bed_id', event.target.value)
              }
              disabled={
                form.processing ||
                !selectedStudent ||
                selectedStudent.has_active_allocation
              }
              required
            >
              <option value="">
                {selectedStudent
                  ? 'Select an available bed'
                  : 'Select a student first'}
              </option>

              {availableBeds.map((bed) => (
                <option key={bed.id} value={bed.id}>
                  {bed.room_number} · Bed {bed.label} · Block{' '}
                  {bed.block_code}
                </option>
              ))}
            </select>

            {selectedStudent && availableBeds.length === 0 && (
              <p className="mt-2 text-sm text-amber-800">
                No available beds match this student’s gender in the
                selected session.
              </p>
            )}
          </div>

          <p className="text-sm text-slate-600">
            Only available beds in matching residential blocks are
            listed. Availability is checked again when you save.
          </p>

          <button
            type="submit"
            disabled={!canSubmit}
            className="rounded-lg bg-[#7A1C2D] px-5 py-2.5 font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            {form.processing
              ? 'Saving...'
              : 'Confirm Simulation Allocation'}
          </button>
        </form>

        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <div className="border-b border-slate-200 p-5">
            <h2 className="text-xl font-semibold">
              Simulation allocations in this session
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Shows confirmed allocations created by this simulation.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] text-left text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="px-5 py-3">Student</th>
                  <th className="px-5 py-3">Room</th>
                  <th className="px-5 py-3">Bed</th>
                  <th className="px-5 py-3">Confirmed (MYT)</th>
                  <th className="px-5 py-3">Reference</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {allocations.map((allocation) => (
                  <tr key={allocation.id}>
                    <td className="px-5 py-4">
                      {allocation.student_name}
                    </td>
                    <td className="px-5 py-4">
                      {allocation.room_number}
                    </td>
                    <td className="px-5 py-4">
                      {allocation.bed_label}
                    </td>
                    <td className="px-5 py-4">
                      {formatTime(allocation.confirmed_at)}
                    </td>
                    <td className="px-5 py-4">
                      {allocation.reference}
                    </td>
                  </tr>
                ))}

                {allocations.length === 0 && (
                  <tr>
                    <td
                      colSpan="5"
                      className="px-5 py-8 text-center text-slate-500"
                    >
                      No simulation allocations in this session yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </AppLayout>
  );
}