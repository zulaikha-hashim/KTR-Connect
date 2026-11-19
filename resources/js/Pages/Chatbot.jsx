import { router, useForm } from '@inertiajs/react';
import { useState } from 'react';

const defaultContent = "1. Check Registration Period: Ensure your cohort's window is active in the KTR Portal.\n2. Browse Available Blocks: Review room configurations for Block TR01 - TR06.\n3. Review Eligibility & Merit Cutoff: Verify minimum collegiate merit requirement (≥ 65 merit points).\n4. Select Desired Room & Bed: Choose your vacant bed slot (Bed A or Bed B).\n5. Confirm & Submit Reservation: Finalize acknowledgment of UTM Residential Regulations.\n6. Need Assistance? Contact your assigned Felo Penasihat Blok or visit the KTR Administration Office.";

const defaultKeywords = 'registration, guidelines, room booking, step by step';

function FieldError({ message }) {
  return message ? <p className="mt-1 text-xs text-red-700" role="alert">{message}</p> : null;
}

export default function Chatbot({ chatbot }) {
  const [isDeploying, setIsDeploying] = useState(false);
  const form = useForm({
    category: chatbot?.category ?? 'Registration Guidelines',
    target_audience: chatbot?.target_audience ?? 'All Undergraduate Residents',
    title: chatbot?.title ?? 'Room Registration Procedures & Guidelines',
    keywords: chatbot?.keywords ?? defaultKeywords,
    content: chatbot?.content ?? defaultContent,
  });

  const updateChatbot = (event) => {
    event.preventDefault();
    form.put(`/chatbot-info/${chatbot?.id ?? 1}`, {
      preserveScroll: true,
    });
  };

  const deployBot = () => {
    setIsDeploying(true);
    router.post(`/chatbot-info/${chatbot?.id ?? 1}/deploy`, {}, {
      preserveScroll: true,
      onFinish: () => setIsDeploying(false),
    });
  };

  const fieldClass = 'w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-[#7b1113] focus:outline-none focus:ring-2 focus:ring-[#7b1113]/20';
  const labelClass = 'mb-1.5 block text-xs font-bold uppercase text-gray-700';

  return (
    <main className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-gray-900/35 p-4 backdrop-blur-md">
      <section aria-modal="true" className="max-h-[calc(100vh-2rem)] w-full max-w-3xl overflow-y-auto overscroll-contain rounded-lg border border-gray-200 bg-white shadow-2xl" role="dialog">
        <header className="flex items-center justify-between gap-4 border-b border-gray-200 px-6 py-4">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-red-100 bg-red-50 text-sm" aria-hidden="true">🤖</div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-base font-bold text-gray-900">Edit Chatbot Information</h1>
                <span className="rounded bg-gray-100 px-2 py-0.5 font-mono text-xs font-semibold text-gray-700">
                  {chatbot?.content_id ?? 'INFO-KTR-001'}
                </span>
              </div>
              <p className="mt-1 text-xs text-gray-500">Modify the automated guidance returned by KTR Student Assistant to student queries.</p>
            </div>
          </div>
          <a href="/admin" aria-label="Close" className="shrink-0 text-2xl font-bold leading-none text-gray-400 hover:text-gray-700">&times;</a>
        </header>

        <form onSubmit={updateChatbot} className="space-y-5 p-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label htmlFor="category" className={labelClass}>Information Category *</label>
              <select id="category" value={form.data.category} onChange={(event) => form.setData('category', event.target.value)} className={fieldClass}>
                <option>Registration Guidelines</option>
                <option>Registration Period</option>
                <option>General Assistance</option>
              </select>
              <FieldError message={form.errors.category} />
            </div>
            <div>
              <label className={labelClass}>Target Audience / Cohort</label>
              <div className="flex items-center justify-between gap-2 rounded-md border border-gray-300 bg-gray-50 px-3 py-2 text-sm">
                <span className="font-medium text-gray-700">👥 All Undergraduate Residents</span>
                <span className="rounded bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">Default</span>
              </div>
              <input type="hidden" value={form.data.target_audience} />
              <FieldError message={form.errors.target_audience} />
            </div>
          </div>

          <div>
            <label htmlFor="title" className={labelClass}>Information Title *</label>
            <input id="title" type="text" value={form.data.title} onChange={(event) => form.setData('title', event.target.value)} className={fieldClass} />
            <FieldError message={form.errors.title} />
          </div>

          <div>
            <label htmlFor="keywords" className={labelClass}>Quick Trigger Keywords / Match Tags</label>
            <input id="keywords" type="text" value={form.data.keywords} onChange={(event) => form.setData('keywords', event.target.value)} placeholder="registration, guidelines, ..." className={fieldClass} />
            <p className="mt-1 text-[10px] text-gray-400">Comma-separated terms that trigger this response in chat.</p>
            <FieldError message={form.errors.keywords} />
          </div>

          <div>
            <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2">
              <label htmlFor="content" className={labelClass + ' mb-0'}>Information Content (Returned by Chatbot) *</label>
              <span className="text-[10px] font-medium text-emerald-700">✓ Supports Markdown formatting</span>
            </div>
            <div className="overflow-hidden rounded-md border border-gray-300">
              <div className="border-b border-gray-200 bg-gray-50 px-3 py-1.5 text-xs font-semibold text-gray-600">Markdown content</div>
              <textarea id="content" rows={8} value={form.data.content} onChange={(event) => form.setData('content', event.target.value)} className="w-full resize-y p-3 font-mono text-xs text-gray-900 focus:outline-none" />
            </div>
            <FieldError message={form.errors.content} />
          </div>

          <div className="flex flex-col items-start justify-between gap-4 border-t border-gray-200 pt-4 sm:flex-row sm:items-center">
            <p className="text-[11px] text-gray-500">
              Last Updated: <strong className="text-gray-700">{chatbot?.updated_at ? new Date(chatbot.updated_at).toLocaleString() : '18 Nov 2026, 02:20 PM'}</strong> by <strong className="text-gray-700">{chatbot?.admin_id ?? 'En. Razak'}</strong>
            </p>
            <div className="flex w-full justify-end gap-2 sm:w-auto">
              <button type="button" onClick={() => form.reset()} className="rounded-md px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100">Reset</button>
              <button type="submit" disabled={form.processing} className="rounded-md bg-[#7b1113] px-5 py-2 text-xs font-semibold text-white hover:bg-[#630e10] disabled:cursor-not-allowed disabled:opacity-60">
                {form.processing ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </form>

        <footer className="flex items-center justify-between gap-3 border-t border-gray-200 bg-gray-50 px-6 py-3">
          <p className="text-xs font-medium text-gray-600">
            Deployment Status: <span className={`ml-1 rounded px-2 py-0.5 text-[10px] font-bold uppercase ${chatbot?.status === 'deployed' ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-200 text-gray-700'}`}>{chatbot?.status ?? 'not deployed'}</span>
          </p>
          <button type="button" onClick={deployBot} disabled={isDeploying} className="shrink-0 rounded-md bg-emerald-700 px-4 py-1.5 text-xs font-semibold text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60">
            {isDeploying ? 'Deploying...' : 'Deploy Bot'}
          </button>
        </footer>
      </section>
    </main>
  );
}