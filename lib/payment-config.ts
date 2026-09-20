import { getEnv } from '@/lib/env';

export const bankTransferInstructions = {
  bankName: getEnv('BANK_TRANSFER_BANK_NAME', 'Commercial Bank'),
  accountName: getEnv('BANK_TRANSFER_ACCOUNT_NAME', 'Celiz LK (Pvt) Ltd'),
  accountNumber: getEnv('BANK_TRANSFER_ACCOUNT_NUMBER', '1000-2345-6789'),
  branch: getEnv('BANK_TRANSFER_BRANCH', 'Colombo Main'),
  currency: 'LKR',
};
