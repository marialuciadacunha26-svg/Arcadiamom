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
    .setDescription("Mostra o seu inventário de itens do Discord."),

  new SlashCommandBuilder()
    .setName("trocar")
    .setDescription("Inicia uma proposta de troca avançada com outro jogador.")
    .addUserOption(option => 
      option.setName("usuario")
        .setDescription("Selecione o jogador com quem deseja negociar")
        .setRequired(true))
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

  // 🔄 /trocar (SISTEMA DE TROCA AVANÇADO)
  if (commandName === "trocar") {
    const alvo = interaction.options.getUser("usuario");
    if (!alvo) return interaction.reply({ content: "❌ Você precisa mencionar um jogador para trocar.", ephemeral: true });
    if (alvo.id === interaction.user.id) return interaction.reply({ content: "❌ Você não pode trocar com você mesmo.", ephemeral: true });
    if (alvo.bot) return interaction.reply({ content: "❌ Você não pode trocar com um bot.", ephemeral: true });

    const invAutor = db.inventory[interaction.user.id] || [];
    if (invAutor.length === 0) return interaction.reply({ content: "❌ Seu inventário está vazio. Você não tem nada para oferecer!", ephemeral: true });

    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId(`troca_oferecer_${interaction.user.id}_${alvo.id}`)
      .setPlaceholder("🎁 Selecione o item que você deseja oferecer")
      .setMaxValues(1);

    invAutor.slice(0, 25).forEach((item, index) => {
      selectMenu.addOptions(
        new StringSelectMenuOptionBuilder()
          .setLabel(item)
          .setValue(`${item}_${index}`)
          .setEmoji("📦")
      );
    });

    const rowMenu = new ActionRowBuilder().addComponents(selectMenu);

    const embedProposta = new EmbedBuilder()
      .setTitle("🔄 Proposta de Troca Iniciada")
      .setDescription(`Olá ${alvo}! O jogador ${interaction.user} quer iniciar uma troca avançada com você.\n\n**Passo 1:** ${interaction.user} deve selecionar o item que vai oferecer no menu abaixo.`)
      .setColor("#ffcc00")
      .setFooter({ text: "Arcadiamon • Sistema de Trocas Seguras" });

    await interaction.reply({ content: `${alvo}`, embeds: [embedProposta], components: [rowMenu] });
  }
});

// ================= PROCESSANDO A SELEÇÃO DO MENU DE TICKETS =================
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

// ================= INTERAÇÕES INTERNAS DOS COMPONENTES DE TROCA E TICKETS =================
const trocasAtivas = new Map();

