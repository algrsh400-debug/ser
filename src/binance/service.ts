import type { Context } from 'hono'
import type { Trade, ActivityLog, BotSettings } from '@shared/schema'
import {
  FuturesBinanceClient,
  type FuturesAccountInformation,
  type FuturesPositionRisk,
  type FuturesOrderResponse,
  type FuturesUserTrade,
  type FuturesIncome,
  type FuturesTicker24h,
} from './client'
import {
  getSettings as getMockSettings,
  recordLog,
  type AccountState,
  type AccountPosition,
  type MarketSnapshot,
} from '../state'

export type AppBindings = {
  BINANCE_API_KEY?: string
  BINANCE_API_SECRET?: string
  BINANCE_FUTURES_BASE_URL?: string
  BINANCE_TESTNET?: string
  BINANCE_RECV_WINDOW?: string
}

const QUOTE_ASSETS = [
  'USDT',
  'USDC',
  'BUSD',
  'TUSD',
  'FDUSD',
  'BTC',
  'ETH',
  'BNB',
  'TRY',
  'EUR',
  'AUD',
  'GBP',
  'DAI',
  'BRL',
  'IDR',
]

const DAY_IN_MS = 24 * 60 * 60 * 1000
const DEFAULT_HISTORY_LIMIT = 25
const MAX_SYMBOLS_PER_HISTORY_REQUEST = 8

export interface ResolvedCredentials {
  apiKey: string
  apiSecret: string
  baseUrl?: string
  testnet: boolean
  recvWindow?: number
}

export interface BinanceServiceContext {
  settings: BotSettings
  credentials: ResolvedCredentials
}

export type ClosePositionResult = {
  success: boolean
  symbol: string
  positionSide: 'LONG' | 'SHORT' | 'BOTH'
  order?: FuturesOrderResponse
  error?: string
}

export class BinanceFuturesService {
  private accountPromise?: Promise<FuturesAccountInformation>
  private positionPromise?: Promise<FuturesPositionRisk[]>

  constructor(
    private readonly client: FuturesBinanceClient,
    private readonly settings: BotSettings
  ) {}

  async testConnection(): Promise<{ success: boolean; latencyMs: number; error?: string }> {
    const started = performance.now()
    try {
      await this.client.getAccountInfo()
      const latencyMs = Math.round(performance.now() - started)
      return { success: true, latencyMs }
    } catch (error) {
      const latencyMs = Math.round(performance.now() - started)
      return { success: false, latencyMs, error: error instanceof Error ? error.message : 'UNKNOWN_ERROR' }
    }
  }

  async getAccountState(): Promise<AccountState & { positions: (AccountPosition & { unrealizedPnl: number })[] }> {
    const [account, positions] = await Promise.all([this.getAccountInfo(), this.getPositions()])
    const mapped = positions
      .map((position) => this.transformPosition(position))
      .filter((position): position is AccountPosition & { unrealizedPnl: number } => position !== null)

    const totalBalance = toNumber(account.totalWalletBalance, 2)
    const availableBalance = toNumber(account.availableBalance, 2)

    return {
      connected: true,
      totalBalance,
      availableBalance,
      message: `مرتبط بـ Binance Futures${this.settings.isTestnet ? ' (Testnet)' : ''}`,
      positions: mapped,
    }
  }

  async getActiveTrades(): Promise<Trade[]> {
    const positions = await this.getPositions()
    const stats = await this.getAccountInfo()
    const dualSide = Boolean(stats.dualSidePosition)

    return positions
      .map((position) => this.transformPositionToTrade(position, dualSide))
      .filter((trade): trade is Trade => trade !== null)
  }

