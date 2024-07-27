<template>
  <ag-grid-vue ref="agGrid" :rowData="rowData" :columnDefs="colDefs" domLayout="normal" class="ag-theme-quartz"
    @grid-ready="onGridReady" :rowDragManaged="true" @row-double-clicked="onRowDoubleClicked" :loading="content.overlay"
    :overlayLoadingTemplate="loading" :pinnedBottomRowData="pinnedBottomRowData" @sort-changed="onSortChanged"
    @body-scroll="onBodyScroll" @selection-changed="onSelectionChanged" :rowSelection="rowSelectionType" style="height: 78.5vh"></ag-grid-vue>
</template>

<script>
import { AgGridVue } from "ag-grid-vue3";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-quartz.css";
import { ref, computed, watch } from "vue";

import Minus from "../src/assets/minus.svg";
import TrendDown from "../src/assets/trend-down-fill.svg";
import TrendUp from "../src/assets/trend-up-fill.svg";

export default {
  components: {
    AgGridVue,
  },
  props: {
    content: { type: Object, required: true },
    uid: { type: String, required: true },
  },
  setup(props, { emit }) {
    const gridApi = ref(null);
    const gridColumnApi = ref(null);
    const rowData = ref([]);
    const colDefs = ref([]);
    const comparisonConfig = ref([]);
    const loading = `<div class="ag-custom-loading-overlay"><div class="loader"></div> <span>Carregando...</span></div>`;
    const rowSelectionType = ref(props.content.selecionar ? 'multiple' : 'none');
    const pinnedBottomRowData = ref([]);

    const { value: variableResult, setValue: setValue1 } =
      wwLib.wwVariable.useComponentVariable({
        uid: props.uid,
        name: "Relatorio",
        type: "object",
        defaultValue: "",
      });

    const { value: variableResult2, setValue: setValue2 } =
      wwLib.wwVariable.useComponentVariable({
        uid: props.uid,
        name: "Ordem",
        type: "object",
      });

    const { value: variableResult3, setValue: setValue3 } =
      wwLib.wwVariable.useComponentVariable({
        uid: props.uid,
        name: "Valor Selecionado",
        type: "array",
      });

    function onGridReady(params) {
      gridApi.value = params.api;
      gridColumnApi.value = params.columnApi;
    }

    function onSortChanged(event) {
      const lastClickedColumn = event.columns[event.columns.length - 1];
      emit("trigger-event", {
        name: "Ordem",
        event: { value: lastClickedColumn },
      });
      setValue2(lastClickedColumn);
    }

    function onRowDoubleClicked(event) {
      const rowData = event.data;
      emit("trigger-event", {
        name: "LinhaDoisClick",
        event: { value: rowData },
      });
      setValue1(rowData);
    }

    function onBodyScroll(event) {
      const linhas = gridApi.value.getDisplayedRowCount();
      const scrollTop = event.top;
      const scrollHeight = 600;
      const clientHeight = linhas * 50;
      const percentScroll = Math.abs(
        (scrollTop / (scrollHeight - clientHeight)) * 100
      );

      if (percentScroll > 85) {
        emit("trigger-event", { name: "Scroll", event: { value: "" } });
      }
    }

    function onSelectionChanged() {
      const selectedNodes = gridApi.value.getSelectedNodes();
      const selectedData = selectedNodes.map(node => node.data);
      setValue3(selectedData);
      emit("trigger-event", { name: "Selecionado", event: { value: "" } });
    }

    function autoSizeAllColumns() {
      if (gridApi.value) {
        gridApi.value.autoSizeAllColumns();
      }
    }

    function transformColumns(columnDefinitions) {
      const functionMap = {
        formatCurrency,
        formatPercentage,
        formatNumber,
        comparisonRenderer,
      };
      return columnDefinitions.map((col) => ({
        ...col,
        ...(col.valueFormatter && {
          valueFormatter: functionMap[col.valueFormatter],
        }),
        ...(col.cellRenderer && {
          cellRenderer: functionMap[col.cellRenderer],
        }),
      }));
    }

    function formatCurrency(params) {
      return new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
      }).format(params.value);
    }

    function formatPercentage(params) {
      return Number(params.value / 100).toLocaleString(undefined, {
        style: "percent",
        minimumFractionDigits: 2,
      });
    }

    function formatNumber(params) {
      return Number(params.value).toLocaleString("pt-BR");
    }

    function comparisonRenderer(params) {
      let icon = Minus;
      let cellClass = "cell-nulo";
      const data = params.data;

      comparisonConfig.value.forEach((config) => {
        if (params.colDef.field === config.secondCol) {
          if (data[config.secondCol] > data[config.firstCol]) {
            icon = TrendUp;
            cellClass = "cell-positivo";
          } else if (data[config.secondCol] < data[config.firstCol]) {
            icon = TrendDown;
            cellClass = "cell-negativo";
          }
        }
      });

      const span = document.createElement("span");
      span.className = cellClass;
      span.textContent = params.valueFormatted || params.value;

      const iconElement = document.createElement("img");
      iconElement.src = icon;
      iconElement.style.marginLeft = "12px";
      iconElement.style.verticalAlign = "middle";

      const cellDiv = document.createElement("div");
      cellDiv.appendChild(span);
      cellDiv.appendChild(iconElement);
      return cellDiv;
    }

    watch(
      () => props.content.dados,
      (newData) => {
        if (newData) {
          const totalRow = newData.find(row => row[props.content.primeiracoluna] === "Total");
          if (totalRow) {
            pinnedBottomRowData.value = [totalRow];
            rowData.value = newData.filter(row => row[props.content.primeiracoluna] !== "Total");
          } else if (!pinnedBottomRowData.value.length) {
            pinnedBottomRowData.value = [];
            rowData.value = [...newData];
          }
        }
      },
      { immediate: true, deep: true }
    );

    watch(
      () => props.content.colunas,
      (newColDefs) => {
        if (newColDefs) {
          colDefs.value = transformColumns(newColDefs);
        }
      },
      { immediate: true, deep: true }
    );

    watch(
      () => props.content.comparativo,
      (newComparisonConfig) => {
        if (newComparisonConfig) {
          comparisonConfig.value = [...newComparisonConfig];
        }
      },
      { immediate: true, deep: true }
    );

    watch(
      () => props.content.primeiracoluna,
      () => {},
      { immediate: true, deep: true }
    );

    watch(
      () => props.content.selecionar,
      (newSelection) => {
        rowSelectionType.value = newSelection ? 'multiple' : 'none';
      },
      { immediate: true }
    );

    watch(
      () => props.content.largura,
      (newLargura) => {
        if (newLargura) {
          autoSizeAllColumns();
        }
      }
    );

    return {
      pinnedBottomRowData,
      colDefs,
      onGridReady,
      onRowDoubleClicked,
      onSortChanged,
      variableResult,
      variableResult2,
      variableResult3,
      setValue1,
      setValue2,
      setValue3,
      loading,
      onBodyScroll,
      onSelectionChanged,
      rowData,
      comparisonConfig,
      rowSelectionType,
    };
  },
};
</script>

