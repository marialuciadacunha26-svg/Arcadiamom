const { 
  Client, 
  GatewayIntentBits, 
  Partials, 
  PermissionsBitField, 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle, 
  ChannelType,
  PermissionFlagsBits
} = require("discord.js");
const express = require("express");
const fs = require("fs");

// Servidor Web para o Render
const app = express();
app.get("/", (req, res) => res.send("Arcadiamon V3 - Tickets Ativos!"));
app.listen(process.env.PORT || 3000);

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ],
  partials: [Partials.Channel]
});

// 📁 BANCO DE DADOS APENAS PARA O INVENTÁRIO
const DATA_FILE = "./dados.json";
let db = { inventory: {} };

if (fs.existsSync(DATA_FILE)) {
  try { db = JSON.parse(fs.readFileSync(DATA_FILE, "utf8")); } catch (e) { console.log(e); }
}
function saveDB() { fs.writeFileSync(DATA_FILE, JSON.stringify(db, null, 2)); }

client.on("ready", () => { console.log("Arcadiamon V3 online (Sem Moedas)!"); });

// ================= COMANDOS =================
client.on("messageCreate", async (message) => {
  if (message.author.bot) return;
  const args = message.content.split(" ");
  const cmd = args[0];

  // 🎫 ENVIAR PAINEL DE TICKET
  if (cmd === "!setup-ticket") {
    if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) return;

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("open_ticket")
        .setLabel("Abrir Ticket 🎟️")
        .setStyle(ButtonStyle.Primary)
    );

    await message.channel.send({
      content: "## 🎫 Central de Atendimento Arcadiamon\nPrecisa de ajuda ou suporte? Clique no botão abaixo para abrir um ticket privado.",
      components: [row]
    });
  }

  // 🎒 INVENTÁRIO (Sem moedas)
  if (cmd === "!pegar") {
    let item = args.slice(1).join(" ");
    if (!item) return message.reply("Digite o nome do item para pegar!");
    if (!db.inventory[message.author.id]) db.inventory[message.author.id] = [];
    db.inventory[message.author.id].push(item);
    saveDB();
    message.reply("Você pegou: " + item);
  }

  if (cmd === "!inv") {
    let inv = db.inventory[message.author.id] || [];
    message.reply("Inventário: " + (inv.join(", ") || "vazio"));
  }
});

// ================= INTERAÇÕES DOS BOTÕES =================
client.on("interactionCreate", async (interaction) => {
  if (!interaction.isButton()) return;

  // 1️⃣ CLICOU EM ABRIR TICKET
  if (interaction.customId === "open_ticket") {
    await interaction.deferReply({ ephemeral: true });

    const channel = await interaction.guild.channels.create({
      name: `ticket-${interaction.user.username}`,
      type: ChannelType.GuildText,
      permissionOverwrites: [
        { id: interaction.guild.roles.everyone.id, deny: [PermissionFlagsBits.ViewChannel] },
        { id: interaction.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] }
      ]
    });

    const rowTicket = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId("claim_ticket").setLabel("Claim (Assumir) 🔒").setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId("close_ticket").setLabel("Fechar Ticket ❌").setStyle(ButtonStyle.Danger),
      new ButtonBuilder().setCustomId("staff_panel").setLabel("Painel Staff 🛠️").setStyle(ButtonStyle.Secondary)
    );

    await channel.send({
      content: `👋 Olá ${interaction.user}, bem-vindo ao seu ticket!\nExplique sua dúvida aqui. A equipe de suporte já foi notificada.`,
      components: [rowTicket]
    });

    await interaction.editReply({ content: `Seu ticket foi criado com sucesso em: ${channel}` });
  }

  // 2️⃣ CLICOU EM CLAIM (ASSUMIR)
  if (interaction.customId === "claim_ticket") {
    if (!interaction.member.permissions.has(PermissionsBitField.Flags.ModerateMembers)) {
      return interaction.reply({ content: "Apenas a Staff pode assumir este ticket!", ephemeral: true });
    }
    await interaction.reply({ content: `🚨 O moderador ${interaction.user} assumiu o atendimento deste ticket!` });
  }

  // 3️⃣ CLICOU EM FECHAR TICKET
  if (interaction.customId === "close_ticket") {
    await interaction.reply("🔒 Fechando o ticket em 5 segundos...");
    setTimeout(() => {
      interaction.channel.delete().catch(() => {});
    }, 5000);
  }

  // 4️⃣ CLICOU NO PAINEL STAFF (Mensagem efêmera - só a staff vê)
  if (interaction.customId === "staff_panel") {
    if (!interaction.member.permissions.has(PermissionsBitField.Flags.ModerateMembers)) {
      return interaction.reply({ content: "❌ Erro: Esse painel é restrito para membros da Staff.", ephemeral: true });
    }

    const rowStaff = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId("staff_add_user").setLabel("Adicionar Usuário 👤").setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId("staff_renomear").setLabel("Renomear Canal 📝").setStyle(ButtonStyle.Secondary)
    );

    await interaction.reply({
      content: "🛠️ **Painel de Controle Staff (Secreto)**\nUse as funções abaixo para gerenciar este canal de atendimento:",
      components: [rowStaff],
      ephemeral: true
    });
  }

  // 5️⃣ CLICOU EM ADICIONAR USUÁRIO
  if (interaction.customId === "staff_add_user") {
    await interaction.reply({ 
      content: "💡 Para adicionar alguém, digite no chat deste ticket:\n`!adicionar @usuario`", 
      ephemeral: true 
    });
  }

  // 6️⃣ CLICOU EM RENOMEAR CANAL
  if (interaction.customId === "staff_renomear") {
    await interaction.channel.setName(`resolvido-${interaction.channel.name.split("-")[1] || ""}`);
    await interaction.reply({ content: "✅ Canal marcado como resolvido!", ephemeral: true });
  }
});

// Comando para a staff adicionar membros ao ticket aberto
client.on("messageCreate", async (message) => {
  if (message.content.startsWith("!adicionar")) {
    if (!message.member.permissions.has(PermissionsBitField.Flags.ModerateMembers)) return;
    const user = message.mentions.users.first();
    if (!user) return message.reply("Mencione um usuário válido para adicionar.");

    await message.channel.permissionOverwrites.create(user.id, {
      ViewChannel: true,
      SendMessages: true
    });
    message.channel.send(`✅ ${user} foi adicionado ao ticket.`);
  }
});

client.login(process.env.TOKEN);
