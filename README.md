# Multimarcas - Análise de Revendedores

Aplicação para análise de revendedores multimarca, identificando quais revendedores ativos compraram mais de uma marca e mostrando percentuais por setor.

## Funcionalidades

- Upload de 6 planilhas (Geral + 5 marcas)
- Mapeamento automático de colunas (com fallback manual)
- Seleção de ciclo de faturamento
- Dashboard com resumo por setor
- Detalhes por revendedor
- Seção de auditoria para verificar matching
- Exportação para CSV

## Marcas Suportadas

1. **Geral** - Planilha base com todos os revendedores ativos
2. **oBoticário**
3. **Eudora**
4. **AuAmigos**
5. **O.U.I**
6. **QDB**

## Regras de Negócio

### Ativos
- Todo revendedor presente na planilha Geral no ciclo selecionado é ATIVO
- Deduplicação por CodigoRevendedora (fallback: NomeRevendedora normalizado)

### Classificação
- **Multimarca**: Comprou 2+ marcas
- **Mono-marca**: Comprou exatamente 1 marca
- **Sem marca**: Não apareceu em nenhuma planilha de marca

### Normalização
- Códigos: string, trim, remove ".0"
- Nomes: trim, colapsa espaços, remove acentos, lowercase

## Desenvolvimento

```bash
# Instalar dependências
npm install

# Rodar em desenvolvimento
npm run dev

# Build para produção
npm run build

# Preview do build
npm run preview
```

## Deploy no Render

### Opção 1: Deploy Automático

1. Faça push do código para o GitHub
2. Acesse [render.com](https://render.com)
3. Clique em "New" > "Static Site"
4. Conecte seu repositório GitHub
5. Configure:
   - **Name**: multimarcas
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `dist`
6. Clique em "Create Static Site"

## Estrutura do Projeto

```
src/
├── components/
│   ├── AuditPage.tsx
│   ├── ColumnMapperModal.tsx
│   ├── DashboardPage.tsx
│   ├── FileUploadCard.tsx
│   ├── SectorDetailsModal.tsx
│   └── UploadPage.tsx
├── hooks/
│   └── useAppState.ts
├── lib/
│   ├── aggregate.ts
│   ├── fileParser.ts
│   └── normalize.ts
├── types/
│   └── index.ts
├── App.tsx
├── App.css
└── main.tsx
```

## Tecnologias

- React 18
- TypeScript
- Vite
- SheetJS (xlsx)
