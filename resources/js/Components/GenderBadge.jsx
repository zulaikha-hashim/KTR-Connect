const genderColors = {
  male: 'bg-blue-100 text-blue-800',
  female: 'bg-pink-100 text-pink-800',
  other: 'bg-violet-100 text-violet-800',
  unknown: 'bg-surface-container text-secondary',
};

export default function GenderBadge({ gender }) {
  const value = String(gender || '').trim();
  const normalized = value.toLowerCase();
  const isMale = ['m', 'male', 'man'].includes(normalized);
  const isFemale = ['f', 'female', 'woman'].includes(normalized);
  const color = isMale
    ? genderColors.male
    : isFemale
      ? genderColors.female
      : value
        ? genderColors.other
        : genderColors.unknown;
  const label = normalized === 'm' || normalized === 'man'
    ? 'Male'
    : normalized === 'f' || normalized === 'woman'
      ? 'Female'
      : value || '—';

  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 font-label-sm text-label-sm font-semibold ${color}`}>
      {label}
    </span>
  );
}
