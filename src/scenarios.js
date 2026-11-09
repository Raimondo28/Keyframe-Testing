import {seed, DAY} from './model.js';
import {WESTPORT_IMAGERY} from './imagery.js';

const RADIUS = 6378137;
const WIDTH = 1000;
const HEIGHT = 620;
const WESTPORT_BOUNDS = {west:115.68, east:115.96, south:-32.267, north:-32.12009051788834};
const ENVELOPE_BASIS = 'Illustrative envelope — not an approved project boundary';
const SCENARIO_DISCLAIMER = 'Concept demonstration only. Project envelopes and detailed activity dates are illustrative, not approved Westport boundaries or a published construction programme. All detailed dates are scenario assumptions; source dates have not been verified.';

const freeze = value => {
  if (value && typeof value === 'object') {
    Object.values(value).forEach(freeze);
    Object.freeze(value);
  }
  return value;
};

export const SCENARIOS = freeze({
  westport: {
    id:'westport',
    label:'Westport · Perth upgrades',
    shortLabel:'Westport · Kwinana',
    title:'Westport, connected in space and time.',
    eyebrow:'WESTPORT · PERTH / KWINANA · CONCEPT SCENARIO',
    description:'Explore indicative marine, terminal and transport interfaces across a staged Westport planning scenario.',
    mapDescription:'Satellite context for the Kwinana and Cockburn Sound area with illustrative Westport project envelopes',
    defaultCursor:'2033-06-01',
    storageKey:'kfm-demo:westport',
    exportPrefix:'Westport-Perth',
    programmeName:'Westport_concept_programme.csv',
    programmeWindow:{start:'2026-01-01', end:'2040-01-01'},
    map:{type:'satellite', bounds:WESTPORT_BOUNDS, crs:'EPSG:3857', width:WIDTH, height:HEIGHT, ...WESTPORT_IMAGERY},
    sources:[],
    milestones:[],
    evidence:'scenario',
    sourceDatesVerified:false,
    disclaimer:SCENARIO_DISCLAIMER,
  },
  brisbane: {
    id:'brisbane',
    label:'Brisbane Airport · Capital works',
    shortLabel:'BNE · Capital works',
    title:'Every project. In the right place. At the right time.',
    eyebrow:'BRISBANE AIRPORT · CAPITAL WORKS',
    description:'Connect project footprints to your programme and see conflicts before they happen.',
    mapDescription:'Illustrative Brisbane Airport plan with project footprints',
    defaultCursor:'2027-02-15',
    storageKey:'kfm-demo:brisbane',
    exportPrefix:'Brisbane-Airport',
    programmeName:'BNE_capital_works.csv',
    programmeWindow:{start:'2027-02-01', end:'2027-03-07'},
    map:{type:'schematic', crs:null, width:WIDTH, height:HEIGHT},
    sources:[],
    milestones:[],
    evidence:'scenario',
    sourceDatesVerified:false,
    disclaimer:'Illustrative airport plan and synthetic project data. This scene is not georeferenced or connected to a live Keyframe project.',
  },
});

export function getScenario(id='westport') {
  return SCENARIOS[String(id).toLowerCase()] || SCENARIOS.westport;
}

function checkBounds(bounds) {
  if (!bounds || !['west','east','south','north'].every(k=>Number.isFinite(bounds[k])) ||
      bounds.west >= bounds.east || bounds.south >= bounds.north ||
      bounds.south <= -85.051129 || bounds.north >= 85.051129) {
    throw new RangeError('Use finite longitude/latitude bounds within the Web Mercator latitude limits.');
  }
}

const mercatorX = longitude => RADIUS * longitude * Math.PI / 180;
const mercatorY = latitude => RADIUS * Math.log(Math.tan(Math.PI/4 + latitude*Math.PI/360));

export function lonLatToPoint(lonLat, bounds=WESTPORT_BOUNDS) {
  checkBounds(bounds);
  if (!Array.isArray(lonLat) || lonLat.length !== 2 || !lonLat.every(Number.isFinite) || Math.abs(lonLat[1]) >= 85.051129) {
    throw new RangeError('Use a finite [longitude, latitude] coordinate within Web Mercator latitude limits.');
  }
  const west=mercatorX(bounds.west), east=mercatorX(bounds.east);
  const south=mercatorY(bounds.south), north=mercatorY(bounds.north);
  return [(mercatorX(lonLat[0])-west)/(east-west)*WIDTH, (north-mercatorY(lonLat[1]))/(north-south)*HEIGHT];
}

