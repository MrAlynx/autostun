/// <reference types="../CTAutocomplete" />

import PogObject from "../PogData"
import Vector3 from "../BloomCore/utils/Vector3"
import {S02PacketChat} from "../BloomCore/utils/Utils"

const C08PacketPlayerBlockPlacement = Java.type("net.minecraft.network.play.client.C08PacketPlayerBlockPlacement");
let bossRoomFlag = false;
let lastUsed = 0;
let thorn = null;

const data = new PogObject("autostun", {
	enabled: false
});

register("packetReceived", (packet, event) => {
    const message = ChatLib.removeFormatting(packet.func_148915_c().func_150260_c());
    if (message === "[BOSS] Thorn: Welcome Adventurers! I am Thorn, the Spirit! And host of the Vegan Trials!" && !bossRoomFlag) 
    {
        bossRoomFlag = true;
        setTimeout(() =>
            {
                thorn = World.getAllEntities().find(e => e.getClassName() === "EntityGhast");
            }, 1000);
    }
}).setFilteredClass(S02PacketChat)

function isFacing()
{
    if (!bossRoomFlag) return false;
    if (!thorn) return false;
    let playerVec = Vector3.fromPitchYaw(Player.getPitch(), Player.getYaw());
    let thornDistance = Vector3.fromCoords(Player.x, Player.y, Player.z, thorn.x, thorn.y, thorn.z).normalize();
    let dot = playerVec.dotProduct(thornDistance);
    return dot > 0.5; 
}

const trigger = register("tick", (tick) => {
        if (tick % 15 !== 0) return;
        if (!data.enabled) return;
        if (!bossRoomFlag) return;
        if (!isFacing()) return;
        autoTribal();
});

register("WorldUnload", () => {
    if (bossRoomFlag)
    { 
        bossRoomFlag = false;
        thorn = null;
    }
})

function autoTribal() 
{
    const now = Date.now();
    if (now - lastUsed < 1000) return;
    const item = Player.getHeldItem();
    const sbId = item?.getNBT()?.toObject()?.tag?.ExtraAttributes?.id;
    ChatLib.chat(sbId);
    if (sbId === "TRIBAL_SPEAR") 
        {
            Client.sendPacket(new C08PacketPlayerBlockPlacement(item.getItemStack()));
            lastUsed = now;
            ChatLib.chat("Sending Tribal Spear packet");
        }
}

register("command", () => {
    data.enabled = !data.enabled;
	ChatLib.chat("autostun: " + data.enabled);
	data.save();
}).setName("autostun");
