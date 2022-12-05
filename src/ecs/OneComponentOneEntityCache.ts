/**
 * Преждевременная оптимизация
 * Предполагается хранить тут массив из 32 (сколько компонентов)
 * значений, где значение – это любая сущность у которой есть этот компонент
 * Это ускорит доступ к сущностям «синглтонам» типа Renderer, Player
 */
class OneComponentOneEntityCache {
    reminder = console.warn('Я преждевременная оптимизация. Сделай что-нибудь со мной');
}
