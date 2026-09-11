import React from 'react';
import Dashboard from './Dashboard';
import MigrationRiskMap from './MigrationRiskMap';
import DistrictProfile from './DistrictProfile';
import InfrastructureGaps from './InfrastructureGaps';
import CompareAreas from './CompareAreas';
import Trends from './Trends';
import Reports from './Reports';
import AdminDashboard from './AdminDashboard';
import Login from './Login';
import HomePage from './HomePage';

describe('Component Export Tests', () => {
    test('Dashboard is valid component', () => {
        expect(typeof Dashboard).toBe('function');
    });
    test('MigrationRiskMap is valid component', () => {
        expect(typeof MigrationRiskMap).toBe('function');
    });
    test('DistrictProfile is valid component', () => {
        expect(typeof DistrictProfile).toBe('function');
    });
    test('InfrastructureGaps is valid component', () => {
        expect(typeof InfrastructureGaps).toBe('function');
    });
    test('CompareAreas is valid component', () => {
        expect(typeof CompareAreas).toBe('function');
    });
    test('Trends is valid component', () => {
        expect(typeof Trends).toBe('function');
    });
    test('Reports is valid component', () => {
        expect(typeof Reports).toBe('function');
    });
    test('AdminDashboard is valid component', () => {
        expect(typeof AdminDashboard).toBe('function');
    });
    test('Login is valid component', () => {
        expect(typeof Login).toBe('function');
    });
    test('HomePage is valid component', () => {
        expect(typeof HomePage).toBe('function');
    });
});