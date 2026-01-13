/**
 * Form Builder Test Case
 * 
 * This test case demonstrates how to:
 * 1. Create a form from scratch
 * 2. Use dataviews for dropdown options and data sources
 * 3. Set up property relationships/dependencies
 * 4. Export the form as JSON
 */

import type { ComponentDefinition } from '../stores/types';
import { exportFormStructure } from '../utils/formExport';
import { useFormBuilderStore } from '../stores/formBuilderStore';
import { generateComponentId, generateGuid } from '../utils/idGenerator';

/**
 * Test Case: Create a Customer Registration Form
 * 
 * This form includes:
 * - Basic text inputs with validation
 * - Dropdowns using dataviews (countries, cities)
 * - Property relationships (city dropdown depends on country selection)
 * - Conditional rendering based on other fields
 * - Data binding with dataKey properties
 */
export function createCustomerRegistrationFormTest(): ComponentDefinition[] {
  const formComponents: ComponentDefinition[] = [];

  // 1. Form Header
  const header: ComponentDefinition = {
    id: generateComponentId('Header'),
    guid: generateGuid(),
    name: 'formHeader',
    type: 'Header',
    props: {
      title: 'Customer Registration Form',
      position: 'static',
      color: 'primary',
    },
  };
  formComponents.push(header);

  // 2. Main Container
  const mainContainer: ComponentDefinition = {
    id: generateComponentId('Container'),
    guid: generateGuid(),
    name: 'mainContainer',
    type: 'Container',
    props: {
      flexDirection: 'column',
      gap: 2,
      alignItems: 'stretch',
    },
    children: [],
  };

  // 3. Personal Information Section
  const personalInfoHeading: ComponentDefinition = {
    id: generateComponentId('Heading'),
    guid: generateGuid(),
    name: 'personalInfoHeading',
    type: 'Heading',
    props: {
      text: 'Personal Information',
      variant: 'h5',
    },
  };
  mainContainer.children!.push(personalInfoHeading);

  // 4. First Name Input
  const firstNameInput: ComponentDefinition = {
    id: generateComponentId('TextInput'),
    guid: generateGuid(),
    name: 'firstName',
    type: 'TextInput',
    props: {
      label: 'First Name',
      placeholder: 'Enter your first name',
      dataKey: 'customer.firstName',
      fullWidth: true,
      variant: 'outlined',
      schema: {
        required: true,
        minLength: 2,
        maxLength: 50,
      },
    },
  };
  mainContainer.children!.push(firstNameInput);

  // 5. Last Name Input
  const lastNameInput: ComponentDefinition = {
    id: generateComponentId('TextInput'),
    guid: generateGuid(),
    name: 'lastName',
    type: 'TextInput',
    props: {
      label: 'Last Name',
      placeholder: 'Enter your last name',
      dataKey: 'customer.lastName',
      fullWidth: true,
      variant: 'outlined',
      schema: {
        required: true,
        minLength: 2,
        maxLength: 50,
      },
    },
  };
  mainContainer.children!.push(lastNameInput);

  // 6. Email Input
  const emailInput: ComponentDefinition = {
    id: generateComponentId('TextInput'),
    guid: generateGuid(),
    name: 'email',
    type: 'TextInput',
    props: {
      label: 'Email Address',
      placeholder: 'Enter your email',
      type: 'email',
      dataKey: 'customer.email',
      fullWidth: true,
      variant: 'outlined',
      schema: {
        required: true,
        pattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$',
      },
    },
  };
  mainContainer.children!.push(emailInput);

  // 7. Country Dropdown (using dataview)
  const countryDropdown: ComponentDefinition = {
    id: generateComponentId('Select'),
    guid: generateGuid(),
    name: 'country',
    type: 'Select',
    props: {
      label: 'Country',
      dataKey: 'customer.country',
      fullWidth: true,
      variant: 'outlined',
      // Using dataview for options
      optionsSource: 'countries_dataview_id', // Replace with actual dataview ID
      valueField: 'id',
      labelField: 'name',
      schema: {
        required: true,
      },
    },
  };
  mainContainer.children!.push(countryDropdown);

  // 8. City Dropdown (using dataview with dependency on country)
  const cityDropdown: ComponentDefinition = {
    id: generateComponentId('Select'),
    guid: generateGuid(),
    name: 'city',
    type: 'Select',
    props: {
      label: 'City',
      dataKey: 'customer.city',
      fullWidth: true,
      variant: 'outlined',
      // Using dataview for options
      optionsSource: 'cities_dataview_id', // Replace with actual dataview ID
      valueField: 'id',
      labelField: 'name',
      schema: {
        required: true,
      },
      // Property relationship: city depends on country
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
        // Hide city dropdown if no country is selected
        renderWhen: {
          type: 'function',
          fnSource: 'return !!data.customer?.country;',
        },
      },
    },
  };
  mainContainer.children!.push(cityDropdown);

  // 9. Address TextArea
  const addressTextArea: ComponentDefinition = {
    id: generateComponentId('TextArea'),
    guid: generateGuid(),
    name: 'address',
    type: 'TextArea',
    props: {
      label: 'Address',
      placeholder: 'Enter your full address',
      dataKey: 'customer.address',
      fullWidth: true,
      variant: 'outlined',
      rows: 3,
      schema: {
        required: true,
        minLength: 10,
      },
    },
  };
  mainContainer.children!.push(addressTextArea);

  // 10. Business Information Section
  const businessInfoHeading: ComponentDefinition = {
    id: generateComponentId('Heading'),
    guid: generateGuid(),
    name: 'businessInfoHeading',
    type: 'Heading',
    props: {
      text: 'Business Information',
      variant: 'h5',
    },
  };
  mainContainer.children!.push(businessInfoHeading);

  // 11. Is Business Customer Toggle
  const isBusinessToggle: ComponentDefinition = {
    id: generateComponentId('Toggle'),
    guid: generateGuid(),
    name: 'isBusiness',
    type: 'Toggle',
    props: {
      label: 'Is this a business customer?',
      dataKey: 'customer.isBusiness',
      checked: false,
    },
  };
  mainContainer.children!.push(isBusinessToggle);

  // 12. Company Name (conditional - only shows if isBusiness is true)
  const companyNameInput: ComponentDefinition = {
    id: generateComponentId('TextInput'),
    guid: generateGuid(),
    name: 'companyName',
    type: 'TextInput',
    props: {
      label: 'Company Name',
      placeholder: 'Enter company name',
      dataKey: 'customer.companyName',
      fullWidth: true,
      variant: 'outlined',
      schema: {
        required: false,
      },
      // Conditional rendering: only show if isBusiness is true
      renderWhen: {
        type: 'function',
        fnSource: 'return data.customer?.isBusiness === true;',
      },
    },
  };
  mainContainer.children!.push(companyNameInput);

  // 13. Business Type Dropdown (conditional - only shows if isBusiness is true)
  const businessTypeDropdown: ComponentDefinition = {
    id: generateComponentId('Select'),
    guid: generateGuid(),
    name: 'businessType',
    type: 'Select',
    props: {
      label: 'Business Type',
      dataKey: 'customer.businessType',
      fullWidth: true,
      variant: 'outlined',
      // Using static options
      options: [
        { value: 'sole_proprietorship', label: 'Sole Proprietorship' },
        { value: 'partnership', label: 'Partnership' },
        { value: 'corporation', label: 'Corporation' },
        { value: 'llc', label: 'LLC' },
        { value: 'other', label: 'Other' },
      ],
      schema: {
        required: false,
      },
      // Conditional rendering
      renderWhen: {
        type: 'function',
        fnSource: 'return data.customer?.isBusiness === true;',
      },
    },
  };
  mainContainer.children!.push(businessTypeDropdown);

  // 14. Customer Type Dropdown (using dataview, depends on isBusiness)
  const customerTypeDropdown: ComponentDefinition = {
    id: generateComponentId('Select'),
    guid: generateGuid(),
    name: 'customerType',
    type: 'Select',
    props: {
      label: 'Customer Type',
      dataKey: 'customer.customerType',
      fullWidth: true,
      variant: 'outlined',
      // Using dataview
      optionsSource: 'customer_types_dataview_id', // Replace with actual dataview ID
      valueField: 'id',
      labelField: 'name',
      schema: {
        required: true,
      },
      // Property relationship: filter customer types based on isBusiness
      dependencies: {
        optionsSource: {
          type: 'function',
          fnSource: `
            const isBusiness = data.customer?.isBusiness;
            // Filter customer types based on business flag
            return customerTypes.filter(type => 
              (isBusiness && type.category === 'business') || 
              (!isBusiness && type.category === 'individual')
            );
          `,
        },
      },
    },
  };
  mainContainer.children!.push(customerTypeDropdown);

  // 15. Submit Button
  const submitButton: ComponentDefinition = {
    id: generateComponentId('Button'),
    guid: generateGuid(),
    name: 'submitButton',
    type: 'Button',
    props: {
      label: 'Submit Registration',
      variant: 'contained',
      color: 'primary',
      fullWidth: false,
      events: {
        onClick: {
          type: 'function',
          fnSource: `
            // Validate form
            const formData = data;
            console.log('Submitting form:', formData);
            // Add your submission logic here
            alert('Form submitted successfully!');
          `,
        },
      },
    },
  };
  mainContainer.children!.push(submitButton);

  // Add main container to form
  formComponents.push(mainContainer);

  return formComponents;
}

