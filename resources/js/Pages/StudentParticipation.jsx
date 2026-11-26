import { useEffect, useRef, useState } from 'react';
import { router } from '@inertiajs/react';
import AppLayout from '../Components/AppLayout';

const navigationSections = [
  { title: 'Felo & Staff Operations', items: [
    { label: 'Record Participation (CSV/Excel)', icon: 'table_view', path: 'participation-records', href: '/staff/participation-records', active: true },
    { label: 'Activity Review & Approvals', icon: 'fact_check', path: 'activity-reviews-and-approvals', href: '/admin' },
  ] },
];
const roles = [{ label: 'Staff', active: true }];
const profile = { name: 'KTR Staff', description: 'Participation Records' };
const files = {
  participation: [
    { label: 'CSV Template', href: '/templates/participation_template.csv' },
    { label: 'Excel Template', href: '/templates/participation_template.xlsx' },
  ],
  committee: [
    { label: 'CSV Template', href: '/templates/committee_template.csv' },
    { label: 'Excel Template', href: '/templates/committee_template.xlsx' },
  ],
};
const blankRecord = { matric_number: '', student_name: '', activity_name: '', activity_date: '', position: 'AJK' };
const inputClass = 'mt-1 w-full rounded-lg border border-surface-container bg-surface-container-low p-3 text-on-surface';
function Icon({ children }) { return <span className="material-symbols-outlined">{children}</span>; }

