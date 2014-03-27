build:
	node_modules/.bin/smoosh make build.json

test:
	node_modules/.bin/mocha

spec:
	node_modules/.bin/mocha --reporter spec

.PHONY: test
