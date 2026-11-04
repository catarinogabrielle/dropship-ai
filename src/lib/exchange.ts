import axios from 'axios';

export interface ExchangeRateResult {
  rate: number;
  bid: number;
  ask: number;
  high: number;
  low: number;
  pctChange: number;
  source: string;
  timestamp: string;
}

/**
 * Busca a cotacao real USD -> BRL em tempo real via AwesomeAPI ou Open ER API
 * Proibido qualquer valor fixo ou mockado.
 */
export async function getRealUsdBrlRate(): Promise<ExchangeRateResult> {
  try {
    const res = await axios.get('https://economia.awesomeapi.com.br/json/last/USD-BRL', {
      timeout: 8000,
    });
    const data = res.data?.USDBRL;
    if (data && data.bid) {
      const rate = parseFloat(data.bid);
      return {
        rate,
        bid: parseFloat(data.bid),
        ask: parseFloat(data.ask || data.bid),
        high: parseFloat(data.high || data.bid),
        low: parseFloat(data.low || data.bid),
        pctChange: parseFloat(data.pctChange || '0'),
        source: 'economia.awesomeapi.com.br',
        timestamp: data.create_date || new Date().toISOString(),
      };
    }
  } catch {
    // Fallback para Open Exchange Rates API publica oficial
  }

  const fallbackRes = await axios.get('https://open.er-api.com/v6/latest/USD', {
    timeout: 8000,
  });
  const brlRate = Number(fallbackRes.data?.rates?.BRL);
  if (!brlRate || Number.isNaN(brlRate)) {
    throw new Error('Falha ao consultar APIs externas de cotacao USD/BRL em tempo real.');
  }

  return {
    rate: brlRate,
    bid: brlRate,
    ask: brlRate,
    high: brlRate,
    low: brlRate,
    pctChange: 0,
    source: 'open.er-api.com',
    timestamp: fallbackRes.data?.time_last_update_utc || new Date().toISOString(),
  };
}
