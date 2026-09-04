export const PRODUCT_CATEGORIES = ['lunette', 'lentille', 'verre', 'accessory', 'nettoyant_lentilles', 'nettoyant_monture'] as const

export const STOCK_THRESHOLDS = { lowStock: 3 } as const

export const QR_CODE_PREFIX = 'SOPT'

export const AUTH_COOKIE_MAX_AGE = 60 * 60 * 24 * 7

// JWT_SECRET must be set in environment variables - no fallback for security
export const JWT_SECRET = process.env.JWT_SECRET || ''

export const DATE_FORMATS = { display: 'dd/MM/yyyy', iso: "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'" } as const
