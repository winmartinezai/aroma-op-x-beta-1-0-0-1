/**
 * Calculate price from Service Catalog (NEW SYSTEM)
 * 
 * This replaces the old calculatePrice function with database-driven pricing
 */

import { getServiceCatalogItems, type ServiceCatalogItem } from './serviceCatalog';
import type { AppConfig, Employee } from '../types/types';

// Cache for catalog items to avoid repeated DB calls
let catalogCache: ServiceCatalogItem[] = [];
let cacheTimestamp = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Get price from Service Catalog
 */
export async function calculatePriceFromCatalog(
    property: string,
    size: string,
    type: string,
    appConfig?: AppConfig,
    employee?: Employee
): Promise<{ client: number; employee: number }> {
    try {
        // Map job type to catalog category
        let category: ServiceCatalogItem['category'] | null = null;
        if (type === 'Paint') category = 'PAINT';
        else if (type === 'Clean') category = 'CLEAN';
        else if (type === 'Touch Up Paint') category = 'TOUCH_UP_PAINT';
        else if (type === 'Touch Up Clean') category = 'TOUCH_UP_CLEAN';

        if (!category) return { client: 0, employee: 0 };

        // Determine template name
        const templateName = appConfig?.DEFAULTS?.template || 'YEAR_2025';

        // Check cache
        const now = Date.now();
        if (catalogCache.length === 0 || now - cacheTimestamp > CACHE_DURATION) {
            catalogCache = await getServiceCatalogItems();
            cacheTimestamp = now;
        }

        // Find matching item in catalog
        const catalogItem = catalogCache.find(
            item =>
                item.category === category &&
                item.name === size &&
                item.template_name === templateName &&
                item.is_active
        );

        if (!catalogItem) {
            console.warn(`No catalog item found for: ${category} ${size} ${templateName}`);
            return { client: 0, employee: 0 };
        }

        let result = {
            client: catalogItem.client_price,
            employee: catalogItem.employee_pay
        };

        // Apply employee-specific pricing if exists
        if (employee?.pricingConfig) {
            const { customRates, templateId } = employee.pricingConfig;

            // 1. Check for custom rate for this specific size/category
            if (customRates && customRates[category] && customRates[category][size]) {
                result.employee = customRates[category][size];
            }
            // 2. Check if employee has a different template (e.g., "Senior Rate")
            else if (templateId && templateId !== templateName) {
                const empCatalogItem = catalogCache.find(
                    item =>
                        item.category === category &&
                        item.name === size &&
                        item.template_name === templateId &&
                        item.is_active
                );
                if (empCatalogItem) {
                    result.employee = empCatalogItem.employee_pay;
                }
            }
        }

        return result;
    } catch (error) {
        console.error('Error calculating price from catalog:', error);
        return { client: 0, employee: 0 };
    }
}

/**
 * Synchronous version that uses cache only (for immediate UI updates)
 */
export function calculatePriceFromCatalogSync(
    size: string,
    type: string,
    templateName: string = 'YEAR_2025'
): { client: number; employee: number } {
    try {
        // Map job type to catalog category
        let category: ServiceCatalogItem['category'] | null = null;
        if (type === 'Paint') category = 'PAINT';
        else if (type === 'Clean') category = 'CLEAN';
        else if (type === 'Touch Up Paint') category = 'TOUCH_UP_PAINT';
        else if (type === 'Touch Up Clean') category = 'TOUCH_UP_CLEAN';

        if (!category || catalogCache.length === 0) {
            return { client: 0, employee: 0 };
        }

        // Find matching item in cache
        const catalogItem = catalogCache.find(
            item =>
                item.category === category &&
                item.name === size &&
                item.template_name === templateName &&
                item.is_active
        );

        if (!catalogItem) {
            return { client: 0, employee: 0 };
        }

        return {
            client: catalogItem.client_price,
            employee: catalogItem.employee_pay
        };
    } catch (error) {
        console.error('Error in sync price calculation:', error);
        return { client: 0, employee: 0 };
    }
}

/**
 * Preload catalog cache (call this on app startup)
 */
export async function preloadCatalogCache() {
    try {
        catalogCache = await getServiceCatalogItems();
        cacheTimestamp = Date.now();
        console.log(`✅ Catalog cache preloaded: ${catalogCache.length} items`);
    } catch (error) {
        console.error('Failed to preload catalog cache:', error);
    }
}
