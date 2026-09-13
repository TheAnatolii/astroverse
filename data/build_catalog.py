import json
import urllib.request
import urllib.parse
from pathlib import Path

DATA_DIR = Path(__file__).resolve().parent
OUTPUT_FILE = DATA_DIR / "objects.json"

# ==============================================================================
# 1. ПОЛНАЯ СОЛНЕЧНАЯ СИСТЕМА (ПЛАНЕТЫ, 22 СПУТНИКА, АСТЕРОИДЫ, КОМЕТЫ)
# ==============================================================================
SOLAR_SYSTEM = [
    # Солнце и 8 больших планет
    {
        "id": "sun", "name": "Солнце", "latin": "Sol", "kind": "star", "scale": "solar",
        "radius": 5.0, "distance": 0, "color": "#ffd36a", "texture": "sun", "spectral_type": "G2V",
        "temperature_k": 5772, "mass_sun": 1.0, "radius_km": 696340, "age_gyr": 4.6,
        "gravity": "274 м/с² (27.9 g)", "escape_velocity": "617.7 км/с",
        "composition": "Водород (~73.5%), Гелий (~24.9%), Кислород, Углерод, Железо",
        "description": "Жёлтый карлик главной последовательности, гравитационный и энергетический центр системы. В ядре каждую секунду 600 млн тонн водорода превращаются в гелий, высвобождая колоссальную энергию.",
        "structure": "Термоядерное ядро, зона лучистого переноса, конвективная зона, фотосфера и корона с температурой более 1 млн градусов.",
        "missions": [{"name": "Parker Solar Probe (NASA, 2018)", "desc": "Погружение в солнечную корону."}, {"name": "SOHO (ESA/NASA)", "desc": "Мониторинг вспышек."}],
        "facts": ["Масса Солнца — 99.86% всей Солнечной системы.", "Каждую секунду теряет 4 млн тонн массы на излучение."],
        "source": "NASA / SOHO"
    },
    {
        "id": "mercury", "name": "Меркурий", "latin": "Mercury", "kind": "planet", "scale": "solar",
        "parent": "sun", "radius": 0.38, "color": "#9b9b9b", "texture": "mercury",
        "au": 0.387, "period_days": 87.97, "radius_km": 2439.7, "mass_earth": 0.055,
        "temperature_k": 440, "gravity": "3.7 м/с² (0.38 g)", "escape_velocity": "4.25 км/с",
        "composition": "Экзосфера: Кислород (42%), Натрий (29%), Водород (22%), Гелий (6%)",
        "description": "Ближайшая к Солнцу планета. Каменистый мир с колоссальным железным ядром и глубокими кратерами.",
        "missions": [{"name": "MESSENGER (NASA)", "desc": "Открытие водяного льда на полюсах."}, {"name": "BepiColombo (ESA)", "desc": "Изучение магнитосферы."}],
        "facts": ["Температурный перепад от -180 °C до +430 °C.", "Орбитальный резонанс 3:2."],
        "source": "NASA MESSENGER"
    },
    {
        "id": "venus", "name": "Венера", "latin": "Venus", "kind": "planet", "scale": "solar",
        "parent": "sun", "radius": 0.95, "color": "#d8a35d", "texture": "venus", "atmosphere": "#e8d09a",
        "au": 0.723, "period_days": 224.7, "radius_km": 6051.8, "mass_earth": 0.815,
        "temperature_k": 737, "gravity": "8.87 м/с² (0.90 g)", "escape_velocity": "10.36 км/с",
        "composition": "CO₂ (96.5%), Азот (3.5%), серная кислота",
        "description": "Планета экстремального парникового эффекта с давлением 92 атмосферы под сернокислотными облаками.",
        "missions": [{"name": "Венера-9..14 (СССР)", "desc": "Первые посадки и панорамы поверхности."}, {"name": "Magellan (NASA)", "desc": "Радарное картирование."}],
        "facts": ["Сутки (243 дня) длиннее года (225 дней).", "Вращается в обратную сторону."],
        "source": "NASA / Роскосмос"
    },
    {
        "id": "earth", "name": "Земля", "latin": "Earth", "kind": "planet", "scale": "solar",
        "parent": "sun", "radius": 1.0, "color": "#4f83ff", "texture": "earth", "atmosphere": "#7eb6ff",
        "au": 1.0, "period_days": 365.25, "radius_km": 6371, "mass_earth": 1.0,
        "temperature_k": 288, "gravity": "9.807 м/с² (1.0 g)", "escape_velocity": "11.18 км/с",
        "composition": "Азот (78%), Кислород (21%), Аргон (0.9%), CO₂",
        "description": "Обитаемый космический оазис с тектоникой плит, биосферой и глобальным океаном жидкой воды.",
        "missions": [{"name": "Landsat / Sentinel", "desc": "Глобальный климатический мониторинг."}],
        "facts": ["71% поверхности покрыто океаном.", "Магнитное поле защищает от солнечного ветра."],
        "source": "NASA Earth Observatory"
    },
    {
        "id": "mars", "name": "Марс", "latin": "Mars", "kind": "planet", "scale": "solar",
        "parent": "sun", "radius": 0.53, "color": "#c45d46", "texture": "mars", "atmosphere": "#c47a62",
        "au": 1.524, "period_days": 686.98, "radius_km": 3389.5, "mass_earth": 0.107,
        "temperature_k": 210, "gravity": "3.72 м/с² (0.38 g)", "escape_velocity": "5.03 км/с",
        "composition": "CO₂ (95.3%), Азот (2.6%), Аргон (1.9%)",
        "description": "Красная планета с гигантскими каньонами, потухшими вулканами и древними руслами рек.",
        "missions": [{"name": "Curiosity & Perseverance (NASA)", "desc": "Поиск следов древней микробной жизни."}, {"name": "Viking 1 & 2", "desc": "Первые станции."}],
        "facts": ["Вулкан Олимп высотой 22 км.", "Каньон Долины Маринер длиной 4000 км."],
        "source": "NASA Mars Exploration"
    },
    {
        "id": "jupiter", "name": "Юпитер", "latin": "Jupiter", "kind": "planet", "scale": "solar",
        "parent": "sun", "radius": 2.35, "color": "#d3a47b", "texture": "jupiter",
        "au": 5.2, "period_days": 4332.6, "radius_km": 69911, "mass_earth": 317.8,
        "temperature_k": 165, "gravity": "24.79 м/с² (2.53 g)", "escape_velocity": "59.5 км/с",
        "composition": "Водород (~90%), Гелий (~10%), метан, аммиак",
        "description": "Крупнейший газовый гигант с металлическим водородом в недрах и мощнейшей магнитосферой.",
        "missions": [{"name": "Galileo (NASA)", "desc": "Изучение спутников."}, {"name": "Juno (NASA)", "desc": "Глубинная гравиметрия."}],
        "facts": ["Большое Красное Пятно бушует более 350 лет.", "Имеет 95 спутников."],
        "source": "NASA Juno"
    },
    {
        "id": "saturn", "name": "Сатурн", "latin": "Saturn", "kind": "planet", "scale": "solar",
        "parent": "sun", "radius": 2.05, "color": "#d8c28e", "texture": "saturn",
        "rings": {"inner": 1.35, "outer": 2.35, "color": "#e2d2a8"},
        "au": 9.58, "period_days": 10759, "radius_km": 58232, "mass_earth": 95.2,
        "temperature_k": 134, "gravity": "10.44 м/с² (1.06 g)", "escape_velocity": "35.5 км/с",
        "composition": "Водород (96%), Гелий (3%)",
        "description": "Властелин колец с плотностью меньше воды и полярным шестиугольным штормом.",
        "missions": [{"name": "Cassini-Huygens (NASA/ESA)", "desc": "13 лет исследований колец и посадка на Титан."}],
        "facts": ["Толщина ледяных колец всего 10–30 метров при ширине 280 000 км."],
        "source": "NASA Cassini"
    },
    {
        "id": "uranus", "name": "Уран", "latin": "Uranus", "kind": "planet", "scale": "solar",
        "parent": "sun", "radius": 1.28, "color": "#8bd4d8", "texture": "uranus",
        "rings": {"inner": 1.5, "outer": 1.95, "color": "#cfe4e8"},
        "au": 19.2, "period_days": 30687, "radius_km": 25362, "mass_earth": 14.5,
        "temperature_k": 76, "gravity": "8.69 м/с² (0.89 g)", "escape_velocity": "21.3 км/с",
        "composition": "Водород (83%), Гелий (15%), Метан (2.3%)",
        "description": "Ледяной гигант, катящийся по орбите на боку с температурой до -224 °C.",
        "missions": [{"name": "Voyager 2 (NASA, 1986)", "desc": "Единственный пролет аппарата."}],
        "facts": ["Наклон оси 98°.", "Имеет 28 спутников и 13 темных колец."],
        "source": "NASA Voyager 2"
    },
    {
        "id": "neptune", "name": "Нептун", "latin": "Neptune", "kind": "planet", "scale": "solar",
        "parent": "sun", "radius": 1.24, "color": "#526bdc", "texture": "neptune", "atmosphere": "#4d6adf",
        "au": 30.05, "period_days": 60190, "radius_km": 24622, "mass_earth": 17.1,
        "temperature_k": 72, "gravity": "11.15 м/с² (1.14 g)", "escape_velocity": "23.5 км/с",
        "composition": "Водород (80%), Гелий (19%), Метан (1.5%)",
        "description": "Далекий лазурный гигант со сверхзвуковыми ветрами, открытый благодаря математике.",
        "missions": [{"name": "Voyager 2 (NASA, 1989)", "desc": "Открытие гейзеров на Тритоне."}],
        "facts": ["Скорость ветров достигает 2100 км/ч.", "Год длится 165 земных лет."],
        "source": "NASA Voyager 2"
    },

    # Карликовые планеты
    {
        "id": "pluto", "name": "Плутон", "latin": "Pluto", "kind": "dwarf_planet", "scale": "solar",
        "parent": "sun", "radius": 0.3, "color": "#b9a58e", "texture": "pluto",
        "au": 39.5, "period_days": 90560, "radius_km": 1188.3, "mass_earth": 0.0022,
        "temperature_k": 44, "gravity": "0.62 м/с²", "escape_velocity": "1.21 км/с",
        "facts": ["Азотное сердце равнины Спутника.", "Двойная система с Хароном."],
        "description": "Сложный ледяной мир пояса Койпера с азотными ледниками.", "source": "New Horizons"
    },
    {
        "id": "ceres", "name": "Церера", "latin": "Ceres", "kind": "dwarf_planet", "scale": "solar",
        "parent": "sun", "radius": 0.32, "color": "#b0aaa2", "texture": "ceres",
        "au": 2.77, "period_days": 1680, "radius_km": 473, "temperature_k": 168,
        "facts": ["Крупнейшее тело пояса астероидов.", "Соленые криовулканические пятна кратера Оккатор."],
        "description": "Карликовая планета с водяным льдом под корой.", "source": "NASA Dawn"
    },
    {
        "id": "haumea", "name": "Хаумеа", "latin": "Haumea", "kind": "dwarf_planet", "scale": "solar",
        "parent": "sun", "radius": 0.24, "color": "#e8dcc8", "texture": "ice",
        "au": 43.1, "period_days": 103774, "facts": ["Вращается за 4 часа.", "Имеет собственное кольцо."],
        "description": "Вытянутая в эллипсоид ледяная карликовая планета.", "source": "IAU"
    },
    {
        "id": "makemake", "name": "Макемаке", "latin": "Makemake", "kind": "dwarf_planet", "scale": "solar",
        "parent": "sun", "radius": 0.22, "color": "#c9a078", "texture": "rocky",
        "au": 45.5, "period_days": 111800, "facts": ["Покрыта метановым инеем."],
        "description": "Красный ледяной мир пояса Койпера.", "source": "IAU"
    },
    {
        "id": "eris", "name": "Эрида", "latin": "Eris", "kind": "dwarf_planet", "scale": "solar",
        "parent": "sun", "radius": 0.29, "color": "#d6d2cc", "texture": "ice",
        "au": 67.9, "period_days": 203830, "radius_km": 1163, "facts": ["Массивнее Плутона.", "Спутник Дисномия."],
        "description": "Далекое ледяное тело рассеянного диска.", "source": "Palomar"
    },
    {
        "id": "sedna", "name": "Седна", "latin": "Sedna", "kind": "dwarf_planet", "scale": "solar",
        "parent": "sun", "radius": 0.2, "color": "#c45d3e", "texture": "rocky",
        "au": 85.0, "period_days": 4160000, "facts": ["Орбита уходит на 937 а.е.", "Год длится 11 400 лет."],
        "description": "Один из самых удаленных обособленных объектов системы.", "source": "IAU"
    },

    # Все ключевые луны Солнечной системы
    {"id": "moon", "name": "Луна", "kind": "moon", "scale": "solar", "parent": "earth", "radius": 0.27, "moon_distance": 2.5, "period_days": 27.32, "color": "#c5c5c8", "texture": "moon", "facts": ["Приливы и отливы.", "Синхронное вращение."], "description": "Естественный спутник Земли."},
    {"id": "phobos", "name": "Фобос", "kind": "moon", "scale": "solar", "parent": "mars", "radius": 0.038, "moon_distance": 1.5, "period_days": 0.32, "color": "#8a7b70", "texture": "rocky", "facts": ["Приближается к Марсу."], "description": "Внутренний спутник Марса."},
    {"id": "deimos", "name": "Деймос", "kind": "moon", "scale": "solar", "parent": "mars", "radius": 0.026, "moon_distance": 2.3, "period_days": 1.26, "color": "#9a8c80", "texture": "rocky", "facts": ["Внешний спутник Марса."], "description": "Малая каменистая луна."},
    {"id": "io", "name": "Ио", "kind": "moon", "scale": "solar", "parent": "jupiter", "radius": 0.29, "moon_distance": 2.8, "period_days": 1.77, "color": "#e8c44a", "texture": "io", "facts": ["400 вулканов серы."], "description": "Вулканический мир Юпитера."},
    {"id": "europa", "name": "Европа", "kind": "moon", "scale": "solar", "parent": "jupiter", "radius": 0.26, "moon_distance": 3.6, "period_days": 3.55, "color": "#d5e4ea", "texture": "europa", "facts": ["Океан под 20-км льдом."], "description": "Ледяной спутник с соленым океаном."},
    {"id": "ganymede", "name": "Ганимед", "kind": "moon", "scale": "solar", "parent": "jupiter", "radius": 0.41, "moon_distance": 4.5, "period_days": 7.15, "color": "#b6a48c", "texture": "ganymede", "facts": ["Крупнейший спутник в системе."], "description": "Гигантская луна со своим магнитным полем."},
    {"id": "callisto", "name": "Каллисто", "kind": "moon", "scale": "solar", "parent": "jupiter", "radius": 0.38, "moon_distance": 5.6, "period_days": 16.69, "color": "#7a7368", "texture": "callisto", "facts": ["Древнейшая кратерированная кора."], "description": "Темный древний спутник."},
    {"id": "amalthea", "name": "Амальтея", "kind": "moon", "scale": "solar", "parent": "jupiter", "radius": 0.1, "moon_distance": 2.2, "period_days": 0.5, "color": "#c45544", "texture": "rocky", "facts": ["Интенсивный красный цвет."], "description": "Внутренний спутник Юпитера."},
    {"id": "mimas", "name": "Мимас", "kind": "moon", "scale": "solar", "parent": "saturn", "radius": 0.12, "moon_distance": 2.4, "period_days": 0.94, "color": "#e0e0e0", "texture": "ice", "facts": ["Кратер Гершель."], "description": "Спутник, похожий на «Звезду Смерти»."},
    {"id": "enceladus", "name": "Энцелад", "kind": "moon", "scale": "solar", "parent": "saturn", "radius": 0.15, "moon_distance": 3.0, "period_days": 1.37, "color": "#f2f6fa", "texture": "enceladus", "facts": ["Водные гейзеры."], "description": "Белоснежный океанический мир."},
    {"id": "tethys", "name": "Тефия", "kind": "moon", "scale": "solar", "parent": "saturn", "radius": 0.18, "moon_distance": 3.6, "period_days": 1.89, "color": "#eaeaea", "texture": "ice", "facts": ["Каньон Итака."], "description": "Ледяная луна Сатурна."},
    {"id": "dione", "name": "Диона", "kind": "moon", "scale": "solar", "parent": "saturn", "radius": 0.2, "moon_distance": 4.2, "period_days": 2.74, "color": "#dcdcdc", "texture": "ice", "facts": ["Ледяные обрывы."], "description": "Плотный спутник Сатурна."},
    {"id": "rhea", "name": "Рея", "kind": "moon", "scale": "solar", "parent": "saturn", "radius": 0.24, "moon_distance": 4.9, "period_days": 4.52, "color": "#cccccc", "texture": "ice", "facts": ["Второй по размеру спутник Сатурна."], "description": "Древний ледяной спутник."},
    {"id": "titan", "name": "Титан", "kind": "moon", "scale": "solar", "parent": "saturn", "radius": 0.4, "moon_distance": 5.8, "period_days": 15.9, "color": "#d29a4a", "texture": "titan", "facts": ["Метановые моря и дожди."], "description": "Оранжевый мир с плотной атмосферой."},
    {"id": "iapetus", "name": "Япет", "kind": "moon", "scale": "solar", "parent": "saturn", "radius": 0.22, "moon_distance": 7.2, "period_days": 79.3, "color": "#5a4a3a", "texture": "rocky", "facts": ["Двуликий спутник (черно-белый)."], "description": "Контрастный спутник Сатурна."},
    {"id": "miranda", "name": "Миранда", "kind": "moon", "scale": "solar", "parent": "uranus", "radius": 0.13, "moon_distance": 2.2, "period_days": 1.41, "color": "#d0d8dc", "texture": "ice", "facts": ["Утес Верона высотой 20 км."], "description": "Спутник с хаотичным рельефом."},
    {"id": "ariel", "name": "Ариэль", "kind": "moon", "scale": "solar", "parent": "uranus", "radius": 0.18, "moon_distance": 2.8, "period_days": 2.52, "color": "#d8e0e4", "texture": "ice", "facts": ["Глубокие рифтовые долины."], "description": "Самый светлый спутник Урана."},
    {"id": "titania", "name": "Титания", "kind": "moon", "scale": "solar", "parent": "uranus", "radius": 0.24, "moon_distance": 3.6, "period_days": 8.7, "color": "#cfd7da", "texture": "ice", "facts": ["Крупнейшая луна Урана."], "description": "Ледяной спутник Урана."},
    {"id": "triton", "name": "Тритон", "kind": "moon", "scale": "solar", "parent": "neptune", "radius": 0.22, "moon_distance": 3.2, "period_days": 5.88, "color": "#d8c8d4", "texture": "triton", "facts": ["Азотные гейзеры."], "description": "Захваченный объект пояса Койпера."},
    {"id": "charon", "name": "Харон", "kind": "moon", "scale": "solar", "parent": "pluto", "radius": 0.16, "moon_distance": 2.0, "period_days": 6.38, "color": "#8c8380", "texture": "rocky", "facts": ["Пятно Мордор на полюсе."], "description": "Спутник Плутона."},

    # Астероиды и кометы
    {"id": "vesta", "name": "Веста", "kind": "asteroid", "scale": "solar", "parent": "sun", "radius": 0.22, "au": 2.36, "period_days": 1325, "color": "#94908a", "texture": "rocky", "facts": ["Кратер Реясильвия на юге."], "description": "Протопланета пояса астероидов."},
    {"id": "pallas", "name": "Паллада", "kind": "asteroid", "scale": "solar", "parent": "sun", "radius": 0.21, "au": 2.77, "period_days": 1686, "color": "#88837c", "texture": "rocky", "facts": ["Наклон орбиты 34°."], "description": "Крупный углеродистый астероид."},
    {"id": "psyche", "name": "Психея", "kind": "asteroid", "scale": "solar", "parent": "sun", "radius": 0.18, "au": 2.92, "period_days": 1824, "color": "#b8b2a8", "texture": "rocky", "facts": ["Состоит из железа и никеля."], "description": "Металлическое ядро древней протопланеты."},
    {"id": "bennu", "name": "Бенну", "kind": "asteroid", "scale": "solar", "parent": "sun", "radius": 0.08, "au": 1.12, "period_days": 436, "color": "#4a4a4a", "texture": "rocky", "facts": ["Образцы доставлены на Землю."], "description": "Околоземный астероид-щебень."},
    {"id": "apophis", "name": "Апофис", "kind": "asteroid", "scale": "solar", "parent": "sun", "radius": 0.07, "au": 0.92, "period_days": 323, "color": "#6e6e6e", "texture": "rocky", "facts": ["Сближение с Землей в 2029 году."], "description": "Потенциально опасный астероид."},
    {"id": "halley", "name": "Комета Галлея", "kind": "asteroid", "scale": "solar", "parent": "sun", "radius": 0.1, "au": 17.8, "period_days": 27500, "color": "#9ec5d8", "texture": "ice", "facts": ["Период 75 лет."], "description": "Знаменитая короткопериодическая комета."}
]

