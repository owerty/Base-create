---
category: Placement
---
A torch (or any torch-shaped light via `block`) inside a `<Structure>`. `on` is where the supporting block is: `"floor"` (default) or the wall's direction from the torch (`"north"` = the wall is north of the torch). The supporting block must exist.

```tsx
<Torch at={[5, 3, 1]} on="north" />
<Torch at={[3, 1, 3]} />
```
