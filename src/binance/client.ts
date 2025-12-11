const FUTURES_BASE_URL = 'https://fapi.binance.com'
const FUTURES_TESTNET_BASE_URL = 'https://testnet.binancefuture.com'

const textEncoder = new TextEncoder()

export type HttpMethod = 'GET' | 'POST' | 'DELETE'

export interface BinanceClientOptions {
  apiKey: string
  apiSecret: string
  baseUrl?: string
  recvWindow?: number
  testnet?: boolean
}

interface RequestOptions {
  method: HttpMethod
  path: string
  params?: Record<string, string | number | boolean | undefined>
  signed?: boolean
}

export class FuturesBinanceClient {
  private readonly apiKey: string
  private readonly apiSecret: string
  private readonly baseUrl: string
  private readonly recvWindow: number
  private signingKeyPromise?: Promise<CryptoKey>

  constructor(options: BinanceClientOptions) {
    this.apiKey = options.apiKey
    this.apiSecret = options.apiSecret
    this.recvWindow = options.recvWindow ?? 5000

    if (options.baseUrl) {
      this.baseUrl = options.baseUrl.endsWith('/') ? options.baseUrl.slice(0, -1) : options.baseUrl
    } else {
      this.baseUrl = options.testnet ? FUTURES_TESTNET_BASE_URL : FUTURES_BASE_URL
    }
  }

  async getServerTime(): Promise<{ serverTime: number }> {
    return this.request<{ serverTime: number }>({ method: 'GET', path: '/fapi/v1/time' })
  }

  async getExchangeInfo(): Promise<unknown> {
    return this.request({ method: 'GET', path: '/fapi/v1/exchangeInfo' })
  }

  async getAccountInfo(): Promise<FuturesAccountInformation> {
    return this.request({ method: 'GET', path: '/fapi/v2/account', signed: true })
  }

  async getBalances(): Promise<FuturesBalance[]> {
    return this.request({ method: 'GET', path: '/fapi/v2/balance', signed: true })
  }

  async getPositionRisk(): Promise<FuturesPositionRisk[]> {
    return this.request({ method: 'GET', path: '/fapi/v1/positionRisk', signed: true })
  }

  async getUserTrades(params: { symbol: string; limit?: number; startTime?: number; endTime?: number }): Promise<FuturesUserTrade[]> {
    return this.request({ method: 'GET', path: '/fapi/v1/userTrades', params, signed: true })
  }

  async getIncomeHistory(params: { incomeType?: string; startTime?: number; endTime?: number; limit?: number }): Promise<FuturesIncome[]> {
    return this.request({ method: 'GET', path: '/fapi/v1/income', params, signed: true })
  }

  async getTicker24h(symbol: string): Promise<FuturesTicker24h> {
    return this.request({ method: 'GET', path: '/fapi/v1/ticker/24hr', params: { symbol } })
  }

  async getKlines(params: { symbol: string; interval: string; limit?: number }): Promise<Kline[]> {
    return this.request({ method: 'GET', path: '/fapi/v1/klines', params })
  }

  async postOrder(params: FuturesOrderPayload): Promise<FuturesOrderResponse> {
    return this.request({ method: 'POST', path: '/fapi/v1/order', params, signed: true })
  }

  async deleteOrder(params: { symbol: string; orderId?: number; origClientOrderId?: string; recvWindow?: number }): Promise<Record<string, unknown>> {
    return this.request({ method: 'DELETE', path: '/fapi/v1/order', params, signed: true })
  }

