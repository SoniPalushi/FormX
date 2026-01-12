# Data Source JSON Structure Documentation

This document explains how different data source types and component properties are stored in the JSON structure when forms are saved.

## Table of Contents

1. [Component Structure](#component-structure)
2. [Data Source Types](#data-source-types)
   - [Static Array](#static-array)
   - [Dataview](#dataview)
   - [Function (Data Provider)](#function-data-provider)
   - [Computed Property](#computed-property)
   - [Data Key](#data-key)
3. [Component Properties](#component-properties)
4. [Complete Examples](#complete-examples)

---

## Component Structure

All components follow this base structure:

```json
{
  "id": "unique-component-id",
  "type": "ComponentType",
  "props": {
    // Component-specific properties
  },
  "children": [], // Optional: nested components
  "parentId": "parent-component-id" // Optional: parent reference
}
```

---

## Data Source Types

Components that support data sources (Select, DropDown, DataGrid, List, Tree, etc.) can use different source types. The source type is determined by the value stored in `optionsSource` or `dataSource` property.

### Static Array

**Description**: Hard-coded array of options/data stored directly in the JSON.

**Storage Format**:
```json
{
  "id": "select-static",
  "type": "Select",
  "props": {
    "label": "Select Option",
    "options": [
      "Option 1",
      "Option 2",
      "Option 3"
    ]
    // OR with value/label objects:
    // "options": [
    //   { "value": "opt1", "label": "Option 1" },
    //   { "value": "opt2", "label": "Option 2" }
    // ]
  }
}
```

**Properties**:
- `options`: Array of strings or objects with `value`/`label`
- `optionsSource`: Not set (undefined) or omitted

**Runtime Behavior**: Options are used directly from the `options` array.

---

### Dataview

**Description**: References a dataview by ID. The dataview's API endpoint is called at runtime to fetch data.

**Storage Format**:
```json
{
  "id": "select-dataview",
  "type": "Select",
  "props": {
    "label": "Select User",
    "optionsSource": "dataview-users-123",
    "valueField": "id",
    "labelField": "name"
  }
}
```

**Properties**:
- `optionsSource`: String containing the dataview ID (e.g., `"dataview-users-123"`)
- `valueField`: Field name from API response to use as stored value (e.g., `"id"`, `"userId"`)
- `labelField`: Field name from API response to use as displayed label (e.g., `"name"`, `"fullName"`)

**Runtime Behavior**:
1. System looks up the dataview by ID
2. Calls the dataview's API endpoint (POST request)
3. Receives JSON response: `[{id: 1, name: "John"}, {id: 2, name: "Jane"}]`
4. Maps data using `valueField` and `labelField`:
   - Value stored: `1` or `2` (from `id` field)
   - Label displayed: `"John"` or `"Jane"` (from `name` field)

**Example API Response**:
```json
[
  { "id": 1, "name": "John Doe", "email": "john@example.com" },
  { "id": 2, "name": "Jane Smith", "email": "jane@example.com" }
]
```

**Example Configuration**:
```json
{
  "optionsSource": "dataview-users-123",
  "valueField": "id",      // Stores: 1, 2
  "labelField": "name"     // Displays: "John Doe", "Jane Smith"
}
```

---

### Function (Data Provider)

**Description**: JavaScript function that returns data. Stored as a function string or function name.

**Storage Format - Inline Function**:
```json
{
  "id": "select-function",
  "type": "Select",
  "props": {
    "label": "Select Item",
    "optionsSource": "(data, component) => { return [{value: '1', label: 'Option 1'}, {value: '2', label: 'Option 2'}]; }"
  }
}
```

**Storage Format - Function Name** (for external imports):
```json
{
  "id": "select-function-name",
  "type": "Select",
  "props": {
    "label": "Select Item",
    "optionsSource": "fetchUsers"
  }
}
```

**Properties**:
- `optionsSource`: String containing function code or function name
- Function receives `(data, component)` parameters:
  - `data`: Current form data
  - `component`: Component definition

**Runtime Behavior**:
1. Function is evaluated with current form data
2. Must return an array of options
3. Options can be strings or objects with `value`/`label`

**Note**: Functions are only available in Advanced Mode.

---

### Computed Property

**Description**: Computed property object that evaluates a function based on form data.

**Storage Format**:
```json
{
  "id": "select-computed",
  "type": "Select",
  "props": {
    "label": "Select Item",
    "optionsSource": {
      "computeType": "function",
      "fnSource": "return [{value: data.userId, label: data.userName}];"
    }
  }
}
```

**Properties**:
- `optionsSource`: Object with:
  - `computeType`: `"function"` or `"localization"`
  - `fnSource`: String containing function source code
  - `value`: Optional static fallback value

**Full Structure**:
```json
{
  "computeType": "function",
  "fnSource": "return [{value: '1', label: 'Option 1'}];",
  "value": null,
  "editorType": "computed"
}
```

**Runtime Behavior**:
1. Function in `fnSource` is evaluated with form data
2. Function must return an array
3. Result is used as options

**Note**: Computed properties are only available in Advanced Mode.

---

### Data Key

**Description**: References a key in the form data store that contains the options array.

**Storage Format**:
```json
{
  "id": "select-datakey",
  "type": "Select",
  "props": {
    "label": "Select Item",
    "optionsSource": "user.roles"
  }
}
```

**Properties**:
- `optionsSource`: String containing the data key path (e.g., `"user.roles"`, `"countries"`)

**Runtime Behavior**:
1. System looks up the key in form data store
2. Retrieves the value at that path
3. Uses the value as options (must be an array)

**Example Form Data**:
```json
{
  "user": {
    "roles": [
      { "value": "admin", "label": "Administrator" },
      { "value": "user", "label": "User" }
    ]
  },
  "countries": ["USA", "Canada", "Mexico"]
}
```

**Example Configuration**:
```json
{
  "optionsSource": "user.roles"  // Gets array from formData.user.roles
}
```

---

## Component Properties

### Common Properties (All Components)

```json
{
  "props": {
    "label": "Component Label",
    "placeholder": "Placeholder text",
    "required": false,
    "disabled": false,
    "fullWidth": true,
    "variant": "outlined",  // "outlined" | "filled" | "standard"
    "size": "medium",        // "small" | "medium" | "large"
    "dataKey": "formFieldName",  // Data binding key
    "disableDataBinding": false,
    "css": { /* Responsive CSS */ },
    "style": { /* Responsive Styles */ },
    "wrapperCss": { /* Wrapper CSS */ },
    "wrapperStyle": { /* Wrapper Styles */ },
    "events": { /* Event handlers */ },
    "schema": { /* Validation schema */ },
    "renderWhen": { /* Conditional rendering */ }
  }
}
```

### Select/DropDown Specific Properties

```json
{
  "props": {
    "label": "Select Option",
    "optionsSource": "dataview-123",  // Data source (see above)
    "options": [],                     // Static options (if optionsSource not set)
    "valueField": "id",                // Field for value (dataview only)
    "labelField": "name",              // Field for label (dataview only)
    "multiple": false,                 // Allow multiple selection
    "value": "selected-value",         // Default/current value
    "defaultValue": "selected-value"   // Default value
  }
}
```

### DataGrid Specific Properties

```json
{
  "props": {
    "label": "Data Grid",
    "dataSource": "dataview-123",     // Data source (see above)
    "rows": [],                        // Static rows (if dataSource not set)
    "columns": [                       // Column definitions
      {
        "field": "id",
        "headerName": "ID",
        "width": 100
      },
      {
        "field": "name",
        "headerName": "Name",
        "width": 200
      }
    ],
    "valueField": "id",                // Field for value (dataview only)
    "labelField": "name"               // Field for label (dataview only)
  }
}
```

### List Specific Properties

```json
{
  "props": {
    "label": "List",
    "dataSource": "dataview-123",      // Data source (see above)
    "items": [],                       // Static items (if dataSource not set)
    "dense": false,                    // Dense layout
    "showAvatar": true                 // Show avatars
  }
}
```

### Repeater Specific Properties

```json
{
  "props": {
    "label": "Repeater",
    "dataProvider": "dataview-123",   // Data source (see above)
    "minItems": 0,                     // Minimum items
    "maxItems": 10,                    // Maximum items (undefined = unlimited)
    "valueField": "id",                // Field for value
    "labelField": "name",              // Field for label
    "itemRenderWhen": { /* Conditional rendering for items */ }
  }
}
```

---

## Complete Examples

### Example 1: Select with Dataview

```json
{
  "id": "user-select",
  "type": "Select",
  "props": {
    "label": "Select User",
    "optionsSource": "dataview-users-abc123",
    "valueField": "userId",
    "labelField": "fullName",
    "variant": "outlined",
    "fullWidth": true,
    "required": true,
    "multiple": false
  }
}
```

**Runtime Flow**:
1. Form loads → finds `optionsSource: "dataview-users-abc123"`
2. Looks up dataview → gets API URL: `https://api.example.com/users/Post`
3. Makes POST request → receives: `[{userId: 1, fullName: "John"}, {userId: 2, fullName: "Jane"}]`
4. Maps using `valueField: "userId"` and `labelField: "fullName"`
5. Dropdown shows: "John", "Jane"
6. When "John" selected → form stores: `1` (the userId value)

---

### Example 2: Select with Static Options

```json
{
  "id": "country-select",
  "type": "Select",
  "props": {
    "label": "Select Country",
    "options": [
      { "value": "us", "label": "United States" },
      { "value": "ca", "label": "Canada" },
      { "value": "mx", "label": "Mexico" }
    ],
    "variant": "outlined",
    "fullWidth": true
  }
}
```

---

### Example 3: Select with Function

```json
{
  "id": "dynamic-select",
  "type": "Select",
  "props": {
    "label": "Dynamic Options",
    "optionsSource": "(data, component) => { const role = data.userRole || 'guest'; return role === 'admin' ? [{value: '1', label: 'Admin Option'}] : [{value: '2', label: 'User Option'}]; }"
  }
}
```

---

### Example 4: Select with Computed Property

```json
{
  "id": "computed-select",
  "type": "Select",
  "props": {
    "label": "Computed Options",
    "optionsSource": {
      "computeType": "function",
      "fnSource": "const userRole = data.userRole || 'guest'; return userRole === 'admin' ? [{value: 'admin', label: 'Admin'}] : [{value: 'user', label: 'User'}];",
      "value": null
    }
  }
}
```

---

### Example 5: Select with Data Key

```json
{
  "id": "datakey-select",
  "type": "Select",
  "props": {
    "label": "Select from Form Data",
    "optionsSource": "user.availableRoles"
  }
}
```

**Form Data Structure**:
```json
{
  "user": {
    "availableRoles": [
      { "value": "admin", "label": "Administrator" },
      { "value": "editor", "label": "Editor" }
    ]
  }
}
```

---

### Example 6: DataGrid with Dataview

```json
{
  "id": "users-grid",
  "type": "DataGrid",
  "props": {
    "label": "Users Grid",
    "dataSource": "dataview-users-123",
    "columns": [
      { "field": "id", "headerName": "ID", "width": 100 },
      { "field": "name", "headerName": "Name", "width": 200 },
      { "field": "email", "headerName": "Email", "width": 250 }
    ]
  }
}
```

---

## Data Source Type Detection

The system automatically detects the data source type based on the value:

| Value Type | Detection | Source Type |
|------------|-----------|-------------|
| `undefined` or `null` | No optionsSource/dataSource | Static |
| `Array` | `Array.isArray(value)` | Static |
| `String` (dataview ID) | Matches dataview in list | Dataview |
| `String` (function code) | Contains `=>` or `function` | Function |
| `String` (simple identifier) | Matches `/^[a-zA-Z_$][a-zA-Z0-9_$]*$/` | Function (name) |
| `String` (other) | Not function, not dataview | Data Key |
| `Function` | `typeof value === 'function'` | Function |
| `Object` with `computeType` | Has `computeType` property | Computed |

---

## Notes

1. **Dataview References**: Only the dataview ID is stored, not the full API URL or data. The API is called at runtime.

2. **Functions**: Functions stored as strings are evaluated at runtime. Function names are resolved from external imports.

3. **Computed Properties**: Stored as objects with `computeType` and `fnSource`. Evaluated reactively based on form data changes.

4. **Data Keys**: Use dot notation for nested paths (e.g., `"user.profile.roles"`).

5. **Field Mapping**: For dataviews, `valueField` and `labelField` determine which fields from the API response are used.

6. **Advanced Mode**: Functions and computed properties are only available when Advanced Mode is enabled.

---

## Summary

- **Static**: Store data directly in `options`/`rows`/`items` arrays
- **Dataview**: Store dataview ID in `optionsSource`/`dataSource`, plus `valueField` and `labelField`
- **Function**: Store function code as string in `optionsSource`/`dataSource`
- **Computed**: Store object with `computeType` and `fnSource` in `optionsSource`/`dataSource`
- **Data Key**: Store key path as string in `optionsSource`/`dataSource`

The JSON structure is minimal - it only stores configuration, not the actual data. Data is fetched/evaluated at runtime when the form is rendered.

