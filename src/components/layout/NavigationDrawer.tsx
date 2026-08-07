import { X, Tv, Radio, Monitor, Shield, Globe, Mail, AlertTriangle, Shapes } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface NavigationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (page: string) => void;
}

export function NavigationDrawer({ isOpen, onClose, onNavigate }: NavigationDrawerProps) {
  const menuItems = [
    { id: 'divers', label: 'DIVERS', icon: Shapes },
    { id: 'radios', label: 'RADIOS', icon: Radio },
    { id: 'tv', label: 'MKV SAT+ TV', icon: Tv },
    { id: 'privacy', label: 'PRIVACY', icon: Shield },
    { id: 'language', label: 'CHANGE LANGUAGE', icon: Globe },
    { id: 'contact', label: 'CONTACT-US', icon: Mail },
    { id: 'report', label: 'REPORT A PROBLEM', icon: AlertTriangle },
  ];

  const handleNavigate = (page: string) => {
    onNavigate(page);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity"
        onClick={onClose}
      />
      <div className="fixed left-0 top-0 bottom-0 w-80 bg-dark-purple z-50 shadow-2xl overflow-y-auto">
        <div className="relative p-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="absolute right-4 top-4 text-foreground hover:bg-muted"
          >
            <X className="h-6 w-6" />
          </Button>
          
          <div className="flex flex-col items-center mb-8 mt-4">
            <div className="w-40 h-40 mb-4">
              <img
                src="https://cdn-ai.onspace.ai/onspace/files/BVZmK6t8Khs4L6jZx5ZqrY/IMG-20251227-WA0007.jpg"
                alt="MKV SAT+ LE MONDE DANS LA POCHE Logo"
                className="w-full h-full object-contain drop-shadow-xl"
              />
            </div>
            <p className="text-xs text-muted-foreground uppercase tracking-widest">LE MONDE DANS LA POCHE</p>
          </div>

          <div className="space-y-2">
            {menuItems.map((item, index) => {
              const Icon = item.icon;
              return (
                <div key={item.id}>
                  <Button
                    onClick={() => handleNavigate(item.id)}
                    className="w-full justify-start gap-4 bg-primary hover:bg-primary/80 text-primary-foreground py-6 rounded-xl font-semibold text-base transition-all hover:scale-105"
                  >
                    <Icon className="h-6 w-6 text-accent" />
                    {item.label}
                  </Button>
                  {(index === 2 || index === 5) && (
                    <div className="h-1 bg-secondary my-3 rounded-full" />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}
