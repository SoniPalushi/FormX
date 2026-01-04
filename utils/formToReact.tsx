/**
 * Form to React Component Converter
 * Converts form definitions to TSX/JSX React components
 */

import type { ComponentDefinition } from '../stores/types';

export interface ReactExportOptions {
  format: 'tsx' | 'jsx';
  componentName?: string;
  importStyle?: 'named' | 'default';
  includeTypes?: boolean;
  useMUI?: boolean;
  indentSize?: number;
  externalFunctions?: Record<string, string>; // Map of function names to import paths, e.g., { 'fetchConsumers': './api/consumers' }
}

/**
 * Convert ComponentDefinition to React component string
 */
export function convertToReactComponent(
  components: ComponentDefinition[],
  options: ReactExportOptions = {
    format: 'tsx',
    componentName: 'Form',
    importStyle: 'named',
    includeTypes: true,
    useMUI: true,
    indentSize: 2,
  }
): string {
  const {
    format,
    componentName = 'Form',
    importStyle = 'named',
    includeTypes = format === 'tsx',
    useMUI = true,
    indentSize = 2,
  } = options;

  const indent = ' '.repeat(indentSize);
  const isTSX = format === 'tsx';

  // Generate imports
  const imports = generateImports(useMUI, importStyle, isTSX) + functionImports;

  // Collect external functions from components
  const externalFunctions = options.externalFunctions || {};
  const functionImports = collectFunctionImports(components, externalFunctions, isTSX);
  
  // Generate component props type
  const propsType = isTSX
    ? `\ninterface ${componentName}Props {\n${indent}onSubmit?: (data: Record<string, any>) => void;\n${indent}initialValues?: Record<string, any>;\n${indent}dataProviders?: Record<string, (params?: any) => Promise<any> | any>;\n}`
    : '';

  // Generate component body
  const componentBody = generateComponentBody(components, componentName, indent, isTSX, useMUI, options.externalFunctions);

  // Generate full component
  const component = `${imports}${propsType}

${isTSX ? 'export' : ''} function ${componentName}({ onSubmit, initialValues${isTSX ? `}: ${componentName}Props` : ' = {}'}) {
${componentBody}
}

export default ${componentName};`;

  return component;
}

/**
 * Generate imports based on options
 */
function generateImports(useMUI: boolean, importStyle: 'named' | 'default', isTSX: boolean): string {
  if (!useMUI) {
    return isTSX ? "import React from 'react';\n" : "import React from 'react';\n";
  }

  const muiImports = [
    'TextField',
    'Button',
    'Checkbox',
    'FormControlLabel',
    'Select',
    'MenuItem',
    'FormControl',
    'InputLabel',
    'Box',
    'Typography',
    'Paper',
    'Container',
    'Table',
    'TableBody',
    'TableCell',
    'TableContainer',
    'TableHead',
    'TableRow',
  ];

  if (importStyle === 'named') {
    return `import React${isTSX ? ', { useState, useEffect }' : ''} from 'react';\nimport { ${muiImports.join(', ')} } from '@mui/material';\n`;
  } else {
    return `import React${isTSX ? ', { useState, useEffect }' : ''} from 'react';\nimport * as MUI from '@mui/material';\n`;
  }
}

/**
 * Collect function imports from components
 */
function collectFunctionImports(
  components: ComponentDefinition[],
  externalFunctions: Record<string, string>,
  isTSX: boolean
): string {
  const imports: string[] = [];
  
  const collect = (comps: ComponentDefinition[]) => {
    comps.forEach(comp => {
      // Check for function data sources
      const dataSource = comp.props?.dataSource;
      if (typeof dataSource === 'string' && externalFunctions[dataSource]) {
        const funcName = dataSource;
        const importPath = externalFunctions[funcName];
        if (!imports.includes(`import { ${funcName} } from '${importPath}';`)) {
          imports.push(`import { ${funcName} } from '${importPath}';`);
        }
      }
      
      // Recursively check children
      if (comp.children && comp.children.length > 0) {
        collect(comp.children);
      }
    });
  };
  
  collect(components);
  
  return imports.length > 0 ? '\n' + imports.join('\n') + '\n' : '';
}

/**
 * Collect data providers that need useEffect hooks
 */