function UploadBox({ kind, title, explanation, sessionId }) {
  const inputRef = useRef(null);
  const [file, setFile] = useState(null);
  const [localError, setLocalError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const changeFile = (event) => {
    const next = event.target.files?.[0] ?? null;
    setLocalError('');
    if (next && !/\.(csv|xls|xlsx)$/i.test(next.name)) {
      setLocalError('Select a CSV or Excel (.xls/.xlsx) file.');
      setFile(null);
      event.target.value = '';
      return;
    }
    if (next && next.size > 10 * 1024 * 1024) {
      setLocalError('Maximum file size is 10 MB.');
      setFile(null);
      event.target.value = '';
      return;
    }
    setFile(next);
  };

  const submit = (event) => {
    event.preventDefault();
    if (!file || !sessionId || uploading) return;
    const payload = new FormData();
    payload.append('academic_session_id', String(sessionId));
    payload.append('file', file);
    setUploading(true);
    setLocalError('');
    router.post(`/staff/participation-records/import/${kind}`, payload, {
      forceFormData: true,
      preserveScroll: true,
      onProgress: (e) => setProgress(e.percentage ?? 0),
      onError: (errors) => setLocalError(errors.file || errors.academic_session_id || 'The upload could not be completed.'),
      onSuccess: () => { setFile(null); if (inputRef.current) inputRef.current.value = ''; },
      onFinish: () => setUploading(false),
    });
  };

  return (
    <section className="rounded-xl bg-surface-container-lowest p-6 shadow-sm">
      <div className="flex items-center gap-3">
        <Icon>upload_file</Icon>
        <h2 className="font-headline-sm font-bold text-on-surface">{title}</h2>
      </div>
      <p className="mt-2 text-sm text-on-surface-variant">{explanation}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        {files[kind].map((template) => (
          <a key={template.href} href={template.href} download className="rounded-lg border border-primary px-3 py-2 text-sm font-semibold text-primary hover:opacity-80">
            <Icon>download</Icon> {template.label}
          </a>
        ))}
      </div>
      <form onSubmit={submit} className="mt-5">
        <label htmlFor={`upload-${kind}`} className="flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed border-primary/40 bg-surface-container-low p-8 text-center">
          <Icon>file_upload</Icon>
          <span className="font-semibold text-on-surface">Choose CSV / Excel file</span>
          <span className="text-xs text-secondary">CSV, XLS or XLSX · Maximum 10 MB</span>
        </label>
        <input id={`upload-${kind}`} ref={inputRef} type="file" accept=".csv,.xls,.xlsx" onChange={changeFile} className="sr-only" />
        {file && <p className="mt-3 break-all text-sm text-on-surface">Selected: {file.name}</p>}
        {localError && <p role="alert" className="mt-3 text-sm text-red-600">{localError}</p>}
        {uploading && <p className="mt-2 text-sm text-secondary">Uploading: {progress}%</p>}
        <button disabled={!file || !sessionId || uploading} type="submit" className="mt-5 w-full rounded-lg bg-primary px-4 py-3 font-semibold text-on-primary disabled:opacity-50">
          {uploading ? 'Importing...' : `Import ${title}`}
        </button>
      </form>
    </section>
  );
}

function RecordsTable({ kind, pagination, onEdit, onDelete, filters, onFilter, batches = [] }) {
  const records = pagination?.data || [];
  const [search, setSearch] = useState(filters.search || '');

  useEffect(() => { setSearch(filters.search || ''); }, [filters.search]);

  const applySearch = (event) => {
    event.preventDefault();
    onFilter(kind, { ...filters, search });
  };

  return (
    <section className="mt-6 rounded-xl bg-surface-container-lowest p-6 shadow-sm">
      <h2 className="font-headline-sm font-bold text-on-surface">
        {kind === 'participation' ? 'Participation Records' : 'Committee Positions'} ({pagination?.total ?? 0} matching)
      </h2>
      <form onSubmit={applySearch} className="mt-4 flex flex-wrap items-end gap-3">
        <div className="min-w-[220px] flex-1">
          <label htmlFor={`search-${kind}`} className="block text-sm font-semibold">Search any column</label>
          <input id={`search-${kind}`} type="search" value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Matric, name, activity, date..." className={inputClass} />
        </div>
        <button type="submit" className="rounded-lg bg-primary px-4 py-3 font-semibold text-on-primary">Search</button>
        <button type="button" className="rounded-lg bg-surface-container-low px-4 py-3 font-semibold text-primary"
          onClick={() => { setSearch(''); onFilter(kind, { ...filters, search: '' }); }}>Clear</button>
        <div>
          <label htmlFor={`sort-${kind}`} className="block text-sm font-semibold">Sort by</label>
          <select id={`sort-${kind}`} className={inputClass} value={filters.sort}
            onChange={(e) => onFilter(kind, { ...filters, sort: e.target.value })}>
            <option value="activity_date">Activity Date</option>
            <option value="activity_name">Activity Name</option>
          </select>
        </div>
        <div>
          <label htmlFor={`direction-${kind}`} className="block text-sm font-semibold">Order</label>
          <select id={`direction-${kind}`} className={inputClass} value={filters.direction}
            onChange={(e) => onFilter(kind, { ...filters, direction: e.target.value })}>
            <option value="asc">Ascending</option>
            <option value="desc">Descending</option>
          </select>
        </div>
      </form>
      <div className="mt-4 max-w-lg">
        <label htmlFor={`filter-batch-${kind}`} className="block text-sm font-semibold">Show records from uploaded file</label>
        <select id={`filter-batch-${kind}`} value={filters.batch || 'all'} className={inputClass}
          onChange={(e) => onFilter(kind, { ...filters, batch: e.target.value })}>
          <option value="all">All uploaded files</option>
          <option value="legacy">Legacy records (uploaded before file tracking)</option>
          {batches.filter((b) => b.type === kind).map((b) =>
            <option key={b.id} value={String(b.id)}>{b.original_filename} — {b.activity_name} ({b.activity_date}) #{b.id}</option>)}
        </select>
      </div>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-surface-container-low text-on-surface"><tr>
            {['Matric Number', 'Student Name', 'Activity Name', ...(kind === 'committee' ? ['Position'] : []), 'Activity Date', 'Source File', 'Actions'].map((header) => <th key={header} className="p-3">{header}</th>)}
          </tr></thead>
          <tbody>{records.map((record) => <tr key={record.id} className="border-b border-surface-container">
            <td className="p-3">{record.matric_number}</td>
            <td className="p-3">{record.student_name}</td>
            <td className="p-3">{record.activity_name}</td>
            {kind === 'committee' && <td className="p-3">{record.position}</td>}
            <td className="p-3">{String(record.activity_date).slice(0, 10)}</td>
            <td className="p-3 text-xs text-secondary">{record.import_batch?.original_filename || 'Legacy record'}</td>
            <td className="p-3"><div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => onEdit(kind, record)} className="rounded-lg bg-surface-container-low px-3 py-2 font-semibold text-primary">Edit</button>
              <button type="button" onClick={() => onDelete(kind, record)} className="rounded-lg bg-red-50 px-3 py-2 font-semibold text-red-700">Delete</button>
            </div></td>
          </tr>)}</tbody>
        </table>
        {records.length === 0 && <p className="p-6 text-center text-secondary">No matching records for this academic session.</p>}
      </div>
      {pagination?.links?.length > 3 && <nav aria-label={`${kind} pages`} className="mt-4 flex flex-wrap gap-2">
        {pagination.links.map((link, i) => (
          <button key={i} type="button" disabled={!link.url || link.active} onClick={() => router.visit(link.url, { preserveScroll: true, preserveState: true })}
            className={`rounded border px-3 py-2 text-sm ${link.active ? 'bg-primary text-on-primary' : 'text-primary'} disabled:opacity-50`
            }>{link.label.replace(/<[^>]*>/g, '').replace(/&laquo;/g, '«').replace(/&raquo;/g, '»')}</button>
        ))}
      </nav>}
    </section>
  );
}

const defaultFilter = { search: '', sort: 'activity_date', direction: 'desc', batch: 'all' };

export default function StudentParticipation({ sessions = [], selectedSession = null, participations, committees, filters = {}, importReport = null, notice = null, batches = [] }) {
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(blankRecord);
  const [editError, setEditError] = useState({});
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState('participation');
  const [deleting, setDeleting] = useState(null);
  const [bulkDelete, setBulkDelete] = useState(null);
  const [confirmText, setConfirmText] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [deletingNow, setDeletingNow] = useState(false);
  const [deletingBatch, setDeletingBatch] = useState(null);
  const [batchConfirmation, setBatchConfirmation] = useState('');
  const selected = sessions.find((s) => Number(s.id) === Number(selectedSession));

  const getFilter = (kind) => ({ ...defaultFilter, ...(filters[kind] || {}) });
  const filterQuery = (kind, newFilter) => {
    const next = {
      participation: kind === 'participation' ? newFilter : getFilter('participation'),
      committee: kind === 'committee' ? newFilter : getFilter('committee'),
    };
    return {
      session: selectedSession,
      participation_search: next.participation.search,
      participation_sort: next.participation.sort,
      participation_direction: next.participation.direction,
      participation_batch: next.participation.batch,
      committee_search: next.committee.search,
      committee_sort: next.committee.sort,
      committee_direction: next.committee.direction,
      committee_batch: next.committee.batch,
    };
  };
  const changeFilter = (kind, newFilter) => {
    router.get('/staff/participation-records', filterQuery(kind, newFilter), {
      preserveState: true, preserveScroll: true, replace: true,
    });
  };

  const openEdit = (kind, record) => {
    setEditing({ kind, id: record.id });
    setForm({ matric_number: record.matric_number, student_name: record.student_name, activity_name: record.activity_name,
      activity_date: String(record.activity_date).slice(0, 10), position: record.position || 'AJK' });
    setEditError({});
  };
  const saveEdit = (event) => {
    event.preventDefault();
    if (!editing || saving) return;
    setSaving(true);
    router.patch(`/staff/participation-records/${editing.kind}/${editing.id}`, form, {
      preserveScroll: true,
      onError: (errors) => setEditError(errors),
      onSuccess: () => { setEditing(null); setEditError({}); },
      onFinish: () => setSaving(false),
    });
  };

  const confirmDelete = () => {
    if (!deleting || deletingNow) return;
    setDeletingNow(true);
    router.delete(`/staff/participation-records/${deleting.kind}/${deleting.record.id}`, {
      preserveScroll: true,
      onSuccess: () => setDeleting(null),
      onError: () => setDeleteError('Could not delete the selected record.'),
      onFinish: () => setDeletingNow(false),
    });
  };
  const confirmBulkDelete = () => {
    if (!bulkDelete || confirmText !== 'DELETE' || deletingNow) return;
    setDeletingNow(true);
    router.delete(`/staff/participation-records/${bulkDelete.kind}`, {
      data: {
        scope: bulkDelete.scope,
        academic_session_id: bulkDelete.scope === 'session' ? selectedSession : null,
        confirmation: confirmText,
      },
      preserveScroll: true,
      onSuccess: () => { setBulkDelete(null); setConfirmText(''); setDeleteError(''); },
      onError: (errors) => setDeleteError(Object.values(errors).join(' ') || 'Could not delete records.'),
      onFinish: () => setDeletingNow(false),
    });
  };

  const confirmDeleteBatch = () => {
    if (!deletingBatch || batchConfirmation !== 'DELETE' || deletingNow) return;
    setDeletingNow(true);
    setDeleteError('');
    router.delete(`/staff/participation-records/uploads/${deletingBatch.id}`, {
      data: { confirmation: 'DELETE' }, preserveScroll: true,
      onSuccess: () => { setDeletingBatch(null); setBatchConfirmation(''); },
      onError: (errors) => setDeleteError(Object.values(errors).join(' ') || 'Could not delete this upload.'),
      onFinish: () => setDeletingNow(false),
    });
  };

  return <AppLayout navigationSections={navigationSections} roles={roles} profile={profile} sessionLabel={`Academic Session: ${selected?.name || 'Select session'}`}>
    <div className="mx-auto w-full max-w-[1500px] pb-space-xl">
      <header className="border-b border-surface-container py-space-lg">
        <p className="text-sm font-semibold uppercase tracking-wider text-primary">Felo & Staff Operations</p>
        <h1 className="mt-2 font-headline-lg font-bold text-on-surface">Record Participation (CSV/Excel)</h1>
        <p className="mt-2 text-on-surface-variant">Import, search, sort, edit and delete participation or committee records.</p>
      </header>
      <div className="mt-6 max-w-sm">
        <label htmlFor="participation-session" className="block font-semibold text-on-surface">Academic Session</label>
        <select id="participation-session" className={inputClass} value={selectedSession || ''}
          onChange={(e) => router.get('/staff/participation-records', { session: e.target.value }, { preserveScroll: true })}>
          {sessions.map((s) => <option key={s.id} value={s.id}>{s.name}{s.is_current ? ' (Current)' : ''}</option>)}
        </select>
      </div>
      {notice && <div role="status" className="mt-5 rounded-lg bg-green-100 p-4 text-green-800">{notice}</div>}
      {importReport && <section role="status" className="mt-6 rounded-xl bg-surface-container-lowest p-5 shadow-sm">
        <h2 className="font-headline-sm font-bold">Import Results — {importReport.type === 'committee' ? 'Committee Positions' : 'Participation'}</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-4">
          {[['Rows processed', importReport.processed], ['Imported', importReport.imported], ['Duplicates skipped', importReport.duplicates], ['Invalid', importReport.invalid]].map(([label, number]) =>
            <div key={label} className="rounded-lg bg-surface-container-low p-3"><div className="text-2xl font-bold">{number}</div><div className="text-sm text-secondary">{label}</div></div>)}
        </div>
        {importReport.errors?.length > 0 && <div className="mt-4">
          <h3 className="font-semibold">Rows needing correction</h3>
          <ul className="mt-2 max-h-64 list-disc overflow-y-auto pl-6 text-sm text-red-700">
            {importReport.errors.map((error, i) => <li key={i}>Row {error.row}: {error.message}</li>)}
          </ul>
          <p className="mt-2 text-xs text-secondary">Showing up to 100 row errors. Fix those rows and upload again; previously imported rows will be skipped as duplicates.</p>
        </div>}
      </section>}
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <UploadBox key={`participation-${selectedSession}`} kind="participation" title="Participation Records" explanation="Upload students who participated in activities." sessionId={selectedSession} />
        <UploadBox key={`committee-${selectedSession}`} kind="committee" title="Committee Positions" explanation="Upload student committees: AJK, HOD, or MT only." sessionId={selectedSession} />
      </div>
      <section className="mt-6 rounded-xl bg-surface-container-lowest p-6 shadow-sm">
        <h2 className="font-headline-sm font-bold text-on-surface">Uploaded Activity Files ({batches.length})</h2>
        <p className="mt-2 text-sm text-on-surface-variant">
          Each upload is tracked separately. Delete File Records removes only student rows first imported from that file.
          Files uploaded before this feature was installed are shown as Legacy records and have no original file history.
        </p>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-surface-container-low"><tr>
              {['File / Activity', 'Category', 'Activity Date', 'Remaining Records', 'Uploaded', 'Actions'].map((h) => <th className="p-3" key={h}>{h}</th>)}
            </tr></thead>
            <tbody>
              {batches.map((b) => <tr key={b.id} className="border-b border-surface-container">
                <td className="p-3"><p className="break-all font-semibold">{b.original_filename}</p><p>{b.activity_name}</p></td>
                <td className="p-3">{b.type === 'committee' ? 'Committee' : 'Participation'}</td>
                <td className="p-3">{b.activity_date}</td>
                <td className="p-3">{b.remaining_count}</td>
                <td className="p-3">{b.created_at}</td>
                <td className="p-3"><button type="button" className="rounded-lg bg-red-50 px-3 py-2 font-semibold text-red-700"
                  onClick={() => { setDeletingBatch(b); setBatchConfirmation(''); setDeleteError(''); }}>
                  Delete File Records
                </button></td>
              </tr>)}
            </tbody>
          </table>
          {batches.length === 0 && <p className="p-6 text-center text-secondary">No tracked uploads for this session yet.</p>}
        </div>
      </section>
      <div className="mt-7 flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-2">
          <button type="button" onClick={() => setTab('participation')} className={`rounded-lg px-4 py-2 font-semibold ${tab === 'participation' ? 'bg-primary text-on-primary' : 'bg-surface-container-low text-primary'}`}>Participation</button>
          <button type="button" onClick={() => setTab('committee')} className={`rounded-lg px-4 py-2 font-semibold ${tab === 'committee' ? 'bg-primary text-on-primary' : 'bg-surface-container-low text-primary'}`}>Committee Positions</button>
        </div>
        <button type="button" className="rounded-lg border border-red-300 px-4 py-2 font-semibold text-red-700"
          onClick={() => { setConfirmText(''); setDeleteError(''); setBulkDelete({ kind: tab, scope: 'session' }); }}>
          Delete All {tab === 'participation' ? 'Participation' : 'Committee'} Records...
        </button>
      </div>
      {tab === 'participation'
        ? <RecordsTable kind="participation" pagination={participations} onEdit={openEdit} onDelete={(kind, record) => { setDeleteError(''); setDeleting({ kind, record }); }} filters={getFilter('participation')} onFilter={changeFilter} batches={batches} />
        : <RecordsTable kind="committee" pagination={committees} onEdit={openEdit} onDelete={(kind, record) => { setDeleteError(''); setDeleting({ kind, record }); }} filters={getFilter('committee')} onFilter={changeFilter} batches={batches} />}
    </div>

    {editing && <div className="fixed inset-0 z-[60] flex items-center justify-center overflow-y-auto bg-black/50 p-4">
      <div role="dialog" aria-modal="true" aria-labelledby="edit-record-title" className="my-auto w-full max-w-lg rounded-xl bg-surface-container-lowest p-6 shadow-xl">
        <h2 id="edit-record-title" className="font-headline-sm font-bold text-on-surface">Edit {editing.kind === 'committee' ? 'Committee Position' : 'Participation'} Record</h2>
        <form onSubmit={saveEdit} className="mt-4 space-y-3">
          {[['matric_number', 'Matric Number', 'text'], ['student_name', 'Student Name', 'text'], ['activity_name', 'Activity Name', 'text'], ['activity_date', 'Activity Date', 'date']].map(([key, label, type]) => <div key={key}>
            <label className="block font-semibold" htmlFor={`edit-${key}`}>{label}</label>
            <input id={`edit-${key}`} type={type} required className={inputClass} value={form[key]} onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))} />
            {editError[key] && <p className="mt-1 text-sm text-red-600">{editError[key]}</p>}
          </div>)}
          {editing.kind === 'committee' && <div>
            <label htmlFor="edit-position" className="block font-semibold">Position</label>
            <select id="edit-position" value={form.position} className={inputClass} onChange={(e) => setForm((f) => ({ ...f, position: e.target.value }))}>
              <option value="AJK">AJK</option><option value="HOD">HOD</option><option value="MT">MT</option>
            </select>
            {editError.position && <p className="text-sm text-red-600">{editError.position}</p>}
          </div>}
          <div className="flex justify-end gap-3 pt-4">
            <button type="button" disabled={saving} onClick={() => setEditing(null)} className="rounded-lg bg-surface-container-low px-4 py-2">Cancel</button>
            <button type="submit" disabled={saving} className="rounded-lg bg-primary px-5 py-2 font-semibold text-on-primary disabled:opacity-50">{saving ? 'Saving...' : 'Save Changes'}</button>
          </div>
        </form>
      </div>
    </div>}

    {deleting && <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
      <div role="alertdialog" aria-modal="true" aria-labelledby="delete-one-title" className="w-full max-w-md rounded-xl bg-surface-container-lowest p-6 shadow-xl">
        <h2 id="delete-one-title" className="font-headline-sm font-bold text-on-surface">Permanently delete this record?</h2>
        <p className="mt-3 text-on-surface-variant"><strong>{deleting.record.student_name}</strong> — {deleting.record.activity_name}</p>
        <p className="mt-2 text-sm text-red-700">Only this {deleting.kind} database record will be deleted. This cannot be undone.</p>
        {deleteError && <p role="alert" className="mt-2 text-red-700">{deleteError}</p>}
        <div className="mt-6 flex justify-end gap-3">
          <button type="button" disabled={deletingNow} onClick={() => setDeleting(null)} className="rounded-lg bg-surface-container-low px-4 py-2">Cancel</button>
          <button type="button" disabled={deletingNow} onClick={confirmDelete} className="rounded-lg bg-red-600 px-5 py-2 font-semibold text-white">{deletingNow ? 'Deleting...' : 'Delete Record'}</button>
        </div>
      </div>
    </div>}

    {deletingBatch && <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
      <div role="alertdialog" aria-modal="true" aria-labelledby="delete-upload-title"
        className="w-full max-w-lg rounded-xl bg-surface-container-lowest p-6 shadow-xl">
        <h2 id="delete-upload-title" className="font-headline-sm font-bold text-red-700">Delete records from this uploaded file?</h2>
        <p className="mt-3 break-all font-semibold">{deletingBatch.original_filename}</p>
        <p className="mt-1 text-on-surface-variant">{deletingBatch.activity_name} · {deletingBatch.activity_date} · {deletingBatch.remaining_count} record(s)</p>
        <p className="mt-3 text-sm text-red-700">This removes only records imported from this specific file, not other activities or uploads. It cannot be undone.</p>
        <label htmlFor="delete-file-confirmation" className="mt-4 block font-semibold">Type DELETE to confirm</label>
        <input id="delete-file-confirmation" className={inputClass} value={batchConfirmation}
          onChange={(e) => setBatchConfirmation(e.target.value)} autoComplete="off" />
        {deleteError && <p role="alert" className="mt-2 text-red-700">{deleteError}</p>}
        <div className="mt-6 flex justify-end gap-3">
          <button type="button" disabled={deletingNow} onClick={() => setDeletingBatch(null)} className="rounded-lg bg-surface-container-low px-4 py-2">Cancel</button>
          <button type="button" disabled={deletingNow || batchConfirmation !== 'DELETE'} onClick={confirmDeleteBatch}
            className="rounded-lg bg-red-600 px-5 py-2 font-semibold text-white disabled:opacity-50">{deletingNow ? 'Deleting...' : "Delete This File's Records"}</button>
        </div>
      </div>
    </div>}

    {bulkDelete && <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
      <div role="alertdialog" aria-modal="true" aria-labelledby="delete-all-title" className="w-full max-w-lg rounded-xl bg-surface-container-lowest p-6 shadow-xl">
        <h2 id="delete-all-title" className="font-headline-sm font-bold text-red-700">Delete all {bulkDelete.kind} records?</h2>
        <p className="mt-3 text-on-surface-variant">This permanently deletes database records, including those hidden by search filters. It does not affect the other record category.</p>
        <fieldset className="mt-4 space-y-2">
          <legend className="font-semibold">Deletion scope</legend>
          <label className="flex items-start gap-2"><input type="radio" name="delete-scope" checked={bulkDelete.scope === 'session'}
            onChange={() => { setConfirmText(''); setBulkDelete((x) => ({ ...x, scope: 'session' })); }} /> Selected session ({selected?.name || 'none'}) only</label>
          <label className="flex items-start gap-2 text-red-700"><input type="radio" name="delete-scope" checked={bulkDelete.scope === 'all'}
            onChange={() => { setConfirmText(''); setBulkDelete((x) => ({ ...x, scope: 'all' })); }} /> All academic sessions (entire {bulkDelete.kind} table)</label>
        </fieldset>
        <label htmlFor="delete-confirmation" className="mt-5 block font-semibold">Type DELETE to confirm</label>
        <input id="delete-confirmation" value={confirmText} onChange={(e) => setConfirmText(e.target.value)} autoComplete="off" className={inputClass} />
        {deleteError && <p role="alert" className="mt-2 text-red-700">{deleteError}</p>}
        <div className="mt-6 flex justify-end gap-3">
          <button type="button" disabled={deletingNow} onClick={() => setBulkDelete(null)} className="rounded-lg bg-surface-container-low px-4 py-2">Cancel</button>
          <button type="button" disabled={deletingNow || confirmText !== 'DELETE'} onClick={confirmBulkDelete}
            className="rounded-lg bg-red-600 px-5 py-2 font-semibold text-white disabled:opacity-50">{deletingNow ? 'Deleting...' : 'Permanently Delete All'}</button>
        </div>
      </div>
    </div>}
  </AppLayout>;
}
