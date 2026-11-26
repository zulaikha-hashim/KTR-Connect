import React from 'react';
import { Head } from '@inertiajs/react';
import AppLayout from '../../Components/AppLayout';

const studentNavigation = [
    {
        title: 'STUDENT RESIDENT',
        items: [
            {
                label: 'View Merit',
                icon: 'verified',
                href: '/student/merit',
                active: true,
            },
            {
                label: 'Activity Directory & Details',
                icon: 'event',
                href: '#',
            },
        ],
    },
];

const studentProfile = {
    name: 'Muhammad Afiq',
    description: 'A22EC0148 • Block TR28',
};

const activities = [
    {
        id: 1,
        name: 'Malam Apresiasi Kolej (MAK KTR 2026)',
        role: 'Program Director',
        type: 'red',
        typeLabel: 'Merit Merah',
        points: 2,
    },
    {
        id: 2,
        name: 'Sukan Antara Blok (SUKAB 2026)',
        role: 'Team Captain',
        type: 'red',
        typeLabel: 'Merit Merah',
        points: 2,
    },
    {
        id: 3,
        name: 'KTR Gotong-Royong Perdana',
        role: 'Participant',
        type: 'blue',
        typeLabel: 'Merit Biru',
        points: 1,
    },
    {
        id: 4,
        name: 'Townhall Bersama Pengetua & Felo',
        role: 'Attendee',
        type: 'blue',
        typeLabel: 'Merit Biru',
        points: 1,
    },
    {
        id: 5,
        name: 'KTR Coding Hackathon 2026',
        role: 'Head of Logistics',
        type: 'red',
        typeLabel: 'Merit Merah',
        points: 2,
    },
];

export default function ViewMerit() {
    return (
        <AppLayout
            navigationSections={studentNavigation}
            profile={studentProfile}
            sessionLabel="Academic Session: Sem 1, 2026/2027"
        >
            <Head title="View Merit" />

            <div className="max-w-5xl mx-auto px-6 py-8 space-y-6">
                {/* Student Info Card */}
                <div className="bg-white rounded-xl p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-slate-200">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-[#ffd9dd] flex items-center justify-center text-[#8a1538] text-lg font-bold">
                            MA
                        </div>
                        <div>
                            <div className="flex items-center gap-2 flex-wrap">
                                <h1 className="text-lg text-slate-900 font-bold">Muhammad Afiq</h1>
                                <span className="text-xs font-mono text-slate-500">
                                    (A22EC0148 &bull; 3 SECP)
                                </span>
                            </div>
                            <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                                <span className="material-symbols-outlined text-sm text-[#8a1538]">
                                    apartment
                                </span>
                                Block TR28 &bull; Room 304
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600">
                            Sem 1, 2026/2027
                        </span>
                        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-900 flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                            Active Resident
                        </span>
                    </div>
                </div>

                {/* Total Merit Summary */}
                <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                                Merit Status
                            </span>
                            <div className="flex items-baseline gap-3 mt-1">
                                <span className="text-4xl text-[#8a1538] font-extrabold tracking-tight">
                                    28
                                </span>
                                <span className="text-lg text-slate-900 font-semibold">
                                    Total Points
                                </span>
                            </div>
                        </div>

                        <div>
                            <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-100 text-emerald-900 text-xs font-semibold">
                                <span className="material-symbols-outlined text-base text-emerald-700">
                                    check_circle
                                </span>
                                Eligible for Single Room w/ Ensuite (&ge; 25 pts)
                            </span>
                        </div>
                    </div>
                </div>

                {/* Participation History */}
                <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 space-y-4">
                    <div>
                        <h2 className="text-base text-slate-900 font-bold">
                            Participation History
                        </h2>
                        <p className="text-xs text-slate-500">
                            Audited records endorsed for residential allocation.
                        </p>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-slate-200 text-slate-500 text-[11px] font-bold uppercase tracking-wider">
                                    <th className="py-3 px-3">Activity Name</th>
                                    <th className="py-3 px-3">Role</th>
                                    <th className="py-3 px-3">Merit Type</th>
                                    <th className="py-3 px-3 text-right">Points Earned</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-xs">
                                {activities.map((item) => {
                                    const isRed = item.type === 'red';
                                    return (
                                        <tr
                                            key={item.id}
                                            className="hover:bg-slate-50/80 transition-colors"
                                        >
                                            <td className="py-3.5 px-3 font-semibold text-slate-900">
                                                {item.name}
                                            </td>
                                            <td className="py-3.5 px-3 text-slate-600">{item.role}</td>
                                            <td className="py-3.5 px-3">
                                                <span
                                                    className={`px-2 py-0.5 rounded text-xs font-medium ${
                                                        isRed
                                                            ? 'bg-[#ffd9dd] text-[#8a1538]'
                                                            : 'bg-blue-100 text-blue-800'
                                                    }`}
                                                >
                                                    {item.typeLabel}
                                                </span>
                                            </td>
                                            <td
                                                className={`py-3.5 px-3 text-right font-bold ${
                                                    isRed ? 'text-[#8a1538]' : 'text-slate-600'
                                                }`}
                                            >
                                                +{item.points} {item.points === 1 ? 'pt' : 'pts'}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}