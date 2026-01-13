import React, { useState, useMemo } from 'react';
import { GeralOnlyResult, ActiveReseller } from '../types';
import { downloadExcel } from '../lib/fileParser';

interface GeralDashboardPageProps {
  result: GeralOnlyResult;
  onGoToUpload: () => void;
}

export function GeralDashboardPage({ result, onGoToUpload }: GeralDashboardPageProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortColumn, setSortColumn] = useState<'setor' | 'total'>('setor');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [viewMode, setViewMode] = useState<'sectors' | 'resellers'>('sectors');
  const [resellerSearch, setResellerSearch] = useState('');
  const [resellerSortColumn, setResellerSortColumn] = useState<keyof ActiveReseller>('nomeRevendedora');
  const [resellerSortDirection, setResellerSortDirection] = useState<'asc' | 'desc'>('asc');

  const filteredSectorSummaries = useMemo(() => {
    let summaries = [...result.sectorSummaries];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      summaries = summaries.filter(s => s.setor.toLowerCase().includes(term));
    }

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

  const filteredResellers = useMemo(() => {
    let resellers = [...result.resellers];

    if (resellerSearch) {
      const term = resellerSearch.toLowerCase();
      resellers = resellers.filter(r =>
        r.nomeRevendedora.toLowerCase().includes(term) ||
        r.codigoRevendedora.toLowerCase().includes(term) ||
        r.setor.toLowerCase().includes(term)
      );
    }

    resellers.sort((a, b) => {
      const aVal = a[resellerSortColumn];
      const bVal = b[resellerSortColumn];

      let comparison = 0;
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        comparison = aVal.localeCompare(bVal);
      }

      return resellerSortDirection === 'asc' ? comparison : -comparison;
    });

    return resellers;
  }, [result.resellers, resellerSearch, resellerSortColumn, resellerSortDirection]);

  const handleSectorSort = (column: 'setor' | 'total') => {
    if (sortColumn === column) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const handleResellerSort = (column: keyof ActiveReseller) => {
    if (resellerSortColumn === column) {
      setResellerSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setResellerSortColumn(column);
      setResellerSortDirection('asc');
    }
  };

  const handleExportSectors = () => {
    const headers = ['Setor', 'Quantidade de Ativos'];
    const rows = filteredSectorSummaries.map(s => [s.setor, s.total]);
    downloadExcel(headers, rows, `ativos_por_setor_${result.cicloSelecionado}.xlsx`);
  };

  const handleExportResellers = () => {
    const headers = ['Codigo', 'Nome', 'Setor', 'Ciclo'];
    const rows = filteredResellers.map(r => [
      r.codigoRevendedora,
      r.nomeRevendedora,
      r.setor,
      r.cicloFaturamento
    ]);
    downloadExcel(headers, rows, `revendedores_ativos_${result.cicloSelecionado}.xlsx`);
  };

  const getSortIcon = (column: string, currentColumn: string, direction: 'asc' | 'desc') => {
    if (currentColumn !== column) return '\u2195';
    return direction === 'asc' ? '\u2191' : '\u2193';
  };

  return (
    <div className="dashboard-page">
      <div className="page-header">
        <div className="header-left">
          <h1>Revendedores Ativos</h1>
          <p>Ciclo: {result.cicloSelecionado}</p>
        </div>
        <div className="header-actions">
          <button className="btn-secondary" onClick={onGoToUpload}>
            Novo Upload
          </button>
        </div>
      </div>

      <div className="stats-cards">
        <div className="stat-card">
          <h3>Total de Ativos</h3>
          <div className="stat-value">{result.totalAtivos.toLocaleString()}</div>
        </div>
        <div className="stat-card">
          <h3>Setores</h3>
          <div className="stat-value">{result.sectorSummaries.length}</div>
        </div>
      </div>

      <div className="view-toggle">
        <button
          className={`toggle-btn ${viewMode === 'sectors' ? 'active' : ''}`}
          onClick={() => setViewMode('sectors')}
        >
          Por Setor
        </button>
        <button
          className={`toggle-btn ${viewMode === 'resellers' ? 'active' : ''}`}
          onClick={() => setViewMode('resellers')}
        >
          Lista de Revendedores
        </button>
      </div>

      {viewMode === 'sectors' && (
        <div className="table-section">
          <div className="table-header">
            <h2>Ativos por Setor</h2>
            <div className="table-controls">
              <input
                type="text"
                placeholder="Buscar setor..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
              <button className="btn-export" onClick={handleExportSectors}>
                Exportar Excel
              </button>
            </div>
          </div>

          <div className="table-container">
            <table className="summary-table">
              <thead>
                <tr>
                  <th onClick={() => handleSectorSort('setor')} className="sortable">
                    Setor {getSortIcon('setor', sortColumn, sortDirection)}
                  </th>
                  <th onClick={() => handleSectorSort('total')} className="sortable center">
                    Ativos {getSortIcon('total', sortColumn, sortDirection)}
                  </th>
                  <th className="center">%</th>
                </tr>
              </thead>
              <tbody>
                {filteredSectorSummaries.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="no-data">
                      Nenhum setor encontrado
                    </td>
                  </tr>
                ) : (
                  filteredSectorSummaries.map(summary => (
                    <tr key={summary.setor}>
                      <td>{summary.setor}</td>
                      <td className="center">{summary.total.toLocaleString()}</td>
                      <td className="center">
                        {((summary.total / result.totalAtivos) * 100).toFixed(1)}%
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {viewMode === 'resellers' && (
        <div className="table-section">
          <div className="table-header">
            <h2>Lista de Revendedores ({filteredResellers.length.toLocaleString()})</h2>
            <div className="table-controls">
              <input
                type="text"
                placeholder="Buscar por nome, codigo ou setor..."
                value={resellerSearch}
                onChange={(e) => setResellerSearch(e.target.value)}
                className="search-input"
              />
              <button className="btn-export" onClick={handleExportResellers}>
                Exportar Excel
              </button>
            </div>
          </div>

          <div className="table-container">
            <table className="summary-table">
              <thead>
                <tr>
                  <th onClick={() => handleResellerSort('codigoRevendedora')} className="sortable">
                    Codigo {getSortIcon('codigoRevendedora', resellerSortColumn, resellerSortDirection)}
                  </th>
                  <th onClick={() => handleResellerSort('nomeRevendedora')} className="sortable">
                    Nome {getSortIcon('nomeRevendedora', resellerSortColumn, resellerSortDirection)}
                  </th>
                  <th onClick={() => handleResellerSort('setor')} className="sortable">
                    Setor {getSortIcon('setor', resellerSortColumn, resellerSortDirection)}
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredResellers.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="no-data">
                      Nenhum revendedor encontrado
                    </td>
                  </tr>
                ) : (
                  filteredResellers.slice(0, 500).map((reseller, index) => (
                    <tr key={`${reseller.codigoRevendedora}-${index}`}>
                      <td>{reseller.codigoRevendedora || '-'}</td>
                      <td>{reseller.nomeRevendedora}</td>
                      <td>{reseller.setor}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
            {filteredResellers.length > 500 && (
              <p className="table-limit-msg">
                Mostrando 500 de {filteredResellers.length.toLocaleString()} revendedores.
                Use a busca para filtrar ou exporte para Excel para ver todos.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
