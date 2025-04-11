SHELL := /bin/bash

.PHONY: ssh
ssh:
	docker exec -it shopware bash

.PHONY: up
up:
	docker-compose up -d

.PHONY: down
down:
	docker-compose down

.PHONY: init
init:
	mkdir -p ./src
	make down
	docker-compose up -d --build
	docker cp shopware:/var/www/html/. ./src
