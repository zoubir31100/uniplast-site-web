export interface Product {
  id: string;
  code: string;
  name: string;
  colisage: number;
  price: number;
  capacity: string;
  dimensions: string;
  category: string;
  image?: string;
  imageScale?: number;
  imagePositionX?: number;
  imagePositionY?: number;
  barcode?: string;
  isHidden?: boolean;
  isOutOfStock?: boolean;
  discountPrice?: number;
  discountEndDate?: string;
}

export interface CartItem extends Product {
  quantityCartons: number;
  totalPieces: number;
  totalPrice: number;
}

export interface Order {
  id: string;
  date: string;
  customerName: string;
  items: CartItem[];
  totalAmount: number;
}

export interface AppConfig {
  logo: string | null;
  globalBanner: string | null;
  categoryBanners: Record<string, string>;
  stickyBanner: boolean;
  bannerPositions: Record<string, number>;
  hidePrice: boolean;
  priceLabel: string;
}

export type ViewMode = 'CATALOG' | 'CART' | 'INVOICE' | 'HISTORY' | 'STATS' | 'DETAIL';

export type SortOption = 'DEFAULT' | 'PRICE_ASC' | 'PRICE_DESC' | 'NAME_ASC';

export interface FilterState {
  search: string;
  category: string;
  sort: SortOption;
}
