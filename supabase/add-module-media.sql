alter table modules
add column if not exists video_url text,
add column if not exists image_url text,
add column if not exists resource_links text[] not null default '{}';