<style>
.ag-custom-loading-overlay {
  display: flex;
  flex-direction: column;
  /* Define a orientação vertical dos itens */
  row-gap: 24px;
  /* Espaçamento de 24px entre cada linha */
  align-items: center;
  justify-content: center;
  height: 100%;
  width: 100%;
  background-color: #f6eeff65;
  color: #000;
  font-size: 16px;
}

.ag-custom-loading-overlay span {
  font-family: "Montserrat";
  font-weight: 500;
  font-size: 16px;
  color: #6418c3;
}

.loader {
  width: 50px;
  aspect-ratio: 1;
  border-radius: 50%;
  border: 6px solid #6418c3;
  animation: l20-1 0.8s infinite linear alternate, l20-2 1.6s infinite linear;
}

@keyframes l20-1 {
  0% {
    clip-path: polygon(50% 50%, 0 0, 50% 0%, 50% 0%, 50% 0%, 50% 0%, 50% 0%);
  }

  12.5% {
    clip-path: polygon(50% 50%,
        0 0,
        50% 0%,
        100% 0%,
        100% 0%,
        100% 0%,
        100% 0%);
  }

  25% {
    clip-path: polygon(50% 50%,
        0 0,
        50% 0%,
        100% 0%,
        100% 100%,
        100% 100%,
        100% 100%);
  }

  50% {
    clip-path: polygon(50% 50%,
        0 0,
        50% 0%,
        100% 0%,
        100% 100%,
        50% 100%,
        0% 100%);
  }

  62.5% {
    clip-path: polygon(50% 50%,
        100% 0,
        100% 0%,
        100% 0%,
        100% 100%,
        50% 100%,
        0% 100%);
  }

  75% {
    clip-path: polygon(50% 50%,
        100% 100%,
        100% 100%,
        100% 100%,
        100% 100%,
        50% 100%,
        0% 100%);
  }

  100% {
    clip-path: polygon(50% 50%,
        50% 100%,
        50% 100%,
        50% 100%,
        50% 100%,
        50% 100%,
        0% 100%);
  }
}

