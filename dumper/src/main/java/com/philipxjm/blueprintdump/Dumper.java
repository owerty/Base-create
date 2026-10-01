package com.philipxjm.blueprintdump;

import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.IdentityHashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.TreeSet;
import java.util.zip.ZipEntry;
import java.util.zip.ZipOutputStream;

import javax.imageio.ImageIO;

import net.minecraft.block.Block;
import net.minecraft.block.BlockButton;
import net.minecraft.block.BlockCarpet;
import net.minecraft.block.BlockDoor;
import net.minecraft.block.BlockFence;
import net.minecraft.block.BlockFenceGate;
import net.minecraft.block.BlockLadder;
import net.minecraft.block.BlockLever;
import net.minecraft.block.BlockPane;
import net.minecraft.block.BlockRotatedPillar;
import net.minecraft.block.BlockSign;
import net.minecraft.block.BlockSlab;
import net.minecraft.block.BlockStairs;
import net.minecraft.block.BlockTorch;
import net.minecraft.block.BlockTrapDoor;
import net.minecraft.block.BlockWall;
import net.minecraft.block.material.Material;
import net.minecraft.client.Minecraft;
import net.minecraft.client.resources.IResource;
import net.minecraft.creativetab.CreativeTabs;
import net.minecraft.item.Item;
import net.minecraft.item.ItemStack;
import net.minecraft.util.IIcon;
import net.minecraft.util.ResourceLocation;

import com.google.gson.Gson;
import com.google.gson.GsonBuilder;

import cpw.mods.fml.common.Loader;
import cpw.mods.fml.common.ModContainer;
import cpw.mods.fml.common.registry.GameData;

/**
 * Walks the block registry and writes {@code blocks.json}, {@code mods.json},
 * the face textures and a list of textures it could not find into one zip.
 * Runs on the client thread (client commands do), which the icon and
 * resource lookups need.
 */
public class Dumper {

    public static class Result {

        public int blocks, variants, textures, missingTextures;
    }

    /** One placeable block + metadata, as the Blueprint library sees it. */
    static class Variant {

        String name; // registry name, e.g. minecraft:stone_brick_stairs
        int meta; // block metadata placed in the world
        int itemDamage; // damage of the item stack that places it
        String display;
        String family; // stairs, slab, pillar, door, pane, fence, wall, ...
        String blockClass;
        String material;
        String tab;
        int renderType;
        int renderPass; // 1 = translucent
        boolean opaque, normalCube, hasTileEntity;
        int light;
        String color; // item tint if not white (leaves, grass)
        double[] bounds; // minX, minY, minZ, maxX, maxY, maxZ
        String[] icons; // down, up, north, south, west, east
    }

    private static final Gson GSON = new GsonBuilder().disableHtmlEscaping()
        .create();

    private final Map<Material, String> materialNames = materialNames();

    public Result run(File out) throws Exception {
        Result r = new Result();
        List<Variant> variants = new ArrayList<>();
        Set<String> icons = new TreeSet<>();

        @SuppressWarnings("unchecked")
        Set<String> names = new TreeSet<>(
            (Set<String>) GameData.getBlockRegistry()
                .getKeys());
        for (String name : names) {
            Block block = GameData.getBlockRegistry()
                .getObject(name);
            if (block == null || name.equals("minecraft:air")) continue;
            r.blocks++;
            for (Variant v : variantsOf(name, block)) {
                variants.add(v);
                for (String ic : v.icons) if (ic != null) icons.add(ic);
            }
        }
        r.variants = variants.size();

        List<String> missing = new ArrayList<>();
        try (ZipOutputStream zip = new ZipOutputStream(new FileOutputStream(out))) {
            put(zip, "blocks.json", GSON.toJson(variants));
            put(zip, "mods.json", GSON.toJson(mods()));
            // Icon names map onto paths many-to-one ("dirt" and
            // "minecraft:dirt" are the same file), so write each path once.
            Set<String> written = new HashSet<>();
            for (String icon : icons) {
                if (!written.add(texturePath(icon))) continue;
                byte[] png = texture(icon);
                if (png == null) {
                    missing.add(icon);
                    continue;
                }
                zip.putNextEntry(new ZipEntry("textures/" + texturePath(icon)));
                zip.write(png);
                zip.closeEntry();
                r.textures++;
            }
            put(zip, "missing-textures.txt", String.join("\n", missing));
        }
        r.missingTextures = missing.size();
        return r;
    }

