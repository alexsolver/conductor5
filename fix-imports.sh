#!/bin/bash

# Fix imports in pages directory
find src/pages -name "*.tsx" -exec sed -i 's|from "\./components/|from "../components/|g' {} \;
find src/pages -name "*.tsx" -exec sed -i 's|from "\./hooks/|from "../hooks/|g' {} \;
find src/pages -name "*.tsx" -exec sed -i 's|from "\./lib/|from "../lib/|g' {} \;
find src/pages -name "*.tsx" -exec sed -i 's|from "\./types|from "../types|g' {} \;
find src/pages -name "*.tsx" -exec sed -i 's|from "\./services/|from "../services/|g' {} \;
find src/pages -name "*.tsx" -exec sed -i 's|from "\./utils/|from "../utils/|g' {} \;

# Fix imports in components directory
find src/components -name "*.tsx" -exec sed -i 's|from "\./hooks/|from "../../hooks/|g' {} \;
find src/components -name "*.tsx" -exec sed -i 's|from "\./lib/|from "../../lib/|g' {} \;
find src/components -name "*.tsx" -exec sed -i 's|from "\./types|from "../../types|g' {} \;

# Fix specific imports that might be broken
find src -name "*.tsx" -exec sed -i 's|from "\./use-toast"|from "../hooks/use-toast"|g' {} \;

echo "Import paths fixed!"