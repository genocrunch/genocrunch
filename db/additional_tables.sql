create table examples(
id serial,
name text,
description text,
job_key text,
created_at timestamp,
updated_at timestamp,
primary key (id)
);

create table statuses(
id serial,
name text,
filename text,
precedence int,
primary key (id)
);

create table versions(
id serial,
description text,
release_date timestamp,
tools_json text,
created_at timestamp,
updated_at timestamp,
primary key (id)
);

