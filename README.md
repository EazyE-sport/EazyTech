# EazyTech

Курированный каталог периферии: мыши, клавиатуры, честные цены.
Чистые ES-модули, без сборщиков и библиотек — работает на любом статическом хостинге.

## Структура

```
├── index.html          главная
├── category.html       каталог (?cat=mice | ?cat=keyboards)
├── device.html         страница устройства (?id=...)
├── compare.html        сравнение (?ids=a,b или через кнопку на устройстве)
├── methodology.html    методика
├── css/                base / animations / components / effects / responsive
├── js/
│   ├── core/           курсор, канвас-фон, переходы, scroll-reveal
│   ├── data/           загрузчик и фильтры
│   ├── ui/             карточки, радар, бар-чарт, сравнение
│   └── app.js          точка входа
└── data/devices/       одно устройство = один файл
```

## Как добавить устройство

1. Кидаешь новый JSON в `data/devices/` — имя файла любое.
2. Добавляешь имя файла в `data/devices/index.json`.
3. Обновляешь страницу.

Гитхаб не умеет отдавать листинг папки, поэтому скрипт читает манифест
`index.json`, а дальше тянет каждый файл из него.

## Поля JSON

```json
{
  "id": "g102",
  "name": "Logitech G102 Lightsync",
  "brand": "Logitech",
  "category": "mice",
  "image": "https://.../photo.jpg",
  "short": "Ветеран бюджетного сегмента.",
  "price": 1990,
  "fairPrice": 1900,
  "rating": 6.4,
  "reviews": 731,
  "specs": { "Вес": "85 г", "Сенсор": "Mercury" },
  "shops": [{ "name": "DNS", "price": 1990 }],
  "pros": ["..."],
  "cons": ["..."],
  "life": { "months": 18, "risk": 10, "riskLabel": "...", "fail": 36, "failLabel": "..." },
  "bench": { "input": 6.0, "ergo": 8.4, "materials": 6.6, "features": 5.4,
    "reliability": 6.2, "support": 7.0, "build": 6.8, "software": 6.9,
    "value": 8.7, "feel": 6.2 }
}
```

`image` — прямая ссылка на картинку (любой хостинг). Пустое поле —
отрисуется заглушка. Теги считаются автоматически: рейтинг < 6.5 — «Колхоз»,
цена ≤ fairPrice — «Fair deal». Категории: `mice`, `keyboards`.

## Локально

Любой статик-сервер из корня, например:

```bash
python3 -m http.server 8000
```

Данные кешируются в sessionStorage на вкладку — после правок JSON
достаточно обновить страницу в новой вкладке.
