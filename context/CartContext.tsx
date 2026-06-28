'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import type { CustomMeasurements } from '@/lib/measurements';
import { hasMeasurements } from '@/lib/measurements';

export type CartItem = {
    uid: string; // unique per cart line (lets identical products with different custom fits coexist)
    id: string;
    name: string;
    price: number;
    image: string;
    quantity: number;
    variant?: string;
    slug: string;
    maxStock: number;
    moq?: number; // Minimum Order Quantity
    measurements?: CustomMeasurements; // optional made-to-measure custom fit
};

// Callers don't need to provide `uid` — it is generated on add.
export type NewCartItem = Omit<CartItem, 'uid'> & { uid?: string };

export type CartContextType = {
    cart: CartItem[];
    addToCart: (item: NewCartItem) => void;
    removeFromCart: (uid: string) => void;
    updateQuantity: (uid: string, quantity: number) => void;
    clearCart: () => void;
    cartCount: number;
    subtotal: number;
    shipping: number;
    total: number;
    coupon: { code: string; amount: number } | null;
    applyCoupon: (code: string) => void;
    removeCoupon: () => void;
    isCartOpen: boolean;
    setIsCartOpen: (isOpen: boolean) => void;
};

const CartContext = createContext<CartContextType | undefined>(undefined);

function genUid(): string {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
        return crypto.randomUUID();
    }
    return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function CartProvider({ children }: { children: ReactNode }) {
    const [cart, setCart] = useState<CartItem[]>([]);
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [coupon, setCoupon] = useState<{ code: string; amount: number } | null>(null);

    // Initial Load
    useEffect(() => {
        const savedCart = localStorage.getItem('cart');
        if (savedCart) {
            try {
                const parsed = JSON.parse(savedCart);
                if (Array.isArray(parsed)) {
                    // Backfill uid for carts saved before per-line ids existed.
                    setCart(parsed.map((item: CartItem) => ({ ...item, uid: item.uid || genUid() })));
                }
            } catch (e) {
                console.error('Failed to parse cart:', e);
            }
        }
    }, []);

    // Save cart
    useEffect(() => {
        localStorage.setItem('cart', JSON.stringify(cart));
    }, [cart]);

    const addToCart = (newItem: NewCartItem) => {
        setCart((prevCart) => {
            // Custom-fit items are unique per set of measurements, so never merge them.
            if (!hasMeasurements(newItem.measurements)) {
                const existingItemIndex = prevCart.findIndex(
                    (item) =>
                        item.id === newItem.id &&
                        item.variant === newItem.variant &&
                        !hasMeasurements(item.measurements)
                );

                if (existingItemIndex > -1) {
                    return prevCart.map((item, i) =>
                        i === existingItemIndex
                            ? { ...item, quantity: item.quantity + newItem.quantity }
                            : item
                    );
                }
            }

            return [...prevCart, { ...newItem, uid: newItem.uid || genUid() }];
        });
        setIsCartOpen(true);
    };

    const removeFromCart = (uid: string) => {
        setCart((prevCart) => prevCart.filter((item) => item.uid !== uid));
    };

    const updateQuantity = (uid: string, quantity: number) => {
        setCart((prevCart) =>
            prevCart.map((item) =>
                item.uid === uid ? { ...item, quantity: Math.max(0, quantity) } : item
            )
        );
    };

    const clearCart = () => setCart([]);

    const applyCoupon = (code: string) => {
        // Mock coupon logic
        if (code === 'WELCOME20') {
            setCoupon({ code, amount: 20 });
        } else {
            alert('Invalid coupon code');
        }
    };

    const removeCoupon = () => setCoupon(null);

    const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
    const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const shipping = subtotal > 500 ? 0 : 50; // Free shipping over 500
    const total = subtotal + shipping - (coupon?.amount || 0);

    return (
        <CartContext.Provider
            value={{
                cart,
                addToCart,
                removeFromCart,
                updateQuantity,
                clearCart,
                cartCount,
                subtotal,
                shipping,
                total,
                coupon,
                applyCoupon,
                removeCoupon,
                isCartOpen,
                setIsCartOpen,
            }}
        >
            {children}
        </CartContext.Provider>
    );
}

export function useCart() {
    const context = useContext(CartContext);
    if (context === undefined) {
        throw new Error('useCart must be used within a CartProvider');
    }
    return context;
}
