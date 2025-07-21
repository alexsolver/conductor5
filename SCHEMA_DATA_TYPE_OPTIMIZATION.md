# SCHEMA DATA TYPE OPTIMIZATION GUIDE
**Established: July 21, 2025**

## Overview
This document defines data type standards and optimization guidelines for the Conductor platform schema, ensuring consistency, performance, and maintainability across all database fields.

## 🎯 Data Type Standards

### 📱 Phone Field Standards

#### ✅ CURRENT STANDARD: `varchar(20)`
```typescript
// Standardized phone field implementation
phone: varchar("phone", { length: 20 })
cellPhone: varchar("cell_phone", { length: 20 })
primaryPhone: varchar("primary_phone", { length: 20 })
secondaryPhone: varchar("secondary_phone", { length: 20 })
```

#### 📋 Rationale:
- **20 characters** accommodates international formats: `+55 (11) 99999-9999`
- Consistent across all tables: `customers`, `favorecidos`, `users`
- No legacy `varchar(50)` fields remain in current schema

### 📊 Status Field Standards

#### ✅ RECOMMENDED APPROACH: Context-Based Lengths
```typescript
// Short status fields (enum-like values)
status: varchar("status", { length: 20 })        // "active", "pending", "completed"
priority: varchar("priority", { length: 20 })    // "low", "medium", "high", "urgent"

// Descriptive status fields (user-defined text)
description: text("description")                 // Unlimited descriptive text
notes: text("notes")                             // Unlimited notes/comments
```

#### 📋 Business Justification:
- **varchar(20)**: Sufficient for predefined status enums
- **varchar(50)**: Used when status includes additional context
- **text**: For user-generated descriptive content

### 🔢 Array Implementation Standards

#### ✅ PREFERRED: Native PostgreSQL Arrays
```typescript
// Native array implementation (RECOMMENDED)
teamMemberIds: uuid("team_member_ids").array().default([])
tags: text("tags").array().default([])
responsibleIds: uuid("responsible_ids").array().default([])

// Type safety with proper defaults
dependsOnActionIds: uuid("depends_on_action_ids").array().default([])
blockedByActionIds: uuid("blocked_by_action_ids").array().default([])
```

#### ❌ AVOID: JSONB for Simple Arrays
```typescript
// Deprecated approach (avoid for new fields)
teamMemberIds: jsonb("team_member_ids").default('[]')  // Less performant
tags: jsonb("tags").default('[]')                      // No type safety
```

#### 📋 Benefits of Native Arrays:
1. **Performance**: Faster queries with array operators (`@>`, `&&`, `||`)
2. **Type Safety**: PostgreSQL enforces element types
3. **Indexing**: Support for GIN indexes on array elements
4. **Storage**: More efficient storage than JSONB

### 💰 Monetary Field Standards

#### ✅ STANDARD: `decimal(12,2)`
```typescript
// Monetary fields standardization
budget: decimal("budget", { precision: 12, scale: 2 })
actualCost: decimal("actual_cost", { precision: 12, scale: 2 })
price: decimal("price", { precision: 12, scale: 2 })
amount: decimal("amount", { precision: 12, scale: 2 })
```

#### 📋 Precision Rationale:
- **12 digits total**: Supports values up to R$ 999,999,999.99
- **2 decimal places**: Standard for currency (centavos)
- **Brazilian compliance**: Handles large enterprise contracts

## 🔧 Migration Guidelines

### Phone Field Standardization
```sql
-- Migration script for legacy phone fields
ALTER TABLE table_name 
ALTER COLUMN phone TYPE varchar(20);

-- Verify data fits in new constraint
SELECT phone FROM table_name 
WHERE length(phone) > 20;
```

### Array Migration Strategy
```typescript
// STEP 1: Add new native array column
teamMemberIds: uuid("team_member_ids").array().default([])

// STEP 2: Migrate data (via application logic)
// Parse JSONB → Convert to array → Populate new field

// STEP 3: Drop old JSONB column (after verification)
// Remove old teamMemberIdsJson field
```