  async getTradesHistory(limit = DEFAULT_HISTORY_LIMIT): Promise<Trade[]> {
    const symbols = await this.determineSymbolsForHistory()
    if (symbols.length === 0) {
      return []
    }

    const perSymbolLimit = Math.max(5, Math.ceil(limit / symbols.length))
    const tradesArrays = await Promise.all(
      symbols.map((symbol) => this.client.getUserTrades({ symbol, limit: perSymbolLimit }))
    )

    const trades = tradesArrays.flat()
    const leverageBySymbol = await this.buildLeverageMap()

    return trades
      .map((trade) => this.transformUserTrade(trade, leverageBySymbol.get(trade.symbol) ?? 1))
      .sort((a, b) => new Date(b.exitTime ?? b.entryTime ?? '').getTime() - new Date(a.exitTime ?? a.entryTime ?? '').getTime())
      .slice(0, limit)
  }

  async getSummaryStats() {
    const [accountState, income] = await Promise.all([this.getAccountInfo(), this.getIncome24h()])
    const todayProfit = roundNumber(income.reduce((sum, item) => sum + toNumber(item.income), 0), 2)
    const totalBalance = roundNumber(toNumber(accountState.totalWalletBalance), 2)
    const activeTrades = (await this.getActiveTrades()).length

    const history = await this.getTradesHistory(DEFAULT_HISTORY_LIMIT)
    const closedTrades = history.filter((trade) => trade.status === 'closed')
    const wins = closedTrades.filter((trade) => (trade.profit ?? 0) > 0)
    const successRate = closedTrades.length === 0 ? 0 : (wins.length / closedTrades.length) * 100

    return {
      totalBalance,
      todayProfit,
      todayProfitPercent: totalBalance === 0 ? 0 : roundNumber((todayProfit / totalBalance) * 100, 2),
      activeTrades,
      successRate: roundNumber(successRate, 2),
    }
  }

  async getDetailedStats() {
    const summary = await this.getSummaryStats()
    const history = await this.getTradesHistory(DEFAULT_HISTORY_LIMIT * 2)
    const closedTrades = history.filter((trade) => trade.status === 'closed')

    const totalTrades = closedTrades.length + summary.activeTrades
    const wins = closedTrades.filter((trade) => (trade.profit ?? 0) > 0)
    const losses = closedTrades.filter((trade) => (trade.profit ?? 0) < 0)

    const avgProfit = wins.length === 0 ? 0 : wins.reduce((sum, trade) => sum + (trade.profit ?? 0), 0) / wins.length
    const avgLoss = losses.length === 0 ? 0 : Math.abs(losses.reduce((sum, trade) => sum + (trade.profit ?? 0), 0) / losses.length)
    const bestTrade = closedTrades.reduce((max, trade) => Math.max(max, trade.profit ?? -Infinity), 0)
    const worstTrade = closedTrades.reduce((min, trade) => Math.min(min, trade.profit ?? Infinity), 0)
    const totalVolume = closedTrades.reduce((sum, trade) => sum + trade.entryPrice * trade.quantity, 0)

    return {
      ...summary,
      totalTrades,
      winRate: closedTrades.length === 0 ? 0 : roundNumber((wins.length / closedTrades.length) * 100, 2),
      avgProfit: roundNumber(avgProfit, 2),
      avgLoss: roundNumber(avgLoss, 2),
      bestTrade: roundNumber(bestTrade, 2),
      worstTrade: roundNumber(worstTrade, 2),
      totalVolume: Math.round(totalVolume),
    }
  }

  async getMarketSnapshot(symbol: string): Promise<MarketSnapshot> {
    const ticker = await this.client.getTicker24h(symbol)
    return mapTickerToSnapshot(ticker)
  }

  async closePositionByTradeId(tradeId: string): Promise<ClosePositionResult> {
    const positions = await this.getPositions()
    const target = positions.find((position) => this.matchesTradeId(position, tradeId))

    if (!target) {
      return { success: false, symbol: 'UNKNOWN', positionSide: 'BOTH', error: 'POSITION_NOT_FOUND' }
    }

    return this.closePosition(target)
  }

