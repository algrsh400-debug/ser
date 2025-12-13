import type { ActivityLog, BotSettings, Trade } from '@shared/schema'

export type TradeRecord = Omit<Trade, 'entryTime' | 'exitTime' | 'profit' | 'profitPercent'> & {
  entryTime: string
  exitTime: string | null
  profit: number | null
  profitPercent: number | null
  highestPrice?: number | null
  lowestPrice?: number | null
}

export type AutoTradingState = {
  enabled: boolean
  isRunning: boolean
}

export type AccountPosition = {
  symbol: string
  side: 'LONG' | 'SHORT'
  entryPrice: number
  quantity: number
  leverage: number
}

export type AccountState = {
  connected: boolean
  totalBalance: number
  availableBalance: number
  message?: string
  error?: string
  positions: AccountPosition[]
}

export type MarketSnapshot = {
  symbol: string
  price: number
  priceChange24h: number
  priceChangePercent24h: number
  high24h: number
  low24h: number
  volume24h: number
  timestamp: string
}

export type TechnicalAnalysis = {
  symbol: string
  currentPrice: number
  rsi: { value: number; signal: 'buy' | 'sell' | 'hold' }
  macd: { value: number; signal: 'buy' | 'sell' | 'hold'; histogram: number }
  ma: { signal: 'buy' | 'sell' | 'hold'; shortMA: number; longMA: number }
  overallSignal: 'buy' | 'sell' | 'hold'
  signalStrength: number
}

export type AISignal = {
  signal: 'buy' | 'sell' | 'hold'
  strength: number
  confidence: number
  description: string
}

export type PatternResult = {
  pattern: string
  signal: 'buy' | 'sell' | 'hold'
  strength: number
  description: string
}

export type AIPrediction = {
  overallSignal: 'buy' | 'sell' | 'hold'
  confidence: number
  signalStrength: number
  predictions: {
    patternRecognition: AISignal
    momentumAnalysis: AISignal
    volatilityAnalysis: AISignal
    trendStrength: AISignal
    priceAction: AISignal
  }
  detectedPatterns: PatternResult[]
  marketRegime: 'trending_up' | 'trending_down' | 'ranging' | 'volatile'
  riskLevel: 'low' | 'medium' | 'high'
  shortTermPrediction: 'bullish' | 'bearish' | 'neutral'
  mediumTermPrediction: 'bullish' | 'bearish' | 'neutral'
}

export type PredictionData = {
  symbol: string
  currentPrice: number
  prediction: AIPrediction
}

export type PredictionsByTimeframe = Record<string, PredictionData[]>

export type MarketBase = {
  price: number
  priceChange24h: number
  high24h: number
  low24h: number
  volume24h: number
}

const userId = 'user-demo'

const defaultSettings: BotSettings = {
  id: 'settings-demo',
  userId,
  binanceApiKey: 'demo-api-key',
  binanceApiSecret: 'demo-secret',
  customApiUrl: 'https://demo.bot-enhancer.api',
  isTestnet: true,
  isActive: true,
  hedgingMode: true,
  maxRiskPerTrade: 1.5,
  riskRewardRatio: 2.2,
  maShortPeriod: 21,
  maLongPeriod: 200,
  rsiPeriod: 14,
  rsiOverbought: 70,
  rsiOversold: 30,
  macdFast: 12,
  macdSlow: 26,
  macdSignal: 9,
  tradingPairs: ['BTC/USDT', 'ETH/USDT', 'BNB/USDT', 'SOL/USDT', 'XRP/USDT'],
  telegramBotToken: 'demo-telegram-token',
  telegramChatId: '123456789',
  emailNotifications: true,
  notificationEmail: 'alerts@bot-enhancer.ai',
  autoTradingEnabled: true,
  minSignalStrength: 70,
  maxDailyTrades: 12,
  tradeCooldownMinutes: 15,
  trailingStopEnabled: true,
  trailingStopPercent: 0.8,
  trailingStopActivationPercent: 1.2,
  multiTimeframeEnabled: true,
  timeframes: ['15m', '1h', '4h'],
  weeklyReportEnabled: true,
  monthlyReportEnabled: true,
  reportDay: 0,
  aiTradingEnabled: true,
  aiMinConfidence: 75,
  aiMinSignalStrength: 65,
  aiRequiredSignals: 3,
  advancedStrategiesEnabled: true,
  enabledStrategies: ['breakout', 'momentum', 'meanReversion', 'swing'],
  strategyMinConfidence: 62,
  strategyMinStrength: 54,
  requireStrategyConsensus: false,
  breakoutLookbackPeriod: 20,
  breakoutThreshold: 1.6,
  breakoutVolumeMultiplier: 1.5,
  scalpingProfitTarget: 0.45,
  scalpingStopLoss: 0.25,
  scalpingMaxHoldingPeriod: 12,
  momentumLookbackPeriod: 14,
  momentumThreshold: 1.8,
  meanReversionBollingerPeriod: 20,
  meanReversionBollingerStdDev: 2,
  meanReversionOversoldLevel: 25,
  meanReversionOverboughtLevel: 75,
  swingPeriod: 10,
  swingMinSize: 2.2,
  swingConfirmationCandles: 3,
  gridLevels: 6,
  gridSpacing: 0.9,
  gridOrderSize: 50,
  smartPositionSizingEnabled: true,
  atrPeriod: 14,
  atrMultiplier: 1.7,
  maxPositionPercent: 12,
  minPositionPercent: 1.2,
  volatilityAdjustment: true,
  marketFilterEnabled: true,
  avoidHighVolatility: true,
  maxVolatilityPercent: 4,
  trendFilterEnabled: true,
  minTrendStrength: 32,
  avoidRangingMarket: true,
  accountProtectionEnabled: true,
  maxDailyLossPercent: 3,
  maxConcurrentTrades: 4,
  pauseAfterConsecutiveLosses: 2,
  diversificationEnabled: true,
}

