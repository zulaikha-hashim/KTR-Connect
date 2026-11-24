import React from 'react';
import AppLayout from '../Components/AppLayout';
import AdminSupportLinks from '../Components/AdminSupportLinks';

export default function AdminSupport() {
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
                    active: true,
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
            },
        ],
    },
    ];

    const adminProfile = {
        name: 'En. Razak',
        role: 'Collegiate Administrator',
    };

    return (
        <AppLayout
            navigationSections={adminNavigation}
            profile={adminProfile}
            sessionLabel="Academic Session: Sem 1, 2026/2027"
        >
            <div className="mx-auto w-full max-w-[1800px] p-6 pb-space-xl">
                <AdminSupportLinks isAdmin={true} />
            </div>
        </AppLayout>
    );
}