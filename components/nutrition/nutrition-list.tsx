'use client';

import { useMemo, useState } from 'react';
import { AlertTriangle, ArrowUpDown, Filter, X } from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useI18n } from '@/components/providers/i18n-provider';

type Product = {
  id: string;
  name: string;
  category: string;
  carbs: number;
  protein: number;
  fat: number;
  calories: number;
  salt: number;
};

type SortKey = keyof Pick<Product, 'name' | 'category' | 'carbs' | 'protein' | 'fat' | 'calories' | 'salt'>;

const INITIAL_PRODUCTS: Product[] = [
  { id: '1', name: 'Pomme', category: 'Fruits', carbs: 14, protein: 0.3, fat: 0.2, calories: 52, salt: 0 },
  { id: '2', name: 'Saumon', category: 'Poisson', carbs: 0, protein: 20, fat: 13, calories: 208, salt: 0.08 },
  { id: '3', name: 'Pain complet', category: 'Céréales', carbs: 43, protein: 9, fat: 4, calories: 247, salt: 0.49 },
  { id: '4', name: 'Pois chiches', category: 'Légumineuses', carbs: 27, protein: 9, fat: 3, calories: 164, salt: 0.24 },
  { id: '5', name: 'Fromage blanc', category: 'Laitiers', carbs: 4, protein: 8, fat: 0, calories: 90, salt: 0.1 }
];

const generateId = () => (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2));

