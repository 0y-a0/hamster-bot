const TelegramBot = require('node-telegram-bot-api');
const express = require('express');

const token = '6302799889:AAGn-3PU4iPsoNibGHkVrwJ5XzUR36qcmOA'; // Замените на ваш токен
const adminChatId = 1119372110; // Замените на ваш ID администратора

const bot = new TelegramBot(token, { polling: true });
const app = express();
const port = process.env.PORT || 3000;

bot.setMyCommands([{ command: "start", description: "Start the bot" }]);

const userData = {};

// Функция для начала процесса
const startProcess = (chatId) => {
    bot.sendMessage(chatId, '> Reviews \\- https://t\\.me/hamster\\_friends\\_reviews', { parse_mode: "MarkdownV2" });

    // Начинаем процесс с текущими данными
    if (!userData[chatId]) {
        userData[chatId] = {
            firstName: '',
            lastName: '',
            username: '',
            amount: null,
            link: null,
            choice: null,
            paymentConfirmed: false,
            awaitingScreenshot: false
        };
    }

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

// Функция для сброса данных пользователя
const resetUserData = (chatId) => {
    userData[chatId] = {
        ...userData[chatId], // Сохраняем существующие данные
        amount: null,
        link: null,
        choice: null,
        paymentConfirmed: false,
        awaitingScreenshot: false
    };
};

bot.onText(/(^\/start$)/, (msg) => {
    const chatId = msg.chat.id;
    const firstName = msg.from.first_name || '';
    const lastName = msg.from.last_name || '';
    const username = msg.from.username || '';

    if (!userData[chatId]) {
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
    } else {
        // Обновляем имя пользователя, если его нет
        userData[chatId] = {
            ...userData[chatId],
            firstName,
            lastName,
            username
        };
    }

    startProcess(chatId);
});

bot.on('message', (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text ? msg.text.trim() : ''; // Убираем пробелы вокруг текста
    const photo = msg.photo;

    if (!userData[chatId]) return; // Если нет данных пользователя, игнорируем сообщение
 

    if (text === '/start') {
        // Сбрасываем данные пользователя и начинаем процесс заново
        resetUserData(chatId);
        return; // Прерываем выполнение, чтобы не обрабатывать следующее сообщение
    }


    if (userData[chatId].awaitingScreenshot && photo) {
        userData[chatId].paymentConfirmed = true;
        userData[chatId].awaitingScreenshot = false;
        
        const userInfo = userData[chatId];
        const message = `
            Користувач: ${userInfo.firstName} ${userInfo.lastName} (@${userInfo.username})
            Кількість: ${Number(userInfo.amount) * 2}
            Посилання: ${userInfo.link}
            Вибір: ${userInfo.choice}
        `;
        bot.sendPhoto(adminChatId, photo[photo.length - 1].file_id, { caption: message });

        bot.sendMessage(chatId, 'Thanks for the confirmation. If the screenshot and payment are real, friends will be added within ~ 3 hours, I will text you. And if they are fake, you are gay🏳️‍🌈. If you have questions write here @dvd8ew. <b>Want more referrals?</b>', {
            parse_mode: "HTML",
            reply_markup: JSON.stringify({
                keyboard: [
                    [{ text: 'Yes' }]
                ],
                resize_keyboard: true,
                one_time_keyboard: true
            })
        });

        // Не сбрасываем данные, просто убираем флаг ожидания скриншота
        userData[chatId].awaitingScreenshot = false;
    } else if (userData[chatId].awaitingScreenshot && !photo) {
       
        bot.sendMessage(chatId, 'Please send a screenshot with the payment amount🔄')
        
    } else if (userData[chatId].amount === null && ['1', '2', '3', '4', '5'].includes(text)) {
        userData[chatId].amount = parseInt(text) / 2;
        const ammo = userData[chatId].amount.toFixed(1);
        bot.sendMessage(chatId, `> It will cost ${ammo.replace('.', ',')} $ _\\+commission_  
Give me your *link from Hamster*🐹, but make sure it's _your link_\\. *This is important*\\. 📍`, { parse_mode: "MarkdownV2" });
    } else if (userData[chatId].amount !== null && userData[chatId].link === null) {
        if (text.includes('kentId')) {
            userData[chatId].link = text;

            const options = {
                parse_mode: "HTML",
                reply_markup: JSON.stringify({
                    keyboard: [
                        [{ text: 'Credit Card💳+' }, { text: 'PayPal🅿️+' }, { text: 'Crypto ₿✴️+' }]
                    ],
                    resize_keyboard: true,
                    one_time_keyboard: true
                })
            };

            bot.sendMessage(chatId, `<code>Сhoose which payment method is better 🔑</code><blockquote><b>Credit card💳</b></blockquote>
<blockquote><b>PayPal🅿️</b></blockquote>
<blockquote><b>Сryptocurrency ₿✴️</b></blockquote>

You can just sign up in <b>PayPal</b>, connect your card and send by email ☄️

<b>If you have questions, or suggestions for new payment method, write here @dvd8ew 🪬</b>`, options);
        } else if (text !== '/start') {
            bot.sendMessage(chatId, 'The link is incorrect. Please provide a valid link.');
        }
    } else if (userData[chatId].link !== null && userData[chatId].choice === null && ['Credit Card💳+', 'PayPal🅿️+', 'Crypto ₿✴️+'].includes(text)) {
        userData[chatId].choice = text;
        
        const userInfo = userData[chatId];
        const adminMessage = `
            Користувач: ${userInfo.firstName} ${userInfo.lastName} (@${userInfo.username})
            Кількість: ${Number(userInfo.amount) * 2}
            Посилання: ${userInfo.link}
            Вибір: ${userInfo.choice}
        `;
        bot.sendMessage(adminChatId, adminMessage);

        if (text === 'PayPal🅿️+' || text === 'Credit Card💳+') {
            const amount = userData[chatId].amount;
            let paymentLink;

            if (text === 'PayPal🅿️+') {
                paymentLink = `https://www.paypal.com/cgi-bin/webscr?cmd=_xclick&business=taktoya1@gmail.com&amount=${amount}&currency_code=USD&item_name=Referrals&return=http://example.com/paypal-return&cancel_return=http://example.com/paypal-cancel`;
                bot.sendPhoto(chatId, 'https://www.paypalobjects.com/webstatic/icon/pp258.png', {
                    caption: `<b>Click the link to make payment:</b>\n<a href="${paymentLink}">Click here</a>`,
                    parse_mode: 'HTML'
                });
                bot.sendMessage(chatId, 'Or you can do it yourself\n> 🅿️ \\- `taktoya1@gmail\\.com`', { parse_mode: "MarkdownV2" })
            } else if (text === 'Credit Card💳+') {
                paymentLink = 'https://st.depositphotos.com/20838724/57406/v/450/depositphotos_574067204-stock-illustration-credit-card-payment-line-icon.jpg';
                bot.sendPhoto(chatId, paymentLink, {
                    caption: `<b>Credit card information👾:</b>\n<blockquote>Credit Card Number: <code>5168752023286407</code></blockquote>\n<blockquote>Name: <code>FOSHCHAN IVAN</code></blockquote>\n<blockquote>Expiry Date: <code>08/26</code></blockquote>\n<blockquote>Amount: <code>${amount.toFixed(1).replace('.', ',')}</code> $</blockquote>`,
                    parse_mode: 'HTML'
                });
            }

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
                userData[chatId].awaitingScreenshot = true; // Set to true to wait for screenshot
            }, 3000);
        } else if (text === 'Crypto ₿✴️+') {
            bot.sendMessage(chatId, 'Сontact @dvd8ew, tell there what cryptocurrency and what network for the cryptocurrency you have chosen✴️')
            setTimeout(()=>{bot.sendMessage(chatId, 'Want more referrals?', {
                reply_markup: JSON.stringify({
                    keyboard: [
                        [{ text: 'Yes' }]
                    ],
                    resize_keyboard: true,
                    one_time_keyboard: true
                })
            });},1000)
            userData[chatId].awaitingScreenshot = false; // No screenshot required
        }
    } else if ((userData[chatId].choice === 'Credit Card💳+' || userData[chatId].choice === 'PayPal🅿️+') && text === 'Yes') {
        bot.sendMessage(chatId, 'Restarting the process...');
        setTimeout(() => {
            resetUserData(chatId);
            startProcess(chatId);
        }, 1000); // Delay before restarting
    } else if (userData[chatId].choice === 'Crypto ₿✴️+' && text === 'Yes') {
        bot.sendMessage(chatId, 'Restarting the process...');
        setTimeout(() => {
            resetUserData(chatId);
            startProcess(chatId);
        }, 1000); // Delay before restarting
    }
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});

// ${Attach your nickname or @username from <b>tg🔷</b> to the money transfer ☄️<b>(not necessary)</b>}
