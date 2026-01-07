/**
 * RemoteArray System
 * Provides pagination, lazy loading, filtering, sorting, and caching for remote data
 */

import type { RemoteArrayOptions } from '../../stores/types';

export interface RemoteArrayEvents {
  onPageChange?: (pageIndex: number) => void;
  onDataLoaded?: (data: any[]) => void;
  onFilterChange?: (filterData: any) => void;
  onSortChange?: (sortData: Array<{ field: string; direction: 'asc' | 'desc' }>) => void;
  onError?: (error: Error) => void;
}

export class RemoteArray {
  recordsPerPage: number;
  currentPageIndex: number;
  totalPages: number;
  totalRecords: number;
  currentPage: any[];
  loadedPagesCount: number;
  isBusy: boolean;

  private fetchPromise: RemoteArrayOptions['fetchPromise'];
  private threshold: number;
  private filterData?: any;
  private sortData?: Array<{ field: string; direction: 'asc' | 'desc' }>;
  private loadedPages: Map<number, any[]>; // Cache of loaded pages
  private events: RemoteArrayEvents;

  constructor(options: RemoteArrayOptions, events?: RemoteArrayEvents) {
    this.recordsPerPage = options.recordsPerPage;
    this.fetchPromise = options.fetchPromise;
    this.threshold = options.threshold || 5;
    this.filterData = options.filterData;
    this.sortData = options.sortData;
    this.events = events || {};

    // Initialize state
    this.currentPageIndex = 0;
    this.totalPages = 0;
    this.totalRecords = 0;
    this.currentPage = [];
    this.loadedPagesCount = 0;
    this.isBusy = false;
    this.loadedPages = new Map();

    // Auto-init if requested
    if (options.autoInit) {
      this.init().catch((error) => {
        console.error('Failed to auto-initialize RemoteArray:', error);
        this.events.onError?.(error);
      });
    }
  }

  /**
   * Initialize and load first page
   */
  async init(): Promise<void> {
    if (this.isBusy) {
      return;
    }

    this.isBusy = true;
    this.loadedPages.clear();
    this.currentPageIndex = 0;

    try {
      await this.loadPage(0);
    } catch (error) {
      this.events.onError?.(error instanceof Error ? error : new Error(String(error)));
      throw error;
    } finally {
      this.isBusy = false;
    }
  }

  /**
   * Get data for current page or cumulative data
   */
  async getData(cumulative: boolean = false): Promise<any[]> {
    if (cumulative) {
      // Return all loaded pages combined
      const allData: any[] = [];
      for (let i = 0; i <= this.currentPageIndex; i++) {
        if (!this.loadedPages.has(i)) {
          await this.loadPage(i);
        }
        const pageData = this.loadedPages.get(i) || [];
        allData.push(...pageData);
      }
      return allData;
    } else {
      // Return current page only
      if (!this.loadedPages.has(this.currentPageIndex)) {
        await this.loadPage(this.currentPageIndex);
      }
      return this.loadedPages.get(this.currentPageIndex) || [];
    }
  }

  /**
   * Load next page
   */
  async nextPage(): Promise<void> {
    if (this.currentPageIndex < this.totalPages - 1) {
      await this.goToPage(this.currentPageIndex + 1);
    }
  }

  /**
   * Load previous page
   */
  async previousPage(): Promise<void> {
    if (this.currentPageIndex > 0) {
      await this.goToPage(this.currentPageIndex - 1);
    }
  }

  /**
   * Go to specific page
   */
  async goToPage(index: number): Promise<void> {
    if (index < 0 || index >= this.totalPages) {
      return;
    }

    if (this.isBusy && index !== this.currentPageIndex) {
      return;
    }

    this.currentPageIndex = index;

    // Load page if not already loaded
    if (!this.loadedPages.has(index)) {
      await this.loadPage(index);
    } else {
      this.currentPage = this.loadedPages.get(index) || [];
      this.events.onPageChange?.(this.currentPageIndex);
      this.events.onDataLoaded?.(this.currentPage);
    }

    // Preload next page if threshold is reached
    if (this.currentPage.length - this.threshold <= 0 && index < this.totalPages - 1) {
      this.loadPage(index + 1).catch((error) => {
        console.warn('Failed to preload next page:', error);
      });
    }
  }

  /**
   * Apply filter and reload data
   */
  async filter(filterData: any): Promise<void> {
    this.filterData = filterData;
    this.loadedPages.clear();
    this.currentPageIndex = 0;
    await this.loadPage(0);
    this.events.onFilterChange?.(filterData);
  }

  /**
   * Apply sort and reload data
   */
  async sort(sortData: Array<{ field: string; direction: 'asc' | 'desc' }>): Promise<void> {
    this.sortData = sortData;
    this.loadedPages.clear();
    this.currentPageIndex = 0;
    await this.loadPage(0);
    this.events.onSortChange?.(sortData);
  }

  /**
   * Reset to initial state
   */
  reset(): void {
    this.currentPageIndex = 0;
    this.currentPage = [];
    this.loadedPages.clear();
    this.loadedPagesCount = 0;
    this.totalPages = 0;
    this.totalRecords = 0;
    this.filterData = undefined;
    this.sortData = undefined;
  }

  /**
   * Clear all data
   */
  clear(): void {
    this.reset();
  }

  /**
   * Load a specific page
   */
  private async loadPage(pageIndex: number): Promise<void> {
    if (this.isBusy && pageIndex !== this.currentPageIndex) {
      return;
    }

    // Check cache first
    if (this.loadedPages.has(pageIndex)) {
      this.currentPage = this.loadedPages.get(pageIndex) || [];
      return;
    }

    this.isBusy = true;

    try {
      const result = await this.fetchPromise({
        startPage: pageIndex,
        recordsPerPage: this.recordsPerPage,
        filterData: this.filterData,
        sortData: this.sortData,
      });

      // Update state
      this.totalRecords = result.totalRecords;
      this.totalPages = result.totalPages || Math.ceil(result.totalRecords / this.recordsPerPage);
      this.currentPage = result.data || [];
      this.loadedPages.set(pageIndex, this.currentPage);
      this.loadedPagesCount = this.loadedPages.size;

      // Update current page index if this is the page we're viewing
      if (pageIndex === this.currentPageIndex) {
        this.events.onPageChange?.(this.currentPageIndex);
        this.events.onDataLoaded?.(this.currentPage);
      }
    } catch (error) {
      this.events.onError?.(error instanceof Error ? error : new Error(String(error)));
      throw error;
    } finally {
      this.isBusy = false;
    }
  }

  /**
   * Check if has next page
   */
  hasNextPage(): boolean {
    return this.currentPageIndex < this.totalPages - 1;
  }

  /**
   * Check if has previous page
   */
  hasPreviousPage(): boolean {
    return this.currentPageIndex > 0;
  }

  /**
   * Get all loaded data (all cached pages)
   */
  getAllLoadedData(): any[] {
    const allData: any[] = [];
    const sortedPages = Array.from(this.loadedPages.keys()).sort((a, b) => a - b);
    sortedPages.forEach((pageIndex) => {
      const pageData = this.loadedPages.get(pageIndex) || [];
      allData.push(...pageData);
    });
    return allData;
  }
}