export function pointToLonLat(point, bounds=WESTPORT_BOUNDS) {
  checkBounds(bounds);
  if (!Array.isArray(point) || point.length !== 2 || !point.every(Number.isFinite)) {
    throw new RangeError('Use a finite [x, y] canvas coordinate.');
  }
  const west=mercatorX(bounds.west), east=mercatorX(bounds.east);
  const south=mercatorY(bounds.south), north=mercatorY(bounds.north);
  const x=west+point[0]/WIDTH*(east-west), y=north-point[1]/HEIGHT*(north-south);
  return [x/RADIUS*180/Math.PI, (2*Math.atan(Math.exp(y/RADIUS))-Math.PI/2)*180/Math.PI];
}

const WESTPORT_ENVELOPES = [
  {id:'WP-FP-001', name:'Cockburn Sound marine works', color:'#349ec4', geographicPoints:[[115.725,-32.197],[115.755,-32.195],[115.768,-32.218],[115.758,-32.239],[115.731,-32.233]]},
  {id:'WP-FP-002', name:'Kwinana terminal / reclamation', color:'#e89c39', geographicPoints:[[115.750,-32.201],[115.777,-32.201],[115.783,-32.227],[115.755,-32.232]]},
  {id:'WP-FP-003', name:'Terminal landside interface', color:'#9172d9', geographicPoints:[[115.773,-32.206],[115.814,-32.211],[115.812,-32.227],[115.776,-32.226]]},
  {id:'WP-FP-004', name:'Anketell corridor west', color:'#57a497', geographicPoints:[[115.797,-32.215],[115.902,-32.216],[115.902,-32.229],[115.797,-32.228]]},
  {id:'WP-FP-005', name:'Road / rail interface', color:'#d1788f', geographicPoints:[[115.821,-32.209],[115.844,-32.211],[115.841,-32.243],[115.818,-32.240]]},
  {id:'WP-FP-006', name:'Rail staging / laydown', color:'#6f89ca', geographicPoints:[[115.810,-32.235],[115.837,-32.235],[115.835,-32.252],[115.811,-32.250]]},
  {id:'WP-FP-007', name:'Logistics / commissioning', color:'#b3a14b', geographicPoints:[[115.778,-32.233],[115.807,-32.232],[115.811,-32.253],[115.781,-32.255]]},
];

const WESTPORT_ACTIVITIES = [
  {id:'WP-001', name:'Design & approvals scenario', footprint:'WP-FP-002', start:'2027-01-01', finish:'2029-12-31'},
  {id:'WP-010', name:'Enabling works scenario', footprint:'WP-FP-003', start:'2030-01-01', finish:'2031-12-31'},
  {id:'WP-101', name:'Marine works scenario', footprint:'WP-FP-001', start:'2031-01-01', finish:'2035-12-31'},
  {id:'WP-201', name:'Terminal construction scenario', footprint:'WP-FP-002', start:'2032-01-01', finish:'2037-12-31'},
  {id:'WP-202', name:'Terminal access interface scenario', footprint:'WP-FP-003', start:'2033-01-01', finish:'2037-12-31'},
  {id:'WP-301', name:'Anketell corridor scenario', footprint:'WP-FP-004', start:'2033-01-01', finish:'2037-12-31'},
  {id:'WP-302', name:'Road / rail interface scenario', footprint:'WP-FP-005', start:'2033-01-01', finish:'2037-12-31'},
  {id:'WP-303', name:'Rail staging scenario', footprint:'WP-FP-006', start:'2033-01-01', finish:'2037-12-31'},
  {id:'WP-401', name:'Logistics & commissioning scenario', footprint:'WP-FP-007', start:'2038-01-01', finish:'2039-12-31'},
];

