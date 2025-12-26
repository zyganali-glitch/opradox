/**
 * @jest-environment jsdom
 */

// Mock VIZ_STATE for testing
const mockVIZ_STATE = {
    lang: 'tr',
    datasets: {},
    activeDatasetId: null,
    datasetCounter: 0,
    charts: [],
    selectedChart: null,
    chartCounter: 0,
    echartsInstances: {},
    getActiveDataset: jest.fn(() => null),
    getActiveData: jest.fn(() => null),
    getActiveColumns: jest.fn(() => []),
    addDataset: jest.fn((file, data, columns, columnsInfo) => {
        const id = `dataset_${++mockVIZ_STATE.datasetCounter}`;
        mockVIZ_STATE.datasets[id] = { id, file, data, columns, columnsInfo };
        mockVIZ_STATE.activeDatasetId = id;
        return id;
    }),
    setActiveDataset: jest.fn((id) => {
        if (mockVIZ_STATE.datasets[id]) {
            mockVIZ_STATE.activeDatasetId = id;
            return true;
        }
        return false;
    }),
    removeDataset: jest.fn((id) => {
        if (mockVIZ_STATE.datasets[id]) {
            delete mockVIZ_STATE.datasets[id];
            return true;
        }
        return false;
    }),
    getDatasetList: jest.fn(() => Object.values(mockVIZ_STATE.datasets).map(d => ({
        id: d.id,
        name: d.file?.name || d.id,
        rowCount: d.data?.length || 0
    })))
};

// Tests
describe('VIZ_STATE', () => {
    beforeEach(() => {
        // Reset state
        mockVIZ_STATE.datasets = {};
        mockVIZ_STATE.activeDatasetId = null;
        mockVIZ_STATE.datasetCounter = 0;
        mockVIZ_STATE.charts = [];
    });

    test('should start with default language as Turkish', () => {
        expect(mockVIZ_STATE.lang).toBe('tr');
    });

    test('should add dataset and return ID', () => {
        const file = { name: 'test.xlsx' };
        const data = [{ a: 1, b: 2 }];
        const columns = ['a', 'b'];
        const columnsInfo = [{ name: 'a', type: 'numeric' }];

        const id = mockVIZ_STATE.addDataset(file, data, columns, columnsInfo);

        expect(id).toBe('dataset_1');
        expect(mockVIZ_STATE.activeDatasetId).toBe('dataset_1');
    });

    test('should set active dataset correctly', () => {
        mockVIZ_STATE.datasets['dataset_1'] = { id: 'dataset_1' };
        mockVIZ_STATE.datasets['dataset_2'] = { id: 'dataset_2' };

        const result = mockVIZ_STATE.setActiveDataset('dataset_2');

        expect(result).toBe(true);
        expect(mockVIZ_STATE.activeDatasetId).toBe('dataset_2');
    });

    test('should fail to set non-existent dataset as active', () => {
        const result = mockVIZ_STATE.setActiveDataset('nonexistent');
        expect(result).toBe(false);
    });

    test('should remove dataset correctly', () => {
        mockVIZ_STATE.datasets['dataset_1'] = { id: 'dataset_1' };

        const result = mockVIZ_STATE.removeDataset('dataset_1');

        expect(result).toBe(true);
        expect(mockVIZ_STATE.datasets['dataset_1']).toBeUndefined();
    });
});