  async closeAllPositions(): Promise<ClosePositionResult[]> {
    const positions = await this.getPositions()
    const results: ClosePositionResult[] = []

    for (const position of positions) {
      const absQty = Math.abs(parseFloat(position.positionAmt))
      if (absQty === 0) continue
      const result = await this.closePosition(position)
      results.push(result)
    }

    return results
  }

  private async closePosition(position: FuturesPositionRisk): Promise<ClosePositionResult> {
    const quantity = Math.abs(parseFloat(position.positionAmt))
    if (quantity === 0) {
      return {
        success: true,
        symbol: position.symbol,
        positionSide: position.positionSide,
        error: 'NO_QUANTITY',
      }
    }

    const orderSide = parseFloat(position.positionAmt) > 0 ? 'SELL' : 'BUY'
    const quantityString = normalizeQuantity(quantity)
    const reduceOnly = true
    const payload = {
      symbol: position.symbol,
      side: orderSide,
      type: 'MARKET' as const,
      quantity: quantityString,
      reduceOnly,
      positionSide: position.positionSide,
    }

    try {
      const response = await this.client.postOrder(payload)
      recordLog('success', `تم إغلاق المركز ${formatDisplaySymbol(position.symbol)}`, `رقم الأمر ${response.orderId}`)
      return { success: true, symbol: position.symbol, positionSide: position.positionSide, order: response }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'UNKNOWN_ERROR'
      recordLog('error', `فشل إغلاق المركز ${formatDisplaySymbol(position.symbol)}`, message)
      return { success: false, symbol: position.symbol, positionSide: position.positionSide, error: message }
    }
  }

  private async getAccountInfo(): Promise<FuturesAccountInformation> {
    if (!this.accountPromise) {
      this.accountPromise = this.client.getAccountInfo()
    }
    return this.accountPromise
  }

  private async getPositions(): Promise<FuturesPositionRisk[]> {
    if (!this.positionPromise) {
      this.positionPromise = this.client.getPositionRisk()
    }
    return this.positionPromise
  }

  private matchesTradeId(position: FuturesPositionRisk, tradeId: string): boolean {
    const parts = tradeId.split(':')
    if (parts.length === 2) {
      const [symbol, side] = parts
      return symbol === position.symbol && side.toUpperCase() === position.positionSide
    }

    // fallback to legacy id (symbol only)
    return position.symbol === tradeId || `${position.symbol}-${position.positionSide}` === tradeId
  }

  private transformPosition(position: FuturesPositionRisk): (AccountPosition & { unrealizedPnl: number }) | null {
    const quantity = Math.abs(parseFloat(position.positionAmt))
    if (quantity === 0) {
      return null
    }

    const side: 'LONG' | 'SHORT' = parseFloat(position.positionAmt) > 0 ? 'LONG' : 'SHORT'
    const entryPrice = toNumber(position.entryPrice)
    const markPrice = toNumber(position.markPrice)
    const leverage = parseInt(position.leverage, 10) || 1
    const direction = side === 'LONG' ? 1 : -1
    const unrealized = roundNumber((markPrice - entryPrice) * quantity * direction, 2)

    return {
      symbol: position.symbol,
      side,
      entryPrice,
      quantity,
      leverage,
      unrealizedPnl: unrealized,
    }
  }

