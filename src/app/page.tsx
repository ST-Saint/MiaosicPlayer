/* eslint-disable react-hooks/exhaustive-deps */
'use client';
import React, { useEffect, useState } from 'react';

import dayjs from 'dayjs';
import { Howl, Howler } from 'howler';
import ControlPanel from './control-panel';
import PlaylistPanel from './playlist-panel';

interface iSong {
    basename: string;
    etag: string;
    filename: string;
    lastmod: string;
    mime: string;
    size: number;
    type: string;
}

let sound: Howl | null = null;

export default function Home() {
    const [volume, setVolume] = useState(50);
    const [sound, setSound] = useState<Howl>();
    return (
        <div className='flex flex-col'>
            <div className='h-[90dvh] w-[80%] mx-auto'>
                <PlaylistPanel
                    sound={sound}
                    setSound={setSound}
                />
            </div>
            <div className='h-[10dvh] w-[50%] mx-auto'>
                <ControlPanel
                    volume={volume}
                    sound={sound}
                    setVolume={setVolume}
                />
            </div>
        </div>
    );
}
