export const PRODUCT_GENDER_OPTIONS = [
  { label: 'Men', value: 'Men' },
  { label: 'Women', value: 'Women' },
  { label: 'Kids', value: 'Kids' },
];

export const PRODUCT_CATEGORY_OPTIONS = ['Shose', 'Apparel', 'Accessories'];

export const PRODUCT_RATING_OPTIONS = ['up4Star', 'up3Star', 'up2Star', 'up1Star'];

export const PRODUCT_COLOR_OPTIONS = [
  '#FF4842',
  '#1890FF',
  '#FFC0CB',
  '#00AB55',
  '#FFC107',
  '#7F00FF',
  '#000000',
  '#FFFFFF',
];

export const PRODUCT_COLOR_NAME_OPTIONS = [
  { value: '#FF4842', label: 'Red' },
  { value: '#1890FF', label: 'Blue' },
  { value: '#FFC0CB', label: 'Pink' },
  { value: '#00AB55', label: 'Green' },
  { value: '#FFC107', label: 'Yellow' },
  { value: '#7F00FF', label: 'Violet' },
  { value: '#000000', label: 'Black' },
  { value: '#FFFFFF', label: 'White' },
];

export const PRODUCT_SIZE_OPTIONS = [
  { value: '7', label: '7' },
  { value: '8', label: '8' },
  { value: '8.5', label: '8.5' },
  { value: '9', label: '9' },
  { value: '9.5', label: '9.5' },
  { value: '10', label: '10' },
  { value: '10.5', label: '10.5' },
  { value: '11', label: '11' },
  { value: '11.5', label: '11.5' },
  { value: '12', label: '12' },
  { value: '13', label: '13' },
];

export const PRODUCT_STOCK_OPTIONS = [
  { value: 'in stock', label: 'In stock' },
  { value: 'low stock', label: 'Low stock' },
  { value: 'out of stock', label: 'Out of stock' },
];

export const PRODUCT_PUBLISH_OPTIONS = [
  { value: 'published', label: 'Published' },
  { value: 'draft', label: 'Draft' },
];

export const PRODUCT_SORT_OPTIONS = [
  { value: 'featured', label: 'Featured' },
  { value: 'newest', label: 'Newest' },
  { value: 'priceDesc', label: 'Price: High - Low' },
  { value: 'priceAsc', label: 'Price: Low - High' },
];

export const PRODUCT_CATEGORY_GROUP_OPTIONS = [
  { group: 'Clothing', classify: ['Shirts', 'T-shirts', 'Jeans', 'Leather', 'Accessories'] },
  { group: 'Tailored', classify: ['Suits', 'Blazers', 'Trousers', 'Waistcoats', 'Apparel'] },
  { group: 'Accessories', classify: ['Shoes', 'Backpacks and bags', 'Bracelets', 'Face masks'] },
];

export const PRODUCT_CHECKOUT_STEPS = ['Cart', 'Billing & address', 'Payment'];

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
    category: 'Shose',
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
