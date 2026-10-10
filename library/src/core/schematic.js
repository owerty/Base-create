// Builds a Schematica "Alpha" schematic (the format GTNH's Schematica fork,
// 1.12.6-GTNH, reads in SchematicAlpha.readFromNBT).
//
// Block IDs in the file are local: SchematicaMapping maps each registry name
// to the ID used in Blocks, and Schematica remaps by name on load. So the
// file works in any world regardless of that world's numeric block IDs. We
// hand out local IDs 1..255 (0 = minecraft:air), which keeps every ID in the
// low byte; AddBlocks is written as all zeros, which both of Schematica's
// read paths (standard nibble array and "schematicplus" full byte array)
// accept.
//
// WorldEdit (worldedit-gtnh's SchematicReader) reads the same layout but takes
// block names from BlockMapping instead of SchematicaMapping, and reads
// AddBlocks as MCEdit nibbles (two blocks per byte). toNBT({ worldedit: true })
// writes BlockMapping too and leaves AddBlocks out (every local id fits in
// Blocks), so the file pastes with //schem load + //paste. TileEntities keep
// schematic-relative x/y/z, which both read. No WEOrigin/WEOffset: //paste
// puts the low north-west corner at your feet.
import { encode, decode, byte, short, int, byteArray, list, TAG } from "./nbt.js";
import { MULTIPART_BLOCK } from "./microblocks.js";

export class Structure {
  constructor(width, height, length) {
    this.width = width; this.height = height; this.length = length;
    const n = width * height * length;
    this.ids = new Uint8Array(n);
    this.meta = new Uint8Array(n);
    this.names = ["minecraft:air"]; // local id -> registry name
    this.idOf = new Map([["minecraft:air", 0]]);
    this.parts = new Map(); // index -> Forge Multipart parts (see microblocks.js)
    this.tiles = new Map(); // index -> other tile entity NBT (tagged values, without x/y/z), e.g. ArchitectureCraft shapes
  }

  index(x, y, z) {
    if (x < 0 || y < 0 || z < 0 || x >= this.width || y >= this.height || z >= this.length)
      throw new RangeError(`(${x},${y},${z}) outside ${this.width}x${this.height}x${this.length}`);
    return (y * this.length + z) * this.width + x;
  }

  localId(name) {
    if (!name.includes(":")) name = "minecraft:" + name;
    let id = this.idOf.get(name);
    if (id === undefined) {
      id = this.names.length;
      if (id > 255) throw new Error("more than 255 distinct block types in one schematic");
      this.names.push(name); this.idOf.set(name, id);
    }
    return id;
  }

  // block: { name, meta } or a bare registry name.
  set(x, y, z, block) {
    const { name, meta = 0 } = typeof block === "string" ? { name: block } : block;
    if (meta < 0 || meta > 15) throw new RangeError(`meta ${meta} for ${name}`);
    const i = this.index(x, y, z);
    this.ids[i] = this.localId(name);
    this.meta[i] = meta;
    this.parts.delete(i);
    this.tiles.delete(i);
  }

  // A block with its tile entity; `tile` is an NBT compound with an `id` (x/y/z are added on save).
  setTile(x, y, z, block, tile) {
    this.set(x, y, z, block);
    this.tiles.set(this.index(x, y, z), { ...tile });
  }

  getTile(x, y, z) {
    return this.tiles.get(this.index(x, y, z));
  }

  // Microblock parts ({ id, material, shape }) sharing one block space.
  setParts(x, y, z, parts) {
    this.set(x, y, z, MULTIPART_BLOCK);
    this.parts.set(this.index(x, y, z), parts.map(p => ({ ...p })));
  }

  getParts(x, y, z) {
    return this.parts.get(this.index(x, y, z)) ?? [];
  }

  get(x, y, z) {
    const i = this.index(x, y, z);
    return { name: this.names[this.ids[i]], meta: this.meta[i] };
  }

