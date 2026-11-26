import React from 'react';
import AppLayout from '../Components/AppLayout';
import AdminSupportLinks from '../Components/AdminSupportLinks';

export default function AdminSupport() {
    const adminProfile = {
        name: 'En. Razak',
        role: 'Collegiate Administrator',
    };

    return (
        <AppLayout
            profile={adminProfile}
            sessionLabel="Academic Session: Sem 1, 2026/2027"
        >
            <div className="mx-auto w-full max-w-[1800px] p-6 pb-space-xl">
                <AdminSupportLinks isAdmin={true} />
            </div>
        </AppLayout>
    );
}