lint:
	jshint core/*.js tests/*.js --exclude=core/nunjucks.js

test:
	make lint && make unittest

unittest:
	karma start --single-run
