import { useEffect, useState } from 'react';
import AppLayout from '../Components/AppLayout';

const staffNavigation = [
  {
    title: 'Student Resident',
    items: [
      {
        label: 'Merit & Room Eligibility',
        icon: 'verified',
        path: 'student-merit-and-room-eligibility',
        href: '#',
      },
      {
        label: 'Activity Directory & Details',
        icon: 'event_available',
        path: 'student-activity-directory',
        href: '#',
      },
    ],
  },
  {
    title: 'Felo & Staff Operations',
    items: [
      {
        label: 'Manage Activities',
        icon: 'post_add',
        path: 'manage-activities-and-proposals',
        href: '#',
        active: true,
      },
      {
        label: 'Record Participation (CSV/Excel)',
        icon: 'upload_file',
        path: 'record-participation-upload',
        href: '#',
      },
      {
        label: 'Merit Status Reports',
        icon: 'summarize',
        path: 'staff-merit-analytics-reports',
        href: '#',
      },
    ],
  },
  {
    title: 'Collegiate Administration',
    items: [
      {
        label: 'Activity Review & Approvals',
        icon: 'fact_check',
        path: 'activity-reviews-and-approvals',
        href: '/admin',
      },
    ],
  },
];

const staffRoles = [
  { label: 'Student: M. Afiq', active: true },
  { label: 'Felo: Dr. Kamil' },
  { label: 'Admin: En. Razak' },
];

const staffProfile = {
  name: 'Muhammad Afiq',
  description: 'A23CS0120 • Block TR-B04',
};

