alter table public.app_users enable row level security;
alter table public.products enable row level security;
alter table public.delivery_zones enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.order_events enable row level security;
alter table public.order_information_requests enable row level security;
alter table public.order_information_replies enable row level security;
alter table public.notification_logs enable row level security;
alter table public.customer_reviews enable row level security;

drop policy if exists "public can read visible products" on public.products;
create policy "public can read visible products"
on public.products
for select
to anon, authenticated
using (visible = true);

drop policy if exists "public can read active delivery zones" on public.delivery_zones;
create policy "public can read active delivery zones"
on public.delivery_zones
for select
to anon, authenticated
using (active = true);

drop policy if exists "staff can read app users" on public.app_users;
create policy "staff can read app users"
on public.app_users
for select
to authenticated
using (public.is_active_staff());

drop policy if exists "owner can manage app users" on public.app_users;
create policy "owner can manage app users"
on public.app_users
for all
to authenticated
using (public.is_owner_staff())
with check (public.is_owner_staff());

drop policy if exists "staff can read orders" on public.orders;
create policy "staff can read orders"
on public.orders
for select
to authenticated
using (public.is_active_staff());

drop policy if exists "staff can update orders" on public.orders;
create policy "staff can update orders"
on public.orders
for update
to authenticated
using (public.is_active_staff())
with check (public.is_active_staff());

drop policy if exists "staff can insert orders from secure backend" on public.orders;
create policy "staff can insert orders from secure backend"
on public.orders
for insert
to authenticated
with check (public.is_active_staff());

drop policy if exists "staff can read order items" on public.order_items;
create policy "staff can read order items"
on public.order_items
for select
to authenticated
using (exists (
    select 1
    from public.orders o
    where o.id = order_items.order_id
      and public.is_active_staff()
));

drop policy if exists "staff can manage order items" on public.order_items;
create policy "staff can manage order items"
on public.order_items
for all
to authenticated
using (public.is_active_staff())
with check (public.is_active_staff());

drop policy if exists "staff can read order events" on public.order_events;
create policy "staff can read order events"
on public.order_events
for select
to authenticated
using (public.is_active_staff());

drop policy if exists "staff can insert order events" on public.order_events;
create policy "staff can insert order events"
on public.order_events
for insert
to authenticated
with check (public.is_active_staff());

drop policy if exists "staff can read information requests" on public.order_information_requests;
create policy "staff can read information requests"
on public.order_information_requests
for select
to authenticated
using (public.is_active_staff());

drop policy if exists "staff can manage information requests" on public.order_information_requests;
create policy "staff can manage information requests"
on public.order_information_requests
for all
to authenticated
using (public.is_active_staff())
with check (public.is_active_staff());

drop policy if exists "staff can read information replies" on public.order_information_replies;
create policy "staff can read information replies"
on public.order_information_replies
for select
to authenticated
using (public.is_active_staff());

drop policy if exists "staff can manage information replies" on public.order_information_replies;
create policy "staff can manage information replies"
on public.order_information_replies
for all
to authenticated
using (public.is_active_staff())
with check (public.is_active_staff());

drop policy if exists "staff can read notification logs" on public.notification_logs;
create policy "staff can read notification logs"
on public.notification_logs
for select
to authenticated
using (public.is_active_staff());

drop policy if exists "staff can insert notification logs" on public.notification_logs;
create policy "staff can insert notification logs"
on public.notification_logs
for insert
to authenticated
with check (public.is_active_staff());

drop policy if exists "public can read visible customer reviews" on public.customer_reviews;
create policy "public can read visible customer reviews"
on public.customer_reviews
for select
to anon, authenticated
using (visible = true);

drop policy if exists "staff can read customer reviews" on public.customer_reviews;
create policy "staff can read customer reviews"
on public.customer_reviews
for select
to authenticated
using (public.is_active_staff());

drop policy if exists "owner can manage customer reviews" on public.customer_reviews;
create policy "owner can manage customer reviews"
on public.customer_reviews
for all
to authenticated
using (public.is_owner_staff())
with check (public.is_owner_staff());

-- Important :
-- pour le site public, je recommande de passer par une API serveur ou une Edge Function
-- afin de creer la commande avec une cle service role au lieu d'ouvrir directement l'ecriture
-- a l'utilisateur anonyme.
