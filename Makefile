lint:
	jshint core/*.js tests/*.js --exclude=core/nunjucks.js

test:
	@npm install
	@bower install
	@./node_modules/karma/bin/karma start