client.on("interactionCreate", async (interaction) => {
  // --- PARTE 1: SELEÇÃO DE ITENS DA TROCA ---
  if (interaction.isStringSelectMenu() && interaction.customId.startsWith("troca_oferecer_")) {
    const [,, autorId, alvoId] = interaction.customId.split("_");
    if (interaction.user.id !== autorId) return interaction.reply({ content: "❌ Apenas quem iniciou a troca pode selecionar o item.", ephemeral: true });

    const itemNome = interaction.values[0].split("_")[0];
    trocasAtivas.set(`${autorId}_${alvoId}`, { itemAutor: itemNome, itemAlvo: null, confirmouAutor: false, confirmouAlvo: false });

    const invAlvo = db.inventory[alvoId] || [];
    if (invAlvo.length === 0) {
      const botoesConfirmacao = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId(`troca_b_aceitar_${autorId}_${alvoId}`).setLabel("Aceitar Troca ✅").setStyle(ButtonStyle.Success),
        new ButtonBuilder().setCustomId(`troca_b_recusar_${autorId}_${alvoId}`).setLabel("Recusar Troca ❌").setStyle(ButtonStyle.Danger)
      );
      const embedSemItens = new EmbedBuilder()
        .setTitle("🔄 Confirmação de Troca (Doação)")
        .setDescription(`👤 **Doador:** <@${autorId}> envia: **${itemNome}**\n👤 **Recebedor:** <@${alvoId}> *(Não possui itens)*\n\nAmbos precisam clicar em **Aceitar Troca**!`)
        .setColor("#ffcc00");
      return interaction.update({ embeds: [embedSemItens], components: [botoesConfirmacao] });
    }

    const selectMenuAlvo = new StringSelectMenuBuilder().setCustomId(`troca_contraproposta_${autorId}_${alvoId}`).setPlaceholder("🎁 Selecione o item que você dará em troca").setMaxValues(1);
    invAlvo.slice(0, 25).forEach((item, index) => {
      selectMenuAlvo.addOptions(new StringSelectMenuOptionBuilder().setLabel(item).setValue(`${item}_${index}`).setEmoji("📦"));
    });

    await interaction.update({ embeds: [new EmbedBuilder().setTitle("🔄 Troca - Contraproposta").setDescription(`👤 <@${autorId}> ofereceu: **${itemNome}**\n\n**Passo 2:** <@${alvoId}>, selecione sua contraproposta no menu abaixo.`).setColor("#ffcc00")], components: [new ActionRowBuilder().addComponents(selectMenuAlvo)] });
  }

  if (interaction.isStringSelectMenu() && interaction.customId.startsWith("troca_contraproposta_")) {
    const [,, autorId, alvoId] = interaction.customId.split("_");
    if (interaction.user.id !== alvoId) return interaction.reply({ content: "❌ Apenas o jogador desafiado pode contrapropor.", ephemeral: true });

    const dadosTroca = trocasAtivas.get(`${autorId}_${alvoId}`);
    if (!dadosTroca) return interaction.reply({ content: "❌ Sessão de troca inválida.", ephemeral: true });

    dadosTroca.itemAlvo = interaction.values[0].split("_")[0];

    const botoesConfirmacao = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId(`troca_b_aceitar_${autorId}_${alvoId}`).setLabel("Aceitar Troca ✅").setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId(`troca_b_recusar_${autorId}_${alvoId}`).setLabel("Recusar Troca ❌").setStyle(ButtonStyle.Danger)
    );

    await interaction.update({ embeds: [new EmbedBuilder().setTitle("🤝 Revisão Final da Troca").setDescription(`Analise os termos antes de confirmar:\n\n🟢 **Oferta de <@${autorId}>:** \`${dadosTroca.itemAutor}\`\n🔵 **Oferta de <@${alvoId}>:** \`${dadosTroca.itemAlvo}\`\n\n*Clique em Aceitar Troca para validar!*`).setColor("#3498db")], components: [botoesConfirmacao] });
  }

  // --- PARTE 2: BOTÕES DE CONFIRMAÇÃO DA TROCA ---
  if (interaction.isButton() && interaction.customId.startsWith("troca_b_")) {
    const [,,, acao, autorId, alvoId] = interaction.customId.split("_");
    if (interaction.user.id !== autorId && interaction.user.id !== alvoId) return interaction.reply({ content: "❌ Você não faz parte desta troca.", ephemeral: true });

    if (acao === "recusar") {
      trocasAtivas.delete(`${autorId}_${alvoId}`);
      return interaction.update({ embeds: [new EmbedBuilder().setDescription(`❌ A troca entre <@${autorId}> e <@${alvoId}> foi cancelada.`).setColor("#e74c3c")], components: [] });
    }

    if (acao === "aceitar") {
      const dadosTroca = trocasAtivas.get(`${autorId}_${alvoId}`);
      if (!dadosTroca) return interaction.reply({ content: "❌ Erro ao processar a troca.", ephemeral: true });

      if (interaction.user.id === autorId) dadosTroca.confirmouAutor = true;
      if (interaction.user.id === alvoId) dadosTroca.confirmouAlvo = true;

      if (!dadosTroca.confirmouAutor || !dadosTroca.confirmouAlvo) {
        return interaction.reply({ content: `⏳ ${interaction.user} aceitou! Aguardando o outro jogador...`, ephemeral: false });
      }

      let invAutor = db.inventory[autorId] || [];
      let invAlvo = db.inventory[alvoId] || [];

      const idxA = invAutor.indexOf(dadosTroca.itemAutor);
      if (idxA > -1) invAutor.splice(idxA, 1);
      invAlvo.push(dadosTroca.itemAutor);

      if (dadosTroca.itemAlvo) {
        const idxB = invAlvo.indexOf(dadosTroca.itemAlvo);
        if (idxB > -1) invAlvo.splice(idxB, 1);
        invAutor.push(dadosTroca.itemAlvo);
      }

      db.inventory[autorId] = invAutor;
      db.inventory[alvoId] = invAlvo;
      saveDB();
      trocasAtivas.delete(`${autorId}_${alvoId}`);

      await interaction.update({ embeds: [new EmbedBuilder().setTitle("🎉 TROCA CONCLUÍDA!").setDescription(`📦 <@${autorId}> recebeu: \`${dadosTroca.itemAlvo || "Nenhum"}\`\n📦 <@${alvoId}> recebeu: \`${dadosTroca.itemAutor}\``).setColor("#2ecc71")], components: [] });
    }
  }

  // --- PARTE 3: GERENCIAMENTO DOS BOTÕES DOS TICKETS ---
  if (interaction.isButton() && !interaction.customId.startsWith("troca_b_")) {
    if (interaction.customId === "claim_ticket") {
      if (!interaction.member.permissions.has(PermissionsBitField.Flags.ModerateMembers)) return interaction.reply({ content: "Apenas Staff pode assumir este ticket!", ephemeral: true });
      await interaction.reply({ embeds: [new EmbedBuilder().setDescription(`🚨 O moderador ${interaction.user} assumiu este ticket!`).setColor("#e67e22")] });
    }

    if (interaction.customId === "close_ticket") {
      await interaction.reply({ embeds: [new EmbedBuilder().setDescription("🔒 Canal marcado para encerramento em 5 segundos...").setColor("#e74c3c")] });
      if (db.ai_tickets[interaction.channel.id]) { delete db.ai_tickets[interaction.channel.id]; saveDB(); }
      setTimeout(() => { interaction.channel.delete().catch(() => {}); }, 5000);
    }

    if (interaction.customId === "staff_panel") {
      if (!interaction.member.permissions.has(PermissionsBitField.Flags.ModerateMembers)) return interaction.reply({ content: "❌ Apenas a Staff pode abrir este painel.", ephemeral: true });
      const rowStaff = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId("staff_add_user").setLabel("Adicionar Usuário 👤").setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId("staff_renomear").setLabel("Renomear Canal 📝").setStyle(ButtonStyle.Secondary)
      );
      await interaction.reply({ embeds: [new EmbedBuilder().setTitle("🛠️ Painel Staff").setDescription("Selecione uma função administrativa:").setColor("#2c3e50")], components: [rowStaff], ephemeral: true });
    }

    if (interaction.customId === "staff_add_user") {
      await interaction.reply({ embeds: [new EmbedBuilder().setDescription("💡 Para adicionar um jogador use: `!adicionar @usuario`").setColor("#34495e")], ephemeral: true });
    }

    if (interaction.customId === "staff_renomear") {
      await interaction.channel.setName(`resolvido-${interaction.channel.name.split("-")[1] || ""}`);
      await interaction.reply({ embeds: [new EmbedBuilder().setDescription("✅ Canal renomeado para resolvido!").setColor("#2ecc71")], ephemeral: true });
    }
  }
});

