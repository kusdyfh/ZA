export const WHATSAPP_PROVIDER = Symbol('WHATSAPP_PROVIDER');

/**
 * Swappable WhatsApp delivery — `MockWhatsAppProvider` (logs only) today;
 * a real account (Meta Cloud API / Twilio / other) implements this same
 * port later without touching the use-cases that call it.
 */
export interface WhatsAppProvider {
  sendVerificationCode(phone: string, code: string): Promise<void>;
}
