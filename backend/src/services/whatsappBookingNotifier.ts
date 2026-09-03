export type WhatsAppBookingNotice = {
  bookingId: number;
  recipientPhone: string;
  customerName: string;
  listingTitle: string;
  startDate: string;
  endDate: string;
  total: number;
  currency: string;
  mediaUrl?: string;
};

/**
 * Provider-neutral boundary for the future WhatsApp Business integration.
 * It deliberately performs no network request until a verified provider and
 * approved template have been configured.
 */
export async function sendWhatsAppBookingNotice(_notice: WhatsAppBookingNotice) {
  if (process.env.WHATSAPP_NOTIFICATIONS_ENABLED !== 'true') return { status: 'disabled' as const };
  throw new Error('WhatsApp provider adapter is not configured');
}
