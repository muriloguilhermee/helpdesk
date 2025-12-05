import { Link } from 'react-router-dom';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
}

export default function Logo({ size = 'md', showText = false }: LogoProps) {
  const sizeClasses = {
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-3xl',
  };

  return (
    <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
      <div className={`flex items-center ${sizeClasses[size]}`}>
        {/* EVA - cinza claro, bold, itálico */}
        <span className="font-bold text-gray-400 dark:text-gray-500 italic tracking-tight">
          EVA
        </span>
        {/* cloudd - azul vibrante, bold, minúsculas */}
        <span className="font-bold text-primary-600 dark:text-primary-400 lowercase ml-1">
          cloudd
        </span>
      </div>
      {showText && (
        <span className="text-sm text-gray-600 dark:text-gray-400 ml-2 hidden md:inline">
          Helpdesk
        </span>
      )}
    </Link>
  );
}