const now = Date.now()

const initialActiveTrades: TradeRecord[] = [
  {
    id: 'trade-btc-long-active',
    userId,
    symbol: 'BTC/USDT',
    type: 'long',
    status: 'active',
    entryPrice: 67250.45,
    exitPrice: null,
    quantity: 0.35,
    leverage: 5,
    stopLoss: 65800,
    takeProfit: 68950,
    profit: null,
    profitPercent: null,
    entryTime: new Date(now - 1000 * 60 * 60 * 6).toISOString(),
    exitTime: null,
    entrySignals: ['RSI', 'Breakout', 'Volume Surge'],
    binanceOrderId: 'BN-874523',
    trailingStopActive: true,
    trailingStopPrice: 66840,
    highestPrice: 6.4,
    lowestPrice: null,
    isAutoTrade: true,
  },
  {
    id: 'trade-eth-short-active',
    userId,
    symbol: 'ETH/USDT',
    type: 'short',
    status: 'active',
    entryPrice: 3185.6,
    exitPrice: null,
    quantity: 4.5,
    leverage: 4,
    stopLoss: 3260,
    takeProfit: 3050,
    profit: null,
    profitPercent: null,
    entryTime: new Date(now - 1000 * 60 * 60 * 4).toISOString(),
    exitTime: null,
    entrySignals: ['MACD Cross', 'RSI Divergence'],
    binanceOrderId: 'BN-874524',
    trailingStopActive: true,
    trailingStopPrice: 3120,
    highestPrice: 5.2,
    lowestPrice: -1.3,
    isAutoTrade: true,
  },
  {
    id: 'trade-sol-long-active',
    userId,
    symbol: 'SOL/USDT',
    type: 'long',
    status: 'active',
    entryPrice: 182.75,
    exitPrice: null,
    quantity: 120,
    leverage: 2,
    stopLoss: 172,
    takeProfit: 198,
    profit: null,
    profitPercent: null,
    entryTime: new Date(now - 1000 * 60 * 35).toISOString(),
    exitTime: null,
    entrySignals: ['Trend Following', 'Breakout'],
    binanceOrderId: 'BN-874525',
    trailingStopActive: false,
    trailingStopPrice: null,
    highestPrice: 3.9,
    lowestPrice: -0.8,
    isAutoTrade: false,
  },
]

const initialHistoryTrades: TradeRecord[] = [
  {
    id: 'trade-btc-long-1',
    userId,
    symbol: 'BTC/USDT',
    type: 'long',
    status: 'closed',
    entryPrice: 65200.12,
    exitPrice: 66840.55,
    quantity: 0.4,
    leverage: 4,
    stopLoss: 64000,
    takeProfit: 67000,
    profit: 655.7,
    profitPercent: 2.51,
    entryTime: new Date(now - 1000 * 60 * 60 * 48).toISOString(),
    exitTime: new Date(now - 1000 * 60 * 60 * 30).toISOString(),
    entrySignals: ['RSI', 'Momentum'],
    binanceOrderId: 'BN-873100',
    trailingStopActive: true,
    trailingStopPrice: 66450,
    highestPrice: 4.8,
    lowestPrice: -0.9,
    isAutoTrade: true,
  },
  {
    id: 'trade-eth-short-1',
    userId,
    symbol: 'ETH/USDT',
    type: 'short',
    status: 'closed',
    entryPrice: 3280.4,
    exitPrice: 3162.8,
    quantity: 3.2,
    leverage: 3,
    stopLoss: 3340,
    takeProfit: 3100,
    profit: 376.99,
    profitPercent: 3.59,
    entryTime: new Date(now - 1000 * 60 * 60 * 80).toISOString(),
    exitTime: new Date(now - 1000 * 60 * 60 * 50).toISOString(),
    entrySignals: ['MACD Cross', 'Order Flow'],
    binanceOrderId: 'BN-873101',
    trailingStopActive: false,
    trailingStopPrice: null,
    highestPrice: 3.2,
    lowestPrice: -1.1,
    isAutoTrade: true,
  },
  {
    id: 'trade-bnb-long-1',
    userId,
    symbol: 'BNB/USDT',
    type: 'long',
    status: 'closed',
    entryPrice: 512.25,
    exitPrice: 498.1,
    quantity: 25,
    leverage: 2,
    stopLoss: 490,
    takeProfit: 540,
    profit: -353.75,
    profitPercent: -2.76,
    entryTime: new Date(now - 1000 * 60 * 60 * 120).toISOString(),
    exitTime: new Date(now - 1000 * 60 * 60 * 96).toISOString(),
    entrySignals: ['Trend', 'Volume Spike'],
    binanceOrderId: 'BN-873102',
    trailingStopActive: false,
    trailingStopPrice: null,
    highestPrice: 2.5,
    lowestPrice: -3.4,
    isAutoTrade: false,
  },
  {
    id: 'trade-sol-long-1',
    userId,
    symbol: 'SOL/USDT',
    type: 'long',
    status: 'closed',
    entryPrice: 165.4,
    exitPrice: 179.2,
    quantity: 80,
    leverage: 2,
    stopLoss: 158,
    takeProfit: 182,
    profit: 1101.6,
    profitPercent: 8.33,
    entryTime: new Date(now - 1000 * 60 * 60 * 96).toISOString(),
    exitTime: new Date(now - 1000 * 60 * 60 * 80).toISOString(),
    entrySignals: ['Breakout', 'RSI'],
    binanceOrderId: 'BN-873103',
    trailingStopActive: true,
    trailingStopPrice: 172,
    highestPrice: 7.5,
    lowestPrice: -0.5,
    isAutoTrade: false,
  },
  {
    id: 'trade-xrp-short-1',
    userId,
    symbol: 'XRP/USDT',
    type: 'short',
    status: 'closed',
    entryPrice: 0.62,
    exitPrice: 0.59,
    quantity: 1200,
    leverage: 3,
    stopLoss: 0.64,
    takeProfit: 0.58,
    profit: 108,
    profitPercent: 4.35,
    entryTime: new Date(now - 1000 * 60 * 60 * 60).toISOString(),
    exitTime: new Date(now - 1000 * 60 * 60 * 32).toISOString(),
    entrySignals: ['Order Block', 'Volume Divergence'],
    binanceOrderId: 'BN-873104',
    trailingStopActive: false,
    trailingStopPrice: null,
    highestPrice: 4.9,
    lowestPrice: -1.9,
    isAutoTrade: true,
  },
]

