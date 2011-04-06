NODE = node

test: test_model test_validator

test_model:
	@$(NODE) test/model_test.js
	@$(NODE) test/validator_test.js
