import React from 'react';
import { Divider, Box } from '@mui/material';
import type { ComponentDefinition } from '../../stores/types';
import { useFormBuilderStore } from '../../stores/formBuilderStore';

interface FormHRuleProps {
  component: ComponentDefinition;
}

const FormHRule: React.FC<FormHRuleProps> = ({ component }) => {
  const { selectComponent, selectedComponentId, formMode, components, findComponent } = useFormBuilderStore();
  const isSelected = selectedComponentId === component.id;
  
  // Get latest component from store to ensure real-time updates
  const latestComponent = React.useMemo(() => {
    return findComponent(component.id) || component;
  }, [component.id, components, findComponent]);
  
  const variant = latestComponent.props?.variant || 'fullWidth';
  const orientation = latestComponent.props?.orientation || 'horizontal';

  return (
    <Box
      onClick={(e) => {
        if (!formMode) {
          e.stopPropagation();
          selectComponent(component.id);
        }
      }}
      sx={{
        border: isSelected && !formMode ? '2px solid #1976d2' : '2px solid transparent',
        borderRadius: 1,
        p: formMode ? 0 : 0.5,
        cursor: formMode ? 'default' : 'pointer',
        width: '100%',
      }}
    >
      <Divider variant={variant as any} orientation={orientation as any} />
    </Box>
  );
};

export default FormHRule;

