import React, { useState, useEffect } from 'react';
import { ColumnMapping, FileUploadState } from '../types';

interface ColumnMapperModalProps {
  isOpen: boolean;
  fileKey: string;
  fileState: FileUploadState;
  isGeral: boolean;
  onSave: (mapping: ColumnMapping) => void;
  onClose: () => void;
}

export function ColumnMapperModal({
  isOpen,
  fileKey,
  fileState,
  isGeral,
  onSave,
  onClose
}: ColumnMapperModalProps) {
  const [mapping, setMapping] = useState<Partial<ColumnMapping>>({});

  useEffect(() => {
    if (fileState.mapping) {
      setMapping(fileState.mapping);
    } else {
      setMapping({});
    }
  }, [fileState.mapping, isOpen]);

  if (!isOpen) return null;

  const columns = fileState.columns;

  const handleChange = (field: keyof ColumnMapping, value: string) => {
    setMapping(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    if (isGeral) {
      if (!mapping.codigoRevendedora || !mapping.nomeRevendedora || !mapping.setor || !mapping.cicloFaturamento) {
        alert('Todos os campos obrigatórios devem ser mapeados');
        return;
      }
    } else {
      if (!mapping.codigoRevendedora || !mapping.nomeRevendedora || !mapping.tipo) {
        alert('Todos os campos obrigatórios devem ser mapeados');
        return;
      }
      // Verifica se há ciclo (obrigatório ou fallback)
      if (!mapping.cicloFaturamento && !mapping.cicloCaptacao) {
        alert('É necessário mapear CicloFaturamento ou CicloCaptacao');
        return;
      }
    }

    onSave(mapping as ColumnMapping);
  };

  const renderSelect = (
    field: keyof ColumnMapping,
    label: string,
    required: boolean = true
  ) => (
    <div className="mapping-field">
      <label>
        {label}
        {required && <span className="required">*</span>}
      </label>
      <select
        value={mapping[field] || ''}
        onChange={(e) => handleChange(field, e.target.value)}
      >
        <option value="">Selecione...</option>
        {columns.map(col => (
          <option key={col} value={col}>{col}</option>
        ))}
      </select>
    </div>
  );

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Mapear Colunas - {fileKey}</h2>
          <button className="btn-close" onClick={onClose}>x</button>
        </div>

        <div className="modal-body">
          <p className="modal-description">
            O mapeamento automático falhou. Por favor, selecione manualmente as colunas correspondentes.
          </p>

          <div className="mapping-grid">
            {renderSelect('codigoRevendedora', 'Código da Revendedora')}
            {renderSelect('nomeRevendedora', 'Nome da Revendedora')}

            {isGeral && (
              <>
                {renderSelect('setor', 'Setor')}
                {renderSelect('cicloFaturamento', 'Ciclo de Faturamento')}
              </>
            )}

            {!isGeral && (
              <>
                {renderSelect('tipo', 'Tipo (Venda/etc)')}
                {renderSelect('cicloFaturamento', 'Ciclo de Faturamento', false)}
                {renderSelect('cicloCaptacao', 'Ciclo de Captação (fallback)', false)}
              </>
            )}
          </div>

          {!isGeral && (
            <p className="mapping-hint">
              * Para marcas, mapeie CicloFaturamento OU CicloCaptacao (pelo menos um é obrigatório)
            </p>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>Cancelar</button>
          <button className="btn-primary" onClick={handleSave}>Salvar Mapeamento</button>
        </div>
      </div>
    </div>
  );
}
