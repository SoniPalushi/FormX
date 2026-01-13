# Form Builder Test Cases

This directory contains test cases for creating forms from scratch using the Form Builder, including dataviews and property relationships.

## Files

- **formBuilderTest.ts** - Main test case file with form creation functions
- **formBuilderTestExample.tsx** - React component example showing how to use the test cases
- **README.md** - This file

## Test Cases Included

### 1. Customer Registration Form

A comprehensive customer registration form that demonstrates:

- **Basic Input Fields**: First name, last name, email with validation
- **Dataview Integration**: 
  - Country dropdown using dataview (`countries_dataview_id`)
  - City dropdown using dataview (`cities_dataview_id`)
- **Property Relationships**:
  - City dropdown depends on country selection
  - City dropdown is hidden until a country is selected
- **Conditional Rendering**:
  - Company name and business type fields only show when "Is Business Customer" toggle is enabled
- **Data Binding**: All fields use `dataKey` for automatic data binding
- **Validation**: Required fields, email pattern validation, min/max length

### 2. Product Order Form

A product order form that demonstrates:

- **DataGrid with Dataview**: Products displayed in a grid using dataview data source
- **Computed Properties**: 
  - Total amount calculated from selected products
  - Product totals (quantity × price) computed per row
- **Form Validation**: Customer information validation
- **Event Handlers**: Submit button with custom logic

## Usage

### Method 1: Using the React Component

Import and use the `FormBuilderTestExample` component:

```tsx
import { FormBuilderTestExample } from './test/formBuilderTestExample';

// In your component
<FormBuilderTestExample />
```

This provides a UI with buttons to:
- Load test forms into the builder
- Export forms as JSON files
- Copy JSON to clipboard

### Method 2: Programmatic Usage

```typescript
import { 
  createCustomerRegistrationFormTest,
  createProductOrderFormTest,
  exportFormAsJSON,
  loadTestFormIntoBuilder 
} from './test/formBuilderTest';

// Create a form
const customerForm = createCustomerRegistrationFormTest();

// Load into builder store
loadTestFormIntoBuilder('customer'); // or 'order'

// Export as JSON
const json = exportFormAsJSON(
  customerForm,
  'My Customer Form',
  'Form description'
);

// Save to file or use as needed
console.log(json);
```

### Method 3: Browser Console

You can also use these functions from the browser console if you expose them globally:

```javascript
// Load a test form
window.loadTestForm('customer'); // or 'order'

// Export current form
const json = window.exportCurrentForm('My Form', 'Description');
console.log(json);
```

## Dataview Configuration

**Important**: Before using the forms, you need to replace the placeholder dataview IDs with actual dataview IDs from your system:

- `countries_dataview_id` → Your actual countries dataview ID
- `cities_dataview_id` → Your actual cities dataview ID
- `customer_types_dataview_id` → Your actual customer types dataview ID
- `products_dataview_id` → Your actual products dataview ID

### Example Dataview Structure

For the country dropdown, your dataview should return data like:

```json
[
  { "id": "US", "name": "United States", "code": "US" },
  { "id": "CA", "name": "Canada", "code": "CA" },
  { "id": "UK", "name": "United Kingdom", "code": "UK" }
]
```

The component will use:
- `valueField: 'id'` → Uses the `id` field as the value
- `labelField: 'name'` → Displays the `name` field in the dropdown

## Property Relationships

### Dependency Example

The city dropdown depends on the country selection:

```typescript
dependencies: {
  optionsSource: {
    type: 'function',
    fnSource: `
      const countryId = data.customer?.country;
      if (!countryId) return [];
      // Filter cities by selected country
      return cities.filter(city => city.countryId === countryId);
    `,
  },
  renderWhen: {
    type: 'function',
    fnSource: 'return !!data.customer?.country;',
  },
}
```

This means:
- The city dropdown options are filtered based on the selected country
- The city dropdown is hidden until a country is selected

### Conditional Rendering Example

Company name field only shows when `isBusiness` is true:

```typescript
renderWhen: {
  type: 'function',
  fnSource: 'return data.customer?.isBusiness === true;',
}
```

## Export Format

The exported JSON follows this structure:

```json
{
  "version": "1.0.0",
  "metadata": {
    "formName": "Customer Registration Form",
    "description": "Form description",
    "author": "Form Builder Test",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  },
  "structure": [
    {
      "id": "header_001",
      "type": "Header",
      "props": {
        "title": "Customer Registration Form"
      }
    },
    {
      "id": "container_001",
      "type": "Container",
      "props": {},
      "children": [
        // ... nested components
      ]
    }
  ]
}
```

## Customization

You can customize the test forms by:

1. **Modifying component properties**: Edit the `props` objects in the test functions
2. **Adding more components**: Add new `ComponentDefinition` objects to the arrays
3. **Changing dataview IDs**: Replace placeholder IDs with your actual dataview IDs
4. **Adding more relationships**: Add more `dependencies` and `renderWhen` conditions
5. **Custom validation**: Modify the `schema` objects for validation rules

## Running the Tests

To run the test cases programmatically:

```typescript
import { runFormBuilderTest } from './test/formBuilderTest';

// This will create both forms and log the JSON exports
runFormBuilderTest();
```

## Notes

- All components use generated IDs via `generateComponentId()` and `generateGuid()`
- Components are properly nested using the `children` array
- Data binding uses `dataKey` properties for automatic form data management
- Validation schemas follow the form validation system
- Event handlers use function-based syntax for custom logic

## Next Steps

1. Replace placeholder dataview IDs with actual IDs from your system
2. Test the forms in the Form Builder UI
3. Export and use the JSON in your application
4. Customize the forms to match your specific requirements

