export function maskEmail(email: string) {
  const [local, domain] = email.split('@');
  if (!local || !domain) return email;
  return `${local[0]}****@${domain}`;
}

export function maskPhone(phone?: string | null) {
  if (!phone) return '**********';
  const visible = phone.slice(-3);
  const prefix = phone.startsWith('+212') ? '+212 ' : phone.startsWith('0') ? '0' : '';
  return `${prefix}******${visible}`;
}