/**
 * Test Case: Create a Product Order Form with DataGrid
 * 
 * This form demonstrates:
 * - Using DataGrid with dataview data source
 * - Product selection with quantity
 * - Dynamic pricing calculations
 * - Form validation
 */
export function createProductOrderFormTest(): ComponentDefinition[] {
  const formComponents: ComponentDefinition[] = [];

  // 1. Header
  const header: ComponentDefinition = {
    id: generateComponentId('Header'),
    guid: generateGuid(),
    name: 'orderFormHeader',
    type: 'Header',
    props: {
      title: 'Product Order Form',
      position: 'static',
    },
  };
  formComponents.push(header);

  // 2. Main Container
  const mainContainer: ComponentDefinition = {
    id: generateComponentId('Container'),
    guid: generateGuid(),
    name: 'orderMainContainer',
    type: 'Container',
    props: {
      flexDirection: 'column',
      gap: 2,
    },
    children: [],
  };

  // 3. Customer Info Section
  const customerSection: ComponentDefinition = {
    id: generateComponentId('Container'),
    guid: generateGuid(),
    name: 'customerSection',
    type: 'Container',
    props: {
      flexDirection: 'column',
      gap: 1.5,
    },
    children: [
      {
        id: generateComponentId('Heading'),
        guid: generateGuid(),
        name: 'customerInfoHeading',
        type: 'Heading',
        props: { text: 'Customer Information', variant: 'h6' },
      },
      {
        id: generateComponentId('TextInput'),
        guid: generateGuid(),
        name: 'customerName',
        type: 'TextInput',
        props: {
          label: 'Customer Name',
          dataKey: 'order.customerName',
          fullWidth: true,
          schema: { required: true },
        },
      },
      {
        id: generateComponentId('TextInput'),
        guid: generateGuid(),
        name: 'customerEmail',
        type: 'TextInput',
        props: {
          label: 'Email',
          type: 'email',
          dataKey: 'order.customerEmail',
          fullWidth: true,
          schema: { required: true },
        },
      },
    ],
  };
  mainContainer.children!.push(customerSection);

  // 4. Products DataGrid (using dataview)
  const productsGrid: ComponentDefinition = {
    id: generateComponentId('DataGrid'),
    guid: generateGuid(),
    name: 'productsGrid',
    type: 'DataGrid',
    props: {
      label: 'Select Products',
      // Using dataview for product data
      dataSource: 'products_dataview_id', // Replace with actual dataview ID
      columns: [
        { field: 'id', headerName: 'ID', width: 80 },
        { field: 'name', headerName: 'Product Name', width: 200 },
        { field: 'price', headerName: 'Price', width: 100, type: 'number' },
        { field: 'quantity', headerName: 'Quantity', width: 120, editable: true },
        { 
          field: 'total', 
          headerName: 'Total', 
          width: 120,
          // Computed property: quantity * price
          valueGetter: {
            type: 'function',
            fnSource: 'return params.row.quantity * params.row.price;',
          },
        },
      ],
      pagination: true,
      pageSize: 10,
    },
  };
  mainContainer.children!.push(productsGrid);

  // 5. Total Amount (computed from selected products)
  const totalAmount: ComponentDefinition = {
    id: generateComponentId('Amount'),
    guid: generateGuid(),
    name: 'totalAmount',
    type: 'Amount',
    props: {
      label: 'Total Amount',
      dataKey: 'order.totalAmount',
      currency: '$',
      decimalPlaces: 2,
      fullWidth: false,
      // Computed property: sum of all product totals
      value: {
        type: 'computed',
        computeType: 'function',
        fnSource: `
          const products = data.order?.products || [];
          return products.reduce((sum, product) => {
            return sum + (product.quantity * product.price);
          }, 0);
        `,
      },
    },
  };
  mainContainer.children!.push(totalAmount);

  // 6. Submit Button
  const submitButton: ComponentDefinition = {
    id: generateComponentId('Button'),
    guid: generateGuid(),
    name: 'orderSubmitButton',
    type: 'Button',
    props: {
      label: 'Place Order',
      variant: 'contained',
      color: 'primary',
      events: {
        onClick: {
          type: 'function',
          fnSource: `
            const orderData = data.order;
            console.log('Order submitted:', orderData);
            // Add order submission logic
          `,
        },
      },
    },
  };
  mainContainer.children!.push(submitButton);

  formComponents.push(mainContainer);
  return formComponents;
}