const initialLogs: ActivityLog[] = [
  {
    id: 'log-setup',
    userId,
    level: 'info',
    message: 'تم تهيئة روبوت التداول بنجاح',
    details: 'تم تحميل الإعدادات الافتراضية للمنصة',
    timestamp: new Date(now - 1000 * 60 * 60 * 24).toISOString(),
  },
  {
    id: 'log-connection',
    userId,
    level: 'success',
    message: 'تم الاتصال بـ Binance (Testnet)',
    details: 'تم التحقق من مفاتيح API وإعدادات الشبكة التجريبية',
    timestamp: new Date(now - 1000 * 60 * 60 * 18).toISOString(),
  },
  {
    id: 'log-trade-open',
    userId,
    level: 'info',
    message: 'تم فتح صفقة شراء على BTC/USDT',
    details: 'نسبة المخاطرة 1.5%، تم تفعيل الوقف المتحرك',
    timestamp: new Date(now - 1000 * 60 * 60 * 6).toISOString(),
  },
  {
    id: 'log-auto-trading',
    userId,
    level: 'success',
    message: 'تم تمكين التداول الآلي',
    details: 'تم تفعيل استراتيجية Multi-Timeframe و AI Trading',
    timestamp: new Date(now - 1000 * 60 * 60 * 4).toISOString(),
  },
  {
    id: 'log-warning',
    userId,
    level: 'warning',
    message: 'ارتفاع في تقلبات SOL/USDT',
    details: 'تم ضبط الوقف المتحرك عند 179.20 لتقليل المخاطر',
    timestamp: new Date(now - 1000 * 60 * 45).toISOString(),
  },
  {
    id: 'log-signal',
    userId,
    level: 'info',
    message: 'إشارة AI قوية على ETH/USDT',
    details: 'نسبة الثقة 82% بناءً على تحليل الزخم',
    timestamp: new Date(now - 1000 * 60 * 20).toISOString(),
  },
]

const marketBaselines: Record<string, MarketBase> = {
  BTCUSDT: {
    price: 67420,
    priceChange24h: 520,
    high24h: 68450,
    low24h: 66180,
    volume24h: 28500000000,
  },
  ETHUSDT: {
    price: 3175,
    priceChange24h: -85,
    high24h: 3290,
    low24h: 3120,
    volume24h: 15800000000,
  },
  BNBUSDT: {
    price: 502,
    priceChange24h: -8.5,
    high24h: 515,
    low24h: 496,
    volume24h: 1840000000,
  },
  SOLUSDT: {
    price: 188,
    priceChange24h: 6.4,
    high24h: 195,
    low24h: 178,
    volume24h: 3200000000,
  },
  XRPUSDT: {
    price: 0.6,
    priceChange24h: 0.018,
    high24h: 0.62,
    low24h: 0.58,
    volume24h: 1200000000,
  },
}

const technicalTemplates: Record<string, TechnicalAnalysis> = {
  BTCUSDT: {
    symbol: 'BTC/USDT',
    currentPrice: 67420,
    rsi: { value: 58.4, signal: 'buy' },
    macd: { value: 312.6, signal: 'buy', histogram: 48.2 },
    ma: { signal: 'buy', shortMA: 67010, longMA: 65480 },
    overallSignal: 'buy',
    signalStrength: 78,
  },
  ETHUSDT: {
    symbol: 'ETH/USDT',
    currentPrice: 3175,
    rsi: { value: 41.2, signal: 'sell' },
    macd: { value: -24.8, signal: 'sell', histogram: -12.4 },
    ma: { signal: 'sell', shortMA: 3210, longMA: 3284 },
    overallSignal: 'sell',
    signalStrength: 64,
  },
  SOLUSDT: {
    symbol: 'SOL/USDT',
    currentPrice: 188,
    rsi: { value: 62.1, signal: 'buy' },
    macd: { value: 12.7, signal: 'buy', histogram: 6.3 },
    ma: { signal: 'buy', shortMA: 184, longMA: 176 },
    overallSignal: 'buy',
    signalStrength: 72,
  },
  BNBUSDT: {
    symbol: 'BNB/USDT',
    currentPrice: 502,
    rsi: { value: 48.2, signal: 'hold' },
    macd: { value: -6.4, signal: 'hold', histogram: 1.2 },
    ma: { signal: 'hold', shortMA: 506, longMA: 502 },
    overallSignal: 'hold',
    signalStrength: 52,
  },
}

