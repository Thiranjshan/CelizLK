import { prisma } from '@/lib/prisma';
import { defaultStoreSettings, type StoreSettings } from '@/lib/store-settings-data';
export type { StoreSettings } from '@/lib/store-settings-data';
export { defaultStoreSettings } from '@/lib/store-settings-data';

const normalizeText = (value: unknown, fallback = '') => typeof value === 'string' ? value.trim() : fallback;

export function normalizeStoreSettings(value: unknown): StoreSettings {
  const source = value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
  const business = (source.business ?? {}) as Record<string, unknown>;
  const contact = (source.contact ?? {}) as Record<string, unknown>;
  const payments = (source.payments ?? {}) as Record<string, unknown>;
  const delivery = (source.delivery ?? {}) as Record<string, unknown>;
  const social = (source.social ?? {}) as Record<string, unknown>;
  const website = (source.website ?? {}) as Record<string, unknown>;
  const headerFooter = (source.headerFooter ?? {}) as Record<string, unknown>;

  return {
    business: {
      storeName: normalizeText(business.storeName, defaultStoreSettings.business.storeName),
      legalName: normalizeText(business.legalName, defaultStoreSettings.business.legalName),
      email: normalizeText(business.email, defaultStoreSettings.business.email),
      phone: normalizeText(business.phone, defaultStoreSettings.business.phone),
      addressLine1: normalizeText(business.addressLine1, defaultStoreSettings.business.addressLine1),
      addressLine2: normalizeText(business.addressLine2, defaultStoreSettings.business.addressLine2),
      city: normalizeText(business.city, defaultStoreSettings.business.city),
      district: normalizeText(business.district, defaultStoreSettings.business.district),
      country: normalizeText(business.country, defaultStoreSettings.business.country),
      businessHours: normalizeText(business.businessHours, defaultStoreSettings.business.businessHours),
    },
    contact: {
      whatsappNumber: normalizeText(contact.whatsappNumber, defaultStoreSettings.contact.whatsappNumber),
      whatsappMessage: normalizeText(contact.whatsappMessage, defaultStoreSettings.contact.whatsappMessage),
      supportPhone: normalizeText(contact.supportPhone, defaultStoreSettings.contact.supportPhone),
      supportEmail: normalizeText(contact.supportEmail, defaultStoreSettings.contact.supportEmail),
    },
    payments: {
      bankName: normalizeText(payments.bankName, defaultStoreSettings.payments.bankName),
      accountName: normalizeText(payments.accountName, defaultStoreSettings.payments.accountName),
      accountNumber: normalizeText(payments.accountNumber, defaultStoreSettings.payments.accountNumber),
      branch: normalizeText(payments.branch, defaultStoreSettings.payments.branch),
      instructions: normalizeText(payments.instructions, defaultStoreSettings.payments.instructions),
    },
    delivery: {
      fee: Number.isFinite(Number(delivery.fee)) ? Number(delivery.fee) : defaultStoreSettings.delivery.fee,
      freeDeliveryThreshold: Number.isFinite(Number(delivery.freeDeliveryThreshold)) ? Number(delivery.freeDeliveryThreshold) : defaultStoreSettings.delivery.freeDeliveryThreshold,
      instructions: normalizeText(delivery.instructions, defaultStoreSettings.delivery.instructions),
    },
    social: {
      facebook: normalizeText(social.facebook, defaultStoreSettings.social.facebook),
      instagram: normalizeText(social.instagram, defaultStoreSettings.social.instagram),
      tiktok: normalizeText(social.tiktok, defaultStoreSettings.social.tiktok),
      youtube: normalizeText(social.youtube, defaultStoreSettings.social.youtube),
    },
    website: {
      title: normalizeText(website.title, defaultStoreSettings.website.title),
      metaDescription: normalizeText(website.metaDescription, defaultStoreSettings.website.metaDescription),
    },
    headerFooter: {
      copyrightText: normalizeText(headerFooter.copyrightText, defaultStoreSettings.headerFooter.copyrightText),
      supportText: normalizeText(headerFooter.supportText, defaultStoreSettings.headerFooter.supportText),
    },
  };
}

export async function getStoreSettings(): Promise<StoreSettings> {
  const setting = await prisma.siteContent.findUnique({ where: { key: 'settings' } });
  if (!setting) return defaultStoreSettings;

  try {
    const parsed = JSON.parse(setting.value);
    return normalizeStoreSettings(parsed);
  } catch {
    return defaultStoreSettings;
  }
}

export async function saveStoreSettings(value: Partial<StoreSettings>) {
  const normalized = normalizeStoreSettings(value);
  const serialized = JSON.stringify(normalized);

  await prisma.siteContent.upsert({
    where: { key: 'settings' },
    update: { value: serialized },
    create: { key: 'settings', value: serialized },
  });

  return normalized;
}
