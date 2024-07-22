export default {
  editor: {
    label: {
      en: "Tabela",
    },
  },
  properties: {
    dados: {
      label: {
        en: "Dados"
      },
      type: "Array",
      bindable: true,
      section: "settings",
      defaultValue: [{ make: "Tesla3", model: "Model Y", price: 64950, price2: 65000, quantidade: 15, quantidade2: 16, markup: 3.12, hierarquia: "Teste" }]
    },
    colunas: {
      label: {
        en: "Colunas"
      },
      type: "Array",
      bindable: true,
      section: "settings",
      defaultValue: [
        { field: "make", pinned: "left" },
        { field: "model" },
        { field: "price", valueFormatter: "formatCurrency" },
        { field: "price2", valueFormatter: "formatCurrency", cellRenderer: "comparisonRenderer" },
        { field: "markup", valueFormatter: "formatPercentage" },
        { field: "quantidade" },
        { field: "quantidade2", cellRenderer: "comparisonRenderer" },
      ]
    },
    total: {
      label: {
        en: "Total"
      },
      type: "Array",
      bindable: true,
      section: "settings",
      defaultValue: []
    },
    comparativo: {
      label: {
        en: "Comparativo"
      },
      type: "Array",
      bindable: true,
      section: "settings",
      defaultValue: []
    },
    overlay: {
      label: {
        en: "Carregamento"
      },
      type: "Boolean",
      bindable: true,
      section: "settings"
    }
  },
  triggerEvents: [
    { name: 'LinhaDoisClick', label: { en: 'Linha Double Click' }, event: { value: '' } },
    { name: 'Ordem', label: { en: 'Order' }, event: { value: '' } },
    { name: 'Scroll', label: { en: 'Scroll' }, event: { value: '' } },
  ],
};
