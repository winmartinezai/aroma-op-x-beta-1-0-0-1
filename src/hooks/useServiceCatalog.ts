/**
 * Custom React Hook for Service Catalog
 * 
 * Provides real-time access to service catalog with caching and offline support
 * Uses TanStack Query for optimal performance
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    getServiceCatalogItems,
    addServiceCatalogItem,
    updateServiceCatalogItem,
    deleteServiceCatalogItem
} from '../utils/serviceCatalog';
import type {
    ServiceCatalogItem
} from '../utils/serviceCatalog';

export function useServiceCatalog(category?: ServiceCatalogItem['category'], templateName?: string) {
    const queryClient = useQueryClient();

    // Fetch service catalog items
    const {
        data: items = [],
        isLoading,
        error,
        refetch
    } = useQuery<ServiceCatalogItem[]>({
        queryKey: ['serviceCatalog', category, templateName],
        queryFn: () => getServiceCatalogItems(category, templateName),
        staleTime: 5 * 60 * 1000, // 5 minutes
        gcTime: 30 * 60 * 1000, // 30 minutes (formerly cacheTime)
        refetchOnWindowFocus: true,
        refetchOnReconnect: true
    });

    // Add new item mutation
    const addItem = useMutation({
        mutationFn: (item: Omit<ServiceCatalogItem, 'id'>) => addServiceCatalogItem(item),
        onSuccess: () => {
            // Invalidate all service catalog queries to refresh data
            queryClient.invalidateQueries({ queryKey: ['serviceCatalog'] });
        }
    });

    // Update item mutation
    const updateItem = useMutation({
        mutationFn: ({ id, updates }: { id: string; updates: Partial<Omit<ServiceCatalogItem, 'id'>> }) =>
            updateServiceCatalogItem(id, updates),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['serviceCatalog'] });
        }
    });

    // Delete (archive) item mutation
    const deleteItem = useMutation({
        mutationFn: (id: string) => deleteServiceCatalogItem(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['serviceCatalog'] });
        }
    });

    return {
        items,
        isLoading,
        error,
        refetch,
        addItem: addItem.mutateAsync,
        updateItem: updateItem.mutateAsync,
        deleteItem: deleteItem.mutateAsync,
        isAdding: addItem.isPending,
        isUpdating: updateItem.isPending,
        isDeleting: deleteItem.isPending
    };
}

/**
 * Hook to get a specific service item by ID
 */
export function useServiceCatalogItem(id: string | null) {
    const { items } = useServiceCatalog();

    if (!id) return null;
    return items.find(item => item.id === id) || null;
}

/**
 * Hook to get service items grouped by category
 */
export function useServiceCatalogByCategory(templateName?: string) {
    const { items, ...rest } = useServiceCatalog(undefined, templateName);

    const grouped = items.reduce((acc: Record<ServiceCatalogItem['category'], ServiceCatalogItem[]>, item: ServiceCatalogItem) => {
        if (!acc[item.category]) {
            acc[item.category] = [];
        }
        acc[item.category].push(item);
        return acc;
    }, {} as Record<ServiceCatalogItem['category'], ServiceCatalogItem[]>);

    return {
        grouped,
        items,
        ...rest
    };
}
