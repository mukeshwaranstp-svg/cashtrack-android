import { useEffect, useState } from 'react';
import type { Category } from '@/types';
import { fetchCategories } from '@/data';

interface UseCategoriesResult {
  categories: Category[];
  isLoading: boolean;
}

export function useCategories(): UseCategoriesResult {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setIsLoading(true);
    fetchCategories().then((data) => {
      if (active) {
        setCategories(data);
        setIsLoading(false);
      }
    });
    return () => {
      active = false;
    };
  }, []);

  return { categories, isLoading };
}
