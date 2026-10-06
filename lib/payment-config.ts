import { getStoreSettings } from '@/lib/store-settings';

export async function getBankTransferInstructions() {
  const settings = await getStoreSettings();
  return {
    bankName: settings.payments.bankName || 'Commercial Bank',
    accountName: settings.payments.accountName || 'Celiz LK (Pvt) Ltd',
    accountNumber: settings.payments.accountNumber || '1000-2345-6789',
    branch: settings.payments.branch || 'Colombo Main',
    currency: 'LKR',
  };
}

export const bankTransferInstructions = {
  bankName: 'Commercial Bank',
  accountName: 'Celiz LK (Pvt) Ltd',
  accountNumber: '1000-2345-6789',
  branch: 'Colombo Main',
  currency: 'LKR',
};
