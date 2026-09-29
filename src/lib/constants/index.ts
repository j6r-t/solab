export * from './kpi'

export const PRODUCT_CATEGORIES = ['lunette', 'lentille', 'verre', 'accessory', 'nettoyant_lentilles', 'nettoyant_monture'] as const

export const QR_CODE_PREFIX = 'SOPT'

// Tunisia standard VAT rate — single source of truth for price-after-tax math.
// Never inline this value elsewhere; import TAX_RATE or use computePriceAfterTax().
export const TAX_RATE = 0.19

export const AUTH_COOKIE_MAX_AGE = 60 * 60 * 24 * 7

// JWT_SECRET must be set in environment variables - no fallback for security
export const JWT_SECRET = process.env.JWT_SECRET || ''

export const DATE_FORMATS = { display: 'dd/MM/yyyy', iso: "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'" } as const