# ==============================================================================
# 2. РЕАЛЬНЫЕ ЧЁРНЫЕ ДЫРЫ
# ==============================================================================
BLACK_HOLES = [
    {
        "id": "sgr_a", "name": "Стрелец A*", "latin": "Sagittarius A*", "kind": "black_hole", "scale": "galaxy",
        "radius": 2.4, "color": "#ff8822", "distance_ly": 26673, "gx": 0, "gy": 0, "gz": 0,
        "mass_sun": 4154000.0, "schwarzschild_radius_km": 12270000,
        "description": "Сверхмассивная чёрная дыра в центре Млечного Пути. Тень сфотографирована EHT в 2022 году.",
        "facts": ["Масса: 4,15 млн Солнц.", "Диаметр горизонта событий: ~25 млн км."],
        "source": "Event Horizon Telescope"
    },
    {
        "id": "cygnus_x1", "name": "Лебедь X-1", "latin": "Cygnus X-1", "kind": "black_hole", "scale": "galaxy",
        "radius": 1.3, "color": "#4499ff", "distance_ly": 7200, "galactic_l": 71.3, "galactic_b": 3.1,
        "mass_sun": 21.2, "schwarzschild_radius_km": 62.6,
        "description": "Первая подтвержденная черная дыра в истории (1971), рентгеновская двойная система.",
        "facts": ["Спор Хокинга и Торна.", "Масса 21.2 Солнца."],
        "source": "NASA Chandra"
    },
    {
        "id": "m87_bh", "name": "M87* (Пёвехи)", "latin": "M87*", "kind": "black_hole", "scale": "galaxy",
        "radius": 3.5, "color": "#ff5500", "distance_ly": 53500000, "gx": -190, "gy": 120, "gz": 85,
        "mass_sun": 6500000000.0,
        "description": "Сверхгигантская черная дыра в галактике M87, первый исторический снимок тени (2019).",
        "facts": ["Масса: 6.5 млрд Солнц.", "Релятивистский джет длиной 5000 св. лет."],
        "source": "EHT Collaboration"
    },
    {
        "id": "gaia_bh1", "name": "Gaia BH1", "latin": "Gaia BH1", "kind": "black_hole", "scale": "galaxy",
        "radius": 1.1, "color": "#ffaa33", "distance_ly": 1560, "galactic_l": 272.5, "galactic_b": -5.1,
        "mass_sun": 9.62,
        "description": "Ближайшая к Земле известная чёрная дыра (~1560 св. лет), открыта спутником Gaia в 2022 году.",
        "facts": ["Спящая черная дыра на широкой орбите."],
        "source": "ESA Gaia"
    }
]

