import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Product, UserSession } from './types';

export interface LocalCartItem {
  product: Product;
  quantity: number;
}

interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

interface StoreState {
  cart: LocalCartItem[];
  user: UserSession | null;
  accessToken: string | null;
  toasts: ToastMessage[];
  
  // Cart Actions
  addToCart: (product: Product, quantity?: number) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  getCartCount: () => number;
  getCartSubtotal: () => number;
  
  // Auth Actions
  setUser: (user: UserSession | null) => void;
  setAccessToken: (token: string | null) => void;
  logout: () => void;

  // Toast Actions
  addToast: (type: 'success' | 'error' | 'info', message: string) => void;
  removeToast: (id: string) => void;
}

export const useStore = create<StoreState>()(
  persist(
    (set, get) => ({
      cart: [],
      user: null,
      accessToken: null,
      toasts: [],

      addToCart: (product, quantity = 1) => {
        const { cart, addToast } = get();
        const existingIndex = cart.findIndex((item) => item.product.id === product.id);

        if (existingIndex > -1) {
          const updatedCart = [...cart];
          updatedCart[existingIndex].quantity += quantity;
          set({ cart: updatedCart });
        } else {
          set({ cart: [...cart, { product, quantity }] });
        }
        addToast('success', `Added "${product.name}" to cart!`);
      },

      removeFromCart: (productId) => {
        const { cart, addToast } = get();
        const item = cart.find((i) => i.product.id === productId);
        set({ cart: cart.filter((i) => i.product.id !== productId) });
        if (item) {
          addToast('info', `Removed "${item.product.name}" from cart.`);
        }
      },

      updateQuantity: (productId, quantity) => {
        const { cart } = get();
        if (quantity <= 0) {
          get().removeFromCart(productId);
          return;
        }
        set({
          cart: cart.map((item) =>
            item.product.id === productId ? { ...item, quantity } : item
          ),
        });
      },

      clearCart: () => set({ cart: [] }),

      getCartCount: () => {
        return get().cart.reduce((total, item) => total + item.quantity, 0);
      },

      getCartSubtotal: () => {
        return get().cart.reduce((total, item) => {
          const price = item.product.discountPrice ?? item.product.price;
          return total + price * item.quantity;
        }, 0);
      },

      setUser: (user) => set({ user }),

      setAccessToken: (accessToken) => set({ accessToken }),

      logout: () => {
        set({ user: null, accessToken: null });
        get().addToast('info', 'Logged out successfully');
      },

      addToast: (type, message) => {
        const id = Math.random().toString(36).substring(2, 9);
        set((state) => ({
          toasts: [...state.toasts, { id, type, message }],
        }));

        setTimeout(() => {
          get().removeToast(id);
        }, 4000);
      },

      removeToast: (id) => {
        set((state) => ({
          toasts: state.toasts.filter((t) => t.id !== id),
        }));
      },
    }),
    {
      name: 'celiz-lk-store-v2',
      partialize: (state) => ({ cart: state.cart }),
    }
  )
);
