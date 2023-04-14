/**
 * Читает частотный словарь http://dict.ruslang.ru/freq.php
 * и словарь http://opencorpora.org/dict.php
 * и выбирает из первого все существительные, сверяясь со вторым
 * т.е. в первом может быть какая-то дичь
 * 
 * ПРИМЕР
 *      node ./src/games/wordmaker/extractWords.js ~/Downloads/freqrnc2011.csv ~/Downloads/dict.opcorpora.txt
 */

const readline = require('node:readline');
const fs = require('fs');

const freqrnc2011Filename = process.argv[2]
const opcorporaFilename = process.argv[3]

if (!freqrnc2011Filename || !opcorporaFilename) {
    console.error('Нужно передать пути до словарей');
    return;
}

async function loadOpcorpora() {
    const opcorpora = new Set();
    const fileStream = fs.createReadStream(opcorporaFilename);

    const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity,
    });

    for await (const line of rl) {
        const splitted = line.split('\t');

        if (splitted.length < 2) {
            continue;
        }

        const [word, grs] = splitted;


        if (
            // существит
            grs.includes('NOUN') &&
            // имен.падеж
            grs.includes('nomn') &&
            // ед.число
            grs.includes('sing') &&
            // не устаревшее
            !grs.includes('Arch') &&
            // не имя
            !grs.includes('Name') &&
            // не фамилия
            !grs.includes('Surn') &&
            // не отчество
            !grs.includes('Patr') &&
            // не абривиатуры
            !grs.includes('Abbr') &&
            // не организация
            !grs.includes('Orgn') &&
            // не торговая марка
            !grs.includes('Trad') &&
            // не сленг
            !grs.includes('Slng') &&
            // не разговорные
            !grs.includes('Infr') &&
            // не опечатки
            !grs.includes('Erro') &&
            // не литературный вариант (ВЕТР, ЗАГРАДОГНЬ, ОГНЬ, УГЛЬ, ЦЕРКВА)
            !grs.includes('Litr') &&
            // не искажение (пока таких вообще то нет)
            !grs.includes('Dist')
        ) {
            opcorpora.add(word.toLowerCase().replace('ё', 'е'));
        }
    }

    return opcorpora;
}

async function loadFreqrnc() {
    const freqrnc = new Set();
    const fileStream = fs.createReadStream(process.argv[2]);

    const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity,
    });

    for await (const line of rl) {
        const [
            // Лемма
            word,
            // Часть речи
            pos,
            // Частота, общее количество употреблений леммы (общая частота в единицах ipm)
            freq,
            // частотный ранг слова (то есть порядковый номер в общем частотном списке),
            R,
            // коэффициент вариации
            D,
            // число текстов, в которых встретилось слово (число документов)
            numberOfTexts
        ] = line.split('\t');

        if (pos === 's') {
            freqrnc.add(word.toLowerCase().replace('ё', 'е'));
        }
    }

    return freqrnc;
}

loadFreqrnc();

Promise.all([loadOpcorpora(), loadFreqrnc()]).then(([opcorpora, freqrnc]) => {
    console.log('opcorpora', opcorpora.size)
    console.log('freqrnc', freqrnc.size)

    const intersection = [...freqrnc].filter(x => opcorpora.has(x));

    console.log('intersection', intersection.length)

    for (const word of intersection) {
        console.log(word)
    }
});