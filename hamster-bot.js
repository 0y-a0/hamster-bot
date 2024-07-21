const TelegramBot = require('node-telegram-bot-api');

// Замените 'YOUR_TELEGRAM_BOT_TOKEN' на токен вашего бота
const token = '6302799889:AAGn-3PU4iPsoNibGHkVrwJ5XzUR36qcmOA';

// Ваш личный Chat ID
const adminChatId = 1119372110;

// Создайте экземпляр бота
const bot = new TelegramBot(token, { polling: true });

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
        paymentConfirmed: false
    };

    // Определение клавиатуры с цифрами от 1 до 5
    const options = {
        reply_markup: JSON.stringify({
            keyboard: [
                [{ text: '1' }, { text: '2' }, { text: '3' }, { text: '4' }, { text: '5' }]
            ],
            resize_keyboard: true,
            one_time_keyboard: true
        })
    };

    // Отправка сообщения с клавиатурой
    bot.sendMessage(chatId, 'Выберите количество:', options);
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
        paymentConfirmed: false
    };

    startProcess(chatId);
});

// Обработчик текстовых сообщений
bot.on('message', (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text;

    if (userData[chatId] && userData[chatId].amount === null && ['1', '2', '3', '4', '5'].includes(text)) {
        // Запись выбранного количества
        userData[chatId].amount = parseInt(text);
        bot.sendMessage(chatId, `C вас ${text} баксов. Кидай ссылку:`);
    } else if (userData[chatId] && userData[chatId].amount !== null && userData[chatId].link === null) {
        // Запись ссылки
        userData[chatId].link = text;

        // Определение клавиатуры с двумя кнопками
        const options = {
            reply_markup: JSON.stringify({
                keyboard: [
                    [{ text: 'Опция 1' }, { text: 'Опция 2' }]
                ],
                resize_keyboard: true,
                one_time_keyboard: true
            })
        };

        bot.sendMessage(chatId, 'Выберите одну из двух опций:', options);
    } else if (userData[chatId] && userData[chatId].link !== null && userData[chatId].choice === null && ['Опция 1', 'Опция 2'].includes(text)) {
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
                    [{ text: 'Да' }]
                ],
                resize_keyboard: true,
                one_time_keyboard: true
            })
        };

        bot.sendMessage(chatId, 'Вы отправили деньги?', confirmOptions);
    } else if (userData[chatId] && userData[chatId].choice !== null && text === 'Да' && !userData[chatId].paymentConfirmed) {
        // Обновление состояния подтверждения оплаты
        userData[chatId].paymentConfirmed = true;

        // Отправка подтверждения админу
        bot.sendMessage(adminChatId, `Пользователь @${userData[chatId].username} подтвердил отправку денег.`);
        bot.sendMessage(chatId, 'Спасибо за подтверждение!');

        // Отправка вопроса о новом заказе
        const restartOptions = {
            reply_markup: JSON.stringify({
                keyboard: [
                    [{ text: 'Да' }]
                ],
                resize_keyboard: true,
                one_time_keyboard: true
            })
        };
        bot.sendMessage(chatId, 'Хотите еще купить?', restartOptions);
    } else if (userData[chatId] && userData[chatId].paymentConfirmed && text === 'Да') {
        // Запуск процесса заново
        startProcess(chatId);
    } else if (userData[chatId] && userData[chatId].choice !== null && text !== 'Да') {
        bot.sendMessage(chatId, 'Пожалуйста, подтвердите отправку денег, нажав "Да".');
    }
});
