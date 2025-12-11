import { z } from 'zod'

export const tradeTypeEnum = z.enum(['long', 'short'])
export const tradeStatusEnum = z.enum(['active', 'closed', 'pending', 'cancelled'])
export const signalTypeEnum = z.enum(['buy', 'sell', 'hold'])
export const logLevelEnum = z.enum(['info', 'warning', 'error', 'success'])

export const botSettingsSchema = z.object({
  id: z.string().optional(),
  binanceApiKey: z.string().optional().nullable(),
  binanceApiSecret: z.string().optional().nullable(),
  customApiUrl: z.string().optional().nullable(),
  isTestnet: z.boolean().default(true),
  isActive: z.boolean().default(false),
  hedgingMode: z.boolean().default(false),
  maxRiskPerTrade: z.number().default(2),
  riskRewardRatio: z.number().default(1.5),
  maShortPeriod: z.number().default(50),
  maLongPeriod: z.number().default(200),
  rsiPeriod: z.number().default(14),
  rsiOverbought: z.number().default(70),
  rsiOversold: z.number().default(30),
  macdFast: z.number().default(12),
  macdSlow: z.number().default(26),
  macdSignal: z.number().default(9),
  tradingPairs: z.array(z.string()).default(['BTC/USDT', 'ETH/USDT']),
  telegramBotToken: z.string().optional().nullable(),
  telegramChatId: z.string().optional().nullable(),
  emailNotifications: z.boolean().default(false),
  notificationEmail: z.string().optional().nullable(),
  autoTradingEnabled: z.boolean().default(false),
  minSignalStrength: z.number().default(70),
  maxDailyTrades: z.number().default(10),
  tradeCooldownMinutes: z.number().default(30),
  trailingStopEnabled: z.boolean().default(false),
  trailingStopPercent: z.number().default(1),
  trailingStopActivationPercent: z.number().default(1),
  multiTimeframeEnabled: z.boolean().default(false),
  timeframes: z.array(z.string()).default(['15m', '1h', '4h']),
  weeklyReportEnabled: z.boolean().default(false),
  monthlyReportEnabled: z.boolean().default(false),
  reportDay: z.number().default(0),
  aiTradingEnabled: z.boolean().default(false),
  aiMinConfidence: z.number().default(70),
  aiMinSignalStrength: z.number().default(60),
  aiRequiredSignals: z.number().default(3),
  advancedStrategiesEnabled: z.boolean().default(false),
  enabledStrategies: z.array(z.string()).default(['breakout', 'momentum', 'meanReversion', 'swing']),
  strategyMinConfidence: z.number().default(60),
  strategyMinStrength: z.number().default(50),
  requireStrategyConsensus: z.boolean().default(false),
  trailingStopPriceBuffer: z.number().optional().nullable(),
  smartPositionSizingEnabled: z.boolean().default(false),
  atrPeriod: z.number().default(14),
  atrMultiplier: z.number().default(1.5),
  maxPositionPercent: z.number().default(10),
  minPositionPercent: z.number().default(1),
  volatilityAdjustment: z.boolean().default(true),
  marketFilterEnabled: z.boolean().default(false),
  avoidHighVolatility: z.boolean().default(true),
  maxVolatilityPercent: z.number().default(5),
  trendFilterEnabled: z.boolean().default(true),
  minTrendStrength: z.number().default(25),
  avoidRangingMarket: z.boolean().default(true),
  accountProtectionEnabled: z.boolean().default(false),
  maxDailyLossPercent: z.number().default(5),
  maxConcurrentTrades: z.number().default(3),
  pauseAfterConsecutiveLosses: z.number().default(3),
  diversificationEnabled: z.boolean().default(true),
  createdAt: z.string().optional().nullable(),
  updatedAt: z.string().optional().nullable()
})

export const tradeSchema = z.object({
  id: z.string(),
  symbol: z.string(),
  type: tradeTypeEnum,
  status: tradeStatusEnum.default('active'),
  entryPrice: z.number(),
  exitPrice: z.number().optional().nullable(),
  quantity: z.number(),
  leverage: z.number().default(1),
  stopLoss: z.number(),
  takeProfit: z.number(),
  profit: z.number().optional().nullable(),
  profitPercent: z.number().optional().nullable(),
  entryTime: z.string(),
  exitTime: z.string().optional().nullable(),
  entrySignals: z.array(z.string()).optional().nullable(),
  binanceOrderId: z.string().optional().nullable(),
  trailingStopActive: z.boolean().optional().nullable(),
  trailingStopPrice: z.number().optional().nullable(),
  highestPrice: z.number().optional().nullable(),
  lowestPrice: z.number().optional().nullable(),
  isAutoTrade: z.boolean().default(false)
})

export const activityLogSchema = z.object({
  id: z.string(),
  level: logLevelEnum.default('info'),
  message: z.string(),
  details: z.string().optional().nullable(),
  timestamp: z.string()
})