export function seedScenario(id='westport') {
  const scenario=getScenario(id);
  if (scenario.id === 'brisbane') {
    return {scenarioId:scenario.id, ...seed(), source:scenario.programmeName};
  }
  return {
    scenarioId:scenario.id,
    source:scenario.programmeName,
    footprints:WESTPORT_ENVELOPES.map(envelope=>({
      ...envelope,
      geographicPoints:envelope.geographicPoints.map(point=>[...point]),
      points:envelope.geographicPoints.map(point=>lonLatToPoint(point, scenario.map.bounds)),
      basis:ENVELOPE_BASIS,
      evidence:'scenario',
    })),
    activities:WESTPORT_ACTIVITIES.map(activity=>({...activity, evidence:'scenario', dateBasis:'Illustrative scenario dates — not a published construction programme'})),
  };
}

const validDate = value => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(Date.parse(value+'T00:00:00Z')) && new Date(value+'T00:00:00Z').toISOString().slice(0,10) === value;

export function dateAt(offset, start) {
  if (!validDate(start) || !Number.isFinite(offset)) throw new RangeError('Use an ISO start date and finite day offset.');
  return new Date(Date.parse(start+'T00:00:00Z') + Math.trunc(offset)*DAY).toISOString().slice(0,10);
}

export function dayOffset(value, start) {
  if (!validDate(value) || !validDate(start)) throw new RangeError('Use ISO calendar dates.');
  return Math.round((Date.parse(value+'T00:00:00Z')-Date.parse(start+'T00:00:00Z'))/DAY);
}

export function programmeRange(activities=[], options={}) {
  for (const key of ['start','end']) {
    if (options[key] !== undefined && !validDate(options[key])) throw new RangeError('Programme bounds must use valid ISO calendar dates.');
  }
  if (options.start && options.end && options.start > options.end) throw new RangeError('Programme start must be on or before end.');
  const starts=activities.map(a=>a.start).filter(validDate);
  const ends=activities.map(a=>a.finish).filter(validDate);
  if (options.start) starts.push(options.start);
  if (options.end) ends.push(options.end);
  const start=starts.sort()[0] || options.end || '2026-01-01';
  const end=ends.sort().at(-1) || options.start || '2040-01-01';
  if (start > end) throw new RangeError('Programme start must be on or before end.');
  const spanDays=dayOffset(end,start)+1;
  const stepDays=spanDays<=90 ? 1 : spanDays<=730 ? 7 : spanDays<=2000 ? 30 : 90;
  return {start,end,spanDays,stepDays};
}

export function timelineTicks(range, count=5) {
  if (!range || !validDate(range.start) || !validDate(range.end) || range.start > range.end) throw new RangeError('Use an ordered programme range.');
  const spanDays=dayOffset(range.end,range.start)+1;
  const target=Math.max(2,Math.min(12,Math.trunc(count)||5));
  const ticks=new Set([range.start,range.end]);
  if (spanDays > 730) {
    const roughYears=spanDays/365.2425/(target-1);
    const interval=[1,2,3,5,10,20,25,50,100].find(n=>n>=roughYears) || Math.ceil(roughYears/100)*100;
    const firstYear=Number(range.start.slice(0,4));
    for(let year=Math.ceil(firstYear/interval)*interval;year<=Number(range.end.slice(0,4));year+=interval) {
      const value=`${String(year).padStart(4,'0')}-01-01`;
      if(value>range.start && value<range.end) ticks.add(value);
    }
  } else if (spanDays > 90) {
    const roughMonths=spanDays/30.4375/(target-1);
    const interval=[1,3,6,12].find(n=>n>=roughMonths) || 12;
    const firstMonth=Number(range.start.slice(0,4))*12+Number(range.start.slice(5,7))-1;
    const lastMonth=Number(range.end.slice(0,4))*12+Number(range.end.slice(5,7))-1;
    for(let month=Math.ceil(firstMonth/interval)*interval;month<=lastMonth;month+=interval) {
      const value=`${String(Math.floor(month/12)).padStart(4,'0')}-${String(month%12+1).padStart(2,'0')}-01`;
      if(value>range.start && value<range.end) ticks.add(value);
    }
  } else {
    const roughDays=(spanDays-1)/(target-1);
    const interval=[1,2,7,14,30].find(n=>n>=roughDays) || 30;
    for(let offset=interval;offset<spanDays-1;offset+=interval) ticks.add(dateAt(offset,range.start));
  }
  return [...ticks].sort();
}
