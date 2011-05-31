NODE = node

test: test_model test_validator test_proxy test_update_document test_namespacer test_mapper test_integration

test_model:
	@$(NODE) test/model_test.js

test_validator:
	@$(NODE) test/validator_test.js

test_update_document:
	@$(NODE) test/helpers/update_document_test.js

test_namespacer:
	@$(NODE) test/helpers/namespacer_test.js

test_mapper:
	@$(NODE) test/helpers/mapper_test.js

test_proxy:
	@$(NODE) test/helpers/collection_proxy_test.js

test_integration:
	@$(NODE) test/integration/integration_test.js
