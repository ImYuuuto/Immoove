export function formatDate(date?: string) {
  return date
    ? new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium' }).format(new Date(date))
    : 'Non renseignée';
}
