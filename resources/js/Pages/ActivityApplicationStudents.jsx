import { Link } from '@inertiajs/react';
import AppLayout from '../Components/AppLayout';
import GenderBadge from '../Components/GenderBadge';

const staffProfile = {
  name: 'Muhammad Afiq',
  description: 'A23CS0120 • Block TR-B04',
};

const roles = ['MT', 'Crew', 'Participant', 'Volunteers'];
const organizations = {
  jkm_sports: 'JKM Biro Sukan & Rekreasi',
  jkm_academic: 'JKM Biro Akademik & Kerjaya',
  jkm_cultural: 'JKM Biro Kebudayaan & Kesenian',
  jkm_welfare: 'JKM Biro Kebajikan & Kerohanian',
  felo_office: 'Pejabat Felo Kolej Tun Razak',
};

export default function ActivityApplicationStudents({
  application,
  participations = { data: [], links: [] },
  roleCounts = {},
  selectedRole = null,
}) {
  const roleFilterHref = (role) => {
    const base = `/activity-applications/${application.id}/students`;
    return role ? `${base}?role=${encodeURIComponent(role)}` : base;
  };
  const csvDownloadHref = `/activity-applications/${application.id}/students/csv${selectedRole ? `?role=${encodeURIComponent(selectedRole)}` : ''}`;

  return (
    <AppLayout profile={staffProfile}>
      <div className="flex w-full flex-col gap-space-lg">
        <Link
          href="/"
          className="inline-flex w-fit items-center gap-1 font-label-md text-label-md font-semibold text-primary hover:underline"
        >
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          Back to applications
        </Link>

        <section className="rounded-xl bg-surface-container-lowest p-space-lg shadow-sm">
          <p className="font-label-sm text-label-sm font-semibold uppercase tracking-wider text-secondary">
            Student participation
          </p>
          <h1 className="mt-1 font-headline-md text-headline-md font-bold text-on-surface">
            {application.activity_name || 'Untitled activity'}
          </h1>
          <p className="mt-1 font-body-md text-body-md text-secondary">
            {organizations[application.organization] || application.organization || 'Club not specified'}
            {application.semester && application.academic_year
              ? ` · Semester ${application.semester} · ${application.academic_year}`
              : ''}
          </p>
        </section>

        <section className="overflow-hidden rounded-xl bg-surface-container-lowest shadow-sm">
          <div className="flex flex-col gap-space-md border-b border-surface-container p-space-lg sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-headline-sm text-headline-sm font-semibold text-on-surface">List of Students</h2>
              <p className="font-body-sm text-body-sm text-secondary">
                View MT, crew, participant, and volunteer records for this activity.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <a
                href={csvDownloadHref}
                className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 font-label-sm text-label-sm font-semibold text-on-primary hover:bg-primary-container"
              >
                <span className="material-symbols-outlined text-[18px]">download</span>
                Download CSV
              </a>
              <div className="flex flex-wrap gap-2" aria-label="Filter students by role">
                <Link
                  href={roleFilterHref(null)}
                  className={`rounded-lg px-3 py-2 font-label-sm text-label-sm ${
                    !selectedRole ? 'bg-primary text-on-primary' : 'bg-surface-container text-secondary hover:bg-surface-variant'
                  }`}
                >
                  All ({roles.reduce((total, role) => total + (roleCounts[role] || 0), 0)})
                </Link>
                {roles.map((role) => (
                  <Link
                    key={role}
                    href={roleFilterHref(role)}
                    className={`rounded-lg px-3 py-2 font-label-sm text-label-sm ${
                      selectedRole === role ? 'bg-primary text-on-primary' : 'bg-surface-container text-secondary hover:bg-surface-variant'
                    }`}
                  >
                    {role} ({roleCounts[role] || 0})
                  </Link>
                ))}
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse text-left">
              <thead className="bg-surface-container-low">
                <tr className="font-label-sm text-label-sm text-secondary">
                  {['Name', 'No. Matrix', 'Gender', 'IC Number', 'Phone', 'Faculty', 'Current College', 'Role', 'Merit'].map((heading) => (
                    <th key={heading} className="whitespace-nowrap px-space-md py-3 font-semibold">{heading}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-container">
                {participations.data.length ? participations.data.map((student) => (
                  <tr key={student.id} className="font-body-sm text-body-sm text-on-surface">
                    <td className="min-w-40 px-space-md py-3">{student.student_name || '—'}</td>
                    <td className="whitespace-nowrap px-space-md py-3">{student.student_id || '—'}</td>
                    <td className="whitespace-nowrap px-space-md py-3"><GenderBadge gender={student.gender} /></td>
                    <td className="whitespace-nowrap px-space-md py-3">{student.ic_number || '—'}</td>
                    <td className="whitespace-nowrap px-space-md py-3">{student.phone_number || '—'}</td>
                    <td className="min-w-36 px-space-md py-3">{student.faculty || '—'}</td>
                    <td className="min-w-36 px-space-md py-3">{student.current_college || '—'}</td>
                    <td className="whitespace-nowrap px-space-md py-3">{student.role || '—'}</td>
                    <td className="whitespace-nowrap px-space-md py-3">{student.merit_allocation ?? '—'}</td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="9" className="px-space-lg py-12 text-center font-body-md text-body-md text-secondary">
                      {selectedRole
                        ? `No ${selectedRole} records have been added for this activity.`
                        : 'No student records have been added for this activity yet.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {participations.links?.length > 3 && (
            <nav className="flex flex-wrap justify-end gap-1 border-t border-surface-container p-space-md" aria-label="Student record pages">
              {participations.links.map((link, index) => {
                const label = link.label.replace(/<[^>]*>/g, '').replace(/&laquo;/g, '←').replace(/&raquo;/g, '→');
                return link.url ? (
                  <Link
                    key={`${link.url}-${index}`}
                    href={link.url}
                    preserveScroll
                    className={`rounded-lg px-3 py-1.5 font-label-sm text-label-sm ${
                      link.active ? 'bg-primary text-on-primary' : 'text-secondary hover:bg-surface-container'
                    }`}
                  >
                    {label}
                  </Link>
                ) : (
                  <span key={`disabled-${index}`} className="rounded-lg px-3 py-1.5 font-label-sm text-label-sm text-secondary/60">
                    {label}
                  </span>
                );
              })}
            </nav>
          )}
        </section>
      </div>
    </AppLayout>
  );
}
