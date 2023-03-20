export function choose<T>(choices: readonly T[]): T | undefined {
    return choices[Math.floor(Math.random() * choices.length)];
}