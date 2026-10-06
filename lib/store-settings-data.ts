export type StoreSettings = {
  business: {
    storeName: string;
    legalName: string;
    email: string;
    phone: string;
    addressLine1: string;
    addressLine2: string;
    city: string;
    district: string;
    country: string;
    businessHours: string;
  };
  contact: {
    whatsappNumber: string;
    whatsappMessage: string;
    supportPhone: string;
    supportEmail: string;
  };
  payments: {
    bankName: string;
    accountName: string;
    accountNumber: string;
    branch: string;
    instructions: string;
  };
  delivery: {
    fee: number;
    freeDeliveryThreshold: number;
    instructions: string;
  };
  social: {
    facebook: string;
    instagram: string;
    tiktok: string;
    youtube: string;
  };
  website: {
    title: string;
    metaDescription: string;
  };
  headerFooter: {
    copyrightText: string;
    supportText: string;
  };
};

export const defaultStoreSettings: StoreSettings = {
  business: {
    storeName: 'Celiz LK',
    legalName: 'Celiz LK (Pvt) Ltd',
    email: 'support@celiz.lk',
    phone: '+94 77 123 4567',
    addressLine1: 'Galle Road',
    addressLine2: 'Colombo 03',
    city: 'Colombo',
    district: 'Colombo',
    country: 'Sri Lanka',
    businessHours: 'Mon - Sat • 9:00 AM - 7:00 PM',
  },
  contact: {
    whatsappNumber: '+94 75 120 5996',
    whatsappMessage: 'Hello Celiz LK, I have a question about a product.',
    supportPhone: '+94 77 123 4567',
    supportEmail: 'support@celiz.lk',
  },
  payments: {
    bankName: 'Commercial Bank',
    accountName: 'Celiz LK (Pvt) Ltd',
    accountNumber: '1000-2345-6789',
    branch: 'Colombo Main',
    instructions: 'Please transfer the full order amount and send the payment receipt on WhatsApp for verification.',
  },
  delivery: {
    fee: 350,
    freeDeliveryThreshold: 0,
    instructions: 'Islandwide delivery available with fast courier handling and tracking support.',
  },
  social: {
    facebook: 'https://www.facebook.com/share/1LXMTdG8jr/?mibextid=wwXIfr',
    instagram: 'https://www.instagram.com/celizlk/?utm_source=ig_web_button_share_sheet',
    tiktok: 'https://www.tiktok.com/@celizlk',
    youtube: '',
  },
  website: {
    title: 'Celiz LK — Online Tech Gadgets Store Sri Lanka',
    metaDescription: 'Shop authentic wireless earbuds, GaN fast chargers, power banks, and smartwatches in Sri Lanka with fast islandwide delivery.',
  },
  headerFooter: {
    copyrightText: '© 2026 Celiz LK. All rights reserved.',
    supportText: 'Customer support available via WhatsApp and email.',
  },
};
