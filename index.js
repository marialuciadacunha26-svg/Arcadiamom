const { Client, GatewayIntentBits, Partials, PermissionsBitField } = require("discord.js");
const express = require("express");

// Servidor Web para o Render não derrubar o Bot
const app = express();
app.get("/", (req, res) => res.send("Bot online!"));
app.listen(process.env.PORT || 3000, () => console.log("Servidor Web pronto."));

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ],
  partials: [Partials.Channel]
});

// 💰 ECONOMIA + INVENTÁRIO (Atenção: reinicia se o bot reiniciar)
let money = {};
let inventory = {};

// ================= BOT ONLINE =================
client.on("ready", () => {
  console.log("Arcadiamon V2 online!");
});

// ================= FUNÇÕES =================
function addMoney(userId, value){
  if(!money[userId]) money[userId] = 0;
  money[userId] += value;
}

// ================= COMANDOS =================
client.on("messageCreate", async (message) => {
  if(message.author.bot) return;

  const args = message.content.split(" ");
  const cmd = args[0];

  // 💰 daily
  if(cmd === "!daily"){
    addMoney(message.author.id, 200);
    message.reply("Você ganhou 200 coins 💰");
  }

  // 💰 saldo
  if(cmd === "!saldo"){
    message.reply(`Seu saldo: ${money[message.author.id] || 0} coins 💰`);
  }

  // 🎒 inventário (Pokémon + itens)
  if(cmd === "!inv"){
    let inv = inventory[message.author.id] || [];
    message.reply("Inventário: " + (inv.join(", ") || "vazio"));
  }

  // 🧪 pegar item/pokemon teste
  if(cmd === "!pegar"){
    let item = args.slice(1).join(" ");
    if(!inventory[message.author.id]) inventory[message.author.id] = [];
    inventory[message.author.id].push(item);
    message.reply("Você pegou: " + item);
  }

  // 🛡️ STAFF BAN
  if(cmd === "!ban"){
    if(!message.member.permissions.has(PermissionsBitField.Flags.BanMembers)) return;
    let user = message.mentions.members.first();
    if(user){
      user.ban().catch(console.error);
      message.channel.send("Usuário banido 🔨");
    }
  }

  // 👢 KICK
  if(cmd === "!kick"){
    if(!message.member.permissions.has(PermissionsBitField.Flags.KickMembers)) return;
    let user = message.mentions.members.first();
    if(user){
      user.kick().catch(console.error);
      message.channel.send("Usuário expulso 👢");
    }
  }

  // 🔇 MUTE
  if(cmd === "!mute"){
    if(!message.member.permissions.has(PermissionsBitField.Flags.ModerateMembers)) return;
    let user = message.mentions.members.first();
    if(user){
      user.timeout(60000).catch(console.error);
      message.channel.send("Usuário mutado 🔇");
    }
  }

  // 🎟️ TICKETS
  if(cmd === "!ticket"){
    let channel = await message.guild.channels.create({
      name: `ticket-${message.author.username}`,
      type: 0
    });

    channel.send("🎟️ Ticket criado! Explique seu problema aqui.");
  }

  // 🔄 TROCA SIMPLES
  if(cmd === "!trocar"){
    let user = message.mentions.users.first();
    if(!user) return message.reply("Mencione alguém!");

    message.reply(`Pedido de troca enviado para ${user.username}`);
  }

  // 🤖 IA SIMPLES
  if(cmd === "!ia"){
    let text = args.slice(1).join(" ");
    message.reply("🤖 IA (demo): você disse -> " + text);
  }
});

// Puxa o Token de forma segura das configurações do Render
client.login(process.env.TOKEN);
