import type { Locale } from "./config";
import { en } from "./dictionaries/en";
import { ru, type Dictionary } from "./dictionaries/ru";
import { uk } from "./dictionaries/uk";

const dictionaries: Record<Locale, Dictionary> = { en, ru, uk };

export const getDictionary = (locale: Locale): Dictionary => dictionaries[locale];
export type { Dictionary };
