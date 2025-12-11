/**
 * Hook to get available sizes from Service Catalog
 * Combines catalog sizes with legacy sizes for backward compatibility
 */

import { useMemo } from 'react';
import { useServiceCatalog } from './useServiceCatalog';
import type { ServiceCatalogItem } from '../utils/serviceCatalog';

interface UseAvailableSizesOptions {
    category?: ServiceCatalogItem['category'];
    templateName?: string;
    includeLegacySizes?: boolean;
}

export function useAvailableSizes(options: UseAvailableSizesOptions = {}) {
    const { category, templateName, includeLegacySizes = true } = options;

    const { items, isLoading } = useServiceCatalog(category, templateName);

    const sizes = useMemo(() => {
        // Get unique sizes from service catalog
        const catalogSizes = new Set<string>();
        items.forEach(item => {
            catalogSizes.add(item.name);
        });

        // Convert to sorted array
        const sizeArray = Array.from(catalogSizes).sort((a, b) => {
            // Custom sort: Studio first, then numeric sizes
            if (a === 'Studio') return -1;
            if (b === 'Studio') return 1;

            // Extract numbers for comparison (e.g., "2x2" -> 2)
            const aNum = parseInt(a.match(/\d+/)?.[0] || '999');
            const bNum = parseInt(b.match(/\d+/)?.[0] || '999');

            return aNum - bNum;
        });

        return sizeArray;
    }, [items]);

    return {
        sizes,
        isLoading,
        catalogItems: items
    };
}

/**
 * Hook to get available sizes for a specific job type
 */
export function useAvailableSizesForJobType(jobType: string, templateName?: string) {
    // Map job type to catalog category
    const category = useMemo((): ServiceCatalogItem['category'] | undefined => {
        if (jobType === 'Paint') return 'PAINT';
        if (jobType === 'Clean') return 'CLEAN';
        if (jobType === 'Touch Up Paint') return 'TOUCH_UP_PAINT';
        if (jobType === 'Touch Up Clean') return 'TOUCH_UP_CLEAN';
        return undefined;
    }, [jobType]);

    return useAvailableSizes({ category, templateName });
}
