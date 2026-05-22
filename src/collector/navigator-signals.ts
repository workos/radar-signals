/**
 * Collects navigator, screen, device, and permission signals.
 */

import type { Screen } from '../types';

export type NavigatorSignals = {
  timezone?: string;
  language?: string;
  hardwareConcurrency?: number;
  webdriver?: boolean;
  userAgent?: string;
  appVersion?: string;
  platform?: string;
  screen: Screen;
  maxTouchPoints?: number;
  deviceMemory?: number;
  permissionsState?: PermissionState;
  notificationPermission?: NotificationPermission;
  devicePixelRatio?: number;
  pluginsLength?: number;
  mimeTypesCount?: number;
  documentHidden?: boolean;
  documentVisibilityState?: DocumentVisibilityState;
};

export async function collectNavigatorSignals(): Promise<NavigatorSignals> {
  const permissionsState =
    'permissions' in navigator
      ? await navigator.permissions
          .query({ name: 'notifications' })
          .then((r) => r.state)
          .catch(() => undefined)
      : undefined;

  return {
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    language: navigator.language,
    hardwareConcurrency: navigator.hardwareConcurrency,
    webdriver: navigator.webdriver,
    userAgent: navigator.userAgent,
    appVersion: navigator.appVersion,
    platform: navigator.platform,
    screen: {
      width: screen.width,
      height: screen.height,
      availWidth: screen.availWidth,
      availHeight: screen.availHeight,
      windowOuterWidth: window.outerWidth,
      windowOuterHeight: window.outerHeight,
      colorDepth: screen.colorDepth,
      pixelDepth: screen.pixelDepth,
    },
    maxTouchPoints: navigator.maxTouchPoints,
    deviceMemory:
      'deviceMemory' in navigator && typeof navigator.deviceMemory === 'number'
        ? navigator.deviceMemory
        : undefined,
    permissionsState,
    notificationPermission:
      'Notification' in window ? Notification.permission : undefined,
    devicePixelRatio: window.devicePixelRatio,
    pluginsLength: navigator.plugins.length,
    mimeTypesCount: Object.keys(navigator.mimeTypes).length,
    documentHidden: document.hidden,
    documentVisibilityState: document.visibilityState,
  };
}
