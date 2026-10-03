export class NotificationService {
  private static permissionGranted = false;

  /**
   * Request system notification permission if needed
   */
  static async requestPermission(): Promise<boolean> {
    if (typeof window === 'undefined') return false;

    // Electron handles notifications natively without prompt
    if ((window as any).toiloki?.notification) {
      this.permissionGranted = true;
      return true;
    }

    if ('Notification' in window) {
      if (Notification.permission === 'granted') {
        this.permissionGranted = true;
        return true;
      }
      if (Notification.permission !== 'denied') {
        const status = await Notification.requestPermission();
        this.permissionGranted = status === 'granted';
        return this.permissionGranted;
      }
    }
    return false;
  }

  /**
   * Dispatch a local desktop notification for long-running batches and operations
   */
  static async notify(title: string, options?: { body?: string; icon?: string }): Promise<void> {
    if (typeof window === 'undefined') return;

    // Check if Electron bridge has native notification handler
    const toiloki = (window as any).toiloki;
    if (toiloki?.notification?.send) {
      toiloki.notification.send(title, options);
      return;
    }

    // Standard HTML5 desktop notification
    if ('Notification' in window) {
      if (Notification.permission === 'granted') {
        new Notification(title, {
          body: options?.body,
          icon: options?.icon || '/icon.png',
          silent: false,
        });
      } else if (Notification.permission !== 'denied') {
        const granted = await this.requestPermission();
        if (granted) {
          new Notification(title, {
            body: options?.body,
            icon: options?.icon || '/icon.png',
          });
        }
      }
    }
  }

  /**
   * Update Windows taskbar progress bar
   * @param progress Value from 0.0 to 1.0, or -1 to reset/clear
   */
  static setTaskbarProgress(progress: number): void {
    if (typeof window === 'undefined') return;

    const toiloki = (window as any).toiloki;
    if (toiloki?.windowControls?.setProgress) {
      toiloki.windowControls.setProgress(progress);
    }
  }

  /**
   * Flash or highlight taskbar button to draw user attention to completed process
   */
  static flashFrame(): void {
    if (typeof window === 'undefined') return;

    const toiloki = (window as any).toiloki;
    if (toiloki?.windowControls?.flashFrame) {
      toiloki.windowControls.flashFrame(true);
    }
  }
}
