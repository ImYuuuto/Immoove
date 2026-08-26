import { useLanguage } from '../i18n/language';

const fr = { publicationReview: 'Demande de publication', publicationHelp: 'Transmettez à l’administrateur si la demande est prête, ou refusez-la avec une raison interne.', escalateReady: 'Prêt pour l’administrateur', rejectInvalid: 'Refuser la demande', optionalNote: 'Note facultative', rejectionReason: 'Motif du refus', rejectionRequired: 'Saisissez un motif avant de refuser.', bookingReview: 'Traitement de la réservation', bookingHelp: 'Mettez la réservation en traitement, confirmez-la ou refusez-la avec une raison.', processing: 'En traitement', confirm: 'Confirmer', rejectBooking: 'Refuser la réservation' };
type Copy = { [K in keyof typeof fr]: string };
const en: Copy = { publicationReview: 'Publication request', publicationHelp: 'Escalate requests that are ready for admin review, or reject them with an internal reason.', escalateReady: 'Ready for admin', rejectInvalid: 'Reject request', optionalNote: 'Optional note', rejectionReason: 'Rejection reason', rejectionRequired: 'Enter a reason before rejecting.', bookingReview: 'Booking action', bookingHelp: 'Mark the booking as processing, confirm it, or reject it with a reason.', processing: 'Processing', confirm: 'Confirm', rejectBooking: 'Reject booking' };
const ar: Copy = { publicationReview: 'طلب نشر', publicationHelp: 'صعّدوا الطلب الجاهز لمراجعة المدير، أو ارفضوه مع سبب داخلي.', escalateReady: 'جاهز للمدير', rejectInvalid: 'رفض الطلب', optionalNote: 'ملاحظة اختيارية', rejectionReason: 'سبب الرفض', rejectionRequired: 'أدخلوا سبباً قبل الرفض.', bookingReview: 'إجراء الحجز', bookingHelp: 'ضعوا الحجز قيد المعالجة أو أكدوه أو ارفضوه مع ذكر السبب.', processing: 'قيد المعالجة', confirm: 'تأكيد', rejectBooking: 'رفض الحجز' };

export function useModerationWorkflowCopy() {
  const { language } = useLanguage();
  return language === 'ar' ? ar : language === 'en' ? en : fr;
}
