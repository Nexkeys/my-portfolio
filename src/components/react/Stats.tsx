import CountUp from './bits/CountUp';

interface Stat {
  value: number;
  suffix: string;
  label: string;
}

export default function Stats({ stats }: { stats: Stat[] }) {
  return (
    <dl className="stats">
      {stats.map((s) => (
        <div className="stat" key={s.label}>
          <dt className="mono">{s.label}</dt>
          <dd>
            <CountUp to={s.value} duration={1.6} mode="roll" easing="spring" suffix={s.suffix} />
          </dd>
        </div>
      ))}
    </dl>
  );
}
