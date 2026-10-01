// Minimal big-endian NBT encoder/decoder (Minecraft Java, 1.7.10 tag set).
// Values are plain JS for compounds (objects) and strings; every other tag
// is wrapped so its exact type survives: byte(1), short(2), int(3), ...

export const TAG = {
  End: 0, Byte: 1, Short: 2, Int: 3, Long: 4, Float: 5, Double: 6,
  ByteArray: 7, String: 8, List: 9, Compound: 10, IntArray: 11,
};

const tagged = type => value => ({ __tag: type, value });
export const byte = tagged(TAG.Byte);
export const short = tagged(TAG.Short);
export const int = tagged(TAG.Int);
export const long = tagged(TAG.Long); // value: BigInt
export const float = tagged(TAG.Float);
export const double = tagged(TAG.Double);
export const byteArray = tagged(TAG.ByteArray); // value: Uint8Array | Int8Array
export const intArray = tagged(TAG.IntArray); // value: Int32Array | number[]
// list(elementType, items): items are raw values for the element type.
export const list = (elementType, items) => ({ __tag: TAG.List, elementType, value: items });

function typeOf(v) {
  if (v && typeof v === "object" && "__tag" in v) return v.__tag;
  if (typeof v === "string") return TAG.String;
  if (v && typeof v === "object") return TAG.Compound;
  throw new Error(`NBT: cannot infer tag type of ${v}`);
}

class Writer {
  constructor() { this.buf = new Uint8Array(1024); this.len = 0; }
  ensure(n) {
    if (this.len + n <= this.buf.length) return;
    let size = this.buf.length * 2;
    while (size < this.len + n) size *= 2;
    const next = new Uint8Array(size);
    next.set(this.buf.subarray(0, this.len));
    this.buf = next;
  }
  view(n) { this.ensure(n); const v = new DataView(this.buf.buffer, this.len, n); this.len += n; return v; }
  u8(x) { this.view(1).setInt8(0, x); }
  i16(x) { this.view(2).setInt16(0, x); }
  i32(x) { this.view(4).setInt32(0, x); }
  i64(x) { this.view(8).setBigInt64(0, BigInt(x)); }
  f32(x) { this.view(4).setFloat32(0, x); }
  f64(x) { this.view(8).setFloat64(0, x); }
  bytes(arr) { this.ensure(arr.length); this.buf.set(arr, this.len); this.len += arr.length; }
  str(s) { const b = new TextEncoder().encode(s); this.view(2).setUint16(0, b.length); this.bytes(b); }

  payload(type, v) {
    const raw = v && typeof v === "object" && "__tag" in v ? v.value : v;
    switch (type) {
      case TAG.Byte: return this.u8(raw);
      case TAG.Short: return this.i16(raw);
      case TAG.Int: return this.i32(raw);
      case TAG.Long: return this.i64(raw);
      case TAG.Float: return this.f32(raw);
      case TAG.Double: return this.f64(raw);
      case TAG.ByteArray:
        this.i32(raw.length);
        return this.bytes(new Uint8Array(raw.buffer ?? raw, raw.byteOffset ?? 0, raw.length));
      case TAG.String: return this.str(raw);
      case TAG.List:
        this.u8(v.elementType);
        this.i32(raw.length);
        for (const item of raw) this.payload(v.elementType, item);
        return;
      case TAG.Compound:
        for (const [k, child] of Object.entries(raw)) {
          const t = typeOf(child);
          this.u8(t); this.str(k); this.payload(t, child);
        }
        return this.u8(TAG.End);
      case TAG.IntArray:
        this.i32(raw.length);
        for (const x of raw) this.i32(x);
        return;
      default: throw new Error(`NBT: bad tag type ${type}`);
    }
  }
}

// Encode a named root compound. Returns uncompressed bytes.
export function encode(rootName, compound) {
  const w = new Writer();
  w.u8(TAG.Compound); w.str(rootName); w.payload(TAG.Compound, compound);
  return w.buf.slice(0, w.len);
}

// Decode uncompressed NBT. Returns { name, value } with the same wrapped
// representation encode() takes, so decode(encode(x)) round-trips.
export function decode(bytes) {
  const dv = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let p = 0;
  const str = () => {
    const n = dv.getUint16(p); p += 2;
    const s = new TextDecoder().decode(bytes.subarray(p, p + n)); p += n; return s;
  };
  const read = type => {
    switch (type) {
      case TAG.Byte: return byte(dv.getInt8(p++));
      case TAG.Short: { const v = dv.getInt16(p); p += 2; return short(v); }
      case TAG.Int: { const v = dv.getInt32(p); p += 4; return int(v); }
      case TAG.Long: { const v = dv.getBigInt64(p); p += 8; return long(v); }
      case TAG.Float: { const v = dv.getFloat32(p); p += 4; return float(v); }
      case TAG.Double: { const v = dv.getFloat64(p); p += 8; return double(v); }
      case TAG.ByteArray: {
        const n = dv.getInt32(p); p += 4;
        const v = new Int8Array(bytes.buffer, bytes.byteOffset + p, n).slice(); p += n; return byteArray(v);
      }
      case TAG.String: return str();
      case TAG.List: {
        const et = dv.getInt8(p++); const n = dv.getInt32(p); p += 4;
        const items = [];
        for (let i = 0; i < n; i++) {
          const item = read(et);
          items.push(item && typeof item === "object" && "__tag" in item ? item.value : item);
        }
        return list(et, items);
      }
      case TAG.Compound: {
        const out = {};
        for (;;) {
          const t = dv.getInt8(p++);
          if (t === TAG.End) return out;
          const k = str(); out[k] = read(t);
        }
      }
      case TAG.IntArray: {
        const n = dv.getInt32(p); p += 4;
        const v = new Int32Array(n);
        for (let i = 0; i < n; i++) { v[i] = dv.getInt32(p); p += 4; }
        return intArray(v);
      }
      default: throw new Error(`NBT: bad tag type ${type} at ${p - 1}`);
    }
  };
  const rootType = dv.getInt8(p++);
  if (rootType !== TAG.Compound) throw new Error("NBT: root is not a compound");
  const name = str();
  return { name, value: read(TAG.Compound) };
}
