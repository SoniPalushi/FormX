import React, { useMemo } from 'react';
import {
  Box,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Typography,
} from '@mui/material';
import type { ComponentDefinition } from '../../stores/types';
import { useFormBuilderStore } from '../../stores/formBuilderStore';
import { useFormDataStore } from '../../stores/formDataStore';
import { resolveArrayDataSource } from '../../utils/data/dataSourceResolver';

interface FormListProps {
  component: ComponentDefinition;
}

const FormList: React.FC<FormListProps> = ({ component }) => {
  const { selectComponent, selectedComponentId, findComponent } = useFormBuilderStore();
  const { data, getAllData, getData } = useFormDataStore();
  const isSelected = selectedComponentId === component.id;

  // Get latest component
  const latestComponent = useMemo(() => {
    return findComponent(component.id) || component;
  }, [component.id, findComponent]);

  // Support multiple data source types: items, data, dataSource
  const dataSource = latestComponent.props?.dataSource || 
                     latestComponent.props?.items || 
                     latestComponent.props?.data || 
                     [];
  
  // Resolve data from various sources
  const items = useMemo(() => {
    return resolveArrayDataSource({
      source: dataSource,
      formData: data,
      component: latestComponent,
      getAllData,
      getData,
    });
  }, [dataSource, data, latestComponent, getAllData, getData]);
  
  const label = latestComponent.props?.label || 'List';
  const dense = latestComponent.props?.dense || false;
  const showAvatar = latestComponent.props?.showAvatar !== false;

  return (
    <Box
      onClick={(e) => {
        e.stopPropagation();
        selectComponent(component.id);
      }}
      sx={{
        border: isSelected ? '2px solid #1976d2' : '2px solid transparent',
        borderRadius: 1,
        p: 0.5,
        cursor: 'pointer',
      }}
    >
      <Paper sx={{ p: 2, minHeight: 200 }}>
        {label && (
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            {label}
          </Typography>
        )}
        {items && items.length > 0 ? (
          <List dense={dense}>
            {items.map((item: any, index: number) => {
              const primaryText =
                typeof item === 'string'
                  ? item
                  : item.label || item.text || item.primary || `Item ${index + 1}`;
              const secondaryText =
                typeof item === 'object' ? item.secondary || item.description : undefined;
              const avatar =
                typeof item === 'object' ? item.avatar || item.icon : undefined;

              return (
                <ListItem key={index} disabled>
                  {showAvatar && avatar && (
                    <ListItemAvatar>
                      <Avatar>{avatar}</Avatar>
                    </ListItemAvatar>
                  )}
                  <ListItemText primary={primaryText} secondary={secondaryText} />
                </ListItem>
              );
            })}
          </List>
        ) : (
          <Typography variant="body2" color="text.secondary">
            No list items available
          </Typography>
        )}
      </Paper>
    </Box>
  );
};

export default FormList;

