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
      defaultValue: []
    },
    colunas: {
      label: {
        en: "Colunas"
      },
      type: "Array",
      bindable: true,
      section: "settings",
      defaultValue: []
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
