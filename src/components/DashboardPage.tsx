import React, { useState, useMemo } from 'react';
import { ProcessingResult, SectorSummary, ResellerAnalysis } from '../types';
import { SectorDetailsModal } from './SectorDetailsModal';
import { downloadExcel } from '../lib/fileParser';

interface DashboardPageProps {
  result: ProcessingResult;
  onGoToUpload: () => void;
  onGoToAudit: () => void;
}

export function DashboardPage({ result, onGoToUpload, onGoToAudit }: DashboardPageProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortColumn, setSortColumn] = useState<keyof SectorSummary>('setor');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [selectedSetor, setSelectedSetor] = useState<string | null>(null);

  const filteredSummaries = useMemo(() => {
    let summaries = [...result.sectorSummaries];

    // Filtro por busca
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      summaries = summaries.filter(s => s.setor.toLowerCase().includes(term));
    }

    // Ordenação
    summaries.sort((a, b) => {
      const aVal = a[sortColumn];
      const bVal = b[sortColumn];

      let comparison = 0;
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        comparison = aVal.localeCompare(bVal);
      } else if (typeof aVal === 'number' && typeof bVal === 'number') {
        comparison = aVal - bVal;
      }

      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return summaries;
  }, [result.sectorSummaries, searchTerm, sortColumn, sortDirection]);

  const handleSort = (column: keyof SectorSummary) => {
    if (sortColumn === column) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const handleExportSummary = () => {
    const headers = ['Setor', 'Ativos', 'Multimarca', '% Multimarca', 'Mono-marca', '% Mono-marca', 'Sem marca', '% Sem marca'];
    const rows = filteredSummaries.map(s => [
      s.setor,
      s.totalAtivos,
      s.multimarca,
      Number(s.percentMultimarca.toFixed(2)),
      s.monomarca,
      Number(s.percentMonomarca.toFixed(2)),
      s.semMarca,
      Number(s.percentSemMarca.toFixed(2))
    ]);
    downloadExcel(headers, rows, 'resumo_por_setor.xlsx');
  };

  const getSortIcon = (column: keyof SectorSummary) => {
    if (sortColumn !== column) return '\u2195';
    return sortDirection === 'asc' ? '\u2191' : '\u2193';
  };

  const getResellersBySetor = (setor: string): ResellerAnalysis[] => {
    return result.resellers.filter(r => r.setor === setor);
  };

  // Totais gerais
  const totals = useMemo(() => {
    const totalAtivos = result.sectorSummaries.reduce((sum, s) => sum + s.totalAtivos, 0);
    const totalMulti = result.sectorSummaries.reduce((sum, s) => sum + s.multimarca, 0);
    const totalMono = result.sectorSummaries.reduce((sum, s) => sum + s.monomarca, 0);
    const totalSem = result.sectorSummaries.reduce((sum, s) => sum + s.semMarca, 0);

    return {
      ativos: totalAtivos,
      multi: totalMulti,
      percentMulti: totalAtivos > 0 ? (totalMulti / totalAtivos) * 100 : 0,
      mono: totalMono,
      percentMono: totalAtivos > 0 ? (totalMono / totalAtivos) * 100 : 0,
      sem: totalSem,
      percentSem: totalAtivos > 0 ? (totalSem / totalAtivos) * 100 : 0
    };
  }, [result.sectorSummaries]);

  return (
    <div className="dashboard-page">
      <div className="page-header">
        <div className="header-left">
          <h1>Dashboard - Análise Multimarca</h1>
          <p>Ciclo: {result.audit.cicloSelecionado}</p>
        </div>
        <div className="header-actions">
          <button className="btn-secondary" onClick={onGoToAudit}>
            Ver Auditoria
          </button>
          <button className="btn-secondary" onClick={onGoToUpload}>
            Novo Upload
          </button>
        </div>
      </div>

      <div className="stats-cards">
        <div className="stat-card">
          <h3>Total Ativos</h3>
          <div className="stat-value">{totals.ativos.toLocaleString()}</div>
        </div>
        <div className="stat-card stat-multi">
          <h3>Multimarca</h3>
          <div className="stat-value">{totals.multi.toLocaleString()}</div>
          <div className="stat-percent">{totals.percentMulti.toFixed(1)}%</div>
        </div>
        <div className="stat-card stat-mono">
          <h3>Mono-marca</h3>
          <div className="stat-value">{totals.mono.toLocaleString()}</div>
          <div className="stat-percent">{totals.percentMono.toFixed(1)}%</div>
        </div>
        <div className="stat-card stat-none">
          <h3>Sem marca</h3>
          <div className="stat-value">{totals.sem.toLocaleString()}</div>
          <div className="stat-percent">{totals.percentSem.toFixed(1)}%</div>
        </div>
      </div>

      <div className="brand-stats">
        <h3>Compras por Marca</h3>
        <div className="brand-bars">
          {Object.entries(result.audit.totalPorMarca).map(([brand, count]) => {
            const percent = totals.ativos > 0 ? (count / totals.ativos) * 100 : 0;
            return (
              <div key={brand} className="brand-bar">
                <div className="brand-label">
                  <span>{brand}</span>
                  <span>{count.toLocaleString()} ({percent.toFixed(1)}%)</span>
                </div>
                <div className="bar-container">
                  <div className="bar-fill" style={{ width: `${percent}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="table-section">
        <div className="table-header">
          <h2>Resumo por Setor</h2>
          <div className="table-controls">
            <input
              type="text"
              placeholder="Buscar setor..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
            <button className="btn-export" onClick={handleExportSummary}>
              Exportar Excel
            </button>
          </div>
        </div>

        <div className="table-container">
          <table className="summary-table">
            <thead>
              <tr>
                <th onClick={() => handleSort('setor')} className="sortable">
                  Setor {getSortIcon('setor')}
                </th>
                <th onClick={() => handleSort('totalAtivos')} className="sortable center">
                  Ativos {getSortIcon('totalAtivos')}
                </th>
                <th onClick={() => handleSort('multimarca')} className="sortable center">
                  Multimarca {getSortIcon('multimarca')}
                </th>
                <th onClick={() => handleSort('percentMultimarca')} className="sortable center">
                  % Multi {getSortIcon('percentMultimarca')}
                </th>
                <th onClick={() => handleSort('monomarca')} className="sortable center">
                  Mono-marca {getSortIcon('monomarca')}
                </th>
                <th onClick={() => handleSort('percentMonomarca')} className="sortable center">
                  % Mono {getSortIcon('percentMonomarca')}
                </th>
                <th onClick={() => handleSort('semMarca')} className="sortable center">
                  Sem marca {getSortIcon('semMarca')}
                </th>
                <th onClick={() => handleSort('percentSemMarca')} className="sortable center">
                  % Sem {getSortIcon('percentSemMarca')}
                </th>
                <th className="center">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredSummaries.length === 0 ? (
                <tr>
                  <td colSpan={9} className="no-data">
                    Nenhum setor encontrado
                  </td>
                </tr>
              ) : (
                filteredSummaries.map(summary => (
                  <tr key={summary.setor}>
                    <td>{summary.setor}</td>
                    <td className="center">{summary.totalAtivos.toLocaleString()}</td>
                    <td className="center">{summary.multimarca.toLocaleString()}</td>
                    <td className="center highlight-multi">
                      {summary.percentMultimarca.toFixed(1)}%
                    </td>
                    <td className="center">{summary.monomarca.toLocaleString()}</td>
                    <td className="center highlight-mono">
                      {summary.percentMonomarca.toFixed(1)}%
                    </td>
                    <td className="center">{summary.semMarca.toLocaleString()}</td>
                    <td className="center highlight-none">
                      {summary.percentSemMarca.toFixed(1)}%
                    </td>
                    <td className="center">
                      <button
                        className="btn-details"
                        onClick={() => setSelectedSetor(summary.setor)}
                      >
                        Ver detalhes
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedSetor && (
        <SectorDetailsModal
          isOpen={!!selectedSetor}
          setor={selectedSetor}
          resellers={getResellersBySetor(selectedSetor)}
          onClose={() => setSelectedSetor(null)}
        />
      )}
    </div>
  );
}
