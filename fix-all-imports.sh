#!/bin/bash

echo "Fixing all import paths..."

# Fix all pages directory imports
find src/pages -name "*.tsx" -exec sed -i 's|from '\''./lib/|from '\''../lib/|g' {} \;
find src/pages -name "*.tsx" -exec sed -i 's|from "./lib/|from "../lib/|g' {} \;
find src/pages -name "*.tsx" -exec sed -i 's|from '\''./components/|from '\''../components/|g' {} \;
find src/pages -name "*.tsx" -exec sed -i 's|from "./components/|from "../components/|g' {} \;
find src/pages -name "*.tsx" -exec sed -i 's|from '\''./hooks/|from '\''../hooks/|g' {} \;
find src/pages -name "*.tsx" -exec sed -i 's|from "./hooks/|from "../hooks/|g' {} \;
find src/pages -name "*.tsx" -exec sed -i 's|from '\''./use-toast|from '\''../hooks/use-toast|g' {} \;
find src/pages -name "*.tsx" -exec sed -i 's|from "./use-toast|from "../hooks/use-toast|g' {} \;

# Fix components imports that might still be wrong
find src/components -name "*.tsx" -exec sed -i 's|from '\''./hooks/|from '\''../../hooks/|g' {} \;
find src/components -name "*.tsx" -exec sed -i 's|from "./hooks/|from "../../hooks/|g' {} \;

echo "All imports fixed!"