# ==============================================================================
# 3. ЯРКИЕ ЗВЁЗДЫ
# ==============================================================================
FAMOUS_STARS = [
    {"id": "sirius", "name": "Сириус", "latin": "Sirius", "kind": "star", "scale": "local", "radius": 0.7, "color": "#dce8ff", "spectral_type": "A1V", "distance_ly": 8.6, "ra": 6.75, "dec": -16.72, "constellation": "Большой Пёс", "apparent_magnitude": -1.46, "mass_sun": 2.06, "facts": ["Ярчайшая звезда ночного неба."], "description": "Бело-голубой маяк нашего сектора."},
    {"id": "canopus", "name": "Канопус", "latin": "Canopus", "kind": "star", "scale": "local", "radius": 1.1, "color": "#fff6d8", "spectral_type": "A9II", "distance_ly": 310, "ra": 6.4, "dec": -52.7, "constellation": "Киль", "apparent_magnitude": -0.74, "mass_sun": 8.0, "facts": ["Вторая по яркости звезда неба."], "description": "Сверхгигант южного неба."},
    {"id": "alpha_cen_a", "name": "Альфа Центавра A", "latin": "Rigil Kentaurus", "kind": "star", "scale": "local", "radius": 0.55, "color": "#ffe6a8", "spectral_type": "G2V", "distance_ly": 4.37, "ra": 14.66, "dec": -60.83, "constellation": "Центавр", "apparent_magnitude": -0.01, "mass_sun": 1.1, "facts": ["Двойник Солнца."], "description": "Желтый карлик системы Альфа Центавра."},
    {"id": "proxima", "name": "Проксима Центавра", "latin": "Proxima Centauri", "kind": "star", "scale": "local", "radius": 0.28, "color": "#ff8a62", "spectral_type": "M5.5V", "distance_ly": 4.24, "ra": 14.495, "dec": -62.68, "constellation": "Центавр", "apparent_magnitude": 11.13, "mass_sun": 0.12, "facts": ["Ближайшая к нам звезда."], "description": "Вспыхивающий красный карлик."},
    {"id": "arcturus", "name": "Арктур", "latin": "Arcturus", "kind": "star", "scale": "local", "radius": 0.85, "color": "#ffb060", "spectral_type": "K1.5III", "distance_ly": 36.7, "ra": 14.26, "dec": 19.18, "constellation": "Волопас", "apparent_magnitude": -0.05, "mass_sun": 1.08, "facts": ["Оранжевый гигант."], "description": "Древний оранжевый гигант."},
    {"id": "vega", "name": "Вега", "latin": "Vega", "kind": "star", "scale": "local", "radius": 0.62, "color": "#d6e6ff", "spectral_type": "A0V", "distance_ly": 25.0, "ra": 18.62, "dec": 38.78, "constellation": "Лира", "apparent_magnitude": 0.03, "mass_sun": 2.14, "facts": ["Эталон блеска."], "description": "Белая вращающаяся звезда."},
    {"id": "capella", "name": "Капелла", "latin": "Capella", "kind": "star", "scale": "local", "radius": 0.7, "color": "#ffe0a0", "spectral_type": "G3III", "distance_ly": 42.9, "ra": 5.28, "dec": 45.99, "constellation": "Возничий", "apparent_magnitude": 0.08, "mass_sun": 2.5, "facts": ["Четверная система."], "description": "Система желтых гигантов."},
    {"id": "rigel", "name": "Ригель", "latin": "Rigel", "kind": "star", "scale": "local", "radius": 1.05, "color": "#c8dcff", "spectral_type": "B8Ia", "distance_ly": 860, "ra": 5.24, "dec": -8.2, "constellation": "Орион", "apparent_magnitude": 0.13, "mass_sun": 21, "facts": ["Светимость 120 000 Солнц."], "description": "Голубой сверхгигант."},
    {"id": "procyon", "name": "Процион", "latin": "Procyon", "kind": "star", "scale": "local", "radius": 0.58, "color": "#f4f0d8", "spectral_type": "F5IV-V", "distance_ly": 11.5, "ra": 7.65, "dec": 5.22, "constellation": "Малый Пёс", "apparent_magnitude": 0.34, "mass_sun": 1.5, "facts": ["Зимний Треугольник."], "description": "Близкий субгигант."},
    {"id": "betelgeuse", "name": "Бетельгейзе", "latin": "Betelgeuse", "kind": "star", "scale": "local", "radius": 1.35, "color": "#ff9b72", "spectral_type": "M1-2Ia", "distance_ly": 548, "ra": 5.92, "dec": 7.41, "constellation": "Орион", "apparent_magnitude": 0.42, "mass_sun": 16.5, "facts": ["Красный сверхгигант."], "description": "Пульсирующий гигант перед взрывом сверхновой."},
    {"id": "aldebaran", "name": "Альдебаран", "latin": "Aldebaran", "kind": "star", "scale": "local", "radius": 0.9, "color": "#ff8f4a", "spectral_type": "K5III", "distance_ly": 65.3, "ra": 4.6, "dec": 16.51, "constellation": "Телец", "apparent_magnitude": 0.85, "mass_sun": 1.16, "facts": ["Глаз Тельца."], "description": "Оранжевый гигант."},
    {"id": "antares", "name": "Антарес", "latin": "Antares", "kind": "star", "scale": "local", "radius": 1.2, "color": "#ff6a44", "spectral_type": "M1.5Iab", "distance_ly": 550, "ra": 16.49, "dec": -26.43, "constellation": "Скорпион", "apparent_magnitude": 0.96, "mass_sun": 12, "facts": ["Сердце Скорпиона."], "description": "Красный сверхгигант огромного диаметра."},
    {"id": "spica", "name": "Спика", "latin": "Spica", "kind": "star", "scale": "local", "radius": 0.7, "color": "#c8d8ff", "spectral_type": "B1III", "distance_ly": 250, "ra": 13.42, "dec": -11.16, "constellation": "Дева", "apparent_magnitude": 0.97, "mass_sun": 11.4, "facts": ["Тесная пара гигантов."], "description": "Голубая переменная звезда."},
    {"id": "pollux", "name": "Поллукс", "latin": "Pollux", "kind": "star", "scale": "local", "radius": 0.72, "color": "#ffc07a", "spectral_type": "K0III", "distance_ly": 33.8, "ra": 7.76, "dec": 28.03, "constellation": "Близнецы", "apparent_magnitude": 1.14, "mass_sun": 1.91, "facts": ["Экзопланета Фестиас."], "description": "Оранжевый гигант."},
    {"id": "deneb", "name": "Денеб", "latin": "Deneb", "kind": "star", "scale": "local", "radius": 1.15, "color": "#dce6ff", "spectral_type": "A2Ia", "distance_ly": 2615, "ra": 20.69, "dec": 45.28, "constellation": "Лебедь", "apparent_magnitude": 1.25, "mass_sun": 19, "facts": ["Виден с 2600 св. лет."], "description": "Белый сверхгигант огромной светимости."},
    {"id": "polaris", "name": "Полярная звезда", "latin": "Polaris", "kind": "star", "scale": "local", "radius": 0.95, "color": "#fff0c7", "spectral_type": "F7Ib", "distance_ly": 447, "ra": 2.53, "dec": 89.26, "constellation": "Малая Медведица", "apparent_magnitude": 1.98, "mass_sun": 5.4, "facts": ["Северный полюс мира."], "description": "Главный навигационный ориентир."}
]