const aiPredictionsTemplates: PredictionsByTimeframe = {
  '15m': [
    {
      symbol: 'BTC/USDT',
      currentPrice: 67420,
      prediction: {
        overallSignal: 'buy',
        confidence: 82,
        signalStrength: 78,
        predictions: {
          patternRecognition: {
            signal: 'buy',
            strength: 84,
            confidence: 79,
            description: 'اختراق مقاومة قصيرة مع حجم مرتفع'
          },
          momentumAnalysis: {
            signal: 'buy',
            strength: 76,
            confidence: 81,
            description: 'تسارع إيجابي على مؤشر MACD'
          },
          volatilityAnalysis: {
            signal: 'hold',
            strength: 52,
            confidence: 68,
            description: 'تذبذب متوسط يدعم الاحتفاظ'
          },
          trendStrength: {
            signal: 'buy',
            strength: 73,
            confidence: 77,
            description: 'اتجاه صاعد مستقر خلال الساعات الأخيرة'
          },
          priceAction: {
            signal: 'buy',
            strength: 80,
            confidence: 83,
            description: 'شموع صاعدة متتالية مع دعم قوي'
          }
        },
        detectedPatterns: [
          {
            pattern: 'Bull Flag',
            signal: 'buy',
            strength: 74,
            description: 'نمط استمراري صاعد'
          },
          {
            pattern: 'RSI Divergence',
            signal: 'buy',
            strength: 68,
            description: 'انفراج إيجابي على RSI'
          }
        ],
        marketRegime: 'trending_up',
        riskLevel: 'medium',
        shortTermPrediction: 'bullish',
        mediumTermPrediction: 'bullish'
      }
    },
    {
      symbol: 'ETH/USDT',
      currentPrice: 3175,
      prediction: {
        overallSignal: 'sell',
        confidence: 71,
        signalStrength: 66,
        predictions: {
          patternRecognition: {
            signal: 'sell',
            strength: 68,
            confidence: 70,
            description: 'نمط قمة مزدوجة يظهر بوضوح'
          },
          momentumAnalysis: {
            signal: 'sell',
            strength: 61,
            confidence: 69,
            description: 'زخم هابط منذ الإطار الزمني السابق'
          },
          volatilityAnalysis: {
            signal: 'hold',
            strength: 48,
            confidence: 62,
            description: 'تذبذب منخفض نسبيًا'
          },
          trendStrength: {
            signal: 'sell',
            strength: 59,
            confidence: 67,
            description: 'اتجاه هابط قصير المدى'
          },
          priceAction: {
            signal: 'sell',
            strength: 63,
            confidence: 72,
            description: 'شموع هبوطية مع مقاومة قوية'
          }
        },
        detectedPatterns: [
          {
            pattern: 'Double Top',
            signal: 'sell',
            strength: 66,
            description: 'تأكيد للنمط عند مستوى 3200'
          }
        ],
        marketRegime: 'trending_down',
        riskLevel: 'medium',
        shortTermPrediction: 'bearish',
        mediumTermPrediction: 'neutral'
      }
    },
    {
      symbol: 'SOL/USDT',
      currentPrice: 188,
      prediction: {
        overallSignal: 'buy',
        confidence: 76,
        signalStrength: 72,
        predictions: {
          patternRecognition: {
            signal: 'buy',
            strength: 71,
            confidence: 74,
            description: 'نمط كوب وعروة مكتمل'
          },
          momentumAnalysis: {
            signal: 'buy',
            strength: 75,
            confidence: 79,
            description: 'قوة زخم إيجابية منذ 4 ساعات'
          },
          volatilityAnalysis: {
            signal: 'hold',
            strength: 54,
            confidence: 63,
            description: 'تذبذب طبيعي للسوق'
          },
          trendStrength: {
            signal: 'buy',
            strength: 69,
            confidence: 73,
            description: 'اتجاه صاعد مستمر'
          },
          priceAction: {
            signal: 'buy',
            strength: 78,
            confidence: 80,
            description: 'شموع صاعدة مع اختراق مقاومة 185'
          }
        },
        detectedPatterns: [
          {
            pattern: 'Cup and Handle',
            signal: 'buy',
            strength: 71,
            description: 'يدعم استمرار الاتجاه الصاعد'
          }
        ],
        marketRegime: 'trending_up',
        riskLevel: 'medium',
        shortTermPrediction: 'bullish',
        mediumTermPrediction: 'bullish'
      }
    }
  ],
  '1h': [
    {
      symbol: 'BTC/USDT',
      currentPrice: 67420,
      prediction: {
        overallSignal: 'buy',
        confidence: 84,
        signalStrength: 80,
        predictions: {
          patternRecognition: {
            signal: 'buy',
            strength: 86,
            confidence: 83,
            description: 'اتجاه صاعد مستقر على مدى 6 ساعات'
          },
          momentumAnalysis: {
            signal: 'buy',
            strength: 80,
            confidence: 85,
            description: 'زخم إيجابي مع ارتفاع حجم التداول'
          },
          volatilityAnalysis: {
            signal: 'hold',
            strength: 55,
            confidence: 67,
            description: 'تذبذب معتدل يدعم الاستمرار'
          },
          trendStrength: {
            signal: 'buy',
            strength: 82,
            confidence: 86,
            description: 'اتجاه صاعد منذ بداية الأسبوع'
          },
          priceAction: {
            signal: 'buy',
            strength: 79,
            confidence: 81,
            description: 'نماذج شموع صاعدة متتالية'
          }
        },
        detectedPatterns: [
          {
            pattern: 'Ascending Channel',
            signal: 'buy',
            strength: 75,
            description: 'قناة سعرية صاعدة بوضوح'
          }
        ],
        marketRegime: 'trending_up',
        riskLevel: 'medium',
        shortTermPrediction: 'bullish',
        mediumTermPrediction: 'bullish'
      }
    },
    {
      symbol: 'ETH/USDT',
      currentPrice: 3175,
      prediction: {
        overallSignal: 'hold',
        confidence: 68,
        signalStrength: 58,
        predictions: {
          patternRecognition: {
            signal: 'hold',
            strength: 54,
            confidence: 65,
            description: 'قناة جانبية على الإطار الزمني ساعة'
          },
          momentumAnalysis: {
            signal: 'hold',
            strength: 57,
            confidence: 63,
            description: 'زخم ضعيف غير حاسم'
          },
          volatilityAnalysis: {
            signal: 'hold',
            strength: 49,
            confidence: 60,
            description: 'تقلب محدود على المدى المتوسط'
          },
          trendStrength: {
            signal: 'sell',
            strength: 53,
            confidence: 62,
            description: 'اتجاه هابط ضعيف مستمر'
          },
          priceAction: {
            signal: 'hold',
            strength: 58,
            confidence: 66,
            description: 'سعر يتأرجح بالقرب من 3200'
          }
        },
        detectedPatterns: [],
        marketRegime: 'ranging',
        riskLevel: 'medium',
        shortTermPrediction: 'neutral',
        mediumTermPrediction: 'neutral'
      }
    },
    {
      symbol: 'BNB/USDT',
      currentPrice: 502,
      prediction: {
        overallSignal: 'hold',
        confidence: 64,
        signalStrength: 56,
        predictions: {
          patternRecognition: {
            signal: 'hold',
            strength: 53,
            confidence: 62,
            description: 'قناة سعرية ضيقة بين 498 و 508'
          },
          momentumAnalysis: {
            signal: 'hold',
            strength: 50,
            confidence: 60,
            description: 'زخم ضعيف وغير حاسم'
          },
          volatilityAnalysis: {
            signal: 'hold',
            strength: 47,
            confidence: 58,
            description: 'تذبذب منخفض يسهل التداول'
          },
          trendStrength: {
            signal: 'hold',
            strength: 51,
            confidence: 59,
            description: 'اتجاه جانبي عام'
          },
          priceAction: {
            signal: 'hold',
            strength: 55,
            confidence: 63,
            description: 'شموع متداخلة بدون اتجاه واضح'
          }
        },
        detectedPatterns: [],
        marketRegime: 'ranging',
        riskLevel: 'low',
        shortTermPrediction: 'neutral',
        mediumTermPrediction: 'neutral'
      }
    }
  ],
  '4h': [
    {
      symbol: 'BTC/USDT',
      currentPrice: 67420,
      prediction: {
        overallSignal: 'buy',
        confidence: 88,
        signalStrength: 84,
        predictions: {
          patternRecognition: {
            signal: 'buy',
            strength: 88,
            confidence: 87,
            description: 'اتجاه صاعد قوي على الإطار 4 ساعات'
          },
          momentumAnalysis: {
            signal: 'buy',
            strength: 84,
            confidence: 88,
            description: 'تسارع إيجابي مع حجم متزايد'
          },
          volatilityAnalysis: {
            signal: 'hold',
            strength: 58,
            confidence: 68,
            description: 'تقلب صحي يدعم الاتجاه'
          },
          trendStrength: {
            signal: 'buy',
            strength: 86,
            confidence: 90,
            description: 'قناة صاعدة منذ بداية الشهر'
          },
          priceAction: {
            signal: 'buy',
            strength: 82,
            confidence: 85,
            description: 'دعوم متصاعدة مع قمم جديدة'
          }
        },
        detectedPatterns: [
          {
            pattern: 'Higher Highs',
            signal: 'buy',
            strength: 80,
            description: 'نمط قمم وقيعان صاعدة واضح'
          }
        ],
        marketRegime: 'trending_up',
        riskLevel: 'medium',
        shortTermPrediction: 'bullish',
        mediumTermPrediction: 'bullish'
      }
    },
    {
      symbol: 'SOL/USDT',
      currentPrice: 188,
      prediction: {
        overallSignal: 'buy',
        confidence: 79,
        signalStrength: 74,
        predictions: {
          patternRecognition: {
            signal: 'buy',
            strength: 75,
            confidence: 78,
            description: 'نمط صاعد مع دعم قوي عند 176'
          },
          momentumAnalysis: {
            signal: 'buy',
            strength: 73,
            confidence: 76,
            description: 'زخم مستمر على الإطار 4 ساعات'
          },
          volatilityAnalysis: {
            signal: 'hold',
            strength: 53,
            confidence: 64,
            description: 'تقلب متوسط يدعم استمرار الاتجاه'
          },
          trendStrength: {
            signal: 'buy',
            strength: 74,
            confidence: 77,
            description: 'خط اتجاه صاعد ثابت'
          },
          priceAction: {
            signal: 'buy',
            strength: 78,
            confidence: 80,
            description: 'شموع صاعدة متتالية فوق المتوسط 50'
          }
        },
        detectedPatterns: [
          {
            pattern: 'Ascending Triangle',
            signal: 'buy',
            strength: 72,
            description: 'اختراق محتمل للمقاومة 190'
          }
        ],
        marketRegime: 'trending_up',
        riskLevel: 'medium',
        shortTermPrediction: 'bullish',
        mediumTermPrediction: 'bullish'
      }
    }
  ],
  '1d': [
    {
      symbol: 'BTC/USDT',
      currentPrice: 67420,
      prediction: {
        overallSignal: 'buy',
        confidence: 86,
        signalStrength: 82,
        predictions: {
          patternRecognition: {
            signal: 'buy',
            strength: 84,
            confidence: 85,
            description: 'نمط صاعد طويل الأجل'
          },
          momentumAnalysis: {
            signal: 'buy',
            strength: 79,
            confidence: 83,
            description: 'زخم إيجابي منذ 3 أسابيع'
          },
          volatilityAnalysis: {
            signal: 'hold',
            strength: 56,
            confidence: 66,
            description: 'تقلب طبيعي للسوق'
          },
          trendStrength: {
            signal: 'buy',
            strength: 81,
            confidence: 84,
            description: 'اتجاه صاعد متماسك'
          },
          priceAction: {
            signal: 'buy',
            strength: 77,
            confidence: 82,
            description: 'دعوم صاعدة مع قمم جديدة'
          }
        },
        detectedPatterns: [
          {
            pattern: 'Golden Cross',
            signal: 'buy',
            strength: 78,
            description: 'تقاطع إيجابي للمتوسطات'
          }
        ],
        marketRegime: 'trending_up',
        riskLevel: 'medium',
        shortTermPrediction: 'bullish',
        mediumTermPrediction: 'bullish'
      }
    }
  ]
}

