import { Link, router, useForm } from '@inertiajs/react';
import { useEffect, useMemo, useRef, useState } from 'react';
import AppLayout from '../Components/AppLayout';
import GenderBadge from '../Components/GenderBadge';

const adminProfile = {
  name: 'En. Razak',
  description: 'Collegiate Administrator',
};

const requiredStudentFields = [
  ['student_id', 'No. Matrix'],
  ['student_name', 'Name'],
  ['ic_number', 'IC Number'],
  ['phone_number', 'Phone Number'],
  ['faculty', 'Faculty'],
];

const studentRoles = ['MT', 'Volunteers', 'Participant', 'Crew'];
const editableStudentFields = [
  ...requiredStudentFields,
  ['current_college', 'Current College'],
  ['gender', 'Gender'],
  ['role', 'Role'],
];
const previewPageSize = 10;

const emptyStudent = {
  student_id: '',
  student_name: '',
  gender: '',
  ic_number: '',
  phone_number: '',
  faculty: '',
  current_college: '',
  role: '',
  student_email: '',
  additional_data: '{}',
};

function FieldError({ message }) {
  return message ? <p className="font-body-sm text-body-sm text-error" role="alert">{message}</p> : null;
}

function hasValue(value) {
  return value !== null && value !== undefined && String(value).trim() !== '';
}

