import React, { useState } from 'react';
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
  Tooltip,
  Breadcrumbs,
  Link,
  Paper,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  ChevronRight as ChevronRightIcon,
  Widgets as WidgetsIcon,
  ViewModule as ContainerIcon,
  GridView as GridIcon,
  Repeat as RepeaterIcon,
  DynamicForm as FormIcon,
  NavigateNext as NavigateNextIcon,
  Home as HomeIcon,
} from '@mui/icons-material';
import type { ComponentDefinition, ComponentType } from '../../stores/types';
import { useFormBuilderStore } from '../../stores/formBuilderStore';
import { getComponentByType } from '../../utils/componentLibrary';

interface ContainerChildrenListProps {
  component: ComponentDefinition;
}

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
  // Check for custom label/name first
  if (component.props?.label) return component.props.label;
  if (component.props?.name) return component.props.name;
  if (component.props?.text) return component.props.text;
  if (component.props?.sectionName) return component.props.sectionName;
  
  // Get type label from library
  const libItem = getComponentByType(component.type);
  if (libItem) return libItem.componentNameLabel;
  
  return component.type;
};

interface ChildItemProps {
  child: ComponentDefinition;
  depth: number;
  onSelect: (id: string) => void;
  selectedId: string | null;
}

const ChildItem: React.FC<ChildItemProps> = ({ child, depth, onSelect, selectedId }) => {
  const [expanded, setExpanded] = useState(false);
  const hasChildren = child.children && child.children.length > 0;
  const isSelected = selectedId === child.id;
  const isContainer = canHaveChildren(child.type);

  const handleClick = () => {
    onSelect(child.id);
  };

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setExpanded(!expanded);
  };

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
                transition: 'transform 0.2s',
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
            py: 0.5,
            minHeight: 36,
            transition: 'all 0.2s ease',
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
            {getComponentIcon(child.type)}
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
                    maxWidth: 120,
                  }}
                >
                  {getDisplayName(child)}
                </Typography>
                {isContainer && (
                  <Chip
                    label={child.children?.length || 0}
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
                  {child.type}
                </Typography>
              )
            }
          />
        </ListItemButton>
      </ListItem>

      {/* Nested children */}
      {hasChildren && (
        <Collapse in={expanded} timeout="auto" unmountOnExit>
          <List disablePadding>
            {child.children!.map((nestedChild) => (
              <ChildItem
                key={nestedChild.id}
                child={nestedChild}
                depth={depth + 1}
                onSelect={onSelect}
                selectedId={selectedId}
              />
            ))}
          </List>
        </Collapse>
      )}
    </>
  );
};

const ContainerChildrenList: React.FC<ContainerChildrenListProps> = ({ component }) => {
  const { selectComponent, selectedComponentId, findComponent, findComponentParent } = useFormBuilderStore();
  const [isExpanded, setIsExpanded] = useState(true);

  // Build breadcrumb path from root to current component
  const buildBreadcrumbPath = (): ComponentDefinition[] => {
    const path: ComponentDefinition[] = [];
    let current: ComponentDefinition | null = component;
    
    while (current) {
      path.unshift(current);
      current = findComponentParent(current.id);
    }
    
    return path;
  };

  const breadcrumbPath = buildBreadcrumbPath();
  const hasChildren = component.children && component.children.length > 0;
  const isContainerType = canHaveChildren(component.type);

  // Don't render if component can't have children
  if (!isContainerType) {
    return null;
  }

  const handleSelectFromBreadcrumb = (id: string) => {
    selectComponent(id);
  };

  return (
    <Paper
      elevation={0}
      sx={{
        bgcolor: 'background.default',
        borderRadius: 1,
        overflow: 'hidden',
      }}
    >
      {/* Breadcrumb Navigation - shows hierarchy path */}
      {breadcrumbPath.length > 1 && (
        <Box
          sx={{
            px: 1.5,
            py: 1,
            borderBottom: '1px solid',
            borderColor: 'divider',
            bgcolor: 'grey.50',
          }}
        >
          <Breadcrumbs
            separator={<NavigateNextIcon fontSize="small" sx={{ fontSize: '0.875rem' }} />}
            sx={{ '& .MuiBreadcrumbs-ol': { flexWrap: 'nowrap' } }}
          >
            {breadcrumbPath.map((item, index) => {
              const isLast = index === breadcrumbPath.length - 1;
              const displayName = getDisplayName(item);
              
              return isLast ? (
                <Typography
                  key={item.id}
                  variant="caption"
                  sx={{
                    fontWeight: 600,
                    color: 'primary.main',
                    fontSize: '0.7rem',
                    maxWidth: 80,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {displayName}
                </Typography>
              ) : (
                <Link
                  key={item.id}
                  component="button"
                  variant="caption"
                  underline="hover"
                  onClick={() => handleSelectFromBreadcrumb(item.id)}
                  sx={{
                    cursor: 'pointer',
                    fontSize: '0.7rem',
                    color: 'text.secondary',
                    maxWidth: 60,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    '&:hover': {
                      color: 'primary.main',
                    },
                  }}
                >
                  {displayName}
                </Link>
              );
            })}
          </Breadcrumbs>
        </Box>
      )}

      {/* Header with collapse toggle */}
      <Box
        onClick={() => setIsExpanded(!isExpanded)}
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: 1.5,
          py: 1,
          cursor: 'pointer',
          bgcolor: 'background.paper',
          borderBottom: isExpanded ? '1px solid' : 'none',
          borderColor: 'divider',
          transition: 'background-color 0.2s',
          '&:hover': {
            bgcolor: 'action.hover',
          },
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <WidgetsIcon fontSize="small" sx={{ color: 'primary.main' }} />
          <Typography
            variant="subtitle2"
            sx={{ fontSize: '0.8rem', fontWeight: 600 }}
          >
            Child Elements
          </Typography>
          <Chip
            label={component.children?.length || 0}
            size="small"
            color="primary"
            variant="outlined"
            sx={{
              height: 20,
              fontSize: '0.7rem',
              '& .MuiChip-label': { px: 0.75 },
            }}
          />
        </Box>
        <IconButton
          size="small"
          sx={{
            transition: 'transform 0.2s',
            transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
          }}
        >
          <ExpandMoreIcon fontSize="small" />
        </IconButton>
      </Box>

      {/* Children List */}
      <Collapse in={isExpanded}>
        <Box sx={{ maxHeight: 250, overflow: 'auto' }}>
          {hasChildren ? (
            <List dense disablePadding sx={{ py: 0.5 }}>
              {component.children!.map((child) => (
                <ChildItem
                  key={child.id}
                  child={child}
                  depth={0}
                  onSelect={selectComponent}
                  selectedId={selectedComponentId}
                />
              ))}
            </List>
          ) : (
            <Box
              sx={{
                py: 3,
                px: 2,
                textAlign: 'center',
                color: 'text.secondary',
              }}
            >
              <WidgetsIcon sx={{ fontSize: 32, opacity: 0.3, mb: 1 }} />
              <Typography
                variant="body2"
                sx={{ fontSize: '0.75rem', opacity: 0.7 }}
              >
                No child elements
              </Typography>
              <Typography
                variant="caption"
                sx={{ fontSize: '0.65rem', opacity: 0.5 }}
              >
                Drop components into this container
              </Typography>
            </Box>
          )}
        </Box>
      </Collapse>
    </Paper>
  );
};

export default ContainerChildrenList;