const accountState: AccountState = {
  connected: true,
  totalBalance: 125_400,
  availableBalance: 87_200,
  message: 'يتم تحديث بيانات الحساب كل 10 ثوانٍ.',
  positions: [
    {
      symbol: 'BTCUSDT',
      side: 'LONG',
      entryPrice: 67250.45,
      quantity: 0.35,
      leverage: 5,
    },
    {
      symbol: 'ETHUSDT',
      side: 'SHORT',
      entryPrice: 3185.6,
      quantity: 4.5,
      leverage: 4,
    },
    {
      symbol: 'SOLUSDT',
      side: 'LONG',
      entryPrice: 182.75,
      quantity: 120,
      leverage: 2,
    },
  ],
}

const autoTradingState: AutoTradingState = {
  enabled: defaultSettings.autoTradingEnabled ?? false,
  isRunning: defaultSettings.autoTradingEnabled ?? false,
}

const state = {
  settings: { ...defaultSettings },
  trades: {
    active: [...initialActiveTrades],
    history: [...initialHistoryTrades],
  },
  logs: [...initialLogs],
  market: marketBaselines,
  technical: technicalTemplates,
  aiPredictions: aiPredictionsTemplates,
  account: { ...accountState },
  autoTrading: { ...autoTradingState },
}

