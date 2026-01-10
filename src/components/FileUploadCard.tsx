import React, { useRef } from 'react';
import { FileUploadState } from '../types';

interface FileUploadCardProps {
  title: string;
  fileState: FileUploadState;
  onUpload: (file: File) => void;
  onClear: () => void;
  onFixMapping: () => void;
  required?: boolean;
}

export function FileUploadCard({
  title,
  fileState,
  onUpload,
  onClear,
  onFixMapping,
  required = true
}: FileUploadCardProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleClick = () => {
    inputRef.current?.click();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onUpload(file);
    }
    // Reset input para permitir reupload do mesmo arquivo
    e.target.value = '';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      onUpload(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const getStatusClass = () => {
    if (fileState.mappingError) return 'card-error';
    if (fileState.loaded && fileState.mapping) return 'card-success';
    if (fileState.loaded) return 'card-warning';
    return '';
  };

  const getStatusIcon = () => {
    if (fileState.mappingError) return '!';
    if (fileState.loaded && fileState.mapping) return '\u2713';
    return null;
  };

  return (
    <div
      className={`upload-card ${getStatusClass()}`}
      onClick={!fileState.loaded ? handleClick : undefined}
      onDrop={!fileState.loaded ? handleDrop : undefined}
      onDragOver={handleDragOver}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".xlsx,.xls,.csv"
        onChange={handleChange}
        style={{ display: 'none' }}
      />

      <div className="card-header">
        <h3>{title}</h3>
        {required && <span className="required-badge">Obrigatório</span>}
      </div>

      {!fileState.loaded ? (
        <div className="card-dropzone">
          <div className="upload-icon">+</div>
          <p>Clique ou arraste o arquivo</p>
          <span className="file-types">.xlsx, .xls, .csv</span>
        </div>
      ) : (
        <div className="card-content">
          <div className="file-info">
            <span className={`status-icon ${getStatusClass()}`}>
              {getStatusIcon()}
            </span>
            <div className="file-details">
              <p className="file-name">{fileState.file?.name}</p>
              <p className="row-count">{fileState.data.length} linhas</p>
            </div>
          </div>

          {fileState.mappingError && (
            <div className="mapping-error">
              <p>Mapeamento de colunas falhou</p>
              <button className="btn-fix" onClick={(e) => { e.stopPropagation(); onFixMapping(); }}>
                Mapear manualmente
              </button>
            </div>
          )}

          <div className="card-actions">
            <button
              className="btn-clear"
              onClick={(e) => { e.stopPropagation(); onClear(); }}
            >
              Remover
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
