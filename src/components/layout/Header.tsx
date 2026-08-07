import { Menu, Share2, MoreVertical, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface HeaderProps {
  title: string;
  onMenuClick?: () => void;
  onBackClick?: () => void;
  showBack?: boolean;
}

export function Header({ title, onMenuClick, onBackClick, showBack = false }: HeaderProps) {
  return (
    <header className="sticky top-0 z-50 bg-gray-700 shadow-lg">
      <div className="flex items-center justify-between px-3 py-2.5">
        <div className="flex items-center gap-3">
          {showBack ? (
            <Button
              variant="ghost"
              size="icon"
              onClick={onBackClick}
              className="text-primary-foreground hover:bg-secondary/80"
            >
              <ArrowLeft className="h-6 w-6" />
            </Button>
          ) : (
            <>
              <Button
                variant="ghost"
                size="icon"
                onClick={onMenuClick}
                className="text-yellow-500 hover:bg-gray-600 h-9 w-9"
              >
                <Menu className="h-5 w-5" />
              </Button>
            </>
          )}
          <h1 className="text-base md:text-xl font-bold text-white uppercase tracking-wide truncate">
            {showBack ? title : 'MKV SAT+'}
          </h1>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="text-yellow-500 hover:bg-gray-600 h-9 w-9"
          >
            <Share2 className="h-5 w-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-gray-600 h-9 w-9"
          >
            <MoreVertical className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </header>
  );
}
