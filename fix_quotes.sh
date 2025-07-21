#!/bin/bash

# Find all .ts files and fix the malformed quotes
find server/ -name "*.ts" -type f | while read -r file; do
    echo "Processing: $file"
    # Replace malformed quote patterns with proper quotes
    sed -i.bak "s/''/'/g" "$file" 2>/dev/null || true
    sed -i "s/''/''/g" "$file" 2>/dev/null || true
    # Clean up common patterns
    sed -i "s/import.*from 'express''[,;]/import { Request, Response, NextFunction } from 'express';/g" "$file" 2>/dev/null || true
    sed -i "s/'';$/';/g" "$file" 2>/dev/null || true
    sed -i "s/'',$/',/g" "$file" 2>/dev/null || true
done

echo "Quote fix completed"
