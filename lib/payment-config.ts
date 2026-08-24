export const bankTransferInstructions = {
  bankName: process.env.BANK_TRANSFER_BANK_NAME || 'Commercial Bank',
  accountName: process.env.BANK_TRANSFER_ACCOUNT_NAME || 'Celiz LK (Pvt) Ltd',
  accountNumber: process.env.BANK_TRANSFER_ACCOUNT_NUMBER || '1000-2345-6789',
  branch: process.env.BANK_TRANSFER_BRANCH || 'Colombo Main',
  currency: 'LKR',
};
