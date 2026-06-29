import { create } from "zustand";
import { persist } from "zustand/middleware";

type locale = 'eng' | 'fr';

interface localeState {
    locale: locale;
    setLocale: (locale: locale) => void;
}

export const useLocaleStore = create(persist<localeState>((set) => ({
    locale: 'fr',
    setLocale: (locale) => set({ locale }),
}), {
    name: 'sofien_optique_locale',
}));