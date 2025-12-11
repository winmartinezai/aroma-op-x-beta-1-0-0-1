/**
 * Service Catalog Migration Script
 * 
 * This script migrates the pricing data from constants.ts to Supabase service_catalog table.
 * Run this ONCE after creating the service_catalog table in Supabase.
 * 
 * Usage:
 * 1. Make sure Supabase credentials are in .env
 * 2. Run SQL migration first: 001_service_catalog.sql
 * 3. Then run this script from Settings > Data > "Migrate to Service Catalog"
 */

import { supabase } from './supabaseClient';
import { APP_CONFIG } from './constants';

export interface ServiceCatalogItem {
    id?: string;
    category: 'PAINT' | 'CLEAN' | 'TOUCH_UP_PAINT' | 'TOUCH_UP_CLEAN' | 'EXTRAS';
    name: string;
    client_price: number;
    employee_pay: number;
    template_name: string | null;
    is_active: boolean;
}

/**
 * Migrate pricing templates from constants.ts to Supabase
 */
export async function migrateToServiceCatalog(): Promise<{ success: boolean; message: string; count?: number }> {
    try {
        const items: Omit<ServiceCatalogItem, 'id'>[] = [];

        // Iterate through all templates
        for (const [templateName, template] of Object.entries(APP_CONFIG.PRICING_TEMPLATES)) {
            // Process each category
            for (const [category, sizes] of Object.entries(template as Record<string, any>)) {
                if (typeof sizes === 'object' && sizes !== null) {
                    // Process each size/item
                    for (const [name, prices] of Object.entries(sizes as Record<string, any>)) {
                        if (typeof prices === 'object' && 'client' in prices && 'emp' in prices) {
                            items.push({
                                category: category as ServiceCatalogItem['category'],
                                name,
                                client_price: prices.client,
                                employee_pay: prices.emp,
                                template_name: templateName,
                                is_active: true
                            });
                        }
                    }
                }
            }
        }

        if (items.length === 0) {
            return {
                success: false,
                message: 'No pricing data found in APP_CONFIG.PRICING_TEMPLATES'
            };
        }

        // Insert into Supabase (upsert to avoid duplicates)
        const { data, error } = await supabase
            .from('service_catalog')
            .upsert(items, {
                onConflict: 'category,name,template_name',
                ignoreDuplicates: false
            })
            .select();

        if (error) {
            console.error('Migration error:', error);
            return {
                success: false,
                message: `Migration failed: ${error.message}`
            };
        }

        return {
            success: true,
            message: `Successfully migrated ${items.length} service items to catalog`,
            count: items.length
        };

    } catch (error: any) {
        console.error('Migration exception:', error);
        return {
            success: false,
            message: `Migration exception: ${error.message || 'Unknown error'}`
        };
    }
}

/**
 * Verify service catalog data
 */
export async function verifyServiceCatalog(): Promise<{ success: boolean; message: string; count?: number }> {
    try {
        const { data, error, count } = await supabase
            .from('service_catalog')
            .select('*', { count: 'exact' })
            .eq('is_active', true);

        if (error) {
            return {
                success: false,
                message: `Verification failed: ${error.message}`
            };
        }

        return {
            success: true,
            message: `Service catalog contains ${count} active items`,
            count: count || 0
        };

    } catch (error: any) {
        return {
            success: false,
            message: `Verification exception: ${error.message || 'Unknown error'}`
        };
    }
}

/**
 * Get service catalog items by category and template
 */
export async function getServiceCatalogItems(
    category?: ServiceCatalogItem['category'],
    templateName?: string
): Promise<ServiceCatalogItem[]> {
    try {
        let query = supabase
            .from('service_catalog')
            .select('*')
            .eq('is_active', true);

        if (category) {
            query = query.eq('category', category);
        }

        if (templateName) {
            query = query.eq('template_name', templateName);
        }

        const { data, error } = await query.order('category').order('name');

        if (error) {
            console.error('Error fetching service catalog:', error);
            return [];
        }

        return data || [];

    } catch (error) {
        console.error('Exception fetching service catalog:', error);
        return [];
    }
}

/**
 * Add a new service item to the catalog
 */
export async function addServiceCatalogItem(
    item: Omit<ServiceCatalogItem, 'id'>
): Promise<{ success: boolean; message: string; data?: ServiceCatalogItem }> {
    try {
        const { data, error } = await supabase
            .from('service_catalog')
            .insert([item])
            .select()
            .single();

        if (error) {
            return {
                success: false,
                message: `Failed to add item: ${error.message}`
            };
        }

        return {
            success: true,
            message: 'Service item added successfully',
            data
        };

    } catch (error: any) {
        return {
            success: false,
            message: `Exception: ${error.message || 'Unknown error'}`
        };
    }
}

/**
 * Update an existing service item
 */
export async function updateServiceCatalogItem(
    id: string,
    updates: Partial<Omit<ServiceCatalogItem, 'id'>>
): Promise<{ success: boolean; message: string }> {
    try {
        const { error } = await supabase
            .from('service_catalog')
            .update(updates)
            .eq('id', id);

        if (error) {
            return {
                success: false,
                message: `Failed to update item: ${error.message}`
            };
        }

        return {
            success: true,
            message: 'Service item updated successfully'
        };

    } catch (error: any) {
        return {
            success: false,
            message: `Exception: ${error.message || 'Unknown error'}`
        };
    }
}

/**
 * Soft delete a service item (set is_active = false)
 */
export async function deleteServiceCatalogItem(
    id: string
): Promise<{ success: boolean; message: string }> {
    try {
        const { error } = await supabase
            .from('service_catalog')
            .update({ is_active: false })
            .eq('id', id);

        if (error) {
            return {
                success: false,
                message: `Failed to delete item: ${error.message}`
            };
        }

        return {
            success: true,
            message: 'Service item archived successfully'
        };

    } catch (error: any) {
        return {
            success: false,
            message: `Exception: ${error.message || 'Unknown error'}`
        };
    }
}
