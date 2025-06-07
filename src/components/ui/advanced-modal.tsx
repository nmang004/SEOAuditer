'use client';

import React, { useEffect, useRef, useCallback, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { designTokens } from '@/lib/design-tokens';
import { 
  FocusManager, 
  keyboard, 
  screenReader, 
  aria, 
  ariaLabels,
  useKeyboardNavigation,
  motionPreferences 
} from '@/lib/accessibility-utils';

export interface AdvancedModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  closeOnOverlayClick?: boolean;
  closeOnEscape?: boolean;
  showCloseButton?: boolean;
  preventBodyScroll?: boolean;
  returnFocusOnClose?: boolean;
  className?: string;
  overlayClassName?: string;
  contentClassName?: string;
  animation?: 'fade' | 'scale' | 'slide-up' | 'slide-down' | 'slide-left' | 'slide-right';
  zIndex?: number;
  role?: 'dialog' | 'alertdialog';
  onOpenComplete?: () => void;
  onCloseComplete?: () => void;
  initialFocus?: React.RefObject<HTMLElement>;
  restoreFocus?: React.RefObject<HTMLElement>;
  trapFocus?: boolean;
}

const sizeClasses = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
  full: 'max-w-none w-screen h-screen',
};

export function AdvancedModal({
  isOpen,
  onClose,
  title,
  description,
  children,
  size = 'md',
  closeOnOverlayClick = true,
  closeOnEscape = true,
  showCloseButton = true,
  preventBodyScroll = true,
  returnFocusOnClose = true,
  className,
  overlayClassName,
  contentClassName,
  animation = 'scale',
  zIndex = parseInt(designTokens.zIndex.modal),
  role = 'dialog',
  onOpenComplete,
  onCloseComplete,
  initialFocus,
  restoreFocus,
  trapFocus = true,
}: AdvancedModalProps) {
  const [mounted, setMounted] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const previousFocusRef = useRef<Element | null>(null);
  
  const modalId = aria.generateId('modal');
  const titleId = title ? `${modalId}-title` : undefined;
  const descriptionId = description ? `${modalId}-description` : undefined;

  // Setup keyboard navigation and focus management
  useKeyboardNavigation(modalRef, {
    trapFocus,
    autoFocus: true,
    onEscape: closeOnEscape ? onClose : undefined,
  });

  // Handle body scroll prevention
  useEffect(() => {
    if (!isOpen || !preventBodyScroll) return;

    const originalStyle = window.getComputedStyle(document.body);
    const scrollBarWidth = window.innerWidth - document.documentElement.clientWidth;

    // Prevent body scroll
    document.body.style.overflow = 'hidden';
    document.body.style.paddingRight = `${scrollBarWidth}px`;

    return () => {
      document.body.style.overflow = originalStyle.overflow;
      document.body.style.paddingRight = originalStyle.paddingRight;
    };
  }, [isOpen, preventBodyScroll]);

  // Save and restore focus
  useEffect(() => {
    if (isOpen) {
      // Save current focus
      if (returnFocusOnClose && !restoreFocus) {
        previousFocusRef.current = FocusManager.saveFocus();
      }

      // Set initial focus after animation
      setTimeout(() => {
        if (initialFocus?.current) {
          initialFocus.current.focus();
        } else if (closeButtonRef.current) {
          closeButtonRef.current.focus();
        } else if (modalRef.current) {
          const firstFocusable = FocusManager.getFirstFocusableElement(modalRef.current);
          firstFocusable?.focus();
        }
        
        onOpenComplete?.();
      }, 100);

      // Announce modal opening
      screenReader.announce(
        `${role === 'alertdialog' ? 'Alert dialog' : 'Dialog'} opened${title ? `: ${title}` : ''}`,
        'assertive'
      );
    } else {
      // Restore focus when closing
      setTimeout(() => {
        if (returnFocusOnClose) {
          const elementToFocus = restoreFocus?.current || previousFocusRef.current;
          FocusManager.restoreFocus(elementToFocus);
        }
        
        onCloseComplete?.();
      }, 200);
    }
  }, [isOpen, returnFocusOnClose, restoreFocus, initialFocus, title, role, onOpenComplete, onCloseComplete]);

  // Mount state for portal
  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  const handleOverlayClick = useCallback((event: React.MouseEvent) => {
    if (closeOnOverlayClick && event.target === overlayRef.current) {
      onClose();
    }
  }, [closeOnOverlayClick, onClose]);

  const handleCloseClick = useCallback(() => {
    screenReader.announce('Dialog closed', 'polite');
    onClose();
  }, [onClose]);

  // Animation variants
  const overlayVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
    exit: { opacity: 0 },
  };

  const modalVariants = {
    fade: {
      hidden: { opacity: 0 },
      visible: { opacity: 1 },
      exit: { opacity: 0 },
    },
    scale: {
      hidden: { opacity: 0, scale: 0.95 },
      visible: { opacity: 1, scale: 1 },
      exit: { opacity: 0, scale: 0.95 },
    },
    'slide-up': {
      hidden: { opacity: 0, y: 20 },
      visible: { opacity: 1, y: 0 },
      exit: { opacity: 0, y: 20 },
    },
    'slide-down': {
      hidden: { opacity: 0, y: -20 },
      visible: { opacity: 1, y: 0 },
      exit: { opacity: 0, y: -20 },
    },
    'slide-left': {
      hidden: { opacity: 0, x: 20 },
      visible: { opacity: 1, x: 0 },
      exit: { opacity: 0, x: 20 },
    },
    'slide-right': {
      hidden: { opacity: 0, x: -20 },
      visible: { opacity: 1, x: 0 },
      exit: { opacity: 0, x: -20 },
    },
  };

  const animationConfig = {
    duration: motionPreferences.prefersReducedMotion() ? 0 : 0.2,
    ease: 'easeOut',
  };

  const modalContent = (
    <AnimatePresence onExitComplete={onCloseComplete}>
      {isOpen && (
        <motion.div
          ref={overlayRef}
          className={cn(
            'fixed inset-0 bg-black/50 flex items-center justify-center p-4',
            size === 'full' && 'p-0',
            overlayClassName
          )}
          style={{ zIndex }}
          variants={overlayVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          transition={animationConfig}
          onClick={handleOverlayClick}
          aria-hidden="true"
        >
          <motion.div
            ref={modalRef}
            className={cn(
              'bg-white dark:bg-gray-900 rounded-lg shadow-xl w-full',
              sizeClasses[size],
              size === 'full' && 'rounded-none',
              contentClassName
            )}
            role={role}
            aria-modal="true"
            aria-labelledby={titleId}
            aria-describedby={descriptionId}
            variants={modalVariants[animation]}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={animationConfig}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            {(title || showCloseButton) && (
              <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex-1 min-w-0">
                  {title && (
                    <h2 
                      id={titleId}
                      className="text-lg font-semibold text-gray-900 dark:text-gray-100 truncate"
                    >
                      {title}
                    </h2>
                  )}
                  {description && (
                    <p 
                      id={descriptionId}
                      className="mt-1 text-sm text-gray-500 dark:text-gray-400"
                    >
                      {description}
                    </p>
                  )}
                </div>
                
                {showCloseButton && (
                  <button
                    ref={closeButtonRef}
                    onClick={handleCloseClick}
                    className={cn(
                      'ml-4 p-2 rounded-md text-gray-400 hover:text-gray-600 dark:hover:text-gray-200',
                      'hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors',
                      'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
                      'dark:focus:ring-offset-gray-900'
                    )}
                    aria-label={ariaLabels.actions.close}
                    type="button"
                  >
                    <X className="h-5 w-5" aria-hidden="true" />
                  </button>
                )}
              </div>
            )}

            {/* Content */}
            <div className={cn(
              'p-6',
              !(title || showCloseButton) && 'pt-6'
            )}>
              {children}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  if (!mounted) return null;

  return createPortal(modalContent, document.body);
}

// Modal footer component for consistent action layouts
export function ModalFooter({ 
  children, 
  className 
}: { 
  children: React.ReactNode; 
  className?: string; 
}) {
  return (
    <div className={cn(
      'flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 dark:border-gray-700',
      className
    )}>
      {children}
    </div>
  );
}

// Confirmation modal component
interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  confirmVariant?: 'primary' | 'danger';
  isLoading?: boolean;
}

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  confirmVariant = 'primary',
  isLoading = false,
}: ConfirmModalProps) {
  const confirmButtonRef = useRef<HTMLButtonElement>(null);

  const handleConfirm = () => {
    onConfirm();
    if (!isLoading) {
      onClose();
    }
  };

  return (
    <AdvancedModal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="sm"
      role="alertdialog"
      initialFocus={confirmButtonRef}
      animation="scale"
    >
      <div className="mb-6">
        <p className="text-gray-600 dark:text-gray-300">{message}</p>
      </div>
      
      <ModalFooter>
        <button
          onClick={onClose}
          disabled={isLoading}
          className={cn(
            'px-4 py-2 text-sm font-medium rounded-md',
            'border border-gray-300 dark:border-gray-600',
            'text-gray-700 dark:text-gray-200',
            'bg-white dark:bg-gray-800',
            'hover:bg-gray-50 dark:hover:bg-gray-700',
            'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
            'dark:focus:ring-offset-gray-900',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            'transition-colors'
          )}
        >
          {cancelText}
        </button>
        
        <button
          ref={confirmButtonRef}
          onClick={handleConfirm}
          disabled={isLoading}
          className={cn(
            'px-4 py-2 text-sm font-medium rounded-md',
            'focus:outline-none focus:ring-2 focus:ring-offset-2',
            'dark:focus:ring-offset-gray-900',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            'transition-colors',
            {
              'bg-primary text-white hover:bg-primary/90 focus:ring-primary': confirmVariant === 'primary',
              'bg-red-600 text-white hover:bg-red-700 focus:ring-red-600': confirmVariant === 'danger',
            }
          )}
        >
          {isLoading ? (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Loading...
            </div>
          ) : (
            confirmText
          )}
        </button>
      </ModalFooter>
    </AdvancedModal>
  );
}

// Hook for managing modal state
export function useModal(initialOpen = false) {
  const [isOpen, setIsOpen] = useState(initialOpen);

  const openModal = useCallback(() => setIsOpen(true), []);
  const closeModal = useCallback(() => setIsOpen(false), []);
  const toggleModal = useCallback(() => setIsOpen(prev => !prev), []);

  return {
    isOpen,
    openModal,
    closeModal,
    toggleModal,
  };
} 