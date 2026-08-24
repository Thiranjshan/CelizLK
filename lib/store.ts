import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Product, UserSession } from './types';

export interface LocalCartItem {
  product: Product;
  quantity: number;
  selected?: boolean;
}

interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

interface StoreState {
  cart: LocalCartItem[];
  buyNowItem: LocalCartItem | null;
  user: UserSession | null;
  accessToken: string | null;
  authInitialized: boolean;
  toasts: ToastMessage[];
  
  // Cart Actions
  addToCart: (product: Product, quantity?: number) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  toggleCartItemSelection: (productId: string) => void;
  toggleAllCartItems: (selected: boolean) => void;
  clearCart: () => void;
  getCartCount: () => number;
  getCartSubtotal: () => number;
  getSelectedCartItems: () => LocalCartItem[];

  // Buy Now Actions
  setBuyNowItem: (item: LocalCartItem | null) => void;
  updateBuyNowQuantity: (quantity: number) => void;
  
  // Auth Actions
  setUser: (user: UserSession | null) => void;
  setAccessToken: (token: string | null) => void;
  setAuthInitialized: (initialized: boolean) => void;
  logout: () => void;

  // Toast Actions
  addToast: (type: 'success' | 'error' | 'info', message: string) => void;
  removeToast: (id: string) => void;
}

export const useStore = create<StoreState>()(
  persist(
    (set, get) => ({
      cart: [],
      buyNowItem: null,
      user: null,
      accessToken: null,
      authInitialized: false,
      toasts: [],

      addToCart: (product, quantity = 1) => {
        const { cart, addToast } = get();
        const existingIndex = cart.findIndex((item) => item.product.id === product.id);

        if (existingIndex > -1) {
          const updatedCart = [...cart];
          updatedCart[existingIndex].quantity += quantity;
          updatedCart[existingIndex].selected = true;
          set({ cart: updatedCart });
        } else {
          set({ cart: [...cart, { product, quantity, selected: true }] });
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

      toggleCartItemSelection: (productId) => {
        const { cart } = get();
        set({
          cart: cart.map((item) =>
            item.product.id === productId
              ? { ...item, selected: item.selected === undefined ? false : !item.selected }
              : item
          ),
        });
      },

      toggleAllCartItems: (selected) => {
        const { cart } = get();
        set({
          cart: cart.map((item) => ({ ...item, selected })),
        });
      },

      clearCart: () => set({ cart: [] }),

      getCartCount: () => {
        return get().cart.filter((item) => item.selected !== false).reduce((total, item) => total + item.quantity, 0);
      },

      getCartSubtotal: () => {
        return get()
          .cart.filter((item) => item.selected !== false)
          .reduce((total, item) => {
            const price = item.product.discountPrice ?? item.product.price;
            return total + price * item.quantity;
          }, 0);
      },

      getSelectedCartItems: () => {
        return get().cart.filter((item) => item.selected !== false);
      },

      setBuyNowItem: (buyNowItem) => set({ buyNowItem }),

      updateBuyNowQuantity: (quantity) => {
        const { buyNowItem } = get();
        if (!buyNowItem) return;
        if (quantity <= 0) {
          set({ buyNowItem: null });
        } else {
          set({ buyNowItem: { ...buyNowItem, quantity } });
        }
      },

      setUser: (user) => set({ user }),

      setAccessToken: (accessToken) => set({ accessToken }),

      setAuthInitialized: (authInitialized) => set({ authInitialized }),

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
