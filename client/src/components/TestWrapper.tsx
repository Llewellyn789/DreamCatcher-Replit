
import React from 'react';
import { TestingUtils, isDevelopment } from '@/lib/testing';

interface TestWrapperProps {
  componentName: string;
  children: React.ReactNode;
  props?: Record<string, any>;
}

export function TestWrapper({ componentName, children, props = {} }: TestWrapperProps) {
  React.useEffect(() => {
    if (isDevelopment) {
      TestingUtils.validateComponentProps(componentName, props);
    }
  }, [componentName, props]);

  // In development, add visual indicators for component boundaries
  if (isDevelopment) {
    return (
      <div 
        style={{ 
          border: '1px dashed rgba(255, 0, 0, 0.2)',
          position: 'relative'
        }}
        title={`Component: ${componentName}`}
      >
        <div 
          style={{
            position: 'absolute',
            top: '-1px',
            left: '-1px',
            fontSize: '10px',
            background: 'rgba(255, 0, 0, 0.1)',
            padding: '2px 4px',
            color: '#666',
            pointerEvents: 'none'
          }}
        >
          {componentName}
        </div>
        {children}
      </div>
    );
  }

  return <>{children}</>;
}
