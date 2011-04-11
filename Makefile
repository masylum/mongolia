NODE = node

test: test_model test_utils test_helpers

test_model:
	@$(NODE) test/model_test.js

test_helpers:
	@$(NODE) test/helpers/*.js

test_utils:
	@$(NODE) test/utils_test.js