  private transformPositionToTrade(position: FuturesPositionRisk, dualSide: boolean): Trade | null {
    const quantity = Math.abs(parseFloat(position.positionAmt))
    if (quantity === 0) {
      return null
    }

    const side = parseFloat(position.positionAmt) > 0 ? 'long' : 'short'
    const entryPrice = toNumber(position.entryPrice)
    const markPrice = toNumber(position.markPrice)
    const leverage = parseInt(position.leverage, 10) || 1
    const unrealized = toNumber(position.unRealizedProfit)
    const profitPercent = entryPrice === 0 ? 0 : (unrealized / (entryPrice * quantity)) * 100
    const symbolDisplay = formatDisplaySymbol(position.symbol)
    const idSide = dualSide ? position.positionSide : side.toUpperCase()

    return {
      id: `${position.symbol}:${idSide}`,
      userId: 'binance-futures',
      symbol: symbolDisplay,
      type: side,
      status: 'active',
      entryPrice,
      exitPrice: null,
      quantity,
      leverage,
      stopLoss: side === 'long' ? roundNumber(entryPrice * 0.98, 2) : roundNumber(entryPrice * 1.02, 2),
      takeProfit: side === 'long' ? roundNumber(entryPrice * 1.02, 2) : roundNumber(entryPrice * 0.98, 2),
      profit: roundNumber(unrealized, 2),
      profitPercent: roundNumber(profitPercent, 2),
      entryTime: new Date(position.updateTime).toISOString(),
      exitTime: null,
      entrySignals: [],
      binanceOrderId: '',
      trailingStopActive: false,
      trailingStopPrice: null,
      highestPrice: null,
      lowestPrice: null,
      isAutoTrade: this.settings.autoTradingEnabled ?? false,
    }
  }

  private transformUserTrade(trade: FuturesUserTrade, leverage: number): Trade {
    const symbolDisplay = formatDisplaySymbol(trade.symbol)
    const side = trade.side === 'BUY' ? 'long' : 'short'
    const price = toNumber(trade.price)
    const quantity = Math.abs(toNumber(trade.qty))
    const realizedPnl = toNumber(trade.realizedPnl)
    const notional = price * quantity
    const profitPercent = notional === 0 ? 0 : (realizedPnl / notional) * 100
    const timestamp = new Date(trade.time).toISOString()

    return {
      id: `hist-${trade.symbol}-${trade.id}`,
      userId: 'binance-futures',
      symbol: symbolDisplay,
      type: side,
      status: 'closed',
      entryPrice: price,
      exitPrice: price,
      quantity,
      leverage,
      stopLoss: price,
      takeProfit: price,
      profit: roundNumber(realizedPnl, 2),
      profitPercent: roundNumber(profitPercent, 2),
      entryTime: timestamp,
      exitTime: timestamp,
      entrySignals: [],
      binanceOrderId: String(trade.orderId),
      trailingStopActive: false,
      trailingStopPrice: null,
      highestPrice: null,
      lowestPrice: null,
      isAutoTrade: this.settings.autoTradingEnabled ?? false,
    }
  }

  private async determineSymbolsForHistory(): Promise<string[]> {
    const preferred = this.settings.tradingPairs?.map((pair) => pairToSymbol(pair)).filter(Boolean) ?? []
    const positions = await this.getPositions()
    const fromPositions = positions
      .map((position) => position.symbol)
      .filter((symbol, index, array) => array.indexOf(symbol) === index)

    const unique = Array.from(new Set([...preferred, ...fromPositions]))
    return unique.slice(0, MAX_SYMBOLS_PER_HISTORY_REQUEST)
  }

  private async buildLeverageMap(): Promise<Map<string, number>> {
    const account = await this.getAccountInfo()
    const map = new Map<string, number>()
    account.positions.forEach((position) => {
      const leverage = parseInt(position.leverage, 10) || 1
      map.set(position.symbol, leverage)
    })
    return map
  }

  private async getIncome24h(): Promise<FuturesIncome[]> {
    const startTime = Date.now() - DAY_IN_MS
    return this.client.getIncomeHistory({ incomeType: 'REALIZED_PNL', startTime, limit: 1000 })
  }
}

