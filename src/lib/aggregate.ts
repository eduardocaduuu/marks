/**
 * Funções de agregação e processamento de dados
 */

import {
  ActiveReseller,
  BrandName,
  BRAND_NAMES,
  ColumnMapping,
  ProcessingResult,
  RawRow,
  ResellerAnalysis,
  SectorSummary,
  AuditData
} from '../types';

import {
  normalizeCodigo,
  normalizeNome,
  normalizeCiclo,
  normalizeTipo
} from './normalize';

/**
 * Extrai revendedores ativos da planilha Geral para um ou mais ciclos
 * Se ciclo === 'TODOS', considera todas as linhas
 *
 * REGRA: Deduplicação por CÓDIGO. Se código vazio, usa NOME.
 * Chave única: "C:{codigo}" ou "N:{nome}" para evitar colisões.
 */
export function extractActiveResellers(
  data: RawRow[],
  mapping: ColumnMapping,
  ciclo: string
): Map<string, ActiveReseller> {
  const activeMap = new Map<string, ActiveReseller>();
  const isTodos = ciclo === 'TODOS';
  const cicloNormalizado = isTodos ? '' : normalizeCiclo(ciclo);

  for (const row of data) {
    const rowCiclo = normalizeCiclo(row[mapping.cicloFaturamento!]);

    // Se não é "TODOS", filtra pelo ciclo específico
    if (!isTodos && rowCiclo !== cicloNormalizado) {
      continue;
    }

    const codigoRaw = row[mapping.codigoRevendedora];
    const nomeRaw = row[mapping.nomeRevendedora];
    const setorRaw = row[mapping.setor!];

    const codigoNormalizado = normalizeCodigo(codigoRaw);
    const nomeNormalizado = normalizeNome(nomeRaw);

    // Chave única com prefixo para evitar colisões entre código e nome
    // Se tem código, usa código. Senão, usa nome.
    let key: string;
    if (codigoNormalizado) {
      key = `C:${codigoNormalizado}`;
    } else if (nomeNormalizado) {
      key = `N:${nomeNormalizado}`;
    } else {
      continue; // Sem código nem nome, ignora
    }

    // Deduplicação: mantém primeira ocorrência
    if (!activeMap.has(key)) {
      activeMap.set(key, {
        codigoRevendedora: String(codigoRaw ?? '').trim(),
        codigoNormalizado,
        nomeRevendedora: String(nomeRaw ?? '').trim(),
        nomeNormalizado,
        setor: String(setorRaw ?? 'Sem Setor').trim(),
        cicloFaturamento: rowCiclo
      });
    }
  }

  return activeMap;
}

/**
 * Extrai compras de uma marca para um ou mais ciclos
 * Se ciclo === 'TODOS', considera todas as linhas com Tipo=Venda
 * Retorna Set de códigos/nomes normalizados que compraram (Tipo=Venda)
 */
export function extractBrandPurchases(
  data: RawRow[],
  mapping: ColumnMapping,
  ciclo: string
): { byCodigo: Set<string>; byNome: Set<string> } {
  const byCodigo = new Set<string>();
  const byNome = new Set<string>();

  const isTodos = ciclo === 'TODOS';
  const cicloNormalizado = isTodos ? '' : normalizeCiclo(ciclo);

  for (const row of data) {
    // Determina coluna de ciclo (CicloFaturamento ou fallback CicloCaptacao)
    const cicloColumn = mapping.cicloFaturamento || mapping.cicloCaptacao;

    // Se não é "TODOS", filtra pelo ciclo
    if (!isTodos && cicloColumn) {
      const rowCiclo = normalizeCiclo(row[cicloColumn]);
      if (rowCiclo !== cicloNormalizado) {
        continue;
      }
    }

    // Verifica Tipo = Venda
    const tipoRaw = row[mapping.tipo!];
    const tipoNormalizado = normalizeTipo(tipoRaw);

    if (tipoNormalizado !== 'venda') {
      continue;
    }

    // Adiciona código e nome normalizados
    const codigoNormalizado = normalizeCodigo(row[mapping.codigoRevendedora]);
    const nomeNormalizado = normalizeNome(row[mapping.nomeRevendedora]);

    if (codigoNormalizado) {
      byCodigo.add(codigoNormalizado);
    }
    if (nomeNormalizado) {
      byNome.add(nomeNormalizado);
    }
  }

  return { byCodigo, byNome };
}

/**
 * Processa todos os dados e gera resultado de análise
 * REGRA CRÍTICA: A planilha Geral é a ÚNICA fonte de verdade para ATIVOS.
 * Revendedores das marcas que NÃO existem na Geral são IGNORADOS.
 */
