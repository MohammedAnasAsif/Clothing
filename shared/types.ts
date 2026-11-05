export type Gender = 'men' | 'women' | 'unisex';

export interface Category {
  slug: string;
  name: string;
  tagline: string;
  description: string;
  image: string; // Unsplash photo id
}

export interface Color {
  name: string;
  hex: string;
}

export interface Product {
  id: number;
  slug: string;
  name: string;
  category: string; // category slug
  type: string; // finer grouping, e.g. "Graphic tee", "Dress"
  gender: Gender;
  price: number; // INR, whole rupees
  compareAt: number | null; // original price when on sale
  images: string[]; // Unsplash photo ids, first two are used for the hover swap
  colors: Color[];
  sizes: string[];
  sku: string;
  stock: number;
  fabric: string;
  fit: string;
  description: string;
  details: string[];
  badge?: 'New' | 'Bestseller' | 'Limited';
  rating: number; // average, 1 decimal
  reviewCount: number;
}

export interface Review {
  id: number;
  productSlug: string;
  name: string;
  rating: number;
  title: string;
  body: string;
  createdAt: string;
}

export interface CartLine {
  slug: string;
  size: string;
  color: string;
  qty: number;
}

export interface Customer {
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
}

export interface OrderItem extends CartLine {
  name: string;
  price: number;
  image: string;
}

export interface Order {
  number: string;
  customer: Customer;
  items: OrderItem[];
  subtotal: number;
  shipping: number;
  total: number;
  payment: 'cod' | 'upi';
  status: 'placed' | 'packed' | 'shipped' | 'delivered';
  createdAt: string;
}

export interface ProductQuery {
  category?: string;
  gender?: Gender;
  type?: string;
  size?: string;
  q?: string;
  sale?: boolean;
  min?: number;
  max?: number;
  sort?: 'featured' | 'newest' | 'price-asc' | 'price-desc' | 'rating';
  page?: number;
  limit?: number;
}

export interface ProductPage {
  items: Product[];
  total: number;
  page: number;
  pages: number;
}

export const FREE_SHIPPING_FROM = 1999;
export const SHIPPING_FEE = 99;
