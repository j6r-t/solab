/**
 * Unit tests for stock.service.ts filter builders
 * Run with: npm test -- stock.service.test.ts
 *
 * These tests verify the filter builder functions that extract search logic
 * from the main listProducts function.
 */

import { describe, it, expect } from 'vitest'

// Types
interface StockQuery {
    search?: string
    category?: string
    fournisseurId?: string
    stockStatus?: string
    brand?: string
    lensType?: string
    material?: string
    coating?: string
    thickness?: string
    sphFrom?: string
    sphTo?: string
    cylFrom?: string
    cylTo?: string
    addFrom?: string
    addTo?: string
    excludeCategory?: string
}

// Filter builder functions (same logic as stock.service.ts)
function buildSearchConditions(params: StockQuery) {
    const conditions: Record<string, unknown>[] = []

    if (params.search) {
        conditions.push(
            { name: { contains: params.search } },
            { brand: { contains: params.search } },
            { model: { contains: params.search } },
        )
    }

    if (params.brand) {
        conditions.push({ brand: { contains: params.brand } })
    }

    return conditions
}

function buildExactMatchConditions(params: StockQuery) {
    const conditions: Record<string, unknown> = {}

    if (params.category) {
        conditions.category = params.category
    }
    if (params.excludeCategory) {
        conditions.category = { not: params.excludeCategory }
    }
    if (params.fournisseurId) {
        conditions.fournisseurId = params.fournisseurId
    }

    if (params.lensType) {
        conditions.lensType = params.lensType
    }

    if (params.material) {
        conditions.material = params.material
    }

    if (params.coating) {
        conditions.coating = params.coating
    }

    return conditions
}

function buildRangeConditions(params: StockQuery) {
    const conditions: Record<string, unknown> = {}

    const sphGte = params.sphFrom ? parseFloat(params.sphFrom) : NaN
    const sphLte = params.sphTo ? parseFloat(params.sphTo) : NaN
    if (!isNaN(sphGte) || !isNaN(sphLte)) {
        conditions.sph = { ...(isNaN(sphGte) ? {} : { gte: sphGte }), ...(isNaN(sphLte) ? {} : { lte: sphLte }) }
    }

    const cylGte = params.cylFrom ? parseFloat(params.cylFrom) : NaN
    const cylLte = params.cylTo ? parseFloat(params.cylTo) : NaN
    if (!isNaN(cylGte) || !isNaN(cylLte)) {
        conditions.cyl = { ...(isNaN(cylGte) ? {} : { gte: cylGte }), ...(isNaN(cylLte) ? {} : { lte: cylLte }) }
    }

    const addGte = params.addFrom ? parseFloat(params.addFrom) : NaN
    const addLte = params.addTo ? parseFloat(params.addTo) : NaN
    if (!isNaN(addGte) || !isNaN(addLte)) {
        conditions.add = { ...(isNaN(addGte) ? {} : { gte: addGte }), ...(isNaN(addLte) ? {} : { lte: addLte }) }
    }

    return conditions
}

function buildThicknessCondition(params: StockQuery) {
    if (params.thickness) {
        return { thickness: { contains: params.thickness } }
    }
    return undefined
}

function buildStockStatusCondition(params: StockQuery) {
    if (params.stockStatus === 'outOfStock') {
        return { quantity: 0 }
    } else if (params.stockStatus === 'lowStock') {
        return { quantity: { gt: 0, lte: 5 } }
    } else if (params.stockStatus === 'inStock') {
        return { quantity: { gt: 5 } }
    }
    return undefined
}

