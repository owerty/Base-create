package com.philipxjm.blueprintdump;

import java.io.File;

import net.minecraft.client.Minecraft;
import net.minecraft.command.CommandBase;
import net.minecraft.command.ICommandSender;
import net.minecraft.util.ChatComponentText;
import net.minecraft.util.EnumChatFormatting;

public class DumpCommand extends CommandBase {

    @Override
    public String getCommandName() {
        return "blueprintdump";
    }

    @Override
    public String getCommandUsage(ICommandSender sender) {
        return "/blueprintdump - write every block and its textures to blueprint-dump.zip";
    }

    @Override
    public int getRequiredPermissionLevel() {
        return 0;
    }

    @Override
    public boolean canCommandSenderUseCommand(ICommandSender sender) {
        return true;
    }

    @Override
    public void processCommand(ICommandSender sender, String[] args) {
        File out = new File(Minecraft.getMinecraft().mcDataDir, "blueprint-dump.zip");
        say(sender, EnumChatFormatting.GRAY + "Dumping blocks, this can take a minute...");
        try {
            Dumper.Result r = new Dumper().run(out);
            say(
                sender,
                EnumChatFormatting.GREEN + "Wrote "
                    + r.variants
                    + " block variants from "
                    + r.blocks
                    + " blocks, "
                    + r.textures
                    + " textures ("
                    + r.missingTextures
                    + " not found) to "
                    + out.getAbsolutePath());
        } catch (Throwable t) {
            say(sender, EnumChatFormatting.RED + "Dump failed: " + t);
            t.printStackTrace();
        }
    }

    private static void say(ICommandSender sender, String msg) {
        sender.addChatMessage(new ChatComponentText(msg));
    }
}
