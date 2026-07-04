export const PRODUCT_CATEGORIES = ['lunette', 'lentille', 'verre', 'accessory', 'nettoyant_lentilles', 'nettoyant_monture'] as const

export const STOCK_THRESHOLDS = { lowStock: 3 } as const

export const QR_CODE_PREFIX = 'SOPT'

export const AUTH_COOKIE_MAX_AGE = 60 * 60 * 24 * 7

export const JWT_SECRET_FALLBACK = 'sofien-optic-secret-change-me'

export const DATE_FORMATS = { display: 'dd/MM/yyyy', iso: "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'" } as const
