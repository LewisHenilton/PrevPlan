'use client';

  import React from 'react';

  export type CardVariant = 'default' | 'bordered' | 'elevated' | 'flat';

  export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
    variant?: CardVariant;
    padding?: 'none' | 'sm' | 'md' | 'lg';
    children: React.ReactNode;
  }

  /**
   * Componente Card reutilizável para containers de conteúdo
   *
   * @example
   * <Card variant="elevated" padding="lg">
   *   <h3>Título</h3>
   *   <p>Conteúdo</p>
   * </Card>
   */
  export default function Card({
    variant = 'default',
    padding = 'md',
    className = '',
    children,
    ...props
  }: CardProps) {

    // Variantes
    const variantClasses: Record<CardVariant, string> = {
      default: 'bg-white border border-gray-200 rounded-lg',
      bordered: 'bg-white border-2 border-gray-300 rounded-lg',
      elevated: 'bg-white rounded-lg shadow-md',
      flat: 'bg-gray-50 rounded-lg',
    };

    // Padding
    const paddingClasses: Record<typeof padding, string> = {
      none: '',
      sm: 'p-3',
      md: 'p-4',
      lg: 'p-6',
    };

    const cardClasses = `
      ${variantClasses[variant]}
      ${paddingClasses[padding]}
      ${className}
    `.trim().replace(/\s+/g, ' ');

    return (
      <div className={cardClasses} {...props}>
        {children}
      </div>
    );
  }

  /**
   * Card.Header - Componente para cabeçalho do card
   */
  Card.Header = function CardHeader({
    className = '',
    children,
    ...props
  }: React.HTMLAttributes<HTMLDivElement>) {
    return (
      <div className={`mb-4 ${className}`} {...props}>
        {children}
      </div>
    );
  };

  /**
   * Card.Title - Componente para título do card
   */
  Card.Title = function CardTitle({
    className = '',
    children,
    ...props
  }: React.HTMLAttributes<HTMLHeadingElement>) {
    return (
      <h3 className={`text-xl font-bold text-gray-900 ${className}`} {...props}>
        {children}
      </h3>
    );
  };

  /**
   * Card.Description - Componente para descrição do card
   */
  Card.Description = function CardDescription({
    className = '',
    children,
    ...props
  }: React.HTMLAttributes<HTMLParagraphElement>) {
    return (
      <p className={`text-sm text-gray-600 ${className}`} {...props}>
        {children}
      </p>
    );
  };