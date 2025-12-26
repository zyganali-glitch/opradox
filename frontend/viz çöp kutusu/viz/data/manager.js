import { VIZ_STATE } from '../core/state.js';

/**
 * Dataset ekle
 */
export function addDataset(file, data, columns, columnsInfo, sheets = []) {
    return VIZ_STATE.addDataset(file, data, columns, columnsInfo, sheets);
}

/**
 * Dataset sil
 */
export function removeDataset(id) {
    return VIZ_STATE.removeDataset(id);
}

/**
 * Aktif dataset'i getir
 */
export function getActiveDataset() {
    return VIZ_STATE.getActiveDataset();
}

/**
 * Dataset listesini getir
 */
export function getDatasetList() {
    return VIZ_STATE.getDatasetList();
}