export const marketDataSchema = z.object({
  symbol: z.string(),
  price: z.number(),
  high24h: z.number().optional().nullable(),
  low24h: z.number().optional().nullable(),
  volume24h: z.number().optional().nullable(),
  priceChange24h: z.number().default(0),
  priceChangePercent24h: z.number().default(0),
  timestamp: z.string()
})

export const aiSignalSchema = z.object({
  signal: z.enum(['buy', 'sell', 'hold']),
  strength: z.number(),
  confidence: z.number(),
  description: z.string()
})

export const patternResultSchema = z.object({
  pattern: z.string(),
  signal: z.enum(['buy', 'sell', 'hold']),
  strength: z.number(),
  description: z.string()
})

export const aiPredictionSchema = z.object({
  overallSignal: z.enum(['buy', 'sell', 'hold']),
  confidence: z.number(),
  signalStrength: z.number(),
  predictions: z.object({
    patternRecognition: aiSignalSchema,
    momentumAnalysis: aiSignalSchema,
    volatilityAnalysis: aiSignalSchema,
    trendStrength: aiSignalSchema,
    priceAction: aiSignalSchema
  }),
  detectedPatterns: z.array(patternResultSchema),
  marketRegime: z.enum(['trending_up', 'trending_down', 'ranging', 'volatile']),
  riskLevel: z.enum(['low', 'medium', 'high']),
  shortTermPrediction: z.enum(['bullish', 'bearish', 'neutral']),
  mediumTermPrediction: z.enum(['bullish', 'bearish', 'neutral'])
})

export const aiPredictionResponseSchema = z.object({
  symbol: z.string(),
  currentPrice: z.number(),
  prediction: aiPredictionSchema
})

export const aiPredictionsEnvelopeSchema = z.object({
  timeframe: z.string(),
  predictions: z.array(aiPredictionResponseSchema),
  timestamp: z.string()
})

export type BotSettings = z.infer<typeof botSettingsSchema>
export type Trade = z.infer<typeof tradeSchema>
export type ActivityLog = z.infer<typeof activityLogSchema>
export type MarketData = z.infer<typeof marketDataSchema>
export type TradeType = z.infer<typeof tradeTypeEnum>
export type TradeStatus = z.infer<typeof tradeStatusEnum>
export type LogLevel = z.infer<typeof logLevelEnum>
export type AISignal = z.infer<typeof aiSignalSchema>
export type PatternResult = z.infer<typeof patternResultSchema>
export type AIPrediction = z.infer<typeof aiPredictionSchema>
export type AIPredictionResponse = z.infer<typeof aiPredictionResponseSchema>
export type AIPredictionsEnvelope = z.infer<typeof aiPredictionsEnvelopeSchema>

export const defaultBotSettings: BotSettings = {
  isTestnet: true,
  isActive: false,
  hedgingMode: false,
  maxRiskPerTrade: 2,
  riskRewardRatio: 1.5,
  maShortPeriod: 50,
  maLongPeriod: 200,
  rsiPeriod: 14,
  rsiOverbought: 70,
  rsiOversold: 30,
  macdFast: 12,
  macdSlow: 26,
  macdSignal: 9,
  tradingPairs: ['BTC/USDT', 'ETH/USDT'],
  emailNotifications: false,
  autoTradingEnabled: false,
  minSignalStrength: 70,
  maxDailyTrades: 10,
  tradeCooldownMinutes: 30,
  trailingStopEnabled: false,
  trailingStopPercent: 1,
  trailingStopActivationPercent: 1,
  multiTimeframeEnabled: false,
  timeframes: ['15m', '1h', '4h'],
  weeklyReportEnabled: false,
  monthlyReportEnabled: false,
  reportDay: 0,
  aiTradingEnabled: false,
  aiMinConfidence: 70,
  aiMinSignalStrength: 60,
  aiRequiredSignals: 3,
  advancedStrategiesEnabled: false,
  enabledStrategies: ['breakout', 'momentum', 'meanReversion', 'swing'],
  strategyMinConfidence: 60,
  strategyMinStrength: 50,
  requireStrategyConsensus: false,
  smartPositionSizingEnabled: false,
  atrPeriod: 14,
  atrMultiplier: 1.5,
  maxPositionPercent: 10,
  minPositionPercent: 1,
  volatilityAdjustment: true,
  marketFilterEnabled: false,
  avoidHighVolatility: true,
  maxVolatilityPercent: 5,
  trendFilterEnabled: true,
  minTrendStrength: 25,
  avoidRangingMarket: true,
  accountProtectionEnabled: false,
  maxDailyLossPercent: 5,
  maxConcurrentTrades: 3,
  pauseAfterConsecutiveLosses: 3,
  diversificationEnabled: true
}