export default function Dashboard() {
  const [activeFilter, setActiveFilter] = useState('all');
  const [isProposalModalOpen, setIsProposalModalOpen] = useState(false);
  const [isPdfViewerOpen, setIsPdfViewerOpen] = useState(false);
  const [isToastVisible, setIsToastVisible] = useState(true);
  const [pdfTitle, setPdfTitle] = useState('Document Preview');

  useEffect(() => {
    document.body.style.overflow = isProposalModalOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [isProposalModalOpen]);

  const getFilterTabClass = (status) =>
    `filter-tab px-3.5 py-1.5 rounded-lg font-label-md text-label-md transition-colors ${
      activeFilter === status
        ? 'bg-primary text-on-primary shadow-sm'
        : 'text-secondary hover:bg-surface-container-high'
    }`;

  const openPdfViewer = (fileName) => {
    setPdfTitle(fileName);
    setIsPdfViewerOpen(true);
  };

  const handleFormSubmit = (event) => {
    event.preventDefault();
    setIsProposalModalOpen(false);
    setIsToastVisible(true);
  };

  const saveAsDraft = () => {
    window.alert('Progress saved to Collegiate Drafts pool (DFT-2026-013).');
    setIsProposalModalOpen(false);
  };

  return (
    <AppLayout navigationSections={staffNavigation} roles={staffRoles} profile={staffProfile} sessionLabel="Academic Session: Sem 1, 2026/2027">
      <div className="flex flex-col w-full">
{/*Toast Confirmation Banner (Auto-dismissable & interactive)*/}
<div id="toast-banner" className={`mb-space-lg flex items-center justify-between p-space-md bg-tertiary text-on-tertiary rounded-xl shadow-md transition-all duration-300 transform translate-y-0 ${isToastVisible ? '' : 'hidden'}`}>
<div className="flex items-center gap-space-md">
<div className="w-8 h-8 rounded-full bg-tertiary-fixed-dim/20 flex items-center justify-center text-tertiary-fixed">
<span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
</div>
<div>
<p className="font-label-lg text-label-lg leading-snug">Activity proposal submitted successfully!</p>
<p className="font-body-sm text-body-sm text-tertiary-fixed/90">Status updated to <span className="font-semibold text-tertiary-fixed underline">Pending Approval</span>. System notification and memo dispatched to Collegiate Admin En. Razak.</p>
</div>
</div>
<div className="flex items-center gap-space-sm">
<button className="p-1 rounded-lg hover:bg-tertiary-container text-tertiary-fixed transition-colors" onClick={() => setIsToastVisible(false)}>
<span className="material-symbols-outlined text-[18px]">close</span>
</button>
</div>
</div>
{/*Operational Header & Stat Ribbon*/}
<section className="mb-space-xl flex flex-col lg:flex-row lg:items-end justify-between gap-space-lg">
<div>
<div className="flex items-center gap-2 mb-1">
<span className="font-label-sm text-label-sm uppercase tracking-wider text-secondary">Felo Operations • Kolej Tun Razak</span>
<span className="w-1 h-1 rounded-full bg-secondary"></span>
<span className="font-code text-code text-primary font-semibold">UC-M003 / UC-M004 Compliant</span>
</div>
<h1 className="font-display-lg text-display-lg text-on-surface tracking-tight">Manage Student Activities</h1>
<p className="font-body-md text-body-md text-secondary mt-1">Review active submissions, formulate collegiate event agendas, and submit formal merit endorsement dossiers.</p>
</div>
{/*Header Actions*/}
<div className="flex flex-wrap items-center gap-space-sm">
<button className="h-10 px-4 rounded-lg bg-surface-container-high hover:bg-surface-variant text-on-surface font-label-lg text-label-lg flex items-center gap-2 shadow-sm transition-all">
<span className="material-symbols-outlined text-[18px]">download_for_offline</span>
<span className="">Export Log (.xlsx)</span>
</button>
<button className="h-10 px-5 rounded-lg bg-primary hover:bg-primary-container text-on-primary font-label-lg text-label-lg flex items-center gap-2 shadow-md hover:shadow-lg transition-all active:scale-[0.98]" onClick={() => setIsProposalModalOpen(true)}>
<span className="material-symbols-outlined text-[20px]">add_box</span>
<span className="">+ Create New Activity Application</span>
</button>
</div>
</section>
{/*Metric Badges Bento Row*/}
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-space-md mb-space-xl w-full">
{/*Stat 1*/}
<div className="p-space-lg rounded-xl bg-surface-container-lowest shadow-sm flex items-center justify-between">
<div>
<p className="font-label-sm text-label-sm text-secondary uppercase tracking-wider">Total Proposals</p>
<div className="flex items-baseline gap-2 mt-1">
<span className="font-headline-lg text-headline-lg text-on-surface font-bold">24</span>
<span className="font-label-sm text-label-sm text-tertiary-container font-semibold">+6 this month</span>
</div>
</div>
<div className="w-12 h-12 rounded-xl bg-surface-container flex items-center justify-center text-primary">
<span className="material-symbols-outlined text-[26px]">folder_special</span>
</div>
</div>
{/*Stat 2*/}
<div className="p-space-lg rounded-xl bg-surface-container-lowest shadow-sm flex items-center justify-between">
<div>
<p className="font-label-sm text-label-sm text-secondary uppercase tracking-wider">Awaiting Felo Endorsement</p>
<div className="flex items-baseline gap-2 mt-1">
<span className="font-headline-lg text-headline-lg text-primary font-bold">3</span>
<span className="font-label-sm text-label-sm text-secondary">Action required</span>
</div>
</div>
<div className="w-12 h-12 rounded-xl bg-primary-fixed flex items-center justify-center text-primary">
<span className="material-symbols-outlined text-[26px]">pending_actions</span>
</div>
</div>
{/*Stat 3*/}
<div className="p-space-lg rounded-xl bg-surface-container-lowest shadow-sm flex items-center justify-between">
<div>
<p className="font-label-sm text-label-sm text-secondary uppercase tracking-wider">Approved &amp; Scheduled</p>
<div className="flex items-baseline gap-2 mt-1">
<span className="font-headline-lg text-headline-lg text-tertiary font-bold">18</span>
<span className="font-label-sm text-label-sm text-tertiary-container">Session 26/27</span>
</div>
</div>
<div className="w-12 h-12 rounded-xl bg-tertiary-fixed flex items-center justify-center text-tertiary">
<span className="material-symbols-outlined text-[26px]">verified</span>
</div>
</div>
{/*Stat 4*/}
<div className="p-space-lg rounded-xl bg-surface-container-lowest shadow-sm flex items-center justify-between">
<div>
<p className="font-label-sm text-label-sm text-secondary uppercase tracking-wider">Allocated Merits</p>
<div className="flex items-baseline gap-2 mt-1">
<span className="font-headline-lg text-headline-lg text-on-surface font-bold">420</span>
<span className="font-label-sm text-label-sm text-secondary">Points pool</span>
</div>
</div>
<div className="w-12 h-12 rounded-xl bg-secondary-fixed flex items-center justify-center text-secondary">
<span className="material-symbols-outlined text-[26px]">military_tech</span>
</div>
</div>
</div>
{/*Primary Workspace Canvas: Filter Bar + Table + Activity Visual Cards*/}
<div className="grid gap-space-lg w-full">
{/*Main Inventory Section (8-columns or full width responsive)*/}
<div className="col-span-12 flex flex-col gap-space-md w-full">
{/*Filter Segmented Tabs & Search Container*/}
<div className="p-space-md rounded-xl bg-surface-container-lowest shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-space-md">
{/*Tabs*/}
<div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0" id="filter-tabs">
<button className={getFilterTabClass('all')} onClick={() => setActiveFilter('all')}>
            All <span className="ml-1 opacity-80">(24)</span>
</button>
<button className={getFilterTabClass('draft')} onClick={() => setActiveFilter('draft')}>
            Draft <span className="ml-1 text-secondary opacity-70">(2)</span>
</button>
<button className={getFilterTabClass('pending')} onClick={() => setActiveFilter('pending')}>
            Pending Approval <span className="ml-1 text-secondary opacity-70">(3)</span>
</button>
<button className={getFilterTabClass('approved')} onClick={() => setActiveFilter('approved')}>
            Approved <span className="ml-1 text-secondary opacity-70">(18)</span>
</button>
<button className={getFilterTabClass('rejected')} onClick={() => setActiveFilter('rejected')}>
            Rejected <span className="ml-1 text-secondary opacity-70">(1)</span>
</button>
</div>
{/*Search & Auxiliary Filter*/}
<div className="flex items-center gap-2">
<div className="relative w-full md:w-56">
<span className="material-symbols-outlined absolute left-2.5 top-2.5 text-secondary text-[18px]">search</span>
<input className="w-full h-9 pl-9 pr-3 rounded-lg bg-surface-container-low font-body-sm text-body-sm text-on-surface placeholder:text-secondary focus:outline-none focus:bg-surface-container transition-all" placeholder="Search proposal..." type="text" />
</div>
<button className="h-9 w-9 rounded-lg bg-surface-container-low flex items-center justify-center text-secondary hover:text-on-surface hover:bg-surface-container transition-colors">
<span className="material-symbols-outlined text-[18px]">filter_list</span>
</button>
</div>
</div>
{/*Application Inventory Table Container*/}
<div className="rounded-xl bg-surface-container-lowest shadow-sm overflow-hidden flex flex-col">
<div className="p-space-lg flex items-center justify-between">
<div>
<h2 className="font-headline-sm text-headline-sm text-on-surface">Registered Activity Applications</h2>
<p className="font-body-sm text-body-sm text-secondary">Official student association submissions with collegiate credential verification.</p>
</div>
<span className="font-code text-code text-secondary">Showing 4 of 24 records</span>
</div>
<div className="overflow-x-auto">
<table className="w-full text-left" id="proposals-table">
<thead className="bg-surface-container-low text-secondary font-label-sm text-label-sm uppercase tracking-wider">
<tr>
<th className="py-3 px-space-lg">Activity &amp; Proposer</th>
<th className="py-3 px-space-md">Target Schedule &amp; Venue</th>
<th className="py-3 px-space-md">Merit Scale</th>
<th className="py-3 px-space-md">Status</th>
<th className="py-3 px-space-lg text-right">Quick Actions</th>
</tr>
</thead>
<tbody className="divide-y divide-surface-container text-body-md">
{/*Item 1: Approved*/}
<tr className="hover:bg-surface-container-low/50 transition-colors group" data-status="approved" hidden={activeFilter !== 'all' && activeFilter !== 'approved'}>
<td className="py-4 px-space-lg">
<div className="flex items-center gap-3">
<div className="w-10 h-10 rounded-lg bg-tertiary-fixed flex items-center justify-center text-tertiary flex-shrink-0">
<span className="material-symbols-outlined text-[20px]">theater_comedy</span>
</div>
<div>
<div className="font-label-lg text-label-lg text-on-surface group-hover:text-primary transition-colors">KTR Cultural Festival &amp; Malam Warisan</div>
<div className="font-body-sm text-body-sm text-secondary flex items-center gap-2 mt-0.5">
<span className="">Submitted by: JKM KTR (Aiman Zikri)</span>
<span className="">•</span>
<span className="font-code text-code text-secondary">ACT-2026-081</span>
</div>
</div>
</div>
</td>
<td className="py-4 px-space-md">
<div className="font-body-sm text-body-sm text-on-surface font-medium">18 Nov 2026, 8:00 PM</div>
<div className="font-body-sm text-body-sm text-secondary flex items-center gap-1 mt-0.5">
<span className="material-symbols-outlined text-[14px]">location_on</span> Dewan Sri Meranti (350 pax)
                  </div>
</td>
<td className="py-4 px-space-md">
<div className="flex flex-col gap-1">
<span className="inline-flex items-center gap-1 font-label-sm text-label-sm text-primary font-semibold">
<span className="w-2 h-2 rounded-full bg-primary"></span> 2 Red (Exco)
                    </span>
<span className="inline-flex items-center gap-1 font-label-sm text-label-sm text-secondary font-medium">
<span className="w-2 h-2 rounded-full bg-secondary"></span> 1 Blue (Audience)
                    </span>
</div>
</td>
<td className="py-4 px-space-md">
<span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-label-sm text-label-sm bg-tertiary-fixed text-tertiary font-semibold">
<span className="w-1.5 h-1.5 rounded-full bg-tertiary"></span>
                    Approved
                  </span>
</td>
<td className="py-4 px-space-lg text-right">
<div className="flex items-center justify-end gap-1">
<button className="p-1.5 rounded-lg hover:bg-surface-container text-secondary hover:text-on-surface transition-colors" onClick={() => openPdfViewer('KTR_Cultural_Fest_Proposal_Final.pdf')} title="View Submitted PDF">
<span className="material-symbols-outlined text-[18px]">picture_as_pdf</span>
</button>
<button className="p-1.5 rounded-lg hover:bg-surface-container text-secondary hover:text-on-surface transition-colors" title="Edit Record">
<span className="material-symbols-outlined text-[18px]">edit</span>
</button>
<button className="p-1.5 rounded-lg hover:bg-surface-container text-secondary hover:text-on-surface transition-colors" title="Action Menu">
<span className="material-symbols-outlined text-[18px]">more_vert</span>
</button>
</div>
</td>
</tr>
{/*Item 2: Pending Approval*/}
<tr className="hover:bg-surface-container-low/50 transition-colors group" data-status="pending" hidden={activeFilter !== 'all' && activeFilter !== 'pending'}>
<td className="py-4 px-space-lg">
<div className="flex items-center gap-3">
<div className="w-10 h-10 rounded-lg bg-surface-container-high flex items-center justify-center text-primary flex-shrink-0">
<span className="material-symbols-outlined text-[20px]">sports_soccer</span>
</div>
<div>
<div className="font-label-lg text-label-lg text-on-surface group-hover:text-primary transition-colors">Inter-Block Futsal Championship</div>
<div className="font-body-sm text-body-sm text-secondary flex items-center gap-2 mt-0.5">
<span className="">Submitted 2 days ago</span>
<span className="">•</span>
<span className="font-code text-code text-secondary">ACT-2026-094</span>
</div>
</div>
</div>
</td>
<td className="py-4 px-space-md">
<div className="font-body-sm text-body-sm text-on-surface font-medium">25-27 Nov 2026</div>
<div className="font-body-sm text-body-sm text-secondary flex items-center gap-1 mt-0.5">
<span className="material-symbols-outlined text-[14px]">stadium</span> Gelanggang KTR (120 pax)
                  </div>
</td>
<td className="py-4 px-space-md">
<div className="flex flex-col gap-1">
<span className="inline-flex items-center gap-1 font-label-sm text-label-sm text-primary font-semibold">
<span className="w-2 h-2 rounded-full bg-primary"></span> 2 Red (Comm)
                    </span>
<span className="inline-flex items-center gap-1 font-label-sm text-label-sm text-secondary font-medium">
<span className="w-2 h-2 rounded-full bg-secondary"></span> 1 Blue (Player)
                    </span>
</div>
</td>
<td className="py-4 px-space-md">
<span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-label-sm text-label-sm bg-surface-container text-on-surface-variant font-semibold">
<span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
                    Pending Approval
                  </span>
</td>
<td className="py-4 px-space-lg text-right">
<div className="flex items-center justify-end gap-1">
<button className="p-1.5 rounded-lg hover:bg-surface-container text-secondary hover:text-on-surface transition-colors" onClick={() => openPdfViewer('KTR_InterBlock_Futsal_Proposal.pdf')} title="View Submitted PDF">
<span className="material-symbols-outlined text-[18px]">picture_as_pdf</span>
</button>
<button className="p-1.5 rounded-lg hover:bg-surface-container text-secondary hover:text-primary transition-colors" title="Review / Resubmit">
<span className="material-symbols-outlined text-[18px]">rule</span>
</button>
<button className="p-1.5 rounded-lg hover:bg-error-container text-secondary hover:text-error transition-colors" title="Delete Draft/Item">
<span className="material-symbols-outlined text-[18px]">delete</span>
</button>
</div>
</td>
</tr>
{/*Item 3: Approved*/}
<tr className="hover:bg-surface-container-low/50 transition-colors group" data-status="approved" hidden={activeFilter !== 'all' && activeFilter !== 'approved'}>
<td className="py-4 px-space-lg">
<div className="flex items-center gap-3">
<div className="w-10 h-10 rounded-lg bg-tertiary-fixed flex items-center justify-center text-tertiary flex-shrink-0">
<span className="material-symbols-outlined text-[20px]">groups</span>
</div>
<div>
<div className="font-label-lg text-label-lg text-on-surface group-hover:text-primary transition-colors">Residential Leadership Camp 2026</div>
<div className="font-body-sm text-body-sm text-secondary flex items-center gap-2 mt-0.5">
<span className="">Submitted by: Felo Bureau (Dr. Kamil)</span>
<span className="">•</span>
<span className="font-code text-code text-secondary">ACT-2026-077</span>
</div>
</div>
</div>
</td>
<td className="py-4 px-space-md">
<div className="font-body-sm text-body-sm text-on-surface font-medium">04-06 Dec 2026</div>
<div className="font-body-sm text-body-sm text-secondary flex items-center gap-1 mt-0.5">
<span className="material-symbols-outlined text-[14px]">nature_people</span> Kem Kaizen Pulai (80 pax)
                  </div>
</td>
<td className="py-4 px-space-md">
<div className="flex flex-col gap-1">
<span className="inline-flex items-center gap-1 font-label-sm text-label-sm text-primary font-semibold">
<span className="w-2 h-2 rounded-full bg-primary"></span> 3 Red (Facilitator)
                    </span>
<span className="inline-flex items-center gap-1 font-label-sm text-label-sm text-secondary font-medium">
<span className="w-2 h-2 rounded-full bg-secondary"></span> 2 Red (Delegate)
                    </span>
</div>
</td>
<td className="py-4 px-space-md">
<span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-label-sm text-label-sm bg-tertiary-fixed text-tertiary font-semibold">
<span className="w-1.5 h-1.5 rounded-full bg-tertiary"></span>
                    Approved
                  </span>
</td>
<td className="py-4 px-space-lg text-right">
<div className="flex items-center justify-end gap-1">
<button className="p-1.5 rounded-lg hover:bg-surface-container text-secondary hover:text-on-surface transition-colors" onClick={() => openPdfViewer('Leadership_Camp_Dossier_2026.pdf')} title="View Submitted PDF">
<span className="material-symbols-outlined text-[18px]">picture_as_pdf</span>
</button>
<button className="p-1.5 rounded-lg hover:bg-surface-container text-secondary hover:text-on-surface transition-colors" title="Edit Activity">
<span className="material-symbols-outlined text-[18px]">edit</span>
</button>
<button className="p-1.5 rounded-lg hover:bg-surface-container text-secondary hover:text-on-surface transition-colors" title="Action Menu">
<span className="material-symbols-outlined text-[18px]">more_vert</span>
</button>
</div>
</td>
</tr>
{/*Item 4: Draft*/}
<tr className="hover:bg-surface-container-low/50 transition-colors group" data-status="draft" hidden={activeFilter !== 'all' && activeFilter !== 'draft'}>
<td className="py-4 px-space-lg">
<div className="flex items-center gap-3">
<div className="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center text-secondary flex-shrink-0">
<span className="material-symbols-outlined text-[20px]">terminal</span>
</div>
<div>
<div className="font-label-lg text-label-lg text-on-surface group-hover:text-primary transition-colors">AI &amp; Smart Campus Workshop TR24</div>
<div className="font-body-sm text-body-sm text-secondary flex items-center gap-2 mt-0.5">
<span className="">Last saved 4 hours ago</span>
<span className="">•</span>
<span className="font-code text-code text-secondary">DFT-2026-012</span>
</div>
</div>
</div>
</td>
<td className="py-4 px-space-md">
<div className="font-body-sm text-body-sm text-on-surface font-medium">12 Dec 2026, 2:30 PM</div>
<div className="font-body-sm text-body-sm text-secondary flex items-center gap-1 mt-0.5">
<span className="material-symbols-outlined text-[14px]">meeting_room</span> TR Seminar Hall (60 pax)
                  </div>
</td>
<td className="py-4 px-space-md">
<div className="flex flex-col gap-1">
<span className="inline-flex items-center gap-1 font-label-sm text-label-sm text-primary font-semibold">
<span className="w-2 h-2 rounded-full bg-primary"></span> 2 Red (Instructor)
                    </span>
<span className="inline-flex items-center gap-1 font-label-sm text-label-sm text-secondary font-medium">
<span className="w-2 h-2 rounded-full bg-secondary"></span> 1 Blue (Attendee)
                    </span>
</div>
</td>
<td className="py-4 px-space-md">
<span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-label-sm text-label-sm bg-surface-container text-secondary font-semibold">
<span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>
                    Draft
                  </span>
</td>
<td className="py-4 px-space-lg text-right">
<div className="flex items-center justify-end gap-1">
<button className="p-1.5 rounded-lg hover:bg-surface-container text-primary font-label-sm text-label-sm flex items-center gap-1 transition-colors" onClick={() => setIsProposalModalOpen(true)} title="Continue Drafting">
<span className="material-symbols-outlined text-[18px]">edit_note</span> Resume
                    </button>
<button className="p-1.5 rounded-lg hover:bg-error-container text-secondary hover:text-error transition-colors" title="Delete Draft">
<span className="material-symbols-outlined text-[18px]">delete</span>
</button>
</div>
</td>
</tr>
</tbody>
</table>
</div>
{/*Table Footer / Pagination*/}
<div className="p-space-md bg-surface-container-low flex flex-col sm:flex-row items-center justify-between gap-space-sm">
<span className="font-body-sm text-body-sm text-secondary">Showing 1 to 4 of 24 activity applications</span>
<div className="flex items-center gap-1">
<button className="h-8 px-2.5 rounded-md bg-surface-container-lowest text-secondary hover:text-on-surface font-label-sm text-label-sm disabled:opacity-50" disabled="">Previous</button>
<button className="h-8 w-8 rounded-md bg-primary text-on-primary font-label-sm text-label-sm">1</button>
<button className="h-8 w-8 rounded-md bg-surface-container-lowest text-secondary hover:text-on-surface font-label-sm text-label-sm">2</button>
<button className="h-8 w-8 rounded-md bg-surface-container-lowest text-secondary hover:text-on-surface font-label-sm text-label-sm">3</button>
<button className="h-8 px-2.5 rounded-md bg-surface-container-lowest text-secondary hover:text-on-surface font-label-sm text-label-sm">Next</button>
</div>
</div>
</div>
</div>
{/*Inspector Panel & Editorial Activity Showcase (4-columns)*/}

</div>
{/*SLIDE-OVER MODAL / DRAWER: 'Create / Submit Activity Application' (UC-M003 / US 4.5 & US 4.6)*/}
<div aria-labelledby="modal-title" aria-modal="true" className={`fixed inset-0 z-50 overflow-hidden ${isProposalModalOpen ? '' : 'hidden'}`} id="proposal-modal" role="dialog">{/*Backdrop scrim with blur*/}
<div className="fixed inset-0 bg-on-surface/60 backdrop-blur-sm transition-opacity duration-300" onClick={() => setIsProposalModalOpen(false)}></div>
<div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
<div className="w-screen max-w-2xl bg-surface-container-lowest shadow-2xl flex flex-col relative z-10">
{/*Drawer Header*/}
<div className="px-space-xl py-space-lg bg-surface-container-low border-b border-surface-container flex items-center justify-between shadow-sm flex-shrink-0">
<div className="flex items-center gap-3">
<div className="w-11 h-11 rounded-xl bg-primary-container text-on-primary flex items-center justify-center shadow-sm flex-shrink-0">
<span className="material-symbols-outlined text-[24px]">post_add</span>
</div>
<div>
<div className="flex items-center gap-2 mb-0.5">
<span className="inline-flex items-center px-2 py-0.5 rounded font-label-sm text-label-sm bg-primary-fixed text-primary font-bold">UC-M003 / US 4.5</span>
<span className="inline-flex items-center px-2 py-0.5 rounded font-label-sm text-label-sm bg-tertiary-fixed text-tertiary font-bold">UC-M004 / US 4.6</span>
</div>
<h2 className="font-headline-md text-headline-md text-on-surface font-bold leading-tight" id="modal-title">New Activity Proposal Application</h2>
<p className="font-body-sm text-body-sm text-secondary">Submit collegiate event dossier and request administrative merit point endorsement</p>
</div>
</div>
<button className="w-9 h-9 rounded-lg flex items-center justify-center text-secondary hover:text-on-surface hover:bg-surface-container transition-colors" onClick={() => setIsProposalModalOpen(false)} aria-label="Close modal">
<span className="material-symbols-outlined text-[22px]">close</span>
</button>
</div>

{/*Scrollable Form Body*/}
<form className="flex-1 overflow-y-auto p-space-xl space-y-space-lg" id="activity-form" onSubmit={handleFormSubmit}>

{/*Section 1: Basic Activity Information*/}
<div className="space-y-space-md border-b border-surface-container pb-space-lg">
<div className="flex items-center gap-2">
<span className="w-6 h-6 rounded-full bg-primary text-on-primary text-label-sm flex items-center justify-center font-bold">1</span>
<h3 className="font-headline-sm text-headline-sm text-on-surface font-bold">Basic Activity Information</h3>
</div>

{/*Activity Name*/}
<div className="space-y-space-xs">
<label className="block font-label-md text-label-md text-on-surface font-semibold">
Activity Name / Program Title <span className="text-error">*</span>
</label>
<input className="w-full h-11 px-3.5 rounded-lg bg-surface-container-low font-body-md text-body-md text-on-surface placeholder:text-secondary focus:outline-none focus:bg-surface-container focus:ring-2 focus:ring-primary/20 transition-all" name="activity_name" placeholder="e.g. KTR Annual Cyber Gaming &amp; STEM Fest 2026" required="" type="text" defaultValue="KTR Annual Cyber Gaming &amp; STEM Fest 2026" />
<p className="font-body-sm text-body-sm text-secondary">Official title registered in collegiate activity calendar minutes.</p>
</div>

{/*Proposing Bureau*/}
<div className="space-y-space-xs">
<label className="block font-label-md text-label-md text-on-surface font-semibold">
Proposing Organization / Bureau <span className="text-error">*</span>
</label>
<select className="w-full h-11 px-3.5 rounded-lg bg-surface-container-low font-body-md text-body-md text-on-surface focus:outline-none focus:bg-surface-container transition-all" defaultValue="jkm_sports">
<option value="jkm_sports">JKM Biro Sukan &amp; Rekreasi</option>
<option value="jkm_academic">JKM Biro Akademik &amp; Kerjaya</option>
<option value="jkm_cultural">JKM Biro Kebudayaan &amp; Kesenian</option>
<option value="jkm_welfare">JKM Biro Kebajikan &amp; Kerohanian</option>
<option value="felo_office">Pejabat Felo Kolej Tun Razak</option>
</select>
</div>

{/*Target Schedule Grid*/}
<div className="grid grid-cols-1 sm:grid-cols-2 gap-space-md">
<div className="space-y-space-xs">
<label className="block font-label-md text-label-md text-on-surface font-semibold">
Target Start Date &amp; Time <span className="text-error">*</span>
</label>
<div className="relative">
<input className="w-full h-11 pl-10 pr-3 rounded-lg bg-surface-container-low font-body-md text-body-md text-on-surface focus:outline-none focus:bg-surface-container transition-all" required="" type="text" defaultValue="20 Dec 2026, 08:30 AM" />
<span className="material-symbols-outlined absolute left-3 top-3 text-secondary text-[20px]">calendar_today</span>
</div>
</div>
<div className="space-y-space-xs">
<label className="block font-label-md text-label-md text-on-surface font-semibold">
Target End Date &amp; Time <span className="text-error">*</span>
</label>
<div className="relative">
<input className="w-full h-11 pl-10 pr-3 rounded-lg bg-surface-container-low font-body-md text-body-md text-on-surface focus:outline-none focus:bg-surface-container transition-all" required="" type="text" defaultValue="22 Dec 2026, 06:00 PM" />
<span className="material-symbols-outlined absolute left-3 top-3 text-secondary text-[20px]">event_upcoming</span>
</div>
</div>
</div>

{/*Venue & Turnout Grid*/}
<div className="grid grid-cols-1 sm:grid-cols-2 gap-space-md">
<div className="space-y-space-xs">
<label className="block font-label-md text-label-md text-on-surface font-semibold">
Venue / Location <span className="text-error">*</span>
</label>
<div className="relative">
<input className="w-full h-11 pl-10 pr-3 rounded-lg bg-surface-container-low font-body-md text-body-md text-on-surface focus:outline-none focus:bg-surface-container transition-all" required="" type="text" defaultValue="Dewan Sri Meranti &amp; Foyer Blok TR-A" />
<span className="material-symbols-outlined absolute left-3 top-3 text-secondary text-[20px]">pin_drop</span>
</div>
</div>
<div className="space-y-space-xs">
<label className="block font-label-md text-label-md text-on-surface font-semibold">
Expected Turnout / Participants <span className="text-error">*</span>
</label>
<div className="relative">
<input className="w-full h-11 pl-10 pr-3 rounded-lg bg-surface-container-low font-body-md text-body-md text-on-surface focus:outline-none focus:bg-surface-container transition-all" required="" type="text" defaultValue="250 students" />
<span className="material-symbols-outlined absolute left-3 top-3 text-secondary text-[20px]">groups</span>
</div>
</div>
</div>
</div>

{/*Section 2: Merit Allocation & Quota Schema*/}
<div className="space-y-space-md border-b border-surface-container pb-space-lg">
<div className="flex items-center justify-between">
<div className="flex items-center gap-2">
<span className="w-6 h-6 rounded-full bg-primary text-on-primary text-label-sm flex items-center justify-center font-bold">2</span>
<h3 className="font-headline-sm text-headline-sm text-on-surface font-bold">Merit Allocation &amp; Quota Schema</h3>
</div>
<span className="font-label-sm text-label-sm text-tertiary-container font-semibold">US 4.5 Standard</span>
</div>

<div className="grid grid-cols-1 sm:grid-cols-2 gap-space-md">
{/*Committee Role*/}
<div className="p-space-md rounded-xl bg-surface-container-low space-y-space-xs border border-surface-container">
<div className="flex items-center justify-between">
<span className="font-label-md text-label-md text-on-surface font-bold flex items-center gap-1.5">
<span className="w-2.5 h-2.5 rounded-full bg-primary"></span> Committee Members
</span>
<span className="px-2 py-0.5 rounded font-label-sm text-label-sm bg-primary-fixed text-primary font-bold">2 Red Merits</span>
</div>
<label className="block font-label-sm text-label-sm text-secondary pt-1">Max Quota Limit</label>
<div className="relative">
<input className="w-full h-10 px-3 rounded-lg bg-surface-container-lowest font-body-sm text-body-sm text-on-surface font-semibold focus:outline-none focus:ring-1 focus:ring-primary" type="text" defaultValue="25 pax" />
</div>
<p className="font-body-sm text-body-sm text-secondary">Assigned to executive committee &amp; crew.</p>
</div>

{/*Participant Role*/}
<div className="p-space-md rounded-xl bg-surface-container-low space-y-space-xs border border-surface-container">
<div className="flex items-center justify-between">
<span className="font-label-md text-label-md text-on-surface font-bold flex items-center gap-1.5">
<span className="w-2.5 h-2.5 rounded-full bg-secondary"></span> General Participants
</span>
<span className="px-2 py-0.5 rounded font-label-sm text-label-sm bg-secondary-fixed text-secondary font-bold">1 Blue Merit</span>
</div>
<label className="block font-label-sm text-label-sm text-secondary pt-1">Max Quota Limit</label>
<div className="relative">
<input className="w-full h-10 px-3 rounded-lg bg-surface-container-lowest font-body-sm text-body-sm text-on-surface font-semibold focus:outline-none focus:ring-1 focus:ring-primary" type="text" defaultValue="225 pax" />
</div>
<p className="font-body-sm text-body-sm text-secondary">Audience &amp; tournament competitors.</p>
</div>
</div>

{/*Special roles dropdown & notes*/}
<div className="space-y-space-xs">
<label className="block font-label-md text-label-md text-on-surface font-semibold">
Special Roles &amp; Additional Merit Notes
</label>
<select className="w-full h-11 px-3.5 rounded-lg bg-surface-container-low font-body-md text-body-md text-on-surface focus:outline-none focus:bg-surface-container transition-all mb-2" defaultValue="standard">
<option value="standard">Standard Tier (Exco 2 Red / Participant 1 Blue)</option>
<option value="high_impact">High Impact Collegiate (Exco 3 Red / Sub-comm 2 Red / Participant 1 Blue)</option>
<option value="trainer_special">Technical Facilitator Role (Lead Trainer 3 Red)</option>
</select>
<input className="w-full h-10 px-3.5 rounded-lg bg-surface-container-low font-body-sm text-body-sm text-on-surface placeholder:text-secondary focus:outline-none focus:bg-surface-container" placeholder="Extra remarks e.g. Special referee honorarium merits or inter-varsity accreditation" type="text" defaultValue="Includes referee support merits authorized under KTR sports charter." />
</div>
</div>

{/*Section 3: Proposal Document Upload*/}
<div className="space-y-space-md">
<div className="flex items-center justify-between">
<div className="flex items-center gap-2">
<span className="w-6 h-6 rounded-full bg-primary text-on-primary text-label-sm flex items-center justify-center font-bold">3</span>
<h3 className="font-headline-sm text-headline-sm text-on-surface font-bold">Proposal Document Upload</h3>
</div>
<span className="font-label-sm text-label-sm text-primary font-semibold">UC-M004 / US 4.6</span>
</div>

{/*PDF Drag & Drop Zone*/}
<div className="p-space-lg rounded-xl border-2 border-dashed border-outline-variant bg-surface-container-low hover:bg-surface-container flex flex-col items-center justify-center text-center cursor-pointer transition-all">
<div className="w-12 h-12 rounded-full bg-surface-container-lowest flex items-center justify-center text-primary shadow-sm mb-2">
<span className="material-symbols-outlined text-[26px]">cloud_upload</span>
</div>
<p className="font-label-lg text-label-lg text-on-surface font-semibold">Upload Formal Proposal (Kertas Kerja Cadangan - PDF only)</p>
<p className="font-body-sm text-body-sm text-secondary mt-0.5">Drag and drop proposal file here, or click to browse (Max 10MB)</p>
</div>

{/*Uploaded Mock File Pill*/}
<div className="p-space-sm rounded-xl bg-surface-container-lowest border border-surface-container shadow-sm flex items-center justify-between">
<div className="flex items-center gap-3">
<div className="w-10 h-10 rounded-lg bg-primary-fixed flex items-center justify-center text-primary flex-shrink-0">
<span className="material-symbols-outlined text-[22px]">picture_as_pdf</span>
</div>
<div>
<p className="font-label-md text-label-md text-on-surface font-bold">Kertas_Kerja_STEM_Fest_2026.pdf</p>
<p className="font-body-sm text-body-sm text-secondary flex items-center gap-2">
<span className="font-code text-code">2.4 MB</span>
<span className="">•</span>
<span className="text-tertiary font-semibold flex items-center gap-0.5 text-body-sm">
<span className="material-symbols-outlined text-[16px] text-tertiary" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span> PDF Validated
</span>
</p>
</div>
</div>
<div className="flex items-center gap-1">
<button className="p-1.5 rounded-lg hover:bg-surface-container text-secondary hover:text-on-surface transition-colors" onClick={() => openPdfViewer('Kertas_Kerja_STEM_Fest_2026.pdf')} title="Preview PDF" type="button">
<span className="material-symbols-outlined text-[18px]">visibility</span>
</button>
<button className="p-1.5 rounded-lg hover:bg-error-container text-secondary hover:text-error transition-colors" title="Remove File" type="button">
<span className="material-symbols-outlined text-[18px]">delete</span>
</button>
</div>
</div>

{/*Brief Notification Note*/}
<div className="p-space-sm rounded-lg bg-surface-container flex items-start gap-2.5">
<span className="material-symbols-outlined text-primary text-[20px] mt-0.5 flex-shrink-0">mark_email_read</span>
<p className="font-body-sm text-body-sm text-on-surface-variant leading-snug">
<strong>Automated Dispatch:</strong> System will notify Collegiate Admin <strong>En. Razak</strong> via automated email dispatch upon submission for endorsement and venue scheduling.
</p>
</div>
</div>
</form>

{/*Footer Actions*/}
<div className="px-space-xl py-space-md bg-surface-container-low border-t border-surface-container flex flex-col sm:flex-row items-center justify-between gap-space-sm flex-shrink-0">
<div className="flex items-center gap-2 w-full sm:w-auto">
<button className="h-10 px-4 rounded-lg bg-surface-container-high hover:bg-surface-variant text-on-surface font-label-md text-label-md flex items-center justify-center gap-1.5 transition-colors" onClick={saveAsDraft} type="button">
<span className="material-symbols-outlined text-[18px]">save</span>
<span className="">Save as Draft</span>
</button>
<button className="h-10 px-4 rounded-lg bg-surface-container text-secondary hover:text-on-surface hover:bg-surface-variant font-label-md text-label-md flex items-center justify-center transition-colors" onClick={() => setIsProposalModalOpen(false)} type="button">
Cancel
</button>
</div>
<button className="w-full sm:w-auto h-10 px-5 rounded-lg bg-primary-container hover:bg-primary text-on-primary font-label-md text-label-md flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all active:scale-[0.98]" form="activity-form" type="submit">
<span className="material-symbols-outlined text-[18px]">send</span>
<span className="">Submit for Admin Approval</span>
</button>
</div>
</div>
</div></div>
{/*PDF Preview Modal Lightbox*/}
<div aria-modal="true" className={`fixed inset-0 z-50 overflow-hidden ${isPdfViewerOpen ? '' : 'hidden'}`} id="pdf-lightbox" role="dialog">
<div className="fixed inset-0 bg-on-surface/60 backdrop-blur-sm" onClick={() => setIsPdfViewerOpen(false)}></div>
<div className="relative w-full max-w-4xl mx-auto my-8 h-[870px] bg-surface-container-lowest rounded-xl shadow-2xl flex flex-col overflow-hidden z-10">
<div className="h-14 px-space-lg bg-surface-container-low flex items-center justify-between">
<div className="flex items-center gap-2">
<span className="material-symbols-outlined text-primary text-[22px]">picture_as_pdf</span>
<span className="font-label-lg text-label-lg text-on-surface font-semibold" id="pdf-title-display">{pdfTitle}</span>
</div>
<div className="flex items-center gap-2">
<button className="h-8 px-3 rounded-md bg-surface-container text-secondary hover:text-on-surface font-label-sm text-label-sm flex items-center gap-1">
<span className="material-symbols-outlined text-[16px]">download</span> Download
          </button>
<button className="w-8 h-8 rounded-lg flex items-center justify-center text-secondary hover:text-on-surface hover:bg-surface-container" onClick={() => setIsPdfViewerOpen(false)}>
<span className="material-symbols-outlined text-[20px]">close</span>
</button>
</div>
</div>
<div className="flex-1 bg-surface-container p-space-lg flex items-center justify-center">
{/*PDF Simulation View*/}
<div className="w-full max-w-2xl h-full bg-surface-container-lowest rounded shadow-lg p-space-xl overflow-y-auto flex flex-col gap-space-md">
<div className="flex items-center justify-between border-b pb-4">
<div>
<h2 className="font-headline-sm text-headline-sm font-bold text-primary">KOLEJ TUN RAZAK • UTM</h2>
<p className="font-label-sm text-label-sm text-secondary">KERTAS KERJA CADANGAN AKTIVITI SISWA 2026/2027</p>
</div>
<span className="font-code text-code text-secondary">REF: KTR/AKT/26/094</span>
</div>
<div className="space-y-2 text-body-sm">
<p className="font-semibold text-on-surface">1.0 TUJUAN / OBJECTIVE</p>
<p className="text-secondary">Kertas kerja ini dikemukakan untuk memohon kelulusan felo dan pihak pentadbiran kolej kediaman Kolej Tun Razak bagi menganjurkan program berimpak tinggi dalam pembangunan kemahiran kepimpinan dan sukan mahasiswa.</p>
<p className="font-semibold text-on-surface pt-2">2.0 CADANGAN PERUNTUKAN MERIT RESIDENSI</p>
<p className="text-secondary">Selaras dengan skim merit sistem kolej residensi UTM Skudai, permohonan mata merit dicadangkan pada kategori 2 Merit Merah untuk AJK Pelaksana dan 1 Merit Biru untuk Peserta Mahasiswa.</p>
</div>
<div className="mt-auto pt-6 border-t flex justify-between text-body-sm text-secondary">
<span className="">Disediakan oleh Majlis Felo KTR</span>
<span className="">Disahkan: UTM Skudai</span>
</div>
</div>
</div>
</div>
</div>
</div>
{/*Vanilla Interactive Micro-Interactions*/}







    </AppLayout>
  );
}
