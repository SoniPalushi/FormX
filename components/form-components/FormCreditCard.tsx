import React from 'react';
import { TextField, Box, Grid } from '@mui/material';
import type { ComponentDefinition } from '../../stores/types';
import { useFormBuilderStore } from '../../stores/formBuilderStore';
import { useFormComponent } from '../../hooks/useFormComponent';

interface FormCreditCardProps {
  component: ComponentDefinition;
}

const FormCreditCard: React.FC<FormCreditCardProps> = ({ component }) => {
  const { selectComponent, selectedComponentId, formMode, components, findComponent } = useFormBuilderStore();
  const isSelected = selectedComponentId === component.id;
  
  // Get latest component from store to ensure real-time updates
  const latestComponent = React.useMemo(() => {
    return findComponent(component.id) || component;
  }, [component.id, components, findComponent]);
  
  const {
    responsiveSx,
    responsiveCss,
    wrapperResponsiveSx,
    wrapperResponsiveCss,
    shouldRender,
    handleClick,
    htmlAttributes,
  } = useFormComponent({ component: latestComponent, formMode });
  
  const variant = latestComponent.props?.variant || 'outlined';
  const fullWidth = latestComponent.props?.fullWidth !== false;
  const disabled = latestComponent.props?.disabled || false;
  const size = latestComponent.props?.size || 'medium';
  const margin = latestComponent.props?.margin;
  const padding = latestComponent.props?.padding;
  const classes = latestComponent.props?.classes || latestComponent.props?.className || [];
  
  const cardNumber = latestComponent.props?.cardNumber || latestComponent.props?.number || '';
  const cardHolder = latestComponent.props?.cardHolder || latestComponent.props?.holder || '';
  const expiryDate = latestComponent.props?.expiryDate || latestComponent.props?.expiry || '';
  const cvv = latestComponent.props?.cvv || latestComponent.props?.cvc || '';

  if (!shouldRender) return null;

  return (
    <Box
      onClick={(e) => {
        if (!formMode) {
          e.stopPropagation();
          selectComponent(component.id);
        } else {
          handleClick(e);
        }
      }}
      sx={{
        border: isSelected && !formMode ? '2px solid #1976d2' : '2px solid transparent',
        borderRadius: 1,
        p: formMode ? 0 : 0.5,
        cursor: formMode ? 'default' : 'pointer',
        margin: margin ? `${margin.top || 0}px ${margin.right || 0}px ${margin.bottom || 0}px ${margin.left || 0}px` : undefined,
        padding: padding ? `${padding.top || 0}px ${padding.right || 0}px ${padding.bottom || 0}px ${padding.left || 0}px` : undefined,
        ...wrapperResponsiveSx,
      }}
      className={Array.isArray(classes) ? classes.join(' ') : classes}
      style={wrapperResponsiveCss ? { ...htmlAttributes, style: wrapperResponsiveCss } : htmlAttributes}
    >
      <Box sx={{ p: 2, bgcolor: 'background.paper', borderRadius: 1, border: '1px solid', borderColor: 'divider' }}>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <TextField
              label="Card Number"
              value={cardNumber}
              variant={variant as any}
              fullWidth={fullWidth}
              disabled={disabled || !formMode}
              size={size as any}
              placeholder="1234 5678 9012 3456"
              inputProps={{
                maxLength: 19,
                pattern: '[0-9 ]*',
              }}
              sx={responsiveSx}
              style={responsiveCss ? { style: responsiveCss } : undefined}
              {...htmlAttributes}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              label="Card Holder Name"
              value={cardHolder}
              variant={variant as any}
              fullWidth={fullWidth}
              disabled={disabled || !formMode}
              size={size as any}
              placeholder="John Doe"
              sx={responsiveSx}
              style={responsiveCss ? { style: responsiveCss } : undefined}
              {...htmlAttributes}
            />
          </Grid>
          <Grid item xs={6}>
            <TextField
              label="Expiry Date"
              value={expiryDate}
              variant={variant as any}
              fullWidth={fullWidth}
              disabled={disabled || !formMode}
              size={size as any}
              placeholder="MM/YY"
              inputProps={{
                maxLength: 5,
                pattern: '[0-9/]*',
              }}
              sx={responsiveSx}
              style={responsiveCss ? { style: responsiveCss } : undefined}
              {...htmlAttributes}
            />
          </Grid>
          <Grid item xs={6}>
            <TextField
              label="CVV"
              value={cvv}
              variant={variant as any}
              fullWidth={fullWidth}
              disabled={disabled || !formMode}
              size={size as any}
              placeholder="123"
              type="password"
              inputProps={{
                maxLength: 4,
                pattern: '[0-9]*',
              }}
              sx={responsiveSx}
              style={responsiveCss ? { style: responsiveCss } : undefined}
              {...htmlAttributes}
            />
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
};

export default FormCreditCard;

