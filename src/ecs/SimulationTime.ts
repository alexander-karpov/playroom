export class SimulationTime {
    constructor(
        // Время от начала симуляции в секундах
        readonly time: number,
        // Время от последнего обновления в секундах
        readonly delta: number) { };
}
