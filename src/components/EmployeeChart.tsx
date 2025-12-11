import React, { useMemo } from 'react';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
);

interface EmployeeChartProps {
    jobs: any[]; // Using any for now to match strictness level, ideally should use Job type
    employees: any[];
}

const EmployeeChart: React.FC<EmployeeChartProps> = ({ jobs, employees }) => {

    const chartData = useMemo(() => {
        // 1. Initialize data structure for each employee
        const empData: Record<string, { name: string, revenue: number, payroll: number, count: number }> = {};

        employees.forEach(emp => {
            empData[emp.name] = { name: emp.name, revenue: 0, payroll: 0, count: 0 };
        });

        // 2. Aggregate job data
        jobs.forEach(job => {
            // Normalize employee name matching if needed, assuming exact match for now
            const empName = job.assignedTo;

            // If the employee exists in our list (or create if ad-hoc)
            if (!empData[empName]) {
                empData[empName] = { name: empName, revenue: 0, payroll: 0, count: 0 };
            }

            const revenue = (job.clientPrice || 0) + (job.extrasPrice || 0);
            const payroll = (job.employeePrice || 0);

            empData[empName].revenue += revenue;
            empData[empName].payroll += payroll;
            empData[empName].count += 1;
        });

        // 3. Sort by Revenue descending
        const sortedEmps = Object.values(empData).sort((a, b) => b.revenue - a.revenue);

        // 4. Format for Chart.js
        const labels = sortedEmps.map(e => e.name);

        return {
            labels,
            datasets: [
                {
                    label: 'Revenue',
                    data: sortedEmps.map(e => e.revenue),
                    backgroundColor: 'rgba(16, 185, 129, 0.7)', // Emerald 500
                    borderColor: 'rgba(16, 185, 129, 1)',
                    borderWidth: 1,
                },
                {
                    label: 'Payroll',
                    data: sortedEmps.map(e => e.payroll),
                    backgroundColor: 'rgba(99, 102, 241, 0.7)', // Indigo 500
                    borderColor: 'rgba(99, 102, 241, 1)',
                    borderWidth: 1,
                },
            ],
        };
    }, [jobs, employees]);

    const options = {
        responsive: true,
        plugins: {
            legend: {
                position: 'top' as const,
            },
            title: {
                display: true,
                text: 'Employee Performance (Revenue vs Payroll)',
            },
            tooltip: {
                callbacks: {
                    label: function (context: any) {
                        let label = context.dataset.label || '';
                        if (label) {
                            label += ': ';
                        }
                        if (context.parsed.y !== null) {
                            label += new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(context.parsed.y);
                        }
                        return label;
                    }
                }
            }
        },
        scales: {
            y: {
                beginAtZero: true,
                ticks: {
                    // Include a dollar sign in the ticks
                    callback: function (value: any) {
                        return '$' + value;
                    }
                }
            }
        }
    };

    return (
        <div className="w-full h-full p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
            <Bar options={options} data={chartData} />
        </div>
    );
};

export default EmployeeChart;