  fill([x0, y0, z0], [x1, y1, z1], block) {
    for (let y = Math.min(y0, y1); y <= Math.max(y0, y1); y++)
      for (let z = Math.min(z0, z1); z <= Math.max(z0, z1); z++)
        for (let x = Math.min(x0, x1); x <= Math.max(x0, x1); x++) this.set(x, y, z, block);
  }

  // Count of each { name, meta } in the structure, air excluded.
  materials() {
    const counts = new Map();
    for (let i = 0; i < this.ids.length; i++) {
      if (this.ids[i] === 0) continue;
      const key = `${this.names[this.ids[i]]}@${this.meta[i]}`;
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    return [...counts].sort((a, b) => b[1] - a[1]);
  }

  // Uncompressed NBT bytes. Gzip them before saving (Schematica falls back
  // to an uncompressed read, but gzip is what it writes and expects first).
  // worldedit: also readable by worldedit-gtnh (see the header).
  toNBT({ worldedit = false } = {}) {
    const mapping = {};
    this.names.forEach((name, id) => { mapping[name] = short(id); });
    return encode("Schematic", {
      Width: short(this.width),
      Height: short(this.height),
      Length: short(this.length),
      Materials: "Alpha",
      Blocks: byteArray(this.ids),
      Data: byteArray(this.meta),
      ...(worldedit ? {} : { AddBlocks: byteArray(new Uint8Array(this.ids.length)) }),
      SchematicaMapping: mapping,
      ...(worldedit ? { BlockMapping: mapping } : {}),
      Entities: list(TAG.Compound, []),
      TileEntities: list(TAG.Compound, [
        ...[...this.parts].map(([i, parts]) => ({
          id: "savedMultipart", ...this.xyz(i),
          parts: list(TAG.Compound, parts.map(p => ({ id: p.id, material: p.material, shape: byte(p.shape) }))),
        })),
        ...[...this.tiles].map(([i, tile]) => ({ ...tile, ...this.xyz(i) })),
      ]),
    });
  }

  xyz(i) {
    return { x: int(i % this.width), y: int(Math.floor(i / (this.width * this.length))), z: int(Math.floor(i / this.width) % this.length) };
  }

  // Parse uncompressed NBT written by toNBT() or by Schematica itself.
  static fromNBT(bytes) {
    const { value: s } = decode(bytes);
    const st = new Structure(s.Width.value, s.Height.value, s.Length.value);
    const byFileId = new Map();
    for (const [name, id] of Object.entries(s.SchematicaMapping ?? s.BlockMapping ?? {})) byFileId.set(id.value, name);
    const blocks = s.Blocks.value, data = s.Data.value;
    const add = s.AddBlocks?.value;
    for (let i = 0; i < blocks.length; i++) {
      let id = blocks[i] & 0xff;
      if (add && add.length === blocks.length) id |= (add[i] & 0xff) << 8;
      else if (add && add.length) id |= ((add[i >> 1] >> ((i & 1) ? 0 : 4)) & 0xf) << 8;
      if (id === 0) continue;
      const name = byFileId.get(id) ?? `#${id}`;
      const x = i % st.width, z = Math.floor(i / st.width) % st.length, y = Math.floor(i / (st.width * st.length));
      st.set(x, y, z, { name, meta: data[i] & 0xf });
    }
    for (const te of s.TileEntities?.value ?? []) {
      if (te.id !== "savedMultipart") {
        const { x, y, z, ...tile } = te;
        if (x && y && z && st.ids[st.index(x.value, y.value, z.value)] !== 0) st.tiles.set(st.index(x.value, y.value, z.value), tile);
        continue;
      }
      const parts = te.parts.value.map(p => ({ id: p.id, material: p.material, shape: p.shape.value & 0xff }));
      st.parts.set(st.index(te.x.value, te.y.value, te.z.value), parts);
    }
    return st;
  }
}
