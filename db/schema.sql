CREATE TABLE prices (
	id SERIAL primary key,
	item_id INT not null,
	qty INT not null,
	low_price FLOAT not null,
	craft_price FLOAT,
	auctions json,
	ts timestamp default CURRENT_TIMESTAMP
);

create index item_id_ts_idx on prices(item_id, ts);
create index item_id on prices(item_id);

CREATE TABLE items(
  item_id INT not null primary key,
  name VARCHAR(255) not null,
	item_class VARCHAR(255),
	item_subclass VARCHAR(255),
	item_description VARCHAR(255),
	crafting_reagent BOOLEAN,
	vendor_item BOOLEAN,
	purchase_price FLOAT,
	sell_price FLOAT
);

CREATE TABLE recipes (
	recipe_id INT not null,
	recipe_name VARCHAR(255) not null,
	recipe_category VARCHAR(255) not null,
	profession_id INT not null,
	profession_name VARCHAR(255) not null,
	profession_tier_name VARCHAR(255) not null,
	profession_tier_id INT not null,
	crafted_item_id INT not null,
	crafted_item_qty INT not null DEFAULT 1,
	reagents json
);

CREATE TABLE favorite_items (
  item_id INT not null
);

-- manual vendor items
update items set vendor_item = true where item_id in (
	172056,
	172057,
	172058,
	172059,
	178786,
	180732,
	183950,
	159,
	187812,
	173060,
	175886,
	183953,
	177061
);


CREATE TABLE orders (
	id SERIAL primary key,
	transaction_type VARCHAR(16) not null, -- buy or sell
	item_id INT not null,
	qty INT not null,
	price FLOAT not null,
	total FLOAT not null GENERATED ALWAYS AS (qty * price * -1) STORED,
	ts timestamp default CURRENT_TIMESTAMP
);
