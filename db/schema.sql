CREATE TABLE prices (
	id SERIAL primary key,
	item_id INT not null,
	qty INT not null,
	low_price FLOAT not null,
	auctions json,
	ts timestamp default CURRENT_TIMESTAMP
);

CREATE TABLE item_names (
  item_id INT not null primary key,
  name VARCHAR(255) not null
);

CREATE TABLE favorite_items (
  item_id INT not null
);