const MAX_LOGS = 100

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value))
}

function round(value: number, precision = 2): number {
  const factor = Math.pow(10, precision)
  return Math.round(value * factor) / factor
}

function toSymbolKey(symbol: string): string {
  return symbol.replace('/', '').toUpperCase()
}

function addLog(level: ActivityLog['level'], message: string, details?: string): ActivityLog {
  const log: ActivityLog = {
    id: `log-${Math.random().toString(36).slice(2, 10)}`,
    userId,
    level,
    message,
    details,
    timestamp: new Date().toISOString(),
  }

  state.logs.unshift(log)
  if (state.logs.length > MAX_LOGS) {
    state.logs.length = MAX_LOGS
  }

  return log
}

export function recordLog(level: ActivityLog['level'], message: string, details?: string): ActivityLog {
  return addLog(level, message, details)
}

function jitter(value: number, variance = 2): number {
  const offset = Math.sin(Date.now() / 60000 + value) * variance
  return value + offset
}

function calculateProfit(trade: TradeRecord, exitPrice: number): { profit: number; profitPercent: number } {
  const direction = trade.type === 'long' ? 1 : -1
  const profit = (exitPrice - trade.entryPrice) * trade.quantity * direction
  const basis = trade.entryPrice * trade.quantity
  const profitPercent = basis === 0 ? 0 : (profit / basis) * 100
  return {
    profit: round(profit, 2),
    profitPercent: round(profitPercent, 2),
  }
}

function marginUsed(): number {
  return state.account.positions.reduce((acc, position) => {
    const notional = position.entryPrice * position.quantity
    const margin = notional / Math.max(position.leverage, 1)
    return acc + margin
  }, 0)
}

function syncAccountBalances(): void {
  const used = marginUsed()
  state.account.availableBalance = round(Math.max(state.account.totalBalance - used, 0), 2)
}

export function getSettings(): BotSettings {
  return clone(state.settings)
}

export function updateSettings(input: Partial<BotSettings>): BotSettings {
  const updated: Partial<BotSettings> = {}
  for (const [key, value] of Object.entries(input)) {
    if (value === undefined) continue
    const current = (state.settings as Record<string, unknown>)[key]
    if (typeof current === 'number' && typeof value === 'string') {
      updated[key as keyof BotSettings] = Number(value) as BotSettings[keyof BotSettings]
    } else {
      updated[key as keyof BotSettings] = value as BotSettings[keyof BotSettings]
    }
  }

  state.settings = {
    ...state.settings,
    ...updated,
  }

  if (updated.autoTradingEnabled !== undefined) {
    state.autoTrading.enabled = Boolean(updated.autoTradingEnabled)
    state.autoTrading.isRunning = state.autoTrading.enabled
  }

  addLog('success', 'تم تحديث إعدادات الروبوت بنجاح', 'تم حفظ التعديلات الجديدة في الإعدادات')
  return getSettings()
}

export function getAutoTradingStatus(): AutoTradingState {
  return clone(state.autoTrading)
}

export function startAutoTrading(): void {
  state.autoTrading.enabled = true
  state.autoTrading.isRunning = true
  state.settings.autoTradingEnabled = true
  addLog('success', 'تم تشغيل التداول التلقائي', 'سيبدأ الروبوت في مراقبة الإشارات وتنفيذ الصفقات')
}

export function stopAutoTrading(): void {
  state.autoTrading.isRunning = false
  state.settings.autoTradingEnabled = false
  addLog('warning', 'تم إيقاف التداول التلقائي', 'لن يتم فتح صفقات جديدة تلقائيًا حتى يتم إعادة تشغيله')
}

