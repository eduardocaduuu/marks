/**
 * Funções para parsing de arquivos Excel/CSV usando SheetJS
 */

import * as XLSX from 'xlsx';
import { RawRow } from '../types';

/**
 * Faz parse de um arquivo Excel ou CSV
 */
export async function parseFile(file: File): Promise<{ data: RawRow[]; columns: string[] }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = e.target?.result;

        if (!data) {
          reject(new Error('Falha ao ler arquivo'));
          return;
        }

        const workbook = XLSX.read(data, { type: 'array' });

        // Usa primeira planilha
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];

        // Converte para JSON
        const jsonData = XLSX.utils.sheet_to_json<RawRow>(worksheet, {
          defval: '',
          raw: false // Converte tudo para string para evitar problemas
        });

        // Extrai nomes das colunas
        const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
        const columns: string[] = [];

        for (let col = range.s.c; col <= range.e.c; col++) {
          const cellAddress = XLSX.utils.encode_cell({ r: range.s.r, c: col });
          const cell = worksheet[cellAddress];
          columns.push(cell?.v?.toString() || `Coluna${col + 1}`);
        }

        resolve({ data: jsonData, columns });
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = () => {
      reject(new Error('Erro ao ler arquivo'));
    };

    reader.readAsArrayBuffer(file);
  });
}

/**
 * Faz download de um arquivo CSV
 */
export function downloadCSV(content: string, filename: string): void {
  const blob = new Blob(['\ufeff' + content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
