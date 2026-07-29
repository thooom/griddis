export type EventHandler<TPayload> = (payload: TPayload) => void;

export class EventBus<TEvents extends Record<string, unknown>> {
  private handlers = new Map<keyof TEvents, Set<EventHandler<unknown>>>();

  on<TKey extends keyof TEvents>(event: TKey, handler: EventHandler<TEvents[TKey]>): () => void {
    const eventHandlers = this.handlers.get(event) ?? new Set<EventHandler<unknown>>();
    eventHandlers.add(handler as EventHandler<unknown>);
    this.handlers.set(event, eventHandlers);

    return () => this.off(event, handler);
  }

  off<TKey extends keyof TEvents>(event: TKey, handler: EventHandler<TEvents[TKey]>): void {
    const eventHandlers = this.handlers.get(event);
    if (!eventHandlers) return;

    eventHandlers.delete(handler as EventHandler<unknown>);
    if (eventHandlers.size === 0) {
      this.handlers.delete(event);
    }
  }

  emit<TKey extends keyof TEvents>(event: TKey, payload: TEvents[TKey]): void {
    const eventHandlers = this.handlers.get(event);
    if (!eventHandlers) return;

    for (const handler of eventHandlers) {
      handler(payload);
    }
  }
}
