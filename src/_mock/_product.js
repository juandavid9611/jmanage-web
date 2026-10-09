// label values below are i18n keys, resolved via t() at render time.
export const PRODUCT_GENDER_OPTIONS = [
  { label: 'word_men', value: 'Men' },
  { label: 'word_women', value: 'Women' },
  { label: 'kids', value: 'Kids' },
];

// Filter values matched directly against product.category in mock data — not translated.
export const PRODUCT_CATEGORY_OPTIONS = ['Shoes', 'Apparel', 'Accessories'];

export const PRODUCT_RATING_OPTIONS = ['up4Star', 'up3Star', 'up2Star', 'up1Star'];

// "colors" is the field/payload key kept for API compatibility, but for this club store it
// means jersey version (Local/Visitante), not an actual color — see JERSEY_LOCATION_OPTIONS
// in product-new-edit-form.jsx for the admin-form pair of this list.
export const PRODUCT_COLOR_OPTIONS = ['Local', 'Visitante'];

export const PRODUCT_SIZE_OPTIONS = [
  { value: 'S', label: 'S' },
  { value: 'M', label: 'M' },
  { value: 'L', label: 'L' },
  { value: 'XL', label: 'XL' },
  { value: 'XXXL', label: 'XXXL' },
];

export const PRODUCT_STOCK_OPTIONS = [
  { value: 'in stock', label: 'label_in_stock' },
  { value: 'low stock', label: 'label_low_stock' },
  { value: 'out of stock', label: 'label_out_of_stock' },
];

export const PRODUCT_PUBLISH_OPTIONS = [
  { value: 'published', label: 'label_published' },
  { value: 'draft', label: 'draft' },
];

export const PRODUCT_SORT_OPTIONS = [
  { value: 'featured', label: 'label_featured' },
  { value: 'newest', label: 'label_newest' },
  { value: 'priceDesc', label: 'label_price_high_low' },
  { value: 'priceAsc', label: 'label_price_low_high' },
];

// group/classify values below are matched against product data — not translated.
// Flat list, values already in Spanish (sent as-is to the API, not translated via t()).
export const PRODUCT_CATEGORY_OPTIONS_ES = ['Camisetas', 'Balones', 'Accesorios', 'Otros'];

// values below are i18n keys, resolved via t() at render time (see checkout-steps.jsx).
export const PRODUCT_CHECKOUT_STEPS = ['label_cart', 'label_billing_and_address', 'payment'];

// ----------------------------------------------------------------------

const SIZES_CLOTHING = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
const SIZES_SHOES = ['38', '39', '40', '41', '42', '43', '44'];

export const _products = [
  {
    id: 'mock-prod-001',
    name: 'Camiseta de Juego Pro',
    coverUrl: '/assets/images/m-product/product-1.webp',
    price: 45,
    priceSale: null,
    colors: ['#FF4842', '#1890FF', '#000000'],
    available: 50,
    sizes: SIZES_CLOTHING,
    gender: ['Men', 'Women'],
    category: 'Apparel',
    totalSold: 120,
    totalRatings: 4.5,
    newLabel: { enabled: true, content: 'NEW' },
    saleLabel: { enabled: false, content: '' },
    createdAt: new Date('2026-02-01'),
  },
  {
    id: 'mock-prod-002',
    name: 'Guayos Velocidad Elite',
    coverUrl: '/assets/images/m-product/product-2.webp',
    price: 120,
    priceSale: 89,
    colors: ['#FFC107', '#000000'],
    available: 20,
    sizes: SIZES_SHOES,
    gender: ['Men'],
    category: 'Shoes',
    totalSold: 85,
    totalRatings: 4.7,
    newLabel: { enabled: false, content: '' },
    saleLabel: { enabled: true, content: 'SALE' },
    createdAt: new Date('2026-01-15'),
  },
  {
    id: 'mock-prod-003',
    name: 'Espinilleras Protección Total',
    coverUrl: '/assets/images/m-product/product-3.webp',
    price: 28,
    priceSale: null,
    colors: ['#1890FF', '#00AB55', '#FF4842'],
    available: 75,
    sizes: ['S', 'M', 'L'],
    gender: ['Men', 'Women', 'Kids'],
    category: 'Accessories',
    totalSold: 200,
    totalRatings: 4.2,
    newLabel: { enabled: false, content: '' },
    saleLabel: { enabled: false, content: '' },
    createdAt: new Date('2025-12-10'),
  },
  {
    id: 'mock-prod-004',
    name: 'Guantes de Portero Pro',
    coverUrl: '/assets/images/m-product/product-4.webp',
    price: 65,
    priceSale: null,
    colors: ['#7F00FF', '#000000'],
    available: 15,
    sizes: ['7', '8', '9', '10', '11'],
    gender: ['Men', 'Women'],
    category: 'Accessories',
    totalSold: 60,
    totalRatings: 4.8,
    newLabel: { enabled: true, content: 'NEW' },
    saleLabel: { enabled: false, content: '' },
    createdAt: new Date('2026-02-20'),
  },
  {
    id: 'mock-prod-005',
    name: 'Balón de Fútbol Match',
    coverUrl: '/assets/images/m-product/product-5.webp',
    price: 55,
    priceSale: 40,
    colors: ['#FFFFFF', '#000000'],
    available: 30,
    sizes: ['4', '5'],
    gender: ['Men', 'Women', 'Kids'],
    category: 'Accessories',
    totalSold: 310,
    totalRatings: 4.6,
    newLabel: { enabled: false, content: '' },
    saleLabel: { enabled: true, content: 'SALE' },
    createdAt: new Date('2025-11-05'),
  },
  {
    id: 'mock-prod-006',
    name: 'Short Deportivo Ligero',
    coverUrl: '/assets/images/m-product/product-6.webp',
    price: 32,
    priceSale: null,
    colors: ['#1890FF', '#000000', '#FF4842'],
    available: 60,
    sizes: SIZES_CLOTHING,
    gender: ['Men', 'Kids'],
    category: 'Apparel',
    totalSold: 95,
    totalRatings: 4.1,
    newLabel: { enabled: false, content: '' },
    saleLabel: { enabled: false, content: '' },
    createdAt: new Date('2026-01-08'),
  },
  {
    id: 'mock-prod-007',
    name: 'Bolso Deportivo Equipo',
    coverUrl: '/assets/images/m-product/product-7.webp',
    price: 48,
    priceSale: null,
    colors: ['#000000', '#1890FF'],
    available: 25,
    sizes: ['Único'],
    gender: ['Men', 'Women'],
    category: 'Accessories',
    totalSold: 45,
    totalRatings: 4.3,
    newLabel: { enabled: false, content: '' },
    saleLabel: { enabled: false, content: '' },
    createdAt: new Date('2026-02-14'),
  },
  {
    id: 'mock-prod-008',
    name: 'Medias de Compresión Sport',
    coverUrl: '/assets/images/m-product/product-8.webp',
    price: 18,
    priceSale: null,
    colors: ['#FFFFFF', '#000000', '#FF4842'],
    available: 100,
    sizes: SIZES_CLOTHING,
    gender: ['Men', 'Women', 'Kids'],
    category: 'Apparel',
    totalSold: 250,
    totalRatings: 4.0,
    newLabel: { enabled: false, content: '' },
    saleLabel: { enabled: false, content: '' },
    createdAt: new Date('2025-10-20'),
  },
];
