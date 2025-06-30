export interface CryptoPrice {
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  changePercent24h: number;
  marketCap?: number;
}

// Базовый эндпоинт бэкенда
const API_BASE = '/api/crypto/prices';

// Получить все цены сразу
export const fetchAllCryptoPrices = async (): Promise<Record<string, CryptoPrice>> => {
  const res = await fetch(API_BASE, { credentials: 'include' });
  if (!res.ok) {
    throw new Error('Не удалось получить цены криптовалют');
  }
  const json = await res.json();
  return json.data as Record<string, CryptoPrice>;
};

// Получить цену конкретного символа (BTC, ETH и т.д.)
export const getCryptoPrice = async (symbol: string): Promise<CryptoPrice | null> => {
  try {
    const all = await fetchAllCryptoPrices();
    return all[symbol.toUpperCase()] || null;
  } catch (error) {
    console.error('Ошибка получения цены', error);
    return null;
  }
};

// Получить цены нескольких символов одной загрузкой
export const getMultipleCryptoPrices = async (
  symbols: string[]
): Promise<Record<string, CryptoPrice>> => {
  try {
    const all = await fetchAllCryptoPrices();
    const result: Record<string, CryptoPrice> = {};
    symbols.forEach((s) => {
      const upper = s.toUpperCase();
      if (all[upper]) result[upper] = all[upper];
    });
    return result;
  } catch (error) {
    console.error(error);
    return {};
  }
};

// Форматирование цены
export const formatPrice = (price: number): string => {
  if (price >= 1000) {
    return `$${price.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }
  if (price >= 1) return `$${price.toFixed(2)}`;
  return `$${price.toFixed(6)}`;
};

// Форматирование изменения цены
export const formatPriceChange = (
  change: number,
  isPercent = false
): string => {
  const sign = change >= 0 ? '+' : '';
  return isPercent
    ? `${sign}${change.toFixed(2)}%`
    : `${sign}${change.toFixed(2)}`;
};

// Получить топ-криптовалют (отсортированы по текущей цене, можно менять логику по marketCap)
export const getTopCryptoPrices = async (): Promise<Array<{
  symbol: string;
  name: string;
  current_price: number;
  price_change_percentage_24h: number;
}>> => {
  const data = await fetchAllCryptoPrices();
  const list = Object.values(data).map((c) => ({
    symbol: c.symbol,
    name: c.name,
    current_price: c.price,
    price_change_percentage_24h: c.changePercent24h,
  }));

  // Сортируем по текущей цене (убывание)
  return list.sort((a, b) => b.current_price - a.current_price);
};

export const cryptoAPI = {
  fetchAllCryptoPrices,
  getCryptoPrice,
  getMultipleCryptoPrices,
  formatPrice,
  formatPriceChange,
  getTopCryptoPrices,
}; 