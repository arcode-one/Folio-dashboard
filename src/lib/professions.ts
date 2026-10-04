import type { ProjectStatus } from "./types";

// Профессии демо: у каждой свои слова в интерфейсе и свой набор данных (lib/seeds).
// Разделы и функционал общие — меняются только подписи.

export const PROFESSION_IDS = [
  "web",
  "photo",
  "video",
  "graphic",
  "smm",
  "repair",
  "tutor",
  "beauty",
  "psych",
  "fitness",
] as const;
export type ProfessionId = (typeof PROFESSION_IDS)[number];

export type Terms = {
  /** Подпись под названием кабинета */
  tagline: string;
  /** «Заказы» — вкладка и заголовок раздела */
  orders: string;
  /** «Заказ» — поле и столбец */
  order: string;
  /** Для счёта: 1 заказ, 2 заказа, 5 заказов */
  forms: [string, string, string];
  /** «заказа» — без заказа, из 1 заказа */
  orderGen: string;
  /** «заказу» — по заказу, к заказу */
  orderDat: string;
  /** «заказ» — добавьте заказ, затраты на заказ */
  orderAcc: string;
  /** «заказов» — нет заказов, из 5 заказов */
  ordersGen: string;
  /** «заказам» — ждём по заказам */
  ordersDat: string;
  newOrder: string;
  createOrder: string;
  nearest: string;
  allOrders: string;
  status: Record<ProjectStatus, string>;
  /** Плитка в профиле: «Сдано заказов» */
  doneStat: string;
  /** «Прибыль по сданным заказам» */
  doneProfit: string;
  /** «сданных заказов» — за период … нет */
  doneGen: string;
  client: string;
  topClients: string;
  titleField: string;
  titlePlaceholder: string;
  source: string;
  sources: string;
  sourcesSub: string;
  commission: string;
  sourceList: string[];
  costsHint: string;
  search: string;
};

export type Profession = {
  id: ProfessionId;
  name: string;
  /** Короткое описание на карточке выбора */
  about: string;
  emoji: string;
  terms: Terms;
};

const MASC: Record<ProjectStatus, string> = { new: "Новый", in_progress: "В работе", done: "Сдан", cancelled: "Отменён" };
const FEM_DONE: Record<ProjectStatus, string> = { new: "Новая", in_progress: "В работе", done: "Сдана", cancelled: "Отменена" };

const ORDER = {
  orders: "Заказы",
  order: "Заказ",
  forms: ["заказ", "заказа", "заказов"] as [string, string, string],
  orderGen: "заказа",
  orderDat: "заказу",
  orderAcc: "заказ",
  ordersGen: "заказов",
  ordersDat: "заказам",
  newOrder: "Новый заказ",
  createOrder: "Создать заказ",
  nearest: "Ближайший заказ",
  allOrders: "Все заказы",
  status: MASC,
  doneStat: "Сдано заказов",
  doneProfit: "Прибыль по сданным заказам",
  doneGen: "сданных заказов",
};

const PROJECT = {
  orders: "Проекты",
  order: "Проект",
  forms: ["проект", "проекта", "проектов"] as [string, string, string],
  orderGen: "проекта",
  orderDat: "проекту",
  orderAcc: "проект",
  ordersGen: "проектов",
  ordersDat: "проектам",
  newOrder: "Новый проект",
  createOrder: "Создать проект",
  nearest: "Ближайший проект",
  allOrders: "Все проекты",
  status: MASC,
  doneStat: "Сдано проектов",
  doneProfit: "Прибыль по сданным проектам",
  doneGen: "сданных проектов",
};

const FREELANCE_SOURCES = {
  source: "Площадка",
  sources: "Площадки",
  sourcesSub: "сколько принесли и сколько ушло на отклики",
  commission: "Комиссия площадки",
};

const CLIENT_SOURCES = {
  source: "Откуда клиент",
  sources: "Источники клиентов",
  sourcesSub: "сколько принесли и сколько ушло на рекламу",
  commission: "Комиссия или процент",
};

