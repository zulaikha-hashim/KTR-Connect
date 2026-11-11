import React, { useState, useEffect } from 'react';

const STORAGE_KEY = 'ktr_support_portal_links';

const DEFAULT_LINKS = {
    whatsappUrl: 'https://chat.whatsapp.com/sampleKTRGroupLink',
    akakUrl: 'https://sites.google.com/utm.my/akak/',
    qrCodeImage: '/images/ktr-whatsapp-qr.png',
    whatsappDescription: 'Official Kolej Tun Razak resident notices, emergency alerts, and community announcements.',
    akakDescription: 'UTM central damage and defect reporting portal for room fixtures, electrical repairs, and Wi-Fi outages.'
};

export default function AdminSupportLinks({ isAdmin = true }) {
    const fallbackQr = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(DEFAULT_LINKS.whatsappUrl)}`;

    const [links, setLinks] = useState(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) {
                try {
                    return JSON.parse(saved);
                } catch (e) {
                    // fallback to default
                }
            }
        }
        return DEFAULT_LINKS;
    });

    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({ ...links });

    useEffect(() => {
        setFormData({ ...links });
    }, [links]);

    const handleSave = (e) => {
        e.preventDefault();
        setLinks(formData);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(formData));
        setIsEditing(false);
    };

    const handleQrUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData(prev => ({ ...prev, qrCodeImage: reader.result }));
            };
            reader.readAsDataURL(file);
        }
    };

    const handleReset = () => {
        setLinks(DEFAULT_LINKS);
        localStorage.removeItem(STORAGE_KEY);
        setIsEditing(false);
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">External Portals & Support Links</h2>
                    <p className="text-sm text-gray-500 mt-1">Manage official communication channels and central maintenance redirection.</p>
                </div>
                {isAdmin && (
                    <button
                        type="button"
                        onClick={() => setIsEditing(true)}
                        className="bg-[#781226] hover:bg-[#600e1e] text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition shadow-sm self-start sm:self-auto cursor-pointer"
                    >
                        Edit Support Links
                    </button>
                )}
            </div>

            {/* Cards Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* 1. Sistem AKAK Card */}
                <div className="bg-[#5c0f1c] text-white rounded-2xl p-6 shadow-sm flex flex-col justify-between min-h-[260px]">
                    <div>
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] font-extrabold uppercase tracking-widest bg-white/10 text-white/90 px-3 py-1 rounded-full border border-white/20">
                                UTM Central Facility
                            </span>
                            <span className="text-xs text-rose-200 font-medium">24-48h Resolution</span>
                        </div>
                        <h3 className="text-xl font-bold mt-4 leading-snug">
                            Bilik Rosak? Laporkan Terus Melalui Sistem AKAK
                        </h3>
                        <p className="text-xs text-rose-100/80 mt-2 leading-relaxed">
                            {links.akakDescription}
                        </p>
                    </div>
                    <div className="mt-8 pt-4 border-t border-white/10 flex items-center justify-between">
                        <span className="text-xs text-rose-200">Official Portal</span>
                        <a
                            href={links.akakUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-white text-[#5c0f1c] font-bold text-xs px-4 py-2 rounded-xl hover:bg-rose-50 transition shadow-sm inline-flex items-center gap-1.5"
                        >
                            Open Sistem AKAK
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                        </a>
                    </div>
                </div>

                {/* 2. WhatsApp Group Card + QR Code */}
                <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between min-h-[260px]">
                    <div>
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] font-extrabold uppercase tracking-widest bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full border border-emerald-200">
                                Student Community
                            </span>
                            <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                                Active Group
                            </span>
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 mt-4 leading-snug">
                            KTR Residential WhatsApp Group
                        </h3>
                        <p className="text-xs text-gray-500 mt-2 leading-relaxed">
                            {links.whatsappDescription}
                        </p>
                    </div>

                    <div className="mt-6 pt-5 border-t border-gray-100 flex flex-col sm:flex-row items-center gap-5">
                        <div className="p-2.5 bg-white border border-gray-200 rounded-2xl shadow-sm flex-shrink-0 flex items-center justify-center">
                            <img
                                src={links.qrCodeImage}
                                alt="KTR WhatsApp QR"
                                className="w-32 h-32 object-contain rounded-lg"
                                onError={(e) => {
                                    e.target.onerror = null;
                                    e.target.src = fallbackQr;
                                }}
                            />
                        </div>
                        <div className="flex flex-col justify-center space-y-3 text-center sm:text-left">
                            <p className="text-xs text-gray-500 leading-relaxed">
                                Scan the official group QR code with your camera or tap below to join.
                            </p>
                            <div>
                                <a
                                    href={links.whatsappUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#20ba5a] text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow-sm transition"
                                >
                                    Join via WhatsApp
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                    </svg>
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal */}
            {isEditing && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl space-y-4">
                        <div className="flex items-center justify-between border-b pb-3">
                            <h3 className="text-lg font-bold text-gray-900">Edit Support & External Links</h3>
                            <button
                                type="button"
                                onClick={() => setIsEditing(false)}
                                className="text-gray-400 hover:text-gray-600 text-sm font-bold cursor-pointer"
                            >
                                ✕
                            </button>
                        </div>
                        <form onSubmit={handleSave} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Sistem AKAK URL</label>
                                <input
                                    type="url"
                                    value={formData.akakUrl}
                                    onChange={(e) => setFormData({ ...formData, akakUrl: e.target.value })}
                                    className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#781226]"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">WhatsApp Group URL</label>
                                <input
                                    type="url"
                                    value={formData.whatsappUrl}
                                    onChange={(e) => setFormData({ ...formData, whatsappUrl: e.target.value })}
                                    className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#781226]"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Upload New QR Code Image</label>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleQrUpload}
                                    className="w-full text-xs text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-rose-50 file:text-[#781226] hover:file:bg-rose-100"
                                />
                            </div>
                            <div className="flex items-center justify-between pt-3 border-t">
                                <button
                                    type="button"
                                    onClick={handleReset}
                                    className="text-xs font-semibold text-rose-600 hover:underline cursor-pointer"
                                >
                                    Reset to Default
                                </button>
                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setIsEditing(false)}
                                        className="px-4 py-2 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-100 cursor-pointer"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-5 py-2 rounded-xl text-sm font-semibold bg-[#781226] hover:bg-[#600e1e] text-white cursor-pointer"
                                    >
                                        Save Changes
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}