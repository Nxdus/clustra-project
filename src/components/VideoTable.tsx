import * as React from "react"
import {
    useReactTable,
    flexRender,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    ColumnDef,
    PaginationState,
} from "@tanstack/react-table"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table"
import { Button } from "./ui/button"
import { Trash2, Code, Copy, Pencil, Check, X, Globe, Lock, CopyIcon } from "lucide-react"
import { Switch } from "./ui/switch"
import { toast } from "@/hooks/use-toast"
import { Video } from "@/types/video"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog"
import { VideoDialog } from "./VideoDialog"
import { Input } from "./ui/input"
import { useState } from "react"
import { useTranslations, useLocale } from 'next-intl'

interface VideoTableProps {
    videos: Video[]
    onDelete: (fileKey: string) => Promise<void>
    onUpdateAccess: (fileKey: string, isPublic: boolean) => Promise<void>
    onRename: () => Promise<void>
    onRefreshStats: () => Promise<void>
}

const AccessControl = React.memo(({ video, onUpdateAccess }: { video: Video, onUpdateAccess: (fileKey: string, isPublic: boolean) => Promise<void> }) => {
    const [isPublic, setIsPublic] = React.useState(video.isPublic);
    const [isUpdating, setIsUpdating] = React.useState(false);
    const t = useTranslations();

    React.useEffect(() => {
        setIsPublic(video.isPublic);
    }, [video.isPublic]);

    const handleToggle = async () => {
        try {
            setIsUpdating(true);

            const response = await fetch('/api/videos/access', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    videoId: video.id,
                    isPublic: !isPublic
                })
            });

            if (!response.ok) {
                throw new Error('Failed to update access');
            }

            setIsPublic(!isPublic);

            if (onUpdateAccess) {
                onUpdateAccess(video.id, !isPublic);
            }

            toast({
                title: t('success.title'),
                description: t('video.access.success')
            });
        } catch (error) {
            console.error('Error updating access:', error);
            toast({
                title: t('error.title'),
                description: t('video.access.error'),
                variant: "destructive"
            });
        } finally {
            setIsUpdating(false);
        }
    };

    return (
        <Switch
            checked={isPublic}
            onCheckedChange={handleToggle}
            disabled={isUpdating}
        />
    );
});
AccessControl.displayName = 'AccessControl';

const TitleCell = ({ row, onRename }: {
    row: { original: Video },
    onRename: () => Promise<void>
}) => {
    const video = row.original;
    const [isEditing, setIsEditing] = useState(false);
    const [newName, setNewName] = useState(video.displayName || video.name);
    const t = useTranslations();

    const handleRename = async () => {
        try {
            const response = await fetch('/api/videos/rename', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    videoId: video.id,
                    displayName: newName
                })
            });

            if (!response.ok) {
                throw new Error('Failed to rename video');
            }

            setIsEditing(false);
            await onRename();
            toast({
                title: t('success.title'),
                description: t('video.rename.success')
            });
        } catch {
            toast({
                title: t('error.title'),
                description: t('error.description'),
                variant: 'destructive',
            });
        }
    };

    return (
        <div className="flex items-center justify-center gap-2">
            {isEditing ? (
                <div className="flex items-center gap-2 bg-muted/50 p-2 rounded-md">
                    <Input
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        className="h-8 w-48 bg-background text-center"
                        autoFocus
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                handleRename();
                            } else if (e.key === 'Escape') {
                                setIsEditing(false);
                            }
                        }}
                    />
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleRename}
                        className="h-8 w-8 p-0 hover:bg-blue-50 dark:hover:bg-blue-950 hover:text-blue-600 dark:hover:text-blue-400"
                    >
                        <Check className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsEditing(false)}
                        className="h-8 w-8 p-0 hover:bg-red-50 dark:hover:bg-red-950 hover:text-red-600 dark:hover:text-red-400"
                    >
                        <X className="h-4 w-4" />
                    </Button>
                </div>
            ) : (
                <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-center">{video.displayName || video.name}</span>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsEditing(true)}
                        className="h-7 w-7 p-0 hover:bg-blue-50 dark:hover:bg-blue-950 hover:text-blue-600 dark:hover:text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                        <Pencil className="h-3.5 w-3.5" />
                    </Button>
                </div>
            )}
        </div>
    );
};

