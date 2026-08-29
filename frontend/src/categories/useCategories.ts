import { useEffect, useState } from 'react';
import { getCategories } from './api';
import type { Category } from './types';

const fallbackCategories: Category[] = [
  { categoryId: 1, name: 'Housing', slug: 'housing' },
  { categoryId: 2, name: 'Services', slug: 'services' },
  { categoryId: 3, name: 'Hobbies and activities', slug: 'hobbies-and-activities' },
  { categoryId: 4, name: 'Renting cars', slug: 'renting-cars' },
];

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>(fallbackCategories);

  useEffect(() => {
    let active = true;
    getCategories()
      .then((items) => {
        if (active && items.length) setCategories(items);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  return categories;
}
