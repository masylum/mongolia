NODE = node

test: test_model test_validator test_utils test_helpers test_integration

test_model:
	@$(NODE) test/model_test.js

test_validator:
	@$(NODE) test/validator_test.js

test_helpers:
	@$(NODE) test/helpers/*.js

test_utils:
	@$(NODE) test/utils_test.js

test_integration:
	@$(NODE) test/integration/integration_test.js
