import { Filter } from "./types";

export class ModelEvents {
  /**
   * Event callbacks
   */
  public callbacks: Record<string, any[]> = {
    saving: [],
    saved: [],
    creating: [],
    created: [],
    updating: [],
    updated: [],
    deleting: [],
    deleted: [],
    fetching: [],
  };

  /**
   * {@inheritdoc}
   */
  public constructor(public collection?: string) {
    //
  }

  /**
   * Add callback when model is about to be created or updated
   *
   * Triggered before saving the model
   */
  public onSaving(callback: (model: any, oldModel?: any) => void) {
    this.callbacks.saving.push(callback);
    return this;
  }

  /**
   * Add callback when model is created or updated
   *
   * Triggered after saving the model
   */
  public onSaved(callback: (model: any, oldModel?: any) => void) {
    this.callbacks.saved.push(callback);

    return this;
  }

  /**
   * Add callback when model is about to be created
   */
  public onCreating(callback: (model: any) => void) {
    this.callbacks.creating.push(callback);

    return this;
  }

  /**
   * Add callback when model is created
   */
  public onCreated(callback: (model: any) => void) {
    this.callbacks.created.push(callback);

    return this;
  }

  /**
   * Add callback when model is about to be updated
   */
  public onUpdating(callback: (model: any, oldModel: any) => void) {
    this.callbacks.updating.push(callback);

    return this;
  }

  /**
   * Add callback when model is updated
   */
  public onUpdated(callback: (model: any, oldModel: any) => void) {
    this.callbacks.updated.push(callback);

    return this;
  }

  /**
   * Add callback when model is about to be deleted
   */
  public onDeleting(callback: (model: any) => void) {
    this.callbacks.deleting.push(callback);

    return this;
  }

  /**
   * Add callback when model is deleted
   */
  public onDeleted(callback: (model: any) => void) {
    this.callbacks.deleted.push(callback);

    return this;
  }

  /**
   * Add callback when model is about to be fetched
   */
  public onFetching(callback: (model: any, filterOptions: Filter) => void) {
    this.callbacks.fetching.push(callback);

    return this;
  }

  /**
   * Trigger the given event
   */
  public async trigger(event: string, ...args: any[]) {
    const callbacks = this.callbacks[event];

    if (!callbacks) return;

    for (const callback of callbacks) {
      await callback(...args);
    }
  }
}
