import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { LANGUAGES } from '@/constants/languages';
import { useToast } from '@/hooks/use-toast';

interface LanguagePageProps {
  onBack: () => void;
}

export function LanguagePage({ onBack }: LanguagePageProps) {
  const { toast } = useToast();

  const handleLanguageSelect = (language: string) => {
    toast({
      title: 'Language Changed',
      description: `Switched to ${language}`,
    });
  };

  return (
    <div className="min-h-screen bg-purple-gradient">
      <Header title="LANGUAGE" onBackClick={onBack} showBack />

      <div className="p-8 max-w-2xl mx-auto">
        <div className="space-y-4">
          {LANGUAGES.map((lang) => (
            <Button
              key={lang.code}
              onClick={() => handleLanguageSelect(lang.name)}
              className="w-full bg-foreground hover:bg-foreground/90 text-primary font-bold text-xl py-8 rounded-full shadow-xl hover:scale-105 transition-transform"
            >
              {lang.nativeName}
            </Button>
          ))}
        </div>

        <div className="mt-8 p-4 bg-muted/50 rounded-2xl flex items-center gap-3">
          <div className="text-2xl">📧</div>
          <p className="text-sm text-foreground font-medium">
            Vous voulez changer de Langue !!!
          </p>
        </div>
      </div>
    </div>
  );
}
