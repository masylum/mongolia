MOCHA = ./node_modules/.bin/mocha --reporter dot

test:
	@$(MOCHA)

test_model:
	@$(MOCHA) test/model_test

test_validator:
	@$(MOCHA) test/validator_test.js

test_update_document:
	@$(MOCHA) test/helpers_update_document_test.js

test_namespacer:
	@$(MOCHA) test/helpers_namespacer_test.js

test_mapper:
	@$(MOCHA) test/helpers_mapper_test.js

test_proxy:
	@$(MOCHA) test/helpers_collection_proxy_test.js

test_integration:
	@$(MOCHA) test/integration_test.js

.PHONY: test
