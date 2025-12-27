import { UI } from '../core/ui.js';
export const PengaturanModule = { async init() { const rows = await UI.loadTableData('pengaturan'); this.render(rows); }, render(rows) { /* Generic Render */ } };
