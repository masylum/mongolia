NODE = node
MOCHA = ./node_modules/.bin/mocha --reporter spec

test: test_model test_validator test_proxy test_update_document test_namespacer test_mapper test_integration

test_model:
	@$(MOCHA) test/model_test

test_validator:
	@$(MOCHA) test/validator_test.js

test_update_document:
	@$(NODE) test/helpers/update_document_test.js

test_namespacer:
	@$(MOCHA) test/helpers/namespacer_test.js

test_mapper:
	@$(MOCHA) test/helpers/mapper_test.js

test_proxy:
	@$(NODE) test/helpers/collection_proxy_test.js

test_integration:
	@$(MOCHA) test/integration/integration_test.js
