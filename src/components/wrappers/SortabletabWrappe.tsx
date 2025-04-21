import React from 'react';
import { Tab } from '@grafana/ui';
import { css } from '@emotion/css';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface SortableTabWrapperProps<T> {
  rule: T;
  activeRule: T | null;
  onActivate: (rule: T) => void;
}

export const SortableTabWrapper = <T extends { name: string }>({
  rule,
  activeRule,
  onActivate,
}: SortableTabWrapperProps<T>) => {
  const { name } = rule;
  const isActive = activeRule ? JSON.stringify(activeRule) === JSON.stringify(rule) : false;
  
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: name });
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    position: 'relative' as const,
  };
  
  const handleActivate = () => {
    onActivate(rule);
  };
  
  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      {...attributes} 
      {...listeners}
      className={css`
        cursor: grab;
        margin: 1px 0;
        position: relative;
        min-width: 0;
        max-width: 100%;
        width: 100%;
      
        &::after {
          content: '≡';
          position: absolute;
          right: 10px;
          top: 50%;
          transform: translateY(-50%);
          opacity: 0.6;
          z-index: 2;
        }
      
        &:active {
          cursor: grabbing;
        }
      `}
    >
      <Tab
        label={rule.name}
        active={isActive}
        onChangeTab={handleActivate}
      />
    </div>
  );
};