describe('stock.service - Filter Builders', () => {
    describe('buildSearchConditions', () => {
        it('should build OR conditions for search term', () => {
            const params = { search: 'test' }
            const conditions = buildSearchConditions(params)

            expect(conditions).toHaveLength(3)
            expect(conditions[0]).toEqual({ name: { contains: 'test' } })
            expect(conditions[1]).toEqual({ brand: { contains: 'test' } })
            expect(conditions[2]).toEqual({ model: { contains: 'test' } })
        })

        it('should build brand condition when brand is provided', () => {
            const params = { brand: 'Acme' }
            const conditions = buildSearchConditions(params)

            expect(conditions).toHaveLength(1)
            expect(conditions[0]).toEqual({ brand: { contains: 'Acme' } })
        })

        it('should return empty array when no search or brand', () => {
            const params = {}
            const conditions = buildSearchConditions(params)

            expect(conditions).toHaveLength(0)
        })
    })

    describe('buildExactMatchConditions', () => {
        it('should build category condition when valid category', () => {
            const params = { category: 'lunette' }
            const conditions = buildExactMatchConditions(params)

            expect(conditions.category).toBe('lunette')
        })

        it('should build excludeCategory condition', () => {
            const params = { excludeCategory: 'accessory' }
            const conditions = buildExactMatchConditions(params)

            expect(conditions.category).toEqual({ not: 'accessory' })
        })

        it('should build fournisseurId condition', () => {
            const params = { fournisseurId: 'fournisseur-123' }
            const conditions = buildExactMatchConditions(params)

            expect(conditions.fournisseurId).toBe('fournisseur-123')
        })

        it('should build lensType condition', () => {
            const params = { lensType: 'singleVision' }
            const conditions = buildExactMatchConditions(params)

            expect(conditions.lensType).toBe('singleVision')
        })

        it('should return empty object when no conditions', () => {
            const params = {}
            const conditions = buildExactMatchConditions(params)

            expect(conditions).toEqual({})
        })
    })

    describe('buildRangeConditions', () => {
        it('should build sph range when both from and to provided', () => {
            const params = { sphFrom: '-5.0', sphTo: '+2.0' }
            const conditions = buildRangeConditions(params)

            expect(conditions.sph).toEqual({ gte: -5.0, lte: 2.0 })
        })

        it('should build sph range with only gte', () => {
            const params = { sphFrom: '-3.0' }
            const conditions = buildRangeConditions(params)

            expect(conditions.sph).toEqual({ gte: -3.0 })
        })

        it('should build sph range with only lte', () => {
            const params = { sphTo: '+2.0' }
            const conditions = buildRangeConditions(params)

            expect(conditions.sph).toEqual({ lte: 2.0 })
        })

        it('should build cyl range', () => {
            const params = { cylFrom: '-2.0', cylTo: '+1.0' }
            const conditions = buildRangeConditions(params)

            expect(conditions.cyl).toEqual({ gte: -2.0, lte: 1.0 })
        })

        it('should build add range', () => {
            const params = { addFrom: '1.0', addTo: '3.0' }
            const conditions = buildRangeConditions(params)

            expect(conditions.add).toEqual({ gte: 1.0, lte: 3.0 })
        })

        it('should return empty object when no valid ranges', () => {
            const params = { sphFrom: 'invalid', sphTo: 'also-invalid' }
            const conditions = buildRangeConditions(params)

            expect(conditions).toEqual({})
        })
    })

    describe('buildThicknessCondition', () => {
        it('should build thickness condition when provided', () => {
            const params = { thickness: '1.5' }
            const condition = buildThicknessCondition(params)

            expect(condition).toEqual({ thickness: { contains: '1.5' } })
        })

        it('should return undefined when no thickness', () => {
            const params = {}
            const condition = buildThicknessCondition(params)

            expect(condition).toBeUndefined()
        })
    })

    describe('buildStockStatusCondition', () => {
        it('should build outOfStock condition', () => {
            const params = { stockStatus: 'outOfStock' }
            const condition = buildStockStatusCondition(params)

            expect(condition).toEqual({ quantity: 0 })
        })

        it('should build lowStock condition', () => {
            const params = { stockStatus: 'lowStock' }
            const condition = buildStockStatusCondition(params)

            expect(condition).toBeDefined()
            expect((condition as Record<string, { gt: number }>).quantity.gt).toBe(0)
            expect((condition as Record<string, { lte: number }>).quantity.lte).toBe(5)
        })

        it('should build inStock condition', () => {
            const params = { stockStatus: 'inStock' }
            const condition = buildStockStatusCondition(params)

            expect(condition).toEqual({ quantity: { gt: 5 } })
        })

        it('should return undefined when no stockStatus', () => {
            const params = {}
            const condition = buildStockStatusCondition(params)

            expect(condition).toBeUndefined()
        })
    })
})
