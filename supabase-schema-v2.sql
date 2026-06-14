create extension if not exists pgcrypto;

create table if not exists public.app_users (
    id uuid primary key references auth.users (id) on delete cascade,
    full_name text not null,
    role text not null check (role in ('owner', 'manager', 'employee')),
    active boolean not null default true,
    phone text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table if not exists public.products (
    id uuid primary key default gen_random_uuid(),
    slug text not null unique,
    name text not null,
    category text not null,
    description text,
    price_from numeric(10, 2),
    visible boolean not null default true,
    seasonal boolean not null default false,
    frozen boolean not null default false,
    sort_order integer not null default 0,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table if not exists public.delivery_zones (
    id uuid primary key default gen_random_uuid(),
    label text not null,
    city text,
    postal_code text,
    delivery_fee numeric(10, 2) not null default 0,
    minimum_order_amount numeric(10, 2),
    active boolean not null default true,
    created_at timestamptz not null default now()
);

create table if not exists public.orders (
    id uuid primary key default gen_random_uuid(),
    order_number text not null unique,
    customer_name text not null,
    customer_email text,
    customer_phone text not null,
    delivery_mode text not null check (delivery_mode in ('delivery', 'pickup')),
    delivery_zone_id uuid references public.delivery_zones (id) on delete set null,
    delivery_address text,
    pickup_notes text,
    requested_date date not null,
    requested_time_slot text,
    notes text,
    status text not null default 'pending' check (
        status in (
            'pending',
            'reviewing',
            'accepted',
            'refused',
            'awaiting_payment',
            'paid',
            'in_preparation',
            'ready',
            'completed',
            'cancelled'
        )
    ),
    estimated_total numeric(10, 2),
    final_total numeric(10, 2),
    refusal_reason text,
    archived boolean not null default false,
    accepted_by uuid references public.app_users (id) on delete set null,
    refused_by uuid references public.app_users (id) on delete set null,
    assigned_to uuid references public.app_users (id) on delete set null,
    payment_mode text not null default 'manual' check (
        payment_mode in ('manual', 'link_after_acceptance', 'external_checkout')
    ),
    payment_provider text,
    payment_status text not null default 'not_requested' check (
        payment_status in ('not_requested', 'sent', 'paid', 'expired', 'cancelled')
    ),
    payment_link text,
    payment_deadline timestamptz,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table if not exists public.order_items (
    id uuid primary key default gen_random_uuid(),
    order_id uuid not null references public.orders (id) on delete cascade,
    product_id uuid references public.products (id) on delete set null,
    product_name_snapshot text not null,
    category_snapshot text,
    unit_price_snapshot numeric(10, 2),
    quantity integer not null check (quantity > 0),
    item_notes text,
    created_at timestamptz not null default now()
);

create table if not exists public.order_events (
    id uuid primary key default gen_random_uuid(),
    order_id uuid not null references public.orders (id) on delete cascade,
    actor_user_id uuid references public.app_users (id) on delete set null,
    actor_name_snapshot text,
    event_type text not null,
    notes text,
    metadata jsonb not null default '{}'::jsonb,
    created_at timestamptz not null default now()
);

create table if not exists public.order_information_requests (
    id uuid primary key default gen_random_uuid(),
    order_id uuid not null references public.orders (id) on delete cascade,
    created_by uuid references public.app_users (id) on delete set null,
    created_by_name_snapshot text,
    created_by_role_snapshot text,
    preferred_channel text not null check (preferred_channel in ('sms', 'email')),
    subject text not null,
    message text not null,
    status text not null default 'waiting' check (status in ('waiting', 'answered', 'closed')),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table if not exists public.order_information_replies (
    id uuid primary key default gen_random_uuid(),
    information_request_id uuid not null references public.order_information_requests (id) on delete cascade,
    order_id uuid not null references public.orders (id) on delete cascade,
    channel text not null check (channel in ('sms', 'email')),
    summary text not null,
    full_message text not null,
    replied_by_customer_name text,
    external_message_id text,
    created_at timestamptz not null default now()
);

create table if not exists public.notification_logs (
    id uuid primary key default gen_random_uuid(),
    order_id uuid references public.orders (id) on delete cascade,
    channel text not null check (channel in ('sms', 'email')),
    recipient text not null,
    template_code text not null,
    provider text,
    provider_message_id text,
    status text not null default 'queued' check (
        status in ('queued', 'sent', 'delivered', 'failed')
    ),
    payload jsonb not null default '{}'::jsonb,
    created_at timestamptz not null default now()
);

create table if not exists public.customer_reviews (
    id uuid primary key default gen_random_uuid(),
    order_id uuid references public.orders (id) on delete set null,
    author_name text not null,
    city text,
    title text,
    message text not null,
    occasion text,
    rating integer not null default 5 check (rating between 1 and 5),
    visible boolean not null default true,
    sort_order integer not null default 0,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

alter table public.customer_reviews
add column if not exists order_id uuid references public.orders (id) on delete set null;

create unique index if not exists customer_reviews_order_id_unique
on public.customer_reviews (order_id)
where order_id is not null;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
    new.updated_at = now();
    return new;
end;
$$;

create or replace function public.is_active_staff()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
    select exists (
        select 1
        from public.app_users
        where id = auth.uid()
          and active = true
    );
$$;

create or replace function public.is_owner_staff()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
    select exists (
        select 1
        from public.app_users
        where id = auth.uid()
          and active = true
          and role = 'owner'
    );
$$;

grant execute on function public.is_active_staff() to anon, authenticated;
grant execute on function public.is_owner_staff() to anon, authenticated;

drop trigger if exists trg_app_users_updated_at on public.app_users;
create trigger trg_app_users_updated_at
before update on public.app_users
for each row
execute function public.set_updated_at();

drop trigger if exists trg_products_updated_at on public.products;
create trigger trg_products_updated_at
before update on public.products
for each row
execute function public.set_updated_at();

drop trigger if exists trg_orders_updated_at on public.orders;
create trigger trg_orders_updated_at
before update on public.orders
for each row
execute function public.set_updated_at();

drop trigger if exists trg_order_information_requests_updated_at on public.order_information_requests;
create trigger trg_order_information_requests_updated_at
before update on public.order_information_requests
for each row
execute function public.set_updated_at();

drop trigger if exists trg_customer_reviews_updated_at on public.customer_reviews;
create trigger trg_customer_reviews_updated_at
before update on public.customer_reviews
for each row
execute function public.set_updated_at();

create or replace view public.v_orders_monthly_stats as
select
    date_trunc('month', created_at) as month_start,
    count(*) as total_orders,
    count(*) filter (where status = 'accepted') as accepted_orders,
    count(*) filter (where status = 'refused') as refused_orders,
    coalesce(sum(final_total) filter (where status in ('paid', 'completed')), 0) as confirmed_revenue,
    coalesce(sum(estimated_total) filter (where status = 'accepted'), 0) as accepted_estimated_revenue
from public.orders
group by 1
order by 1;