export function NutritionList() {
  const { dictionary, locale } = useI18n();
  const copy = dictionary.nutritionList;
  const numberFormatter = useMemo(
    () => new Intl.NumberFormat(locale === 'fr' ? 'fr-FR' : 'en-US', { maximumFractionDigits: 1 }),
    [locale]
  );

  const [filter, setFilter] = useState('');
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [sortKey, setSortKey] = useState<SortKey>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [formValues, setFormValues] = useState({
    name: '',
    category: '',
    carbs: '',
    protein: '',
    fat: '',
    calories: '',
    salt: ''
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [pendingProduct, setPendingProduct] = useState<Product | null>(null);
  const [zeroFields, setZeroFields] = useState<SortKey[]>([]);
  const [warningOpen, setWarningOpen] = useState(false);

  const columnLabels: Record<SortKey, string> = {
    name: copy.table.columns.product,
    category: copy.table.columns.category,
    carbs: copy.table.columns.carbs,
    protein: copy.table.columns.protein,
    fat: copy.table.columns.fat,
    calories: copy.table.columns.calories,
    salt: copy.table.columns.salt
  };

  const filteredProducts = useMemo(() => {
    const normalizedFilter = filter.trim().toLowerCase();
    const base = normalizedFilter
      ? products.filter(
          (product) =>
            product.name.toLowerCase().includes(normalizedFilter) ||
            product.category.toLowerCase().includes(normalizedFilter)
        )
      : products;

    const sorted = [...base].sort((a, b) => {
      const first = a[sortKey];
      const second = b[sortKey];

      if (typeof first === 'string' && typeof second === 'string') {
        return sortDirection === 'asc'
          ? first.localeCompare(second, undefined, { sensitivity: 'base' })
          : second.localeCompare(first, undefined, { sensitivity: 'base' });
      }

      if (typeof first === 'number' && typeof second === 'number') {
        return sortDirection === 'asc' ? first - second : second - first;
      }

      return 0;
    });

    return sorted;
  }, [filter, products, sortDirection, sortKey]);

  const resetForm = () =>
    setFormValues({
      name: '',
      category: '',
      carbs: '',
      protein: '',
      fat: '',
      calories: '',
      salt: ''
    });

  const addProduct = (product: Product) => {
    setProducts((previous) => [...previous, product]);
    resetForm();
    setFormError(null);
  };

  const handleSort = (key: SortKey) => {
    setSortKey(key);
    setSortDirection((previous) => (key === sortKey ? (previous === 'asc' ? 'desc' : 'asc') : 'asc'));
  };

  const parseNumber = (value: string) => Number.parseFloat(value.replace(',', '.'));

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);

    if (!formValues.name.trim()) {
      setFormError(copy.form.validation.nameRequired);
      return;
    }

    if (!formValues.category.trim()) {
      setFormError(copy.form.validation.categoryRequired);
      return;
    }

    const parsed = {
      carbs: parseNumber(formValues.carbs || '0'),
      protein: parseNumber(formValues.protein || '0'),
      fat: parseNumber(formValues.fat || '0'),
      calories: parseNumber(formValues.calories || '0'),
      salt: parseNumber(formValues.salt || '0')
    };

    const invalid = Object.values(parsed).some((value) => Number.isNaN(value) || value < 0);

    if (invalid) {
      setFormError(copy.form.validation.nonNegative);
      return;
    }

    const product: Product = {
      id: generateId(),
      name: formValues.name.trim(),
      category: formValues.category.trim(),
      carbs: parsed.carbs,
      protein: parsed.protein,
      fat: parsed.fat,
      calories: parsed.calories,
      salt: parsed.salt
    };

    const zeros = (Object.entries(parsed) as [SortKey, number][])
      .filter(([, value]) => value === 0)
      .map(([key]) => key);

    if (zeros.length > 0) {
      setPendingProduct(product);
      setZeroFields(zeros);
      setWarningOpen(true);
      return;
    }

    addProduct(product);
  };

  const confirmZeroValues = () => {
    if (pendingProduct) {
      addProduct(pendingProduct);
      setPendingProduct(null);
    }
    setWarningOpen(false);
    setZeroFields([]);
  };

  const cancelZeroWarning = () => {
    setWarningOpen(false);
    setZeroFields([]);
  };

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-6 py-8">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold text-slate-900">{copy.title}</h1>
        <p className="text-slate-600">{copy.description}</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[2fr,1fr]">
        <Card className="border-slate-200 bg-white text-slate-900">
          <CardHeader className="flex flex-col gap-2 border-b border-slate-200 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-lg font-semibold">{copy.table.caption}</CardTitle>
              <CardDescription className="text-sm text-slate-500">{copy.filters.searchPlaceholder}</CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              <div className="relative">
                <Input
                  value={filter}
                  onChange={(event) => setFilter(event.target.value)}
                  placeholder={copy.filters.searchPlaceholder}
                  className="pe-10"
                />
                <Filter className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
              </div>
              {filter ? (
                <Button variant="outline" onClick={() => setFilter('')}>
                  <X className="mr-2 h-4 w-4" aria-hidden="true" />
                  {copy.filters.clearLabel}
                </Button>
              ) : null}
            </div>
          </CardHeader>
          <CardContent className="px-0 pb-0">
            <div className="overflow-hidden border-t border-slate-200">
              <div className="max-h-[480px] overflow-y-auto">
                <table className="min-w-full divide-y divide-slate-200 text-left">
                  <caption className="sr-only">{copy.table.caption}</caption>
                  <thead className="sticky top-0 bg-white">
                    <tr>
                      {(Object.keys(columnLabels) as SortKey[]).map((key) => (
                        <th
                          key={key}
                          scope="col"
                          className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500"
                          aria-sort={sortKey === key ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none'}
                        >
                          <button
                            type="button"
                            onClick={() => handleSort(key)}
                            className="inline-flex items-center gap-2 text-left text-slate-700 hover:text-slate-900"
                            aria-label={`${copy.table.sortLabel} ${columnLabels[key]}`}
                          >
                            <span>{columnLabels[key]}</span>
                            <ArrowUpDown className="h-4 w-4" aria-hidden="true" />
                          </button>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 bg-white">
                    {filteredProducts.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-4 py-6 text-center text-sm text-slate-500">
                          {copy.table.empty}
                        </td>
                      </tr>
                    ) : (
                      filteredProducts.map((product) => (
                        <tr key={product.id} className="hover:bg-slate-50">
                          <td className="px-4 py-3 text-sm font-semibold text-slate-900">{product.name}</td>
                          <td className="px-4 py-3 text-sm text-slate-700">{product.category}</td>
                          <td className="px-4 py-3 text-sm text-slate-700">{numberFormatter.format(product.carbs)}</td>
                          <td className="px-4 py-3 text-sm text-slate-700">{numberFormatter.format(product.protein)}</td>
                          <td className="px-4 py-3 text-sm text-slate-700">{numberFormatter.format(product.fat)}</td>
                          <td className="px-4 py-3 text-sm text-slate-700">{numberFormatter.format(product.calories)}</td>
                          <td className="px-4 py-3 text-sm text-slate-700">{numberFormatter.format(product.salt)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-white text-slate-900">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">{copy.form.title}</CardTitle>
            <CardDescription className="text-sm text-slate-500">{copy.form.description}</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleSubmit} noValidate>
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700" htmlFor="product-name">
                  {copy.form.fields.name}
                </label>
                <Input
                  id="product-name"
                  value={formValues.name}
                  onChange={(event) => setFormValues((previous) => ({ ...previous, name: event.target.value }))}
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700" htmlFor="product-category">
                  {copy.form.fields.category}
                </label>
                <Input
                  id="product-category"
                  value={formValues.category}
                  onChange={(event) => setFormValues((previous) => ({ ...previous, category: event.target.value }))}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700" htmlFor="product-carbs">
                    {copy.form.fields.carbs}
                  </label>
                  <Input
                    id="product-carbs"
                    inputMode="decimal"
                    value={formValues.carbs}
                    onChange={(event) => setFormValues((previous) => ({ ...previous, carbs: event.target.value }))}
                    placeholder="0"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700" htmlFor="product-protein">
                    {copy.form.fields.protein}
                  </label>
                  <Input
                    id="product-protein"
                    inputMode="decimal"
                    value={formValues.protein}
                    onChange={(event) => setFormValues((previous) => ({ ...previous, protein: event.target.value }))}
                    placeholder="0"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700" htmlFor="product-fat">
                    {copy.form.fields.fat}
                  </label>
                  <Input
                    id="product-fat"
                    inputMode="decimal"
                    value={formValues.fat}
                    onChange={(event) => setFormValues((previous) => ({ ...previous, fat: event.target.value }))}
                    placeholder="0"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700" htmlFor="product-calories">
                    {copy.form.fields.calories}
                  </label>
                  <Input
                    id="product-calories"
                    inputMode="decimal"
                    value={formValues.calories}
                    onChange={(event) => setFormValues((previous) => ({ ...previous, calories: event.target.value }))}
                    placeholder="0"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700" htmlFor="product-salt">
                    {copy.form.fields.salt}
                  </label>
                  <Input
                    id="product-salt"
                    inputMode="decimal"
                    value={formValues.salt}
                    onChange={(event) => setFormValues((previous) => ({ ...previous, salt: event.target.value }))}
                    placeholder="0"
                  />
                </div>
              </div>

              {formError ? <p className="text-sm text-red-600">{formError}</p> : null}

              <Button type="submit" className="w-full">
                {copy.form.submitLabel}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      {warningOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4 py-8">
          <div className="w-full max-w-lg rounded-2xl border border-amber-200 bg-white p-6 shadow-2xl">
            <div className="flex items-start gap-3">
              <span className="mt-0.5 rounded-full bg-amber-100 p-2 text-amber-700">
                <AlertTriangle className="h-5 w-5" aria-hidden="true" />
              </span>
              <div className="space-y-1">
                <h2 className="text-lg font-semibold text-slate-900">{copy.form.zeroWarning.title}</h2>
                <p className="text-sm text-slate-600">{copy.form.zeroWarning.description}</p>
                <ul className="list-disc space-y-1 pl-5 text-sm text-slate-700">
                  {zeroFields.map((field) => (
                    <li key={field}>
                      <span className="font-medium text-slate-900">{copy.form.zeroWarning.zeroPrefix}</span>{' '}
                      {columnLabels[field]}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
              <Button variant="outline" onClick={cancelZeroWarning}>
                {copy.form.zeroWarning.back}
              </Button>
              <Button onClick={confirmZeroValues}>{copy.form.zeroWarning.confirm}</Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