export function resolveCredentials(env: AppBindings, settings: BotSettings): ResolvedCredentials | null {
  const apiKey = (settings.binanceApiKey ?? env.BINANCE_API_KEY)?.trim()
  const apiSecret = (settings.binanceApiSecret ?? env.BINANCE_API_SECRET)?.trim()

  if (!apiKey || !apiSecret) {
    return null
  }

  const testnetFlag = settings.isTestnet ?? env.BINANCE_TESTNET === 'true'
  const baseUrl = (settings.customApiUrl ?? env.BINANCE_FUTURES_BASE_URL)?.trim()
  const recvWindow = env.BINANCE_RECV_WINDOW ? Number(env.BINANCE_RECV_WINDOW) : undefined

  return {
    apiKey,
    apiSecret,
    baseUrl: baseUrl || undefined,
    testnet: Boolean(testnetFlag),
    recvWindow,
  }
}

export function createBinanceService(env: AppBindings): BinanceFuturesService | null {
  const settings = getMockSettings()
  const credentials = resolveCredentials(env, settings)

  if (!credentials) {
    return null
  }

  const client = new FuturesBinanceClient({
    apiKey: credentials.apiKey,
    apiSecret: credentials.apiSecret,
    baseUrl: credentials.baseUrl,
    testnet: credentials.testnet,
    recvWindow: credentials.recvWindow,
  })

  return new BinanceFuturesService(client, settings)
}

export function getSettingsWithCredentials(env: AppBindings): BotSettings & {
  credentialsPresent: boolean
  usingEnvironmentSecrets: boolean
} {
  const settings = getMockSettings()
  const envProvidedKey = Boolean(env.BINANCE_API_KEY && env.BINANCE_API_SECRET)
  const hasInlineCredentials = Boolean(settings.binanceApiKey && settings.binanceApiSecret)
  const credentialsPresent = envProvidedKey || hasInlineCredentials

  return {
    ...settings,
    credentialsPresent,
    usingEnvironmentSecrets: envProvidedKey && !hasInlineCredentials,
    binanceApiKey: settings.binanceApiKey ? maskKey(settings.binanceApiKey) : settings.binanceApiKey,
    binanceApiSecret: settings.binanceApiSecret ? maskKey(settings.binanceApiSecret) : settings.binanceApiSecret,
  }
}

export function maskKey(value: string | null | undefined): string | null | undefined {
  if (!value) return value
  if (value.length <= 6) return '*'.repeat(value.length)
  return `${value.slice(0, 3)}${'*'.repeat(value.length - 6)}${value.slice(-3)}`
}

export function formatDisplaySymbol(symbol: string): string {
  for (const quote of QUOTE_ASSETS) {
    if (symbol.endsWith(quote)) {
      const base = symbol.slice(0, symbol.length - quote.length)
      return `${base}/${quote}`
    }
  }
  return symbol
}

export function pairToSymbol(pair: string): string {
  if (!pair) return ''
  return pair.replace('/', '').toUpperCase()
}

function toNumber(value: string | number | undefined, precision = 4): number {
  if (value === undefined || value === null) return 0
  const parsed = typeof value === 'string' ? Number(value) : value
  if (!Number.isFinite(parsed)) return 0
  return precision === undefined ? parsed : Number(parsed.toFixed(precision))
}

function normalizeQuantity(quantity: number): string {
  if (quantity <= 0) return '0'
  const asString = quantity.toFixed(8)
  return asString.replace(/\.0+$/, '').replace(/0+$/, '').replace(/\.$/, '')
}

function roundNumber(value: number, precision = 2): number {
  const factor = Math.pow(10, precision)
  return Math.round(value * factor) / factor
}

function mapTickerToSnapshot(ticker: FuturesTicker24h): MarketSnapshot {
  return {
    symbol: formatDisplaySymbol(ticker.symbol),
    price: roundNumber(toNumber(ticker.lastPrice)),
    priceChange24h: roundNumber(toNumber(ticker.priceChange)),
    priceChangePercent24h: roundNumber(toNumber(ticker.priceChangePercent)),
    high24h: roundNumber(toNumber(ticker.highPrice)),
    low24h: roundNumber(toNumber(ticker.lowPrice)),
    volume24h: roundNumber(toNumber(ticker.quoteVolume), 0),
    timestamp: new Date().toISOString(),
  }
}
