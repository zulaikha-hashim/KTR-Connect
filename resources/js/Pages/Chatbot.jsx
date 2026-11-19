import { router, useForm } from '@inertiajs/react';
import { useState } from 'react';

const defaultContent = "1. Check Registration Period: Ensure your cohort's window is active in the KTR Portal.\n2. Browse Available Blocks: Review room configurations for Block TR01 - TR06.\n3. Review Eligibility & Merit Cutoff: Verify minimum collegiate merit requirement (≥ 65 merit points).\n4. Select Desired Room & Bed: Choose your vacant bed slot (Bed A or Bed B).\n5. Confirm & Submit Reservation: Finalize acknowledgment of UTM Residential Regulations.\n6. Need Assistance? Contact your assigned Felo Penasihat Blok or visit the KTR Administration Office.";

const defaultKeywords = 'registration, guidelines, room booking, step by step';
const defaultFaqs = [
  { question: 'When can I register for a room?', answer: 'Check the active registration period in the KTR Portal.' },
  { question: 'What is the minimum merit requirement?', answer: 'A minimum of 65 merit points is required.' },
  { question: 'Who can help me with registration?', answer: 'Contact your assigned Felo Penasihat Blok or visit the KTR Administration Office.' },
];

function FieldError({ message }) {
  return message ? <p className="mt-1 font-body-sm text-body-sm text-error" role="alert">{message}</p> : null;
}

function formatLogDate(value) {
  return value ? new Date(value).toLocaleString() : 'Date unavailable';
}

