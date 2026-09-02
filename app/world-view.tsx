'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Globe2, LocateFixed, Minus, Plus, Search, Users, X } from 'lucide-react';

const MAP_WIDTH = 1000;
const MAP_HEIGHT = 520;
const SUBNATIONAL_COUNTRIES: Record<string, { code: string; country: string; region: string }> = {
  'ca/qc': { code: 'ca', country: 'Canada', region: 'Québec' },
  'gb/eng': { code: 'gb', country: 'United Kingdom', region: 'England' },
  'gb/nir': { code: 'gb', country: 'United Kingdom', region: 'Northern Ireland' },
  'gb/sct': { code: 'gb', country: 'United Kingdom', region: 'Scotland' },
  'gb/wls': { code: 'gb', country: 'United Kingdom', region: 'Wales' },
};

export type WorldPlayer = {
  Rank: number; Runner: string; Country: string | null; 'Flag URL': string | null; 'Total Score': number;
  'Prolific Score': number; 'Unique Boards': number; 'Unique Games': number; WRs: number; playerKey?: string;
};
export type WorldRun = { runner: string; gameAbbr: string; gameToggle: string };
export type RunnerMetadata = { playerKey: string; runner: string; countryCode: string | null; country: string | null; regionCode: string | null; region: string | null; icon: string | null; image: string | null; profile: string | null };
export type WorldFilters = { query: string; game: string; country: string; region: string };
type GeoFeature = { properties: Record<string, string | number | null>; geometry: { type: 'Polygon' | 'MultiPolygon'; coordinates: number[][][] | number[][][][] } };
type RegionCentroid = { countryCode: string; code: string; name: string; postal: string | null; latitude: number; longitude: number };
type MapPoint = { player: WorldPlayer; meta: RunnerMetadata | null; countryCode: string; country: string; region: string; x: number; y: number; avatar: string | null };
type MapPosition = { x: number; y: number };

function normalize(value: string | null | undefined) { return String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase().replace(/[^a-z0-9]/g, ''); }
function project(longitude: number, latitude: number) { return { x: (longitude + 180) / 360 * MAP_WIDTH, y: (90 - latitude) / 180 * MAP_HEIGHT }; }
function hash(value: string) { let output = 2166136261; for (let index = 0; index < value.length; index += 1) output = Math.imul(output ^ value.charCodeAt(index), 16777619); return output >>> 0; }
function countryCode(value: string | null | undefined) { const raw = String(value || '').toLocaleLowerCase().replace(/-/g, '/'); if (raw === 'valhalla' || raw === 'vh') return 'vh'; return SUBNATIONAL_COUNTRIES[raw]?.code || raw.slice(0, 2); }
function format(value: number, decimals = 0) { return new Intl.NumberFormat('en-US', { maximumFractionDigits: decimals, minimumFractionDigits: decimals }).format(value || 0); }
function safeImage(value: string | null | undefined) { try { const url = new URL(value || ''); return url.protocol === 'https:' && (url.hostname === 'speedrun.com' || url.hostname.endsWith('.speedrun.com')) ? url.href : null; } catch { return null; } }
function clamp(value: number, minimum: number, maximum: number) { return Math.min(maximum, Math.max(minimum, value)); }
function clampPan(pan: MapPosition, zoom: number) {
  return { x: clamp(pan.x, MAP_WIDTH * (1 - zoom), 0), y: clamp(pan.y, MAP_HEIGHT * (1 - zoom), 0) };
}

function ringPath(points: number[][]) {
  let path = ''; let previousX: number | null = null;
  points.forEach(([longitude, latitude], index) => {
    const point = project(longitude, latitude);
    const jump = previousX !== null && Math.abs(point.x - previousX) > MAP_WIDTH / 2;
    path += `${index === 0 || jump ? 'M' : 'L'}${point.x.toFixed(2)},${point.y.toFixed(2)}`;
    previousX = point.x;
  });
  return path + 'Z';
}

function featurePath(feature: GeoFeature) {
  if (feature.geometry.type === 'Polygon') return (feature.geometry.coordinates as number[][][]).map(ringPath).join('');
  return (feature.geometry.coordinates as number[][][][]).flatMap((polygon) => polygon.map(ringPath)).join('');
}

