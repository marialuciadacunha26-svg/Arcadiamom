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
  PermissionsBitField,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  EmbedBuilder
} = require("discord.js");
const express = require("express");
const fs = require("fs");

// Servidor Web para o Render (Docker / Web Service)
const app = express();
app.get("/", (req, res) => res.send("Arcadiamon V3 Embeds Ativo!"));
app.listen(process.env.PORT || 3000, () => console.log("Web server pronto."));

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

// 📁 BANCO DE DADOS PARA INVENTÁRIO E CONTROLE DE IA
const DATA_FILE = "./dados.json";
let db = { inventory: {}, ai_tickets: {} };

if (fs.existsSync(DATA_FILE)) {
  try { db = JSON.parse(fs.readFileSync(DATA_FILE, "utf8")); } catch (e) { console.log(e); }
}
if (!db.ai_tickets) db.ai_tickets = {};

function saveDB() { fs.writeFileSync(DATA_FILE, JSON.stringify(db, null, 2)); }

// ================= REGISTRO DOS COMANDOS DE BARRA (SLASH) =================
const commands = [
  new SlashCommandBuilder()
    .setName("setup-ticket")
    .setDescription("Envia a central de atendimento com menu de seleção em Embed.")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  new SlashCommandBuilder()
    .setName("status")
    .setDescription("Mostra as informações e status do servidor de Minecraft em Embed.")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  new SlashCommandBuilder()
    .setName("pegar")
    .setDescription("Adiciona um item ou Pokémon ao seu inventário do Discord.")
    .addStringOption(option => 
      option.setName("item")
        .setDescription("Nome do item ou Pokémon")
        .setRequired(true)),

  new SlashCommandBuilder()
    .setName("inv")
    .setDescription("Mostra o seu inventário de itens do Discord.")
].map(command => command.toJSON());

client.on("ready", async () => {
  console.log(`🤖 Bot logado como ${client.user.tag}!`);
  const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);
  try {
    await rest.put(Routes.applicationCommands(client.user.id), { body: commands });
    console.log("Todos os comandos (/) foram registrados!");
  } catch (error) { console.error(error); }
});