@keyframes l20-2 {
  0% {
    transform: scaleY(1) rotate(0deg);
  }

  49.99% {
    transform: scaleY(1) rotate(135deg);
  }

  50% {
    transform: scaleY(-1) rotate(0deg);
  }

  100% {
    transform: scaleY(-1) rotate(-135deg);
  }
}

.ag-row-hover .ag-cell {
  border: none;
  /* Remove a borda de cada célula */
}

/* Adiciona a borda ao redor da linha inteira */
.ag-row-hover::before {
  border: 1px solid #6418c3;
  /* Altere conforme necessário */
}

.cell-positivo {
  color: #38e25d;
}

.cell-negativo {
  color: #ff4a55;
}

.cell-nulo {
  color: #1f1f1f;
}

.ag-header-cell {
  font-weight: 600 !important;
  font-family: "Kanit";
}

.ag-cell {
  font-weight: 500;
}

.ag-theme-quartz .ag-row-last {
  border-bottom: none;
  /* Remove a borda inferior da última linha de dados para evitar duplicidade de borda */
}

.ag-root-wrapper {
  border: none !important;
}
</style>

<style lang="scss" scoped>
.ag-theme-quartz {
  --ag-row-border-width: 1px;
  --ag-background-color: var(--ag-inherited-background-color, #ffffff);
  --ag-foreground-color: var(--ag-inherited-foreground-color, #1f1f1f);
  --ag-text-color: var(--ag-inherited-text-color, var(--ag-foreground-color));
  --ag-accent-color: var(--ag-inherited-accent-color, #6418c3);
  --ag-active-color: var(--ag-inherited-accent-color, #6418c3);
  --ag-invalid-color: var(--ag-inherited-invalid-color, #e02525);
  --ag-border-color: var(--ag-inherited-border-color, #c2c2c2);
  --ag-wrapper-border: var(--ag-inherited-wrapper-border, none);
  --ag-row-border: var(--ag-inherited-row-border,
      solid 1px var(--ag-border-color));
  --ag-color-scheme: var(--ag-inherited-color-scheme, inherit);
  --ag-header-row-border: var(--ag-inherited-header-row-border,
      var(--ag-row-border));
  --ag-footer-row-border: var(--ag-inherited-footer-row-border,
      var(--ag-row-border));
  --ag-column-border: var(--ag-inherited-column-border, solid 1px transparent);
  --ag-header-column-border: var(--ag-inherited-header-column-border, none);
  --ag-header-column-border-height: var(--ag-inherited-header-column-border-height,
      100%);
  --ag-pinned-column-border: var(--ag-inherited-pinned-column-border,
      solid 1px var(--ag-border-color));
  --ag-pinned-row-border: var(--ag-inherited-pinned-row-border,
      solid 1px var(--ag-border-color));
  --ag-side-panel-border: var(--ag-inherited-side-panel-border, none);
  --ag-font-family: var(--ag-inherited-font-family, "Montserrat", sans-serif);
  --ag-chrome-background-color: var(--ag-inherited-chrome-background-color,
      color-mix(in srgb, transparent, var(--ag-foreground-color) 2%));
  --ag-header-background-color: var(--ag-inherited-header-background-color,
      #ffffff05);
  --ag-header-font-family: var(--ag-inherited-header-font-family,
      var(--ag-font-family));
  --ag-header-font-size: var(--ag-inherited-header-font-size, 16px);
  --ag-header-text-color: var(--ag-inherited-header-text-color, #1f1f1f);
  --ag-header-cell-hover-background-color: var(--ag-inherited-header-cell-hover-background-color,
      transparent);
  --ag-header-cell-hover-background-transition-duration: var(--ag-inherited-header-cell-hover-background-transition-duration,
      0.2s);
  --ag-cell-text-color: var(--ag-inherited-cell-text-color, #1f1f1f);
  --ag-subtle-text-color: var(--ag-inherited-subtle-text-color,
      color-mix(in srgb, transparent, var(--ag-text-color) 50%));
  --ag-range-selection-border-style: var(--ag-inherited-range-selection-border-style,
      solid);
  --ag-range-selection-border-color: var(--ag-inherited-range-selection-border-color,
      var(--ag-accent-color));
  --ag-range-selection-background-color: var(--ag-inherited-range-selection-background-color,
      color-mix(in srgb, transparent, var(--ag-accent-color) 20%));
  --ag-range-selection-chart-background-color: var(--ag-inherited-range-selection-chart-background-color,
      #0058ff1a);
  --ag-range-selection-chart-category-background-color: var(--ag-inherited-range-selection-chart-category-background-color,
      #00ff841a);
  --ag-range-selection-highlight-color: var(--ag-inherited-range-selection-highlight-color,
      color-mix(in srgb, transparent, var(--ag-accent-color) 50%));
  --ag-row-hover-color: var(--ag-inherited-row-hover-color, #f6eeff);
  --ag-column-hover-color: var(--ag-inherited-column-hover-color,
      color-mix(in srgb, transparent, var(--ag-accent-color) 5%));
  --ag-selected-row-background-color: var(--ag-inherited-selected-row-background-color,
      color-mix(in srgb, transparent, var(--ag-accent-color) 8%));
  --ag-modal-overlay-background-color: var(--ag-inherited-modal-overlay-background-color,
      color-mix(in srgb, transparent, var(--ag-background-color) 66%));
  --ag-odd-row-background-color: var(--ag-inherited-odd-row-background-color,
      #f5f5f5);
  --ag-border-radius: var(--ag-inherited-border-radius, 14px);
  --ag-wrapper-border-radius: var(--ag-inherited-wrapper-border-radius, 0px);
  --ag-cell-horizontal-padding: var(--ag-inherited-cell-horizontal-padding,
      calc(var(--ag-grid-size) * 2 * var(--ag-cell-horizontal-padding-scale)));
  --ag-cell-widget-spacing: var(--ag-inherited-cell-widget-spacing,
      calc(var(--ag-grid-size) * 1.5));
  --ag-cell-horizontal-padding-scale: var(--ag-inherited-cell-horizontal-padding-scale,
      1);
  --ag-row-group-indent-size: var(--ag-inherited-row-group-indent-size,
      calc(var(--ag-cell-widget-spacing) + var(--ag-icon-size)));
  --ag-value-change-delta-up-color: var(--ag-inherited-value-change-delta-up-color,
      #43a047);
  --ag-value-change-delta-down-color: var(--ag-inherited-value-change-delta-down-color,
      #e53935);
  --ag-value-change-value-highlight-background-color: var(--ag-inherited-value-change-value-highlight-background-color,
      #16a08580);
  --ag-grid-size: var(--ag-inherited-grid-size, 12px);
  --ag-font-size: var(--ag-inherited-font-size, 16px);
  --ag-row-height: var(--ag-inherited-row-height, 50px);
  --ag-row-vertical-padding-scale: var(--ag-inherited-row-vertical-padding-scale,
      1);
  --ag-header-height: var(--ag-inherited-header-height, 50px);
  --ag-header-vertical-padding-scale: var(--ag-inherited-header-vertical-padding-scale,
      1);
  --ag-popup-shadow: var(--ag-inherited-popup-shadow, 0 0 16px 0 #00000026);
  --ag-dropdown-shadow: var(--ag-inherited-dropdown-shadow,
      0 1px 4px 1px #babfc766);
  --ag-drag-ghost-background-color: var(--ag-inherited-drag-ghost-background-color,
      var(--ag-background-color));
  --ag-drag-ghost-border: var(--ag-inherited-drag-ghost-border,
      solid 1px var(--ag-border-color));
  --ag-drag-ghost-shadow: var(--ag-inherited-drag-ghost-shadow,
      var(--ag-popup-shadow));
  --ag-focus-shadow: var(--ag-inherited-focus-shadow,
      0 0 0 3px color-mix(in srgb, transparent, var(--ag-accent-color) 50%));
  --ag-side-bar-panel-width: var(--ag-inherited-side-bar-panel-width, 250px);
  --ag-side-button-selected-border: var(--ag-inherited-side-button-selected-border,
      solid 1px var(--ag-border-color));
  --ag-side-button-selected-background-color: var(--ag-inherited-side-button-selected-background-color,
      var(--ag-background-color));
  --ag-side-bar-background-color: var(--ag-inherited-side-bar-background-color,
      var(--ag-chrome-background-color));
  --ag-header-column-resize-handle-display: var(--ag-inherited-header-column-resize-handle-display,
      block);
  --ag-header-column-resize-handle-height: var(--ag-inherited-header-column-resize-handle-height,
      30%);
  --ag-header-column-resize-handle-width: var(--ag-inherited-header-column-resize-handle-width,
      2px);
  --ag-header-column-resize-handle-color: var(--ag-inherited-header-column-resize-handle-color,
      #c2c2c2);
  --ag-widget-container-horizontal-padding: var(--ag-inherited-widget-container-horizontal-padding,
      calc(var(--ag-grid-size) * 1.5));
  --ag-widget-container-vertical-padding: var(--ag-inherited-widget-container-vertical-padding,
      calc(var(--ag-grid-size) * 1.5));
  --ag-widget-horizontal-spacing: var(--ag-inherited-widget-horizontal-spacing,
      calc(var(--ag-grid-size) * 1.5));
  --ag-widget-vertical-spacing: var(--ag-inherited-widget-vertical-spacing,
      var(--ag-grid-size));
  --ag-list-item-height: var(--ag-inherited-list-item-height,
      calc(var(--ag-icon-size) + var(--ag-widget-vertical-spacing)));
  --ag-icon-size: var(--ag-inherited-icon-size, 16px);
  --ag-toggle-button-width: var(--ag-inherited-toggle-button-width, 28px);
  --ag-toggle-button-height: var(--ag-inherited-toggle-button-height, 18px);
  --ag-toggle-button-border-width: var(--ag-inherited-toggle-button-border-width,
      2px);
  --ag-toggle-button-on-border-color: var(--ag-inherited-toggle-button-on-border-color,
      var(--ag-accent-color));
  --ag-toggle-button-on-background-color: var(--ag-inherited-toggle-button-on-background-color,
      var(--ag-accent-color));
  --ag-toggle-button-off-border-color: var(--ag-inherited-toggle-button-off-border-color,
      color-mix(in srgb,
        var(--ag-background-color),
        var(--ag-foreground-color) 30%));
  --ag-toggle-button-off-background-color: var(--ag-inherited-toggle-button-off-background-color,
      color-mix(in srgb,
        var(--ag-background-color),
        var(--ag-foreground-color) 30%));
  --ag-toggle-button-switch-border-color: var(--ag-inherited-toggle-button-switch-border-color,
      var(--ag-toggle-button-off-border-color));
  --ag-toggle-button-switch-background-color: var(--ag-inherited-toggle-button-switch-background-color,
      var(--ag-background-color));
  --ag-checkbox-border-width: var(--ag-inherited-checkbox-border-width, 1px);
  --ag-checkbox-border-radius: var(--ag-inherited-checkbox-border-radius,
      var(--ag-border-radius));
  --ag-checkbox-unchecked-background-color: var(--ag-inherited-checkbox-unchecked-background-color,
      var(--ag-background-color));
  --ag-checkbox-unchecked-border-color: var(--ag-inherited-checkbox-unchecked-border-color,
      color-mix(in srgb,
        var(--ag-background-color),
        var(--ag-foreground-color) 30%));
  --ag-checkbox-checked-background-color: var(--ag-inherited-checkbox-checked-background-color,
      var(--ag-accent-color));
  --ag-checkbox-checked-border-color: var(--ag-inherited-checkbox-checked-border-color,
      var(--ag-accent-color));
  --ag-checkbox-checked-shape-image: var(--ag-inherited-checkbox-checked-shape-image,
      url("data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2210%22%20height%3D%227%22%20fill%3D%22none%22%3E%3Cpath%20stroke%3D%22%23000%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%221.75%22%20d%3D%22M1%203.5%203.5%206l5-5%22%2F%3E%3C%2Fsvg%3E"));
  --ag-checkbox-checked-shape-color: var(--ag-inherited-checkbox-checked-shape-color,
      var(--ag-background-color));
  --ag-checkbox-indeterminate-background-color: var(--ag-inherited-checkbox-indeterminate-background-color,
      color-mix(in srgb,
        var(--ag-background-color),
        var(--ag-foreground-color) 30%));
  --ag-checkbox-indeterminate-border-color: var(--ag-inherited-checkbox-indeterminate-border-color,
      color-mix(in srgb,
        var(--ag-background-color),
        var(--ag-foreground-color) 30%));
  --ag-checkbox-indeterminate-shape-image: var(--ag-inherited-checkbox-indeterminate-shape-image,
      url("data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2210%22%20height%3D%222%22%20fill%3D%22none%22%3E%3Crect%20width%3D%2210%22%20height%3D%222%22%20fill%3D%22%23000%22%20rx%3D%221%22%2F%3E%3C%2Fsvg%3E"));
  --ag-checkbox-indeterminate-shape-color: var(--ag-inherited-checkbox-indeterminate-shape-color,
      var(--ag-background-color));
  --ag-radio-checked-shape-image: var(--ag-inherited-radio-checked-shape-image,
      url("data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%226%22%20height%3D%226%22%20fill%3D%22none%22%3E%3Ccircle%20cx%3D%223%22%20cy%3D%223%22%20r%3D%223%22%20fill%3D%22%23000%22%2F%3E%3C%2Fsvg%3E"));
  --ag-menu-border: var(--ag-inherited-menu-border,
      solid 1px color-mix(in srgb, transparent, var(--ag-foreground-color) 20%));
  --ag-menu-background-color: var(--ag-inherited-menu-background-color,
      color-mix(in srgb,
        var(--ag-background-color),
        var(--ag-foreground-color) 3%));
  --ag-menu-text-color: var(--ag-inherited-menu-text-color,
      color-mix(in srgb,
        var(--ag-background-color),
        var(--ag-foreground-color) 95%));
  --ag-menu-shadow: var(--ag-inherited-menu-shadow, var(--ag-popup-shadow));
  --ag-menu-separator-color: var(--ag-inherited-menu-separator-color,
      var(--ag-border-color));
  --ag-set-filter-indent-size: var(--ag-inherited-set-filter-indent-size,
      var(--ag-icon-size));
  --ag-chart-menu-panel-width: var(--ag-inherited-chart-menu-panel-width,
      260px);
  --ag-chart-menu-label-color: var(--ag-inherited-chart-menu-label-color,
      color-mix(in srgb, transparent, var(--ag-foreground-color) 80%));
  --ag-icon-button-hover-color: var(--ag-inherited-icon-button-hover-color,
      color-mix(in srgb, transparent, var(--ag-foreground-color) 10%));
  --ag-dialog-shadow: var(--ag-inherited-dialog-shadow, var(--ag-popup-shadow));
  --ag-dialog-border: var(--ag-inherited-dialog-border,
      solid 1px color-mix(in srgb, transparent, var(--ag-foreground-color) 20%));
  --ag-panel-background-color: var(--ag-inherited-panel-background-color,
      var(--ag-background-color));
  --ag-panel-title-bar-background-color: var(--ag-inherited-panel-title-bar-background-color,
      var(--ag-header-background-color));
  --ag-panel-title-bar-border: var(--ag-inherited-panel-title-bar-border,
      solid 1px var(--ag-border-color));
  --ag-column-select-indent-size: var(--ag-inherited-column-select-indent-size,
      var(--ag-icon-size));
  --ag-tool-panel-separator-border: var(--ag-inherited-tool-panel-separator-border,
      solid 1px var(--ag-border-color));
  --ag-tooltip-background-color: var(--ag-inherited-tooltip-background-color,
      var(--ag-chrome-background-color));
  --ag-tooltip-text-color: var(--ag-inherited-tooltip-text-color,
      var(--ag-text-color));
  --ag-tooltip-border: var(--ag-inherited-tooltip-border,
      solid 1px var(--ag-border-color));
  --ag-column-drop-cell-background-color: var(--ag-inherited-column-drop-cell-background-color,
      color-mix(in srgb, transparent, var(--ag-foreground-color) 7%));
  --ag-column-drop-cell-border: var(--ag-inherited-column-drop-cell-border,
      solid 1px color-mix(in srgb, transparent, var(--ag-foreground-color) 13%));
  --ag-select-cell-background-color: var(--ag-inherited-select-cell-background-color,
      color-mix(in srgb, transparent, var(--ag-foreground-color) 7%));
  --ag-select-cell-border: var(--ag-inherited-select-cell-border,
      solid 1px color-mix(in srgb, transparent, var(--ag-foreground-color) 13%));
  --ag-advanced-filter-builder-button-bar-border: var(--ag-inherited-advanced-filter-builder-button-bar-border,
      solid 1px var(--ag-border-color));
  --ag-advanced-filter-builder-indent-size: var(--ag-inherited-advanced-filter-builder-indent-size,
      calc(var(--ag-grid-size) * 2 + var(--ag-icon-size)));
  --ag-advanced-filter-builder-join-pill-color: var(--ag-inherited-advanced-filter-builder-join-pill-color,
      #f08e8d);
  --ag-advanced-filter-builder-column-pill-color: var(--ag-inherited-advanced-filter-builder-column-pill-color,
      #a6e194);
  --ag-advanced-filter-builder-option-pill-color: var(--ag-inherited-advanced-filter-builder-option-pill-color,
      #f3c08b);
  --ag-advanced-filter-builder-value-pill-color: var(--ag-inherited-advanced-filter-builder-value-pill-color,
      #85c0e4);
  --ag-filter-tool-panel-group-indent: var(--ag-inherited-filter-tool-panel-group-indent,
      var(--ag-grid-size));
  --ag-icon-button-hover-background-color: var(--ag-inherited-icon-button-hover-background-color,
      color-mix(in srgb, transparent, var(--ag-foreground-color) 10%));
  --ag-row-loading-skeleton-effect-color: var(--ag-inherited-row-loading-skeleton-effect-color,
      rgba(66, 66, 66, 0.2));
  --ag-tab-bar-background-color: var(--ag-inherited-tab-bar-background-color,
      color-mix(in srgb, transparent, var(--ag-foreground-color) 5%));
  --ag-tab-bar-horizontal-padding: var(--ag-inherited-tab-bar-horizontal-padding,
      0);
  --ag-tab-bar-top-padding: var(--ag-inherited-tab-bar-top-padding, 0);
  --ag-tab-background-color: var(--ag-inherited-tab-background-color,
      transparent);
  --ag-tab-text-color: var(--ag-inherited-tab-text-color,
      color-mix(in srgb, transparent, var(--ag-text-color) 70%));
  --ag-tab-horizontal-padding: var(--ag-inherited-tab-horizontal-padding,
      calc(var(--ag-grid-size)));
  --ag-tab-top-padding: var(--ag-inherited-tab-top-padding,
      calc(var(--ag-grid-size)));
  --ag-tab-bottom-padding: var(--ag-inherited-tab-bottom-padding,
      calc(var(--ag-grid-size)));
  --ag-tab-spacing: var(--ag-inherited-tab-spacing, 0);
  --ag-tab-hover-background-color: var(--ag-inherited-tab-hover-background-color,
      var(--ag-tab-background-color));
  --ag-tab-hover-text-color: var(--ag-inherited-tab-hover-text-color,
      var(--ag-text-color));
  --ag-tab-selected-background-color: var(--ag-inherited-tab-selected-background-color,
      var(--ag-background-color));
  --ag-tab-selected-text-color: var(--ag-inherited-tab-selected-text-color,
      var(--ag-text-color));
  --ag-tab-selected-border-width: var(--ag-inherited-tab-selected-border-width,
      1px);
  --ag-tab-selected-border-color: var(--ag-inherited-tab-selected-border-color,
      var(--ag-border-color));
  --ag-tab-selected-underline-color: var(--ag-inherited-tab-selected-underline-color,
      transparent);
  --ag-tab-selected-underline-width: var(--ag-inherited-tab-selected-underline-width,
      0);
  --ag-tab-selected-underline-transition-duration: var(--ag-inherited-tab-selected-underline-transition-duration,
      0);
  --ag-tab-bar-border: var(--ag-inherited-tab-bar-border,
      solid 1px var(--ag-border-color));
  --ag-input-background-color: var(--ag-inherited-input-background-color,
      var(--ag-background-color));
  --ag-input-border: var(--ag-inherited-input-border,
      solid 1px var(--ag-border-color));
  --ag-input-border-radius: var(--ag-inherited-input-border-radius,
      var(--ag-border-radius));
  --ag-input-text-color: var(--ag-inherited-input-text-color,
      var(--ag-text-color));
  --ag-input-padding-start: var(--ag-inherited-input-padding-start,
      var(--ag-grid-size));
  --ag-input-height: var(--ag-inherited-input-height,
      calc(max(var(--ag-icon-size), var(--ag-font-size)) + var(--ag-grid-size) * 2));
  --ag-input-focus-background-color: var(--ag-inherited-input-focus-background-color,
      var(--ag-input-background-color));
  --ag-input-focus-border: var(--ag-inherited-input-focus-border,
      solid 1px var(--ag-accent-color));
  --ag-input-focus-shadow: var(--ag-inherited-input-focus-shadow,
      var(--ag-focus-shadow));
  --ag-input-focus-text-color: var(--ag-inherited-input-focus-text-color,
      var(--ag-input-text-color));
  --ag-input-disabled-background-color: var(--ag-inherited-input-disabled-background-color,
      color-mix(in srgb,
        var(--ag-background-color),
        var(--ag-foreground-color) 6%));
  --ag-input-disabled-border: var(--ag-inherited-input-disabled-border,
      var(--ag-input-border));
  --ag-input-disabled-text-color: var(--ag-inherited-input-disabled-text-color,
      color-mix(in srgb, transparent, var(--ag-text-color) 50%));
  --ag-input-invalid-background-color: var(--ag-inherited-input-invalid-background-color,
      var(--ag-input-background-color));
  --ag-input-invalid-border: var(--ag-inherited-input-invalid-border,
      solid 1px var(--ag-invalid-color));
  --ag-input-invalid-text-color: var(--ag-inherited-input-invalid-text-color,
      var(--ag-input-text-color));
}
</style>
