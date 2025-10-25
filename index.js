/// <reference types="../CTAutocomplete" />

import PogObject from "../PogData"
import Vector3 from "../BloomCore/utils/Vector3"
import {S02PacketChat, BlockPoss, Blocks} from "../BloomCore/utils/Utils"
import {registerWhenInDungeon} from "../BloomCore/dungeon/Dungeon.js"

const C08PacketPlayerBlockPlacement = Java.type("net.minecraft.network.play.client.C08PacketPlayerBlockPlacement");
let bossRoomFlag = false;
let lastUsed = 0;
let thorn = null;
let ticktrigger = tickregister(); 
let bossentrytrigger = bossentry(); 

const data = new PogObject("autostun", {
	enabled: false
});


function bossentry() { 
    return register("packetReceived", (packet, event) => {
    const message = ChatLib.removeFormatting(packet.func_148915_c().func_150260_c());
    if (message === "[BOSS] Thorn: Welcome Adventurers! I am Thorn, the Spirit! And host of the Vegan Trials!" && !bossRoomFlag) 
    {
        tickregister();
        bossRoomFlag = true;
        setTimeout(() =>
            {
                thorn = World.getAllEntities().find(e => e.getClassName() === "EntityGhast");
            }, 1000);
    }
    }).setFilteredClass(S02PacketChat)

}

function isFacing()
{
    if (!bossRoomFlag) return false;
    if (!thorn) return false;
    let playerVec = Vector3.fromPitchYaw(Player.getPitch(), Player.getYaw());
    let thornDistance = Vector3.fromCoords(Player.x, Player.y, Player.z, thorn.x, thorn.y, thorn.z).normalize();
    let dot = playerVec.dotProduct(thornDistance);
    return dot > 0.90; 
}

function tickregister(){
    ticktrigger = register("tick", (tick) => {
        if (!data.enabled) return;
        if (!bossRoomFlag) return;
        if (!isFacing()) return;
        if (tick % 15 !== 0) return;
        autoTribal();
});
}

function autoTribal() 
{
    if (Player.y > 82) return; 
    const now = Date.now();
    if (now - lastUsed < 1000) return;
    const item = Player.getHeldItem();
    if (!item) return;
    const sbId = item?.getNBT()?.toObject()?.tag?.ExtraAttributes?.id;
    if (sbId === "TRIBAL_SPEAR") 
        {
            Client.sendPacket(new C08PacketPlayerBlockPlacement(item.getItemStack()));
            lastUsed = now;
        }
}

export function enable(){
    bossRoomFlag = false;
    thorn = null;
    registerWhenInDungeon(ticktrigger,true);
    registerWhenInDungeon(bossentrytrigger,true);
}

export function disable(){
    data.enabled = false;
    bossRoomFlag = false;
    thorn = null;
    data.save();
}

register("command", () => {
    data.enabled = !data.enabled;
	ChatLib.chat("autostun: " + data.enabled);
    if (data.enabled) enable();
    else disable();
	data.save();
}).setName("autostun");

export default { enable, disable };
