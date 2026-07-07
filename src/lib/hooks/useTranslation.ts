import { useLocaleStore } from '@/stores/locale-store'
import eng from '@/i18n/eng.json'
import fr from '@/i18n/fr.json'

const translations = { eng, fr } as const

type NestedObject = { [key: string]: string | NestedObject }

export function useTranslation() {
    const locale = useLocaleStore((state) => state.locale)

    function t(key: string, vars?: Record<string, string | number>): string {
        const keys = key.split('.')
        let result: unknown = translations[locale]

        for (const k of keys) {
            if (result && typeof result === 'object' && k in result) {
                result = (result as NestedObject)[k]
            } else {
                return key
            }
        }

        const str = typeof result === 'string' ? result : key
        if (!vars) return str
        let out = str
        for (const [k, v] of Object.entries(vars)) {
            out = out.replace(`{${k}}`, String(v))
        }
        return out
    }

    return { t, locale }
}