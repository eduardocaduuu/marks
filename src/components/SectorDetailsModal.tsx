import React, { useState, useMemo } from 'react';
import { ResellerAnalysis } from '../types';
import { generateResellerDetailsCSV } from '../lib/aggregate';
import { downloadCSV } from '../lib/fileParser';

interface SectorDetailsModalProps {
  isOpen: boolean;
  setor: string;
  resellers: ResellerAnalysis[];
  onClose: () => void;
}

type FilterType = 'Todos' | 'Multimarca' | 'Mono-marca' | 'Sem marca';

export function SectorDetailsModal({
  isOpen,
  setor,
  resellers,
  onClose
}: SectorDetailsModalProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<FilterType>('Todos');
  const [sortColumn, setSortColumn] = useState<'nome' | 'codigo' | 'marcas'>('nome');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const filteredResellers = useMemo(() => {
    let result = [...resellers];

    // Filtro por classificação
    if (filter !== 'Todos') {
      result = result.filter(r => r.classification === filter);
    }

    // Filtro por busca
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(r =>
        r.nomeRevendedora.toLowerCase().includes(term) ||
        r.codigoRevendedora.toLowerCase().includes(term)
      );
    }

    // Ordenação
    result.sort((a, b) => {
      let comparison = 0;
      switch (sortColumn) {
        case 'nome':
          comparison = a.nomeRevendedora.localeCompare(b.nomeRevendedora);
          break;
        case 'codigo':
          comparison = a.codigoRevendedora.localeCompare(b.codigoRevendedora);
          break;
        case 'marcas':
          comparison = a.brandCount - b.brandCount;
          break;
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [resellers, filter, searchTerm, sortColumn, sortDirection]);

  const handleSort = (column: 'nome' | 'codigo' | 'marcas') => {
    if (sortColumn === column) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const handleExport = () => {
    const csv = generateResellerDetailsCSV(filteredResellers);
    downloadCSV(csv, `detalhes_${setor.replace(/\s+/g, '_')}.csv`);
  };

  const getBadgeClass = (classification: string) => {
    switch (classification) {
      case 'Multimarca': return 'badge-multi';
      case 'Mono-marca': return 'badge-mono';
      case 'Sem marca': return 'badge-none';
      default: return '';
    }
  };

  const getSortIcon = (column: 'nome' | 'codigo' | 'marcas') => {
    if (sortColumn !== column) return '\u2195';
    return sortDirection === 'asc' ? '\u2191' : '\u2193';
  };

  if (!isOpen) return null;

  const counts = {
    multi: resellers.filter(r => r.classification === 'Multimarca').length,
    mono: resellers.filter(r => r.classification === 'Mono-marca').length,
    sem: resellers.filter(r => r.classification === 'Sem marca').length
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content modal-large" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Detalhes - {setor}</h2>
          <button className="btn-close" onClick={onClose}>x</button>
        </div>

        <div className="modal-body">
          <div className="details-summary">
            <div className="summary-item">
              <span className="label">Total Ativos:</span>
              <span className="value">{resellers.length}</span>
            </div>
            <div className="summary-item">
              <span className="label">Multimarca:</span>
              <span className="value badge-multi">{counts.multi}</span>
            </div>
            <div className="summary-item">
              <span className="label">Mono-marca:</span>
              <span className="value badge-mono">{counts.mono}</span>
            </div>
            <div className="summary-item">
              <span className="label">Sem marca:</span>
              <span className="value badge-none">{counts.sem}</span>
            </div>
          </div>

          <div className="details-controls">
            <div className="search-box">
              <input
                type="text"
                placeholder="Buscar por nome ou código..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="filter-buttons">
              {(['Todos', 'Multimarca', 'Mono-marca', 'Sem marca'] as FilterType[]).map(f => (
                <button
                  key={f}
                  className={`filter-btn ${filter === f ? 'active' : ''}`}
                  onClick={() => setFilter(f)}
                >
                  {f}
                </button>
              ))}
            </div>

            <button className="btn-export" onClick={handleExport}>
              Exportar CSV
            </button>
          </div>

          <div className="details-table-container">
            <table className="details-table">
              <thead>
                <tr>
                  <th onClick={() => handleSort('codigo')} className="sortable">
                    Código {getSortIcon('codigo')}
                  </th>
                  <th onClick={() => handleSort('nome')} className="sortable">
                    Nome {getSortIcon('nome')}
                  </th>
                  <th onClick={() => handleSort('marcas')} className="sortable">
                    Qtd Marcas {getSortIcon('marcas')}
                  </th>
                  <th>Marcas</th>
                  <th>Classificação</th>
                </tr>
              </thead>
              <tbody>
                {filteredResellers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="no-data">
                      Nenhum revendedor encontrado
                    </td>
                  </tr>
                ) : (
                  filteredResellers.map((reseller, idx) => (
                    <tr key={`${reseller.codigoRevendedora}-${idx}`}>
                      <td>{reseller.codigoRevendedora || '-'}</td>
                      <td>{reseller.nomeRevendedora}</td>
                      <td className="center">{reseller.brandCount}</td>
                      <td>
                        {reseller.brandsPurchased.length > 0
                          ? reseller.brandsPurchased.join(', ')
                          : '-'}
                      </td>
                      <td>
                        <span className={`badge ${getBadgeClass(reseller.classification)}`}>
                          {reseller.classification}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="table-footer">
            <span>Exibindo {filteredResellers.length} de {resellers.length} revendedores</span>
          </div>
        </div>
      </div>
    </div>
  );
}
