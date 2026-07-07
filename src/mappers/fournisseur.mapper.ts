import type { FournisseurResponse } from '@/dtos/fournisseurs/fournisseur.dto'

export function toFournisseurResponse(fournisseur: { id: string; name: string; phone: string; address: string | null; email: string | null; taxId: string | null; createdAt: Date; _count?: { products: number } }): FournisseurResponse {
    return {
        id: fournisseur.id,
        name: fournisseur.name,
        phone: fournisseur.phone,
        address: fournisseur.address,
        email: fournisseur.email,
        taxId: fournisseur.taxId,
        createdAt: fournisseur.createdAt,
        _count: { products: fournisseur._count?.products ?? 0 },
    }
}
