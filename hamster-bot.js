const TelegramBot = require('node-telegram-bot-api');
const express = require('express');

// Замените 'YOUR_TELEGRAM_BOT_TOKEN' на токен вашего бота
const token = '6302799889:AAGn-3PU4iPsoNibGHkVrwJ5XzUR36qcmOA';

// Ваш личный Chat ID
const adminChatId = 1119372110;

// Создайте экземпляр бота
const bot = new TelegramBot(token, { polling: true });

const app = express();
const port = process.env.PORT || 3000;

bot.setMyCommands([{command: "start",description: "Start the bot"}]);



// Объект для хранения данных пользователей
const userData = {};

// Функция для начала процесса
const startProcess = (chatId) => {
    const firstName = userData[chatId].firstName;
    const lastName = userData[chatId].lastName;
    const username = userData[chatId].username;

    // Сброс данных пользователя
    userData[chatId] = {
        firstName,
        lastName,
        username,
        amount: null,
        link: null,
        choice: null,
        paymentConfirmed: false,
        awaitingScreenshot: false // добавлено новое состояние
    };

    // Определение клавиатуры с цифрами от 1 до 5
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

    // Отправка сообщения с клавиатурой
    bot.sendMessage(chatId, '🐹 Select the number of *referrals* you want:', options);
};

// Обработчик команды /start
bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    const firstName = msg.from.first_name;
    const lastName = msg.from.last_name || '';
    const username = msg.from.username || '';

    // Сохранение информации о пользователе
    userData[chatId] = {
        firstName,
        lastName,
        username,
        amount: null,
        link: null,
        choice: null,
        paymentConfirmed: false,
        awaitingScreenshot: false // добавлено новое состояние
    };

    startProcess(chatId);
});

// Обработчик текстовых сообщений
bot.on('message', (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text;
    const photo = msg.photo;

    if (userData[chatId] && userData[chatId].awaitingScreenshot && photo) {
        // Пользователь отправил скриншот
        userData[chatId].paymentConfirmed = true;
        userData[chatId].awaitingScreenshot = false;

        // Отправка подтверждения админу
        const userInfo = userData[chatId];
        const message = `
            Пользователь: ${userInfo.firstName} ${userInfo.lastName} (@${userInfo.username})
            Количество: ${userInfo.amount}
            Ссылка: ${userInfo.link}
            Выбор: ${userInfo.choice}
        `;
        bot.sendPhoto(adminChatId, photo[photo.length - 1].file_id,{ caption: message });

        // Подтверждение пользователю
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
        // Пользователь отправил что-то другое вместо скриншота
        bot.sendMessage(chatId, 'Please send a screenshot.');
    } else if (userData[chatId] && userData[chatId].amount === null && ['1', '2', '3', '4', '5'].includes(text)) {
        // Запись выбранного количества
        userData[chatId].amount = parseInt(text);
        bot.sendMessage(chatId, `> It will cost ${text} $  
Give me your *link from Hamster*🐹, but make sure it's _your link_\\. *This is important*\\. 📍`,{parse_mode: "MarkdownV2"});
    } else if (userData[chatId] && userData[chatId].amount !== null && userData[chatId].link === null) {
        // Запись ссылки
        userData[chatId].link = text;

        // Определение клавиатуры с двумя кнопками
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

        bot.sendMessage(chatId, `<code>Сhoose which payment method is better 🔑</code><blockquote>My credit card - 5168752023286407</blockquote>
<blockquote>My PayPal - taktoya1@gmail.com</blockquote>You can just sign up in PayPal, connect your card and send by this email 🪄

Attach your nickname or @username from tg to the money transfer ☄️

<b>If you have questions or suggestions for payment, write here @dvd8ew 🪬</b>`, options);
    } else if (userData[chatId] && userData[chatId].link !== null && userData[chatId].choice === null && ['Credit Card💳+', 'PayPal🅿️+'].includes(text)) {
        // Запись выбора
        userData[chatId].choice = text;

        // Отправка данных админу
        const userInfo = userData[chatId];
        const message = `
            Пользователь: ${userInfo.firstName} ${userInfo.lastName} (@${userInfo.username})
            Количество: ${userInfo.amount}
            Ссылка: ${userInfo.link}
            Выбор: ${userInfo.choice}
        `;
        bot.sendMessage(adminChatId, message);

        // Отправка подтверждения пользователю
        const confirmOptions = {
            reply_markup: JSON.stringify({
                keyboard: [
                    [{ text: 'Yes' }]
                ],
                resize_keyboard: true,
                one_time_keyboard: true
            })
        };

        bot.sendMessage(chatId, 'Did you managed to make the payment? 📫', confirmOptions);
    } else if (userData[chatId] && userData[chatId].choice !== null && text === 'Yes' && !userData[chatId].paymentConfirmed) {
        // Обновление состояния подтверждения оплаты
        userData[chatId].awaitingScreenshot = true;
        bot.sendMessage(chatId, 'Post a screenshot of the transaction to prove');
    } else if (userData[chatId] && userData[chatId].paymentConfirmed && text === 'Yes') {
        // Запуск процесса заново
        startProcess(chatId);
    } else if (userData[chatId] && userData[chatId].choice !== null && text !== 'Yes') {
        bot.sendMessage(chatId, '');
    }
});

bot.on('polling_error', (error) => {
    console.error('Polling error:', error);
});

app.get('/', (req, res) => {
    res.send('Telegram bot server is running.');
});

// Запуск сервера
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});