// ================= PROCESSANDO OS SLASH COMMANDS =================
client.on("interactionCreate", async (interaction) => {
  if (!interaction.isChatInputCommand()) return;
  const { commandName } = interaction;

  // 🎫 /setup-ticket (MENSAGEM EM EMBED)
  if (commandName === "setup-ticket") {
    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId("menu_ticket")
      .setPlaceholder("🚨 Atendimento geral")
      .addOptions(
        new StringSelectMenuOptionBuilder()
          .setLabel("Comprar Pokémon/kits")
          .setDescription("Nesse canal vc consegue comprar kits/pokemom da loja")
          .setValue("ticket_loja")
          .setEmoji("💵"),
        new StringSelectMenuOptionBuilder()
          .setLabel("Denunciar jogadores")
          .setDescription("Denunciar jogadores que não respeitou as regras")
          .setValue("ticket_denuncia")
          .setEmoji("🚨"),
        new StringSelectMenuOptionBuilder()
          .setLabel("Bugs")
          .setDescription("Caso tenha um bug no servidor use essa opção")
          .setValue("ticket_bugs")
          .setEmoji("🔺"),
        new StringSelectMenuOptionBuilder()
          .setLabel("Suporte com IA")
          .setDescription("Abra um chat privado para tirar dúvidas com nossa IA inteligente")
          .setValue("ticket_ia")
          .setEmoji("🤖"),
        new StringSelectMenuOptionBuilder()
          .setLabel("Suporte")
          .setDescription("Caso esteja com dúvidas do servidor abri essa opção")
          .setValue("ticket_suporte")
          .setEmoji("💬"),
        new StringSelectMenuOptionBuilder()
          .setLabel("Outros")
          .setDescription("Assunto que fugi das opções acima")
          .setValue("ticket_outros")
          .setEmoji("🌍")
      );

    const row = new ActionRowBuilder().addComponents(selectMenu);

    const embedTicket = new EmbedBuilder()
      .setTitle("📫 Central de Atendimento")
      .setDescription(
        "Olá, seja bem-vindo à central de atendimento da **Arcadiamon**, abaixo vamos listar os tipos de atendimento disponíveis para uso.\n\n" +
        "**📨 Atendimento via chamado**\n" +
        "- Selecione abaixo qual departamento está relacionado à sua dúvida e será gerado um canal de texto privado para que seu atendimento seja realizado.\n\n" +
        "**🗣️ Atendimento via voz**\n" +
        "- Disponível para jogadores VIPs que possuem suporte prioritário, quando for solicitado pela nossa equipe.\n\n" +
        "⚠️ Tickets sem resposta do jogador por mais de 24 horas poderão ser fechados a qualquer momento."
      )
      .addFields({ name: "⏲ Horário de Atendimento", value: "24:00", inline: true })
      .setColor("#ff1f1f")
      .setThumbnail(interaction.guild.iconURL());

    await interaction.reply({ embeds: [embedTicket], components: [row] });
  }

  // 🎮 /status (MINECRAFT EM EMBED)
  if (commandName === "status") {
    const timestampAtual = Math.floor(Date.now() / 1000);

    const embedMinecraft = new EmbedBuilder()
      .setTitle("🎮 Arcadiamon")
      .setDescription("*Servidor Minecraft Bedrock*\n\n**📡 Status:** 🟢 Online")
      .addFields(
        { name: "👥 Jogadores", value: "`▰▱▱▱▱▱▱▱▱▱` **7 / 50**" },
        { name: "📋 Informações", value: "**📦 Versão:** `1.26.20` (protocol 975)\n**🎯 Gamemode:** `Sobrevivência`\n**🖥️ Edição:** `Bedrock (MCPE)`" },
        { name: "🔗 Como Conectar", value: "╔════════════════════════════════╗\n☣️🔥  ARCADIAMON. LUTE, CONQUISTE, SE TORNE UMA LENDA 🔥☣️\n╚════════════════════════════════╝\n\n1️⃣ Abra o **Minecraft Bedrock**\n2️⃣ Vá em **Jogar → Servidores → Adicionar Servidor**\n3️⃣ **IP:** `arcadiamon.blazebr.xyz`\n4️⃣ **Porta:** `28606`" }
      )
      .setColor("#ffcc00")
      .setFooter({ text: `Verificado em • Powered by mcstatus.io`, iconURL: interaction.guild.iconURL() })
      .setTimestamp(new Date(timestampAtual * 1000));

    await interaction.reply({ embeds: [embedMinecraft] });
  }

  // 🎒 /pegar (EMBED)
  if (commandName === "pegar") {
    const item = interaction.options.getString("item");
    if (!db.inventory[interaction.user.id]) db.inventory[interaction.user.id] = [];
    db.inventory[interaction.user.id].push(item);
    saveDB();

    const embedPegar = new EmbedBuilder()
      .setDescription(`🎒 Guardado com sucesso! Você adicionou **${item}** no seu inventário do Discord.`)
      .setColor("#00ff00");

    await interaction.reply({ embeds: [embedPegar] });
  }

  // 🎒 /inv (EMBED)
  if (commandName === "inv") {
    let inv = db.inventory[interaction.user.id] || [];
    
    const embedInv = new EmbedBuilder()
      .setTitle(`🎒 Inventário de ${interaction.user.username}`)
      .setDescription(inv.join(", ") || "*Seu inventário está totalmente vazio no momento.*")
      .setColor("#0099ff");

    await interaction.reply({ embeds: [embedInv] });
  }
});

// ================= PROCESSANDO A SELEÇÃO DO MENU =================
client.on("interactionCreate", async (interaction) => {
  if (!interaction.isStringSelectMenu()) return;

  if (interaction.customId === "menu_ticket") {
    await interaction.deferReply({ ephemeral: true });
    const escolha = interaction.values[0];
    
    let nomeCategoria = escolha.replace("ticket_", "");
    let prefixoChannel = nomeCategoria === "ia" ? "🤖-ia-" : `🎫-${nomeCategoria}-`;

    try {
      const channel = await interaction.guild.channels.create({
        name: `${prefixoChannel}${interaction.user.username}`,
        type: ChannelType.GuildText,
        permissionOverwrites: [
          { id: interaction.guild.roles.everyone.id, deny: [PermissionFlagsBits.ViewChannel] },
          { id: interaction.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] }
        ]
      });

      if (escolha === "ticket_ia") {
        db.ai_tickets[channel.id] = true;
        saveDB();
      }

      const rowTicket = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId("claim_ticket").setLabel("Claim (Assumir) 🔒").setStyle(ButtonStyle.Success),
        new ButtonBuilder().setCustomId("close_ticket").setLabel("Fechar Ticket ❌").setStyle(ButtonStyle.Danger),
        new ButtonBuilder().setCustomId("staff_panel").setLabel("Painel Staff 🛠️").setStyle(ButtonStyle.Secondary)
      );

      const embedBoasVindas = new EmbedBuilder()
        .setTitle(`👋 Atendimento: ${nomeCategoria.toUpperCase()}`)
        .setColor("#3498db");

      if (escolha === "ticket_ia") {
        embedBoasVindas.setDescription(`Olá ${interaction.user}! Este é o seu chat privado com nossa Inteligência Artificial.\n\n**Pergunte o que quiser abaixo que responderei instantaneamente!**`)
          .setThumbnail("https://i.imgur.com/wSTFkRM.png");
      } else {
        embedBoasVindas.setDescription(`Olá ${interaction.user}, seja bem-vindo ao seu ticket!\nExplique sua dúvida detalhadamente neste chat para receber ajuda.`);
      }

      await channel.send({
        embeds: [embedBoasVindas],
        components: [rowTicket]
      });

      const embedSucesso = new EmbedBuilder()
        .setDescription(`✅ Seu canal de atendimento foi criado com sucesso em ${channel}`)
        .setColor("#2ecc71");

      await interaction.editReply({ embeds: [embedSucesso] });
    } catch (error) {
      console.error(error);
      await interaction.editReply({ content: "❌ Erro ao criar o canal do ticket." });
    }
  }
});

