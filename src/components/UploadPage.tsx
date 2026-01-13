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
  onProcessGeralOnly: () => { success: boolean; error?: string };
  canProcess: boolean;
  canProcessGeralOnly: boolean;
  isProcessing: boolean;
  analysisMode: 'full' | 'geral-only';
  onAnalysisModeChange: (mode: 'full' | 'geral-only') => void;
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
  onProcessGeralOnly,
  canProcess,
  canProcessGeralOnly,
  isProcessing,
  analysisMode,
  onAnalysisModeChange,
  mappingModalOpen,
  mappingModalFile,
  onOpenMappingModal,
  onCloseMappingModal,
  onSaveMapping
}: UploadPageProps) {
  const handleProcess = () => {
    const result = analysisMode === 'full' ? onProcess() : onProcessGeralOnly();
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
              <option value="TODOS">Todos os ciclos ({cycles.length})</option>
              {cycles.map(cycle => (
                <option key={cycle} value={cycle}>{cycle}</option>
              ))}
            </select>
          </div>
          {selectedCycle === 'TODOS' && (
            <p className="cycle-info">
              Analisando todos os {cycles.length} ciclos: {cycles.join(', ')}
            </p>
          )}
        </div>
      )}

      {uploadedFiles.geral.loaded && selectedCycle && (
        <div className="mode-section">
          <h2>3. Tipo de Analise</h2>
          <p className="section-description">
            Escolha o tipo de analise que deseja realizar.
          </p>
          <div className="mode-selector">
            <button
              className={`mode-btn ${analysisMode === 'geral-only' ? 'active' : ''}`}
              onClick={() => onAnalysisModeChange('geral-only')}
            >
              <span className="mode-title">Apenas Ativos</span>
              <span className="mode-desc">Lista revendedores ativos no ciclo</span>
            </button>
            <button
              className={`mode-btn ${analysisMode === 'full' ? 'active' : ''}`}
              onClick={() => onAnalysisModeChange('full')}
            >
              <span className="mode-title">Analise Multimarca</span>
              <span className="mode-desc">Cruza dados com planilhas de marca</span>
            </button>
          </div>
        </div>
      )}

      {analysisMode === 'full' && (
        <div className="upload-section">
          <h2>4. Planilhas de Marcas</h2>
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
      )}

      {analysisMode === 'full' && missingFiles.length > 0 && (
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
          disabled={analysisMode === 'full' ? (!canProcess || isProcessing) : (!canProcessGeralOnly || isProcessing)}
        >
          {isProcessing ? 'Processando...' : analysisMode === 'full' ? 'Processar Dados' : 'Analisar Ativos'}
        </button>

        {analysisMode === 'full' && !canProcess && (
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

        {analysisMode === 'geral-only' && !canProcessGeralOnly && (
          <p className="help-text">
            {!uploadedFiles.geral.loaded
              ? 'Faça upload da planilha Geral para começar'
              : !selectedCycle
              ? 'Selecione um ciclo'
              : uploadedFiles.geral.mappingError
              ? 'Corrija o mapeamento da planilha Geral'
              : 'Carregue a planilha Geral'}
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
