# Light Mode Fixes Guide

## Issues Identified from Screenshots

### ✅ Issue 1: Dark Metric Cards in Light Mode
**Location**: Report View - Top metric cards (HIGH, LOW, PRECIP, ET₀, etc.)  
**Problem**: Cards have dark backgrounds in light mode making them hard to read  
**Current**: `bg-gray-900 dark:bg-gray-950` (dark in both modes)  
**Fix**: `bg-gray-200 dark:bg-gray-900` (light in light mode)

### ✅ Issue 2: White Text on Light Backgrounds
**Location**: Various metric cards and labels  
**Problem**: White text (`text-white`) shows on light backgrounds  
**Fix**: `text-gray-900 dark:text-white` (dark text in light mode)

### ✅ Issue 3: Dark Input Fields  
**Location**: Calculator page - input fields  
**Problem**: Input fields are dark gray in light mode  
**Current**: `bg-gray-700 dark:bg-gray-800`  
**Fix**: `bg-white dark:bg-gray-700`

### ✅ Issue 4: Dark Location Selection Cards
**Location**: Email Notifications - location checkboxes  
**Problem**: Location cards have dark backgrounds  
**Fix**: Use theme.colors.background.card

## Theme System Updates

The theme has been updated with comprehensive light mode support:

```typescript
// Use these theme tokens instead of hardcoded classes:

// Backgrounds
theme.colors.background.primary     // bg-white dark:bg-gray-800
theme.colors.background.card        // bg-white dark:bg-gray-800  
theme.colors.background.lightCard   // bg-gray-50 dark:bg-gray-800
theme.colors.background.input       // bg-white dark:bg-gray-700

// Text Colors  
theme.colors.text.primary           // text-gray-900 dark:text-white
theme.colors.text.secondary         // text-gray-600 dark:text-gray-300

// Metric Cards (FIXED FOR LIGHT MODE)
theme.components.metricCard.base    // bg-gray-200 dark:bg-gray-900
theme.components.metricCard.label   // text-gray-600 dark:text-gray-400
theme.components.metricCard.value   // text-gray-900 dark:text-white
```

## Quick Fixes for Common Patterns

### Pattern 1: Metric Card
❌ **Before** (dark in light mode):
```tsx
<div className="bg-gray-900 dark:bg-gray-950 p-2 rounded">
  <span className="text-gray-400 text-xs">HIGH</span>
  <div className="text-white text-lg">59°F</div>
</div>
```

✅ **After** (light in light mode):
```tsx
<div className={theme.components.metricCard.base}>
  <span className={theme.components.metricCard.label}>HIGH</span>
  <div className={theme.components.metricCard.value}>59°F</div>
</div>
```

### Pattern 2: Input Field
❌ **Before**:
```tsx
<input className="bg-gray-700 dark:bg-gray-800 text-white" />
```

✅ **After**:
```tsx
<input className={cn(theme.components.input.base)} />
// or use the Input component:
<Input label="Zone Flow Rate" />
```

### Pattern 3: Card Container
❌ **Before**:
```tsx
<div className="bg-gray-800 dark:bg-gray-900">
```

✅ **After**:
```tsx
<div className={theme.colors.background.card}>
// or
<Card>...</Card>
```

### Pattern 4: Section Header
❌ **Before** (black header):
```tsx
<div className="bg-gray-900 text-white px-4 py-3">
  <h3>Report Type & Date Selection</h3>
</div>
```

✅ **After** (proper light mode):
```tsx
<div className={theme.components.section.headerCompact}>
  <h3 className={theme.typography.h3}>Report Type & Date Selection</h3>
</div>
// or use SectionHeader component:
<SectionHeader title="Report Type & Date Selection" variant="default" />
```

## Components to Fix

### 1. ReportView.tsx
Search for these patterns and replace:

```bash
# Find all dark backgrounds without light mode equivalents
grep -n "bg-gray-[89]00\|bg-black" src/components/ReportView.tsx

# Find all white text without dark mode handling
grep -n "text-white" src/components/ReportView.tsx | grep -v "dark:text"
```

### 2. Calculator Components
Input fields need updating to use theme.components.input.base

### 3. Email Notifications
Location selection cards need proper background colors

## Testing Checklist

- [ ] Toggle between light/dark modes
- [ ] Check all metric cards have proper contrast
- [ ] Verify input fields are visible in both modes
- [ ] Test collapsible sections expand/collapse
- [ ] Verify dropdown menus are readable
- [ ] Check modal dialogs in both modes
- [ ] Test button hover states
- [ ] Verify text is readable on all backgrounds

## Before/After Examples

### Metric Card Comparison:
**Light Mode**:
- ❌ Before: Dark gray/black card with white text (illegible)
- ✅ After: Light gray card with dark text (readable)

**Dark Mode**:
- ✅ Both: Dark card with light text (readable)

### Input Field Comparison:
**Light Mode**:
- ❌ Before: Dark gray input (looks disabled)
- ✅ After: White input with border (clear and active)

**Dark Mode**:
- ✅ Both: Dark input with light text (readable)
