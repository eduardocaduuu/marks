/**
 * Hook customizado para gerenciamento de estado da aplicação
 */

import { useState, useCallback } from 'react';
import {
  UploadedFiles,
  FileUploadState,
  BrandName,
  ProcessingResult,
  ColumnMapping
} from '../types';
import { parseFile } from '../lib/fileParser';
import { autoMapColumns } from '../lib/normalize';
import { processData, extractCycles } from '../lib/aggregate';

type FileKey = 'geral' | BrandName;

const initialFileState: FileUploadState = {
  file: null,
  data: [],
  columns: [],
  mapping: null,
  mappingError: false,
  loaded: false
};

const initialUploadedFiles: UploadedFiles = {
  geral: { ...initialFileState },
  oBoticário: { ...initialFileState },
  Eudora: { ...initialFileState },
  AuAmigos: { ...initialFileState },
  'O.U.I': { ...initialFileState },
  QDB: { ...initialFileState }
};

export function useAppState() {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFiles>(initialUploadedFiles);
  const [cycles, setCycles] = useState<string[]>([]);
  const [selectedCycle, setSelectedCycle] = useState<string>('');
  const [processingResult, setProcessingResult] = useState<ProcessingResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentView, setCurrentView] = useState<'upload' | 'dashboard' | 'audit'>('upload');
  const [mappingModalOpen, setMappingModalOpen] = useState(false);
  const [mappingModalFile, setMappingModalFile] = useState<FileKey | null>(null);

  const handleFileUpload = useCallback(async (key: FileKey, file: File) => {
    try {
      const { data, columns } = await parseFile(file);
      const isGeral = key === 'geral';

      // Tenta mapeamento automático
      const { mapping, unmapped } = autoMapColumns(columns, isGeral);

      const newState: FileUploadState = {
        file,
        data,
        columns,
        mapping: mapping as ColumnMapping | null,
        mappingError: unmapped.length > 0,
        loaded: true
      };

      setUploadedFiles(prev => ({
        ...prev,
        [key]: newState
      }));

      // Se for planilha Geral e mapeamento ok, extrai ciclos
      if (isGeral && mapping) {
        const extractedCycles = extractCycles(data, mapping as unknown as ColumnMapping);
        setCycles(extractedCycles);
        if (extractedCycles.length > 0) {
          setSelectedCycle(extractedCycles[0]);
        }
      }

      // Se mapeamento falhou, abre modal
      if (unmapped.length > 0) {
        setMappingModalFile(key);
        setMappingModalOpen(true);
      }
    } catch (error) {
      console.error('Erro ao processar arquivo:', error);
      setUploadedFiles(prev => ({
        ...prev,
        [key]: {
          ...initialFileState,
          mappingError: true
        }
      }));
    }
  }, []);

  const handleManualMapping = useCallback((key: FileKey, mapping: ColumnMapping) => {
    setUploadedFiles(prev => {
      const updated = {
        ...prev,
        [key]: {
          ...prev[key as keyof UploadedFiles],
          mapping,
          mappingError: false
        }
      };

      // Se for Geral, extrai ciclos
      if (key === 'geral' && mapping.cicloFaturamento) {
        const data = prev.geral.data;
        const extractedCycles = extractCycles(data, mapping);
        setCycles(extractedCycles);
        if (extractedCycles.length > 0) {
          setSelectedCycle(extractedCycles[0]);
        }
      }

      return updated;
    });

    setMappingModalOpen(false);
    setMappingModalFile(null);
  }, []);

  const processAllData = useCallback(() => {
    if (!uploadedFiles.geral.loaded || !uploadedFiles.geral.mapping) {
      return { success: false, error: 'Planilha Geral não carregada ou mapeamento incompleto' };
    }

    if (!selectedCycle) {
      return { success: false, error: 'Selecione um ciclo' };
    }

    setIsProcessing(true);

    try {
      const brandData = {
        oBoticário: {
          data: uploadedFiles.oBoticário.data,
          mapping: uploadedFiles.oBoticário.mapping!
        },
        Eudora: {
          data: uploadedFiles.Eudora.data,
          mapping: uploadedFiles.Eudora.mapping!
        },
        AuAmigos: {
          data: uploadedFiles.AuAmigos.data,
          mapping: uploadedFiles.AuAmigos.mapping!
        },
        'O.U.I': {
          data: uploadedFiles['O.U.I'].data,
          mapping: uploadedFiles['O.U.I'].mapping!
        },
        QDB: {
          data: uploadedFiles.QDB.data,
          mapping: uploadedFiles.QDB.mapping!
        }
      };

      const result = processData(
        uploadedFiles.geral.data,
        uploadedFiles.geral.mapping,
        brandData,
        selectedCycle
      );

      setProcessingResult(result);
      setCurrentView('dashboard');
      setIsProcessing(false);

      return { success: true };
    } catch (error) {
      setIsProcessing(false);
      console.error('Erro no processamento:', error);
      return { success: false, error: 'Erro ao processar dados' };
    }
  }, [uploadedFiles, selectedCycle]);

  const clearFile = useCallback((key: FileKey) => {
    setUploadedFiles(prev => ({
      ...prev,
      [key]: { ...initialFileState }
    }));

    if (key === 'geral') {
      setCycles([]);
      setSelectedCycle('');
    }
  }, []);

  const resetAll = useCallback(() => {
    setUploadedFiles(initialUploadedFiles);
    setCycles([]);
    setSelectedCycle('');
    setProcessingResult(null);
    setCurrentView('upload');
  }, []);

  const allBrandsLoaded =
    uploadedFiles.oBoticário.loaded &&
    uploadedFiles.Eudora.loaded &&
    uploadedFiles.AuAmigos.loaded &&
    uploadedFiles['O.U.I'].loaded &&
    uploadedFiles.QDB.loaded;

  const allMappingsOk =
    uploadedFiles.geral.mapping !== null &&
    !uploadedFiles.geral.mappingError &&
    (!uploadedFiles.oBoticário.loaded || (uploadedFiles.oBoticário.mapping !== null && !uploadedFiles.oBoticário.mappingError)) &&
    (!uploadedFiles.Eudora.loaded || (uploadedFiles.Eudora.mapping !== null && !uploadedFiles.Eudora.mappingError)) &&
    (!uploadedFiles.AuAmigos.loaded || (uploadedFiles.AuAmigos.mapping !== null && !uploadedFiles.AuAmigos.mappingError)) &&
    (!uploadedFiles['O.U.I'].loaded || (uploadedFiles['O.U.I'].mapping !== null && !uploadedFiles['O.U.I'].mappingError)) &&
    (!uploadedFiles.QDB.loaded || (uploadedFiles.QDB.mapping !== null && !uploadedFiles.QDB.mappingError));

  const canProcess =
    uploadedFiles.geral.loaded &&
    allBrandsLoaded &&
    allMappingsOk &&
    selectedCycle !== '';

  return {
    uploadedFiles,
    cycles,
    selectedCycle,
    setSelectedCycle,
    processingResult,
    isProcessing,
    currentView,
    setCurrentView,
    mappingModalOpen,
    setMappingModalOpen,
    mappingModalFile,
    setMappingModalFile,
    handleFileUpload,
    handleManualMapping,
    processAllData,
    clearFile,
    resetAll,
    canProcess,
    allBrandsLoaded,
    allMappingsOk
  };
}
