export function formatDuration(totalSeconds: number): string {
  if (totalSeconds < 60) return `${totalSeconds}s`;

  const totalMinutes = Math.round(totalSeconds / 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  return hours > 0 ? `${hours}h ${minutes}m` : `${minutes} min`;
}

export function formatDateTime(isoString: string): string {
  const date = new Date(isoString);
  const dateLabel = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const timeLabel = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  return `${dateLabel} · ${timeLabel}`;
}
