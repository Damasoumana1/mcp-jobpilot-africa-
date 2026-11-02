import { useEffect, useState } from 'react';

export interface Country { code: string; fr: string; en: string; region: string; aliases: string[] }
interface Geography { countries: Country[]; regions: { id: string; fr: string; en: string }[] }
let cached: Geography | undefined;
let pending: Promise<Geography> | undefined;
export const normalizeCountry = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '');
export const findCountry = (value: string | undefined, countries: Country[]) => {
  const key = normalizeCountry(value || '');
  return key ? countries.find(c => [c.code, c.fr, c.en, ...c.aliases].some(alias => normalizeCountry(alias) === key)) : undefined;
};
export function useGeography() {
  const [data, setData] = useState<Geography>(cached || { countries: [], regions: [] });
  const [loading, setLoading] = useState(!cached);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(false);
    pending ??= fetch('/api/geography').then(async response => {
      if (!response.ok) throw new Error('Geography unavailable');
      const result: Geography = await response.json();
      if (!Array.isArray(result.countries) || !Array.isArray(result.regions)) throw new Error('Invalid geography');
      cached = result;
      return result;
    }).catch(error => { pending = undefined; throw error; });
    (cached ? Promise.resolve(cached) : pending).then(result => { if (active) setData(result); }).catch(() => { if (active) setError(true); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [attempt]);
  return { ...data, loading, error, retry: () => setAttempt(value => value + 1) };
}
