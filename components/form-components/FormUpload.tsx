import React, { useRef, useState } from 'react';
import { Button, Box, Typography, LinearProgress, IconButton, List, ListItem, ListItemText, ListItemSecondaryAction } from '@mui/material';
import { CloudUpload as CloudUploadIcon, Delete as DeleteIcon, InsertDriveFile as FileIcon } from '@mui/icons-material';
import type { ComponentDefinition } from '../../stores/types';
import { useFormBuilderStore } from '../../stores/formBuilderStore';
import { useFormComponent } from '../../hooks/useFormComponent';
import { useComponentProperties } from '../../hooks/useComponentProperties';

interface FormUploadProps {
  component: ComponentDefinition;
}

interface UploadedFile {
  name: string;
  size: number;
  type: string;
  file?: File;
}

const FormUpload: React.FC<FormUploadProps> = ({ component }) => {
  const { selectComponent, selectedComponentId, formMode } = useFormBuilderStore();
  const isSelected = selectedComponentId === component.id;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  
  // Get dynamic properties using reusable hook
  const { latestComponent, className, getSxStyles } = useComponentProperties({ component, formMode });
  
  // Use the form component hook for all integrations
  const {
    computedLabel,
    computedHelperText,
    validationError,
    isValid,
    boundValue,
    responsiveSx,
    wrapperResponsiveSx,
    shouldRender,
    handleChange,
    handleClick,
    htmlAttributes,
  } = useFormComponent({ component: latestComponent, formMode });
  
  const accept = latestComponent.props?.accept || '*/*';
  const multiple = latestComponent.props?.multiple || false;
  const variant = latestComponent.props?.variant || 'outlined';
  const fullWidth = latestComponent.props?.fullWidth !== false;
  const disabled = latestComponent.props?.disabled || false;
  const maxSize = latestComponent.props?.maxSize; // Max file size in bytes
  const maxFiles = latestComponent.props?.maxFiles || 10;
  const showFileList = latestComponent.props?.showFileList !== false;
  const width = latestComponent.props?.width;

  const displayHelperText = validationError || computedHelperText || '';
  const hasError = !!validationError || !isValid;
  
  // Get uploaded files from bound value
  const uploadedFiles: UploadedFile[] = Array.isArray(boundValue) ? boundValue : [];

  // Don't render if conditional rendering says no
  if (!shouldRender) {
    return null;
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!formMode) return;
    
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const newFiles: UploadedFile[] = [];
    const errors: string[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      // Check max size
      if (maxSize && file.size > maxSize) {
        errors.push(`${file.name} exceeds max size (${formatFileSize(maxSize)})`);
        continue;
      }
      
      // Check max files
      if (uploadedFiles.length + newFiles.length >= maxFiles) {
        errors.push(`Maximum ${maxFiles} files allowed`);
        break;
      }

      newFiles.push({
        name: file.name,
        size: file.size,
        type: file.type,
        file: file,
      });
    }

    if (errors.length > 0) {
      console.warn('Upload errors:', errors);
    }

    if (newFiles.length > 0) {
      setUploading(true);
      
      // Simulate upload delay (in real app, this would be actual upload)
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const updatedFiles = multiple 
        ? [...uploadedFiles, ...newFiles]
        : newFiles;
      
      handleChange(updatedFiles);
      setUploading(false);
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveFile = (index: number) => {
    if (!formMode) return;
    
    const updatedFiles = uploadedFiles.filter((_, i) => i !== index);
    handleChange(updatedFiles.length > 0 ? updatedFiles : null);
  };

  const handleButtonClick = (e: React.MouseEvent) => {
    if (!formMode) {
      e.stopPropagation();
      selectComponent(component.id);
    } else {
      handleClick(e);
      if (!disabled && fileInputRef.current) {
        fileInputRef.current.click();
      }
    }
  };

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
        width: width || (fullWidth ? '100%' : 'auto'),
        ...getSxStyles({
          includeMinDimensions: !formMode,
          defaultMinWidth: '200px',
          defaultMinHeight: '40px',
          additionalSx: wrapperResponsiveSx,
        }),
      }}
      className={`${formMode ? '' : 'form-builder-upload'} ${className}`.trim()}
      style={htmlAttributes}
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        <Button
          variant={variant as any}
          component="span"
          startIcon={<CloudUploadIcon />}
          disabled={!formMode || disabled || uploading}
          fullWidth={fullWidth}
          onClick={handleButtonClick}
          sx={{
            ...responsiveSx,
            ...(hasError ? { borderColor: 'error.main', color: 'error.main' } : {}),
          }}
        >
          {computedLabel || latestComponent.props?.label || 'Upload File'}
        </Button>
        
        <input
          ref={fileInputRef}
          type="file"
          hidden
          accept={accept}
          multiple={multiple}
          onChange={handleFileSelect}
          disabled={!formMode || disabled}
        />

        {uploading && (
          <LinearProgress sx={{ mt: 1 }} />
        )}

        {displayHelperText && (
          <Typography 
            variant="caption" 
            color={hasError ? 'error' : 'text.secondary'}
            sx={{ mt: 0.5 }}
          >
            {displayHelperText}
          </Typography>
        )}

        {showFileList && uploadedFiles.length > 0 && (
          <List dense sx={{ mt: 1, p: 0 }}>
            {uploadedFiles.map((file, index) => (
              <ListItem 
                key={index}
                sx={{ 
                  bgcolor: 'action.hover', 
                  borderRadius: 1, 
                  mb: 0.5,
                  pr: 6,
                }}
              >
                <FileIcon sx={{ mr: 1, color: 'action.active' }} fontSize="small" />
                <ListItemText
                  primary={file.name}
                  secondary={formatFileSize(file.size)}
                  primaryTypographyProps={{ variant: 'body2', noWrap: true }}
                  secondaryTypographyProps={{ variant: 'caption' }}
                />
                {formMode && (
                  <ListItemSecondaryAction>
                    <IconButton
                      edge="end"
                      size="small"
                      onClick={() => handleRemoveFile(index)}
                      disabled={disabled}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </ListItemSecondaryAction>
                )}
              </ListItem>
            ))}
          </List>
        )}
      </Box>
    </Box>
  );
};

export default FormUpload;
