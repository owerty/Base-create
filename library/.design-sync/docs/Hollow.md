---
category: Placement
---
The shell of a box inside a `<Structure>`: four walls plus floor and ceiling, corners inclusive. `noFloor` / `noCeiling` drop those layers - the usual house pattern is a `Fill` foundation, then `<Hollow ... noFloor noCeiling>` for the walls, then a roof.

```tsx
<Hollow block="minecraft:planks@1" from={[0, 1, 0]} to={[10, 4, 8]} noFloor noCeiling />
```
