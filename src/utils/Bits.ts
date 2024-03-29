// eslint-disable-next-line @typescript-eslint/no-extraneous-class
export class Bits {
    public static bits(...ns: number[]) {
        let mask = 0;

        for (const n of ns) {
            mask |= 1 << n;
        }

        return mask;
    }

    public static bit(n: number) {
        return 1 << n;
    }

    public static bit2(n1: number, n2: number) {
        return (1 << n1) | (1 << n2);
    }

    public static bit3(n1: number, n2: number, n3: number) {
        return (1 << n1) | (1 << n2) | (1 << n3);
    }
}
