# Data Model Specification

## Overview
This document defines the data models for the product opportunity scoring system, including validation rules and UI display guidelines.

## Models

### Criterion Model

**Purpose**: Represents a scoring criterion used to evaluate product opportunities.

**Schema**:
```json
{
  "id": "string (UUID)",
  "name": "string",
  "weight": "number",
  "value": "number", 
  "max": "number",
  "invert": "boolean (optional)",
  "unit": "string (optional)",
  "step": "number (optional)",
  "threshold": "number (optional)",
  "hint": "string (optional)",
  "description": "string"
}
```

**Field Definitions**:

- **id**: Unique identifier for the criterion (UUID format)
- **name**: Display name for the criterion (e.g., "Market Demand", "Competition Level")
- **weight**: Importance weighting for final score calculation (0-100)
- **value**: Current score value for this criterion (0 to max)
- **max**: Maximum possible value for this criterion (typically 100)
- **invert**: If true, higher values are worse (e.g., competition level). Default: false
- **unit**: Display unit for the value (e.g., "%", "$", "points"). Default: no unit
- **step**: Increment step for UI controls (e.g., 0.1, 1, 5). Default: 1
- **threshold**: Warning threshold - values below this show as concerning. Optional
- **hint**: Tooltip text to help users understand the criterion. Optional
- **description**: Detailed explanation of what this criterion measures

**Example**:
```json
{
  "id": "crit_market_demand_001",
  "name": "Market Demand",
  "weight": 30,
  "value": 85,
  "max": 100,
  "invert": false,
  "unit": "%",
  "step": 1,
  "threshold": 60,
  "hint": "Based on search volume and trend analysis",
  "description": "Measures market interest through search volume, trend growth, and seasonal patterns"
}
```

### Opportunity Model

**Purpose**: Represents a product opportunity with its evaluation criteria and overall assessment.

**Schema**:
```json
{
  "id": "string (UUID)",
  "productName": "string",
  "criteria": "Criterion[]",
  "finalScore": "number",
  "createdAt": "ISO 8601 timestamp",
  "status": "enum ['Scored', 'Analyzing', 'Sourcing', 'Archived']",
  "notes": "string (optional)",
  "history": "HistoryEntry[] (optional)"
}
```

**Field Definitions**:

- **id**: Unique identifier for the opportunity (UUID format)
- **productName**: Name/title of the product opportunity
- **criteria**: Array of Criterion objects used to evaluate this opportunity
- **finalScore**: Calculated weighted average score (0-100)
- **createdAt**: ISO 8601 timestamp of when opportunity was created
- **status**: Current workflow status of the opportunity
- **notes**: Free-form text notes about the opportunity. Optional
- **history**: Array of historical changes/updates. Optional

**Status Enum Values**:
- **Scored**: Initial scoring completed, ready for review
- **Analyzing**: Under detailed analysis phase
- **Sourcing**: Actively pursuing sourcing/development
- **Archived**: No longer active, kept for reference

**HistoryEntry Schema**:
```json
{
  "timestamp": "ISO 8601 timestamp",
  "action": "string",
  "field": "string (optional)",
  "oldValue": "any (optional)",
  "newValue": "any (optional)",
  "user": "string (optional)"
}
```

**Example**:
```json
{
  "id": "opp_wireless_earbuds_001",
  "productName": "Wireless Earbuds - Premium Segment",
  "criteria": [
    {
      "id": "crit_market_demand_001",
      "name": "Market Demand",
      "weight": 30,
      "value": 85,
      "max": 100,
      "invert": false,
      "unit": "%",
      "step": 1,
      "threshold": 60,
      "hint": "Based on search volume and trend analysis",
      "description": "Measures market interest through search volume trends"
    },
    {
      "id": "crit_competition_001", 
      "name": "Competition Level",
      "weight": 25,
      "value": 35,
      "max": 100,
      "invert": true,
      "unit": "%",
      "step": 1,
      "threshold": 70,
      "hint": "Lower values indicate less competition",
      "description": "Evaluates competitive density and market saturation"
    }
  ],
  "finalScore": 72,
  "createdAt": "2024-01-15T10:30:00Z",
  "status": "Scored",
  "notes": "Strong demand signals, moderate competition. Consider premium positioning.",
  "history": [
    {
      "timestamp": "2024-01-15T10:30:00Z",
      "action": "created",
      "user": "system"
    }
  ]
}
```

## Validation Rules

### Criterion Validation
1. **Weight Constraints**: 
   - Individual weights: 0 ≤ weight ≤ 100
   - Total weights across all criteria should ideally sum to 100
   - Warning if total ≠ 100, error if total = 0

2. **Value Constraints**:
   - Values must be clamped: 0 ≤ value ≤ max
   - Step validation: value must be multiple of step (if specified)

3. **Required Fields**: id, name, weight, value, max, description
4. **String Limits**: name (max 50 chars), description (max 500 chars)

### Opportunity Validation
1. **Required Fields**: id, productName, criteria (min 1), finalScore, createdAt, status
2. **Score Calculation**: finalScore must match weighted average of criteria
3. **Status Transitions**: Valid flow: Scored → Analyzing → Sourcing → Archived
4. **String Limits**: productName (max 100 chars), notes (max 2000 chars)

## UI Display Guidelines

### Criterion Display

**Score Input Controls**:
- Use slider for values with large ranges (max > 10)
- Use number input for precise values or small ranges
- Show current value prominently with unit suffix
- Display weight as percentage in label: "Market Demand (30%)"

**Visual Indicators**:
- Progress bars for score visualization (0 to max)
- Color coding: Green (above threshold), Yellow (near threshold), Red (below threshold)
- Invert color logic for inverted criteria
- Show hint text as tooltip on hover/focus

**Example Displays**:
```
Market Demand (30%): 85% ████████▒▒ [Slider: 0-100, step=1]
Competition Level (25%): 35% ███▒▒▒▒▒▒▒ [Lower is better indicator]
```

### Opportunity Display

**Card Layout**:
- Product name as primary heading
- Final score prominently displayed with progress ring
- Status badge with color coding:
  - Scored: Blue
  - Analyzing: Orange  
  - Sourcing: Green
  - Archived: Gray

**Score Breakdown**:
- List criteria with individual scores
- Show contribution to final score: (score × weight / 100)
- Visual progress bars for each criterion
- Expandable details section for descriptions

**Status Workflow**:
- Action buttons based on current status
- Clear workflow progression indicators
- Confirmation dialogs for status changes

**List View**:
- Sortable by score, date, status
- Filterable by status, score range
- Search by product name
- Bulk actions for status changes

## Calculation Formulas

### Final Score Calculation
```
finalScore = Σ(criterion.value × criterion.weight) / Σ(criterion.weight)

For inverted criteria:
adjustedValue = criterion.max - criterion.value
finalScore component = adjustedValue × criterion.weight
```

### Weight Validation
```
totalWeight = Σ(criterion.weight)
isValid = totalWeight > 0
isIdeal = totalWeight == 100
```

### Threshold Status
```
For normal criteria: isAboveThreshold = value >= threshold
For inverted criteria: isAboveThreshold = value <= threshold  
```

## Data Relationships

- One Opportunity contains many Criteria (embedded array)
- Criteria are specific to each Opportunity (no shared criteria across opportunities)
- History entries are chronologically ordered
- Status changes should create history entries
- Score recalculation should update finalScore and create history entry