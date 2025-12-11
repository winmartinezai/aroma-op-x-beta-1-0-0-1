/**
 * useJobsByMonth Hook
 * 
 * Fetches jobs for a specific month with caching
 * Optimized for Calendar View performance
 */

import { useMemo } from 'react';
import { useApp } from '../context/AppContext';
import type { Job } from '../types/types';

interface UseJobsByMonthOptions {
    year: number;
    month: number; // 1-12
}

interface UseJobsByMonthReturn {
    jobs: Job[];
    isLoading: boolean;
    totalJobs: number;
}

export function useJobsByMonth({ year, month }: UseJobsByMonthOptions): UseJobsByMonthReturn {
    const { jobs: allJobs } = useApp();

    const { filteredJobs, totalJobs } = useMemo(() => {
        // Create date range for the month
        const startDate = new Date(year, month - 1, 1); // month is 0-indexed in Date
        startDate.setHours(0, 0, 0, 0);

        const endDate = new Date(year, month, 0); // Last day of month
        endDate.setHours(23, 59, 59, 999);

        // Filter jobs within this month
        const filtered = allJobs.filter(job => {
            const jobDate = new Date(job.date);
            return jobDate >= startDate && jobDate <= endDate;
        });

        return {
            filteredJobs: filtered,
            totalJobs: filtered.length
        };
    }, [allJobs, year, month]);

    return {
        jobs: filteredJobs,
        isLoading: false, // Using local data, no async loading needed
        totalJobs
    };
}

/**
 * Helper to get month name
 */
export function getMonthName(month: number): string {
    const months = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return months[month - 1] || '';
}

/**
 * Helper to get months in a year with job counts
 */
export function useMonthsWithJobCounts(year: number) {
    const { jobs: allJobs } = useApp();

    return useMemo(() => {
        const monthCounts: { month: number; count: number; name: string }[] = [];

        for (let month = 1; month <= 12; month++) {
            const startDate = new Date(year, month - 1, 1);
            startDate.setHours(0, 0, 0, 0);

            const endDate = new Date(year, month, 0);
            endDate.setHours(23, 59, 59, 999);

            const count = allJobs.filter(job => {
                const jobDate = new Date(job.date);
                return jobDate >= startDate && jobDate <= endDate;
            }).length;

            monthCounts.push({
                month,
                count,
                name: getMonthName(month)
            });
        }

        return monthCounts;
    }, [allJobs, year]);
}