export function processData(
  geralData: RawRow[],
  geralMapping: ColumnMapping,
  brandData: Record<BrandName, { data: RawRow[]; mapping: ColumnMapping }>,
  ciclo: string
): ProcessingResult {
  const errors: string[] = [];

  // 1. Extrair ativos EXCLUSIVAMENTE da planilha Geral
  const activeResellers = extractActiveResellers(geralData, geralMapping, ciclo);

  if (activeResellers.size === 0) {
    return {
      resellers: [],
      sectorSummaries: [],
      audit: {
        totalAtivos: 0,
        matchedByCodigo: 0,
        matchedByNome: 0,
        semMarca: 0,
        semMarcaList: [],
        cicloSelecionado: ciclo,
        totalPorMarca: {} as Record<BrandName, number>
      },
      success: false,
      errors: ['Nenhum revendedor ativo encontrado no ciclo selecionado']
    };
  }

  // 2. Criar Sets de códigos e nomes válidos da Geral para validação
  const validCodigos = new Set<string>();
  const validNomes = new Set<string>();

  for (const [, reseller] of activeResellers) {
    if (reseller.codigoNormalizado) {
      validCodigos.add(reseller.codigoNormalizado);
    }
    if (reseller.nomeNormalizado) {
      validNomes.add(reseller.nomeNormalizado);
    }
  }

  // 3. Extrair compras de cada marca (filtrando apenas revendedores válidos da Geral)
  const brandPurchases: Record<BrandName, { byCodigo: Set<string>; byNome: Set<string> }> = {} as Record<BrandName, { byCodigo: Set<string>; byNome: Set<string> }>;

  for (const brand of BRAND_NAMES) {
    const bd = brandData[brand];
    if (bd && bd.data.length > 0 && bd.mapping) {
      // Extrai compras e filtra apenas os que existem na Geral
      const rawPurchases = extractBrandPurchases(bd.data, bd.mapping, ciclo);

      // Filtra códigos: mantém apenas os que existem na Geral
      const filteredCodigos = new Set<string>();
      for (const codigo of rawPurchases.byCodigo) {
        if (validCodigos.has(codigo)) {
          filteredCodigos.add(codigo);
        }
      }

      // Filtra nomes: mantém apenas os que existem na Geral
      const filteredNomes = new Set<string>();
      for (const nome of rawPurchases.byNome) {
        if (validNomes.has(nome)) {
          filteredNomes.add(nome);
        }
      }

      brandPurchases[brand] = { byCodigo: filteredCodigos, byNome: filteredNomes };
    } else {
      brandPurchases[brand] = { byCodigo: new Set(), byNome: new Set() };
    }
  }

  // 4. Analisar cada revendedor ativo (APENAS os da Geral)
  const resellers: ResellerAnalysis[] = [];
  let matchedByCodigo = 0;
  let matchedByNome = 0;

  const totalPorMarca: Record<BrandName, number> = {
    'oBoticário': 0,
    'Eudora': 0,
    'AuAmigos': 0,
    'O.U.I': 0,
    'QDB': 0
  };

  // Itera APENAS sobre os revendedores da planilha Geral
  for (const [, reseller] of activeResellers) {
    const brandsPurchased: BrandName[] = [];
    let wasMatched = false;
    let matchType: 'codigo' | 'nome' | null = null;

    // Determina se este revendedor tem código (se não tiver, usaremos fallback por nome)
    const temCodigo = !!reseller.codigoNormalizado;

    for (const brand of BRAND_NAMES) {
      const purchases = brandPurchases[brand];
      let foundBrand = false;

      if (temCodigo) {
        // Se TEM código, usa APENAS código para matching (sem fallback por nome)
        if (purchases.byCodigo.has(reseller.codigoNormalizado)) {
          foundBrand = true;
          if (!wasMatched) {
            matchedByCodigo++;
            matchType = 'codigo';
            wasMatched = true;
          }
        }
      } else {
        // Se NÃO tem código, usa nome para matching
        if (reseller.nomeNormalizado && purchases.byNome.has(reseller.nomeNormalizado)) {
          foundBrand = true;
          if (!wasMatched) {
            matchedByNome++;
            matchType = 'nome';
            wasMatched = true;
          }
        }
      }

      if (foundBrand) {
        brandsPurchased.push(brand);
        totalPorMarca[brand]++;
      }
    }

    const brandCount = brandsPurchased.length;
    let classification: 'Multimarca' | 'Mono-marca' | 'Sem marca';

    if (brandCount >= 2) {
      classification = 'Multimarca';
    } else if (brandCount === 1) {
      classification = 'Mono-marca';
    } else {
      classification = 'Sem marca';
    }

    resellers.push({
      codigoRevendedora: reseller.codigoRevendedora,
      codigoNormalizado: reseller.codigoNormalizado,
      nomeRevendedora: reseller.nomeRevendedora,
      nomeNormalizado: reseller.nomeNormalizado,
      setor: reseller.setor,
      brandsPurchased,
      brandCount,
      classification,
      matchedBy: matchType
    });
  }

  // 4. Agregar por setor
  const sectorMap = new Map<string, ResellerAnalysis[]>();

  for (const reseller of resellers) {
    const setor = reseller.setor || 'Sem Setor';
    if (!sectorMap.has(setor)) {
      sectorMap.set(setor, []);
    }
    sectorMap.get(setor)!.push(reseller);
  }

  const sectorSummaries: SectorSummary[] = [];

  for (const [setor, resellerList] of sectorMap) {
    const totalAtivos = resellerList.length;
    const multimarca = resellerList.filter(r => r.classification === 'Multimarca').length;
    const monomarca = resellerList.filter(r => r.classification === 'Mono-marca').length;
    const semMarca = resellerList.filter(r => r.classification === 'Sem marca').length;

    sectorSummaries.push({
      setor,
      totalAtivos,
      multimarca,
      percentMultimarca: totalAtivos > 0 ? (multimarca / totalAtivos) * 100 : 0,
      monomarca,
      percentMonomarca: totalAtivos > 0 ? (monomarca / totalAtivos) * 100 : 0,
      semMarca,
      percentSemMarca: totalAtivos > 0 ? (semMarca / totalAtivos) * 100 : 0
    });
  }

  // Ordenar por setor
  sectorSummaries.sort((a, b) => a.setor.localeCompare(b.setor));

  // 5. Dados de auditoria
  const semMarcaList = resellers.filter(r => r.classification === 'Sem marca');

  const audit: AuditData = {
    totalAtivos: activeResellers.size,
    matchedByCodigo,
    matchedByNome,
    semMarca: semMarcaList.length,
    semMarcaList,
    cicloSelecionado: ciclo,
    totalPorMarca
  };

  return {
    resellers,
    sectorSummaries,
    audit,
    success: true,
    errors
  };
}

