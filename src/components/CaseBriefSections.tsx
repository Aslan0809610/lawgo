import type { CaseBrief } from '../types';

const sections = [
  ['facts', '事實'],
  ['issue', '爭點'],
  ['holding', '判決'],
  ['significance', '意義'],
] as const;

export function CaseBriefSections({ brief }: { brief: CaseBrief }) {
  return (
    <div className="case-brief">
      {sections.map(([field, label]) => (
        <section key={field}>
          <h2>{label}</h2>
          <p>{brief[field]}</p>
        </section>
      ))}
      {brief.keyRule && (
        <p className="key-rule">
          <strong>判決規則</strong> · {brief.keyRule}
        </p>
      )}
    </div>
  );
}