export function toggleBotActive(): boolean {
  state.settings.isActive = !state.settings.isActive
  addLog(
    state.settings.isActive ? 'success' : 'warning',
    state.settings.isActive ? 'تم تفعيل الروبوت' : 'تم إيقاف الروبوت',
    state.settings.isActive ? 'سيستأنف الروبوت مراقبة فرص التداول' : 'توقف تنفيذ الإشارات تلقائيًا'
  )
  return state.settings.isActive
}

export function getLogs(limit?: number): ActivityLog[] {
  const logs = [...state.logs].sort((a, b) => (b.timestamp ?? '').localeCompare(a.timestamp ?? ''))
  return clone(limit ? logs.slice(0, limit) : logs)
}

export function getActiveTrades(): Trade[] {
  return clone(state.trades.active)
}

export function getTradesHistory(): Trade[] {
  const history = [...state.trades.history].sort((a, b) => {
    const timeA = a.exitTime ?? a.entryTime
    const timeB = b.exitTime ?? b.entryTime
    return (timeB ?? '').localeCompare(timeA ?? '')
  })
  return clone(history)
}

function removePosition(symbolKey: string): void {
  const index = state.account.positions.findIndex((pos) => pos.symbol === symbolKey)
  if (index !== -1) {
    state.account.positions.splice(index, 1)
  }
}

export function closeTrade(tradeId: string): Trade | null {
  const tradeIndex = state.trades.active.findIndex((trade) => trade.id === tradeId)
  if (tradeIndex === -1) {
    return null
  }

  const [trade] = state.trades.active.splice(tradeIndex, 1)
  const market = getMarketSnapshot(toSymbolKey(trade.symbol))
  const basePrice = market?.price ?? trade.entryPrice
  const adjustment = trade.type === 'long' ? 0.4 : -0.4
  const exitPrice = round(basePrice + adjustment, 2)
  const { profit, profitPercent } = calculateProfit(trade, exitPrice)

  const closedTrade: TradeRecord = {
    ...trade,
    status: 'closed',
    exitPrice,
    exitTime: new Date().toISOString(),
    profit,
    profitPercent,
  }

  state.trades.history.unshift(closedTrade)
  state.account.totalBalance = round(state.account.totalBalance + profit, 2)
  removePosition(toSymbolKey(trade.symbol))
  syncAccountBalances()

  addLog(
    profit >= 0 ? 'success' : 'warning',
    `تم إغلاق صفقة ${trade.symbol}`,
    `الربح: ${profit.toFixed(2)}$ (${profitPercent.toFixed(2)}%)`
  )

  return clone(closedTrade)
}

export function closeAllTrades(): Trade[] {
  const currentlyActive = [...state.trades.active]
  const closed: Trade[] = []
  currentlyActive.forEach((trade) => {
    const result = closeTrade(trade.id)
    if (result) {
      closed.push(result)
    }
  })
  return closed
}

export function getAccountInfo(): AccountState & {
  positions: (AccountPosition & { unrealizedPnl: number })[]
} {
  const positionsWithPnl = state.account.positions.map((position) => {
    const market = getMarketSnapshot(position.symbol)
    const currentPrice = market?.price ?? position.entryPrice
    const direction = position.side === 'LONG' ? 1 : -1
    const profit = (currentPrice - position.entryPrice) * position.quantity * direction
    return {
      ...position,
      unrealizedPnl: round(profit, 2),
    }
  })

  const account = {
    ...state.account,
    positions: positionsWithPnl,
  }

  return clone(account)
}

export function getMarketSnapshot(symbol: string): MarketSnapshot | null {
  const key = toSymbolKey(symbol)
  const base = state.market[key]
  if (!base) {
    return null
  }

  const drift = jitter(0, base.price * 0.0025)
  const price = round(base.price + drift, 2)
  const referencePrice = base.price - base.priceChange24h
  const change = round(price - referencePrice, 2)
  const percent = referencePrice === 0 ? 0 : round((change / referencePrice) * 100, 2)

  return {
    symbol: `${key.slice(0, -4)}/${key.slice(-4)}`,
    price,
    priceChange24h: change,
    priceChangePercent24h: percent,
    high24h: base.high24h,
    low24h: base.low24h,
    volume24h: base.volume24h,
    timestamp: new Date().toISOString(),
  }
}

export function getTechnicalAnalysis(symbol: string): TechnicalAnalysis | null {
  const key = toSymbolKey(symbol)
  const template = state.technical[key]
  const market = getMarketSnapshot(key)

  if (!template && !market) {
    return null
  }

  const base = template ?? {
    symbol: `${key.slice(0, -4)}/${key.slice(-4)}`,
    currentPrice: market?.price ?? 0,
    rsi: { value: 50, signal: 'hold' as const },
    macd: { value: 0, signal: 'hold' as const, histogram: 0 },
    ma: { signal: 'hold' as const, shortMA: market?.price ?? 0, longMA: market?.price ?? 0 },
    overallSignal: 'hold' as const,
    signalStrength: 50,
  }

  const analysis: TechnicalAnalysis = {
    ...base,
    symbol: `${key.slice(0, -4)}/${key.slice(-4)}`,
    currentPrice: market?.price ?? base.currentPrice,
    rsi: {
      value: round(jitter(base.rsi.value, 1.5), 2),
      signal: base.rsi.signal,
    },
    macd: {
      value: round(jitter(base.macd.value, 1.8), 2),
      signal: base.macd.signal,
      histogram: round(jitter(base.macd.histogram, 1.2), 2),
    },
    ma: {
      ...base.ma,
      shortMA: round(jitter(base.ma.shortMA, 20), 2),
      longMA: round(jitter(base.ma.longMA, 15), 2),
    },
    overallSignal: base.overallSignal,
    signalStrength: Math.max(0, Math.min(100, Math.round(jitter(base.signalStrength, 3)))),
  }

  return clone(analysis)
}

