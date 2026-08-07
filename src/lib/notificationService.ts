// Push notification service for MKV SAT+
import { supabase } from './supabase';

const VAPID_PUBLIC_KEY = 'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjZJkHgTQbUSM8APwGDRIXBU9kiOM';

class NotificationService {
  private registration: ServiceWorkerRegistration | null = null;

  async init(): Promise<boolean> {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      console.log('Push notifications not supported');
      return false;
    }

    try {
      this.registration = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
      console.log('SW registered:', this.registration.scope);
      return true;
    } catch (e) {
      console.error('SW registration failed:', e);
      return false;
    }
  }

  async requestPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) return 'denied';
    if (Notification.permission === 'granted') return 'granted';
    return await Notification.requestPermission();
  }

  async subscribe(): Promise<boolean> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Connexion requise');

    const permission = await this.requestPermission();
    if (permission !== 'granted') return false;

    if (!this.registration) {
      await this.init();
    }
    if (!this.registration) return false;

    try {
      const sub = await this.registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });

      const subJson = sub.toJSON();
      
      // Save subscription to backend
      const { error } = await supabase.from('push_subscriptions').upsert({
        user_id: user.id,
        endpoint: sub.endpoint,
        p256dh: (subJson.keys as Record<string, string>)?.p256dh || '',
        auth: (subJson.keys as Record<string, string>)?.auth || '',
      }, { onConflict: 'endpoint' });

      if (error) console.error('Save subscription error:', error);
      return true;
    } catch (e) {
      console.error('Subscribe error:', e);
      return false;
    }
  }

  async unsubscribe(): Promise<void> {
    if (!this.registration) return;
    
    const sub = await this.registration.pushManager.getSubscription();
    if (sub) {
      await supabase.from('push_subscriptions').delete().eq('endpoint', sub.endpoint);
      await sub.unsubscribe();
    }
  }

  async isSubscribed(): Promise<boolean> {
    if (!this.registration) return false;
    const sub = await this.registration.pushManager.getSubscription();
    return !!sub;
  }

  // Show local notification (for immediate feedback)
  async showLocal(title: string, body: string, url = '/'): Promise<void> {
    if (!this.registration || Notification.permission !== 'granted') return;
    await this.registration.showNotification(title, {
      body,
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      data: { url },
      tag: 'mkv-local',
    });
  }

  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    return Uint8Array.from([...rawData].map(c => c.charCodeAt(0)));
  }
}

export const notificationService = new NotificationService();

// Initialize SW on import
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  notificationService.init().catch(console.error);
}