export default function WorldView({ players, runs, metadata, gameNames, openProfile, filters, onFiltersChange }: { players: WorldPlayer[]; runs: WorldRun[]; metadata: RunnerMetadata[]; gameNames: Record<string, string>; openProfile: (runner: string) => void; filters: WorldFilters; onFiltersChange: (update: Partial<WorldFilters>) => void }) {
  const [features, setFeatures] = useState<GeoFeature[]>([]);
  const [regions, setRegions] = useState<RegionCentroid[]>([]);
  const { query, game, country: selectedCountry, region: selectedRegion } = filters;
  const [zoom, setZoom] = useState(1); const [pan, setPan] = useState({ x: 0, y: 0 });
  const mapRef = useRef<SVGSVGElement | null>(null);
  const zoomRef = useRef(1);
  const panRef = useRef<MapPosition>({ x: 0, y: 0 });
  const drag = useRef<{ x: number; y: number; panX: number; panY: number; moved: boolean } | null>(null);
  const suppressClick = useRef(false);
  const focusedLocation = useRef('');

  function setMapView(nextZoom: number, nextPan: MapPosition) {
    const boundedZoom = clamp(nextZoom, 1, 6);
    const boundedPan = clampPan(nextPan, boundedZoom);
    zoomRef.current = boundedZoom; panRef.current = boundedPan;
    setZoom(boundedZoom); setPan(boundedPan);
  }
  function svgPoint(svg: SVGSVGElement, clientX: number, clientY: number) {
    const matrix = svg.getScreenCTM();
    if (!matrix) return { x: MAP_WIDTH / 2, y: MAP_HEIGHT / 2 };
    const point = svg.createSVGPoint(); point.x = clientX; point.y = clientY;
    const transformed = point.matrixTransform(matrix.inverse());
    return { x: transformed.x, y: transformed.y };
  }
  function zoomAt(nextZoom: number, anchor: MapPosition) {
    const currentZoom = zoomRef.current; const currentPan = panRef.current;
    const mapX = (anchor.x - currentPan.x) / currentZoom; const mapY = (anchor.y - currentPan.y) / currentZoom;
    const boundedZoom = clamp(nextZoom, 1, 6);
    setMapView(boundedZoom, { x: anchor.x - mapX * boundedZoom, y: anchor.y - mapY * boundedZoom });
  }
  function endDrag() {
    suppressClick.current = Boolean(drag.current?.moved);
    drag.current = null;
  }

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const handleWheel = (event: WheelEvent) => {
      event.preventDefault(); event.stopPropagation();
      const factor = clamp(Math.exp(-event.deltaY * .0016), .78, 1.28);
      zoomAt(zoomRef.current * factor, svgPoint(map, event.clientX, event.clientY));
    };
    map.addEventListener('wheel', handleWheel, { passive: false });
    return () => map.removeEventListener('wheel', handleWheel);
  }, []);

  useEffect(() => {
    Promise.all([
      fetch('./world-countries.geojson').then((response) => response.json()),
      fetch('./world-region-centroids.json').then((response) => response.json()),
    ]).then(([world, regionData]) => { setFeatures((world as { features?: GeoFeature[] }).features || []); setRegions((regionData as { regions?: RegionCentroid[] }).regions || []); });
  }, []);

  const metadataByKey = useMemo(() => new Map(metadata.map((item) => [item.playerKey, item])), [metadata]);
  const metadataByRunner = useMemo(() => new Map(metadata.map((item) => [item.runner, item])), [metadata]);
  const gamesByRunner = useMemo(() => {
    const output = new Map<string, Set<string>>();
    runs.forEach((run) => { const set = output.get(run.runner) || new Set<string>(); set.add(run.gameAbbr); output.set(run.runner, set); });
    return output;
  }, [runs]);
  const countryLocations = useMemo(() => {
    const output = new Map<string, { longitude: number; latitude: number; name: string }>();
    features.forEach((feature) => {
      const properties = feature.properties; const code = countryCode(String(properties.ISO_A2_EH || properties.ISO_A2 || properties.WB_A2 || ''));
      const longitude = Number(properties.LABEL_X); const latitude = Number(properties.LABEL_Y); const name = String(properties.NAME_LONG || properties.ADMIN || properties.NAME || '');
      if (code && code !== '-9' && Number.isFinite(longitude) && Number.isFinite(latitude)) output.set(code, { longitude, latitude, name });
      if (name && Number.isFinite(longitude) && Number.isFinite(latitude)) output.set(normalize(name), { longitude, latitude, name });
    });
    return output;
  }, [features]);
  const regionLocations = useMemo(() => {
    const output = new Map<string, RegionCentroid>();
    regions.forEach((region) => { output.set(`${region.countryCode}|${normalize(region.name)}`, region); output.set(`${region.countryCode}|${normalize(region.code)}`, region); if (region.postal) output.set(`${region.countryCode}|${normalize(region.postal)}`, region); });
    return output;
  }, [regions]);

  const points = useMemo(() => players.flatMap((player) => {
    const meta = metadataByKey.get(player.playerKey || '') || metadataByRunner.get(player.Runner) || null; const rawCountryCode = String(meta?.countryCode || '').toLocaleLowerCase().replace(/-/g, '/'); const subdivision = SUBNATIONAL_COUNTRIES[rawCountryCode];
    const code = countryCode(rawCountryCode) || normalize(player.Country).slice(0, 2); const country = subdivision?.country || meta?.country || player.Country || 'Unlisted country'; const rawRegionCode = String(meta?.regionCode || '');
    const regionKeyCandidates = [normalize(rawRegionCode), normalize(rawRegionCode.split('/').slice(0, 2).join('/')), normalize(meta?.region), normalize(String(meta?.region || '').split(',')[0]), normalize(subdivision?.region)];
    const regionLocation = regionKeyCandidates.map((key) => regionLocations.get(`${code}|${key}`)).find(Boolean);
    const region = regionLocation?.name || subdivision?.region || (meta?.region ? String(meta.region).split(',')[0] : 'Region not listed');
    const location = regionLocation || countryLocations.get(code) || countryLocations.get(normalize(country));
    if (!location) return [];
    const seed = hash(player.playerKey || player.Runner); const angle = seed % 360 / 180 * Math.PI; const radius = Math.sqrt(((seed >>> 8) % 1000) / 1000) * (regionLocation ? 20 : 55);
    const baseLongitude = 'longitude' in location ? location.longitude : 0; const baseLatitude = 'latitude' in location ? location.latitude : 0;
    const projected = project(baseLongitude, baseLatitude);
    return [{ player, meta, countryCode: code, country, region, x: projected.x + Math.cos(angle) * radius, y: projected.y + Math.sin(angle) * radius, avatar: safeImage(meta?.image || meta?.icon) } as MapPoint];
  }), [countryLocations, metadataByKey, metadataByRunner, players, regionLocations]);
  const filteredPoints = useMemo(() => {
    const needle = normalize(query);
    return points.filter((point) => (!needle || normalize(`${point.player.Runner} ${point.country} ${point.region}`).includes(needle)) && (game === 'All games' || gamesByRunner.get(point.player.Runner)?.has(game)) && (!selectedCountry || point.country === selectedCountry) && (!selectedRegion || point.region === selectedRegion));
  }, [game, gamesByRunner, points, query, selectedCountry, selectedRegion]);
  const countryGroups = useMemo(() => Array.from(filteredPoints.reduce((map, point) => { const current = map.get(point.country) || []; current.push(point); map.set(point.country, current); return map; }, new Map<string, MapPoint[]>()).entries()).sort((a, b) => b[1].length - a[1].length), [filteredPoints]);
  const regionGroups = useMemo(() => Array.from(filteredPoints.reduce((map, point) => { const current = map.get(point.region) || []; current.push(point); map.set(point.region, current); return map; }, new Map<string, MapPoint[]>()).entries()).sort((a, b) => b[1].length - a[1].length), [filteredPoints]);
  const visibleIndividuals = useMemo(() => [...filteredPoints].sort((a, b) => a.player.Rank - b.player.Rank).slice(0, 500), [filteredPoints]);
  const laidOutIndividuals = useMemo(() => {
    if (!visibleIndividuals.length) return [];
    const centerX = visibleIndividuals.reduce((sum, point) => sum + point.x, 0) / visibleIndividuals.length; const centerY = visibleIndividuals.reduce((sum, point) => sum + point.y, 0) / visibleIndividuals.length;
    return visibleIndividuals.map((point, index) => { const angle = index * 2.3999632297; const radius = Math.sqrt(index) * 3.2; return { ...point, x: centerX + Math.cos(angle) * radius, y: centerY + Math.sin(angle) * radius }; });
  }, [visibleIndividuals]);
  const activeGroups = selectedCountry ? regionGroups : countryGroups;
  const panelPoints = filteredPoints;

  useEffect(() => {
    const locationKey = selectedCountry ? `${selectedCountry}|${selectedRegion}` : '';
    if (!locationKey) { focusedLocation.current = ''; return; }
    if (focusedLocation.current === locationKey || !points.length) return;
    const locationPoints = points.filter((point) => point.country === selectedCountry && (!selectedRegion || point.region === selectedRegion));
    if (!locationPoints.length) return;
    focusedLocation.current = locationKey;
    focus(locationPoints, selectedRegion ? 4.2 : 2.35);
  }, [points, selectedCountry, selectedRegion]);

  function focus(pointsToFocus: MapPoint[], nextZoom: number) {
    if (!pointsToFocus.length) return;
    const x = pointsToFocus.reduce((sum, point) => sum + point.x, 0) / pointsToFocus.length; const y = pointsToFocus.reduce((sum, point) => sum + point.y, 0) / pointsToFocus.length;
    setMapView(nextZoom, { x: MAP_WIDTH / 2 - x * nextZoom, y: MAP_HEIGHT / 2 - y * nextZoom });
  }
  function resetMap() { focusedLocation.current = ''; onFiltersChange({ country: '', region: '' }); setMapView(1, { x: 0, y: 0 }); }
  function selectGroup(name: string, groupPoints: MapPoint[]) {
    if (!selectedCountry) { focusedLocation.current = `${name}|`; onFiltersChange({ country: name, region: '' }); focus(groupPoints, 2.35); }
    else { focusedLocation.current = `${selectedCountry}|${name}`; onFiltersChange({ region: name }); focus(groupPoints, 4.2); }
  }

  return <section className="view-section world-view">
    <div className="page-heading"><div><p className="eyebrow">The engine around the globe</p><h2>World</h2></div><Globe2 size={28} /></div>
    <div className="world-toolbar"><label className="search-box"><Search size={17} /><input value={query} onChange={(event) => onFiltersChange({ query: event.target.value })} placeholder="Search runner, country or province" /></label><select aria-label="Filter World by game" value={game} onChange={(event) => onFiltersChange({ game: event.target.value })}><option>All games</option>{Object.entries(gameNames).map(([key, name]) => <option key={key} value={key}>{name}</option>)}</select><div className="world-breadcrumbs"><button onClick={resetMap}>World</button>{selectedCountry && <><span>/</span><button onClick={() => { focusedLocation.current = `${selectedCountry}|`; onFiltersChange({ region: '' }); focus(points.filter((point) => point.country === selectedCountry), 2.35); }}>{selectedCountry}</button></>}{selectedRegion && <><span>/</span><strong>{selectedRegion}</strong></>}</div><span className="world-count"><Users size={15} />{format(filteredPoints.length)} mapped runners</span></div>
    <div className="world-layout">
      <section className="world-map-shell">
        <svg ref={mapRef} className="world-map" viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`} role="img" aria-label="Interactive map of SMB1 engine runners" tabIndex={0} onDoubleClick={(event) => { event.preventDefault(); zoomAt(zoomRef.current * 1.5, svgPoint(event.currentTarget, event.clientX, event.clientY)); }} onKeyDown={(event) => { const center = { x: MAP_WIDTH / 2, y: MAP_HEIGHT / 2 }; if (event.key === '+' || event.key === '=') { event.preventDefault(); zoomAt(zoomRef.current * 1.3, center); } else if (event.key === '-') { event.preventDefault(); zoomAt(zoomRef.current / 1.3, center); } else if (event.key === '0') { event.preventDefault(); setMapView(1, { x: 0, y: 0 }); } else if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) { event.preventDefault(); const step = 34; setMapView(zoomRef.current, { x: panRef.current.x + (event.key === 'ArrowLeft' ? step : event.key === 'ArrowRight' ? -step : 0), y: panRef.current.y + (event.key === 'ArrowUp' ? step : event.key === 'ArrowDown' ? -step : 0) }); } }} onPointerDown={(event) => { if (event.button !== 0) return; const point = svgPoint(event.currentTarget, event.clientX, event.clientY); drag.current = { x: point.x, y: point.y, panX: panRef.current.x, panY: panRef.current.y, moved: false }; event.currentTarget.setPointerCapture(event.pointerId); }} onPointerMove={(event) => { if (!drag.current) return; const point = svgPoint(event.currentTarget, event.clientX, event.clientY); const dx = point.x - drag.current.x; const dy = point.y - drag.current.y; if (Math.abs(dx) + Math.abs(dy) > 3) drag.current.moved = true; setMapView(zoomRef.current, { x: drag.current.panX + dx, y: drag.current.panY + dy }); }} onPointerUp={endDrag} onPointerCancel={endDrag} onLostPointerCapture={endDrag}>
          <rect width={MAP_WIDTH} height={MAP_HEIGHT} className="world-ocean" />
          <g transform={`translate(${pan.x} ${pan.y}) scale(${zoom})`}>
            {features.map((feature, index) => <path className="world-country" vectorEffect="non-scaling-stroke" fillRule="evenodd" d={featurePath(feature)} key={`${feature.properties.ADM0_A3 || feature.properties.NAME}-${index}`} />)}
            {!selectedRegion && activeGroups.map(([name, groupPoints]) => { const x = groupPoints.reduce((sum, point) => sum + point.x, 0) / groupPoints.length; const y = groupPoints.reduce((sum, point) => sum + point.y, 0) / groupPoints.length; const radius = Math.min(15, 5 + Math.sqrt(groupPoints.length) * .55) / Math.sqrt(zoom); return <g className="world-cluster" transform={`translate(${x} ${y})`} onClick={(event) => { event.stopPropagation(); if (suppressClick.current) { suppressClick.current = false; return; } selectGroup(name, groupPoints); }} key={name}><circle r={radius} /><text y={1 / Math.sqrt(zoom)} fontSize={Math.max(4, radius * .72)}>{groupPoints.length}</text><title>{name}: {groupPoints.length} runners</title></g>; })}
            {selectedRegion && laidOutIndividuals.map((point) => <g className="world-runner-point" transform={`translate(${point.x} ${point.y})`} onClick={(event) => { event.stopPropagation(); if (suppressClick.current) { suppressClick.current = false; return; } openProfile(point.player.Runner); }} key={point.player.playerKey || point.player.Runner}><circle r={8 / zoom} /><image href={point.avatar || './mario-logo.webp'} x={-7 / zoom} y={-7 / zoom} width={14 / zoom} height={14 / zoom} preserveAspectRatio="xMidYMid slice" /><title>{point.player.Runner} · {point.region}, {point.country}</title></g>)}
          </g>
        </svg>
        <div className="world-map-controls"><button onClick={() => zoomAt(zoomRef.current * 1.3, { x: MAP_WIDTH / 2, y: MAP_HEIGHT / 2 })} disabled={zoom >= 5.999} title="Zoom in"><Plus size={17} /></button><button onClick={() => zoomAt(zoomRef.current / 1.3, { x: MAP_WIDTH / 2, y: MAP_HEIGHT / 2 })} disabled={zoom <= 1.001} title="Zoom out"><Minus size={17} /></button><button onClick={resetMap} disabled={zoom <= 1.001 && pan.x === 0 && pan.y === 0 && !selectedCountry && !selectedRegion} title="Reset map"><LocateFixed size={17} /></button></div>
        <p className="world-map-note">Markers use public country or province data and deterministic spread. They never represent an exact address.</p>
      </section>
      <aside className="world-panel">
        <div className="world-panel-heading"><div><span>{selectedRegion ? 'Province or region' : selectedCountry ? 'Country detail' : 'Global overview'}</span><h3>{selectedRegion || selectedCountry || 'Where the engine runs'}</h3></div>{(selectedCountry || selectedRegion) && <button onClick={resetMap} title="Clear location"><X size={17} /></button>}</div>
        <div className="world-panel-stats"><div><strong>{format(panelPoints.length)}</strong><span>Runners</span></div><div><strong>{format(panelPoints.reduce((sum, point) => sum + point.player.WRs, 0))}</strong><span>WRs</span></div><div><strong>{format(panelPoints.reduce((sum, point) => sum + point.player['Total Score'], 0), 0)}</strong><span>Total points</span></div></div>
        {!selectedRegion && <div className="world-location-list">{activeGroups.slice(0, 16).map(([name, groupPoints], index) => <button onClick={() => selectGroup(name, groupPoints)} key={name}><span>{index + 1}</span><strong>{name}<small>{groupPoints[0]?.country === name ? `${new Set(groupPoints.map((point) => point.region)).size} listed regions` : groupPoints[0]?.country}</small></strong><em>{format(groupPoints.length)}</em></button>)}</div>}
        {selectedRegion && <div className="world-runner-list">{visibleIndividuals.slice(0, 18).map((point) => <button onClick={() => openProfile(point.player.Runner)} key={point.player.playerKey || point.player.Runner}><img src={point.avatar || './mario-logo.webp'} alt="" loading="lazy" /><strong>{point.player.Runner}<small>#{point.player.Rank} · {format(point.player.WRs)} WRs</small></strong><em>{format(point.player['Total Score'], 2)}</em></button>)}</div>}
        <p className="world-source">Geography: Natural Earth. Runner locations and profile assets: public Speedrun.com profiles.</p>
      </aside>
    </div>
  </section>;
}