export const PROFESSIONS: Profession[] = [
  {
    id: "web",
    name: "Веб-дизайнер",
    about: "Сайты и лендинги на заказ",
    emoji: "💻",
    terms: {
      ...ORDER,
      ...FREELANCE_SOURCES,
      tagline: "Кабинет веб-дизайнера",
      client: "Клиент или проект",
      topClients: "Лучшие клиенты",
      titleField: "Что сделать",
      titlePlaceholder: "Например, лендинг под ключ",
      sourceList: ["Kwork", "Профи", "FL.ru", "Habr Freelance", "Напрямую"],
      costsHint: "Отклики, плагины, хостинг под этот заказ — всё, что уменьшает прибыль.",
      search: "Клиент или задача",
    },
  },
  {
    id: "photo",
    name: "Фотограф",
    about: "Свадьбы, портреты, съёмки для брендов",
    emoji: "📷",
    terms: {
      orders: "Съёмки",
      order: "Съёмка",
      forms: ["съёмка", "съёмки", "съёмок"],
      orderGen: "съёмки",
      orderDat: "съёмке",
      orderAcc: "съёмку",
      ordersGen: "съёмок",
      ordersDat: "съёмкам",
      newOrder: "Новая съёмка",
      createOrder: "Создать съёмку",
      nearest: "Ближайшая съёмка",
      allOrders: "Все съёмки",
      status: FEM_DONE,
      doneStat: "Сдано съёмок",
      doneProfit: "Прибыль по сданным съёмкам",
      doneGen: "сданных съёмок",
      ...CLIENT_SOURCES,
      tagline: "Кабинет фотографа",
      client: "Клиент",
      topClients: "Лучшие клиенты",
      titleField: "Какая съёмка",
      titlePlaceholder: "Например, свадьба, полный день",
      sourceList: ["Instagram", "ВКонтакте", "Сарафанное радио", "Профи", "Авито", "Сайт"],
      costsHint: "Аренда студии, ассистент, ретушь, дорога — всё, что уменьшает прибыль со съёмки.",
      search: "Клиент или съёмка",
    },
  },
  {
    id: "video",
    name: "Видеограф",
    about: "Ролики, клипы, монтаж и рилсы",
    emoji: "🎬",
    terms: {
      ...PROJECT,
      ...CLIENT_SOURCES,
      tagline: "Кабинет видеографа",
      client: "Клиент",
      topClients: "Лучшие клиенты",
      titleField: "Что снимаем",
      titlePlaceholder: "Например, рекламный ролик 30 секунд",
      sourceList: ["Напрямую", "Instagram", "Профи", "Kwork", "Продакшн-студия"],
      costsHint: "Аренда техники, музыка, стоки, актёры — всё, что уменьшает прибыль с проекта.",
      search: "Клиент или проект",
    },
  },
  {
    id: "graphic",
    name: "Графический дизайнер",
    about: "Логотипы, айдентика, упаковка",
    emoji: "🎨",
    terms: {
      ...ORDER,
      ...FREELANCE_SOURCES,
      tagline: "Кабинет графического дизайнера",
      client: "Клиент",
      topClients: "Лучшие клиенты",
      titleField: "Что сделать",
      titlePlaceholder: "Например, логотип и фирменный стиль",
      sourceList: ["Behance", "Kwork", "Профи", "Dribbble", "Напрямую"],
      costsHint: "Шрифты, стоки, мокапы, печать пробников — всё, что уменьшает прибыль.",
      search: "Клиент или задача",
    },
  },
  {
    id: "smm",
    name: "SMM-специалист",
    about: "Ведение соцсетей и контент",
    emoji: "📱",
    terms: {
      ...PROJECT,
      ...FREELANCE_SOURCES,
      tagline: "Кабинет SMM-специалиста",
      client: "Клиент или бренд",
      topClients: "Лучшие клиенты",
      titleField: "Что делаем",
      titlePlaceholder: "Например, ведение Instagram на месяц",
      sourceList: ["Напрямую", "Профи", "Kwork", "Telegram-чаты", "Агентство"],
      costsHint: "Реклама, сервисы отложенного постинга, фотограф — всё, что уменьшает прибыль.",
      search: "Клиент или проект",
    },
  },
  {
    id: "repair",
    name: "Ремонт и отделка",
    about: "Квартиры, ванные, отделка под ключ",
    emoji: "🛠️",
    terms: {
      orders: "Объекты",
      order: "Объект",
      forms: ["объект", "объекта", "объектов"],
      orderGen: "объекта",
      orderDat: "объекту",
      orderAcc: "объект",
      ordersGen: "объектов",
      ordersDat: "объектам",
      newOrder: "Новый объект",
      createOrder: "Создать объект",
      nearest: "Ближайший объект",
      allOrders: "Все объекты",
      status: MASC,
      doneStat: "Сдано объектов",
      doneProfit: "Прибыль по сданным объектам",
      doneGen: "сданных объектов",
      ...CLIENT_SOURCES,
      tagline: "Кабинет мастера по ремонту",
      client: "Заказчик",
      topClients: "Лучшие заказчики",
      titleField: "Что делаем",
      titlePlaceholder: "Например, санузел под ключ",
      sourceList: ["Авито", "Профи", "Сарафанное радио", "Дизайнер", "Яндекс Услуги"],
      costsHint: "Материалы, доставка, вывоз мусора, помощники — всё, что уменьшает прибыль с объекта.",
      search: "Заказчик или адрес",
    },
  },
  {
    id: "tutor",
    name: "Репетитор",
    about: "Ученики, пакеты занятий, подготовка к экзаменам",
    emoji: "📚",
    terms: {
      orders: "Ученики",
      order: "Ученик",
      forms: ["ученик", "ученика", "учеников"],
      orderGen: "ученика",
      orderDat: "ученику",
      orderAcc: "ученика",
      ordersGen: "учеников",
      ordersDat: "ученикам",
      newOrder: "Новый ученик",
      createOrder: "Добавить ученика",
      nearest: "Ближайший ученик",
      allOrders: "Все ученики",
      status: { new: "Пробное", in_progress: "Занимается", done: "Закончил", cancelled: "Бросил" },
      doneStat: "Пакетов закончено",
      doneProfit: "Прибыль по законченным пакетам",
      doneGen: "законченных пакетов",
      ...CLIENT_SOURCES,
      tagline: "Кабинет репетитора",
      client: "Ученик",
      topClients: "Лучшие ученики",
      titleField: "Предмет и пакет",
      titlePlaceholder: "Например, ОГЭ по математике, 8 занятий",
      sourceList: ["Профи", "Ясно", "Сарафанное радио", "Школа", "Авито"],
      costsHint: "Пособия, платформа для уроков, отклики — всё, что уменьшает прибыль.",
      search: "Ученик или предмет",
    },
  },
  {
    id: "beauty",
    name: "Мастер красоты",
    about: "Маникюр, макияж, брови, обучение",
    emoji: "💅",
    terms: {
      orders: "Записи",
      order: "Запись",
      forms: ["запись", "записи", "записей"],
      orderGen: "записи",
      orderDat: "записи",
      orderAcc: "запись",
      ordersGen: "записей",
      ordersDat: "записям",
      newOrder: "Новая запись",
      createOrder: "Создать запись",
      nearest: "Ближайшая запись",
      allOrders: "Все записи",
      status: { new: "Новая", in_progress: "Подтверждена", done: "Выполнена", cancelled: "Отменена" },
      doneStat: "Выполнено записей",
      doneProfit: "Прибыль по выполненным записям",
      doneGen: "выполненных записей",
      ...CLIENT_SOURCES,
      tagline: "Кабинет мастера красоты",
      client: "Клиентка",
      topClients: "Постоянные клиентки",
      titleField: "Услуга",
      titlePlaceholder: "Например, свадебный макияж с выездом",
      sourceList: ["Instagram", "YCLIENTS", "Авито", "Сарафанное радио", "Салон"],
      costsHint: "Материалы, аренда места, дорога на выезд — всё, что уменьшает прибыль с записи.",
      search: "Клиентка или услуга",
    },
  },
  {
    id: "psych",
    name: "Психолог",
    about: "Консультации и курсы сессий",
    emoji: "🧠",
    terms: {
      orders: "Клиенты",
      order: "Клиент",
      forms: ["клиент", "клиента", "клиентов"],
      orderGen: "клиента",
      orderDat: "клиенту",
      orderAcc: "клиента",
      ordersGen: "клиентов",
      ordersDat: "клиентам",
      newOrder: "Новый клиент",
      createOrder: "Добавить клиента",
      nearest: "Ближайший клиент",
      allOrders: "Все клиенты",
      status: { new: "Знакомство", in_progress: "Идут сессии", done: "Завершён", cancelled: "Прервал" },
      doneStat: "Курсов завершено",
      doneProfit: "Прибыль по завершённым курсам",
      doneGen: "завершённых курсов",
      ...CLIENT_SOURCES,
      tagline: "Кабинет психолога",
      client: "Клиент",
      topClients: "Клиенты с самым долгим курсом",
      titleField: "Запрос и формат",
      titlePlaceholder: "Например, тревожность, 10 сессий онлайн",
      sourceList: ["Сайт", "Ясно", "Альтеграция", "Сарафанное радио", "Telegram-канал"],
      costsHint: "Комиссия платформы, супервизия, аренда кабинета — всё, что уменьшает прибыль.",
      search: "Клиент или запрос",
    },
  },
  {
    id: "fitness",
    name: "Фитнес-тренер",
    about: "Персональные тренировки и абонементы",
    emoji: "🏋️",
    terms: {
      orders: "Абонементы",
      order: "Абонемент",
      forms: ["абонемент", "абонемента", "абонементов"],
      orderGen: "абонемента",
      orderDat: "абонементу",
      orderAcc: "абонемент",
      ordersGen: "абонементов",
      ordersDat: "абонементам",
      newOrder: "Новый абонемент",
      createOrder: "Создать абонемент",
      nearest: "Ближайший абонемент",
      allOrders: "Все абонементы",
      status: { new: "Новый", in_progress: "Действует", done: "Закрыт", cancelled: "Отменён" },
      doneStat: "Закрыто абонементов",
      doneProfit: "Прибыль по закрытым абонементам",
      doneGen: "закрытых абонементов",
      ...CLIENT_SOURCES,
      tagline: "Кабинет фитнес-тренера",
      client: "Клиент",
      topClients: "Лучшие клиенты",
      titleField: "Программа",
      titlePlaceholder: "Например, 12 персональных тренировок",
      sourceList: ["Фитнес-клуб", "Instagram", "Сарафанное радио", "Профи", "Онлайн"],
      costsHint: "Аренда зала, инвентарь, питание для марафона — всё, что уменьшает прибыль.",
      search: "Клиент или программа",
    },
  },
];

export const DEFAULT_PROFESSION: ProfessionId = "web";

export function getProfession(id: ProfessionId | null | undefined): Profession {
  return PROFESSIONS.find((p) => p.id === id) ?? PROFESSIONS[0];
}

export const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
