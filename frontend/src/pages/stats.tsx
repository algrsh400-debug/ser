import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Wallet,
  Target,
  Activity,
  Percent,
  Calendar,
  AlertCircle,
} from "lucide-react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { useState, useMemo } from "react";
import type { Trade } from "@shared/schema";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface StatsResponse {
  totalBalance: number;
  todayProfit: number;
  todayProfitPercent: number;
  activeTrades: number;
  successRate: number;
  totalTrades: number;
  winRate: number;
  avgProfit: number;
  avgLoss: number;
  bestTrade: number;
  worstTrade: number;
  totalVolume: number;
}

export default function StatsPage() {
  const [timeRange, setTimeRange] = useState("all");

  const { data: stats, isLoading: statsLoading } = useQuery<StatsResponse>({
    queryKey: ["/api/stats"],
  });

  const { data: trades = [], isLoading: tradesLoading } = useQuery<Trade[]>({
    queryKey: ["/api/trades/history"],
  });

  const chartData = useMemo(() => {
    if (trades.length === 0) {
      return {
        profitData: [],
        pairData: [],
        pieData: [
          { name: "صفقات رابحة", value: 0, color: "hsl(142, 76%, 36%)" },
          { name: "صفقات خاسرة", value: 0, color: "hsl(0, 84%, 60%)" },
        ],
        dailyData: [],
      };
    }

    const closedTrades = trades.filter(t => t.status === "closed");
    const profits = closedTrades.map(t => t.profit || 0);
    const winningTrades = profits.filter(p => p > 0);
    const losingTrades = profits.filter(p => p < 0);

    const pairStats: Record<string, { trades: number; profit: number }> = {};
    closedTrades.forEach(t => {
      if (!pairStats[t.symbol]) {
        pairStats[t.symbol] = { trades: 0, profit: 0 };
      }
      pairStats[t.symbol].trades++;
      pairStats[t.symbol].profit += t.profit || 0;
    });

    const pairData = Object.entries(pairStats)
      .map(([pair, data]) => ({ pair, ...data }))
      .sort((a, b) => b.profit - a.profit)
      .slice(0, 5);

    const months = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", 
                    "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];
    const monthlyStats: Record<number, { profit: number; loss: number }> = {};
    
    closedTrades.forEach(t => {
      if (t.exitTime) {
        const month = new Date(t.exitTime).getMonth();
        if (!monthlyStats[month]) {
          monthlyStats[month] = { profit: 0, loss: 0 };
        }
        const profit = t.profit || 0;
        if (profit >= 0) {
          monthlyStats[month].profit += profit;
        } else {
          monthlyStats[month].loss += profit;
        }
      }
    });

    const profitData = Object.entries(monthlyStats)
      .map(([month, data]) => ({
        month: months[parseInt(month)],
        profit: Math.round(data.profit * 100) / 100,
        loss: Math.round(data.loss * 100) / 100,
      }));

    const days = ["الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];
    const dailyStats: Record<number, { trades: number; profit: number }> = {};
    
    closedTrades.forEach(t => {
      if (t.exitTime) {
        const day = new Date(t.exitTime).getDay();
        if (!dailyStats[day]) {
          dailyStats[day] = { trades: 0, profit: 0 };
        }
        dailyStats[day].trades++;
        dailyStats[day].profit += t.profit || 0;
      }
    });

    const dailyData = Object.entries(dailyStats)
      .map(([day, data]) => ({
        day: days[parseInt(day)],
        trades: data.trades,
        profit: Math.round(data.profit * 100) / 100,
      }));

    const pieData = [
      { 
        name: "صفقات رابحة", 
        value: winningTrades.length, 
        color: "hsl(142, 76%, 36%)" 
      },
      { 
        name: "صفقات خاسرة", 
        value: losingTrades.length, 
        color: "hsl(0, 84%, 60%)" 
      },
    ];

    return {
      profitData,
      pairData,
      pieData,
      dailyData,
    };
  }, [trades]);

  const isLoading = statsLoading || tradesLoading;
  const hasData = stats && stats.totalTrades > 0;

  const displayStats = stats || {
    totalBalance: 0,
    todayProfit: 0,
    todayProfitPercent: 0,
    activeTrades: 0,
    successRate: 0,
    totalTrades: 0,
    winRate: 0,
    avgProfit: 0,
    avgLoss: 0,
    bestTrade: 0,
    worstTrade: 0,
    totalVolume: 0,
  };

  const totalProfit = trades
    .filter(t => t.status === "closed")
    .reduce((sum, t) => sum + (t.profit || 0), 0);

  return (
    <div className="space-y-6 p-6" data-testid="page-stats">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <BarChart3 className="h-6 w-6" />
            الإحصائيات
          </h1>
          <p className="text-muted-foreground">
            تحليل مفصل لأداء التداول
          </p>
        </div>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-[180px]" data-testid="select-time-range">
            <Calendar className="h-4 w-4 ml-2" />
            <SelectValue placeholder="الفترة الزمنية" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="week">هذا الأسبوع</SelectItem>
            <SelectItem value="month">هذا الشهر</SelectItem>
            <SelectItem value="quarter">الربع الحالي</SelectItem>
            <SelectItem value="year">هذا العام</SelectItem>
            <SelectItem value="all">كل الوقت</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {!hasData && !isLoading && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>لا توجد بيانات</AlertTitle>
          <AlertDescription>
            لم يتم تسجيل أي صفقات بعد. ستظهر الإحصائيات هنا بمجرد إتمام صفقات التداول.
          </AlertDescription>
        </Alert>
      )}

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${totalProfit >= 0 ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
                  <Wallet className={`h-5 w-5 ${totalProfit >= 0 ? 'text-green-500' : 'text-red-500'}`} />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">إجمالي الربح</p>
                  <p className={`text-2xl font-bold font-mono ${totalProfit >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {totalProfit >= 0 ? '+' : ''}${Math.round(totalProfit * 100) / 100}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <Activity className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">إجمالي الصفقات</p>
                  <p className="text-2xl font-bold">{displayStats.totalTrades}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <Percent className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">نسبة النجاح</p>
                  <p className="text-2xl font-bold text-primary">{displayStats.winRate}%</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                  <Target className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">حجم التداول</p>
                  <p className="text-2xl font-bold font-mono">
                    ${displayStats.totalVolume.toLocaleString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/10">
                  <TrendingUp className="h-5 w-5 text-green-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">متوسط الربح</p>
                  <p className="text-2xl font-bold font-mono text-green-500">
                    +${displayStats.avgProfit.toFixed(2)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-500/10">
                  <TrendingDown className="h-5 w-5 text-red-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">متوسط الخسارة</p>
                  <p className="text-2xl font-bold font-mono text-red-500">
                    ${displayStats.avgLoss.toFixed(2)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/10">
                  <TrendingUp className="h-5 w-5 text-green-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">أفضل صفقة</p>
                  <p className="text-2xl font-bold font-mono text-green-500">
                    +${displayStats.bestTrade.toFixed(2)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-500/10">
                  <TrendingDown className="h-5 w-5 text-red-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">أسوأ صفقة</p>
                  <p className="text-2xl font-bold font-mono text-red-500">
                    ${displayStats.worstTrade.toFixed(2)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>الأرباح والخسائر الشهرية</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]" data-testid="chart-monthly-pnl">
              {chartData.profitData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData.profitData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis 
                      dataKey="month" 
                      tick={{ fill: 'hsl(var(--muted-foreground))' }}
                    />
                    <YAxis 
                      tick={{ fill: 'hsl(var(--muted-foreground))' }}
                      tickFormatter={(value) => `$${value}`}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                      formatter={(value: number, name: string) => [
                        `$${value}`,
                        name === "profit" ? "الربح" : "الخسارة"
                      ]}
                    />
                    <Legend 
                      formatter={(value) => value === "profit" ? "الربح" : "الخسارة"}
                    />
                    <Bar dataKey="profit" fill="hsl(142, 76%, 36%)" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="loss" fill="hsl(0, 84%, 60%)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-muted-foreground">
                  لا توجد بيانات شهرية
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>توزيع الصفقات</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] flex items-center justify-center" data-testid="chart-trade-distribution">
              {displayStats.totalTrades > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData.pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}`}
                    >
                      {chartData.pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                      formatter={(value: number) => [value, 'صفقات']}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-muted-foreground">
                  لا توجد بيانات
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>الأداء حسب زوج العملة</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]" data-testid="chart-pair-performance">
              {chartData.pairData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData.pairData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis 
                      type="number"
                      tick={{ fill: 'hsl(var(--muted-foreground))' }}
                      tickFormatter={(value) => `$${value}`}
                    />
                    <YAxis 
                      type="category"
                      dataKey="pair" 
                      tick={{ fill: 'hsl(var(--muted-foreground))' }}
                      width={80}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                      formatter={(value: number, name: string) => [
                        name === "profit" ? `$${value}` : value,
                        name === "profit" ? "الربح" : "عدد الصفقات"
                      ]}
                    />
                    <Bar 
                      dataKey="profit" 
                      fill="hsl(var(--primary))" 
                      radius={[0, 4, 4, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-muted-foreground">
                  لا توجد بيانات
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>نشاط التداول اليومي</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]" data-testid="chart-daily-activity">
              {chartData.dailyData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData.dailyData}>
                    <defs>
                      <linearGradient id="colorTrades" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis 
                      dataKey="day" 
                      tick={{ fill: 'hsl(var(--muted-foreground))' }}
                    />
                    <YAxis 
                      tick={{ fill: 'hsl(var(--muted-foreground))' }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                      formatter={(value: number, name: string) => [
                        name === "trades" ? value : `$${value}`,
                        name === "trades" ? "عدد الصفقات" : "الربح"
                      ]}
                    />
                    <Area
                      type="monotone"
                      dataKey="trades"
                      stroke="hsl(var(--primary))"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorTrades)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-muted-foreground">
                  لا توجد بيانات
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