/**
 * Extrai ciclos únicos da planilha Geral
 */
export function extractCycles(data: RawRow[], mapping: ColumnMapping): string[] {
  const cyclesSet = new Set<string>();

  for (const row of data) {
    const ciclo = normalizeCiclo(row[mapping.cicloFaturamento!]);
    if (ciclo) {
      cyclesSet.add(ciclo);
    }
  }

  return Array.from(cyclesSet).sort((a, b) => b.localeCompare(a)); // Mais recente primeiro
}

/**
 * Gera CSV a partir de dados
 */
export function generateCSV(
  headers: string[],
  rows: string[][]
): string {
  const escape = (val: string) => {
    if (val.includes(',') || val.includes('"') || val.includes('\n')) {
      return `"${val.replace(/"/g, '""')}"`;
    }
    return val;
  };

  const headerLine = headers.map(escape).join(',');
  const dataLines = rows.map(row => row.map(escape).join(','));

  return [headerLine, ...dataLines].join('\n');
}

/**
 * Gera CSV do resumo por setor
 */
export function generateSectorSummaryCSV(summaries: SectorSummary[]): string {
  const headers = [
    'Setor',
    'Ativos',
    'Multimarca',
    '% Multimarca',
    'Mono-marca',
    '% Mono-marca',
    'Sem marca',
    '% Sem marca'
  ];

  const rows = summaries.map(s => [
    s.setor,
    String(s.totalAtivos),
    String(s.multimarca),
    s.percentMultimarca.toFixed(2) + '%',
    String(s.monomarca),
    s.percentMonomarca.toFixed(2) + '%',
    String(s.semMarca),
    s.percentSemMarca.toFixed(2) + '%'
  ]);

  return generateCSV(headers, rows);
}

/**
 * Gera CSV de detalhes de revendedores
 */
export function generateResellerDetailsCSV(resellers: ResellerAnalysis[]): string {
  const headers = [
    'Código',
    'Nome',
    'Setor',
    'Qtd Marcas',
    'Marcas',
    'Classificação',
    'Match Por'
  ];

  const rows = resellers.map(r => [
    r.codigoRevendedora,
    r.nomeRevendedora,
    r.setor,
    String(r.brandCount),
    r.brandsPurchased.join('; '),
    r.classification,
    r.matchedBy || 'N/A'
  ]);

  return generateCSV(headers, rows);
}
