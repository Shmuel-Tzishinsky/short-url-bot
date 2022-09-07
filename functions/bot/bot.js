const { Telegraf } = require("telegraf");
const { userSendMsg } = require("./actions");
// require("dotenv").config();

const bot = new Telegraf(process.env.BOT_TOKEN);

// bot.on("text", userSendMsg);
// bot.on("forward_date", userSendMsg);

// bot.launch();

exports.handler = async (event) => {
  try {
    await userSendMsg(event.body, bot);

    return { statusCode: 200, body: "" };
  } catch (e) {
    console.log(e);
    return { statusCode: 400, body: "This endpoint is meant for bot and telegram communication" };
  }
};
