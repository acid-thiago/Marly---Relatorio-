import Papa from 'papaparse';
import { AdData } from '../types';

const SHEET_URL = 'https://docs.google.com/spreadsheets/d/1QcJhNPFMDjE_dfAp_2JWCB0Nv-D-sw_CV3ja29xMKPE/export?format=csv';

const parseBrNumber = (val: string | undefined): number => {
  if (!val) return 0;
  // Replace comma with dot and remove other characters if any
  const normalized = val.replace(',', '.');
  const num = parseFloat(normalized);
  return isNaN(num) ? 0 : num;
};

export const fetchSheetData = async (): Promise<AdData[]> => {
  try {
    const response = await fetch(SHEET_URL);
    const csvText = await response.text();
    
    return new Promise((resolve, reject) => {
      Papa.parse(csvText, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          const parsedData: AdData[] = results.data.map((row: any) => ({
            day: row['Day'] || '',
            campaignName: row['Campaign Name'] || '',
            reach: parseBrNumber(row['Reach']),
            impressions: parseBrNumber(row['Impressions']),
            frequency: parseBrNumber(row['Frequency']),
            amountSpent: parseBrNumber(row['Amount Spent']),
            cpm: parseBrNumber(row['CPM (Cost per 1,000 Impressions)']),
            linkClicks: parseBrNumber(row['Link Clicks']),
            conversions: parseBrNumber(row['Messaging Conversations Started']),
            cpa: parseBrNumber(row['Cost per Messaging Conversations Started']),
            cpc: parseBrNumber(row['CPC (Cost per Link Click)']),
            ctr: parseBrNumber(row['CTR (Link Click-Through Rate)']),
          }));
          resolve(parsedData);
        },
        error: (error: Error) => {
          reject(error);
        }
      });
    });
  } catch (error) {
    console.error('Error fetching sheet data:', error);
    throw error;
  }
};
