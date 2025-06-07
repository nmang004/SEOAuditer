'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { 
  DndContext, 
  DragOverlay, 
  DragStartEvent, 
  DragEndEvent,
  DragOverEvent,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  closestCenter,
  closestCorners,
  rectIntersection,
  CollisionDetection,
  UniqueIdentifier,
  Active,
  Over,
  useDroppable,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  horizontalListSortingStrategy,
  rectSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { motion, AnimatePresence } from 'framer-motion';
import { GripVertical, GripHorizontal, FolderOpen, File } from 'lucide-react';
import { cn } from '@/lib/utils';
import { designTokens } from '@/lib/design-tokens';
import { screenReader, motionPreferences, aria } from '@/lib/accessibility-utils';

export interface DragDropItem {
  id: UniqueIdentifier;
  type?: string;
  data?: any;
  disabled?: boolean;
}

export interface DragDropContainerProps {
  items: DragDropItem[];
  onReorder?: (items: DragDropItem[]) => void;
  onMove?: (activeId: UniqueIdentifier, overId: UniqueIdentifier) => void;
  strategy?: 'vertical' | 'horizontal' | 'grid';
  disabled?: boolean;
  collision?: 'center' | 'corners' | 'intersection';
  children: (item: DragDropItem, isDragging: boolean) => React.ReactNode;
  className?: string;
  dropZones?: string[];
  allowCrossContainer?: boolean;
  animation?: boolean;
}

export interface SortableItemProps {
  id: UniqueIdentifier;
  children: React.ReactNode;
  disabled?: boolean;
  handle?: boolean;
  className?: string;
  data?: any;
}

export interface DroppableZoneProps {
  id: string;
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
  accept?: string[];
  onDrop?: (activeId: UniqueIdentifier, overId: UniqueIdentifier) => void;
  placeholder?: React.ReactNode;
}

// Custom collision detection for better UX
const customCollisionDetection: CollisionDetection = (args) => {
  // First, let's see if there are any collisions with the pointer
  const pointerIntersections = rectIntersection(args);
  
  if (pointerIntersections.length > 0) {
    return pointerIntersections;
  }

  // If there are no pointer intersections, use closest center
  return closestCenter(args);
};

// Sortable Item Component
export function SortableItem({
  id,
  children,
  disabled = false,
  handle = false,
  className,
  data,
}: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
    isOver,
    isSorting,
  } = useSortable({
    id,
    disabled,
    data,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: motionPreferences.prefersReducedMotion() ? 'none' : transition,
  };

  const dragHandleProps = handle ? {} : { ...listeners, ...attributes };
  const handleProps = handle ? { ...listeners, ...attributes } : {};

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'relative',
        isDragging && 'z-50 opacity-50',
        isOver && 'ring-2 ring-primary ring-opacity-50',
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
      {...dragHandleProps}
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-label={`Draggable item ${id}`}
      aria-describedby={`item-${id}-instructions`}
      aria-pressed={isDragging}
      aria-disabled={disabled}
    >
      <div
        id={`item-${id}-instructions`}
        className="sr-only"
        aria-live="polite"
      >
        {isDragging 
          ? `Moving item ${id}. Use arrow keys to change position, space to drop.`
          : `Item ${id}. Press space or enter to pick up.`
        }
      </div>
      
      {handle && (
        <div
          {...handleProps}
          className="absolute left-2 top-1/2 transform -translate-y-1/2 cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 z-10"
          aria-label="Drag handle"
          role="button"
          tabIndex={0}
        >
          <GripVertical className="h-4 w-4" />
        </div>
      )}
      
      {children}
    </div>
  );
}

// Droppable Zone Component
export function DroppableZone({
  id,
  children,
  className,
  disabled = false,
  accept = [],
  onDrop,
  placeholder,
}: DroppableZoneProps) {
  const { setNodeRef, isOver, active } = useDroppable({
    id,
    disabled,
    data: { accept },
  });

  const canAccept = accept.length === 0 || (active?.data.current?.type && accept.includes(active.data.current.type));
  const showPlaceholder = isOver && canAccept && React.Children.count(children) === 0;

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'min-h-[100px] transition-colors',
        isOver && canAccept && 'bg-primary/10 border-2 border-primary border-dashed',
        isOver && !canAccept && 'bg-red-100 border-2 border-red-300 border-dashed',
        disabled && 'opacity-50',
        className
      )}
      role="region"
      aria-label={`Drop zone ${id}`}
      aria-describedby={`dropzone-${id}-instructions`}
    >
      <div
        id={`dropzone-${id}-instructions`}
        className="sr-only"
        aria-live="polite"
      >
        {isOver && canAccept && `Drop zone ${id} is active. Release to drop.`}
        {isOver && !canAccept && `Cannot drop this item in ${id}.`}
      </div>
      
      {showPlaceholder ? placeholder : children}
    </div>
  );
}

// Project Card Component for drag and drop
interface ProjectCardProps {
  project: {
    id: string;
    name: string;
    description?: string;
    status?: 'active' | 'completed' | 'archived';
    lastModified?: Date;
  };
  isDragging?: boolean;
  className?: string;
}

