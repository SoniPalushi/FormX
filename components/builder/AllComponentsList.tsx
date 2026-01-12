import React, { useState, memo, useCallback } from 'react';
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Collapse,
  Chip,
  IconButton,
  Paper,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Widgets as WidgetsIcon,
  ViewModule as ContainerIcon,
  GridView as GridIcon,
  Repeat as RepeaterIcon,
  DynamicForm as FormIcon,
  TextFields as TextIcon,
  SmartButton as ButtonIcon,
  Image as ImageIcon,
  CheckBox as CheckboxIcon,
  RadioButtonChecked as RadioIcon,
  ToggleOn as ToggleIcon,
  CalendarMonth as CalendarIcon,
  TableChart as DataGridIcon,
  AccountTree as TreeIcon,
} from '@mui/icons-material';
import type { ComponentDefinition, ComponentType } from '../../stores/types';
import { useFormBuilderStore } from '../../stores/formBuilderStore';
import { getComponentByType } from '../../utils/componentLibrary';

// Component types that can have children
const CONTAINER_TYPES: ComponentType[] = [
  'Container',
  'Grid',
  'Form',
  'Header',
  'Footer',
  'SideNav',
  'ViewStack',
  'Repeater',
  'RepeaterEx',
  'Wizard',
];

// Get appropriate icon for component type
const getComponentIcon = (type: ComponentType) => {
  switch (type) {
    case 'Container':
      return <ContainerIcon fontSize="small" />;
    case 'Grid':
      return <GridIcon fontSize="small" />;
    case 'Repeater':
    case 'RepeaterEx':
      return <RepeaterIcon fontSize="small" />;
    case 'Form':
      return <FormIcon fontSize="small" />;
    case 'Button':
      return <ButtonIcon fontSize="small" />;
    case 'TextInput':
    case 'TextArea':
    case 'Label':
    case 'Heading':
      return <TextIcon fontSize="small" />;
    case 'Image':
      return <ImageIcon fontSize="small" />;
    case 'CheckBox':
    case 'CheckBoxGroup':
      return <CheckboxIcon fontSize="small" />;
    case 'RadioGroup':
      return <RadioIcon fontSize="small" />;
    case 'Toggle':
      return <ToggleIcon fontSize="small" />;
    case 'DateTime':
    case 'DateTimeCb':
    case 'Calendar':
    case 'CalendarDay':
    case 'CalendarWeek':
    case 'CalendarMonth':
      return <CalendarIcon fontSize="small" />;
    case 'DataGrid':
      return <DataGridIcon fontSize="small" />;
    case 'Tree':
      return <TreeIcon fontSize="small" />;
    default:
      return <WidgetsIcon fontSize="small" />;
  }
};

// Check if a component can have children
const canHaveChildren = (type: ComponentType): boolean => {
  return CONTAINER_TYPES.includes(type);
};

// Get display name for a component
const getDisplayName = (component: ComponentDefinition): string => {
  if (component.props?.label) return component.props.label;
  if (component.props?.name) return component.props.name;
  if (component.props?.text) return component.props.text;
  if (component.props?.sectionName) return component.props.sectionName;
  
  const libItem = getComponentByType(component.type);
  if (libItem) return libItem.componentNameLabel;
  
  return component.type;
};

interface ComponentItemProps {
  component: ComponentDefinition;
  depth: number;
  onSelect: (id: string) => void;
  selectedId: string | null;
  defaultExpanded?: boolean;
}

