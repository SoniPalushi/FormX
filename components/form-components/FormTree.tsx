import React, { useState, useMemo } from 'react';
import {
  Box,
  Paper,
  Typography,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Collapse,
  IconButton,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  ChevronRight as ChevronRightIcon,
} from '@mui/icons-material';
import type { ComponentDefinition } from '../../stores/types';
import { useFormBuilderStore } from '../../stores/formBuilderStore';
import { useFormDataStore } from '../../stores/formDataStore';
import { resolveDataSource } from '../../utils/data/dataSourceResolver';

interface FormTreeProps {
  component: ComponentDefinition;
}

interface TreeNode {
  id: string;
  label: string;
  children?: TreeNode[];
}

const FormTree: React.FC<FormTreeProps> = ({ component }) => {
  const { selectComponent, selectedComponentId, findComponent, components } = useFormBuilderStore();
  const { data, getAllData, getData } = useFormDataStore();
  const isSelected = selectedComponentId === component.id;
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  // Get latest component - subscribe to components array for real-time updates
  const latestComponent = useMemo(() => {
    return findComponent(component.id) || component;
  }, [component.id, components, findComponent]);

  // Support multiple data source types: data, treeData, dataSource
  const dataSource = latestComponent.props?.dataSource || 
                     latestComponent.props?.data || 
                     latestComponent.props?.treeData || 
                     [];
  
  // Resolve data from various sources (Tree expects array of TreeNode)
  const resolvedData = useMemo(() => {
    const resolved = resolveDataSource({
      source: dataSource,
      formData: data,
      component: latestComponent,
      getAllData,
      getData,
    });
    return Array.isArray(resolved) ? resolved : [];
  }, [dataSource, data, latestComponent, getAllData, getData]);
  
  const label = latestComponent.props?.label || 'Tree View';

  const toggleNode = (nodeId: string) => {
    setExpanded((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(nodeId)) {
        newSet.delete(nodeId);
      } else {
        newSet.add(nodeId);
      }
      return newSet;
    });
  };

  const renderTree = (nodes: TreeNode[], level: number = 0): React.ReactNode => {
    return nodes.map((node) => {
      const hasChildren = node.children && node.children.length > 0;
      const isExpanded = expanded.has(node.id);

      return (
        <React.Fragment key={node.id}>
          <ListItem
            disablePadding
            sx={{ pl: level * 2 }}
            onClick={(e) => {
              e.stopPropagation();
              selectComponent(component.id);
            }}
          >
            <ListItemButton
              onClick={(e) => {
                e.stopPropagation();
                if (hasChildren) {
                  toggleNode(node.id);
                }
              }}
            >
              {hasChildren ? (
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleNode(node.id);
                  }}
                >
                  {isExpanded ? <ExpandMoreIcon /> : <ChevronRightIcon />}
                </IconButton>
              ) : (
                <Box sx={{ width: 24 }} />
              )}
              <ListItemText primary={node.label} />
            </ListItemButton>
          </ListItem>
          {hasChildren && (
            <Collapse in={isExpanded} timeout="auto" unmountOnExit>
              <List component="div" disablePadding>
                {renderTree(node.children!, level + 1)}
              </List>
            </Collapse>
          )}
        </React.Fragment>
      );
    });
  };

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
        {resolvedData && resolvedData.length > 0 ? (
          <List sx={{ maxHeight: 300, overflow: 'auto' }}>
            {renderTree(resolvedData as TreeNode[])}
          </List>
        ) : (
          <Typography variant="body2" color="text.secondary">
            No tree data available
          </Typography>
        )}
      </Paper>
    </Box>
  );
};

export default FormTree;

