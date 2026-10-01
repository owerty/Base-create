package com.philipxjm.blueprintdump;

import net.minecraftforge.client.ClientCommandHandler;

import cpw.mods.fml.common.FMLCommonHandler;
import cpw.mods.fml.common.Mod;
import cpw.mods.fml.common.event.FMLInitializationEvent;

/**
 * Client-side helper for the GTNH Blueprint tool. Adds a client command,
 * {@code /blueprintdump}, that writes every registered block, its metadata
 * variants, its shape family and its face textures to
 * {@code .minecraft/blueprint-dump.zip}. The component library that Claude
 * Design builds with is generated from that zip.
 *
 * <p>
 * Nothing runs until the command is typed, and nothing is sent to the
 * server, so it is safe to have installed on any server.
 */
@Mod(
    modid = BlueprintDump.MODID,
    version = Tags.VERSION,
    name = "BlueprintDump",
    acceptedMinecraftVersions = "[1.7.10]",
    acceptableRemoteVersions = "*")
public class BlueprintDump {

    public static final String MODID = "blueprintdump";

    @Mod.EventHandler
    public void init(FMLInitializationEvent event) {
        if (FMLCommonHandler.instance()
            .getSide()
            .isClient()) {
            ClientCommandHandler.instance.registerCommand(new DumpCommand());
        }
    }
}