// Memoized ComponentItem for better performance
const ComponentItemComponent: React.FC<ComponentItemProps> = ({ 
  component, 
  depth, 
  onSelect, 
  selectedId,
  defaultExpanded = true 
}) => {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const hasChildren = component.children && component.children.length > 0;
  const isSelected = selectedId === component.id;
  const isContainer = canHaveChildren(component.type);

  const handleClick = useCallback(() => {
    onSelect(component.id);
  }, [onSelect, component.id]);

  const handleToggle = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setExpanded(prev => !prev);
  }, []);

  return (
    <>
      <ListItem
        disablePadding
        sx={{ pl: depth * 1.5 }}
        secondaryAction={
          hasChildren ? (
            <IconButton
              edge="end"
              size="small"
              onClick={handleToggle}
              sx={{ 
                mr: -0.5,
                transition: 'transform 0.15s ease',
                transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
              }}
            >
              <ExpandMoreIcon fontSize="small" />
            </IconButton>
          ) : null
        }
      >
        <ListItemButton
          onClick={handleClick}
          selected={isSelected}
          sx={{
            borderRadius: 1,
            my: 0.25,
            py: 0.75,
            minHeight: 40,
            // Use specific properties for instant hover feedback
            transition: 'background-color 0.1s ease',
            '&.Mui-selected': {
              bgcolor: 'primary.main',
              color: 'primary.contrastText',
              '&:hover': {
                bgcolor: 'primary.dark',
              },
              '& .MuiListItemIcon-root': {
                color: 'inherit',
              },
              '& .MuiChip-root': {
                bgcolor: 'rgba(255,255,255,0.2)',
                color: 'inherit',
              },
            },
            '&:hover': {
              bgcolor: 'action.hover',
            },
          }}
        >
          <ListItemIcon sx={{ minWidth: 32 }}>
            {getComponentIcon(component.type)}
          </ListItemIcon>
          <ListItemText
            primary={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography
                  variant="body2"
                  sx={{
                    fontSize: '0.8125rem',
                    fontWeight: isSelected ? 600 : 400,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    maxWidth: 130,
                  }}
                >
                  {getDisplayName(component)}
                </Typography>
                {isContainer && hasChildren && (
                  <Chip
                    label={component.children?.length || 0}
                    size="small"
                    sx={{
                      height: 18,
                      fontSize: '0.65rem',
                      fontWeight: 600,
                      '& .MuiChip-label': {
                        px: 0.75,
                      },
                    }}
                  />
                )}
              </Box>
            }
            secondary={
              !isSelected && (
                <Typography
                  variant="caption"
                  sx={{
                    fontSize: '0.65rem',
                    color: 'text.disabled',
                  }}
                >
                  {component.type}
                </Typography>
              )
            }
          />
        </ListItemButton>
      </ListItem>

      {/* Nested children */}
      {hasChildren && (
        <Collapse in={expanded} timeout={150} unmountOnExit>
          <List disablePadding>
            {component.children!.map((child) => (
              <ComponentItem
                key={child.id}
                component={child}
                depth={depth + 1}
                onSelect={onSelect}
                selectedId={selectedId}
                defaultExpanded={depth < 1} // Auto-expand first 2 levels
              />
            ))}
          </List>
        </Collapse>
      )}
    </>
  );
};

// Memoize to prevent unnecessary re-renders when parent updates
const ComponentItem = memo(ComponentItemComponent, (prevProps, nextProps) => {
  // Only re-render if the component data, selection state, or depth changes
  return (
    prevProps.component.id === nextProps.component.id &&
    prevProps.selectedId === nextProps.selectedId &&
    prevProps.depth === nextProps.depth &&
    prevProps.component.children?.length === nextProps.component.children?.length &&
    JSON.stringify(prevProps.component.props) === JSON.stringify(nextProps.component.props)
  );
});

const AllComponentsList: React.FC = () => {
  const { selectComponent, selectedComponentId, components } = useFormBuilderStore();

  const totalComponents = React.useMemo(() => {
    const count = (comps: ComponentDefinition[]): number => {
      return comps.reduce((acc, comp) => {
        return acc + 1 + (comp.children ? count(comp.children) : 0);
      }, 0);
    };
    return count(components);
  }, [components]);

  if (components.length === 0) {
    return (
      <Box
        sx={{
          p: 3,
          textAlign: 'center',
          color: 'text.secondary',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <WidgetsIcon sx={{ fontSize: 48, opacity: 0.3, mb: 2 }} />
        <Typography variant="body2" sx={{ fontWeight: 500, mb: 0.5 }}>
          No components yet
        </Typography>
        <Typography variant="caption" sx={{ opacity: 0.7 }}>
          Drag components from the left panel to the work area
        </Typography>
      </Box>
    );
  }

  return (
    <Paper
      elevation={0}
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: 'background.default',
      }}
    >
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: 1.5,
          py: 1.25,
          borderBottom: '1px solid',
          borderColor: 'divider',
          bgcolor: 'grey.50',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <WidgetsIcon fontSize="small" sx={{ color: 'primary.main' }} />
          <Typography
            variant="subtitle2"
            sx={{ fontSize: '0.85rem', fontWeight: 600 }}
          >
            All Components
          </Typography>
        </Box>
        <Chip
          label={totalComponents}
          size="small"
          color="primary"
          sx={{
            height: 22,
            fontSize: '0.75rem',
            fontWeight: 600,
          }}
        />
      </Box>

      {/* Instruction */}
      <Box
        sx={{
          px: 1.5,
          py: 1,
          bgcolor: 'info.light',
          borderBottom: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Typography
          variant="caption"
          sx={{
            color: 'info.dark',
            fontSize: '0.7rem',
            display: 'block',
          }}
        >
          Click on any component to select and edit its properties
        </Typography>
      </Box>

      {/* Components List */}
      <Box sx={{ flex: 1, overflow: 'auto' }}>
        <List dense disablePadding sx={{ py: 0.5 }}>
          {components.map((component) => (
            <ComponentItem
              key={component.id}
              component={component}
              depth={0}
              onSelect={selectComponent}
              selectedId={selectedComponentId}
              defaultExpanded={true}
            />
          ))}
        </List>
      </Box>
    </Paper>
  );
};

export default AllComponentsList;