export default function UploadStudentName({
  approvedApplications = [],
  participations = { data: [], links: [] },
  selectedSession: selectedSessionFromServer = '',
  activitySearch: activitySearchFromServer = '',
  studentPreview: studentPreviewFromServer = null,
  successMessage = null,
}) {
  const sessions = useMemo(() => {
    const availableSessions = new Map();

    approvedApplications.forEach(({ academic_year: academicYear, semester }) => {
      const key = `${academicYear}|${semester}`;
      availableSessions.set(key, { key, academicYear, semester: String(semester) });
    });

    return [...availableSessions.values()];
  }, [approvedApplications]);
  const [selectedSession, setSelectedSession] = useState(selectedSessionFromServer);
  const [activitySearch, setActivitySearch] = useState('');
  const [dataActivitySearch, setDataActivitySearch] = useState(activitySearchFromServer);
  const [isLoadingParticipations, setIsLoadingParticipations] = useState(false);
  const [studentPreview, setStudentPreview] = useState(studentPreviewFromServer);
  const [previewPage, setPreviewPage] = useState(1);
  const previewSectionRef = useRef(null);
  const shouldScrollToPreview = useRef(false);
  const initialSession = sessions.find(({ key }) => key === selectedSessionFromServer);
  const [editingStudent, setEditingStudent] = useState(null);
  const form = useForm({
    academic_year: initialSession?.academicYear ?? '',
    semester: initialSession?.semester ?? '',
    activity_application_id: '',
    merit_allocation: '',
    csv_file: null,
  });
  const saveForm = useForm({});
  const editForm = useForm(emptyStudent);
  const sessionApplications = approvedApplications.filter((application) => (
    `${application.academic_year}|${application.semester}` === selectedSession
  ));
  const previewSheetUrl = studentPreview
    ? approvedApplications.find(({ id }) => Number(id) === Number(studentPreview.activity_application_id))?.google_sheet_url
    : '';
  const matchingApplications = sessionApplications.filter((application) => (
    String(application.activity_name || '').toLowerCase().includes(activitySearch.trim().toLowerCase())
  ));
  const sessionRecords = selectedSession === selectedSessionFromServer
    && dataActivitySearch.trim() === activitySearchFromServer
    ? participations.data ?? []
    : [];
  const sessionRecordCount = selectedSession === selectedSessionFromServer
    && dataActivitySearch.trim() === activitySearchFromServer
    ? participations.total ?? 0
    : 0;
  const previewRows = studentPreview?.rows ?? [];
  const previewPageCount = Math.ceil(previewRows.length / previewPageSize);
  const visiblePreviewRows = previewRows.slice(
    (previewPage - 1) * previewPageSize,
    previewPage * previewPageSize,
  );

  useEffect(() => {
    const searchTerm = dataActivitySearch.trim();
    if (
      !selectedSession
      || selectedSession !== selectedSessionFromServer
      || searchTerm === activitySearchFromServer
    ) {
      return undefined;
    }

    const [academicYear, semester] = selectedSession.split('|');
    const parameters = { academic_year: academicYear, semester };
    if (searchTerm) parameters.activity_search = searchTerm;

    const timeout = window.setTimeout(() => {
      router.get('/admin/students/upload', parameters, {
        preserveState: true,
        preserveScroll: true,
        replace: true,
        onStart: () => setIsLoadingParticipations(true),
        onFinish: () => setIsLoadingParticipations(false),
      });
    }, 300);

    return () => window.clearTimeout(timeout);
  }, [activitySearchFromServer, dataActivitySearch, selectedSession, selectedSessionFromServer]);

  useEffect(() => {
    if (studentPreview && shouldScrollToPreview.current) {
      previewSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      shouldScrollToPreview.current = false;
    }
  }, [studentPreview]);

  const selectSession = (event) => {
    const nextSession = sessions.find(({ key }) => key === event.target.value);
    setSelectedSession(event.target.value);
    setActivitySearch('');
    setDataActivitySearch('');
    form.setData((data) => ({
      ...data,
      academic_year: nextSession?.academicYear ?? '',
      semester: nextSession?.semester ?? '',
      activity_application_id: '',
    }));

    if (nextSession) {
      const parameters = {
        academic_year: nextSession.academicYear,
        semester: nextSession.semester,
      };

      router.get('/admin/students/upload', parameters, {
        preserveState: true,
        preserveScroll: true,
        replace: true,
        onStart: () => setIsLoadingParticipations(true),
        onFinish: () => setIsLoadingParticipations(false),
      });
    } else {
      router.get('/admin/students/upload', {}, {
        preserveState: true,
        preserveScroll: true,
        replace: true,
      });
    }
  };

  const submit = (event) => {
    event.preventDefault();
    form.post('/admin/students/upload/preview', {
      forceFormData: true,
      preserveScroll: true,
      onSuccess: (page) => {
        form.setData('csv_file', null);
        shouldScrollToPreview.current = true;
        setStudentPreview(page.props.studentPreview || null);
        setPreviewPage(1);
      },
    });
  };

  const confirmUpload = (event) => {
    event.preventDefault();
    saveForm.clearErrors();
    saveForm.transform(() => ({
      academic_year: studentPreview.academic_year,
      semester: studentPreview.semester,
      activity_application_id: studentPreview.activity_application_id,
      merit_allocation: studentPreview.merit_allocation,
      role: studentPreview.role,
      rows: studentPreview.rows.map(({ id, role, ...row }) => row),
    }));
    saveForm.post('/admin/students/upload', {
      preserveScroll: true,
      onSuccess: () => {
        setStudentPreview(null);
        setPreviewPage(1);
      },
    });
  };

  const cancelPreview = () => {
    setStudentPreview(null);
    setPreviewPage(1);
    form.clearErrors();
    saveForm.clearErrors();
  };

  const openEdit = (student) => {
    editForm.clearErrors();
    editForm.setData({
      student_id: student.student_id ?? '',
      student_name: student.student_name ?? '',
      gender: student.gender ?? '',
      ic_number: student.ic_number ?? '',
      phone_number: student.phone_number ?? '',
      faculty: student.faculty ?? '',
      current_college: student.current_college ?? '',
      role: student.role ?? '',
      student_email: student.student_email ?? '',
      additional_data: JSON.stringify(student.additional_data ?? {}, null, 2),
    });
    setEditingStudent(student);
  };

  const saveStudent = (event) => {
    event.preventDefault();
    if (studentPreview) {
      let additionalData;
      try {
        additionalData = JSON.parse(editForm.data.additional_data);
      } catch {
        editForm.setError('additional_data', 'Enter valid JSON for the additional CSV data.');
        return;
      }

      if (!additionalData || typeof additionalData !== 'object') {
        editForm.setError('additional_data', 'Additional CSV data must be a JSON object or array.');
        return;
      }

      setStudentPreview((preview) => ({
        ...preview,
        rows: preview.rows.map((student) => (
          student.id === editingStudent.id
            ? { ...student, ...editForm.data, additional_data: additionalData }
            : student
        )),
      }));
      setEditingStudent(null);
      return;
    }

    editForm.patch(`/admin/students/${editingStudent.id}`, {
      preserveScroll: true,
      onSuccess: () => setEditingStudent(null),
    });
  };

  return (
    <AppLayout profile={adminProfile} sessionLabel="Academic Session: Sem 1, 2026/2027">
      <div className="flex w-full flex-col">
        {successMessage && (
          <div className="mb-space-lg flex items-center gap-space-md rounded-xl bg-tertiary p-space-md text-on-tertiary shadow-md" role="status" aria-live="polite">
            <span className="material-symbols-outlined">check_circle</span>
            <p className="font-label-lg text-label-lg">{successMessage}</p>
          </div>
        )}

        <section className="mb-space-xl flex flex-col justify-between gap-space-md border-b border-surface-container pb-space-md pt-space-lg xl:flex-row xl:items-center">
          <div>
            <div className="mb-1 flex flex-wrap items-center gap-2">
              <span className="font-label-sm text-label-sm font-semibold uppercase tracking-wider text-primary">
                Student Participation Management
              </span>
            </div>
            <h1 className="font-headline-lg text-headline-lg font-bold tracking-tight text-on-surface">Upload Student Participation</h1>
            <p className="mt-1 font-body-md text-body-md text-secondary">
              Import a student CSV for an approved activity and assign merit points to every student.
            </p>
          </div>
        </section>

        <div className="grid items-start gap-space-lg lg:grid-cols-[minmax(0,2fr)_minmax(18rem,1fr)]">
          <section className="w-full">
            <div className="flex flex-col overflow-hidden rounded-xl bg-surface-container-lowest shadow-sm">
              <div className="p-space-lg">
                <h2 className="font-headline-sm text-headline-sm text-on-surface">Student Participation Records</h2>
                <p className="font-body-sm text-body-sm text-secondary">
                  Choose an approved activity, set the merit allocation, and upload the student roster.
                </p>
              </div>

              <form onSubmit={submit} className="space-y-space-lg border-t border-surface-container p-space-lg">
                <div className="grid grid-cols-1 gap-space-md sm:grid-cols-2">
                  <div className="space-y-space-xs">
                    <label className="block font-label-md text-label-md font-semibold text-on-surface" htmlFor="semester_session">
                      Semester / Sesi <span className="text-error">*</span>
                    </label>
                    <select
                      id="semester_session"
                      value={selectedSession}
                      onChange={selectSession}
                      disabled={!sessions.length || form.processing}
                      className="h-11 w-full rounded-lg bg-surface-container-low px-3.5 font-body-md text-body-md text-on-surface focus:outline-none disabled:opacity-60"
                      required
                    >
                      <option value="">Select a semester and session</option>
                      {sessions.map(({ key, academicYear, semester }) => (
                        <option key={key} value={key}>Semester {semester} · {academicYear}</option>
                      ))}
                    </select>
                    <FieldError message={form.errors.academic_year || form.errors.semester} />
                  </div>

                  <div className="space-y-space-xs">
                    <label className="block font-label-md text-label-md font-semibold text-on-surface" htmlFor="activity_application_id">
                      Approved Activity Application <span className="text-error">*</span>
                    </label>
                    <input
                      type="search"
                      value={activitySearch}
                      onChange={(event) => setActivitySearch(event.target.value)}
                      placeholder={selectedSession ? 'Search approved programs...' : 'Select a semester/session first'}
                      disabled={!sessionApplications.length || form.processing}
                      className="h-9 w-full rounded-lg bg-surface-container-low px-3 font-body-sm text-body-sm text-on-surface placeholder:text-secondary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-60"
                      aria-label="Search approved programs"
                    />
                    <select
                      id="activity_application_id"
                      value={form.data.activity_application_id}
                      onChange={(event) => form.setData('activity_application_id', event.target.value)}
                      disabled={!selectedSession || !matchingApplications.length || form.processing}
                      className="h-11 w-full rounded-lg bg-surface-container-low px-3.5 font-body-md text-body-md text-on-surface focus:outline-none disabled:opacity-60"
                      required
                    >
                      <option value="">{selectedSession ? 'Select an approved activity' : 'Select a semester/session first'}</option>
                      {matchingApplications.map((application) => (
                        <option key={application.id} value={application.id}>
                          {application.activity_name || 'Untitled activity'}
                        </option>
                      ))}
                    </select>
                    <FieldError message={form.errors.activity_application_id} />
                    {selectedSession && !sessionApplications.length && (
                      <p className="font-body-sm text-body-sm text-secondary">
                        There are no approved activity applications for this semester/session.
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-space-md sm:grid-cols-2">
                  <div className="space-y-space-xs">
                    <label className="block font-label-md text-label-md font-semibold text-on-surface" htmlFor="merit_allocation">
                      Merit Allocation (points per student) <span className="text-error">*</span>
                    </label>
                    <input
                      id="merit_allocation"
                      type="number"
                      min="1"
                      max="1000"
                      step="1"
                      value={form.data.merit_allocation}
                      onChange={(event) => form.setData('merit_allocation', event.target.value)}
                      disabled={form.processing}
                      className="h-11 w-full rounded-lg bg-surface-container-low px-3.5 font-body-md text-body-md text-on-surface focus:bg-surface-container focus:outline-none disabled:opacity-60"
                      required
                    />
                    <p className="font-body-sm text-body-sm text-secondary">This value will be saved for each student in the CSV.</p>
                    <FieldError message={form.errors.merit_allocation} />
                  </div>

                  <div className="space-y-space-xs">
                    <label className="block font-label-md text-label-md font-semibold text-on-surface" htmlFor="student_role">
                      Role <span className="text-error">*</span>
                    </label>
                    <select
                      id="student_role"
                      value={form.data.role}
                      onChange={(event) => form.setData('role', event.target.value)}
                      disabled={form.processing}
                      className="h-11 w-full rounded-lg bg-surface-container-low px-3.5 font-body-md text-body-md text-on-surface focus:outline-none disabled:opacity-60"
                      required
                    >
                      <option value="">Select a role</option>
                      {studentRoles.map((role) => <option key={role} value={role}>{role}</option>)}
                    </select>
                    <p className="font-body-sm text-body-sm text-secondary">This role will be assigned to every student in the CSV.</p>
                    <FieldError message={form.errors.role} />
                  </div>
                </div>

                <section className="space-y-space-md border-b border-surface-container pb-space-lg">
                  <div>
                    <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface">Student CSV File</h3>
                    <p className="font-body-sm text-body-sm text-secondary">
                      Required columns are student ID, name, IC number, phone number, and faculty.
                      Current college, gender, and email are optional; other columns are also retained.
                    </p>
                  </div>
                  <a
                    href="data:text/csv;charset=utf-8,student_id%2Cname%2Cgender%2Cic_number%2Cphone_number%2Cfaculty%2Ccurrent_college%2Cemail%2Cprogram%0AA23CS0001%2CSample%20Student%2CFemale%2C000000-00-0000%2C0123456789%2CFaculty%20of%20Computing%2CKolej%20Tun%20Razak%2Cstudent%40example.edu%2CComputer%20Science%0A"
                    download="student-template.csv"
                    className="inline-flex font-label-md text-label-md font-semibold text-primary underline underline-offset-2"
                  >
                    Download CSV template
                  </a>
                  <input
                    type="file"
                    accept=".csv,text/csv"
                    onChange={(event) => form.setData('csv_file', event.target.files?.[0] ?? null)}
                    disabled={form.processing}
                    className="block w-full rounded-lg border border-outline-variant bg-surface-container-lowest p-2 font-body-sm text-body-sm text-on-surface file:mr-3 file:rounded-md file:border-0 file:bg-primary file:px-3 file:py-2 file:font-label-sm file:text-label-sm file:text-on-primary disabled:opacity-60"
                    required
                  />
                  <FieldError message={form.errors.csv_file} />
                </section>

                <div className="flex flex-col justify-between gap-space-sm sm:flex-row sm:items-center">
                  <p className="font-body-sm text-body-sm text-secondary">CSV files are limited to 10 MB and 10,000 student records.</p>
                  <button
                    type="submit"
                    disabled={form.processing || !selectedSession || !matchingApplications.length}
                    className="flex h-10 items-center justify-center gap-2 rounded-lg bg-primary px-5 font-label-lg text-label-lg text-on-primary shadow-md transition-all hover:bg-primary-container disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <span className="material-symbols-outlined text-[20px]">upload_file</span>
                    {form.processing ? 'Preparing preview...' : 'Preview Student Data'}
                  </button>
                </div>
              </form>
            </div>
          </section>

          <aside className="overflow-hidden rounded-xl bg-surface-container-lowest shadow-sm">
            <div className="border-b border-surface-container bg-surface-container-low p-space-lg">
              <div className="flex items-center gap-space-sm">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-container text-on-primary-container">
                  <span className="material-symbols-outlined">rule</span>
                </div>
                <div>
                  <h2 className="font-headline-sm text-headline-sm font-bold text-on-surface">CSV Sheet Rules</h2>
                  <p className="font-body-sm text-body-sm text-secondary">A quick checklist before you upload.</p>
                </div>
              </div>
            </div>

            <div className="space-y-space-md p-space-lg">
              <div className="rounded-lg border border-outline-variant bg-surface-container-low p-space-md">
                <p className="mb-space-sm font-label-sm text-label-sm font-semibold uppercase tracking-wide text-secondary">
                  Required CSV columns
                </p>
                <ul className="grid grid-cols-1 gap-y-space-sm font-body-sm text-body-sm text-on-surface">
                  {requiredStudentFields.map(([field, label]) => (
                    <li key={field} className="flex items-center gap-space-sm">
                      <span className="material-symbols-outlined text-[18px] text-tertiary">check_circle</span>
                      {label}
                    </li>
                  ))}
                </ul>
                <p className="mt-space-sm font-body-sm text-body-sm text-secondary">
                  Current college is optional. Gender values are shown with color-coded labels in the student table.
                </p>
              </div>

              <div className="rounded-lg border border-amber-200 bg-amber-50 p-space-md">
                <div className="flex items-start gap-space-sm">
                  <span className="material-symbols-outlined mt-0.5 text-[18px] text-amber-800">info</span>
                  <p className="font-body-sm text-body-sm text-amber-900">
                    Include every required column header. If a value is blank or incorrect, staff can fix it in the student list below.
                  </p>
                </div>
              </div>

              <div className="space-y-space-xs">
                <p className="font-label-md text-label-md font-semibold text-on-surface">Role is set on this form</p>
                <p className="font-body-sm text-body-sm text-secondary">
                  The selected role applies to every row. Extra CSV columns are saved with each student record.
                </p>
              </div>

              <a
                href="/admin/students/upload/rules"
                className="flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 font-label-md text-label-md font-semibold text-on-primary shadow-sm transition-colors hover:bg-primary-container"
              >
                <span className="material-symbols-outlined text-[18px]">download</span>
                Download Rules as PDF
              </a>
            </div>
          </aside>
        </div>

        {studentPreview && (
          <section
            ref={previewSectionRef}
            className="mt-space-xl flex scroll-mt-20 flex-col overflow-hidden rounded-xl bg-surface-container-lowest shadow-sm"
          >
            <div className="flex flex-col justify-between gap-space-md p-space-lg sm:flex-row sm:items-center">
              <div>
                <h2 className="font-headline-sm text-headline-sm text-on-surface">Review CSV Data</h2>
                <p className="font-body-sm text-body-sm text-secondary">
                  {studentPreview.activity_name} · {studentPreview.rows.length} students · {studentPreview.role}
                </p>
                <p className="mt-1 font-body-sm text-body-sm font-semibold text-primary">
                  These records have not been saved. Review the data and edit any missing or incorrect information before confirming.
                </p>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-space-sm">
                {previewSheetUrl && (
                  <a
                    className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 font-label-sm text-label-sm font-semibold text-on-primary hover:bg-primary-container"
                    href={previewSheetUrl}
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    <span className="material-symbols-outlined text-[18px]">open_in_new</span>
                    View CSV
                  </a>
                )}
                <span className="font-code text-code text-secondary">
                  Page {previewPage} of {previewPageCount}
                </span>
              </div>
            </div>

            <div className="overflow-x-auto border-t border-surface-container">
              <table className="min-w-full border-collapse text-left">
                <thead className="bg-surface-container-low">
                  <tr className="font-label-sm text-label-sm text-secondary">
                    {['Name', 'No. Matrix', 'Gender', 'IC Number', 'Phone', 'Faculty', 'Current College', 'Email', 'Edit'].map((heading) => (
                      <th key={heading} className="whitespace-nowrap px-space-md py-3 font-semibold">{heading}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-container">
                  {visiblePreviewRows.map((student) => {
                    return (
                      <tr key={student.id} className="align-top font-body-sm text-body-sm text-on-surface">
                        <td className="min-w-40 px-space-md py-3">{student.student_name || '—'}</td>
                        <td className="whitespace-nowrap px-space-md py-3">{student.student_id || '—'}</td>
                        <td className="whitespace-nowrap px-space-md py-3"><GenderBadge gender={student.gender} /></td>
                        <td className="whitespace-nowrap px-space-md py-3">{student.ic_number || '—'}</td>
                        <td className="whitespace-nowrap px-space-md py-3">{student.phone_number || '—'}</td>
                        <td className="min-w-36 px-space-md py-3">{student.faculty || '—'}</td>
                        <td className="min-w-36 px-space-md py-3">{student.current_college || '—'}</td>
                        <td className="whitespace-nowrap px-space-md py-3">{student.student_email || '—'}</td>
                        <td className="whitespace-nowrap px-space-md py-3">
                          <button
                            type="button"
                            onClick={() => openEdit(student)}
                            className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 font-label-md text-label-md font-semibold text-primary hover:bg-surface-container"
                            aria-label={`Edit ${student.student_name || 'student'} record`}
                          >
                            <span className="material-symbols-outlined text-[18px]">edit</span>
                            Edit
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <form onSubmit={confirmUpload} className="flex flex-col gap-space-md border-t border-surface-container p-space-lg">
              <FieldError message={saveForm.errors.rows} />
              <div className="flex flex-col justify-between gap-space-md sm:flex-row sm:items-center">
                <div className="flex items-center gap-space-sm">
                  <button
                    type="button"
                    disabled={previewPage <= 1}
                    onClick={() => setPreviewPage((page) => page - 1)}
                    className="rounded-lg px-3 py-2 font-label-sm text-label-sm text-secondary hover:bg-surface-container disabled:opacity-40"
                  >
                    Previous
                  </button>
                  <span className="font-body-sm text-body-sm text-secondary">
                    Showing {(previewPage - 1) * previewPageSize + 1}–{Math.min(previewPage * previewPageSize, previewRows.length)} of {previewRows.length}
                  </span>
                  <button
                    type="button"
                    disabled={previewPage >= previewPageCount}
                    onClick={() => setPreviewPage((page) => page + 1)}
                    className="rounded-lg px-3 py-2 font-label-sm text-label-sm text-secondary hover:bg-surface-container disabled:opacity-40"
                  >
                    Next
                  </button>
                </div>
                <div className="flex flex-col-reverse gap-space-sm sm:flex-row">
                  <button
                    type="button"
                    onClick={cancelPreview}
                    disabled={saveForm.processing}
                    className="h-10 rounded-lg px-4 font-label-md text-label-md font-semibold text-secondary hover:bg-surface-container"
                  >
                    Cancel Preview
                  </button>
                  <button
                    type="submit"
                    disabled={saveForm.processing}
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-primary px-5 font-label-md text-label-md font-semibold text-on-primary shadow-sm hover:bg-primary-container disabled:opacity-60"
                  >
                    <span className="material-symbols-outlined text-[18px]">save</span>
                    Confirm and Save {previewRows.length} Students
                  </button>
                </div>
              </div>
            </form>
          </section>
        )}

        {!studentPreview && (
        <section className="mt-space-xl flex flex-col overflow-hidden rounded-xl bg-surface-container-lowest shadow-sm">
          <div className="flex flex-col justify-between gap-space-md p-space-lg lg:flex-row lg:items-center">
            <div>
              <h2 className="font-headline-sm text-headline-sm text-on-surface">Uploaded Student Data</h2>
              <p className="font-body-sm text-body-sm text-secondary">
                Search for an approved activity to view its student records and edit any missing or inaccurate details.
              </p>
              <p className="mt-1 font-body-sm text-body-sm font-semibold text-primary">
                To view an activity’s saved list, go to Manage Activities &amp; Paperwork, open the application’s View section, and select List of Students.
              </p>
            </div>
            <div className="w-full space-y-space-xs lg:max-w-sm">
              <label htmlFor="student-table-activity-search" className="block font-label-sm text-label-sm font-semibold text-on-surface">
                Search by program name
              </label>
              <input
                id="student-table-activity-search"
                type="search"
                value={dataActivitySearch}
                onChange={(event) => setDataActivitySearch(event.target.value)}
                placeholder="Enter a program name..."
                maxLength={100}
                disabled={isLoadingParticipations}
                className="h-9 w-full rounded-lg bg-surface-container-low px-3 font-body-sm text-body-sm text-on-surface placeholder:text-secondary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-60"
              />
              {!selectedSession && (
                <p className="font-body-sm text-body-sm text-secondary">
                  Select a semester/session to apply this search.
                </p>
              )}
              {selectedSession && !dataActivitySearch.trim() && (
                <p className="font-body-sm text-body-sm text-secondary">
                  Enter an activity name to view its student records.
                </p>
              )}
              <span className="font-code text-code text-secondary">{sessionRecordCount} records</span>
            </div>
          </div>

          <div className="overflow-x-auto border-t border-surface-container">
            <table className="min-w-full border-collapse text-left">
              <thead className="bg-surface-container-low">
                <tr className="font-label-sm text-label-sm text-secondary">
                  {['Name', 'No. Matrix', 'Gender', 'IC Number', 'Phone', 'Faculty', 'Current College', 'Role', 'Activity', 'Merit', 'Other CSV Data', 'Data Check'].map((heading) => (
                    <th key={heading || 'action'} className="whitespace-nowrap px-space-md py-3 font-semibold">{heading}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-container">
                {sessionRecords.length ? sessionRecords.map((student) => {
                  const missingFields = requiredStudentFields
                    .filter(([field]) => !hasValue(student[field]))
                    .map(([, label]) => label);
                  if (!hasValue(student.role)) missingFields.push('Role');
                  const incomplete = missingFields.length > 0;
                  const additionalData = student.additional_data && typeof student.additional_data === 'object'
                    ? Object.entries(student.additional_data)
                    : [];

                  return (
                    <tr key={student.id} className="align-top font-body-sm text-body-sm text-on-surface">
                      <td className="min-w-40 px-space-md py-3">{student.student_name || '—'}</td>
                      <td className="whitespace-nowrap px-space-md py-3">{student.student_id || '—'}</td>
                      <td className="whitespace-nowrap px-space-md py-3"><GenderBadge gender={student.gender} /></td>
                      <td className="whitespace-nowrap px-space-md py-3">{student.ic_number || '—'}</td>
                      <td className="whitespace-nowrap px-space-md py-3">{student.phone_number || '—'}</td>
                      <td className="min-w-36 px-space-md py-3">{student.faculty || '—'}</td>
                      <td className="min-w-36 px-space-md py-3">{student.current_college || '—'}</td>
                      <td className="whitespace-nowrap px-space-md py-3">{student.role || '—'}</td>
                      <td className="min-w-44 px-space-md py-3">
                        <span className="block font-medium">{student.activity_application?.activity_name || 'Activity unavailable'}</span>
                        <span className="text-secondary">Sem {student.semester} · {student.academic_year}</span>
                      </td>
                      <td className="whitespace-nowrap px-space-md py-3">{student.merit_allocation}</td>
                      <td className="min-w-48 px-space-md py-3">
                        {additionalData.length ? additionalData.map(([key, value]) => (
                          <span key={key} className="mb-1 block">
                            <span className="font-semibold">{key}:</span> {String(value)}
                          </span>
                        )) : '—'}
                      </td>
                      <td className="min-w-48 px-space-md py-3">
                        <div className="flex flex-col items-start gap-space-xs">
                          <span className={`rounded-full px-2.5 py-1 font-label-sm text-label-sm font-semibold ${
                            incomplete ? 'bg-amber-50 text-amber-900' : 'bg-tertiary-fixed text-tertiary'
                          }`}>
                            {incomplete ? 'Needs details' : 'Complete'}
                          </span>
                          {incomplete && (
                            <span className="font-body-sm text-body-sm text-secondary">
                              Missing: {missingFields.join(', ')}
                            </span>
                          )}
                        <button
                          type="button"
                          onClick={() => openEdit(student)}
                          className={`inline-flex items-center gap-1 rounded-lg px-3 py-1.5 font-label-md text-label-md font-semibold ${
                            incomplete
                              ? 'bg-amber-100 text-amber-900 hover:bg-amber-200'
                              : 'text-primary hover:bg-surface-container'
                          }`}
                          aria-label={`Edit ${student.student_name || 'student'} record`}
                          title={incomplete ? 'Edit missing or incorrect student details' : 'Edit student details'}
                        >
                          <span className="material-symbols-outlined text-[18px]">edit</span>
                          Edit
                        </button>
                        </div>
                      </td>
                    </tr>
                  );
                }) : (
                  <tr>
                    <td colSpan="12" className="px-space-lg py-12 text-center font-body-md text-body-md text-secondary">
                      {!selectedSession
                        ? 'Select a semester/session above to view student records.'
                        : !dataActivitySearch.trim()
                          ? 'Enter an activity name above to view its student records.'
                        : isLoadingParticipations || dataActivitySearch.trim() !== activitySearchFromServer
                          ? 'Loading student records...'
                          : 'No student records were found for this activity in the selected semester/session.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {selectedSession === selectedSessionFromServer
            && dataActivitySearch.trim() === activitySearchFromServer
            && participations.links?.length > 3 && (
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
        )}
      </div>

      {editingStudent && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-on-surface/60 p-space-md backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="edit-student-title">
          <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-xl bg-surface-container-lowest shadow-2xl">
            <header className="flex items-start justify-between gap-space-md border-b border-surface-container p-space-lg">
              <div>
                <h2 id="edit-student-title" className="font-headline-md text-headline-md font-bold text-on-surface">
                  {studentPreview ? 'Edit Preview Student' : 'Edit Student Record'}
                </h2>
                <p className="font-body-sm text-body-sm text-secondary">
                  {studentPreview
                    ? 'Changes will only apply to this preview until you confirm the upload.'
                    : `Complete or correct the student details for ${editingStudent.activity_application?.activity_name || 'this activity'}.`}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingStudent(null)}
                disabled={editForm.processing}
                aria-label="Close edit student dialog"
                className="rounded-lg p-2 text-secondary hover:bg-surface-container disabled:opacity-60"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </header>

            <form onSubmit={saveStudent} className="flex-1 space-y-space-lg overflow-y-auto p-space-lg">
              <div className="grid grid-cols-1 gap-space-md sm:grid-cols-2">
                {editableStudentFields
                  .filter(([field]) => !(studentPreview && field === 'role'))
                  .map(([field, label]) => {
                  const isRequired = !['current_college', 'gender'].includes(field);
                  return (
                    <div key={field} className="space-y-space-xs">
                      <label htmlFor={`edit-${field}`} className="block font-label-md text-label-md font-semibold text-on-surface">
                        {label} {isRequired && <span className="text-error">*</span>}
                      </label>
                      {field === 'role' ? (
                        <select
                          id={`edit-${field}`}
                          value={editForm.data[field]}
                          onChange={(event) => editForm.setData(field, event.target.value)}
                          disabled={editForm.processing}
                          required={isRequired}
                          className="h-11 w-full rounded-lg bg-surface-container-low px-3.5 font-body-md text-body-md text-on-surface focus:outline-none disabled:opacity-60"
                        >
                          <option value="">Select a role</option>
                          {studentRoles.map((role) => <option key={role} value={role}>{role}</option>)}
                        </select>
                      ) : (
                        <input
                          id={`edit-${field}`}
                          value={editForm.data[field]}
                          onChange={(event) => editForm.setData(field, event.target.value)}
                          disabled={editForm.processing}
                          required={isRequired}
                          className="h-11 w-full rounded-lg bg-surface-container-low px-3.5 font-body-md text-body-md text-on-surface focus:bg-surface-container focus:outline-none disabled:opacity-60"
                        />
                      )}
                      <FieldError message={editForm.errors[field]} />
                    </div>
                  );
                })}
                <div className="space-y-space-xs sm:col-span-2">
                  <label htmlFor="edit-student_email" className="block font-label-md text-label-md font-semibold text-on-surface">Email (optional)</label>
                  <input
                    id="edit-student_email"
                    type="email"
                    value={editForm.data.student_email}
                    onChange={(event) => editForm.setData('student_email', event.target.value)}
                    disabled={editForm.processing}
                    className="h-11 w-full rounded-lg bg-surface-container-low px-3.5 font-body-md text-body-md text-on-surface focus:bg-surface-container focus:outline-none disabled:opacity-60"
                  />
                  <FieldError message={editForm.errors.student_email} />
                </div>
                <div className="space-y-space-xs sm:col-span-2">
                  <label htmlFor="edit-additional_data" className="block font-label-md text-label-md font-semibold text-on-surface">Other CSV Data (JSON)</label>
                  <textarea
                    id="edit-additional_data"
                    value={editForm.data.additional_data}
                    onChange={(event) => editForm.setData('additional_data', event.target.value)}
                    disabled={editForm.processing}
                    rows="5"
                    className="w-full rounded-lg bg-surface-container-low p-3 font-code text-code text-on-surface focus:outline-none disabled:opacity-60"
                  />
                  <FieldError message={editForm.errors.additional_data} />
                </div>
              </div>

              <footer className="flex flex-col justify-end gap-space-sm border-t border-surface-container pt-space-md sm:flex-row">
                <button
                  type="button"
                  onClick={() => setEditingStudent(null)}
                  disabled={editForm.processing}
                  className="h-10 rounded-lg px-4 font-label-md text-label-md font-semibold text-secondary hover:bg-surface-container"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editForm.processing}
                  className="flex h-10 items-center justify-center gap-2 rounded-lg bg-primary px-5 font-label-lg text-label-lg text-on-primary shadow-md transition-all hover:bg-primary-container disabled:opacity-60"
                >
                  {studentPreview
                    ? 'Apply Changes'
                    : editForm.processing ? 'Saving...' : 'Save Student Details'}
                </button>
              </footer>
            </form>
          </div>
        </div>
      )}

      {(form.processing || saveForm.processing || editForm.processing || isLoadingParticipations) && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-on-surface/40 p-space-md backdrop-blur-sm"
          role="status"
          aria-live="polite"
          aria-label="Loading"
        >
          <div className="flex min-w-56 flex-col items-center gap-space-sm rounded-xl bg-surface-container-lowest px-space-xl py-space-lg shadow-2xl">
            <span className="material-symbols-outlined animate-spin text-5xl text-primary">progress_activity</span>
            <p className="font-label-md text-label-md font-semibold text-on-surface">
              {form.processing
                ? 'Preparing CSV preview...'
                : saveForm.processing
                  ? 'Saving student data...'
                  : editForm.processing
                  ? 'Saving student details...'
                  : 'Loading student records...'}
            </p>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
