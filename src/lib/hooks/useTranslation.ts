import { useLocaleStore } from '@/stores/locale-store'
import eng from '@/i18n/eng.json'
import fr from '@/i18n/fr.json'

const translations = { eng, fr } as const

type NestedObject = { [key: string]: string | NestedObject }

export function useTranslation() {
    const locale = useLocaleStore((state) => state.locale)

    function t(key: string): string {
        const keys = key.split('.')
        let result: unknown = translations[locale]

        for (const k of keys) {
            if (result && typeof result === 'object' && k in result) {
                result = (result as NestedObject)[k]
            } else {
                return key
            }
        }

        return typeof result === 'string' ? result : key
    }

    return { t, locale }
}