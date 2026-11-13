import { useState } from 'react';
import { useForm } from '@inertiajs/react';
import AppLayout from '../Components/AppLayout';

const navigationSections = [
  {
    title: 'Collegiate Administration',
    items: [
      {
        label: 'PIC Directory Management',
        icon: 'contacts',
        path: 'pic-directory-management',
        href: '/admin/pic-directory',
        active: true,
      },
      {
        label: 'Activity Review & Approvals',
        icon: 'fact_check',
        path: 'activity-reviews-and-approvals',
        href: '/admin',
      },
    ],
  },
];

const roles = [
  { label: 'Admin: En. Razak', active: true },
];

const profile = {
  name: 'En. Razak',
  description: 'Collegiate Administrator',
};

function Icon({ children }) {
  return (
    <span className="material-symbols-outlined">
      {children}
    </span>
  );
}

const emptyForm = {
  photo: null,
  name: '',
  contact_number: '',
  email: '',
  role: '',
};

export default function PicDirectoryManagement({ personnel = [] }) {
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(null);
  const [selectedPerson, setSelectedPerson] = useState(null);
  const [notice, setNotice] = useState('');

  const {
    data,
    setData,
    post,
    delete: destroy,
    processing,
    errors,
    reset,
    clearErrors,
    progress,
  } = useForm(emptyForm);

  const filteredPersonnel = personnel.filter((person) =>
    `${person.name} ${person.email} ${person.role}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  const closeModal = () => {
    setModal(null);
    setSelectedPerson(null);
    reset();
    clearErrors();
  };

  const openAdd = () => {
    reset();
    clearErrors();
    setSelectedPerson(null);
    setModal('add');
    setNotice('');
  };

  const openEdit = (person) => {
    clearErrors();
    setSelectedPerson(person);

    setData({
      photo: null,
      name: person.name,
      contact_number: person.contact_number,
      email: person.email,
      role: person.role,
    });

    setModal('edit');
    setNotice('');
  };

  const openDelete = (person) => {
    setSelectedPerson(person);
    setModal('delete');
    setNotice('');
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    const isEditing = modal === 'edit';

    const url = isEditing
      ? `/admin/pic-directory/${selectedPerson.id}`
      : '/admin/pic-directory';

    post(url, {
      forceFormData: true,
      preserveScroll: true,
      onSuccess: () => {
        closeModal();
        setNotice(
          isEditing
            ? 'PIC updated successfully!'
            : 'PIC added successfully!'
        );
      },
    });
  };

  const handleDelete = () => {
    if (!selectedPerson) return;

    destroy(`/admin/pic-directory/${selectedPerson.id}`, {
      preserveScroll: true,
      onSuccess: () => {
        closeModal();
        setNotice('PIC deleted successfully!');
      },
    });
  };

  return (
    <AppLayout
      navigationSections={navigationSections}
      roles={roles}
      profile={profile}
      sessionLabel="Academic Session: Sem 1, 2026/2027"
    >
      <div className="mx-auto w-full max-w-[1500px] pb-space-xl">

        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-surface-container py-space-lg">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-primary">
              Residential Collegiate Administration
            </p>

            <h1 className="mt-2 font-headline-lg font-bold text-on-surface">
              PIC Directory Management
            </h1>

            <p className="mt-2 text-on-surface-variant">
              Manage staff, fellows, and personnel contact information.
            </p>
          </div>

          <button
            type="button"
            onClick={openAdd}
            className="flex items-center gap-2 rounded-lg bg-primary px-5 py-3 font-semibold text-on-primary"
          >
            <Icon>person_add</Icon>
            Add PIC
          </button>
        </header>

        {notice && (
          <div
            role="status"
            className="mt-5 rounded-lg bg-green-100 p-4 text-green-800"
          >
            {notice}
          </div>
        )}

        <section className="mt-6 rounded-xl bg-surface-container-lowest p-6 shadow-sm">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-headline-sm font-bold text-on-surface">
              Personnel Directory ({personnel.length})
            </h2>

            <input
              type="search"
              placeholder="Search by name, email or role..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full max-w-sm rounded-lg border border-surface-container bg-surface-container-low p-3 text-on-surface"
            />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-surface-container-low text-on-surface">
                <tr>
                  <th className="p-4">Personnel</th>
                  <th className="p-4">Contact</th>
                  <th className="p-4">Role</th>
                  <th className="p-4">Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredPersonnel.map((person) => (
                  <tr
                    key={person.id}
                    className="border-b border-surface-container"
                  >
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={person.photo_url}
                          alt={person.name}
                          className="h-12 w-12 rounded-full object-cover"
                        />
                        <span className="font-semibold text-on-surface">
                          {person.name}
                        </span>
                      </div>
                    </td>

                    <td className="p-4 text-sm text-on-surface-variant">
                      <div>{person.email}</div>
                      <div>{person.contact_number}</div>
                    </td>

                    <td className="p-4 text-on-surface">
                      {person.role}
                    </td>

                    <td className="p-4">
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => openEdit(person)}
                          className="rounded-lg bg-surface-container-low px-3 py-2 text-primary"
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          onClick={() => openDelete(person)}
                          className="rounded-lg bg-red-50 px-3 py-2 text-red-700"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredPersonnel.length === 0 && (
              <p className="p-8 text-center text-secondary">
                No personnel records found.
              </p>
            )}
          </div>
        </section>
      </div>

      {/* Add / Edit Modal */}
      {(modal === 'add' || modal === 'edit') && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center overflow-y-auto bg-black/50 p-4"
          role="presentation"
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="pic-form-title"
            className="my-auto w-full max-w-lg rounded-xl bg-surface-container-lowest p-6 shadow-xl"
          >
            <h2
              id="pic-form-title"
              className="mb-5 font-headline-sm font-bold text-on-surface"
            >
              {modal === 'add' ? 'Add New PIC' : 'Edit PIC'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="pic-photo" className="block font-semibold">
                  Personnel Photo
                </label>

                <input
                  id="pic-photo"
                  type="file"
                  accept="image/*"
                  required={modal === 'add'}
                  onChange={(e) =>
                    setData('photo', e.target.files?.[0] ?? null)
                  }
                  className="mt-2 block w-full"
                />
                {modal === 'edit' && (
                  <p className="mt-1 text-xs text-secondary">
                    Leave empty to keep the current photo.
                  </p>
                )}
                {errors.photo && (
                  <p className="text-sm text-red-600">{errors.photo}</p>
                )}
              </div>

              {[
                { key: 'name', label: 'Full Name', type: 'text' },
                { key: 'contact_number', label: 'Contact Number', type: 'tel' },
                { key: 'email', label: 'Institutional Email', type: 'email' },
              ].map((field) => (
                <div key={field.key}>
                  <label
                    htmlFor={field.key}
                    className="block font-semibold text-on-surface"
                  >
                    {field.label}
                  </label>

                  <input
                    id={field.key}
                    type={field.type}
                    required
                    value={data[field.key]}
                    onChange={(e) =>
                      setData(field.key, e.target.value)
                    }
                    className="mt-1 w-full rounded-lg border border-surface-container bg-surface-container-low p-3 text-on-surface"
                  />

                  {errors[field.key] && (
                    <p className="text-sm text-red-600">
                      {errors[field.key]}
                    </p>
                  )}
                </div>
              ))}

              <div>
                <label htmlFor="pic-role" className="block font-semibold">
                  Role
                </label>

                <select
                  id="pic-role"
                  required
                  value={data.role}
                  onChange={(e) => setData('role', e.target.value)}
                  className="mt-1 w-full rounded-lg border border-surface-container bg-surface-container-low p-3 text-on-surface"
                >
                  <option value="">Select role</option>
                  <option value="Staff">Staff</option>
                  <option value="Felo">Felo</option>
                  <option value="Principal">Principal</option>
                </select>

                {errors.role && (
                  <p className="text-sm text-red-600">{errors.role}</p>
                )}
              </div>

              {progress && (
                <p className="text-sm text-secondary">
                  Uploading: {progress.percentage}%
                </p>
              )}

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={processing}
                  className="rounded-lg bg-surface-container-low px-4 py-2"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={processing}
                  className="rounded-lg bg-primary px-5 py-2 font-semibold text-on-primary disabled:opacity-50"
                >
                  {processing ? 'Saving...' : 'Save PIC'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {modal === 'delete' && selectedPerson && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
          <div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="delete-pic-title"
            className="w-full max-w-md rounded-xl bg-surface-container-lowest p-6 shadow-xl"
          >
            <h2
              id="delete-pic-title"
              className="font-headline-sm font-bold text-on-surface"
            >
              Delete PIC?
            </h2>

            <p className="mt-3 text-on-surface-variant">
              Are you sure you want to permanently delete
              {' '}{selectedPerson.name}? This action cannot be undone.
            </p>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={closeModal}
                disabled={processing}
                className="rounded-lg bg-surface-container-low px-4 py-2"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleDelete}
                disabled={processing}
                className="rounded-lg bg-red-600 px-5 py-2 font-semibold text-white disabled:opacity-50"
              >
                {processing ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
