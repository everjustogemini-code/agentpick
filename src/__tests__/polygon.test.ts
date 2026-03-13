import { describe, it, expect } from 'vitest';
import { extractTicker } from '@/lib/benchmark/adapters/polygon';

describe('extractTicker — finance query mapping', () => {
  it('maps "Bitcoin price" to crypto ticker, not SPY', () => {
    const ticker = extractTicker('Bitcoin price');
    expect(ticker).toBe('X:BTCUSD');
    expect(ticker).not.toBe('SPY');
  });

  it('maps "BTC price today" to crypto ticker', () => {
    expect(extractTicker('BTC price today')).toBe('X:BTCUSD');
  });

  it('maps "Ethereum" to ETH ticker', () => {
    expect(extractTicker('ethereum price')).toBe('X:ETHUSD');
  });

  it('maps explicit uppercase tickers (2+ chars)', () => {
    expect(extractTicker('What is NVDA trading at')).toBe('NVDA');
    expect(extractTicker('AAPL earnings')).toBe('AAPL');
    expect(extractTicker('$TSLA stock')).toBe('TSLA');
  });

  it('maps company names to tickers', () => {
    expect(extractTicker('apple stock price')).toBe('AAPL');
    expect(extractTicker('nvidia earnings report')).toBe('NVDA');
    expect(extractTicker('tesla stock today')).toBe('TSLA');
    expect(extractTicker('google stock')).toBe('GOOGL');
    expect(extractTicker('amazon price')).toBe('AMZN');
    expect(extractTicker('microsoft shares')).toBe('MSFT');
  });

  it('defaults to SPY for unrecognized queries', () => {
    expect(extractTicker('general market outlook')).toBe('SPY');
  });

  it('does not match single uppercase letter as ticker', () => {
    // "Bitcoin" has a capital B but should not match as ticker "B"
    // because we now require 2+ uppercase chars
    const result = extractTicker('Bitcoin price today');
    expect(result).toBe('X:BTCUSD'); // Name lookup wins, not regex "B"
  });

  it('maps crypto variations', () => {
    expect(extractTicker('solana price')).toBe('X:SOLUSD');
    expect(extractTicker('dogecoin value')).toBe('X:DOGEUSD');
    expect(extractTicker('xrp trading')).toBe('X:XRPUSD');
  });

  it('maps indices', () => {
    expect(extractTicker('S&P 500 index')).toBe('SPY');
    expect(extractTicker('dow jones today')).toBe('DIA');
    expect(extractTicker('nasdaq composite')).toBe('QQQ');
  });
});
