import React, { useState, useEffect, useMemo } from 'react';
import { fetchSheetData } from './services/sheetService';
import { AdData, ReportStats } from './types';
import { Filters } from './components/Filters';
import { AIInsights } from './components/AIInsights';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, AreaChart, Area 
} from 'recharts';
import { 
  TrendingUp, Users, MousePointer2, MessageSquare, DollarSign, Target, Activity, 
  RefreshCw, TrendingDown, LayoutDashboard, FileText
} from 'lucide-react';
import { format, subDays, isWithinInterval, parseISO } from 'date-fns';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const [rawData, setRawData] = useState<AdData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [dateRange, setDateRange] = useState({
    start: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
    end: format(new Date(), 'yyyy-MM-dd')
  });
  const [selectedCampaign, setSelectedCampaign] = useState('All');

  const fetchData = async () => {
    setLoading(true);
    try {
      const data = await fetchSheetData();
      setRawData(data);
      
      // Update date range based on actual data
      if (data.length > 0) {
        const sorted = [...data].sort((a,b) => parseISO(a.day).getTime() - parseISO(b.day).getTime());
        setDateRange({
          start: sorted[0].day,
          end: sorted[sorted.length - 1].day
        });
      }
    } catch (err) {
      setError('Failed to load performance data. Please ensure the Google Sheet is public.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const campaigns = useMemo(() => {
    return Array.from(new Set(rawData.map(d => d.campaignName))).filter(Boolean);
  }, [rawData]);

  const filteredData = useMemo(() => {
    return rawData.filter(d => {
      const dateOk = isWithinInterval(parseISO(d.day), {
        start: parseISO(dateRange.start),
        end: parseISO(dateRange.end)
      });
      const campaignOk = selectedCampaign === 'All' || d.campaignName === selectedCampaign;
      return dateOk && campaignOk;
    }).sort((a,b) => parseISO(a.day).getTime() - parseISO(b.day).getTime());
  }, [rawData, dateRange, selectedCampaign]);

  const stats = useMemo<ReportStats>(() => {
    if (filteredData.length === 0) return {
      totalSpend: 0, totalImpressions: 0, totalClicks: 0, totalConversions: 0,
      avgCpc: 0, avgCtr: 0, avgCpa: 0
    };

    const totals = filteredData.reduce((acc, curr) => ({
      spend: acc.spend + curr.amountSpent,
      impressions: acc.impressions + curr.impressions,
      clicks: acc.clicks + curr.linkClicks,
      conversions: acc.conversions + curr.conversions
    }), { spend: 0, impressions: 0, clicks: 0, conversions: 0 });

    return {
      totalSpend: totals.spend,
      totalImpressions: totals.impressions,
      totalClicks: totals.clicks,
      totalConversions: totals.conversions,
      avgCpc: totals.clicks > 0 ? totals.spend / totals.clicks : 0,
      avgCtr: totals.impressions > 0 ? (totals.clicks / totals.impressions) * 100 : 0,
      avgCpa: totals.conversions > 0 ? totals.spend / totals.conversions : 0
    };
  }, [filteredData]);

  const chartData = useMemo(() => {
    // Group by date for the chart
    const grouped = filteredData.reduce((acc, curr) => {
      if (!acc[curr.day]) {
        acc[curr.day] = { day: curr.day, spend: 0, clicks: 0, conversions: 0 };
      }
      acc[curr.day].spend += curr.amountSpent;
      acc[curr.day].clicks += curr.linkClicks;
      acc[curr.day].conversions += curr.conversions;
      return acc;
    }, {} as any);

    return Object.values(grouped).sort((a: any, b: any) => parseISO(a.day).getTime() - parseISO(b.day).getTime());
  }, [filteredData]);

  if (loading && rawData.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark-bg">
        <div className="flex flex-col items-center gap-4">
          <RefreshCw className="w-10 h-10 text-acid-green animate-spin" />
          <h2 className="text-xl font-display text-white animate-pulse">Iniciando Motor Analítico...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col pt-4">
      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end px-8 pt-8 pb-6 border-b border-white/10 gap-6">
        <div className="flex flex-col">
          <h1 className="acid-header text-5xl md:text-6xl text-white">ACID MKT & VDS</h1>
          <p className="text-[10px] tracking-widest text-zinc-500 mt-1 uppercase font-semibold">
            Motor de Marketing de Performance // Relatórios em Tempo Real
          </p>
        </div>
        
        <div className="flex flex-wrap gap-4 items-end">
          <Filters 
            dateRange={dateRange} 
            setDateRange={setDateRange} 
            selectedCampaign={selectedCampaign}
            setSelectedCampaign={setSelectedCampaign}
            campaigns={campaigns}
          />
          <div className="pb-3 text-[10px] font-mono text-acid-green flex items-center gap-2">
            <span className="sync-dot"></span>
            SINCRONIZADO AO VIVO
          </div>
        </div>
      </header>

      <main className="flex-1 p-8 grid grid-cols-12 gap-6">
        {error && (
          <div className="col-span-12 bg-red-900/20 border border-red-800 text-red-400 px-4 py-3 rounded text-xs flex items-center gap-3">
             <RefreshCw className="w-4 h-4 animate-spin" />
             {error}
          </div>
        )}

        {/* KPIs */}
        <div className="col-span-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard 
            label="Investimento Total" 
            value={`R$ ${stats.totalSpend.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} 
            icon={<DollarSign className="w-4 h-4" />}
          />
          <StatCard 
            label="Conversões" 
            value={stats.totalConversions.toString()} 
            icon={<MessageSquare className="w-4 h-4" />}
          />
          <StatCard 
            label="Custo Médio p/ Conv." 
            value={`R$ ${stats.avgCpa.toFixed(2).replace('.', ',')}`} 
            icon={<Target className="w-4 h-4" />}
          />
          <StatCard 
            label="CTR da Campanha" 
            value={`${stats.avgCtr.toFixed(2).replace('.', ',')}%`} 
            icon={<TrendingUp className="w-4 h-4" />}
          />
        </div>

        <div className="col-span-12 lg:col-span-8 space-y-6">
          {/* Main Chart */}
          <div className="panel">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-sm uppercase font-bold tracking-wider">Tendência de Desempenho Diário</h3>
              <div className="flex gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-acid-green"></div>
                  <span className="text-[10px] text-zinc-400 uppercase">Leads</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-zinc-600"></div>
                  <span className="text-[10px] text-zinc-400 uppercase">Investimento</span>
                </div>
              </div>
            </div>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorSpend" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#52525b" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#52525b" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorLeads" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#CCFF00" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#CCFF00" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#262626" />
                  <XAxis 
                    dataKey="day" 
                    tickFormatter={(val) => format(parseISO(val), 'MMM d')}
                    tick={{ fontSize: 9, fill: '#52525b' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis hide />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#141414', 
                      borderRadius: '4px', 
                      border: '1px solid #262626',
                      fontSize: '10px'
                    }}
                    labelStyle={{ fontStyle: 'bold', color: '#CCFF00', marginBottom: '4px' }}
                  />
                  <Area 
                    type="stepAfter" 
                    dataKey="spend" 
                    name="Investimento"
                    stroke="#52525b" 
                    strokeWidth={2}
                    fill="url(#colorSpend)" 
                  />
                  <Area 
                    type="stepAfter" 
                    dataKey="conversions" 
                    name="Leads"
                    stroke="#CCFF00" 
                    strokeWidth={2}
                    fill="url(#colorLeads)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Performance Table */}
          <div className="col-span-12 overflow-hidden">
            <table className="w-full text-left text-[11px]">
              <thead className="bg-zinc-900 text-zinc-500 uppercase text-[9px] tracking-widest border-b border-zinc-800">
                <tr>
                  <th className="py-3 px-4">Nome da Campanha</th>
                  <th className="py-3 px-4">Gasto</th>
                  <th className="py-3 px-4">Alcance</th>
                  <th className="py-3 px-4">CTR</th>
                  <th className="py-3 px-4">Leads</th>
                  <th className="py-3 px-4">CPL</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800 font-mono">
                {filteredData.slice(-10).reverse().map((d, i) => (
                  <tr key={i} className="data-row hover:bg-white/5 transition-colors group">
                    <td className="py-3 px-4 font-sans text-zinc-200">{d.campaignName}</td>
                    <td className="py-3 px-4">R$ {d.amountSpent.toFixed(2).replace('.', ',')}</td>
                    <td className="py-3 px-4">{Math.round(d.reach/1000)}k</td>
                    <td className="py-3 px-4">{d.ctr.toFixed(2).replace('.', ',')}%</td>
                    <td className="py-3 px-4">{d.conversions}</td>
                    <td className="py-3 px-4 text-acid-green">R$ {d.cpa.toFixed(2).replace('.', ',')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Sidebar */}
        <div className="col-span-12 lg:col-span-4 flex flex-col gap-6">
          <AIInsights data={filteredData} stats={stats} />
          
          <div className="panel bg-zinc-900 border-zinc-800">
            <h3 className="text-xs uppercase font-bold tracking-widest mb-6 flex items-center gap-2">
              <Users className="w-4 h-4 text-acid-green" />
              Métricas de Público
            </h3>
            <div className="space-y-4">
              <MetricRow label="Alcance" value={stats.totalImpressions.toLocaleString()} />
              <MetricRow label="Cliques" value={stats.totalClicks.toLocaleString()} />
              <MetricRow label="CPC Médio" value={`R$ ${stats.avgCpc.toFixed(2).replace('.', ',')}`} />
            </div>
            
            <div className="mt-8 pt-6 border-t border-zinc-800">
               <div className="flex justify-between items-end mb-2">
                  <span className="text-[10px] uppercase font-bold text-zinc-500">Progresso da Meta de Leads</span>
                  <span className="text-xs font-mono text-acid-green">{Math.round((stats.totalConversions/500)*100)}%</span>
               </div>
               <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
                 <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min((stats.totalConversions/500)*100, 100)}%` }}
                    className="h-full bg-acid-green shadow-[0_0_8px_#CCFF00]" 
                 />
               </div>
            </div>
          </div>

          <div className="bg-acid-green p-6 rounded text-black shadow-lg">
             <h3 className="text-xs font-black uppercase tracking-tighter">Status de Crescimento</h3>
             <p className="text-xs font-bold leading-tight mt-2 italic">"Escale mais rápido. Otimizado para alto volume de conversão."</p>
             <button className="w-full mt-4 py-2 bg-black text-white font-bold text-[10px] uppercase tracking-widest hover:bg-zinc-900 transition-colors">
               Exportar Dados Brutos
             </button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="px-8 py-4 bg-black border-t border-white/5 flex flex-col md:flex-row justify-between items-center text-[9px] text-zinc-600 uppercase tracking-widest gap-2">
        <div>Desenvolvido por ACID Analytics Suite &copy; {format(new Date(), 'yyyy')}</div>
        <div className="flex gap-6">
          <span>Fonte: Google Sheets API</span>
          <span>Última Sincronização: {format(new Date(), 'HH:mm aaa')}</span>
        </div>
      </footer>
    </div>
  );
}

function StatCard({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <motion.div 
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className="stat-card"
    >
      <div className="text-[10px] uppercase text-zinc-400 font-bold mb-1 tracking-wider">{label}</div> 
      <div className="text-3xl font-bold font-mono text-white leading-none mb-1">{value}</div>
      <div className="text-[9px] text-acid-green font-mono uppercase tracking-tighter opacity-80">Eficiência Máxima</div>
    </motion.div>
  );
}

function MetricRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-zinc-800 last:border-0 hover:bg-white/2 px-2 -mx-2 transition-colors">
      <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">{label}</span>
      <span className="font-mono text-xs font-semibold text-white">{value}</span>
    </div>
  );
}


