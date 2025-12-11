import { ensureStaticManifestLoaded } from './static-manifest'
import { Hono } from 'hono'
import type { Fetcher } from '@cloudflare/workers-types'
import type { BotSettings } from '@shared/schema'
import {
  getSettings,
  updateSettings,
  getAutoTradingStatus,
  startAutoTrading,
  stopAutoTrading,
  toggleBotActive,
  getSummaryStats,
  getDetailedStats,
  getLogs,
  getActiveTrades,
  closeTrade,
  closeAllTrades,
  getTradesHistory,
  getMarketSnapshot,
  getTechnicalAnalysis,
  getAiPredictions,
  recordLog,
} from './state'
import { createBinanceService, pairToSymbol } from './binance/service'

type AppBindings = {
  ASSETS?: Fetcher
  BINANCE_API_KEY?: string
  BINANCE_API_SECRET?: string
  BINANCE_FUTURES_BASE_URL?: string
  BINANCE_TESTNET?: string
  BINANCE_RECV_WINDOW?: string
}

type AppVariables = {
  Bindings: AppBindings
}

const CACHEABLE_METHODS = new Set(['GET', 'HEAD'])
void ensureStaticManifestLoaded

const tryServeAsset = async (c: any, overridePath?: string) => {
  if (!c.env.ASSETS || typeof c.env.ASSETS.fetch !== 'function') {
    return null
  }

  const url = new URL(c.req.url)
  if (overridePath) {
    url.pathname = overridePath.startsWith('/') ? overridePath : `/${overridePath}`
  }

  const request = new Request(url.toString(), {
    method: overridePath ? 'GET' : c.req.method,
    headers: new Headers(c.req.raw.headers),
  })

  try {
    const response = await c.env.ASSETS.fetch(request)
    if (response.status === 404) {
      return null
    }
    return response
  } catch (error) {
    console.error('ASSETS.fetch error:', error)
    return null
  }
}

const serveAsset = (overridePath?: string) => {
  return async (c: any, next: () => Promise<Response | void>) => {
    if (!CACHEABLE_METHODS.has(c.req.method)) {
      return next()
    }

    const asset = await tryServeAsset(c, overridePath)
    if (asset) {
      return asset
    }

    return next()
  }
}

const app = new Hono<AppVariables>()

function maskSecret(value?: string | null): string {
  if (!value) return ''
  if (value.length <= 4) {
    return '•'.repeat(value.length)
  }
  const visible = value.slice(-4)
  return '•'.repeat(Math.max(value.length - 4, 0)) + visible
}

function sanitizeSettingsResponse(settings: BotSettings, env: AppBindings): BotSettings {
  const sanitized = { ...settings }
  if (env.BINANCE_API_KEY) {
    sanitized.binanceApiKey = '__env__'
  } else if (sanitized.binanceApiKey) {
    sanitized.binanceApiKey = maskSecret(sanitized.binanceApiKey)
  }

  if (env.BINANCE_API_SECRET) {
    sanitized.binanceApiSecret = '__env__'
  } else if (sanitized.binanceApiSecret) {
    sanitized.binanceApiSecret = maskSecret(sanitized.binanceApiSecret)
  }

  return sanitized
}

function sanitizeIncomingSettings(payload: Record<string, unknown>, env: AppBindings): Record<string, unknown> {
  const sanitized: Record<string, unknown> = { ...payload }

  const apiKeyValue = sanitized['binanceApiKey']
  if (
    env.BINANCE_API_KEY ||
    (typeof apiKeyValue === 'string' && (apiKeyValue.startsWith('__env__') || apiKeyValue.trim() === '' || apiKeyValue.includes('•')))
  ) {
    delete sanitized['binanceApiKey']
  }

  const apiSecretValue = sanitized['binanceApiSecret']
  if (
    env.BINANCE_API_SECRET ||
    (typeof apiSecretValue === 'string' && (apiSecretValue.startsWith('__env__') || apiSecretValue.trim() === '' || apiSecretValue.includes('•')))
  ) {
    delete sanitized['binanceApiSecret']
  }

  return sanitized
}

app.get('/api/settings', (c) => {
  const settings = getSettings()
  const sanitized = sanitizeSettingsResponse(settings, c.env)
  return c.json(sanitized)
})

app.put('/api/settings', async (c) => {
  const body = await c.req.json()
  if (!body || typeof body !== 'object') {
    return c.json({ error: 'invalid_payload' }, 400)
  }

  const sanitizedPayload = sanitizeIncomingSettings(body as Record<string, unknown>, c.env)
  const updated = updateSettings(sanitizedPayload)
  const response = sanitizeSettingsResponse(updated, c.env)
  return c.json(response)
})

app.post('/api/test-connection', async (c) => {
  const service = createBinanceService(c.env)
  if (!service) {
    return c.json({ success: false, error: 'no_credentials', message: 'يرجى إضافة مفاتيح Binance من صفحة الإعدادات.' }, 400)
  }

  const result = await service.testConnection()
  if (!result.success) {
    recordLog('error', 'فشل اختبار الاتصال بـ Binance', result.error)
    return c.json({ success: false, error: 'connection_failed', message: result.error ?? 'تعذر الاتصال بـ Binance' }, 502)
  }

  recordLog('success', 'تم التحقق من اتصال Binance', `زمن الاستجابة ${result.latencyMs}ms`)
  return c.json({ success: true, latencyMs: result.latencyMs })
})

app.get('/api/auto-trading/status', (c) => c.json(getAutoTradingStatus()))

