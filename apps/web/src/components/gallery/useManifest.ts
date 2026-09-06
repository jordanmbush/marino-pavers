import { useEffect, useState } from "react";
import type { ReadyMediaItem } from "@marino/domain";
import { fetchManifestItems } from "@/services/media";

/**
 * The live library. Starts from whatever the page pre-rendered, then swaps
 * in the current manifest once it arrives so a photo uploaded an hour ago
 * shows without a deploy. A failed fetch keeps the pre-rendered set.
 */
export const useManifest = (initial: ReadyMediaItem[]): ReadyMediaItem[] => {
  const [items, setItems] = useState(initial);

  useEffect(() => {
    let cancelled = false;
    void fetchManifestItems().then((live) => {
      if (!cancelled && live) setItems(live);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return items;
};