function collectDataProviders(
  components: ComponentDefinition[],
  externalFunctions?: Record<string, string>
): Array<{ componentId: string; functionName: string; dataKey: string }> {
  const providers: Array<{ componentId: string; functionName: string; dataKey: string }> = [];
  
  const collect = (comps: ComponentDefinition[]) => {
    comps.forEach(comp => {
      const dataSource = comp.props?.dataSource;
      
      // If dataSource is a string function name (external function)
      if (typeof dataSource === 'string' && (externalFunctions?.[dataSource] || dataSource.match(/^[a-zA-Z_$][a-zA-Z0-9_$]*$/))) {
        providers.push({
          componentId: comp.id,
          functionName: dataSource,
          dataKey: `data_${comp.id}`,
        });
      }
      
      // Recursively check children
      if (comp.children && comp.children.length > 0) {
        collect(comp.children);
      }
    });
  };
  
  collect(components);
  
  return providers;
}

/**
 * Generate useEffect hooks for data providers
 */
function generateDataProviderHooks(
  providers: Array<{ componentId: string; functionName: string; dataKey: string }>,
  indent: string,
  isTSX: boolean,
  externalFunctions?: Record<string, string>
): string {
  if (providers.length === 0) return '';
  
  const hooks = providers.map(provider => {
    const stateType = isTSX ? `<any[]>` : '';
    const stateHook = `${indent}${indent}const [${provider.dataKey}, set${provider.dataKey.charAt(0).toUpperCase() + provider.dataKey.slice(1)}] = useState${stateType}([]);`;
    
    const effectHook = `${indent}${indent}useEffect(() => {
${indent}${indent}${indent}const loadData = async () => {
${indent}${indent}${indent}${indent}try {
${indent}${indent}${indent}${indent}${indent}const result = await ${provider.functionName}();
${indent}${indent}${indent}${indent}${indent}set${provider.dataKey.charAt(0).toUpperCase() + provider.dataKey.slice(1)}(Array.isArray(result) ? result : []);
${indent}${indent}${indent}${indent}} catch (error) {
${indent}${indent}${indent}${indent}${indent}console.error('Error loading data for ${provider.componentId}:', error);
${indent}${indent}${indent}${indent}}
${indent}${indent}${indent}};
${indent}${indent}${indent}loadData();
${indent}${indent}}, []);`;
    
    return `${stateHook}\n${effectHook}`;
  }).join('\n\n');
  
  return '\n' + hooks;
}

/**
 * Generate component body
 */
function generateComponentBody(
  components: ComponentDefinition[],
  componentName: string,
  indent: string,
  isTSX: boolean,
  useMUI: boolean,
  externalFunctions?: Record<string, string>
): string {
  const stateHook = isTSX
    ? `${indent}${indent}const [formData, setFormData] = useState<Record<string, any>>(initialValues || {});`
    : `${indent}${indent}const [formData, setFormData] = useState(initialValues || {});`;

  // Collect data providers that need useEffect hooks
  const dataProviders = collectDataProviders(components, externalFunctions);
  const dataProviderHooks = generateDataProviderHooks(dataProviders, indent, isTSX, externalFunctions);

  const handleChangeType = isTSX ? '(name: string, value: any) => void' : '';
  const handleChange = `${indent}${indent}const handleChange${isTSX ? ': ' + handleChangeType : ''} = (name: string, value: any) => {\n${indent}${indent}${indent}setFormData(prev => ({ ...prev, [name]: value }));\n${indent}${indent}};`;

  const handleSubmitType = isTSX ? '(e: React.FormEvent) => void' : '';
  const handleSubmit = `${indent}${indent}const handleSubmit${isTSX ? ': ' + handleSubmitType : ''} = (e: React.FormEvent) => {\n${indent}${indent}${indent}e.preventDefault();\n${indent}${indent}${indent}onSubmit?.(formData);\n${indent}${indent}};`;

  const renderComponents = components
    .map((comp) => convertComponentToJSX(comp, indent + indent, useMUI, externalFunctions))
    .join('\n');

  return `${stateHook}
${dataProviderHooks}

${handleChange}

${handleSubmit}

${indent}${indent}return (
${indent}${indent}${indent}<form onSubmit={handleSubmit}>
${renderComponents}
${indent}${indent}${indent}</form>
${indent}${indent});
`;
}

/**
 * Convert a single component to JSX
 */
