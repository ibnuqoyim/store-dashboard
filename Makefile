.PHONY: all lint typecheck test test-e2e verify build

all: verify

lint:
	npm run lint

typecheck:
	npx tsc --noEmit

test:
	npm run test:coverage
	npm run test:scripts

test-e2e:
	npm run test:e2e

build:
	npm run build

verify: lint typecheck test build
	@echo "=== All quality gate checks passed successfully! ==="