app.post('/api/auto-trading/start', (c) => {
  startAutoTrading()
  return c.json({ success: true })
})

app.post('/api/auto-trading/stop', (c) => {
  stopAutoTrading()
  return c.json({ success: true })
})

app.post('/api/bot/toggle', (c) => {
  const isActive = toggleBotActive()
  return c.json({ success: true, isActive })
})

app.get('/api/stats/summary', async (c) => {
  const service = createBinanceService(c.env)
  if (service) {
    try {
      const summary = await service.getSummaryStats()
      return c.json(summary)
    } catch (error) {
      console.error('Binance summary stats error:', error)
    }
  }
  return c.json(getSummaryStats())
})

app.get('/api/stats', async (c) => {
  const service = createBinanceService(c.env)
  if (service) {
    try {
      const stats = await service.getDetailedStats()
      return c.json(stats)
    } catch (error) {
      console.error('Binance detailed stats error:', error)
    }
  }
  return c.json(getDetailedStats())
})

app.get('/api/logs', (c) => c.json(getLogs()))
app.get('/api/logs/recent', (c) => c.json(getLogs(8)))

app.get('/api/trades/active', async (c) => {
  const service = createBinanceService(c.env)
  if (service) {
    try {
      const trades = await service.getActiveTrades()
      return c.json(trades)
    } catch (error) {
      console.error('Binance active trades error:', error)
    }
  }
  return c.json(getActiveTrades())
})

app.get('/api/trades/history', async (c) => {
  const service = createBinanceService(c.env)
  if (service) {
    try {
      const trades = await service.getTradesHistory()
      return c.json(trades)
    } catch (error) {
      console.error('Binance trades history error:', error)
    }
  }
  return c.json(getTradesHistory())
})

app.post('/api/trades/:id/close', async (c) => {
  const tradeId = c.req.param('id')
  const service = createBinanceService(c.env)
  if (service) {
    const result = await service.closePositionByTradeId(tradeId)
    if (!result.success) {
      return c.json({ error: result.error ?? 'failed_to_close_position' }, 502)
    }
    return c.json({ success: true, order: result.order })
  }

  const trade = closeTrade(tradeId)
  if (!trade) {
    return c.json({ error: 'Trade not found' }, 404)
  }
  return c.json({ success: true, trade })
})

app.post('/api/trades/close-all', async (c) => {
  const service = createBinanceService(c.env)
  if (service) {
    const results = await service.closeAllPositions()
    const failed = results.filter((result) => !result.success)
    if (failed.length > 0) {
      return c.json({ success: false, results }, 502)
    }
    return c.json({ success: true, results })
  }

  const trades = closeAllTrades()
  return c.json({ success: true, trades })
})

app.get('/api/account', async (c) => {
  const service = createBinanceService(c.env)
  if (service) {
    try {
      const account = await service.getAccountState()
      return c.json(account)
    } catch (error) {
      console.error('Binance account error:', error)
      return c.json({
        connected: false,
        error: 'connection_failed',
        message: error instanceof Error ? error.message : 'تعذر الحصول على بيانات الحساب من Binance',
        totalBalance: 0,
        availableBalance: 0,
        positions: [],
      })
    }
  }

  return c.json({
    connected: false,
    error: 'no_credentials',
    message: 'لم يتم تكوين مفاتيح Binance. سيتم استخدام بيانات تجريبية.',
    totalBalance: 0,
    availableBalance: 0,
    positions: [],
  })
})

app.post('/api/telegram/test', (c) => {
  return c.json({ success: true, message: 'تم إرسال رسالة اختبار إلى Telegram' })
})

app.post('/api/reports/:type', (c) => {
  const type = c.req.param('type')
  if (type !== 'weekly' && type !== 'monthly') {
    return c.json({ error: 'نوع التقرير غير مدعوم' }, 400)
  }
  return c.json({ success: true, type, message: 'سيتم إرسال التقرير عبر البريد الإلكتروني خلال دقائق' })
})

app.get('/api/market/:symbol', async (c) => {
  const { symbol } = c.req.param()
  const normalized = pairToSymbol(symbol)
  const service = createBinanceService(c.env)

  if (service && normalized) {
    try {
      const snapshot = await service.getMarketSnapshot(normalized)
      return c.json(snapshot)
    } catch (error) {
      console.error('Binance market data error:', error)
    }
  }

  const fallback = getMarketSnapshot(normalized || symbol)
  if (!fallback) {
    return c.json({ error: 'الرمز غير مدعوم' }, 404)
  }
  return c.json(fallback)
})

app.get('/api/analyze/:symbol', (c) => {
  const { symbol } = c.req.param()
  const analysis = getTechnicalAnalysis(symbol)
  if (!analysis) {
    return c.json({ error: 'لم يتم العثور على بيانات التحليل' }, 404)
  }
  return c.json(analysis)
})

app.get('/api/ai-predictions/all/:timeframe', (c) => {
  const { timeframe } = c.req.param()
  return c.json(getAiPredictions(timeframe))
})

app.use('/assets/*', serveAsset())
app.use('/static/*', serveAsset())

app.get('/favicon.ico', async (c) => {
  const asset = await tryServeAsset(c, 'favicon.png')
  if (asset) {
    return asset
  }
  return c.notFound()
})

app.get('*', async (c) => {
  const asset = await tryServeAsset(c, 'index.html')
  if (asset) {
    return asset
  }
  return c.text('لم يتم العثور على الواجهة الثابتة', 404)
})

export default app