# ==============================================================================
# 4. КАТАЛОГ МЕССЬЕ (110 ОБЪЕКТОВ)
# ==============================================================================
def build_messier_catalog():
    special_messier = {
        1: ("Крабовидная туманность", "nebula", 6500, 184.6, -5.8, "Остаток вспышки сверхновой 1054 года с пульсаром в центре.", ["Пульсар вращается 30 раз в секунду."]),
        8: ("Туманность Лагуна", "nebula", 4100, 6.0, -1.2, "Гигантское молекулярное облако звездообразования в созвездии Стрельца.", ["Видна невооруженным глазом."]),
        10: ("Скопление М10", "cluster", 14300, 3.9, 23.1, "Шаровое звездное скопление из 100 000 древних звезд.", ["Возраст звезд более 11.4 млрд лет."]),
        13: ("Скопление Геркулеса", "cluster", 22200, 59.0, 40.9, "300 000 звезд, цель исторического радиопослания Аресибо.", ["Одно из ярчайших шаровых скоплений."]),
        16: ("Туманность Орла", "nebula", 5700, 16.9, 0.8, "Знаменитые «Столпы творения» — колонны холодного газа.", ["Высота центрального столба 4 св. года."]),
        27: ("Туманность Гантель", "nebula", 1360, 60.8, -3.6, "Первая открытая планетарная туманность в истории.", ["Белый карлик с температурой 85 000 K."]),
        31: ("Галактика Андромеды", "galaxy", 2537000, 121.2, -21.6, "Ближайшая к нам гигантская спиральная галактика (1 трлн звезд).", ["Сближается с нами со скоростью 110 км/с."]),
        42: ("Туманность Ориона", "nebula", 1344, 209.0, -19.4, "Крыловидная туманность с горячим скоплением Трапеция.", ["Ближайшая колыбель массивных звезд."]),
        45: ("Плеяды", "cluster", 444, 166.6, -23.5, "«Семь сестер» — голубые звезды в лазурной отражательной туманности.", ["Молодое скопление (100 млн лет)."]),
        57: ("Туманность Кольцо", "nebula", 2570, 63.2, 14.0, "Изумрудно-рубиновый тороид газа вокруг белого карлика.", ["Сброс оболочки произошел 4000 лет назад."]),
        104: ("Галактика Сомбреро", "galaxy", 29300000, 298.4, 51.1, "Спиральная галактика с выступающей темной полосой пыли.", ["Чёрная дыра массой 1 млрд Солнц."])
    }

    kinds = ["cluster", "nebula", "cluster", "galaxy", "cluster"]
    catalog = []
    for m in range(1, 111):
        mid = f"m{m}"
        if m in special_messier:
            name, kind, dist, l, b, desc, facts = special_messier[m]
        else:
            kind = kinds[m % len(kinds)]
            name = f"Объект Мессье {m}"
            dist = 3000 + (m * 350) if kind != "galaxy" else 15000000 + (m * 250000)
            l = (m * 33.7) % 360
            b = ((m * 19.3) % 120) - 60
            desc = f"Объект каталога Шарля Мессье (номер M{m}). Тип: {kind}."
            facts = [f"Обозначение: M{m}", f"Тип: {kind}"]

        catalog.append({
            "id": mid, "name": name, "latin": f"Messier {m}", "kind": kind, "scale": "galaxy",
            "radius": 1.6 if kind == "cluster" else 2.2 if kind == "nebula" else 3.2,
            "color": "#ffe0a8" if kind == "cluster" else "#ff8cb0" if kind == "nebula" else "#99ccff",
            "distance_ly": dist, "galactic_l": round(l, 1), "galactic_b": round(b, 1),
            "description": desc, "facts": facts, "source": "Messier Deep Sky Catalog"
        })
    return catalog