    private List<Variant> variantsOf(String name, Block block) {
        // Metadata variants come from the creative/NEI item list; the
        // ItemBlock maps each item damage to the meta it places.
        Map<Integer, Integer> metaToDamage = new LinkedHashMap<>();
        Map<Integer, String> displays = new LinkedHashMap<>();
        Item item = Item.getItemFromBlock(block);
        if (item != null) {
            List<ItemStack> stacks = new ArrayList<>();
            try {
                block.getSubBlocks(item, block.getCreativeTabToDisplayOn(), stacks);
            } catch (Throwable ignored) {}
            for (ItemStack s : stacks) {
                if (s == null || s.getItem() != item) continue;
                int damage = s.getItemDamage();
                int meta;
                try {
                    meta = item.getMetadata(damage);
                } catch (Throwable t) {
                    meta = damage;
                }
                if (meta < 0 || meta > 15 || metaToDamage.containsKey(meta)) continue;
                metaToDamage.put(meta, damage);
                String display;
                try {
                    display = s.getDisplayName();
                } catch (Throwable t) {
                    display = null;
                }
                displays.put(meta, display);
            }
        }
        if (metaToDamage.isEmpty()) {
            metaToDamage.put(0, 0);
            String display;
            try {
                display = block.getLocalizedName();
            } catch (Throwable t) {
                display = null;
            }
            displays.put(0, display);
        }

        List<Variant> out = new ArrayList<>();
        for (Map.Entry<Integer, Integer> e : metaToDamage.entrySet()) {
            int meta = e.getKey();
            Variant v = new Variant();
            v.name = name;
            v.meta = meta;
            v.itemDamage = e.getValue();
            v.display = displays.get(meta);
            v.family = family(block);
            v.blockClass = block.getClass()
                .getName();
            v.material = materialNames.getOrDefault(block.getMaterial(), "other");
            CreativeTabs tab = block.getCreativeTabToDisplayOn();
            v.tab = tab == null ? null : tab.getTabLabel();
            v.renderType = safeInt(block::getRenderType);
            v.renderPass = safeInt(block::getRenderBlockPass);
            v.opaque = block.isOpaqueCube();
            v.normalCube = block.isNormalCube();
            try {
                v.hasTileEntity = block.hasTileEntity(meta);
            } catch (Throwable t) {
                v.hasTileEntity = false;
            }
            v.light = block.getLightValue();
            try {
                int c = block.getRenderColor(meta) & 0xFFFFFF;
                if (c != 0xFFFFFF) v.color = String.format("#%06x", c);
            } catch (Throwable ignored) {}
            try {
                block.setBlockBoundsForItemRender();
                v.bounds = new double[] { block.getBlockBoundsMinX(), block.getBlockBoundsMinY(),
                    block.getBlockBoundsMinZ(), block.getBlockBoundsMaxX(), block.getBlockBoundsMaxY(),
                    block.getBlockBoundsMaxZ() };
            } catch (Throwable ignored) {}
            v.icons = new String[6];
            for (int side = 0; side < 6; side++) {
                try {
                    IIcon icon = block.getIcon(side, meta);
                    v.icons[side] = icon == null ? null : icon.getIconName();
                } catch (Throwable ignored) {}
            }
            out.add(v);
        }
        return out;
    }

    private static String family(Block b) {
        if (b instanceof BlockStairs) return "stairs";
        if (b instanceof BlockSlab) return "slab";
        if (b instanceof BlockRotatedPillar) return "pillar";
        if (b instanceof BlockDoor) return "door";
        if (b instanceof BlockTrapDoor) return "trapdoor";
        if (b instanceof BlockPane) return "pane";
        if (b instanceof BlockFenceGate) return "fencegate";
        if (b instanceof BlockFence) return "fence";
        if (b instanceof BlockWall) return "wall";
        if (b instanceof BlockTorch) return "torch";
        if (b instanceof BlockLadder) return "ladder";
        if (b instanceof BlockCarpet) return "carpet";
        if (b instanceof BlockButton) return "button";
        if (b instanceof BlockLever) return "lever";
        if (b instanceof BlockSign) return "sign";
        // Fall back on the vanilla render type for mod blocks that copy a
        // vanilla shape without extending its class.
        switch (safeInt(b::getRenderType)) {
            case 0:
                return b.isOpaqueCube() ? "cube" : "cube-transparent";
            case 10:
                return "stairs";
            case 31:
                return "pillar";
            case 7:
                return "door";
            case 18:
                return "pane";
            case 11:
                return "fence";
            case 32:
                return "wall";
            case 2:
                return "torch";
            default:
                return "other";
        }
    }

