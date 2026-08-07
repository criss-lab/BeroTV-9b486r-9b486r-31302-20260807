import { Header } from '@/components/layout/Header';
import { Phone, Mail, Globe, Youtube, Facebook, Send, Instagram } from 'lucide-react';

interface ContactPageProps {
  onBack: () => void;
}

export function ContactPage({ onBack }: ContactPageProps) {
  return (
    <div className="min-h-screen bg-background">
      <Header title="CONTACTEZ-NOUS" onBackClick={onBack} showBack />

      <div className="p-8 max-w-2xl mx-auto">
        <div className="bg-card rounded-3xl p-8 mb-8 shadow-xl">
          <div className="w-56 h-56 mx-auto mb-6">
            <img
              src="https://cdn-ai.onspace.ai/onspace/files/BVZmK6t8Khs4L6jZx5ZqrY/IMG-20251227-WA0007.jpg"
              alt="MKV SAT+ LE MONDE DANS LA POCHE Logo"
              className="w-full h-full object-contain drop-shadow-2xl"
            />
          </div>
          <p className="text-center text-muted-foreground font-medium text-lg">
            MKV SAT+ LE MONDE DANS LA POCHE, Votre Plateforme de Streaming!
          </p>
        </div>

        <div className="bg-card rounded-3xl p-8 shadow-xl">
          <h3 className="text-2xl font-bold text-primary mb-6">Nos Contacts</h3>
          
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
                <Phone className="h-6 w-6 text-secondary-foreground" />
              </div>
              <a
                href="tel:+243835412718"
                className="text-lg font-medium text-accent hover:underline"
              >
                +243 835 412 718
              </a>
            </div>

            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
                <Mail className="h-6 w-6 text-secondary-foreground" />
              </div>
              <a
                href="mailto:kembavodomaurice@gmail.com"
                className="text-lg font-medium text-foreground hover:underline break-all"
              >
                kembavodomaurice@gmail.com
              </a>
            </div>

            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
                <Globe className="h-6 w-6 text-secondary-foreground" />
              </div>
              <a
                href="https://mkvsat.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-lg font-medium text-foreground hover:underline"
              >
                https://mkvsat.com
              </a>
            </div>

            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
                <Youtube className="h-6 w-6 text-secondary-foreground" />
              </div>
              <span className="text-lg font-medium text-secondary">
                Suivez Nous sur Youtube
              </span>
            </div>

            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
                <Facebook className="h-6 w-6 text-secondary-foreground" />
              </div>
              <span className="text-lg font-medium text-primary">
                Rejoinez nous sur Facebook
              </span>
            </div>

            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
                <Send className="h-6 w-6 text-secondary-foreground" />
              </div>
              <span className="text-lg font-medium text-accent">
                Rejoinez Telegram Channel
              </span>
            </div>

            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
                <Instagram className="h-6 w-6 text-secondary-foreground" />
              </div>
              <span className="text-lg font-medium text-primary">
                Rejoinez-nous sur Instagram
              </span>
            </div>
          </div>

          <div className="mt-8 pt-8 border-t border-border flex items-center gap-3">
            <div className="text-2xl">©</div>
            <p className="text-sm text-muted-foreground">
              Tous droits réservés: MKV SAT+ 2024
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
