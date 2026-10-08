'use client';
import dynamic from 'next/dynamic';
import Skeleton from '@mui/material/Skeleton';
export type MapMarker = { pos: [number, number]; color?: string; label?: string; icon?: 'school' | 'home'; key?: string; onClick?: () => void };
export type MapProps = { center: [number, number]; zoom?: number; markers?: MapMarker[]; circles?: { pos: [number, number]; radius: number; color?: string }[]; line?: [number, number][]; onPick?: (lat: number, lng: number) => void; height?: number | string; fit?: boolean; label?: string };
const Inner = dynamic(() => import('./MapInner'), { ssr: false, loading: () => <Skeleton variant="rounded" height={260} sx={{ borderRadius: '18px' }} /> });
export default function MapView(p: MapProps) { return <Inner {...p} />; }
