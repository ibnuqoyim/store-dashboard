.PHONY: all lint typecheck test verify build

all: verify

lint:
	npm run lint

typecheck:
	npx tsc --noEmit

test:
	npm run test:coverage

build:
	npm run build

verify: lint typecheck test build
	@echo "=== All quality gate checks passed successfully! ==="