export function getAiPredictions(timeframe: string): {
  timeframe: string
  predictions: PredictionData[]
  timestamp: string
} {
  const key = state.aiPredictions[timeframe] ? timeframe : '1h'
  const predictions = state.aiPredictions[key].map((prediction) => {
    const market = getMarketSnapshot(toSymbolKey(prediction.symbol))
    const basePrediction = prediction.prediction
    return {
      symbol: prediction.symbol,
      currentPrice: market?.price ?? prediction.currentPrice,
      prediction: {
        ...basePrediction,
        confidence: Math.max(40, Math.min(95, Math.round(jitter(basePrediction.confidence, 3)))),
        signalStrength: Math.max(30, Math.min(90, Math.round(jitter(basePrediction.signalStrength, 4)))),
        predictions: {
          ...basePrediction.predictions,
          patternRecognition: {
            ...basePrediction.predictions.patternRecognition,
            strength: Math.max(20, Math.min(95, Math.round(jitter(basePrediction.predictions.patternRecognition.strength, 3)))) ,
            confidence: Math.max(20, Math.min(95, Math.round(jitter(basePrediction.predictions.patternRecognition.confidence, 3))))
          },
          momentumAnalysis: {
            ...basePrediction.predictions.momentumAnalysis,
            strength: Math.max(20, Math.min(95, Math.round(jitter(basePrediction.predictions.momentumAnalysis.strength, 3)))),
            confidence: Math.max(20, Math.min(95, Math.round(jitter(basePrediction.predictions.momentumAnalysis.confidence, 3))))
          },
          volatilityAnalysis: {
            ...basePrediction.predictions.volatilityAnalysis,
            strength: Math.max(20, Math.min(95, Math.round(jitter(basePrediction.predictions.volatilityAnalysis.strength, 3)))),
            confidence: Math.max(20, Math.min(95, Math.round(jitter(basePrediction.predictions.volatilityAnalysis.confidence, 3))))
          },
          trendStrength: {
            ...basePrediction.predictions.trendStrength,
            strength: Math.max(20, Math.min(95, Math.round(jitter(basePrediction.predictions.trendStrength.strength, 3)))),
            confidence: Math.max(20, Math.min(95, Math.round(jitter(basePrediction.predictions.trendStrength.confidence, 3))))
          },
          priceAction: {
            ...basePrediction.predictions.priceAction,
            strength: Math.max(20, Math.min(95, Math.round(jitter(basePrediction.predictions.priceAction.strength, 3)))),
            confidence: Math.max(20, Math.min(95, Math.round(jitter(basePrediction.predictions.priceAction.confidence, 3))))
          },
        },
      },
    }
  })

  return {
    timeframe: key,
    predictions: clone(predictions),
    timestamp: new Date().toISOString(),
  }
}

export function getSummaryStats(): {
  totalBalance: number
  todayProfit: number
  todayProfitPercent: number
  activeTrades: number
  successRate: number
} {
  const closedToday = state.trades.history.filter((trade) => {
    if (!trade.exitTime) return false
    const exitDate = new Date(trade.exitTime)
    return Date.now() - exitDate.getTime() <= 24 * 60 * 60 * 1000
  })

  const todayProfit = closedToday.reduce((sum, trade) => sum + (trade.profit ?? 0), 0)
  const totalClosed = state.trades.history.length
  const winningTrades = state.trades.history.filter((trade) => (trade.profit ?? 0) > 0).length
  const successRate = totalClosed === 0 ? 0 : (winningTrades / totalClosed) * 100

  return {
    totalBalance: round(state.account.totalBalance, 2),
    todayProfit: round(todayProfit, 2),
    todayProfitPercent: round(
      state.account.totalBalance === 0 ? 0 : (todayProfit / state.account.totalBalance) * 100,
      2
    ),
    activeTrades: state.trades.active.length,
    successRate: round(successRate, 2),
  }
}

export function getDetailedStats(): {
  totalBalance: number
  todayProfit: number
  todayProfitPercent: number
  activeTrades: number
  successRate: number
  totalTrades: number
  winRate: number
  avgProfit: number
  avgLoss: number
  bestTrade: number
  worstTrade: number
  totalVolume: number
} {
  const summary = getSummaryStats()
  const closedTrades = state.trades.history
  const totalTrades = closedTrades.length + state.trades.active.length
  const winningTrades = closedTrades.filter((trade) => (trade.profit ?? 0) > 0)
  const losingTrades = closedTrades.filter((trade) => (trade.profit ?? 0) < 0)

  const avgProfit = winningTrades.length === 0
    ? 0
    : winningTrades.reduce((sum, trade) => sum + (trade.profit ?? 0), 0) / winningTrades.length

  const avgLoss = losingTrades.length === 0
    ? 0
    : Math.abs(
        losingTrades.reduce((sum, trade) => sum + (trade.profit ?? 0), 0) / losingTrades.length
      )

  const bestTrade = closedTrades.reduce((max, trade) => Math.max(max, trade.profit ?? -Infinity), 0)
  const worstTrade = closedTrades.reduce((min, trade) => Math.min(min, trade.profit ?? Infinity), 0)

  const totalVolume = closedTrades.reduce((sum, trade) => {
    const notional = trade.entryPrice * trade.quantity
    return sum + notional
  }, 0)

  const winRate = closedTrades.length === 0 ? 0 : (winningTrades.length / closedTrades.length) * 100

  return {
    ...summary,
    totalTrades,
    winRate: round(winRate, 2),
    avgProfit: round(avgProfit, 2),
    avgLoss: round(avgLoss, 2),
    bestTrade: round(bestTrade, 2),
    worstTrade: round(worstTrade, 2),
    totalVolume: Math.round(totalVolume),
  }
}
