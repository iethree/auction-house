CREATE TABLE prices (
	id SERIAL primary key,
	item_id INT not null,
	qty INT not null,
	low_price FLOAT not null,
	auctions json,
	ts timestamp default CURRENT_TIMESTAMP
);

CREATE TABLE items(
  item_id INT not null primary key,
  name VARCHAR(255) not null,
	item_class VARCHAR(255),
	item_subclass VARCHAR(255),
	item_description VARCHAR(255),
	crafting_reagent: BOOLEAN,
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