  private async request<T = any>({ method, path, params = {}, signed = false }: RequestOptions): Promise<T> {
    const url = new URL(path, this.baseUrl)
    const searchParams = new URLSearchParams()

    for (const [key, value] of Object.entries(params)) {
      if (value === undefined || value === null) continue
      searchParams.append(key, String(value))
    }

    if (signed) {
      const timestamp = Date.now()
      searchParams.set('timestamp', timestamp.toString())
      if (!searchParams.has('recvWindow')) {
        searchParams.set('recvWindow', this.recvWindow.toString())
      }
      const signature = await this.sign(searchParams.toString())
      searchParams.set('signature', signature)
    }

    let body: BodyInit | undefined
    const headers: Record<string, string> = {}

    if (method === 'GET') {
      url.search = searchParams.toString()
    } else {
      body = searchParams.toString()
      headers['Content-Type'] = 'application/x-www-form-urlencoded'
    }

    if (signed || method !== 'GET') {
      headers['X-MBX-APIKEY'] = this.apiKey
    }

    const response = await fetch(url.toString(), {
      method,
      headers,
      body,
    })

    if (!response.ok) {
      const message = await response.text()
      throw new Error(`Binance API error (${response.status}): ${message || response.statusText}`)
    }

    const contentType = response.headers.get('content-type') || ''
    if (contentType.includes('application/json')) {
      return (await response.json()) as T
    }

    const text = await response.text()
    if (!text) {
      return {} as T
    }

    try {
      return JSON.parse(text) as T
    } catch (error) {
      throw new Error('Failed to parse Binance response as JSON')
    }
  }

  private async getSigningKey(): Promise<CryptoKey> {
    if (!this.signingKeyPromise) {
      this.signingKeyPromise = crypto.subtle.importKey(
        'raw',
        textEncoder.encode(this.apiSecret),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
      )
    }

    return this.signingKeyPromise
  }

  private async sign(payload: string): Promise<string> {
    const key = await this.getSigningKey()
    const signature = await crypto.subtle.sign('HMAC', key, textEncoder.encode(payload))
    return bufferToHex(signature)
  }
}

function bufferToHex(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  let hex = ''
  for (const byte of bytes) {
    hex += byte.toString(16).padStart(2, '0')
  }
  return hex
}

export interface FuturesBalance {
  accountAlias: string
  asset: string
  balance: string
  crossWalletBalance: string
  crossUnPnl: string
  availableBalance: string
  maxWithdrawAmount: string
  marginAvailable: boolean
  updateTime: number
}

export interface FuturesAccountPosition {
  symbol: string
  initialMargin: string
  maintMargin: string
  unrealizedProfit: string
  positionInitialMargin: string
  openOrderInitialMargin: string
  leverage: string
  entryPrice: string
  maxNotional: string
  positionSide: 'BOTH' | 'LONG' | 'SHORT'
  positionAmt: string
  updateTime: number
}

export interface FuturesAccountInformation {
  feeTier: number
  canTrade: boolean
  canDeposit: boolean
  canWithdraw: boolean
  updateTime: number
  totalInitialMargin: string
  totalMaintMargin: string
  totalWalletBalance: string
  totalUnrealizedProfit: string
  totalMarginBalance: string
  totalPositionInitialMargin: string
  totalOpenOrderInitialMargin: string
  totalCrossWalletBalance: string
  totalCrossUnPnl: string
  availableBalance: string
  maxWithdrawAmount: string
  assets: Array<{
    asset: string
    walletBalance: string
    unrealizedProfit: string
    marginBalance: string
    maintMargin: string
    initialMargin: string
    positionInitialMargin: string
    openOrderInitialMargin: string
    crossWalletBalance: string
    crossUnPnl: string
    availableBalance: string
    maxWithdrawAmount: string
    marginAvailable: boolean
    updateTime: number
  }>
  positions: FuturesAccountPosition[]
  totalTransfered: string
  totalGrossPositionValue: string
  totalOpenOrderAmt: string
  totalUnrealizedProfitLoss: string
  totalMarginOpenOrder: string
  totalMarginPosition: string
  totalNotionalValue: string
  totalMarginBalanceInUSDT: string
  totalMarginBalanceInBTC: string
  totalCrossPositionValue: string
  totalIsolatedWalletBalance: string
  totalIsolatedUnPnl: string
  totalCrossMarginBalance: string
  totalCrossMarginBalanceInUSDT: string
  totalCrossMarginBalanceInBTC: string
  totalIsolatedMarginBalance: string
  totalIsolatedMarginBalanceInUSDT: string
  totalIsolatedMarginBalanceInBTC: string
  totalPositionMargin: string
  totalPositionMarginInUSDT: string
  totalPositionMarginInBTC: string
  totalCrossMaintMargin: string
  totalIsolatedMaintMargin: string
  totalMaintMarginInUSDT: string
  totalMaintMarginInBTC: string
  totalPositionInitialMarginInUSDT: string
  totalPositionInitialMarginInBTC: string
  totalOpenOrderInitialMarginInUSDT: string
  totalOpenOrderInitialMarginInBTC: string
  totalInitialMarginInUSDT: string
  totalInitialMarginInBTC: string
  totalIsolatedWalletBalanceInUSDT: string
  totalIsolatedWalletBalanceInBTC: string
  totalCrossWalletBalanceInUSDT: string
  totalCrossWalletBalanceInBTC: string
  totalPositionAmt: string
  totalDualSidePosition: boolean
  dualSidePosition: boolean
}

