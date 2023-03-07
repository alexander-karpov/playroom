* Вынести работу с entities как с индексом в отдельный класс EntitiesIndex
* Возможно вынести работу с поиском компонентов в класс ComponentsIndex
* Изменить поиск компонентов. Каждой сущности просто присваивать массив размером 32 (можно сильно сократить через типы до 16 или 8) куда записывать индексы в массивах с компонентами (или сами компоненты)

---
1. Ожидание подключения второго игрока
2. После команды Старт игроки появляются в своей точки респауна
3. После поражения игрок появляется в своей точке респауна
4. Победителю начисляется сквозное очко
---
* Проверить что сигнал Атака отправляется пока кнопка нажата, пакеты могут теряться
* Использовать экстраполяцию врага, но ! дорисовывать промежуточные кадры если он слишком быстро перемещается, как в кинематографической съёмке, может быть текущий кадр тоже полупрозрачным
* Добавить комнаты. Соединять в signal только с одинаковыми комнатами. Передавать через get параметр
* Добавить в список stun и turn серверов гугловские и прочие на всякий случай
* Закодировать состояния типа bool через один бит. Так большую часть данных можно передать одним битом. Возможно перейти на передачу данных на int и float передавать в int
* Растягивать двигающиеся предметы (персонажей) по направлению движения
* сделать отдельные вызовы send и receive для упрощения всей схемы
* Возможно стоит перенести js код в libjs чтобы он там собирался (минифицировался хотя бы)
* Когда оппонент отключается, переподключаться в другой комнате  если есть непустые! ??
* Добавить динамическое создание комнат. Почему бы и нет? Тогда не придётся переживать что комнат не хватит. То слишком много их не будет т.к. люди сначала будут пытаться найти свободную комнату
* Поискать eslint плагин для отслеживания аллокации памяти джава-скриптом.
---
* Установить плагины аналитики Unity проекта
* Перейти на Burst компилятор
* Перейти на ECM или как его
* При передаче сообщений использовать ArrayBufferView чтобы избежать копирования
* Сменить тип компрессии с gzip на бротли