export default function Chatbot({ chatbot, chatbotLogs = [], successMessage = null }) {
  const [isDeploying, setIsDeploying] = useState(false);
  const form = useForm({
    category: chatbot?.category ?? 'Registration Guidelines',
    target_audience: chatbot?.target_audience ?? 'All Undergraduate Residents',
    title: chatbot?.title ?? 'Room Registration Procedures & Guidelines',
    keywords: chatbot?.keywords ?? defaultKeywords,
    content: chatbot?.content ?? defaultContent,
    faqs: chatbot?.faqs?.length ? chatbot.faqs : defaultFaqs,
  });

  const saveChatbot = (event, status) => {
    event?.preventDefault();
    form.transform((data) => ({ ...data, status }));
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

  const fieldClass = 'w-full rounded-lg bg-surface-container-low px-3 py-2 font-body-md text-body-md text-on-surface focus:bg-surface-container focus:outline-none focus:ring-2 focus:ring-primary/20';
  const labelClass = 'mb-1.5 block font-label-sm text-label-sm font-semibold uppercase tracking-wide text-secondary';
  const currentStatus = chatbot?.status ?? 'not deployed';
  const statusLabel = currentStatus === 'draft'
    ? 'Draft'
    : currentStatus === 'pending'
      ? 'Pending review'
      : currentStatus === 'deployed'
        ? 'Deployed'
        : 'Not deployed';
  const statusClass = currentStatus === 'deployed'
    ? 'bg-tertiary-fixed text-tertiary'
    : currentStatus === 'draft'
      ? 'bg-amber-100 text-amber-900'
      : currentStatus === 'pending'
        ? 'bg-primary-fixed text-primary'
        : 'bg-surface-container text-secondary';
  const canDeploy = ['draft', 'pending'].includes(currentStatus);

  return (
    <div className="mx-auto w-full max-w-[1800px] pb-space-xl">
      <header className="mb-space-lg flex flex-col justify-between gap-space-md border-b border-surface-container pb-space-md sm:flex-row sm:items-end">
        <div>
          <div className="mb-1 flex flex-wrap items-center gap-2">
            <span className="font-label-sm text-label-sm font-semibold uppercase tracking-wider text-primary">Collegiate Administration</span>
            <span className="h-1 w-1 rounded-full bg-secondary" />
            <span className="font-code text-code text-secondary">{chatbot?.content_id ?? 'INFO-KTR-001'}</span>
          </div>
          <h1 className="font-headline-lg text-headline-lg font-bold tracking-tight text-on-surface">Update Chatbot Information</h1>
          <p className="mt-1 font-body-md text-body-md text-secondary">Manage responses and FAQs, save a draft, and review chatbot changes.</p>
        </div>
        <span className={`inline-flex w-fit items-center gap-1.5 rounded-full px-3 py-1.5 font-label-md text-label-md font-semibold ${statusClass}`}>
          <span className="h-1.5 w-1.5 rounded-full bg-current" />
          {statusLabel}
        </span>
      </header>

      {successMessage && (
        <div className="mb-space-md rounded-xl bg-tertiary p-space-md font-label-md text-label-md text-on-tertiary shadow-sm" role="status" aria-live="polite">
          {successMessage}
        </div>
      )}

      <div className="grid items-start gap-space-md xl:grid-cols-[minmax(0,1.65fr)_minmax(320px,0.75fr)]">
        <section className="overflow-hidden rounded-xl bg-surface-container-lowest shadow-sm">
        <form onSubmit={(event) => saveChatbot(event, 'pending')} className="space-y-space-lg p-space-lg">
          <section className="space-y-space-md border-b border-surface-container pb-space-lg">
            <h2 className="font-headline-sm text-headline-sm font-bold text-on-surface">Response Details</h2>
          <div className="grid grid-cols-1 gap-space-md md:grid-cols-2">
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
              <div className="flex items-center justify-between gap-2 rounded-lg bg-surface-container-low px-3 py-2 font-body-md text-body-md">
                <span className="font-medium text-on-surface">All Undergraduate Residents</span>
                <span className="rounded-full bg-tertiary-fixed px-2 py-0.5 font-label-sm text-label-sm font-bold text-tertiary">Default</span>
              </div>
              <input type="hidden" value={form.data.target_audience} />
              <FieldError message={form.errors.target_audience} />
            </div>
          </div>

          <div>
            <label htmlFor="title" className={labelClass}>Information Title *</label>
            <input id="title" type="text" value={form.data.title} onChange={(event) => form.setData('title', event.target.value)} className={fieldClass} maxLength={255} />
            <FieldError message={form.errors.title} />
          </div>

          <div>
            <label htmlFor="keywords" className={labelClass}>Quick Trigger Keywords / Match Tags</label>
            <input id="keywords" type="text" value={form.data.keywords} onChange={(event) => form.setData('keywords', event.target.value)} placeholder="registration, guidelines, ..." className={fieldClass} />
            <p className="mt-1 font-body-sm text-body-sm text-secondary">Comma-separated terms that trigger this response in chat.</p>
            <FieldError message={form.errors.keywords} />
          </div>
          </section>

          <section className="space-y-space-md border-b border-surface-container pb-space-lg">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label htmlFor="content" className={labelClass + ' mb-0'}>Information Content (Returned by Chatbot) *</label>
              <span className="font-label-sm text-label-sm font-medium text-tertiary">Supports Markdown formatting</span>
            </div>
            <textarea id="content" rows={8} value={form.data.content} onChange={(event) => form.setData('content', event.target.value)} className={fieldClass + ' min-h-48 resize-y font-mono text-sm'} />
            <FieldError message={form.errors.content} />
          </section>

          <section className="space-y-space-md border-b border-surface-container pb-space-lg">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="font-headline-sm text-headline-sm font-bold text-on-surface">Frequently Asked Questions</h2>
                <p className="mt-1 font-body-sm text-body-sm text-secondary">Add question-and-answer pairs the chatbot can use.</p>
              </div>
              <button
                type="button"
                onClick={() => form.setData('faqs', [...form.data.faqs, { question: '', answer: '' }])}
                disabled={form.data.faqs.length >= 20}
                className="rounded-lg bg-surface-container-high px-3 py-2 font-label-md text-label-md font-semibold text-on-surface transition-colors hover:bg-surface-variant disabled:opacity-50"
              >
                Add FAQ
              </button>
            </div>
            {form.data.faqs.map((faq, index) => (
              <div key={index} className="space-y-space-sm rounded-lg bg-surface-container-low p-space-md">
                <div className="flex items-center justify-between">
                  <p className="font-label-sm text-label-sm font-bold text-secondary">FAQ {index + 1}</p>
                  <button
                    type="button"
                    onClick={() => form.setData('faqs', form.data.faqs.filter((_, faqIndex) => faqIndex !== index))}
                    className="rounded-lg px-2 py-1 font-label-sm text-label-sm font-semibold text-error hover:bg-error-container"
                    aria-label={`Remove FAQ ${index + 1}`}
                  >
                    Remove
                  </button>
                </div>
                <div>
                  <label htmlFor={`faq-question-${index}`} className={labelClass}>Question</label>
                  <input
                    id={`faq-question-${index}`}
                    value={faq.question}
                    onChange={(event) => form.setData('faqs', form.data.faqs.map((item, faqIndex) => faqIndex === index ? { ...item, question: event.target.value } : item))}
                    className={fieldClass}
                    maxLength={255}
                  />
                  <FieldError message={form.errors[`faqs.${index}.question`]} />
                </div>
                <div>
                  <label htmlFor={`faq-answer-${index}`} className={labelClass}>Answer</label>
                  <textarea
                    id={`faq-answer-${index}`}
                    rows={2}
                    value={faq.answer}
                    onChange={(event) => form.setData('faqs', form.data.faqs.map((item, faqIndex) => faqIndex === index ? { ...item, answer: event.target.value } : item))}
                    className={fieldClass + ' resize-y'}
                    maxLength={2000}
                  />
                  <FieldError message={form.errors[`faqs.${index}.answer`]} />
                </div>
              </div>
            ))}
            <FieldError message={form.errors.faqs} />
          </section>

          <div className="flex flex-col items-start justify-between gap-space-md border-t border-surface-container pt-space-md sm:flex-row sm:items-center">
            <p className="font-body-sm text-body-sm text-secondary">
              Last Updated: <strong className="text-on-surface">{chatbot?.updated_at ? new Date(chatbot.updated_at).toLocaleString() : 'Not updated yet'}</strong> by <strong className="text-on-surface">{chatbot?.admin_id ?? 'En. Razak'}</strong>
            </p>
            <div className="flex w-full flex-wrap justify-end gap-2 sm:w-auto">
              <button type="button" onClick={() => form.reset()} className="rounded-lg px-4 py-2 font-label-md text-label-md text-secondary hover:bg-surface-container">Reset</button>
              <button type="button" onClick={() => saveChatbot(null, 'draft')} disabled={form.processing} className="rounded-lg bg-surface-container-high px-4 py-2 font-label-md text-label-md font-semibold text-on-surface transition-colors hover:bg-surface-variant disabled:cursor-not-allowed disabled:opacity-60">
                {form.processing ? 'Saving...' : 'Save as Draft'}
              </button>
              <button type="submit" disabled={form.processing} className="rounded-lg bg-primary px-5 py-2 font-label-md text-label-md font-semibold text-on-primary shadow-sm transition-colors hover:bg-primary-container disabled:cursor-not-allowed disabled:opacity-60">
                {form.processing ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </form>
        </section>

        <aside className="space-y-space-md">
        <section className="rounded-xl bg-surface-container-lowest p-space-lg shadow-sm">
          <div className="mb-space-md flex items-center justify-between gap-2">
            <div>
              <h2 className="font-headline-sm text-headline-sm font-bold text-on-surface">Update Log</h2>
              <p className="mt-1 font-body-sm text-body-sm text-secondary">Recent chatbot changes and deployments.</p>
            </div>
          </div>
          {chatbotLogs.length ? (
            <ol className="space-y-space-md">
              {chatbotLogs.map((entry) => (
                <li key={entry.id} className="flex items-start gap-space-sm border-l-2 border-surface-container pl-space-md">
                  <span className={`mt-1 h-2 w-2 shrink-0 rounded-full ${entry.status === 'deployed' ? 'bg-tertiary' : entry.status === 'draft' ? 'bg-amber-500' : 'bg-primary'}`} />
                  <div className="min-w-0 flex-1">
                    <div>
                      <p className="font-label-md text-label-md font-semibold text-on-surface">{entry.action}</p>
                      <p className="mt-0.5 font-body-sm text-body-sm text-secondary">{entry.admin_id || 'Unknown admin'} · {entry.status === 'draft' ? 'Draft' : entry.status}</p>
                    </div>
                    <time className="mt-1 block font-body-sm text-body-sm text-secondary">{formatLogDate(entry.created_at)}</time>
                  </div>
                </li>
              ))}
            </ol>
          ) : (
            <p className="rounded-lg bg-surface-container-low p-space-md font-body-sm text-body-sm text-secondary">No chatbot changes have been logged yet.</p>
          )}
        </section>

        <section className="rounded-xl bg-surface-container-lowest p-space-lg shadow-sm">
          <div className="mb-space-md">
            <h2 className="font-headline-sm text-headline-sm font-bold text-on-surface">Deployment</h2>
            <p className="mt-1 font-body-sm text-body-sm text-secondary">Drafts can be edited until deployment. Save your changes before deploying.</p>
          </div>
          <div className="flex flex-col gap-space-sm">
            <span className={`w-fit rounded-full px-3 py-1 font-label-sm text-label-sm font-semibold ${statusClass}`}>{statusLabel}</span>
            <button type="button" onClick={deployBot} disabled={isDeploying || !canDeploy} className="flex items-center justify-center gap-2 rounded-lg bg-tertiary-container px-4 py-2 font-label-md text-label-md font-semibold text-on-tertiary shadow-sm transition-colors hover:bg-tertiary disabled:cursor-not-allowed disabled:opacity-60">
              {isDeploying ? 'Deploying...' : canDeploy ? 'Deploy Chatbot' : 'Save as Draft to Deploy'}
            </button>
          </div>
        </section>
        </aside>
      </div>
    </div>
  );
}