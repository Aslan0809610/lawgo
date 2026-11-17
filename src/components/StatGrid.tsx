interface Stat {
  label: string;
  value: string | number;
}

export function StatGrid({
  stats,
  className = 'result-stats',
}: {
  stats: Stat[];
  className?: string;
}) {
  return (
    <div className={className}>
      {stats.map((stat) => (
        <div key={stat.label}>
          <b>{stat.value}</b>
          <span>{stat.label}</span>
        </div>
      ))}
    </div>
  );
}
