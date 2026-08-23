export function Spinner() {
  return <div className="spinner" role="status" aria-label="Chargement" />;
}

export function EmptyState({ title, text }: { title: string; text?: string }) {
  return (
    <div className="empty">
      <h3>{title}</h3>
      {text ? <p>{text}</p> : null}
    </div>
  );
}
