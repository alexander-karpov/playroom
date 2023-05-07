import React, { useEffect, useState, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import type { World } from '~/ecs';
import { System } from '~/ecs';
import styled, { createGlobalStyle } from 'styled-components';
import { Player } from './Player';
import { Active } from '~/components';
import { ObjectPoolHelper } from './ObjectPoolHelper';
import { type Engine } from 'matter-js';
import { TinyEmitter } from 'tiny-emitter';

const emitter = new TinyEmitter();

const MainMenuStyles = createGlobalStyle`
.MainMenu {
    position: absolute;
    display: flex;
    justify-content: center;
    align-items: center;
    flex-direction: column;
    user-select: none;
    color: white;
    top: 0;
    width: 100%;
    height: 100%;

    font-size: 20px;
    font-family: sans-serif;
}

.MainMenu_hidden {
   display: none;
}
`;

const Plate = styled.div`
    display: flex;
    justify-content: center;
    align-items: center;
    flex-direction: column;
    color: white;
    background-color: rgba(0,0,0,.8);

    padding: 8px 12px;
    font-size: 16px;
    font-family: sans-serif;
`;

const StartButton = styled.div`
    box-sizing: border-box;
    border-radius: 5px;
    border: 1px solid rgba(255, 255, 255, .8);
    padding: 8px 12px;
`;

const Message = styled.div`
    padding: 0 8px 12px 8px;
`;

const TouchGuide = styled.div`
    width: 180px;
    height: 90px;
    background-image: url('./assets/sprites/touch_guide.gif');
    filter: invert(1);
`;

const MainMenu: React.FC<{ onStart: () => void }> = ({ onStart }) => {
    const [maxScore, setMaxScore] = useState(window.localStorage.getItem('kukuruku_max_space_score'));
    const [score, setScore] = useState(0);

    function update(props: { score: number }) {
        setScore(props.score);
        setMaxScore(window.localStorage.getItem('kukuruku_max_space_score'));
    }

    useEffect(() => {
        emitter.on('update', update);

        return () => {
            emitter.off('health', update);
        };
    });



    return (
        <Plate>
            <MainMenuStyles />

            {(score > 0) ?
                <Message>Счёт {score}</Message>
                : undefined
            }

            {(maxScore != null) ?
                <Message>Рекорд {maxScore}</Message>
                : <>
                    <TouchGuide />
                    <Message>Нажмите на экран для управления кораблём</Message>
                </>
            }
            <StartButton children="Начать игру" onClick={onStart} />
        </Plate>
    );
};

export class MainMenuSystem extends System {
    private readonly menuElem: HTMLDivElement;

    public constructor(
        private readonly world: World,
        private readonly engine: Engine
    ) {
        super();

        this.menuElem = document.createElement('div');
        this.menuElem.classList.add('MainMenu');
        document.body.appendChild(this.menuElem);

        // Render your React component instead
        const root = createRoot(this.menuElem);
        root.render(<MainMenu
            onStart={() => {
                for (const id of world.selectExcept([Player], [Active])) {
                    ObjectPoolHelper.activate(world, this.engine, id);
                }
            }}
        />);
    }

    @System.on([Player, Active])
    private onPlayerActive(world: World, id: number) {
        this.menuElem.classList.add('MainMenu_hidden');
    }

    @System.onNot([Player, Active])
    private onNotPlayerActive(world: World, id: number) {
        const { score } = this.world.get(id, Player);
        emitter.emit('update', { score });
        this.menuElem.classList.remove('MainMenu_hidden');
    }
}
