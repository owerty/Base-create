---
category: Catalog
---
A searchable grid of every GTNH 2.9 building block the library knows (6,360 variants), with texture, display name and the `block=` reference; clicking an entry copies its reference. Standalone - it does not go inside a `<Structure>`. Filter with `tags` (all must match), `shape` (`"cube" | "slab" | "stairs" | "pillar" | "pane" | "wall" | "fence" | "fencegate" | "door" | "trapdoor" | "carpet" | "torch" | "ladder"`), an initial `query`, and `limit` (default 240).

```tsx
<Palette query="marble" limit={24} />
<Palette shape="stairs" />
```
