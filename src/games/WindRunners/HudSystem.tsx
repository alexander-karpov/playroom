import React, { useEffect, useState, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import type { World } from '~/ecs';
import { System } from '~/ecs';
import styled, { createGlobalStyle } from 'styled-components';
import { TinyEmitter } from 'tiny-emitter';
import * as THREE from 'three';
import { Player } from './Player';
import { Ship } from './Ship';

const emitter = new TinyEmitter();

const HudStyles = createGlobalStyle`
.Hud {
    position: absolute;
    display: flex;
    justify-content: space-around;
    bottom: 18px;
    width: 100%;
    user-select: none;
    touch-action: none;
    pointer-events: none;
    color: white;
}
`;

const Hud: React.FC = () => {
    const healthBarRef = useRef<HTMLDivElement>(null);

    function updateHealth(percent: number) {
        if (healthBarRef.current) {
            healthBarRef.current.style.background = `linear-gradient(to right, rgba(255, 255, 255, .8) ${percent}%, rgba(255, 255, 255, 0.33)  ${percent}%)`;
        }
    }

    useEffect(() => {
        emitter.on('health', updateHealth);

        return () => {
            emitter.off('health', updateHealth);
        };
    });

    return (
        <>
            <HudStyles />
            <HealthBar ref={healthBarRef} />
        </>
    );
};

const HealthBar = styled.div`
    box-sizing: border-box;
    max-width: 160px;
    flex-grow: 1;
    height: 10px;
    border-radius: 5px;
    border: 1px solid rgba(255, 255, 255, .8);
`;

export class HudSystem extends System {
    private lastUpdatedHealthPercent = 0;

    public constructor(private readonly world: World) {
        super();

        const hudElem = document.createElement('div');
        hudElem.classList.add('Hud');
        document.body.appendChild(hudElem);

        // Render your React component instead
        const root = createRoot(hudElem);
        root.render(<Hud />);
    }

    public override onSimulate(world: World, deltaSec: number): void {
        for (const id of this.world.select([Player, Ship])) {
            const { health, maxHealth } = this.world.get(id, Ship);

            const healthPercent = 100 * (health / maxHealth);

            if (healthPercent !== this.lastUpdatedHealthPercent) {
                this.lastUpdatedHealthPercent = healthPercent;
                emitter.emit('health', healthPercent);
            }
        }
    }
}
