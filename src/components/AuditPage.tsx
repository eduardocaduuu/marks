import React, { useState, useMemo } from 'react';
import { AuditData, ResellerAnalysis } from '../types';
import { downloadExcel } from '../lib/fileParser';

interface AuditPageProps {
  audit: AuditData;
  onGoToDashboard: () => void;
  onGoToUpload: () => void;
}

export function AuditPage({ audit, onGoToDashboard, onGoToUpload }: AuditPageProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortColumn, setSortColumn] = useState<'nome' | 'codigo' | 'setor'>('nome');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const filteredSemMarca = useMemo(() => {
    let result = [...audit.semMarcaList];

    // Filtro por busca
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(r =>
        r.nomeRevendedora.toLowerCase().includes(term) ||
        r.codigoRevendedora.toLowerCase().includes(term) ||
        r.setor.toLowerCase().includes(term)
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
        case 'setor':
          comparison = a.setor.localeCompare(b.setor);
          break;
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [audit.semMarcaList, searchTerm, sortColumn, sortDirection]);

  const handleSort = (column: 'nome' | 'codigo' | 'setor') => {
    if (sortColumn === column) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const handleExportSemMarca = () => {
    const headers = ['Código', 'Nome', 'Código Normalizado', 'Nome Normalizado', 'Setor'];
    const rows = filteredSemMarca.map(r => [
      r.codigoRevendedora,
      r.nomeRevendedora,
      r.codigoNormalizado,
      r.nomeNormalizado,
      r.setor
    ]);
    downloadExcel(headers, rows, `sem_marca_ciclo_${audit.cicloSelecionado}.xlsx`);
  };

  const getSortIcon = (column: 'nome' | 'codigo' | 'setor') => {
    if (sortColumn !== column) return '\u2195';
    return sortDirection === 'asc' ? '\u2191' : '\u2193';
  };

  // Calcula percentuais
  const percentMatchCodigo = audit.totalAtivos > 0
    ? (audit.matchedByCodigo / audit.totalAtivos) * 100
    : 0;
  const percentMatchNome = audit.totalAtivos > 0
    ? (audit.matchedByNome / audit.totalAtivos) * 100
    : 0;
  const percentSemMarca = audit.totalAtivos > 0
    ? (audit.semMarca / audit.totalAtivos) * 100
    : 0;
  const totalMatched = audit.matchedByCodigo + audit.matchedByNome;
  const percentMatched = audit.totalAtivos > 0
    ? (totalMatched / audit.totalAtivos) * 100
    : 0;

  return (
    <div className="audit-page">
      <div className="page-header">
        <div className="header-left">
          <h1>Auditoria de Processamento</h1>
          <p>Ciclo: {audit.cicloSelecionado}</p>
        </div>
        <div className="header-actions">
          <button className="btn-secondary" onClick={onGoToDashboard}>
            Ver Dashboard
          </button>
          <button className="btn-secondary" onClick={onGoToUpload}>
            Novo Upload
          </button>
        </div>
      </div>

      <div className="audit-stats">
        <h2>Estatísticas de Matching</h2>

        <div className="audit-grid">
          <div className="audit-card">
            <h3>Total de Ativos (Geral)</h3>
            <div className="audit-value">{audit.totalAtivos.toLocaleString()}</div>
            <p className="audit-description">
              Revendedores únicos na planilha Geral para o ciclo selecionado
            </p>
          </div>

          <div className="audit-card audit-success">
            <h3>Matchados por Código</h3>
            <div className="audit-value">{audit.matchedByCodigo.toLocaleString()}</div>
            <div className="audit-percent">{percentMatchCodigo.toFixed(1)}%</div>
            <p className="audit-description">
              Encontrados nas marcas pelo código da revendedora
            </p>
          </div>

          <div className="audit-card audit-warning">
            <h3>Matchados por Nome (Fallback)</h3>
            <div className="audit-value">{audit.matchedByNome.toLocaleString()}</div>
            <div className="audit-percent">{percentMatchNome.toFixed(1)}%</div>
            <p className="audit-description">
              Código não encontrado, match pelo nome normalizado
            </p>
          </div>

          <div className="audit-card audit-danger">
            <h3>Sem Marca (Não Matchados)</h3>
            <div className="audit-value">{audit.semMarca.toLocaleString()}</div>
            <div className="audit-percent">{percentSemMarca.toFixed(1)}%</div>
            <p className="audit-description">
              Não encontrados em nenhuma planilha de marca
            </p>
          </div>
        </div>

        <div className="audit-summary">
          <div className="summary-bar">
            <div
              className="bar-segment bar-codigo"
              style={{ width: `${percentMatchCodigo}%` }}
              title={`Código: ${percentMatchCodigo.toFixed(1)}%`}
            />
            <div
              className="bar-segment bar-nome"
              style={{ width: `${percentMatchNome}%` }}
              title={`Nome: ${percentMatchNome.toFixed(1)}%`}
            />
            <div
              className="bar-segment bar-sem"
              style={{ width: `${percentSemMarca}%` }}
              title={`Sem marca: ${percentSemMarca.toFixed(1)}%`}
            />
          </div>
          <div className="summary-legend">
            <span className="legend-item">
              <span className="legend-color bar-codigo" /> Código ({percentMatchCodigo.toFixed(1)}%)
            </span>
            <span className="legend-item">
              <span className="legend-color bar-nome" /> Nome ({percentMatchNome.toFixed(1)}%)
            </span>
            <span className="legend-item">
              <span className="legend-color bar-sem" /> Sem marca ({percentSemMarca.toFixed(1)}%)
            </span>
          </div>
        </div>
      </div>

      <div className="audit-brands">
        <h2>Compras Identificadas por Marca</h2>
        <div className="brand-audit-grid">
          {Object.entries(audit.totalPorMarca).map(([brand, count]) => {
            const percent = audit.totalAtivos > 0 ? (count / audit.totalAtivos) * 100 : 0;
            return (
              <div key={brand} className="brand-audit-card">
                <h4>{brand}</h4>
                <div className="brand-count">{count.toLocaleString()}</div>
                <div className="brand-percent">{percent.toFixed(1)}% dos ativos</div>
              </div>
            );
          })}
        </div>
      </div>

      {audit.semMarca > 0 && (
        <div className="sem-marca-section">
          <div className="section-header">
            <h2>Lista de Revendedores "Sem Marca"</h2>
            <p className="section-description">
              Estes revendedores constam na planilha Geral mas não foram encontrados em nenhuma
              planilha de marca. Verifique se há inconsistências de código ou nome.
            </p>
          </div>

          <div className="section-controls">
            <input
              type="text"
              placeholder="Buscar por nome, código ou setor..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
            <button className="btn-export" onClick={handleExportSemMarca}>
              Exportar Excel
            </button>
          </div>

          <div className="table-container">
            <table className="audit-table">
              <thead>
                <tr>
                  <th onClick={() => handleSort('codigo')} className="sortable">
                    Código {getSortIcon('codigo')}
                  </th>
                  <th onClick={() => handleSort('nome')} className="sortable">
                    Nome {getSortIcon('nome')}
                  </th>
                  <th>Código Normalizado</th>
                  <th>Nome Normalizado</th>
                  <th onClick={() => handleSort('setor')} className="sortable">
                    Setor {getSortIcon('setor')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredSemMarca.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="no-data">
                      Nenhum revendedor encontrado
                    </td>
                  </tr>
                ) : (
                  filteredSemMarca.map((r, idx) => (
                    <tr key={`${r.codigoRevendedora}-${idx}`}>
                      <td>{r.codigoRevendedora || '-'}</td>
                      <td>{r.nomeRevendedora}</td>
                      <td className="code-normalized">{r.codigoNormalizado || '-'}</td>
                      <td className="name-normalized">{r.nomeNormalizado}</td>
                      <td>{r.setor}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="table-footer">
            <span>Exibindo {filteredSemMarca.length} de {audit.semMarca} revendedores sem marca</span>
          </div>
        </div>
      )}

      {audit.semMarca === 0 && (
        <div className="success-message">
          <h3>100% de Match!</h3>
          <p>Todos os revendedores ativos foram encontrados em pelo menos uma planilha de marca.</p>
        </div>
      )}
    </div>
  );
}