### Status Field Assessment
```sql
-- Check current status value distributions
SELECT status, COUNT(*) 
FROM table_name 
GROUP BY status 
ORDER BY COUNT(*) DESC;

-- Identify long status values
SELECT status, length(status) 
FROM table_name 
WHERE length(status) > 20;
```

## 📊 Performance Considerations

### Array Operations Optimization
```typescript
// Efficient array queries with native arrays
// Check if array contains value
WHERE team_member_ids @> ARRAY[?]

// Check if arrays overlap
WHERE team_member_ids && ARRAY[?, ?]

// Array length checks
WHERE array_length(team_member_ids, 1) > 0
```

### Index Strategies
```sql
-- GIN indexes for array operations
CREATE INDEX CONCURRENTLY idx_projects_team_members 
ON projects USING GIN (team_member_ids);

-- Partial indexes for status filtering
CREATE INDEX CONCURRENTLY idx_tickets_active_status 
ON tickets (tenant_id, status) 
WHERE is_active = true;
```

## 🎯 Field Type Decision Matrix

| Use Case | Recommended Type | Length | Example |
|----------|------------------|--------|---------|
| Phone numbers | `varchar` | 20 | `+55 (11) 99999-9999` |
| Status enums | `varchar` | 20 | `active`, `pending` |
| User descriptions | `text` | unlimited | User comments, notes |
| UUID arrays | `uuid().array()` | - | `[uuid1, uuid2, uuid3]` |
| String arrays | `text().array()` | - | `['tag1', 'tag2', 'tag3']` |
| Money values | `decimal` | (12,2) | `999999999.99` |
| Boolean flags | `boolean` | - | `true`, `false` |
| Timestamps | `timestamp` | - | `2025-07-21 18:30:00` |

## 🔍 Validation Checklist

### For New Tables:
- [ ] Phone fields use `varchar(20)`
- [ ] Status fields use appropriate length for content type
- [ ] Arrays use native PostgreSQL arrays (`.array()`)
- [ ] Monetary fields use `decimal(12,2)`
- [ ] All fields have appropriate defaults
- [ ] Indexes planned for query patterns

### For Existing Tables:
- [ ] Audit field lengths for consistency
- [ ] Identify JSONB array candidates for migration
- [ ] Check monetary field precision consistency
- [ ] Validate phone field data fits in 20 characters
- [ ] Document any business justifications for variations

## 🚨 Common Anti-Patterns to Avoid

### ❌ Inconsistent Field Lengths
```typescript
// AVOID: Different lengths for same field type
phone: varchar("phone", { length: 20 })     // Table A
phone: varchar("phone", { length: 50 })     // Table B - INCONSISTENT
```

### ❌ JSONB for Simple Arrays
```typescript
// AVOID: JSONB for arrays that could be native
tags: jsonb("tags").default('[]')           // Use text().array() instead
```

### ❌ Insufficient Monetary Precision
```typescript
// AVOID: Too small for business needs
price: decimal("price", { precision: 8, scale: 2 })  // Only up to 999,999.99
```

### ❌ Over-sized Status Fields
```typescript
// AVOID: Unnecessarily large for enum values
status: varchar("status", { length: 255 })  // Wasteful for "active"/"inactive"
```

## 🔄 Future Considerations

1. **Monitoring**: Track query performance after array migrations
2. **Compression**: Consider PostgreSQL table compression for large text fields
3. **Partitioning**: Plan for data growth in high-volume tables
4. **Archival**: Strategy for old data to maintain performance

## 📈 Performance Benchmarks

### Array Operations Performance
- **Native arrays**: ~2-5x faster than JSONB for array operations
- **GIN indexes**: Enable sub-millisecond array membership queries
- **Storage**: ~20-30% less storage than equivalent JSONB

### Field Length Impact
- **varchar(20) vs varchar(50)**: Minimal performance difference
- **text vs varchar**: Similar performance for most use cases
- **decimal precision**: Higher precision slightly increases storage/computation

---

**Last Updated**: July 21, 2025  
**Performance Testing Date**: TBD  
**Next Review**: When adding new tables or during performance optimization cycles