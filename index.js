const { 
  Client, 
  GatewayIntentBits, 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle, 
  ChannelType,
  PermissionFlagsBits,
  REST,
  Routes,
  SlashCommandBuilder,
  PermissionsBitField
} = require("discord.js");
const express = require("express");
const fs = require("fs");

// Servidor Web para o Render (Corrigido para o Docker)
const app = express();
app.get("/", (req, res) => res.send("Arcadiamon V3 Slash Ativo!"));
app.listen(process.env.PORT || 3000, () => console.log("Web server pronto para o Docker."));

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages
  ]
});

// 📁 BANCO DE DADOS APENAS PARA O INVENTÁRIO
const DATA_FILE = "./dados.json";
let db = { inventory: {} };

if (fs.existsSync(DATA_FILE)) {
  try { db = JSON.parse(fs.readFileSync(DATA_FILE, "utf8")); } catch (e) { console.log(e); }
}
function saveDB() { fs.writeFileSync(DATA_FILE, JSON.stringify(db, null, 2)); }

// ================= REGISTRO DOS COMANDOS DE BARRA (SLASH) =================
const commands = [
  new SlashCommandBuilder()
    .setName("setup-ticket")
    .setDescription("Envia o painel de criação de tickets no canal.")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  new SlashCommandBuilder()
    .setName("status")
    .setDescription("Mostra as informações e status do servidor de Minecraft.")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  new SlashCommandBuilder()
    .setName("pegar")
    .setDescription("Adiciona um item ou Pokémon ao seu inventário.")
    .addStringOption(option => 
      option.setName("item")
        .setDescription("Nome do item ou Pokémon")
        .setRequired(true)),

  new SlashCommandBuilder()
    .setName("inv")
    .setDescription("Mostra o seu inventário de itens.")
].map(command => command.toJSON());

client.on("ready", async () => {
  console.log(`🤖 Bot logado como ${client.user.tag}!`);

  const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);
  try {
    console.log("Registrando comandos de barra (/)...");
    await rest.put(Routes.applicationCommands(client.user.id), { body: commands });
    console.log("Todos os comandos (/) foram registrados!");
  } catch (error) {
    console.error("Erro ao registrar comandos:", error);
  }
});

// ================= PROCESSANDO OS SLASH COMMANDS =================
client.on("interactionCreate", async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const { commandName } = interaction;

  // 🎫 /setup-ticket
  if (commandName === "setup-ticket") {
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("open_ticket")
        .setLabel("Abrir Ticket 🎟️")
        .setStyle(ButtonStyle.Primary)
    );

    await interaction.reply({
      content: "## 🎫 Central de Atendimento Arcadiamon\nPrecisa de ajuda ou suporte? Clique no botão abaixo para abrir um ticket privado.",
      components: [row]
    });
  }

  // 🎮 /status
  if (commandName === "status") {
    const timestampAtual = Math.floor(Date.now() / 1000);
    
    const msgMinecraft = 
`## 🎮 Arcadiamon
*Servidor Minecraft Bedrock*

**📡 Status:** 🟢 Online
## 👥 Jogadores
\`▰▱▱▱▱▱▱▱▱▱\`  **7 / 50**
## 📋 Informações
**📦 Versão:** \`1.26.20\` (protocol 975)
**🎯 Gamemode:** \`Sobrevivência\`
**🖥️ Edição:** \`Bedrock (MCPE)\`
## 🔗 Como Conectar
> ╔════════════════════════════════╗
> ☣️🔥  ARCADIAMON. LUTE, CONQUISTE, SE TORNE UMA LENDA 🔥☣️
> ╚════════════════════════════════╝
> 
> 1️⃣  Abra o **Minecraft Bedrock**
> 2️⃣  Vá em **Jogar → Servidores → Adicionar Servidor**
> 3️⃣  **IP:** \`arcadiamon.blazebr.xyz\`
> 4️⃣  **Porta:** \`28606\`
-# Verificado em <t:${timestampAtual}:f> • Powered by mcstatus.io`;

    await interaction.reply({ content: msgMinecraft });
  }

  // 🎒 /pegar
  if (commandName === "pegar") {
    const item = interaction.options.getString("item");
    if (!db.inventory[interaction.user.id]) db.inventory[interaction.user.id] = [];
    
    db.inventory[interaction.user.id].push(item);
    saveDB();

    await interaction.reply({ content: `Você guardou **${item}** no seu inventário! 🎒` });
  }

  // 🎒 /inv
  if (commandName === "inv") {
    let inv = db.inventory[interaction.user.id] || [];
    await interaction.reply({ content: "🎒 **Seu Inventário:** " + (inv.join(", ") || "vazio") });
  }
});

