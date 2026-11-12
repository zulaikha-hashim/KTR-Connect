export default function BedStatusBadge({
  status,
  restrictions = [],
}) {
  let label = 'Not assessed';
  let colours = 'bg-slate-100 text-slate-600 border-slate-200';

  if (status === 'available') {
    label = 'Available';
    colours = 'bg-emerald-50 text-emerald-800 border-emerald-200';
  } else if (status === 'occupied') {
    label = 'Occupied';
    colours = 'bg-rose-50 text-rose-800 border-rose-200';
  } else if (status === 'held') {
    label = 'Held';
    colours = 'bg-amber-50 text-amber-800 border-amber-200';
  } else if (status === 'unavailable') {
    const types = [
      ...new Set(restrictions.map((restriction) => restriction.type)),
    ];

    if (types.length > 1) {
      label = 'Unavailable · Multiple restrictions';
    } else if (types[0] === 'maintenance') {
      label = 'Unavailable · Maintenance';
    } else if (types[0] === 'administrative_block') {
      label = 'Unavailable · Admin block';
    } else {
      label = 'Unavailable';
    }

    colours = 'bg-slate-200 text-slate-800 border-slate-300';
  }

  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${colours}`}
    >
      {label}
    </span>
  );
}