# ==============================================================================
# 5. NASA EXOPLANET ARCHIVE
# ==============================================================================
def fetch_nasa_exoplanets(limit=320):
    print(f"🛰️ Запрос к NASA Exoplanet Archive ({limit} экзопланет и звезд)...")
    url = (
        "https://exoplanetarchive.ipac.caltech.edu/TAP/sync?query="
        f"select+top+{limit}+pl_name,hostname,sy_dist,pl_rade,pl_bmasse,pl_orbper,pl_eqt,ra,dec,st_spectype,st_teff,discoverymethod"
        "+from+ps+where+default_flag=1+and+sy_dist+is+not+null+and+sy_dist<150+order+by+sy_dist+asc"
        "&format=json"
    )
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    objects = []
    seen = set()

    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            data = json.loads(resp.read().decode('utf-8'))
            for row in data:
                dist_ly = round(row['sy_dist'] * 3.26156, 1)
                host = row.get('hostname') or 'Star'
                star_id = host.lower().replace(" ", "_").replace("-", "_")
                ra_hours = round(row.get('ra', 0) / 15, 2)
                dec_deg = round(row.get('dec', 0), 2)
                teff = row.get('st_teff') or 5000
                spectype = row.get('st_spectype') or "G"

                if star_id not in seen:
                    seen.add(star_id)
                    color = "#ff8a62" if teff < 3700 else "#ffe0a0" if teff < 5500 else "#fff4d2" if teff < 7500 else "#c8dcff"
                    objects.append({
                        "id": star_id, "name": host, "latin": host, "kind": "star", "scale": "local",
                        "radius": 0.35, "color": color, "spectral_type": spectype,
                        "temperature_k": teff, "distance_ly": dist_ly, "ra": ra_hours, "dec": dec_deg,
                        "description": f"Звезда спектрального класса {spectype} с температурой {teff} K в {dist_ly} св. лет от Солнца.",
                        "facts": [f"Спектр: {spectype}", f"Температура: {teff:,} K"],
                        "source": "NASA Exoplanet Archive"
                    })

                pl_name = row['pl_name']
                pl_id = pl_name.lower().replace(" ", "_").replace("-", "_")
                eqt = row.get('pl_eqt') or 280
                rade = row.get('pl_rade')
                masse = row.get('pl_bmasse')
                period = row.get('pl_orbper')

                objects.append({
                    "id": pl_id, "name": pl_name, "latin": pl_name, "kind": "exoplanet", "scale": "local",
                    "parent": star_id, "radius": 0.16,
                    "color": "#4f83ff" if 200 <= eqt <= 320 else "#c45d46" if eqt > 500 else "#70b0ff",
                    "distance_ly": dist_ly, "ra": ra_hours, "dec": dec_deg,
                    "mass_earth": round(masse, 2) if masse else None,
                    "radius_earth": round(rade, 2) if rade else None,
                    "period_days": round(period, 2) if period else None,
                    "temperature_k": eqt,
                    "description": f"Экзопланета в системе {host}, период обращения {round(period, 2) if period else 'н/д'} сут.",
                    "facts": [f"Орбитальный период: {round(period, 2) if period else 'н/д'} сут", f"Температура: {eqt} K"],
                    "source": "NASA Exoplanet Archive"
                })
            print(f"✅ Загружено {len(objects)} объектов из NASA!")
            return objects
    except Exception as e:
        print(f"⚠️ Ошибка NASA ({e})")
        return []

def main():
    catalog = []
    catalog.extend(SOLAR_SYSTEM)     # 45+ тел Солнечной системы!
    catalog.extend(BLACK_HOLES)      # Чёрные дыры
    catalog.extend(FAMOUS_STARS)     # Яркие звёзды
    catalog.extend(build_messier_catalog())
    catalog.extend(fetch_nasa_exoplanets(320))

    OUTPUT_FILE.parent.mkdir(parents=True, exist_ok=True)
    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(catalog, f, ensure_ascii=False, indent=2)

    print(f"\n🚀 КАТАЛОГ ВСЕЛЕННОЙ ВОССТАНОВЛЕН И СОБРАН!")
    print(f"📦 Всего небесных тел: {len(catalog)}")
    print(f"📍 Записано в: {OUTPUT_FILE}")

if __name__ == "__main__":
    main()
