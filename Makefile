NODE = node

test: test_model test_utils

test_model:
	@$(NODE) test/model_test.js

test_utils:
	@$(NODE) test/utils_test.js
