import React from 'react';
import ContactsPortals from '../components/ContactsPortals';
import JobsTable from '../components/JobsTable';
// import { useApp } from '../context/AppContext';

const JobsMaster: React.FC = () => {
    // const { focusDateRange, setFocusDateRange, setJobsViewMode } = useApp();

    return (
        <div className="flex flex-col h-full bg-slate-50 overflow-hidden">
            {/* DATE HEADER - MOVED TO GLOBAL APP LAYOUT */}
            <div className="px-2 pt-2">
                <ContactsPortals />
            </div>

            <div className="flex-1 min-h-0">
                <JobsTable />
            </div>
        </div>
    );
};

export default JobsMaster;
