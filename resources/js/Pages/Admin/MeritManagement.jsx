import React, { useState, useMemo } from 'react';
import { Head, useForm } from '@inertiajs/react';
import AppLayout from '../../Components/AppLayout';

const adminNavigation = [
    {
        title: 'COLLEGIATE ADMINISTRATION',
        items: [
            {
                label: 'Admin Analytics Dashboard',
                icon: 'dashboard',
                href: '/admin',
            },
            {
                label: 'Activity Review & Approvals',
                icon: 'task_alt',
                href: '/admin',
            },
            {
                label: 'Support & External Links',
                icon: 'link',
                href: '/admin/support',
            },
        ],
    },
    {
        title: 'MASTER DATA MANAGEMENT',
        items: [
            {
                label: 'Roles Management',
                icon: 'badge',
                href: '#',
            },
            {
                label: 'Status Management',
                icon: 'toggle_on',
                href: '#',
            },
            {
                label: 'Merit Management',
                icon: 'military_tech',
                href: '/admin/master-data/merit',
                active: true,
            },
        ],
    },
];

const adminProfile = {
    name: 'En. Razak',
    description: 'Collegiate Administrator / Staff',
};

export default function MeritManagement({ meritTypes = [] }) {
    const [editingItem, setEditingItem] = useState(null);
    const [viewingItem, setViewingItem] = useState(null);
    const [deletingItem, setDeletingItem] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [toast, setToast] = useState('');
    const csrfToken = document.querySelector('meta[name="csrf-token"]').content;

    const {
        data,
        setData,
        post,
        put,
        delete: destroy,
        transform,
        processing,
        errors,
        reset,
        clearErrors,
    } = useForm({
        name: '',
        code: '',
        points: 2,
        badge_color: 'red',
    });

    const showToast = (message) => {
        setToast(message);
        setTimeout(() => setToast(''), 3500);
    };

    const filteredMeritTypes = useMemo(() => {
        const q = searchQuery.trim().toLowerCase();
        if (!q) return meritTypes;
        return meritTypes.filter(
            (item) =>
                item.name.toLowerCase().includes(q) ||
                item.code.toLowerCase().includes(q) ||
                String(item.points).includes(q) ||
                item.badge_color.toLowerCase().includes(q)
        );
    }, [meritTypes, searchQuery]);

    const handleColorChange = (color) => {
        setData((prev) => ({
            ...prev,
            badge_color: color,
            points: color === 'red' ? 2 : 1,
        }));
    };

    const handleEditClick = (item) => {
        setEditingItem(item);
        clearErrors();
        setData({
            name: item.name,
            code: item.code,
            points: item.points,
            badge_color: item.badge_color || 'red',
        });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleCancelEdit = () => {
        setEditingItem(null);
        clearErrors();
        reset();
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        transform((current) => ({
            ...current,
            code: current.code.trim().toUpperCase(),
            points: parseInt(current.points, 10) || 1,
        }));

        if (editingItem) {
            put(`/admin/master-data/merit/${editingItem.id}`, {
                headers: { 'X-CSRF-TOKEN': csrfToken },
                preserveScroll: true,
                onSuccess: () => {
                    showToast(`Merit type "${data.name}" updated successfully.`);
                    handleCancelEdit();
                },
            });
        } else {
            post('/admin/master-data/merit', {
                headers: { 'X-CSRF-TOKEN': csrfToken },
                preserveScroll: true,
                onSuccess: () => {
                    showToast(`Merit type "${data.name}" created successfully.`);
                    reset();
                },
            });
        }
    };

    const handleConfirmDelete = () => {
        if (!deletingItem) return;
        const target = deletingItem;

        destroy(`/admin/master-data/merit/${target.id}`, {
            headers: { 'X-CSRF-TOKEN': csrfToken },
            preserveScroll: true,
            onSuccess: () => {
                showToast(`Merit type "${target.name}" deleted.`);
                setDeletingItem(null);
                if (editingItem?.id === target.id) {
                    handleCancelEdit();
                }
            },
        });
    };

    return (
        <AppLayout
            navigationSections={adminNavigation}
            profile={adminProfile}
            sessionLabel="Academic Session: Sem 1, 2026/2027"
        >
            <Head title="Merit Management — Master Data" />

            <div className="mx-auto w-full max-w-[1600px] p-6 space-y-6">
                {/* Page Header */}
                <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                        Master Data Management &bull; Kolej Tun Razak
                    </p>
                    <h1 className="text-2xl font-bold text-slate-900 mt-1">Merit Management</h1>
                    <p className="text-sm text-slate-600 mt-0.5">
                        Create, update, and manage student merit types (Red = 2 Points, Blue = 1 Point).
                    </p>
                </div>

                {/* Success Toast */}
                {toast && (
                    <div className="flex items-center justify-between rounded-xl bg-emerald-700 px-4 py-3 text-white shadow-sm">
                        <div className="flex items-center gap-2 text-sm font-medium">
                            <span className="material-symbols-outlined text-lg">check_circle</span>
                            <span>{toast}</span>
                        </div>
                        <button
                            type="button"
                            onClick={() => setToast('')}
                            className="text-white/80 hover:text-white cursor-pointer"
                        >
                            <span className="material-symbols-outlined text-base">close</span>
                        </button>
                    </div>
                )}

                {/* TOP SECTION: Direct Input Form (Atas Form) */}
                <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                    <div className="flex items-center justify-between pb-4 mb-5 border-b border-slate-100">
                        <div>
                            <h2 className="text-base font-bold text-slate-900">
                                {editingItem
                                    ? `Edit Merit Type (${editingItem.code})`
                                    : 'Add New Merit Type'}
                            </h2>
                            <p className="text-xs text-slate-500 mt-0.5">
                                Enter the merit name, merit code, badge color, and merit points awarded.
                            </p>
                        </div>
                        {editingItem && (
                            <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-semibold">
                                Editing Mode
                            </span>
                        )}
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            {/* Merit Name */}
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1">
                                    Merit Name <span className="text-red-600">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                    placeholder="e.g. Red Merit (Merit Merah)"
                                    className="w-full h-10 px-3 rounded-lg bg-slate-50 border border-slate-200 text-sm text-slate-900 focus:outline-none focus:bg-white focus:border-[#8a1538]"
                                    required
                                />
                                {errors.name && (
                                    <p className="text-xs text-red-600 mt-1">{errors.name}</p>
                                )}
                            </div>

                            {/* Merit Code */}
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1">
                                    Merit Code <span className="text-red-600">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={data.code}
                                    onChange={(e) => setData('code', e.target.value.toUpperCase())}
                                    placeholder="e.g. MRT-RED-02"
                                    className="w-full h-10 px-3 rounded-lg bg-slate-50 border border-slate-200 font-mono text-xs text-slate-900 uppercase focus:outline-none focus:bg-white focus:border-[#8a1538]"
                                    required
                                />
                                {errors.code && (
                                    <p className="text-xs text-red-600 mt-1">{errors.code}</p>
                                )}
                            </div>

                            {/* Badge Color */}
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1">
                                    Badge Color <span className="text-red-600">*</span>
                                </label>
                                <select
                                    value={data.badge_color}
                                    onChange={(e) => handleColorChange(e.target.value)}
                                    className="w-full h-10 px-3 rounded-lg bg-slate-50 border border-slate-200 text-sm text-slate-900 focus:outline-none focus:bg-white focus:border-[#8a1538]"
                                >
                                    <option value="red">Red (2 Points)</option>
                                    <option value="blue">Blue (1 Point)</option>
                                </select>
                                {errors.badge_color && (
                                    <p className="text-xs text-red-600 mt-1">{errors.badge_color}</p>
                                )}
                            </div>

                            {/* Points */}
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1">
                                    Merit Points <span className="text-red-600">*</span>
                                </label>
                                <input
                                    type="number"
                                    min="1"
                                    max="50"
                                    value={data.points}
                                    readOnly
                                    className="w-full h-10 px-3 rounded-lg bg-slate-50 border border-slate-200 font-mono text-sm font-semibold text-slate-900 focus:outline-none focus:bg-white focus:border-[#8a1538]"
                                    required
                                />
                            </div>
                        </div>

                        {/* Form Action Buttons */}
                        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                            <button
                                type="button"
                                onClick={handleCancelEdit}
                                className="h-10 px-4 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700 whitespace-nowrap transition-colors cursor-pointer"
                            >
                                {editingItem ? 'Cancel Edit' : 'Clear'}
                            </button>
                            <button
                                type="submit"
                                disabled={processing}
                                className="h-10 px-5 rounded-lg bg-[#8a1538] hover:bg-[#670024] text-white text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap shadow-sm transition-colors cursor-pointer disabled:opacity-50"
                            >
                                <span className="material-symbols-outlined text-base">save</span>
                                <span>{editingItem ? 'Update Merit Type' : 'Save Merit Type'}</span>
                            </button>
                        </div>
                    </form>
                </div>

                {/* BOTTOM SECTION: DataTable (Bawah Table) */}
                <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                    <div className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100">
                        <div>
                            <h2 className="text-base font-bold text-slate-900">Merit Types List</h2>
                            <p className="text-xs text-slate-500">
                                Showing {filteredMeritTypes.length} of {meritTypes.length} recorded merit
                                types
                            </p>
                        </div>

                        <div className="relative w-full sm:w-72">
                            <span className="material-symbols-outlined absolute left-3 top-2.5 text-slate-400 text-base">
                                search
                            </span>
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search merit name, code, or points..."
                                className="w-full h-9 pl-9 pr-3 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:bg-white focus:border-[#8a1538]"
                            />
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200">
                                <tr>
                                    <th className="py-3 px-4">#</th>
                                    <th className="py-3 px-4">Merit Code</th>
                                    <th className="py-3 px-4">Merit Name</th>
                                    <th className="py-3 px-4">Badge Color</th>
                                    <th className="py-3 px-4">Merit Points Awarded</th>
                                    <th className="py-3 px-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredMeritTypes.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan="6"
                                            className="py-10 px-4 text-center text-xs text-slate-500"
                                        >
                                            No merit types found. Use the form above to add Red (2 points)
                                            or Blue (1 point).
                                        </td>
                                    </tr>
                                ) : (
                                    filteredMeritTypes.map((item, idx) => {
                                        const isRed = item.badge_color === 'red';
                                        return (
                                            <tr
                                                key={item.id}
                                                className="hover:bg-slate-50/80 transition-colors"
                                            >
                                                <td className="py-3.5 px-4 text-xs text-slate-500">
                                                    {idx + 1}
                                                </td>
                                                <td className="py-3.5 px-4 font-mono text-xs font-semibold text-slate-800">
                                                    {item.code}
                                                </td>
                                                <td className="py-3.5 px-4 font-semibold text-slate-900">
                                                    {item.name}
                                                </td>
                                                <td className="py-3.5 px-4">
                                                    <span
                                                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                                                            isRed
                                                                ? 'bg-red-50 text-[#8a1538] border border-red-200'
                                                                : 'bg-blue-50 text-blue-700 border border-blue-200'
                                                        }`}
                                                    >
                                                        <span
                                                            className={`w-2 h-2 rounded-full ${
                                                                isRed ? 'bg-[#8a1538]' : 'bg-blue-600'
                                                            }`}
                                                        />
                                                        {isRed ? 'Red' : 'Blue'}
                                                    </span>
                                                </td>
                                                <td className="py-3.5 px-4">
                                                    <span
                                                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold text-white ${
                                                            isRed ? 'bg-[#8a1538]' : 'bg-blue-600'
                                                        }`}
                                                    >
                                                        {item.points}{' '}
                                                        {item.points === 1 ? 'Point' : 'Points'}
                                                    </span>
                                                </td>
                                                <td className="py-3.5 px-4 text-right whitespace-nowrap">
                                                    <div className="inline-flex items-center gap-1.5">
                                                        <button
                                                            type="button"
                                                            onClick={() => setViewingItem(item)}
                                                            className="h-8 px-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold inline-flex items-center gap-1 transition-colors cursor-pointer"
                                                        >
                                                            <span className="material-symbols-outlined text-sm">
                                                                visibility
                                                            </span>
                                                            <span>View</span>
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleEditClick(item)}
                                                            className="h-8 px-2.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-semibold inline-flex items-center gap-1 transition-colors cursor-pointer"
                                                        >
                                                            <span className="material-symbols-outlined text-sm">
                                                                edit
                                                            </span>
                                                            <span>Edit</span>
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => setDeletingItem(item)}
                                                            className="h-8 px-2.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 text-xs font-semibold inline-flex items-center gap-1 transition-colors cursor-pointer"
                                                        >
                                                            <span className="material-symbols-outlined text-sm">
                                                                delete
                                                            </span>
                                                            <span>Delete</span>
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* VIEW MODAL */}
            {viewingItem && (
                <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <h3 className="text-base font-bold text-slate-900">Merit Type Details</h3>
                            <button
                                type="button"
                                onClick={() => setViewingItem(null)}
                                className="text-slate-400 hover:text-slate-700 cursor-pointer"
                            >
                                <span className="material-symbols-outlined text-lg">close</span>
                            </button>
                        </div>

                        <div className="space-y-3 text-xs">
                            <div className="flex justify-between py-1.5 border-b border-slate-100">
                                <span className="text-slate-500 font-semibold">Merit Name</span>
                                <span className="text-slate-900 font-bold">{viewingItem.name}</span>
                            </div>
                            <div className="flex justify-between py-1.5 border-b border-slate-100">
                                <span className="text-slate-500 font-semibold">Merit Code</span>
                                <span className="font-mono text-slate-900 font-semibold">
                                    {viewingItem.code}
                                </span>
                            </div>
                            <div className="flex justify-between py-1.5 border-b border-slate-100">
                                <span className="text-slate-500 font-semibold">Badge Color</span>
                                <span className="text-slate-900 font-semibold capitalize">
                                    {viewingItem.badge_color}
                                </span>
                            </div>
                            <div className="flex justify-between py-1.5 border-b border-slate-100">
                                <span className="text-slate-500 font-semibold">Points Awarded</span>
                                <span className="text-slate-900 font-bold">
                                    {viewingItem.points}{' '}
                                    {viewingItem.points === 1 ? 'Point' : 'Points'}
                                </span>
                            </div>
                        </div>

                        <div className="flex justify-end pt-2">
                            <button
                                type="button"
                                onClick={() => setViewingItem(null)}
                                className="h-9 px-4 rounded-lg bg-slate-900 text-white text-xs font-semibold cursor-pointer"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* DELETE CONFIRMATION MODAL */}
            {deletingItem && (
                <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl">
                        <h3 className="text-base font-bold text-slate-900">Delete Merit Type?</h3>
                        <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                            Are you sure you want to delete <strong>{deletingItem.name}</strong> (
                            <span className="font-mono font-semibold">{deletingItem.code}</span>)?
                            This action cannot be undone.
                        </p>
                        <div className="flex justify-end gap-2 mt-5">
                            <button
                                type="button"
                                onClick={() => setDeletingItem(null)}
                                className="h-9 px-4 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700 cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleConfirmDelete}
                                className="h-9 px-4 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-semibold cursor-pointer"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AppLayout>
    );
}