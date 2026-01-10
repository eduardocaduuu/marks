import React from 'react';
import { FileUploadCard } from './FileUploadCard';
import { ColumnMapperModal } from './ColumnMapperModal';
import { UploadedFiles, BrandName, ColumnMapping } from '../types';

interface UploadPageProps {
  uploadedFiles: UploadedFiles;
  cycles: string[];
  selectedCycle: string;
  onCycleChange: (cycle: string) => void;
  onFileUpload: (key: 'geral' | BrandName, file: File) => void;
  onClearFile: (key: 'geral' | BrandName) => void;
  onProcess: () => { success: boolean; error?: string };
  canProcess: boolean;
  isProcessing: boolean;
  mappingModalOpen: boolean;
  mappingModalFile: 'geral' | BrandName | null;
  onOpenMappingModal: (key: 'geral' | BrandName) => void;
  onCloseMappingModal: () => void;
  onSaveMapping: (key: 'geral' | BrandName, mapping: ColumnMapping) => void;
}

export function UploadPage({
  uploadedFiles,
  cycles,
  selectedCycle,
  onCycleChange,
  onFileUpload,
  onClearFile,
  onProcess,
  canProcess,
  isProcessing,
  mappingModalOpen,
  mappingModalFile,
  onOpenMappingModal,
  onCloseMappingModal,
  onSaveMapping
}: UploadPageProps) {
  const handleProcess = () => {
    const result = onProcess();
    if (!result.success && result.error) {
      alert(result.error);
    }
  };

  const brandKeys: BrandName[] = ['oBoticário', 'Eudora', 'AuAmigos', 'O.U.I', 'QDB'];

  const getMissingFiles = () => {
    const missing: string[] = [];
    if (!uploadedFiles.geral.loaded) missing.push('Geral');
    brandKeys.forEach(key => {
      if (!uploadedFiles[key].loaded) missing.push(key);
    });
    return missing;
  };

  const getMappingErrors = () => {
    const errors: string[] = [];
    if (uploadedFiles.geral.mappingError) errors.push('Geral');
    brandKeys.forEach(key => {
      if (uploadedFiles[key].mappingError) errors.push(key);
    });
    return errors;
  };

  const missingFiles = getMissingFiles();
  const mappingErrors = getMappingErrors();

  return (
    <div className="upload-page">
      <div className="page-header">
        <h1>Análise Multimarca</h1>
        <p>Faça upload das planilhas para análise de revendedores multimarca</p>
      </div>

      <div className="upload-section">
        <h2>1. Planilha Geral (Base de Ativos)</h2>
        <p className="section-description">
          A planilha Geral contém todos os revendedores ativos no ciclo. Esta é a fonte de verdade.
        </p>

        <div className="upload-grid single">
          <FileUploadCard
            title="Geral"
            fileState={uploadedFiles.geral}
            onUpload={(file) => onFileUpload('geral', file)}
            onClear={() => onClearFile('geral')}
            onFixMapping={() => onOpenMappingModal('geral')}
            required
          />
        </div>
      </div>

      {uploadedFiles.geral.loaded && cycles.length > 0 && (
        <div className="cycle-section">
          <h2>2. Selecione o Ciclo</h2>
          <div className="cycle-selector">
            <select
              value={selectedCycle}
              onChange={(e) => onCycleChange(e.target.value)}
            >
              {cycles.map(cycle => (
                <option key={cycle} value={cycle}>{cycle}</option>
              ))}
            </select>
          </div>
        </div>
      )}

      <div className="upload-section">
        <h2>3. Planilhas de Marcas</h2>
        <p className="section-description">
          Faça upload das 5 planilhas de marcas. Apenas linhas com Tipo="Venda" serão consideradas.
        </p>

        <div className="upload-grid">
          {brandKeys.map(brand => (
            <FileUploadCard
              key={brand}
              title={brand}
              fileState={uploadedFiles[brand]}
              onUpload={(file) => onFileUpload(brand, file)}
              onClear={() => onClearFile(brand)}
              onFixMapping={() => onOpenMappingModal(brand)}
              required
            />
          ))}
        </div>
      </div>

      {missingFiles.length > 0 && (
        <div className="warning-box">
          <h4>Arquivos faltando:</h4>
          <p>{missingFiles.join(', ')}</p>
        </div>
      )}

      {mappingErrors.length > 0 && (
        <div className="error-box">
          <h4>Erros de mapeamento:</h4>
          <p>{mappingErrors.join(', ')} - clique em "Mapear manualmente" para corrigir</p>
        </div>
      )}

      <div className="action-section">
        <button
          className="btn-process"
          onClick={handleProcess}
          disabled={!canProcess || isProcessing}
        >
          {isProcessing ? 'Processando...' : 'Processar Dados'}
        </button>

        {!canProcess && (
          <p className="help-text">
            {!uploadedFiles.geral.loaded
              ? 'Faça upload da planilha Geral para começar'
              : !selectedCycle
              ? 'Selecione um ciclo'
              : missingFiles.length > 0
              ? 'Faça upload de todas as planilhas de marca'
              : mappingErrors.length > 0
              ? 'Corrija os erros de mapeamento'
              : 'Carregue todos os arquivos necessários'}
          </p>
        )}
      </div>

      {mappingModalFile && (
        <ColumnMapperModal
          isOpen={mappingModalOpen}
          fileKey={mappingModalFile}
          fileState={uploadedFiles[mappingModalFile as keyof UploadedFiles]}
          isGeral={mappingModalFile === 'geral'}
          onSave={(mapping) => onSaveMapping(mappingModalFile, mapping)}
          onClose={onCloseMappingModal}
        />
      )}
    </div>
  );
}
