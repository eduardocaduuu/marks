// Tipos principais da aplicação

export type BrandName = 'oBoticário' | 'Eudora' | 'AuAmigos' | 'O.U.I' | 'QDB';

export const BRAND_NAMES: BrandName[] = ['oBoticário', 'Eudora', 'AuAmigos', 'O.U.I', 'QDB'];

export interface RawRow {
  [key: string]: unknown;
}

export interface ColumnMapping {
  setor?: string;
  codigoRevendedora: string;
  nomeRevendedora: string;
  cicloFaturamento?: string;
  cicloCaptacao?: string;
  tipo?: string;
}

export interface FileUploadState {
  file: File | null;
  data: RawRow[];
  columns: string[];
  mapping: ColumnMapping | null;
  mappingError: boolean;
  loaded: boolean;
}

export interface UploadedFiles {
  geral: FileUploadState;
  oBoticário: FileUploadState;
  Eudora: FileUploadState;
  AuAmigos: FileUploadState;
  'O.U.I': FileUploadState;
  QDB: FileUploadState;
}

export interface ActiveReseller {
  codigoRevendedora: string;
  codigoNormalizado: string;
  nomeRevendedora: string;
  nomeNormalizado: string;
  setor: string;
  cicloFaturamento: string;
}

export interface BrandPurchase {
  codigoRevendedora: string;
  nomeRevendedora: string;
  ciclo: string;
  tipo: string;
}

export interface ResellerAnalysis {
  codigoRevendedora: string;
  codigoNormalizado: string;
  nomeRevendedora: string;
  nomeNormalizado: string;
  setor: string;
  brandsPurchased: BrandName[];
  brandCount: number;
  classification: 'Multimarca' | 'Mono-marca' | 'Sem marca';
  matchedBy: 'codigo' | 'nome' | null;
}

export interface SectorSummary {
  setor: string;
  totalAtivos: number;
  multimarca: number;
  percentMultimarca: number;
  monomarca: number;
  percentMonomarca: number;
  semMarca: number;
  percentSemMarca: number;
}

export interface AuditData {
  totalAtivos: number;
  matchedByCodigo: number;
  matchedByNome: number;
  semMarca: number;
  semMarcaList: ResellerAnalysis[];
  cicloSelecionado: string;
  totalPorMarca: Record<BrandName, number>;
}

export interface ProcessingResult {
  resellers: ResellerAnalysis[];
  sectorSummaries: SectorSummary[];
  audit: AuditData;
  success: boolean;
  errors: string[];
}
