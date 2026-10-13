alter table public.import_rows add column if not exists imported_product_id uuid references public.products(id) on delete set null;
alter table public.import_rows add column if not exists processed_at timestamptz;
create index if not exists import_rows_imported_product_id_idx on public.import_rows(imported_product_id);
