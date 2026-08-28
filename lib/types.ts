export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  parentId?: string | null;
  seoTitle?: string | null;
  seoDescription?: string | null;
  _count?: {
    products: number;
  };
}

export interface Brand {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string | null;
  isActive: boolean;
  sortOrder: number;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  discountPrice?: number | null;
  stockQty: number;
  categoryId: string;
  category?: Category;
  brandId: string;
  brand?: Brand | null;
  images: string[]; // parsed from JSON
  specs: Record<string, string | number | boolean>; // parsed from JSON
  seoTitle?: string | null;
  seoDescription?: string | null;
  isActive: boolean;
  isFeatured: boolean;
  createdAt: string;
}

export interface CartItem {
  id: string;
  product: Product;
  quantity: number;
}

export interface OrderItem {
  id: string;
  productId: string;
  product: Product;
  quantity: number;
  unitPrice: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  status: 'PENDING' | 'PAID' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
  subtotal: number;
  shippingFee: number;
  total: number;
  paymentMethod: string;
  paymentGatewayRef?: string | null;
  shippingAddress: {
    addressLine1: string;
    addressLine2?: string;
    city: string;
    district: string;
    postalCode?: string;
  };
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  createdAt: string;
  items: OrderItem[];
}

export interface UserSession {
  id: string;
  email: string;
  fullName: string;
  phone?: string | null;
  role: 'CUSTOMER' | 'ADMIN';
}

export interface AuthResponse {
  user: UserSession;
  accessToken: string;
}