const CellComponent = ({ row, locale }: { row: { original: Video }, locale: string }) => {
    const date = new Date(row.original.uploadedAt);
    return (
        <div className="text-center">
            <span className="text-sm text-muted-foreground">
                {date.toLocaleDateString(locale === 'th' ? 'th-TH' : 'en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                })}
            </span>
        </div>
    );
};

const ActionsCell = ({ row, onDelete, onRefreshStats }: {
    row: { original: Video },
    onDelete: (fileKey: string) => Promise<void>,
    onRefreshStats: () => Promise<void>
}) => {
    const video = row.original;
    const staticUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/stream/${video.id}`;
    const t = useTranslations();

    return (
        <div className="flex items-center justify-center gap-2">
            <VideoDialog video={video} />
            <Button
                variant="ghost"
                size="sm"
                className="h-8 hover:bg-blue-50 dark:hover:bg-blue-950 hover:text-blue-600 dark:hover:text-blue-400"
                onClick={() => {
                    navigator.clipboard.writeText(staticUrl);
                    toast({
                        title: t('video.copy.success'),
                        description: t('video.copy.description')
                    });
                }}
            >
                <Copy className="h-4 w-4 mr-2" />
                {t('video.copy.button')}
            </Button>
            <Dialog>
                <DialogTrigger asChild>
                    <Button
                        variant="ghost"
                        size="lg"
                        className="h-8 hover:bg-blue-50 dark:hover:bg-blue-950 hover:text-blue-600 dark:hover:text-blue-400"
                    >
                        <Code className="h-4 w-4 mr-2" />
                        {t('video.viewCode')}
                    </Button>
                </DialogTrigger>
                <DialogContent className="max-w-3xl">
                    <DialogHeader>
                        <DialogTitle>{t('video.viewCode')}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-900 font-mono text-sm overflow-auto">
                            <div className="flex justify-between">
                                <pre className="whitespace-pre-wrap break-words max-w-full">
                                    {`<video id="player" controls>\n    <source src="${process.env.NEXT_PUBLIC_API_URL}/api/stream/${video.id}" type="application/x-mpegURL">\n</video>\n\n<script src="https://cdn.jsdelivr.net/npm/hls.js@latest"></script>\n\n<script>\n    const video = document.getElementById('player');\n    if(Hls.isSupported()) {\n        const hls = new Hls();\n        hls.loadSource('${process.env.NEXT_PUBLIC_API_URL}/api/stream/${video.id}');\n        hls.attachMedia(video);\n    }\n</script>`}
                                </pre>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                        navigator.clipboard.writeText(`<video id="player" controls>\n    <source src="${process.env.NEXT_PUBLIC_API_URL}/api/stream/${video.id}" type="application/x-mpegURL">\n</video>\n\n<script src="https://cdn.jsdelivr.net/npm/hls.js@latest"></script>\n\n<script>\n    const video = document.getElementById('player');\n    if(Hls.isSupported()) {\n        const hls = new Hls();\n        hls.loadSource('${process.env.NEXT_PUBLIC_API_URL}/api/stream/${video.id}');\n        hls.attachMedia(video);\n    }\n</script>`); // แทนที่ด้วยข้อความที่ต้องการคัดลอก
                                        toast({
                                            title: t('video.copy.success'),
                                            description: t('video.copy.description')
                                        });
                                    }}
                                >
                                    <CopyIcon/>
                                </Button>
                            </div>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
            <Button
                variant="ghost"
                size="sm"
                className="h-8 hover:bg-red-50 dark:hover:bg-red-950 hover:text-red-600 dark:hover:text-red-400"
                onClick={async () => {
                    try {
                        await onDelete(video.id);
                        await onRefreshStats();
                    } catch (error) {
                        console.error('Error deleting video:', error);
                    }
                }}
            >
                <Trash2 className="h-4 w-4 mr-2" />
                {t('video.delete')}
            </Button>
        </div>
    );
};

export function VideoTable({ videos, onDelete, onUpdateAccess, onRename, onRefreshStats }: VideoTableProps) {
    const t = useTranslations()
    const locale = useLocale()
    const [pagination, setPagination] = React.useState<PaginationState>({
        pageIndex: 0,
        pageSize: 5,
    })
    const [globalFilter, setGlobalFilter] = useState('')

    const columns: ColumnDef<Video>[] = [
        {
            accessorKey: 'title',
            header: t('video.table.title'),
            size: 300,
            cell: ({ row }) => <TitleCell row={row} onRename={onRename} />
        },
        {
            accessorKey: 'createdAt',
            header: t('video.table.uploadDate'),
            size: 200,
            cell: ({ row }) => <CellComponent row={row} locale={locale} />
        },
        {
            accessorKey: 'isPublic',
            header: t('video.table.access'),
            size: 200,
            cell: ({ row }) => {
                const video = row.original;
                return (
                    <div className="flex items-center justify-center gap-4">
                        <div className="flex items-center gap-2">
                            {video.isPublic ? (
                                <Globe className="h-4 w-4 text-blue-500" />
                            ) : (
                                <Lock className="h-4 w-4 text-orange-500" />
                            )}
                            <span className="text-sm text-muted-foreground">
                                {video.isPublic ? t('video.access.public') : t('video.access.private')}
                            </span>
                        </div>
                        <AccessControl video={video} onUpdateAccess={onUpdateAccess} />
                    </div>
                )
            }
        },
        {
            id: 'actions',
            cell: ({ row }) => <ActionsCell row={row} onDelete={onDelete} onRefreshStats={onRefreshStats} />
        }
    ]

    const table = useReactTable({
        data: videos,
        columns,
        state: {
            pagination,
        },
        onPaginationChange: setPagination,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
    })

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-4">
                <Input
                    placeholder={t('video.search.placeholder')}
                    value={globalFilter ?? ''}
                    onChange={event => setGlobalFilter(event.target.value)}
                    className="h-8 w-[250px] text-sm"
                />
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow className="hover:bg-transparent">
                            {table.getHeaderGroups().map((headerGroup) => (
                                headerGroup.headers.map((header) => (
                                    <TableHead
                                        key={header.id}
                                        className="text-xs font-medium text-muted-foreground text-center h-11"
                                        style={{ width: header.column.columnDef.size }}
                                    >
                                        {flexRender(
                                            header.column.columnDef.header,
                                            header.getContext()
                                        )}
                                    </TableHead>
                                ))
                            ))}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {table.getRowModel().rows?.length ? (
                            table.getRowModel().rows.map((row) => (
                                <TableRow
                                    key={row.id}
                                    className="group hover:bg-slate-50 dark:hover:bg-slate-900"
                                >
                                    {row.getVisibleCells().map((cell) => (
                                        <TableCell
                                            key={cell.id}
                                            style={{ width: cell.column.columnDef.size }}
                                        >
                                            {flexRender(
                                                cell.column.columnDef.cell,
                                                cell.getContext()
                                            )}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell
                                    colSpan={columns.length}
                                    className="h-[200px] text-center"
                                >
                                    <div className="flex flex-col items-center justify-center space-y-1.5">
                                        <span className="text-sm text-muted-foreground font-medium">
                                            {t('video.empty.title')}
                                        </span>
                                        <span className="text-xs text-muted-foreground/70">
                                            {t('video.empty.description')}
                                        </span>
                                    </div>
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            {table.getFilteredRowModel().rows.length > 0 && (
                <div className="pt-3 border-t border-slate-200 dark:border-slate-800">
                    <div className="flex items-center justify-between gap-2">
                        <span className="text-xs text-muted-foreground">
                            {t('video.table.total', { count: table.getFilteredRowModel().rows.length })}
                        </span>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => table.previousPage()}
                                disabled={!table.getCanPreviousPage()}
                                className="h-7 px-3 text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300"
                            >
                                {t('common.previous')}
                            </Button>
                            <span className="text-sm text-muted-foreground">
                                {table.getState().pagination.pageIndex + 1} / {table.getPageCount()}
                            </span>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => table.nextPage()}
                                disabled={!table.getCanNextPage()}
                                className="h-7 px-3 text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300"
                            >
                                {t('common.next')}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
} 