function convertComponentToJSX(
  component: ComponentDefinition,
  indent: string,
  useMUI: boolean,
  externalFunctions?: Record<string, string>
): string {
  const props = component.props || {};
  const name = props.name || props.id || component.id;
  const label = props.label || '';
  const required = props.required || false;
  const disabled = props.disabled || false;
  const placeholder = props.placeholder || '';
  const value = props.value || props.defaultValue || '';
  const fullWidth = props.fullWidth !== false;
  const variant = props.variant || 'outlined';
  const size = props.size || 'medium';

  switch (component.type) {
    case 'TextInput':
      return `${indent}<TextField
${indent}${indent}name="${name}"
${indent}${indent}label="${label}"
${indent}${indent}value={formData.${name} || '${value}'}
${indent}${indent}onChange={(e) => handleChange('${name}', e.target.value)}
${indent}${indent}required={${required}}
${indent}${indent}disabled={${disabled}}
${indent}${indent}placeholder="${placeholder}"
${indent}${indent}fullWidth={${fullWidth}}
${indent}${indent}variant="${variant}"
${indent}${indent}size="${size}"
${indent}/>`;

    case 'TextArea':
      const rows = props.rows || 4;
      return `${indent}<TextField
${indent}${indent}name="${name}"
${indent}${indent}label="${label}"
${indent}${indent}value={formData.${name} || '${value}'}
${indent}${indent}onChange={(e) => handleChange('${name}', e.target.value)}
${indent}${indent}multiline
${indent}${indent}rows={${rows}}
${indent}${indent}required={${required}}
${indent}${indent}disabled={${disabled}}
${indent}${indent}fullWidth={${fullWidth}}
${indent}${indent}variant="${variant}"
${indent}/>`;

    case 'Select':
    case 'DropDown':
      const options = props.options || [];
      const optionsJSX = options
        .map((opt: any, idx: number) => {
          const optValue = typeof opt === 'string' ? opt : opt.value || opt.label;
          const optLabel = typeof opt === 'string' ? opt : opt.label || opt.value;
          return `${indent}${indent}<MenuItem key={${idx}} value="${optValue}">${optLabel}</MenuItem>`;
        })
        .join('\n');

      return `${indent}<FormControl fullWidth={${fullWidth}} required={${required}} disabled={${disabled}}>
${indent}${indent}<InputLabel>${label}</InputLabel>
${indent}${indent}<Select
${indent}${indent}${indent}name="${name}"
${indent}${indent}${indent}value={formData.${name} || ''}
${indent}${indent}${indent}onChange={(e) => handleChange('${name}', e.target.value)}
${indent}${indent}${indent}label="${label}"
${indent}${indent}>
${optionsJSX}
${indent}${indent}</Select>
${indent}</FormControl>`;

    case 'CheckBox':
      return `${indent}<FormControlLabel
${indent}${indent}control={
${indent}${indent}${indent}<Checkbox
${indent}${indent}${indent}${indent}name="${name}"
${indent}${indent}${indent}${indent}checked={formData.${name} || false}
${indent}${indent}${indent}${indent}onChange={(e) => handleChange('${name}', e.target.checked)}
${indent}${indent}${indent}${indent}disabled={${disabled}}
${indent}${indent}${indent}/>
${indent}${indent}}
${indent}${indent}label="${label}"
${indent}/>`;

    case 'Button':
      const buttonLabel = props.label || props.text || 'Submit';
      const buttonVariant = props.variant || 'contained';
      const buttonColor = props.color || 'primary';
      return `${indent}<Button
${indent}${indent}type="submit"
${indent}${indent}variant="${buttonVariant}"
${indent}${indent}color="${buttonColor}"
${indent}${indent}disabled={${disabled}}
${indent}>
${indent}${indent}${buttonLabel}
${indent}</Button>`;

    case 'Label':
      const labelText = props.label || props.text || '';
      return `${indent}<Typography variant="body1">${labelText}</Typography>`;

    case 'Heading':
      const headingText = props.text || props.label || '';
      const headingVariant = props.variant || 'h4';
      return `${indent}<Typography variant="${headingVariant}">${headingText}</Typography>`;

    case 'Container':
      const childrenJSX =
        component.children && component.children.length > 0
          ? component.children
              .map((child) => convertComponentToJSX(child, indent + indent, useMUI, externalFunctions))
              .join('\n')
          : '';
      const flexDirection = props.flexDirection || props.direction || 'column';
      const gap = props.gap || 1.5;
      return `${indent}<Box sx={{ display: 'flex', flexDirection: '${flexDirection}', gap: ${gap} }}>
${childrenJSX}
${indent}</Box>`;

    case 'DataGrid':
      const dataSource = props.dataSource || props.rows || props.data || [];
      const columns = props.columns || [];
      const gridLabel = props.label || 'Data Grid';
      
      // Determine data source
      let dataSourceCode = '';
      if (typeof dataSource === 'string' && (externalFunctions?.[dataSource] || dataSource.match(/^[a-zA-Z_$][a-zA-Z0-9_$]*$/))) {
        // External function reference
        dataSourceCode = `data_${component.id}`;
      } else if (Array.isArray(dataSource)) {
        // Static array
        dataSourceCode = JSON.stringify(dataSource);
      } else {
        // Fallback to empty array
        dataSourceCode = '[]';
      }
      
      // Generate columns
      const columnsCode = columns.length > 0
        ? JSON.stringify(columns)
        : `(${dataSourceCode}.length > 0 ? Object.keys(${dataSourceCode}[0]).map(key => ({ field: key, headerName: key })) : [])`;
      
      return `${indent}<Box sx={{ p: 2 }}>
${indent}${indent}<Typography variant="subtitle2" sx={{ mb: 1 }}>${gridLabel}</Typography>
${indent}${indent}{${dataSourceCode}.length > 0 ? (
${indent}${indent}${indent}<TableContainer>
${indent}${indent}${indent}${indent}<Table size="small" stickyHeader>
${indent}${indent}${indent}${indent}${indent}<TableHead>
${indent}${indent}${indent}${indent}${indent}${indent}<TableRow>
${indent}${indent}${indent}${indent}${indent}${indent}${indent}{${columnsCode}.map((col, idx) => (
${indent}${indent}${indent}${indent}${indent}${indent}${indent}${indent}<TableCell key={idx}>
${indent}${indent}${indent}${indent}${indent}${indent}${indent}${indent}${indent}{typeof col === 'string' ? col : col.headerName || col.field}
${indent}${indent}${indent}${indent}${indent}${indent}${indent}${indent}</TableCell>
${indent}${indent}${indent}${indent}${indent}${indent}${indent}))}
${indent}${indent}${indent}${indent}${indent}${indent}</TableRow>
${indent}${indent}${indent}${indent}${indent}</TableHead>
${indent}${indent}${indent}${indent}${indent}<TableBody>
${indent}${indent}${indent}${indent}${indent}${indent}{${dataSourceCode}.map((row, rowIdx) => (
${indent}${indent}${indent}${indent}${indent}${indent}${indent}<TableRow key={rowIdx}>
${indent}${indent}${indent}${indent}${indent}${indent}${indent}${indent}{${columnsCode}.map((col, colIdx) => {
${indent}${indent}${indent}${indent}${indent}${indent}${indent}${indent}${indent}const field = typeof col === 'string' ? col : col.field;
${indent}${indent}${indent}${indent}${indent}${indent}${indent}${indent}${indent}return (
${indent}${indent}${indent}${indent}${indent}${indent}${indent}${indent}${indent}${indent}<TableCell key={colIdx}>
${indent}${indent}${indent}${indent}${indent}${indent}${indent}${indent}${indent}${indent}${indent}{row[field] !== undefined ? String(row[field]) : '-'}
${indent}${indent}${indent}${indent}${indent}${indent}${indent}${indent}${indent}${indent}</TableCell>
${indent}${indent}${indent}${indent}${indent}${indent}${indent}${indent}${indent});
${indent}${indent}${indent}${indent}${indent}${indent}${indent}${indent})}
${indent}${indent}${indent}${indent}${indent}${indent}${indent}</TableRow>
${indent}${indent}${indent}${indent}${indent}${indent}))}
${indent}${indent}${indent}${indent}${indent}</TableBody>
${indent}${indent}${indent}${indent}</Table>
${indent}${indent}${indent}</TableContainer>
${indent}${indent}) : (
${indent}${indent}${indent}<Typography variant="body2" color="text.secondary">No data available</Typography>
${indent}${indent})}
${indent}</Box>`;

    default:
      // Generic component fallback
      return `${indent}<!-- ${component.type} component not yet implemented -->`;
  }
}

/**
 * Download form as React component file
 */
export function downloadAsReactComponent(
  components: ComponentDefinition[],
  filename: string = 'Form.tsx',
  options?: ReactExportOptions
): void {
  const format = filename.endsWith('.tsx') ? 'tsx' : filename.endsWith('.jsx') ? 'jsx' : 'tsx';
  const componentName = filename.replace(/\.(tsx|jsx)$/, '').replace(/[^a-zA-Z0-9]/g, '');
  const componentNamePascal = componentName.charAt(0).toUpperCase() + componentName.slice(1);

  const componentCode = convertToReactComponent(components, {
    format,
    componentName: componentNamePascal,
    ...options,
  });

  const blob = new Blob([componentCode], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

