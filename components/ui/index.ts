// A1-T3 · Base UI Component Library
// All generic primitives re-exported from one entry point.

export { Button }                     from './Button'
export type { ButtonProps }           from './Button'

export { Badge }                      from './Badge'
export type { BadgeProps }            from './Badge'

export { Card, CardHeader, CardBody, CardFooter, CardTitle } from './Card'
export type {
  CardProps,
  CardHeaderProps,
  CardBodyProps,
  CardFooterProps,
  CardTitleProps,
}                                     from './Card'

export { Spinner }                    from './Spinner'
export type { SpinnerProps }          from './Spinner'

export { EmptyState }                 from './EmptyState'
export type { EmptyStateProps }       from './EmptyState'

export { Modal }                      from './Modal'
export type { ModalProps }            from './Modal'

export {
  ToastProvider,
  useToast,
}                                     from './Toast'
export type { ToastItem, ToastVariant } from './Toast'

export {
  FormField,
  Input,
  Textarea,
  Select,
  Checkbox,
  RadioGroup,
}                                     from './Form'
export type {
  FormFieldProps,
  InputProps,
  TextareaProps,
  SelectProps,
  CheckboxProps,
  RadioGroupProps,
  RadioOption,
}                                     from './Form'

export { ErrorBoundary }              from './ErrorBoundary'
