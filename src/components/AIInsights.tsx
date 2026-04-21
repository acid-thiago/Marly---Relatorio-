import React, { useState, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import { AdData, ReportStats } from '../types';
import { Brain, Sparkles, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';

interface AIInsightsProps {
  data: AdData[];
  stats: ReportStats;
}

export const AIInsights: React.FC<AIInsightsProps> = ({ data, stats }) => {
  const [insights, setInsights] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  const generateInsights = async () => {
    setLoading(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
      
      const prompt = `
        Você é um especialista sênior em mídia paga da "Acid Mkt & Vds". 
        Analise os seguintes dados de tráfego e forneça um relatório explicativo conciso e de alto impacto em Português Brasileiro.
        
        PRINCIPAIS ESTATÍSTICAS:
        - Investimento Total: R$${stats.totalSpend.toFixed(2)}
        - Total de Impressões: ${stats.totalImpressions}
        - Total de Cliques: ${stats.totalClicks}
        - Total de Conversões (Leads): ${stats.totalConversions}
        - CPC Médio: R$${stats.avgCpc.toFixed(2)}
        - CTR Médio: ${stats.avgCtr.toFixed(2)}%
        - CPA Médio: R$${stats.avgCpa.toFixed(2)}
        
        TENDÊNCIAS DOS DADOS:
        ${data.slice(0, 10).map(d => `- ${d.day}: Gastou R$${d.amountSpent}, Cliques: ${d.linkClicks}, Conversões: ${d.conversions}`).join('\n')}
        
        OBJETIVO:
        1. Explique o que esses números significam para o negócio.
        2. Identifique se o desempenho está bom ou precisa de melhorias (CTR/CPA/CPC).
        3. Sugira um plano de ação claro para os próximos 7 dias.
        4. Mantenha um tom profissional, estratégico e encorajador.
        
        FORMATO:
        Use markdown profissional com cabeçalhos. Limite a menos de 250 palavras.
      `;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
      });

      setInsights(response.text || 'Nenhum insight disponível.');
    } catch (error) {
      console.error('Erro ao gerar insights de IA:', error);
      setInsights('Falha ao gerar insights de IA. Verifique seus dados ou tente novamente mais tarde.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (data.length > 0) {
      generateInsights();
    }
  }, [data]);

  return (
    <div className="panel bg-[#0F0F0F] rounded-none border-zinc-800">
      <div className="flex items-center justify-between mb-6 border-b border-zinc-800 pb-4">
        <div className="flex items-center gap-2">
          <Brain className="w-4 h-4 text-acid-green" />
          <h2 className="text-xs font-bold tracking-widest uppercase text-white">Inteligência Estratégica Alpha</h2>
        </div>
        <button 
          onClick={generateInsights}
          disabled={loading}
          className="flex items-center gap-1.5 text-[9px] font-black text-acid-green hover:opacity-80 transition-opacity disabled:opacity-50 tracking-tighter"
        >
          <Sparkles className="w-3 h-3" />
          RECALCULAR
        </button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-12 gap-3">
          <Loader2 className="w-6 h-6 text-acid-green animate-spin" />
          <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest bg-zinc-900 px-3 py-1 rounded">Processando Vetores de Desempenho...</p>
        </div>
      ) : (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-zinc-300 font-sans"
        >
          <div className="whitespace-pre-wrap leading-relaxed text-[11px] font-medium selection:bg-acid-green selection:text-black">
            {insights}
          </div>
        </motion.div>
      )}
    </div>
  );
};