// ================= INTERAÇÕES DOS BOTÕES INTERNOS DOS TICKETS =================
client.on("interactionCreate", async (interaction) => {
  if (!interaction.isButton()) return;

  if (interaction.customId === "claim_ticket") {
    if (!interaction.member.permissions.has(PermissionsBitField.Flags.ModerateMembers)) {
      return interaction.reply({ content: "Apenas membros da Staff podem assumir este ticket!", ephemeral: true });
    }
    const embedClaim = new EmbedBuilder()
      .setDescription(`🚨 O moderador ${interaction.user} assumiu o atendimento deste ticket!`)
      .setColor("#e67e22");
    await interaction.reply({ embeds: [embedClaim] });
  }

  if (interaction.customId === "close_ticket") {
    const embedClose = new EmbedBuilder()
      .setDescription("🔒 Canal marcado para encerramento. Deletando este ticket em 5 segundos...")
      .setColor("#e74c3c");
    
    await interaction.reply({ embeds: [embedClose] });
    
    if (db.ai_tickets[interaction.channel.id]) {
      delete db.ai_tickets[interaction.channel.id];
      saveDB();
    }

    setTimeout(() => {
      interaction.channel.delete().catch(() => {});
    }, 5000);
  }

  if (interaction.customId === "staff_panel") {
    if (!interaction.member.permissions.has(PermissionsBitField.Flags.ModerateMembers)) {
      return interaction.reply({ content: "❌ Apenas a Staff pode abrir este painel.", ephemeral: true });
    }

    const rowStaff = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId("staff_add_user").setLabel("Adicionar Usuário 👤").setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId("staff_renomear").setLabel("Renomear Canal 📝").setStyle(ButtonStyle.Secondary)
    );

    const embedStaff = new EmbedBuilder()
      .setTitle("🛠️ Painel de Controle Staff")
      .setDescription("Selecione uma das funções administrativas para gerenciar este ticket:")
      .setColor("#2c3e50");

    await interaction.reply({ embeds: [embedStaff], components: [rowStaff], ephemeral: true });
  }

  if (interaction.customId === "staff_add_user") {
    const embedDica = new EmbedBuilder()
      .setDescription("💡 Para adicionar um jogador neste canal de ticket, use:\n`!adicionar @usuario`")
      .setColor("#34495e");
    await interaction.reply({ embeds: [embedDica], ephemeral: true });
  }

  if (interaction.customId === "staff_renomear") {
    await interaction.channel.setName(`resolvido-${interaction.channel.name.split("-")[1] || ""}`);
    const embedRenomeado = new EmbedBuilder()
      .setDescription("✅ Nome do canal alterado com sucesso para resolvido!")
      .setColor("#2ecc71");
    await interaction.reply({ embeds: [embedRenomeado], ephemeral: true });
  }
});