export interface FuturesPositionRisk {
  entryPrice: string
  leverage: string
  maxNotionalValue: string
  liquidationPrice: string
  markPrice: string
  positionAmt: string
  symbol: string
  unRealizedProfit: string
  positionSide: 'BOTH' | 'LONG' | 'SHORT'
  updateTime: number
}

export interface FuturesTicker24h {
  symbol: string
  priceChange: string
  priceChangePercent: string
  weightedAvgPrice: string
  lastPrice: string
  lastQty: string
  openPrice: string
  highPrice: string
  lowPrice: string
  volume: string
  quoteVolume: string
  openTime: number
  closeTime: number
  firstId: number
  lastId: number
  count: number
}

export type Kline = [
  number,
  string,
  string,
  string,
  string,
  string,
  number,
  string,
  number,
  string,
  string,
  string
]

export interface FuturesUserTrade {
  buyer: boolean
  commission: string
  commissionAsset: string
  id: number
  maker: boolean
  orderId: number
  price: string
  qty: string
  quoteQty: string
  realizedPnl: string
  side: 'BUY' | 'SELL'
  positionSide: 'BOTH' | 'LONG' | 'SHORT'
  symbol: string
  time: number
}

export interface FuturesIncome {
  symbol: string
  incomeType: string
  income: string
  asset: string
  info: string
  time: number
  tranId: number
  tradeId: string
}

export type OrderSide = 'BUY' | 'SELL'
export type OrderType = 'MARKET' | 'LIMIT' | 'STOP_MARKET' | 'TAKE_PROFIT_MARKET' | 'STOP' | 'TAKE_PROFIT'
export type TimeInForce = 'GTC' | 'IOC' | 'FOK' | 'GTX'

export interface FuturesOrderPayload {
  symbol: string
  side: OrderSide
  type: OrderType
  quantity?: string | number
  positionSide?: 'BOTH' | 'LONG' | 'SHORT'
  price?: string | number
  timeInForce?: TimeInForce
  reduceOnly?: boolean
  closePosition?: boolean
  activationPrice?: string | number
  callbackRate?: string | number
  stopPrice?: string | number
  workingType?: 'MARK_PRICE' | 'CONTRACT_PRICE'
}

export interface FuturesOrderResponse {
  clientOrderId: string
  cumQty: string
  cumQuote: string
  executedQty: string
  orderId: number
  avgPrice: string
  origQty: string
  price: string
  reduceOnly: boolean
  side: OrderSide
  positionSide: 'BOTH' | 'LONG' | 'SHORT'
  status: string
  stopPrice: string
  closePosition: boolean
  symbol: string
  timeInForce: TimeInForce
  type: OrderType
  origType: OrderType
  activatePrice: string
  priceRate: string
  updateTime: number
  workingType: 'MARK_PRICE' | 'CONTRACT_PRICE'
  priceProtect: boolean
}
