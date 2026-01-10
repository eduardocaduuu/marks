/**
 * Funções de normalização para garantir matching correto entre planilhas
 */

/**
 * Normaliza código de revendedora:
 * - Converte para string
 * - Remove espaços
 * - Remove sufixo ".0" do Excel
 */
export function normalizeCodigo(value: unknown): string {
  if (value === null || value === undefined) {
    return '';
  }

  let str = String(value).trim();

  // Remove sufixo .0 que Excel adiciona a números
  if (str.endsWith('.0')) {
    str = str.slice(0, -2);
  }

  // Remove zeros à esquerda se for número puro
  if (/^\d+$/.test(str)) {
    str = String(parseInt(str, 10));
  }

  return str;
}

/**
 * Normaliza nome de revendedora:
 * - Trim
 * - Colapsa múltiplos espaços em um
 * - Remove acentos (NFD)
 * - Converte para lowercase
 */
export function normalizeNome(value: unknown): string {
  if (value === null || value === undefined) {
    return '';
  }

  let str = String(value).trim();

  // Colapsa múltiplos espaços
  str = str.replace(/\s+/g, ' ');

  // Remove acentos usando NFD (Normalization Form Decomposition)
  str = str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  // Converte para lowercase
  str = str.toLowerCase();

  return str;
}

/**
 * Normaliza valor de ciclo (formato comum: YYYYMM)
 */
export function normalizeCiclo(value: unknown): string {
  if (value === null || value === undefined) {
    return '';
  }

  let str = String(value).trim();

  // Remove sufixo .0 se existir
  if (str.endsWith('.0')) {
    str = str.slice(0, -2);
  }

  return str;
}

/**
 * Normaliza valor de tipo (para comparação com "Venda")
 */
export function normalizeTipo(value: unknown): string {
  if (value === null || value === undefined) {
    return '';
  }

  return String(value).trim().toLowerCase();
}

/**
 * Normaliza nome de coluna para tentativa de mapeamento automático
 */
export function normalizeColumnName(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '')
    .replace(/[^a-z0-9]/g, '');
}

/**
 * Possíveis variações de nomes de colunas para mapeamento automático
 */
export const COLUMN_VARIATIONS = {
  setor: ['setor', 'sector', 'região', 'regiao', 'area'],
  codigoRevendedora: [
    'codigorevendedora', 'codigo', 'cod', 'codigore',
    'codigodarevendedora', 'codrevendedora', 'codrev',
    'revendedoracodigo', 'idrevendedora', 'id'
  ],
  nomeRevendedora: [
    'nomerevendedora', 'nome', 'revendedora',
    'nomedarevendedora', 'nomrev', 'revendedoranome'
  ],
  cicloFaturamento: [
    'ciclofaturamento', 'ciclo', 'ciclofat',
    'faturamento', 'ciclodefaturamento'
  ],
  cicloCaptacao: [
    'ciclocaptacao', 'captacao', 'ciclodecaptacao', 'ciclocapt'
  ],
  tipo: ['tipo', 'type', 'tipovenda', 'tipooperacao', 'tipooperação']
};

/**
 * Tenta mapear automaticamente as colunas de um arquivo
 */
export function autoMapColumns(
  columns: string[],
  isGeral: boolean
): { mapping: Record<string, string> | null; unmapped: string[] } {
  const mapping: Record<string, string> = {};
  const unmapped: string[] = [];

  const normalizedColumns = columns.map(c => ({
    original: c,
    normalized: normalizeColumnName(c)
  }));

  const requiredFields = isGeral
    ? ['codigoRevendedora', 'nomeRevendedora', 'setor', 'cicloFaturamento']
    : ['codigoRevendedora', 'nomeRevendedora', 'tipo'];

  const optionalFields = isGeral
    ? []
    : ['cicloFaturamento', 'cicloCaptacao'];

  // Tenta mapear campos obrigatórios
  for (const field of requiredFields) {
    const variations = COLUMN_VARIATIONS[field as keyof typeof COLUMN_VARIATIONS];
    let found = false;

    for (const col of normalizedColumns) {
      if (variations.some(v => col.normalized.includes(v) || v.includes(col.normalized))) {
        mapping[field] = col.original;
        found = true;
        break;
      }
    }

    if (!found) {
      unmapped.push(field);
    }
  }

  // Tenta mapear campos opcionais
  for (const field of optionalFields) {
    const variations = COLUMN_VARIATIONS[field as keyof typeof COLUMN_VARIATIONS];

    for (const col of normalizedColumns) {
      if (variations.some(v => col.normalized.includes(v) || v.includes(col.normalized))) {
        mapping[field] = col.original;
        break;
      }
    }
  }

  return {
    mapping: unmapped.length === 0 ? mapping : null,
    unmapped
  };
}