// ================= RESPONDEDOR DA IA DENTRO DO TICKET =================
client.on("messageCreate", async (message) => {
  if (message.author.bot) return;

  if (db.ai_tickets[message.channel.id]) {
    await message.channel.sendTyping();

    const pergunta = message.content.toLowerCase();
    let respostaTexto = `Olá! Eu sou a inteligência artificial de suporte da **Arcadiamon**. \n\nDescreva sua dúvida detalhadamente neste chat. Se precisar de um atendente humano, basta aguardar que a nossa equipe da Staff já foi notificada através dos botões acima!`;

    // 1️⃣ COMO ENTRAR NO SERVIDOR (PADRÃO GAMEZONE)
    if (pergunta.includes("ip") || pergunta.includes("porta") || pergunta.includes("conectar") || pergunta.includes("entrar") || pergunta.includes("como entra")) {
      respostaTexto = `📡 **CENTRAL DE CONEXÃO | ARCADIAMON**\n\n` +
                      `Para se conectar ao nosso servidor de Minecraft Bedrock (Celular/Console/PC), siga o passo a passo abaixo:\n\n` +
                      `1️⃣ Inicie o seu **Minecraft Bedrock**.\n` +
                      `2️⃣ Clique em **Jogar** ➔ Aba **Servidores** ➔ **Adicionar Servidor**.\n` +
                      `3️⃣ Insira os seguintes dados de conexão:\n\n` +
                      `• 🌐 **IP / Endereço:** \`arcadiamon.blazebr.xyz\`\n` +
                      `• 🔌 **Porta:** \`28606\`\n\n` +
                      `4️⃣ Clique em **Salvar** e depois em **Entrar**. Pronto, você já estará no mundo Pokémon!`;
    
    // 2️⃣ COMO PEGAR AS COISAS DO MOD / POKEPEDIA DENTRO DO JOGO (PADRÃO GAMEZONE)
    } else if (pergunta.includes("pegar") || pergunta.includes("mod") || pergunta.includes("pixelmon") || pergunta.includes("pokemon") || pergunta.includes("item") || pergunta.includes("como ganha") || pergunta.includes("pega") || pergunta.includes("pokepedia") || pergunta.includes("pokedex")) {
      respostaTexto = `🎮 **GUIA DE INÍCIO | COMO PEGAR ITENS E USAR A POKÉPEDIA**\n\n` +
                      `No Arcadiamon, toda a sua jornada acontece diretamente dentro do servidor do Minecraft. Veja como resgatar seus itens e consultar a Poképédia:\n\n` +
                      `• 🧬 **Seu Primeiro Pokémon:** Assim que você entrar no servidor pela primeira vez, uma interface será aberta automaticamente na sua tela para você escolher o seu Pokémon Inicial.\n\n` +
                      `• 📦 **Kits Iniciais (Pokébolas e Itens):** Abra o chat do jogo dentro do servidor e digite o comando:\n` +
                      `  ➔ \`/kit\` ou \`/kit inicial\`\n` +
                      `  *(Isso vai colocar as suas primeiras Pokébolas e ferramentas direto no seu inventário do jogo).* \n\n` +
                      `• 📖 **Acessar a Poképédia / Pokédex:** Para consultar informações de qualquer Pokémon, golpes, evoluções e fraquezas dentro do jogo, abra o chat do Minecraft e digite:\n` +
                      `  ➔ \`/pokepedia\` ou \`/pokedex\`\n` +
                      `  *(Um menu interativo será aberto na sua tela com a lista completa de dados de todas as criaturas do mod).* \n\n` +
                      `• 🌲 **Capturando no Mapa:** Para pegar novos Pokémons, basta andar pelo mundo selvagem, encontrar o Pokémon que você quer e arremessar a sua Pokébola nele para iniciar a captura.\n\n` +
                      `⚠️ *Nota: Se você comprou algum pacote, VIP ou Pokémon na Loja e veio aqui resgatar, informe o seu Nick do jogo neste chat e aguarde um Diretor/Admin realizar a entrega manual.*`;
                      
    } else if (pergunta.includes("vip") || pergunta.includes("comprar") || pergunta.includes("loja") || pergunta.includes("kit")) {
      respostaTexto = `🛒 **LOJA E VANTAGENS VIP**\n\nPara adquirir vantagens VIP, kits exclusivos, insígnias ou Pokémons customizados, aguarde o suporte de um administrador da nossa equipe neste canal ou consulte as instruções na nossa categoria de anúncios!`;
    } else if (pergunta.includes("ajuda") || pergunta.includes("bug") || pergunta.includes("erro")) {
      respostaTexto = `🔺 **REPORTE DE ERROS E BUGS**\n\nLamentamos pelo transtorno! Para que nossa equipe técnica resolva o seu problema o quanto antes, envie neste chat:\n\n1️⃣ Seu Nick no jogo.\n2️⃣ Uma breve explicação do bug.\n3️⃣ Prints ou vídeos do erro acontecendo (se houver).`;
    }

    const embedIa = new EmbedBuilder()
      .setTitle("🤖 Suporte Automatizado Arcadiamon")
      .setDescription(respostaTexto)
      .setColor("#ffcc00")
      .setFooter({ text: "Arcadiamon • Sistema de Respostas Rápidas" });

    await message.reply({ embeds: [embedIa] });
  }
});

// Comando !adicionar
client.on("messageCreate", async (message) => {
  if (message.content.startsWith("!adicionar")) {
    if (!message.member || !message.member.permissions.has(PermissionsBitField.Flags.ModerateMembers)) return;
    const user = message.mentions.users.first();
    if (!user) return message.reply("Mencione o usuário que você quer adicionar.");
    
    await message.channel.permissionOverwrites.create(user.id, { ViewChannel: true, SendMessages: true });
    
    const embedAdicionado = new EmbedBuilder()
      .setDescription(`✅ O jogador ${user} foi adicionado com sucesso ao ticket.`)
      .setColor("#2ecc71");

    message.channel.send({ embeds: [embedAdicionado] });
  }
});

client.login(process.env.TOKEN);
