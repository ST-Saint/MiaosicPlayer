/* eslint-disable react-hooks/exhaustive-deps */
'use client';
import {
    Table,
    TableHeader,
    TableColumn,
    TableBody,
    TableRow,
    TableCell,
    RadioGroup,
    Radio,
    Pagination,
    Spinner,
    getKeyValue,
    Link,
    Slider,
} from '@nextui-org/react';
import React, { useEffect, useState } from 'react';

import { useAsyncList } from '@react-stately/data';
import { useInfiniteScroll } from '@nextui-org/use-infinite-scroll';

import dayjs from 'dayjs';
import { Howl, Howler } from 'howler';

import {
    AuthType,
    BufferLike,
    createClient,
    FileStat,
    ResponseDataDetailed,
} from 'webdav';

interface iSong {
    basename: string;
    etag: string;
    filename: string;
    lastmod: string;
    mime: string;
    size: number;
    type: string;
}

const client = createClient('http://localhost:80/music/', {
    authType: AuthType.Password,
    username: 'yayu',
    password: '',
});

async function getFile() {
    const directoryItems =
        await client.getDirectoryContents('');
    return directoryItems;
}

let sound: Howl | null = null;

async function getAudio(filename: string) {
    if (typeof filename === 'string') {
        const filenameArray = filename.split('.');
        const audioFormat =
            filenameArray[filenameArray.length - 1];

        const audioBuffer: BufferLike =
            (await client.getFileContents(
                filename,
            )) as BufferLike;

        const audoByteArray = new Uint8Array(audioBuffer);
        const blob = new Blob([audoByteArray], {
            type: 'music/' + audioFormat,
        });
        const howlSource = URL.createObjectURL(blob);
        if (sound) {
            sound.stop();
        }
        sound = new Howl({
            src: [howlSource],
            format: [audioFormat],
        });

        sound.play();
    }
}

const FileStatSortComp = (fa: FileStat, fb: FileStat) => {
    return -dayjsCompare(fa.lastmod, fb.lastmod);
};

const dayjsCompare = (dateA: string, dataB: string) => {
    return dayjs(dateA) < dayjs(dataB) ? -1 : 1;
};

function PlayListTable() {
    const [playlist, setPlayList] = React.useState<
        FileStat[]
    >([]);
    const [isLoading, setIsLoading] = React.useState(true);
    const [page, setPage] = React.useState(1);
    const rowsPerPage = 15;
    const getPlaylist = async () => {
        if (playlist.length === 0) {
            const pl = (await getFile()) as FileStat[];
            pl.sort(FileStatSortComp);
            setPlayList(pl);
            return pl;
        } else {
            return playlist;
        }
    };

    let list = useAsyncList({
        async load({ signal }) {
            let pl = await getPlaylist();
            if (pl.length !== 0) {
                setIsLoading(false);
            }
            return {
                items: pl,
            };
        },
        async sort({ items, sortDescriptor }) {
            let comp_func = (
                first: string,
                second: string,
            ) => {
                return first < second ? -1 : 1;
            };

            if (sortDescriptor.column == 'lastmod') {
                comp_func = dayjsCompare;
            }
            return {
                items: items.sort((a, b) => {
                    let first = a[sortDescriptor.column];
                    let second = b[sortDescriptor.column];
                    let cmp = comp_func(first, second);

                    if (
                        sortDescriptor.direction ===
                        'descending'
                    ) {
                        cmp *= -1;
                    }

                    return cmp;
                }),
            };
        },
    });

    useEffect(() => {
        list.reload();
    }, [playlist]);

    const pages = Math.ceil(
        list.items.length / rowsPerPage,
    );

    const pageItems: FileStat[] = React.useMemo(() => {
        const start = (page - 1) * rowsPerPage;
        const end = start + rowsPerPage;
        return list.items.slice(start, end);
    }, [page, list]);

    return (
        <Table
            aria-label='Playlist Table'
            color='secondary'
            selectionMode='multiple'
            sortDescriptor={list.sortDescriptor}
            onSortChange={list.sort}
            onRowAction={(audioFile) =>
                getAudio(audioFile as string)
            }
            selectionBehavior='replace'
            bottomContent={
                <div className='flex w-full justify-center'>
                    <Pagination
                        isCompact
                        showControls
                        showShadow
                        color='secondary'
                        page={page}
                        total={pages}
                        onChange={(page) => setPage(page)}
                    />
                </div>
            }
        >
            <TableHeader>
                <TableColumn>Index</TableColumn>
                <TableColumn>Etag</TableColumn>
                <TableColumn key='basename' allowsSorting>
                    Name
                </TableColumn>
                <TableColumn key='lastmod' allowsSorting>
                    LastMod
                </TableColumn>
            </TableHeader>
            <TableBody
                isLoading={isLoading}
                loadingContent={'Loading playlist...'}
                emptyContent={'No song in the playlist'}
            >
                {pageItems.map((song: FileStat, index) => {
                    return (
                        <TableRow key={song.filename}>
                            <TableCell>{index}</TableCell>
                            <TableCell>
                                {song.etag}
                            </TableCell>
                            <TableCell>
                                <Link>{song.basename}</Link>
                            </TableCell>
                            <TableCell>
                                {dayjs(song.lastmod).format(
                                    'YYYY-MM-DD HH:mm:ss',
                                )}
                            </TableCell>
                        </TableRow>
                    );
                })}
            </TableBody>
        </Table>
    );
}

export default function Home() {
    const [volume, setVolume] = useState(50);

    return (
        <>
            <PlayListTable />
            <Slider
                label='Volume'
                step={1}
                maxValue={100}
                minValue={0}
                value={volume}
                onChange={(vol) => {
                    setVolume(vol as number);
                    sound?.volume(volume/100);
                }}
                className='max-w-md'
            />
        </>
    );
}
