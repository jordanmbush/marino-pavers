import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  moveItem,
  sortItems,
  type EditableItem,
  type MediaItem,
} from "@marino/domain";
import { getIdToken } from "@/services/auth";
import { createAdminClient } from "@/services/media";

const POLL_MS = 3000;
const POLL_LIMIT = 40;

/**
 * The item list and every action on it. While anything is still `pending`
 * (the processor hasn't finished) the list re-polls so the thumbnail appears
 * on its own, up to two minutes.
 */
export const useLibrary = (onAuthLost: () => void) => {
  const client = useMemo(() => createAdminClient(getIdToken), []);
  const [items, setItems] = useState<MediaItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const polls = useRef(0);

  const fail = useCallback(
    (cause: unknown) => {
      const message =
        cause instanceof Error ? cause.message : "Something went wrong.";
      if (
        cause instanceof Error &&
        cause.name === "ApiFailure" &&
        message.includes("Sign in")
      ) {
        onAuthLost();
        return;
      }
      setError(message);
    },
    [onAuthLost],
  );

  const refresh = useCallback(async () => {
    try {
      setItems(sortItems(await client.listItems()));
      setError(null);
    } catch (cause) {
      fail(cause);
    }
  }, [client, fail]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const pending = items?.some((item) => item.status === "pending") ?? false;
  useEffect(() => {
    if (!pending) {
      polls.current = 0;
      return undefined;
    }
    if (polls.current >= POLL_LIMIT) return undefined;
    const timer = window.setTimeout(() => {
      polls.current += 1;
      void refresh();
    }, POLL_MS);
    return () => window.clearTimeout(timer);
  }, [pending, items, refresh]);

  /** Resolves true once the change is stored; false means it wasn't, and `error` says why. */
  const update = useCallback(
    async (id: string, patch: EditableItem): Promise<boolean> => {
      try {
        const saved = await client.updateItem(id, patch);
        setItems((current) =>
          current
            ? sortItems(current.map((item) => (item.id === id ? saved : item)))
            : current,
        );
        return true;
      } catch (cause) {
        fail(cause);
        return false;
      }
    },
    [client, fail],
  );

  const move = useCallback(
    async (id: string, delta: -1 | 1) => {
      if (!items) return;
      const orders = moveItem(items, id, delta);
      const byId = new Map(orders.map((o) => [o.id, o.order]));
      setItems(
        sortItems(
          items.map((item) => ({
            ...item,
            order: byId.get(item.id) ?? item.order,
          })),
        ),
      );
      try {
        await client.reorder(orders);
      } catch (cause) {
        fail(cause);
        void refresh();
      }
    },
    [client, fail, items, refresh],
  );

  const remove = useCallback(
    async (id: string) => {
      try {
        await client.deleteItem(id);
        setItems(
          (current) => current?.filter((item) => item.id !== id) ?? current,
        );
      } catch (cause) {
        fail(cause);
      }
    },
    [client, fail],
  );

  return { client, items, error, refresh, update, move, remove };
};
