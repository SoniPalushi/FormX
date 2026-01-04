/**
 * Responsive Styles System
 * Handles device-specific CSS and styles
 */

import type { ResponsiveCss, ResponsiveStyle } from '../../stores/types/formEngine';

export type DeviceType = 'mobile' | 'tablet' | 'desktop' | 'any';

export class ResponsiveStyleResolver {
  /**
   * Get CSS for current device
   */
  static getCss(
    css: ResponsiveCss | undefined,
    device: DeviceType = 'desktop'
  ): Record<string, string> {
    if (!css) return {};

    // Priority: device-specific > any
    return css[device] || css.any || {};
  }

  /**
   * Get inline styles for current device
   */
  static getStyle(
    style: ResponsiveStyle | undefined,
    device: DeviceType = 'desktop'
  ): React.CSSProperties {
    if (!style) return {};

    // Priority: device-specific > any
    return style[device] || style.any || {};
  }

  /**
   * Merge CSS strings
   */
  static mergeCss(...cssObjects: Array<Record<string, string>>): string {
    return cssObjects
      .filter(Boolean)
      .map((css) => {
        return Object.entries(css)
          .map(([key, value]) => {
            // Convert camelCase to kebab-case
            const kebabKey = key.replace(/([A-Z])/g, '-$1').toLowerCase();
            return `${kebabKey}: ${value};`;
          })
          .join(' ');
      })
      .join(' ');
  }

  /**
   * Convert CSS object to string
   */
  static cssToString(css: Record<string, string>): string {
    return Object.entries(css)
      .map(([key, value]) => {
        const kebabKey = key.replace(/([A-Z])/g, '-$1').toLowerCase();
        return `${kebabKey}: ${value};`;
      })
      .join(' ');
  }

  /**
   * Get combined CSS for component and wrapper
   */
  static getCombinedCss(
    css: ResponsiveCss | undefined,
    wrapperCss: ResponsiveCss | undefined,
    device: DeviceType = 'desktop'
  ): { component: string; wrapper: string } {
    return {
      component: this.cssToString(this.getCss(css, device)),
      wrapper: this.cssToString(this.getCss(wrapperCss, device)),
    };
  }

  /**
   * Get combined styles for component and wrapper
   */
  static getCombinedStyle(
    style: ResponsiveStyle | undefined,
    wrapperStyle: ResponsiveStyle | undefined,
    device: DeviceType = 'desktop'
  ): { component: React.CSSProperties; wrapper: React.CSSProperties } {
    return {
      component: this.getStyle(style, device),
      wrapper: this.getStyle(wrapperStyle, device),
    };
  }
}

