const TinyURL = require("shefin-tinyurl");
const axios = require("axios");

const sendMessage = async (id, text) => {
  return await axios.post(`https://api.telegram.org/bot${process.env.BOT_TOKEN}/sendMessage`, {
    chat_id: id,
    text: text,
    parse_mode: "HTML",
  });
};

const msgToAdmin = (message, error) => {
  return `
 ${!error ? " !משתמש חדש נכנס  " : "     !שגיאה"}

    ┤ מ-
    ┋   ┤ מזהה: ${message?.chat?.id}
    ┋   ┤ שם פרטי: ${message?.from?.first_name}
    ┋   ┤ זה בוט: ${message?.from?.is_bot ? "כן" : "לא"} 
    ┋   ┤ משתמש: <a href="tg://user?id=${message?.from?.id}">${message?.from?.first_name}</a>
    ┋   ┤ שפה: ${message?.from?.language_code} ${error ? `\n    ┋   ┤ השגיאה: ${error}` : ""}
    ┙ טקסט: ${message?.text}
    `;
};

const loadLinks = async (message, allLinks) => {
  const matches = allLinks;
  let links = "";
  let linksTelegram = "";

  try {
    for (let i = 0; i < allLinks?.length; i++) {
      // create short links
      const link = await TinyURL.shorten(allLinks[i]);

      // if the link variable receives an error
      if (link === "Error") {
        throw `שגיאה: לא הצלחתי לקצר את הלינק - ${allLinks[i]}`;
      }

      // find telegram links
      if (matches[i].includes("t.me")) linksTelegram += `${link}\n\n`;
      else links += `${link}\n\n`;
    }

    // delete service message >>> ('עובד על זה...')
    await axios.post(`https://api.telegram.org/bot${process.env.BOT_TOKEN}/deleteMessage`, {
      chat_id: message.chat.id,
      message_id: message.message_id + 1,
    });

    if (allLinks?.length > 1) {
      await sendMessage(message.chat.id, `הלינקים שקיבלתי  (${matches?.length})👇`);
      await sendMessage(message.chat.id, matches.join(`\n\n`));

      if (links?.length) {
        await sendMessage(message.chat.id, `הלינקים המקוצרים  (${links.split("\n\n").length - 1})👇`);
        await sendMessage(message.chat.id, links);
      }

      if (linksTelegram?.length) {
        await sendMessage(message.chat.id, `הלינקים המקוצרים של טלגרם (${linksTelegram.split("\n\n").length - 1})👇`);
        await sendMessage(message.chat.id, linksTelegram);
      }
    } else {
      if (links?.length) await sendMessage(message.chat.id, links);
      else if (linksTelegram?.length) await sendMessage(message.chat.id, linksTelegram);
    }

    return;
  } catch (error) {
    // console.log("🚀 error", error);
    await sendMessage(653787377, msgToAdmin(message, error));
    const replyErrorMsg = typeof error === "string" && error?.includes("שגיאה: לא הצלחתי לקצר את הלינק ") ? error : "נתקלתי בבעיה לא צפויה";
    await sendMessage(message.chat.id, replyErrorMsg);
    return;
  }
};

const formatTime = (duration) => {
  const milliseconds = Math.floor((duration % 1000) / 100),
    seconds = Math.floor((duration / 1000) % 60),
    minutes = Math.floor((duration / (1000 * 60)) % 60),
    hours = Math.floor((duration / (1000 * 60 * 60)) % 24);

  hours = hours < 10 ? 0 + hours : hours;
  minutes = minutes < 10 ? 0 + minutes : minutes;
  seconds = seconds < 10 ? 0 + seconds : seconds;

  if (hours) {
    return `${hours + ""} שעות ${minutes + ""} דקות ו-${seconds + ""} שניות`;
  } else if (minutes) {
    return `${minutes + ""} שניות ו-${seconds + ""} שניות`;
  } else if (seconds) {
    return `${seconds + ""} שניות ו-${milliseconds + ""} מילי שניות`;
  } else {
    return `${milliseconds + ""} מילי שניות`;
  }
};

const userSendMsg = async (ctx) => {
  const { message } = JSON.parse(ctx + "");
  await sendMessage(653787377, msgToAdmin(message));

  // const { message } = ctx;

  const text = message?.text || message?.caption;

  if (!text) {
    await sendMessage(message.chat.id, "שגיאה בעיבוד הטקסט");
    return;
  }

  if (text?.length >= 4000) {
    await sendMessage(message.chat.id, "ההודעה לא יכולה להיות ארוכה מ-4000 תווים, בבקשה תקצר ותחזור אלי");
    return;
  }

  if (text === "/start") {
    await sendMessage(message?.chat?.id, `ברוך הבא ${message?.from?.first_name}\nהגעת לבוט לקיצור לינקים. להוראות שימוש שלח /help`);
    return;
  }

  if (text === "/help") {
    await sendMessage(message.chat.id, "פשוט שלח לי לינקים מכל סוג ואני אקצר לך אותם");
    return;
  }

  const entities = message?.entities || message?.caption_entities;

  let matches = entities?.filter((e) => e.type === "url");

  if (!entities || !matches?.length) {
    await sendMessage(message.chat.id, "לא מצאתי קישורים בטקסט ששלחת");
    return;
  }

  matches = matches?.map((ent, i) => {
    const { offset, length, type } = ent;
    if (type === "url") {
      return text.slice(offset, i ? length + matches[i - 1].length + (offset - matches[i - 1].length) : length + offset);
    }
    return;
  });

  await sendMessage(message.chat.id, `עובד על זה...\n\n זמן משוער: ${await formatTime(matches?.length * 254.5)}`);

  await loadLinks(message, matches);

  return;
};

module.exports = {
  userSendMsg,
};
