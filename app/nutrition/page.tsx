import type { Metadata } from 'next';

import { NutritionList } from '@/components/nutrition/nutrition-list';
import { DEFAULT_LOCALE, getDictionary } from '@/lib/i18n/dictionaries';

const dictionary = getDictionary(DEFAULT_LOCALE);

export const metadata: Metadata = {
  title: dictionary.nutritionList.metadata.title,
  description: dictionary.nutritionList.metadata.description
};

export default function NutritionPage() {
  return <NutritionList />;
}