    /** PNG bytes of an icon's source texture (first frame if animated). */
    private static byte[] texture(String icon) {
        String domain = "minecraft", path = icon;
        int colon = icon.indexOf(':');
        if (colon >= 0) {
            domain = icon.substring(0, colon);
            path = icon.substring(colon + 1);
        }
        ResourceLocation loc = new ResourceLocation(domain, "textures/blocks/" + path + ".png");
        try {
            IResource res = Minecraft.getMinecraft()
                .getResourceManager()
                .getResource(loc);
            BufferedImage img;
            try (InputStream in = res.getInputStream()) {
                img = ImageIO.read(in);
            }
            if (img == null) return null;
            if (img.getHeight() > img.getWidth()) img = img.getSubimage(0, 0, img.getWidth(), img.getWidth());
            ByteArrayOutputStream bytes = new ByteArrayOutputStream();
            ImageIO.write(img, "png", bytes);
            return bytes.toByteArray();
        } catch (Throwable t) {
            return null;
        }
    }

    static String texturePath(String icon) {
        String domain = "minecraft", path = icon;
        int colon = icon.indexOf(':');
        if (colon >= 0) {
            domain = icon.substring(0, colon);
            path = icon.substring(colon + 1);
        }
        return domain + "/" + path + ".png";
    }

    private static List<Map<String, String>> mods() {
        List<Map<String, String>> out = new ArrayList<>();
        for (ModContainer mc : Loader.instance()
            .getActiveModList()) {
            Map<String, String> m = new LinkedHashMap<>();
            m.put("modid", mc.getModId());
            m.put("name", mc.getName());
            m.put("version", mc.getVersion());
            out.add(m);
        }
        return out;
    }

    /**
     * Names for the vanilla materials. Listed by reference rather than read
     * by reflection: field names are obfuscated in a real install.
     */
    private static Map<Material, String> materialNames() {
        Map<Material, String> out = new IdentityHashMap<>();
        out.put(Material.grass, "grass");
        out.put(Material.ground, "ground");
        out.put(Material.wood, "wood");
        out.put(Material.rock, "rock");
        out.put(Material.iron, "iron");
        out.put(Material.anvil, "anvil");
        out.put(Material.water, "water");
        out.put(Material.lava, "lava");
        out.put(Material.leaves, "leaves");
        out.put(Material.plants, "plants");
        out.put(Material.vine, "vine");
        out.put(Material.sponge, "sponge");
        out.put(Material.cloth, "cloth");
        out.put(Material.fire, "fire");
        out.put(Material.sand, "sand");
        out.put(Material.circuits, "circuits");
        out.put(Material.carpet, "carpet");
        out.put(Material.glass, "glass");
        out.put(Material.redstoneLight, "redstoneLight");
        out.put(Material.tnt, "tnt");
        out.put(Material.coral, "coral");
        out.put(Material.ice, "ice");
        out.put(Material.packedIce, "packedIce");
        out.put(Material.snow, "snow");
        out.put(Material.craftedSnow, "craftedSnow");
        out.put(Material.cactus, "cactus");
        out.put(Material.clay, "clay");
        out.put(Material.gourd, "gourd");
        out.put(Material.dragonEgg, "dragonEgg");
        out.put(Material.portal, "portal");
        out.put(Material.cake, "cake");
        out.put(Material.web, "web");
        out.put(Material.piston, "piston");
        return out;
    }

    private interface IntSource {

        int get();
    }

    private static int safeInt(IntSource s) {
        try {
            return s.get();
        } catch (Throwable t) {
            return -1;
        }
    }

    private static void put(ZipOutputStream zip, String name, String text) throws Exception {
        zip.putNextEntry(new ZipEntry(name));
        zip.write(text.getBytes(StandardCharsets.UTF_8));
        zip.closeEntry();
    }
}