/**
 * Helper function to export form as JSON
 */
export function exportFormAsJSON(
  components: ComponentDefinition[],
  formName: string,
  description?: string
): string {
  const exportData = exportFormStructure(components, {
    formName,
    description,
    author: 'Form Builder Test',
  });
  
  return JSON.stringify(exportData, null, 2);
}

/**
 * Main test function - creates and exports a form
 */
export function runFormBuilderTest(): void {
  console.log('=== Form Builder Test ===\n');

  // Create customer registration form
  console.log('1. Creating Customer Registration Form...');
  const customerForm = createCustomerRegistrationFormTest();
  console.log(`   Created ${customerForm.length} root components`);
  
  // Count total components (including children)
  const countComponents = (comps: ComponentDefinition[]): number => {
    let count = comps.length;
    comps.forEach(comp => {
      if (comp.children) {
        count += countComponents(comp.children);
      }
    });
    return count;
  };
  const totalComponents = countComponents(customerForm);
  console.log(`   Total components: ${totalComponents}`);

  // Export as JSON
  console.log('\n2. Exporting form as JSON...');
  const jsonExport = exportFormAsJSON(
    customerForm,
    'Customer Registration Form',
    'A comprehensive customer registration form with dataviews and property relationships'
  );
  console.log('   Export completed');
  console.log('\n3. JSON Export:');
  console.log(jsonExport);

  // Create product order form
  console.log('\n\n4. Creating Product Order Form...');
  const orderForm = createProductOrderFormTest();
  console.log(`   Created ${orderForm.length} root components`);
  const totalOrderComponents = countComponents(orderForm);
  console.log(`   Total components: ${totalOrderComponents}`);

  // Export product order form
  console.log('\n5. Exporting product order form as JSON...');
  const orderJsonExport = exportFormAsJSON(
    orderForm,
    'Product Order Form',
    'A product order form with DataGrid and computed properties'
  );
  console.log('   Export completed');
  console.log('\n6. JSON Export:');
  console.log(orderJsonExport);

  console.log('\n=== Test Complete ===');
}

/**
 * Function to load form into the builder store
 * This can be called from the UI to load a test form
 */
export function loadTestFormIntoBuilder(formType: 'customer' | 'order' = 'customer'): void {
  const { setComponents } = useFormBuilderStore.getState();
  
  let components: ComponentDefinition[];
  if (formType === 'customer') {
    components = createCustomerRegistrationFormTest();
  } else {
    components = createProductOrderFormTest();
  }
  
  setComponents(components);
  console.log(`Loaded ${formType} form into builder with ${components.length} root components`);
}

// Export test data for use in other files
export const testFormData = {
  customerForm: createCustomerRegistrationFormTest,
  orderForm: createProductOrderFormTest,
  exportForm: exportFormAsJSON,
  loadIntoBuilder: loadTestFormIntoBuilder,
  runTest: runFormBuilderTest,
};

