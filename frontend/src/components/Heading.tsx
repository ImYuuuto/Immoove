import type { ReactNode } from 'react';

export default function Heading({
  eyebrow,
  title,
  light = false,
}: {
  eyebrow: string;
  title: ReactNode;
  light?: boolean;
}) {
  return (
    <div className={`section-heading ${light ? 'light' : ''}`}>
      <div>
        <small className="eyebrow">{eyebrow}</small>

        <h2>{title}</h2>
      </div>
    </div>
  );
}