export function ProjectCard({ project, isDragging = false, className }: ProjectCardProps) {
  return (
    <motion.div
      layout
      className={cn(
        'p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm',
        'hover:shadow-md transition-shadow cursor-pointer',
        isDragging && 'shadow-lg rotate-3',
        className
      )}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{
        duration: motionPreferences.prefersReducedMotion() ? 0 : 0.2,
        ease: 'easeOut',
      }}
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-1">
          <FolderOpen className="h-5 w-5 text-primary" />
        </div>
        
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 truncate">
            {project.name}
          </h3>
          
          {project.description && (
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
              {project.description}
            </p>
          )}
          
          <div className="mt-2 flex items-center gap-2">
            {project.status && (
              <span className={cn(
                'inline-block px-2 py-1 text-xs font-medium rounded-full',
                {
                  'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400': project.status === 'active',
                  'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400': project.status === 'completed',
                  'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400': project.status === 'archived',
                }
              )}>
                {project.status}
              </span>
            )}
            
            {project.lastModified && (
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {project.lastModified.toLocaleDateString()}
              </span>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// Main Drag and Drop Container
export function DragDropContainer({
  items,
  onReorder,
  onMove,
  strategy = 'vertical',
  disabled = false,
  collision = 'center',
  children,
  className,
  dropZones = [],
  allowCrossContainer = false,
  animation = true,
}: DragDropContainerProps) {
  const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null);
  const [draggedItem, setDraggedItem] = useState<DragDropItem | null>(null);
  const announcements = useRef<string[]>([]);

  // Configure sensors for both pointer and keyboard interaction
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Require 8px movement before drag starts
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Choose collision detection strategy
  const collisionDetectionStrategy = {
    center: closestCenter,
    corners: closestCorners,
    intersection: rectIntersection,
  }[collision];

  // Choose sorting strategy
  const sortingStrategy = {
    vertical: verticalListSortingStrategy,
    horizontal: horizontalListSortingStrategy,
    grid: rectSortingStrategy,
  }[strategy];

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const { active } = event;
    setActiveId(active.id);
    
    const item = items.find(item => item.id === active.id);
    setDraggedItem(item || null);
    
    // Announce drag start
    const announcement = `Picked up draggable item ${active.id}`;
    announcements.current.push(announcement);
    screenReader.announce(announcement, 'assertive');
  }, [items]);

  const handleDragOver = useCallback((event: DragOverEvent) => {
    const { active, over } = event;
    
    if (!over) return;
    
    // Announce potential drop target
    if (over.id !== active.id) {
      const announcement = `Draggable item ${active.id} is over ${over.id}`;
      screenReader.announce(announcement, 'polite');
    }
  }, []);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over) {
      // Announce failed drop
      screenReader.announce(`Draggable item ${active.id} was dropped outside of any drop zone`, 'assertive');
      setActiveId(null);
      setDraggedItem(null);
      return;
    }

    if (active.id !== over.id) {
      if (onReorder) {
        const oldIndex = items.findIndex(item => item.id === active.id);
        const newIndex = items.findIndex(item => item.id === over.id);
        
        if (oldIndex !== -1 && newIndex !== -1) {
          const newItems = arrayMove(items, oldIndex, newIndex);
          onReorder(newItems);
          
          // Announce successful reorder
          screenReader.announce(
            `Draggable item ${active.id} was moved to position ${newIndex + 1}`,
            'assertive'
          );
        }
      }
      
      if (onMove) {
        onMove(active.id, over.id);
        
        // Announce successful move
        screenReader.announce(
          `Draggable item ${active.id} was moved to ${over.id}`,
          'assertive'
        );
      }
    } else {
      // Announce drop in same position
      screenReader.announce(
        `Draggable item ${active.id} was returned to its original position`,
        'polite'
      );
    }

    setActiveId(null);
    setDraggedItem(null);
  }, [items, onReorder, onMove]);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={collisionDetectionStrategy}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={items.map(item => item.id)} strategy={sortingStrategy}>
        <div className={cn('relative', className)} role="application" aria-label="Drag and drop interface">
          <div className="sr-only" aria-live="assertive" id="dnd-live-region">
            {announcements.current[announcements.current.length - 1]}
          </div>
          
          {animation ? (
            <AnimatePresence>
              {items.map(item => (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{
                    duration: motionPreferences.prefersReducedMotion() ? 0 : 0.2,
                    ease: 'easeOut',
                  }}
                >
                  {children(item, activeId === item.id)}
                </motion.div>
              ))}
            </AnimatePresence>
          ) : (
            items.map(item => children(item, activeId === item.id))
          )}
        </div>
      </SortableContext>

      <DragOverlay>
        {activeId && draggedItem ? (
          <div className="cursor-grabbing transform rotate-3 scale-105">
            {children(draggedItem, true)}
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

// Hook for managing drag and drop state
export function useDragAndDrop<T extends DragDropItem>(initialItems: T[]) {
  const [items, setItems] = useState<T[]>(initialItems);
  
  const handleReorder = useCallback((newItems: T[]) => {
    setItems(newItems);
  }, []);
  
  const addItem = useCallback((item: T) => {
    setItems(prev => [...prev, item]);
  }, []);
  
  const removeItem = useCallback((id: UniqueIdentifier) => {
    setItems(prev => prev.filter(item => item.id !== id));
  }, []);
  
  const updateItem = useCallback((id: UniqueIdentifier, updates: Partial<T>) => {
    setItems(prev => prev.map(item => 
      item.id === id ? { ...item, ...updates } : item
    ));
  }, []);
  
  return [
    items,
    {
      handleReorder,
      addItem,
      removeItem,
      updateItem,
      setItems,
    }
  ] as const;
} 