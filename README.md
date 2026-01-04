# FormX - Visual Form Builder

A modern, drag-and-drop form builder built with React, TypeScript, Vite, and Material-UI. FormX allows you to create complex forms visually and export them as JSON (for database storage) or React components (for direct use in projects).

## Table of Contents

1. [Overview](#overview)
2. [Core Features](#core-features)
3. [Form Storage & Export](#form-storage--export)
4. [Component Properties](#component-properties)
5. [Data Sources](#data-sources)
6. [Runtime Features](#runtime-features)
7. [Form Versioning](#form-versioning)
8. [Advanced Features](#advanced-features)
9. [Implementation Status](#implementation-status)

---

## Overview

FormX is a visual form builder that enables developers and non-developers to create complex forms through a drag-and-drop interface. Forms can be saved in multiple formats and used in various contexts.

### Key Capabilities

- **Visual Form Building**: Drag-and-drop interface for creating forms
- **Component Library**: 40+ pre-built form components
- **Property Editor**: Real-time property editing with live preview
- **Multiple Export Formats**: JSON (database) and React components (TSX/JSX)
- **FormEngine Compatible**: Full compatibility with FormEngine's PersistedForm format
- **Runtime Rendering**: FormViewer component for rendering forms at runtime

---

## Core Features

### 1. Visual Form Builder

**Location**: `components/builder/`

- **Drag-and-Drop**: Intuitive drag-and-drop interface using `@dnd-kit`
- **Component Library**: Left panel with categorized components
- **Property Editor**: Right panel for editing component properties
- **Live Preview**: Real-time updates as you edit properties
- **Undo/Redo**: Full history support with keyboard shortcuts (Ctrl+Z, Ctrl+Y)
- **Form Mode Toggle**: Switch between builder and form mode

### 2. Component Library

**40+ Components Available**:

**Form Inputs**:
- TextInput, TextArea, Select/Dropdown, Checkbox, RadioGroup, Toggle
- DateTime, Amount, AutoComplete, Upload, CreditCard

**Layout Components**:
- Container, Form, Header, Footer, SideNav, ViewStack, Wizard

**Display Components**:
- Label, Heading, Link, Image, HRule

**Data Components**:
- DataGrid, List, Tree, Repeater, DataBrowse, AutoBrowse

**Special Components**:
- Button, Modal, Calendar (Day/Week/Month views), MapLocationPicker
- CurrencyExRate, Validators (Required, Range, RegEx)

### 3. Property Editor

**Common Properties** (Available for all components):
- **Identification**: ID/Name, Required, Disabled
- **Styling**: Size, CSS Classes, Margin, Padding, Width, Height
- **Validation**: Help Text, Error Message
- **Advanced**: Validation Rules, Event Handlers, Computed Properties, Responsive Styles, Conditional Rendering

**Component-Specific Properties**:
Each component has its own set of properties (see [Component Properties](#component-properties) section).

---

## Form Storage & Export

### Storage Formats

FormX supports multiple storage formats:

#### 1. PersistedForm Format (Recommended)

**Purpose**: FormEngine-compatible format with full feature support

**Structure**:
```json
{
  "version": "1",
  "id": "form-uuid",
  "metadata": {
    "formName": "Contact Form",
    "description": "Customer contact form",
    "author": "John Doe",
    "formVersion": "1.0",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  },
  "form": { /* Component tree */ },
  "defaultLanguage": "en-US",
  "languages": [ /* Language definitions */ ],
  "localization": { /* Translations */ },
  "actions": { /* Custom actions */ },
  "formValidator": null
}
```

**Features**:
- ✅ Computed properties support
- ✅ Responsive CSS/styles (mobile, tablet, desktop)
- ✅ Validation schemas (Zod)
- ✅ Events/Actions
- ✅ Localization
- ✅ Data binding (dataKey)
- ✅ Conditional rendering (renderWhen)
- ✅ Slots and slot conditions
- ✅ HTML attributes
- ✅ Tooltip configuration
- ✅ Modal configuration

**Use Cases**:
- Production forms
- Forms with advanced features
- FormEngine integration
- Multi-language forms

#### 2. React Component Export (TSX/JSX)

**Purpose**: Export forms as standalone React components for use in other projects

**Features**:
- Generates complete React component code
- Includes Material-UI imports
- Handles state management
- Supports external API calls (see [External API Integration](#external-api-integration))
- TypeScript (TSX) or JavaScript (JSX) format

**Use Cases**:
- Standalone forms in other projects
- Static forms
- Reusable form components


### Save/Load Process

**Save Flow**:
1. Click "Save" button
2. Enter form metadata (name, description, author, version)
3. Select format (PersistedForm JSON or React Component)
4. File downloads automatically

**Load Flow**:
1. Click "Load" button
2. Select JSON file
3. System automatically:
   - Detects format (PersistedForm, FormExport, or direct array)
   - Migrates to latest version if needed
   - Converts to ComponentDefinition[]
   - Loads into builder

**Documentation**: See `STORAGE_IMPROVEMENTS.md` and `FORMAT_COMPARISON.md`

---

## Component Properties

### Common Properties

All components support these properties:

- **id/name**: Element identifier
- **required**: Required field validation
- **disabled**: Disable component
- **size**: Component size (small, medium, large)
- **classes/className**: CSS classes
- **margin**: Margin spacing (top, right, bottom, left)
- **padding**: Padding spacing (top, right, bottom, left)
- **width**: Width (auto, percentage, or pixels)
- **height**: Height (auto, percentage, or pixels)
- **helpText/helperText**: Help text below input
- **error/errorMessage**: Error message for validation

### Component-Specific Properties

**TextInput**:
- label, placeholder, value, type, variant, fullWidth, multiline, maxLength, pattern

**Select/Dropdown**:
- label, value, options, multiple, variant, fullWidth
- Supports multiple data source types (see [Data Sources](#data-sources))

**Checkbox**:
- label, checked, indeterminate, color

**RadioGroup**:
- label, value, options, row

**DateTime**:
- label, value, type (date/time/datetime-local), min, max, step

**Button**:
- label/text, variant, color

**Container**:
- flexDirection, gap, alignItems, justifyContent, flexWrap (for inline layout)

**And many more...**

**Documentation**: See `PROPERTIES_MIGRATION.md`

---

## Data Sources

### Dropdown/Select Data Sources

The Select/Dropdown component supports multiple data source types:

#### 1. Static Array
Simple static array defined in property editor:
```javascript
["Option 1", "Option 2", "Option 3"]
// or
[{ value: "1", label: "Option 1" }, { value: "2", label: "Option 2" }]
```

#### 2. Function (Data Provider)
JavaScript function that generates options dynamically:
```javascript
(data, component) => {
  // Access form data
  return data.categories || [];
}
```

#### 3. Computed Property
Reference to a computed property that evaluates to an array

#### 4. Data Key
Reference to a data key in the form data store

**Documentation**: See `DROPDOWN_DATA_SOURCES.md`

### Data-Rendering Components

Components that render data (DataGrid, List, Tree, AutoComplete, DataBrowse, Repeater) support:

- **Static Array**: JSON array defined in properties
- **Function**: External function call (e.g., `fetchConsumers`)
- **Computed Property**: Dynamic property evaluation
- **Data Key**: Reference to form data store

**External API Integration**: When exporting as TSX/JSX, functions are imported and called automatically.

**Documentation**: See `EXTERNAL_API_INTEGRATION_GUIDE.md`

---

## Runtime Features

### FormViewer Component

**Location**: `components/viewer/FormViewer.tsx`

A standalone component that renders forms from JSON/PersistedForm format at runtime.

**Usage**:
```typescript
import { FormViewer } from './components/viewer';
import type { PersistedForm } from './stores/types/formEngine';

<FormViewer
  formData={persistedForm}
  initialValues={{ name: 'John', email: 'john@example.com' }}
  onSubmit={async (data) => {
    console.log('Form submitted:', data);
  }}
  onDataChange={(data) => {
    console.log('Form data changed:', data);
  }}
/>
```

**Features**:
- Converts PersistedForm to ComponentDefinition[]
- Sets form mode automatically
- Handles form submission
- Supports initial values
- Provides data change callbacks
- Theme customization support

### Runtime Functionality

**Implemented Features**:
- ✅ **Reactive Computed Properties**: Properties update automatically when form data changes
- ✅ **Data Binding**: Two-way data binding with form data store
- ✅ **Validation Runtime**: Zod-based validation with real-time error display
- ✅ **Event/Action Runtime**: Event handlers execute actions (validate, clear, reset, log, addRow, removeRow, openModal, closeModal)
- ✅ **Responsive Styles**: Device-specific CSS and inline styles (mobile, tablet, desktop)
- ✅ **Conditional Rendering**: Components show/hide based on `renderWhen` conditions
- ✅ **Tooltip Support**: Per-component tooltips with dynamic content
- ✅ **Modal Support**: Modal components with open/close actions

**Documentation**: See `RUNTIME_FEATURES.md`

---

## Form Versioning

### Form Identification

**Form ID (`id`)**:
- Unique identifier for the form (like a database primary key)
- Generated by database (recommended) or client (optional UUID)
- Used to load, update, or delete a specific form

**Form Metadata (`metadata`)**:
```typescript
{
  id?: string;              // Unique form identifier
  formName: string;          // Form name/title
  description?: string;      // Form description
  author?: string;           // Form author/creator
  createdAt?: string;        // ISO timestamp when form was created
  updatedAt?: string;        // ISO timestamp when form was last updated
  formVersion?: string;      // Form revision version (e.g., "1.0", "1.1", "2.0")
  tags?: string[];           // Tags for categorization
  category?: string;         // Form category
}
```

### Version Types

#### 1. Schema Version (`version`)
- **Purpose**: Format/structure version of PersistedForm
- **Examples**: `"1"`, `"2"`, `"3"`
- **When it changes**: When the PersistedForm structure changes
- **Usage**: Migration system uses this to convert between formats

#### 2. Form Version (`metadata.formVersion`)
- **Purpose**: Revision version of a specific form
- **Examples**: `"1.0"`, `"1.1"`, `"2.0"`
- **When it changes**: Each time you save/update the form
- **Usage**: Track revisions of the same form

### Database Integration

**Recommended Schema**:
```sql
CREATE TABLE forms (
  id UUID PRIMARY KEY,
  form_name VARCHAR(255) NOT NULL,
  description TEXT,
  author VARCHAR(255),
  form_version VARCHAR(50),
  schema_version VARCHAR(50),
  form_data JSONB NOT NULL,  -- PersistedForm JSON
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  tags TEXT[],
  category VARCHAR(100)
);
```

**Documentation**: See `FORM_VERSIONING.md`

---

## Advanced Features

### 1. Validation System

**Location**: `utils/validation/zodValidation.ts`

**Supported Validations**:
- **String**: required, min, max, length, regex, email, url, uuid, ip, datetime, includes, startsWith, endsWith
- **Number**: required, min, max, lessThan, moreThan, integer, multipleOf
- **Boolean**: required
- **Date**: required, min, max
- **Array**: required, min, max, length
- **Object**: required

**Features**:
- Conditional validation (`validateWhen`)
- Custom error messages
- Async validation support
- Per-component validation schemas

### 2. Event System with Actions

**Location**: `utils/actions/actionSystem.ts`

**Common Actions**:
- `validate`: Validate a component or form
- `clear`: Clear component value
- `reset`: Reset component to default value
- `log`: Log data to console
- `addRow`: Add row to Repeater
- `removeRow`: Remove row from Repeater
- `openModal`: Open a modal component
- `closeModal`: Close a modal component

**Custom Actions**:
- Execute custom JavaScript functions
- Access to form data (`data`, `parentData`, `rootData`)
- Sequential action execution
- Parameter validation

### 3. Computed/Dynamic Properties

**Location**: `utils/properties/computedProperties.ts`

**Property Types**:
- **Static**: `{ value: any }`
- **Computed**: `{ computeType: "function", fnSource: "..." }`
- **Localized**: `{ computeType: "localization", value: "key.name" }`

**Features**:
- Real-time property calculation
- Dependency tracking
- Error handling
- Reactive updates

### 4. Responsive Styles

**Location**: `utils/styles/responsiveStyles.ts`

**Device Types**:
- `any`: Applies to all devices
- `mobile`: Mobile devices
- `tablet`: Tablet devices
- `desktop`: Desktop devices

**Style Types**:
- **CSS**: `css` and `wrapperCss` (CSS string)
- **Inline Styles**: `style` and `wrapperStyle` (object)

### 5. Conditional Rendering

**Location**: `utils/rendering/conditionalRendering.ts`

**Render When**:
- Expression-based: `"data.age >= 18"`
- Function-based: `(data) => data.age >= 18`

**Features**:
- Access to form data
- Complex conditions
- Real-time evaluation

### 6. Localization

**Location**: `utils/localization/localization.ts`

**Supported Languages**:
- English (en-US)
- Spanish (es-ES)
- Albanian (al)

**Features**:
- Multi-language support
- Namespace-based translations
- Language switching
- Localized component properties

---

## Implementation Status

### ✅ Completed Features

1. ✅ Enhanced Form Storage Structure (PersistedForm)
2. ✅ Zod-Based Validation System
3. ✅ Event System with Custom Actions
4. ✅ Computed/Dynamic Properties
5. ✅ Responsive Styles System
6. ✅ Conditional Rendering
7. ✅ Form Data Store
8. ✅ Localization System
9. ✅ FormViewer Component
10. ✅ React Component Export (TSX/JSX)
11. ✅ Form Versioning and Metadata
12. ✅ Round-Trip Validation
13. ✅ Version Migration System
14. ✅ External API Integration Support

### 🚧 Pending Features

1. 🚧 Repeater Component Enhancements (dataProvider, itemRenderWhen, min/max)
2. 🚧 Modal System (full implementation)
3. 🚧 Tooltip System (full implementation)
4. 🚧 Data Binding Enhancements (automatic dataKey binding)
5. 🚧 HTML Attributes Support
6. 🚧 Slot System
7. 🚧 Form-Level Features (formValidator UI, errorProps UI)

**Documentation**: See `FEATURES_IMPLEMENTATION.md` and `MISSING_FEATURES.md`

---

## Quick Start

### Installation

```bash
npm install
npm run dev
```

### Building a Form

1. **Add Components**: Drag components from the left panel to the canvas
2. **Edit Properties**: Select a component and edit its properties in the right panel
3. **Configure Data Sources**: For data-rendering components, configure data sources
4. **Add Validation**: Add validation rules in the property editor
5. **Configure Events**: Add event handlers and actions
6. **Save Form**: Click "Save" and choose format (JSON or React Component)

### Using FormViewer

```typescript
import { FormViewer } from './components/viewer';
import formData from './forms/contact-form.json';

function App() {
  return (
    <FormViewer
      formData={formData}
      onSubmit={async (data) => {
        // Handle form submission
        console.log(data);
      }}
    />
  );
}
```

---


---

## Technology Stack

- **React 18**: UI framework
- **TypeScript**: Type safety
- **Vite**: Build tool
- **Material-UI (MUI)**: Component library
- **Zustand**: State management
- **@dnd-kit**: Drag-and-drop
- **Zod**: Validation schemas
- **i18next**: Internationalization

---

## License

[Your License Here]

---

## Contributing

[Contributing Guidelines Here]

---

## Support

[Support Information Here]