// ================= RESPONDEDOR DA IA AVANÇADO (RESPOSTAS VARIADAS) =================
client.on("messageCreate", async (message) => {
  if (message.author.bot) return;

  if (db.ai_tickets[message.channel.id]) {
    await message.channel.sendTyping();

    const pergunta = message.content.toLowerCase();
    
    // Lista de saudações aleatórias
    const respostasPadrao = [
      `Olá! Eu sou o assistente virtual da **Arcadiamon**. Conte-me detalhadamente o que está acontecendo para que eu possa te ajudar agora mesmo!`,
      `Salve, treinador! Sou a IA de suporte. Pode mandar sua dúvida aqui no chat! Se o seu problema for muito complexo, a nossa Staff humana será acionada automaticamente pelos botões do topo.`,
      `Bem-vindo ao suporte automático **Arcadiamon**! Como posso ser útil na sua jornada hoje? Descreva o seu problema abaixo.`
    ];
    
    let respostaTexto = respostasPadrao[Math.floor(Math.random() * respostasPadrao.length)];

    // 1️⃣ OPÇÕES DE RESPOSTAS: COMO ENTRAR
    if (pergunta.includes("ip") || pergunta.includes("porta") || pergunta.includes("conectar") || pergunta.includes("entrar") || pergunta.includes("como entra")) {
      const variacoesEntrar = [
        `📡 **CENTRAL DE CONEXÃO | ARCADIAMON**\n\nPara entrar no servidor de Minecraft Bedrock (Celular/Console/PC), configure estes dados:\n\n• 🌐 **IP / Endereço:** \`arcadiamon.blazebr.xyz\`\n• 🔌 **Porta:** \`28606\`\n\nAbra o jogo, vá em Servidores ➔ Adicionar Servidor, salve esses dados e clique em Entrar!`,
        `🎮 **SESSÃO DE CONEXÃO DIRETA**\n\nQuer entrar no mundo Arcadiamon? Siga os dados abaixo no seu Minecraft Pocket Edition / Bedrock:\n\n➔ **IP:** \`arcadiamon.blazebr.xyz\`\n➔ **Porta:** \`28606\`\n\nBasta adicionar na sua aba de servidores externos e começar sua jornada!`,
        `⚡ **CONECTE-SE AGORA NO SERVIDOR**\n\nPronto para se tornar uma lenda? Adicione o nosso servidor oficial no seu Minecraft:\n\n📌 **Endereço (IP):** \`arcadiamon.blazebr.xyz\`\n🔌 **Porta Padrão:** \`28606\`\n\nMande um print do erro aqui no chat se tiver problemas para logar!`
      ];
      respostaTexto = variacoesEntrar[Math.floor(Math.random() * variacoesEntrar.length)];
    
    // 2️⃣ OPÇÕES DE RESPOSTAS: PEGAR COISAS DO MOD / POKEPEDIA
    } else if (pergunta.includes("pegar") || pergunta.includes("mod") || pergunta.includes("pixelmon") || pergunta.includes("pokemon") || pergunta.includes("item") || pergunta.includes("como ganha") || pergunta.includes("pega") || pergunta.includes("pokepedia") || pergunta.includes("pokedex")) {
      const variacoesJogo = [
        `🎮 **GUIA DE JOGO | ITENS E POKÉPEDIA**\n\nNo Arcadiamon, tudo funciona direto no seu Minecraft:\n\n• 🧬 **Inicial:** Escolha seu primeiro Pokémon na interface que abre ao entrar pela primeira vez.\n• 📦 **Kits:** Digite \`/kit\` ou \`/kit inicial\` no chat do jogo para ganhar suas primeiras Pokébolas.\n• 📖 **Poképédia:** Quer ver evoluções e dados de um Pokémon? Digite \`/pokepedia\` ou \`/pokedex\` no chat do Minecraft para abrir o menu do mod.\n• 🌲 **Capturas:** Explore o mapa selvagem e jogue suas Pokébolas nos Pokémons para pegá-los!`,
        `🎒 **MANUAL DE SOBREVIVÊNCIA POKÉMON**\n\nAprenda a pegar seus recursos dentro do nosso servidor:\n\n1️⃣ Use o comando \`/kit inicial\` no chat do servidor para resgatar ferramentas e Pokébolas.\n2️⃣ Use \`/pokepedia\` no jogo sempre que quiser ver informações de golpes, fraquezas ou evoluções das criaturas.\n3️⃣ Se você comprou itens na nossa Loja e quer resgatar, informe o seu nick do jogo aqui no ticket e aguarde um Administrador!`,
        `🧬 **DICAS DE INÍCIO | ARCADIAMON MOD**\n\nPara evoluir rápido e coletar itens no servidor do Minecraft, utilize os comandos do chat in-game:\n\n➔ \`/kit\` para coletar seus itens grátis de treinador.\n➔ \`/pokepedia\` para abrir a enciclopédia oficial de evolução Pokémon dentro do próprio jogo.\n\nTodos os Pokémons selvagens do mapa podem ser capturados batalhando e jogando Pokébolas neles!`
      ];
      respostaTexto = variacoesJogo[Math.floor(Math.random() * variacoesJogo.length)];
      
    // 3️⃣ OPÇÕES DE RESPOSTAS: LOJA / VIP
    } else if (pergunta.includes("vip") || pergunta.includes("comprar") || pergunta.includes("loja") || pergunta.includes("kit")) {
      const variacoesLoja = [
        `🛒 **LOJA E VANTAGENS VIP**\n\nInteressado em adquirir pacotes de moedas, kits exclusivos, insígnias ou Pokémons customizados? Acesse a nossa aba de anúncios do Discord ou aguarde um Diretor aqui neste ticket para te passar os valores e formas de pagamento!`,
        `💵 **SUPORTE FINANCEIRO E LOJA**\n\nPara compras de VIP ou Pokémons na nossa loja, por favor informe o seu Nick do Minecraft aqui no chat. Assim que um administrador ficar online, ele fará o seu atendimento manual.`
      ];
      respostaTexto = variacoesLoja[Math.floor(Math.random() * variacoesLoja.length)];

    // 4️⃣ OPÇÕES DE RESPOSTAS: BUGS E ERROS
    } else if (pergunta.includes("ajuda") || pergunta.includes("bug") || pergunta.includes("erro")) {
      const variacoesBugs = [
        `🔺 **CENTRAL DE ERROS E REPORTE**\n\nEncontrou uma falha ou bug no jogo? Ajude nossa equipe técnica a resolver enviando:\n\n1️⃣ Seu Nick exato no jogo.\n2️⃣ O que aconteceu de errado.\n3️⃣ Mande fotos ou vídeos do bug aqui no chat (se tiver).`,
        `🔧 **ÁREA TÉCNICA | REPORTAR FALHAS**\n\nLamentamos o transtorno! Para solucionarmos o seu problema o mais rápido possível, descreva o bug detalhadamente e anexe provas visuais aqui neste canal privado.`
      ];
      respostaTexto = variacoesBugs[Math.floor(Math.random() * variacoesBugs.length)];
    }

    await message.reply({ 
      embeds: [
        new EmbedBuilder()
          .setTitle("🤖 Suporte Automatizado Arcadiamon")
          .setDescription(respostaTexto)
          .setColor("#ffcc00")
          .setFooter({ text: "Arcadiamon • Respostas Dinâmicas Inteligentes" })
      ] 
    });
  }
});

// Comando !adicionar
client.on("messageCreate", async (message) => {
  if (message.content.startsWith("!adicionar")) {
    if (!message.member || !message.member.permissions.has(PermissionsBitField.Flags.ModerateMembers)) return;
    const user = message.mentions.users.first();
    if (!user) return message.reply("Mencione o usuário que você quer adicionar.");
    
    await message.channel.permissionOverwrites.create(user.id, { ViewChannel: true, SendMessages: true });
    message.channel.send({ embeds: [new EmbedBuilder().setDescription(`✅ O jogador ${user} foi adicionado com sucesso ao ticket.`).setColor("#2ecc71")] });
  }
});

client.login(process.env.TOKEN);