// ================= INTERAÇÕES DOS BOTÕES INTERNOS =================
client.on("interactionCreate", async (interaction) => {
  if (!interaction.isButton()) return;

  // 1️⃣ CLICOU EM ABRIR TICKET
  if (interaction.customId === "open_ticket") {
    await interaction.deferReply({ ephemeral: true });

    try {
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
        content: `👋 Olá ${interaction.user}, bem-vindo ao seu ticket!\nExplique sua dúvida aqui. Nossa equipe de suporte já foi avisada.`,
        components: [rowTicket]
      });

      await interaction.editReply({ content: `Seu ticket foi criado: ${channel}` });
    } catch (error) {
      console.error(error);
      await interaction.editReply({ content: "❌ Não consegui criar o canal do ticket. Verifique se tenho permissão de 'Gerenciar Canais'." });
    }
  }

  // 2️⃣ CLICOU EM CLAIM (ASSUMIR)
  if (interaction.customId === "claim_ticket") {
    if (!interaction.member.permissions.has(PermissionsBitField.Flags.ModerateMembers)) {
      return interaction.reply({ content: "Apenas membros da Staff podem assumir este ticket!", ephemeral: true });
    }
    await interaction.reply({ content: `🚨 O moderador ${interaction.user} assumiu este ticket!` });
  }

  // 3️⃣ CLICOU EM FECHAR TICKET
  if (interaction.customId === "close_ticket") {
    await interaction.reply("🔒 Fechando este canal em 5 segundos...");
    setTimeout(() => {
      interaction.channel.delete().catch(() => {});
    }, 5000);
  }

  // 4️⃣ CLICOU NO PAINEL STAFF
  if (interaction.customId === "staff_panel") {
    if (!interaction.member.permissions.has(PermissionsBitField.Flags.ModerateMembers)) {
      return interaction.reply({ content: "❌ Apenas a Staff pode abrir este painel.", ephemeral: true });
    }

    const rowStaff = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId("staff_add_user").setLabel("Adicionar Usuário 👤").setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId("staff_renomear").setLabel("Renomear Canal 📝").setStyle(ButtonStyle.Secondary)
    );

    await interaction.reply({
      content: "🛠️ **Painel de Controle Staff (Secreto)**\nGerencie o atendimento usando os botões abaixo:",
      components: [rowStaff],
      ephemeral: true
    });
  }

  // 5️⃣ CLICOU EM ADICIONAR USUÁRIO
  if (interaction.customId === "staff_add_user") {
    await interaction.reply({ 
      content: "💡 Para adicionar alguém neste canal de ticket, use o comando de chat:\n`!adicionar @usuario`", 
      ephemeral: true 
    });
  }

  // 6️⃣ CLICOU EM RENOMEAR CANAL
  if (interaction.customId === "staff_renomear") {
    await interaction.channel.setName(`resolvido-${interaction.channel.name.split("-")[1] || ""}`);
    await interaction.reply({ content: "✅ Nome do canal alterado para resolvido!", ephemeral: true });
  }
});

// Comando auxiliar !adicionar
client.on("messageCreate", async (message) => {
  if (message.content.startsWith("!adicionar")) {
    if (!message.member || !message.member.permissions.has(PermissionsBitField.Flags.ModerateMembers)) return;
    const user = message.mentions.users.first();
    if (!user) return message.reply("Mencione o usuário que você quer adicionar.");

    await message.channel.permissionOverwrites.create(user.id, {
      ViewChannel: true,
      SendMessages: true
    });
    message.channel.send(`✅ ${user} foi adicionado ao ticket.`);
  }
});

client.login(process.env.TOKEN);
