import clsx from 'clsx';

interface HealthScoreCardProps {
  score: number;
  url: string;
  timestamp: string;
  affectedNodes: number;
}

function getScoreTone(score: number) {
  if (score >= 90) {
    return {
      label: 'Good',
      text: 'text-green-700 dark:text-green-400',
      bar: 'bg-green-600 dark:bg-green-500',
    };
  }
  if (score >= 70) {
    return {
      label: 'Needs improvement',
      text: 'text-yellow-700 dark:text-yellow-400',
      bar: 'bg-yellow-500',
    };
  }
  if (score >= 50) {
    return {
      label: 'Poor',
      text: 'text-orange-700 dark:text-orange-400',
      bar: 'bg-orange-500',
    };
  }
  return {
    label: 'Critical',
    text: 'text-red-700 dark:text-red-400',
    bar: 'bg-red-600 dark:bg-red-500',
  };
}

export function HealthScoreCard({
  score,
  url,
  timestamp,
  affectedNodes,
}: HealthScoreCardProps) {
  const tone = getScoreTone(score);

  return (
    <section className="card" aria-labelledby="health-score-heading">
      <div className="flex flex-col md:flex-row md:items-center gap-6">
        <div className="md:w-1/3 text-center md:text-left">
          <h2
            id="health-score-heading"
            className="text-sm font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-400"
          >
            Global Health Score
          </h2>
          <p className={clsx('text-6xl font-bold mt-1', tone.text)}>
            {score}
            <span className="text-2xl text-gray-500 dark:text-gray-400">
              /100
            </span>
          </p>
          <p className={clsx('text-sm font-medium', tone.text)}>{tone.label}</p>
        </div>

        <div className="flex-1 space-y-3">
          <div
            role="meter"
            aria-label="Accessibility health score"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={score}
            aria-valuetext={`${score} out of 100, ${tone.label}`}
            className="h-3 w-full rounded-full bg-gray-200 dark:bg-dark-border overflow-hidden"
          >
            <div
              className={clsx('h-full rounded-full transition-all', tone.bar)}
              style={{ width: `${Math.min(Math.max(score, 0), 100)}%` }}
            />
          </div>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-sm">
            <div className="sm:col-span-2 min-w-0">
              <dt className="text-gray-600 dark:text-gray-400">Scanned URL</dt>
              <dd className="font-mono text-gray-900 dark:text-gray-100 break-all">
                {url}
              </dd>
            </div>
            <div>
              <dt className="text-gray-600 dark:text-gray-400">Scanned at</dt>
              <dd className="text-gray-900 dark:text-gray-100">
                <time dateTime={timestamp}>
                  {new Date(timestamp).toLocaleString()}
                </time>
              </dd>
            </div>
            <div>
              <dt className="text-gray-600 dark:text-gray-400">
                Affected elements
              </dt>
              <dd className="text-gray-900 dark:text-gray-100">
                {affectedNodes}
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </section>
  );
}
