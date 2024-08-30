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
    Input,
} from '@nextui-org/react';

import React, { useEffect, useMemo, useState } from 'react';

import { useAsyncList } from '@react-stately/data';
import { useInfiniteScroll } from '@nextui-org/use-infinite-scroll';

import dayjs from 'dayjs';
import { Howl, Howler } from 'howler';
import ControlPanel from './control-panel';

import {
    AuthType,
    BufferLike,
    createClient,
    FileStat,
    ResponseDataDetailed,
} from 'webdav';
import { FaSearch } from 'react-icons/fa';

const FileStatSortComp = (fa: FileStat, fb: FileStat) => {
    return -dayjsCompare(fa.lastmod, fb.lastmod);
};

const dayjsCompare = (dateA: string, dataB: string) => {
    return dayjs(dateA) < dayjs(dataB) ? -1 : 1;
};

interface iPlaylistTableProps {
    sound?: Howl;
    setSound: (sound: Howl) => void;
}

const client = createClient('http://localhost:80/music/', {
    authType: AuthType.None,
});

async function getWebDAV() {
    const webdavItems = await client.getDirectoryContents(
        '',
    );
    return webdavItems;
}

function PlaylistTable(props: iPlaylistTableProps) {
    let { sound, setSound } = props;
    const [playlist, setPlaylist] = React.useState<
        FileStat[]
    >([]);

    const [filter, setFilter] = useState('');

    const [isLoading, setIsLoading] = React.useState(true);
    const [page, setPage] = React.useState(1);
    const rowsPerPage = 17;
    const getPlaylist = async () => {
        if (playlist.length === 0) {
            const pl = (await getWebDAV()) as FileStat[];
            pl.sort(FileStatSortComp);
            setPlaylist(pl);
            return pl;
        } else {
            return playlist;
        }
    };

    const filteredPlaytlist = useMemo(() => {
        return playlist.filter((song) => {
            song.basename
                .toLowerCase()
                .includes(filter.toLowerCase());
        });
    }, [playlist, filter]);

    async function getAudio(index: number) {
        if (index < playlist.length) {
            const audioFileStat = playlist[index];
            const { filename } = audioFileStat;
            const filenameArray = filename.split('.');
            const audioFormat =
                filenameArray[filenameArray.length - 1];

            const audioBuffer: BufferLike =
                (await client.getFileContents(
                    filename,
                )) as BufferLike;

            const audoByteArray = new Uint8Array(
                audioBuffer,
            );
            const blob = new Blob([audoByteArray], {
                type: 'music/' + audioFormat,
            });
            const howlSource = URL.createObjectURL(blob);
            if (sound) {
                sound.stop();
            }
            const source = new Howl({
                src: [howlSource],
                format: [audioFormat],
            });
            setSound(source);
            source.play();
            source.once('end', () => {
                if (index == playlist.length - 1) {
                    getAudio(0);
                } else {
                    getAudio(index + 1);
                }
            });
        }
    }

    let list = useAsyncList({
        async load({ signal, filterText }) {
            let pl = await getPlaylist();
            if (pl.length !== 0) {
                setIsLoading(false);
            }
            if (filterText) {
                pl = pl.filter((song) => {
                    return song.basename
                        .toLowerCase()
                        .includes(filterText.toLowerCase());
                });
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
        return list.items.slice(start, end) as FileStat[];
    }, [page, list]);

    return (
        <div className='flex flex-col'>
            <Input
                className='max-h-[10dvh]'
                variant='bordered'
                value={list.filterText}
                onValueChange={list.setFilterText}
                startContent={<FaSearch />}
            />
            <Table
                className='max-h-[80dvh]'
                aria-label='Playlist Table'
                color='secondary'
                selectionMode='multiple'
                sortDescriptor={list.sortDescriptor}
                onSortChange={list.sort}
                onRowAction={(audioIndex) =>
                    getAudio(Number(audioIndex))
                }
                layout='auto'
                showSelectionCheckboxes={false}
                selectionBehavior='replace'
                bottomContentPlacement='outside'
                bottomContent={
                    <div className='flex w-full justify-center'>
                        <Pagination
                            isCompact
                            showControls
                            showShadow
                            color='secondary'
                            page={page}
                            total={pages}
                            onChange={(page) =>
                                setPage(page)
                            }
                        />
                    </div>
                }
            >
                <TableHeader>
                    <TableColumn>Index</TableColumn>
                    <TableColumn>Etag</TableColumn>
                    <TableColumn
                        key='basename'
                        allowsSorting
                    >
                        Name
                    </TableColumn>
                    <TableColumn
                        key='lastmod'
                        allowsSorting
                    >
                        LastMod
                    </TableColumn>
                </TableHeader>
                <TableBody
                    isLoading={isLoading}
                    loadingContent={'Loading playlist...'}
                    emptyContent={'No song in the playlist'}
                >
                    {pageItems.map(
                        (song: FileStat, index) => {
                            const songIndex: number =
                                (page - 1) * rowsPerPage +
                                index;
                            return (
                                <TableRow key={songIndex}>
                                    <TableCell>
                                        {songIndex}
                                    </TableCell>
                                    <TableCell>
                                        {song.etag}
                                    </TableCell>
                                    <TableCell className='text-blue-600'>
                                        {song.basename}
                                    </TableCell>
                                    <TableCell>
                                        {dayjs(
                                            song.lastmod,
                                        ).format(
                                            'YYYY-MM-DD HH:mm:ss',
                                        )}
                                    </TableCell>
                                </TableRow>
                            );
                        },
                    )}
                </TableBody>
            </Table>
        </div>
    );
}

function PlaylistPanel(props) {
    return (
        <>
            <PlaylistTable {...props} />
        </>
    );
}

export default PlaylistPanel;
