// Global Table Sorting Utility
export const TableSort = {
    createSortableModule(moduleName, globalModuleName = null) {
        const globalRef = globalModuleName || (moduleName.charAt(0).toUpperCase() + moduleName.slice(1) + 'Module');

        return {
            sortColumn: null,
            sortDirection: 'asc',

            toggleSort(column) {
                if (this.sortColumn === column) {
                    this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
                } else {
                    this.sortColumn = column;
                    this.sortDirection = 'asc';
                }

                this.updateHeaders();
                const searchInput = document.getElementById(`search-${moduleName}`);
                this.loadData(searchInput ? searchInput.value : '');
            },

            applySorting(rows) {
                if (!this.sortColumn) return rows;

                return [...rows].sort((a, b) => {
                    let valA = (a[this.sortColumn] || '').toString().toLowerCase();
                    let valB = (b[this.sortColumn] || '').toString().toLowerCase();

                    // Handle numbers (Use Number() to avoid parsing "2024-01-01" as 2024)
                    const numA = Number(valA);
                    const numB = Number(valB);
                    if (!isNaN(numA) && !isNaN(numB) && valA !== '' && valB !== '') {
                        return this.sortDirection === 'asc' ? numA - numB : numB - numA;
                    }

                    // Handle strings
                    if (valA < valB) return this.sortDirection === 'asc' ? -1 : 1;
                    if (valA > valB) return this.sortDirection === 'asc' ? 1 : -1;
                    return 0;
                });
            },

            getSortIcon(col) {
                if (this.sortColumn !== col) return '<i class="fas fa-sort sort-btn"></i>';
                return this.sortDirection === 'asc'
                    ? '<i class="fas fa-sort-up sort-btn active"></i>'
                    : '<i class="fas fa-sort-down sort-btn active"></i>';
            },

            createSortableHeader(label, col, width = null) {
                if (!col) return `<th${width ? ` style="width:${width}"` : ''}>${label}</th>`;
                return `<th${width ? ` style="width:${width}"` : ''} onclick="window.${globalRef}.toggleSort('${col}')" style="cursor:pointer;" class="sortable-header">
                    ${label} ${this.getSortIcon(col)}
                </th>`;
            }
        };
    }
};
