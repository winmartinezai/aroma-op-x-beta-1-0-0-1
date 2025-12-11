-- Phase 3: Advanced Facility Management Schema

-- 1. Property Schedules
-- Tracks staffing requirements per property per day
create table public.property_schedules (
    id uuid default gen_random_uuid() primary key,
    property_id text not null, -- Links to properties.id (text based in current app)
    day_of_week integer not null check (day_of_week between 0 and 6), -- 0=Sunday, 1=Monday...
    required_staff_count integer default 1,
    assigned_employee_ids text[] default '{}', -- Array of UUIDs or Names
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    unique(property_id, day_of_week)
);

-- 2. Inventory Items
-- Measurable products (cleaning supplies, etc.)
create table public.inventory_items (
    id uuid default gen_random_uuid() primary key,
    name text not null,
    category text default 'cleaning', -- e.g. cleaning, tools, paper
    unit text default 'unit', -- bottle, box, roll
    cost_per_unit numeric(10,2) default 0,
    current_stock integer default 0,
    reorder_threshold integer default 5,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Inventory Logs
-- Tracks consumption per property and restocks
create table public.inventory_logs (
    id uuid default gen_random_uuid() primary key,
    date date default current_date not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    
    item_id uuid references public.inventory_items(id) on delete cascade not null,
    property_id text, -- Where was it used? (Null if it's just a warehouse restock)
    requested_by text, -- Employee ID/Name
    
    quantity integer not null, -- Positive for Restock, Negative for Consumption
    type text check (type in ('consumption', 'restock', 'adjustment')) not null,
    
    notes text
);

-- Enable RLS (Row Level Security) - Optional but recommended
alter table public.property_schedules enable row level security;
alter table public.inventory_items enable row level security;
alter table public.inventory_logs enable row level security;

-- Policies (Open for now based on anon key usage, or adjust as needed)
create policy "Enable all access for anon" on public.property_schedules for all using (true) with check (true);
create policy "Enable all access for anon" on public.inventory_items for all using (true) with check (true);
create policy "Enable all access for anon" on public.inventory_logs for all using (true) with check (true);
