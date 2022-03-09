# Auction House Data collection

Collects hourly auction house data from the blizzard API and saves it to a postgres db

## Requirements

- nodejs >= 16
- docker
- pm2

## Setup

1. Build typescript: `npm run build`
1. Add your blizard api secrets to services.yml or a .env file
1. Bring up the db: `docker-compose up -d`
1. Run the node script on an hourly cron: `pm2 start services.yml`
