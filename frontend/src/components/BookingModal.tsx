import { type FormEvent, useState } from 'react';
import { ArrowUpRight, X } from 'lucide-react';
import type { BookingDraft, BookingRecord, Listing } from '../types';
import { request } from '../utils/request';
import { decodeText } from '../utils/decodeText';
import { formatTranslation, useLanguage } from '../i18n/language';

export default function BookingModal({
  listing,
  onClose,
  onMessage,
}: {
  listing: Listing;
  onClose: () => void;
  onMessage: (message: string) => void;
}) {
  const { language, text } = useLanguage();
  const [data, setData] = useState<BookingDraft>({
    listingId: listing.listingId!,
    startDate: '',
    endDate: '',
  });
  const locale = language === 'ar' ? 'ar-MA' : language === 'en' ? 'en-GB' : 'fr-FR';
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    try {
      const result = await request<{ item: BookingRecord }>('/bookings', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      onMessage(
        formatTranslation(text.bookingSaved, {
          total: Number(result.item.total).toLocaleString(locale),
        }),
      );
      onClose();
    } catch (error) {
      onMessage(error instanceof Error ? error.message : text.bookingFailed);
    }
  };
  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <form className="modal" onSubmit={submit} onMouseDown={(event) => event.stopPropagation()}>
        <button type="button" className="modal-close" onClick={onClose} aria-label={text.close}>
          <X />
        </button>
        <small className="eyebrow">{text.booking}</small>
        <h2>{decodeText(listing.title)}</h2>
        <p>{text.bookingText}</p>
        <div className="auth-names">
          <input
            required
            type="date"
            aria-label={text.startDate}
            value={data.startDate}
            onChange={(event) => setData({ ...data, startDate: event.target.value })}
          />
          <input
            required
            type="date"
            aria-label={text.endDate}
            value={data.endDate}
            onChange={(event) => setData({ ...data, endDate: event.target.value })}
          />
        </div>
        {listing.basePrice != null && (
          <p>
            {formatTranslation(text.estimate, {
              price: Number(listing.basePrice).toLocaleString(locale),
            })}
          </p>
        )}
        <button className="light-button" type="submit">
          {text.book} <ArrowUpRight size={17} />
        </button>
      </form>
    </div>
  );
}
