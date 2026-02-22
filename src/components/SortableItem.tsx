
import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { DraggableAttributes } from '@dnd-kit/core';
import type { SyntheticListenerMap } from '@dnd-kit/core';

export function useSortableItem(id: string | number) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 'auto',
    opacity: isDragging ? 0.7 : 1,
  };

  return {
    ref: setNodeRef,
    style,
    attributes,
    listeners,
    isDragging,
  };
}

interface SortableItemProps {
    id: string | number;
    children: (attributes: DraggableAttributes, listeners: SyntheticListenerMap | undefined) => React.ReactNode;
}

export function SortableItem({ id, children }: SortableItemProps) {
  const { ref, style, attributes, listeners } = useSortableItem(id);

  return (
    <div ref={ref} style={style}>
      {children(attributes, listeners)}
    </div>
  );
}
