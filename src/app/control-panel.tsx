'use client';

import {
    Slider,
    Tooltip,
    Popover,
    PopoverTrigger,
    PopoverContent,
    Button,
    Input,
    toggle,
} from '@nextui-org/react';

import {
    FaBackward,
    FaForward,
    FaMinus,
    FaRandom,
    FaRedo,
    FaRedoAlt,
    FaVolumeDown,
} from 'react-icons/fa';

import React, { useEffect, useState } from 'react';

interface iControlPanelProps {
    volume: number;
    sound?: Howl;
    setVolume: (vol: number) => void;
}

const ControlPanel = (props: iControlPanelProps) => {
    const { volume, sound, setVolume } = props;

    const setPlayback = (ratio: number) => {
        if (sound !== undefined) {
            const duration = sound.duration(ratio);
            sound.seek(duration * ratio);
        }
    };

    const [playing, setPlaying] = useState(false);

    const togglePlaying = () => {
        if (sound) {
            if (playing) {
                sound.play();
            } else {
                sound.pause();
            }
            setPlaying(!playing);
        }
    };

    const [progress, setProgress] = React.useState(0);
    React.useEffect(() => {
        if (sound) {
            sound.once('load', () => {
                const soundDuration = sound.duration();
                sound.once('play', () => {
                    const interval = setInterval(() => {
                        setProgress(
                            sound.seek() / soundDuration,
                        );
                    }, 100);
                    sound.once('end', () =>
                        clearInterval(interval),
                    );
                    sound.once('stop', () =>
                        clearInterval(interval),
                    );
                });
            });
        }
    }, [sound]);

    return (
        <div className='py-2 px-8 w-full mx-auto bg-white rounded-xl flex flex-col items-center space-x-2 h-[10vh] h-min-20'>
            <Slider
                aria-label='playback_bar'
                size='sm'
                color='secondary'
                hideThumb={true}
                step={0.001}
                maxValue={1}
                minValue={0}
                value={progress}
                className='flex h-8'
                onChangeEnd={(value) =>
                    setPlayback(Number(value))
                }
            />
            <div className='flex flex-row mx-auto max-w-xl justify-evenly w-full items-end'>
                <div className='flex flex-none items-center justify-center w-1/6'>
                    <Button variant='light'>
                        <FaRedoAlt />
                    </Button>
                </div>
                <div className='flex flex-none items-center justify-center w-1/6'>
                    <Button variant='light'>
                        <FaRandom />
                    </Button>
                </div>
                <div className='flex flex-none items-center justify-center w-1/6'>
                    <Button variant='light'>
                        <FaBackward />
                    </Button>
                </div>
                <div className='flex flex-none items-center justify-center w-1/6'>
                    <Button
                        variant='light'
                        color='secondary'
                        onPress={togglePlaying}
                    >
                        <FaMinus />
                    </Button>
                </div>
                <div className='flex flex-none items-center justify-center w-1/6'>
                    <Button variant='light'>
                        <FaForward />
                    </Button>
                </div>
                <div className='flex flex-none items-center justify-center w-1/6'>
                    <Button variant='light'></Button>
                </div>
                <div className='flex flex-none items-center justify-center w-1/6'>
                    <Popover
                        placement='top'
                        offset={4}
                        showArrow={false}
                    >
                        <PopoverTrigger>
                            <Button variant='light'>
                                <FaVolumeDown />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent>
                            <Slider
                                aria-label='volume'
                                orientation='vertical'
                                size='sm'
                                step={0.1}
                                maxValue={100}
                                minValue={0}
                                value={volume}
                                className='h-32'
                                onChange={(vol) => {
                                    setVolume(
                                        vol as number,
                                    );
                                    sound?.volume(
                                        volume / 100,
                                    );
                                }}
                            />
                        </PopoverContent>
                    </Popover>
                </div>
            </div>
        </div>
    );
};

export default ControlPanel;
