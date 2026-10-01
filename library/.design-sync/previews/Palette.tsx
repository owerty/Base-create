import { Palette } from "gtnh-blueprint";

/** Searching the catalog for marble variants. */
export function MarbleSearch() {
  return <Palette query="marble" limit={12} />;
}

/** Only stairs blocks. */
export function StairsOnly() {
  return <Palette shape="stairs" limit={12} />;
}
