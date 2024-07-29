const TelegramBot = require('node-telegram-bot-api');
const express = require('express');

const token = '6302799889:AAGn-3PU4iPsoNibGHkVrwJ5XzUR36qcmOA';
const adminChatId = 1119372110;

const bot = new TelegramBot(token, { polling: true });
const app = express();
const port = process.env.PORT || 3000;

bot.setMyCommands([{ command: "start", description: "Start the bot" }]);

const userData = {};

const startProcess = (chatId) => {
    const firstName = userData[chatId].firstName;
    const lastName = userData[chatId].lastName;
    const username = userData[chatId].username;

    userData[chatId] = {
        firstName,
        lastName,
        username,
        amount: null,
        link: null,
        choice: null,
        paymentConfirmed: false,
        awaitingScreenshot: false
    };

    const options = {
        parse_mode: "MarkdownV2",
        reply_markup: JSON.stringify({
            keyboard: [
                [{ text: '1' }, { text: '2' }, { text: '3' }, { text: '4' }, { text: '5' }]
            ],
            resize_keyboard: true,
            one_time_keyboard: true
        })
    };

    bot.sendMessage(chatId, '🐹 Select the number of *referrals* you want:', options);
};


bot.onText(/(^\/start$)/, (msg) => {
    const chatId = msg.chat.id;
    const firstName = msg.from.first_name;
    const lastName = msg.from.last_name || '';
    const username = msg.from.username || '';

    userData[chatId] = {
        firstName,
        lastName,
        username,
        amount: null,
        link: null,
        choice: null,
        paymentConfirmed: false,
        awaitingScreenshot: false
    };

    startProcess(chatId);
});

bot.on('message', (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text;
    const photo = msg.photo;

    if (userData[chatId] && userData[chatId].awaitingScreenshot && photo) {
        userData[chatId].paymentConfirmed = true;
        userData[chatId].awaitingScreenshot = false;

        const userInfo = userData[chatId];
        const message = `
            Користувач: ${userInfo.firstName} ${userInfo.lastName} (@${userInfo.username})
            Кількість: ${userInfo.amount}
            Посилання: ${userInfo.link}
            Вибір: ${userInfo.choice}
        `;
        bot.sendPhoto(adminChatId, photo[photo.length - 1].file_id, { caption: message });

        bot.sendMessage(chatId, 'Thanks for the confirmation, friend will be added within ~ 3 hours. If you have questions write here @dvd8ew. Want more referrals?', {
            reply_markup: JSON.stringify({
                keyboard: [
                    [{ text: 'Yes' }]
                ],
                resize_keyboard: true,
                one_time_keyboard: true
            })
        });
    } else if (userData[chatId] && userData[chatId].awaitingScreenshot && !photo) {
        bot.sendMessage(chatId, 'Please send a screenshot.');
    } else if (userData[chatId] && userData[chatId].amount === null && ['1', '2', '3', '4', '5'].includes(text)) {
        userData[chatId].amount = parseInt(text);
        bot.sendMessage(chatId, `> It will cost ${text} $  
Give me your *link from Hamster*🐹, but make sure it's _your link_\\. *This is important*\\. 📍`, { parse_mode: "MarkdownV2" });
    } else if (userData[chatId] && userData[chatId].amount !== null && userData[chatId].link === null) {
        if (text.includes('kentId') || text === '/start') {
            userData[chatId].link = text;

            const options = {
                parse_mode: "HTML",
                reply_markup: JSON.stringify({
                    keyboard: [
                        [{ text: 'Credit Card💳+' }, { text: 'PayPal🅿️+' }]
                    ],
                    resize_keyboard: true,
                    one_time_keyboard: true
                })
            };

            bot.sendMessage(chatId, `<code>Сhoose which payment method is better 🔑</code><blockquote><b>Credit card💳</b></blockquote>
<blockquote><b>PayPal🅿️</b></blockquote>You can just sign up in <b>PayPal</b>, connect your card and send by this email 🪄

Attach your nickname or @username from <b>tg🔷</b> to the money transfer ☄️<b>(not necessary)</b>

<b>If you have questions or suggestions for payment, write here @dvd8ew 🪬</b>`, options);
        } else {
            bot.sendMessage(chatId, 'The link is incorrect. Please provide a valid link.');
        }
    } else if (userData[chatId] && userData[chatId].link !== null && userData[chatId].choice === null && ['Credit Card💳+', 'PayPal🅿️+'].includes(text)) {
        userData[chatId].choice = text;

        
        const userInfo = userData[chatId];
        const adminMessage = `
            Користувач: ${userInfo.firstName} ${userInfo.lastName} (@${userInfo.username})
            Кількість: ${userInfo.amount}
            Посилання: ${userInfo.link}
            Вибір: ${userInfo.choice}
        `;
        bot.sendMessage(adminChatId, adminMessage);

        if (text === 'PayPal🅿️+') {
            const amount = userData[chatId].amount;
            const paymentLink = `https://www.paypal.com/cgi-bin/webscr?cmd=_xclick&business=taktoya1@gmail.com&amount=${amount}&currency_code=USD&item_name=Referrals&return=http://example.com/paypal-return&cancel_return=http://example.com/paypal-cancel`;

            userData[chatId].paypalPaymentLink = paymentLink;

            bot.sendPhoto(chatId, 'https://www.paypalobjects.com/webstatic/icon/pp258.png', {
                caption: `<b>Click the link to make payment:</b>\n<a href="${paymentLink}">Click here</a>`,
                parse_mode: 'HTML'
            });

            setTimeout(() => {
                bot.sendMessage(chatId, 'Did you manage to make the payment? 📫', {
                    reply_markup: JSON.stringify({
                        keyboard: [
                            [{ text: 'Yes' }]
                        ],
                        resize_keyboard: true,
                        one_time_keyboard: true
                    })
                });
            }, 3000);
        } else if (text === 'Credit Card💳+') {
            bot.sendPhoto(chatId, 'https://st.depositphotos.com/20838724/57406/v/450/depositphotos_574067204-stock-illustration-credit-card-payment-line-icon.jpg', {
                caption: '<b>Credit card information👾:</b>\n<blockquote>Credit Card Number: <code>5168752023286407</code></blockquote>\n<blockquote>Name: <code>FOSHCHAN IVAN</code></blockquote>\n<blockquote>Expiry Date: <code>08/26</code></blockquote>',
                parse_mode: 'HTML'
            });

            setTimeout(() => {
                bot.sendMessage(chatId, 'Did you manage to make the payment? 📫', {
                    reply_markup: JSON.stringify({
                        keyboard: [
                            [{ text: 'Yes' }]
                        ],
                        resize_keyboard: true,
                        one_time_keyboard: true
                    })
                });
            }, 3000);
        }
    } else if (userData[chatId] && userData[chatId].choice !== null && text === 'Yes' && !userData[chatId].paymentConfirmed) {
        userData[chatId].awaitingScreenshot = true;
        bot.sendMessage(chatId, 'Post a screenshot of the transaction to prove');
    } else if (userData[chatId] && userData[chatId].paymentConfirmed && text === 'Yes') {
        startProcess(chatId);
    } else if (userData[chatId] && userData[chatId].choice !== null && text !== 'Yes') {
        
    }
});

bot.on('polling_error', (error) => {
    console.error('Polling error:', error);
});

app.get('/', (req, res) => {
    res.send('Telegram bot server is running.');
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
