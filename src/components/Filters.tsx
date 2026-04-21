import React from 'react';
import { Calendar, Tag } from 'lucide-react';

interface FiltersProps {
  dateRange: { start: string; end: string };
  setDateRange: (range: { start: string; end: string }) => void;
  selectedCampaign: string;
  setSelectedCampaign: (campaign: string) => void;
  campaigns: string[];
}

export const Filters: React.FC<FiltersProps> = ({ 
  dateRange, 
  setDateRange, 
  selectedCampaign, 
  setSelectedCampaign, 
  campaigns 
}) => {
  return (
    <div className="flex flex-wrap gap-4 items-end">
      <div className="flex flex-col">
        <label className="text-[10px] text-zinc-500 uppercase font-semibold mb-1 flex items-center gap-1">
          <Calendar className="w-2 h-2" /> Data Inicial
        </label>
        <input 
          type="date" 
          value={dateRange.start}
          onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
        />
      </div>

      <div className="flex flex-col">
        <label className="text-[10px] text-zinc-500 uppercase font-semibold mb-1 flex items-center gap-1">
          <Calendar className="w-2 h-2" /> Data Final
        </label>
        <input 
          type="date" 
          value={dateRange.end}
          onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
        />
      </div>

      <div className="flex flex-col">
        <label className="text-[10px] text-zinc-500 uppercase font-semibold mb-1 flex items-center gap-1">
          <Tag className="w-2 h-2" /> Filtro de Campanha
        </label>
        <select 
          value={selectedCampaign}
          onChange={(e) => setSelectedCampaign(e.target.value)}
        >
          <option value="All">Todas as Campanhas Ativas</option>
          {campaigns.map(c => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>
    </div>
  );
};
