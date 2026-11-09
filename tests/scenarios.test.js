import test from 'node:test';
import assert from 'node:assert/strict';
import {seed, clashes, validPolygon} from '../src/model.js';
import {SCENARIOS, getScenario, seedScenario, lonLatToPoint, pointToLonLat, programmeRange, dateAt, dayOffset, timelineTicks} from '../src/scenarios.js';

const near=(actual,expected,tolerance=1e-8)=>assert.ok(Math.abs(actual-expected)<tolerance,`${actual} != ${expected}`);

test('Web Mercator bounds align with canvas corners and round-trip geographic coordinates',()=>{
  const bounds=SCENARIOS.westport.map.bounds;
  const nw=lonLatToPoint([bounds.west,bounds.north]);
  const se=lonLatToPoint([bounds.east,bounds.south]);
  near(nw[0],0);near(nw[1],0);near(se[0],1000);near(se[1],620);
  for(const coordinate of [[115.76,-32.22],[bounds.west,bounds.south],[bounds.east,bounds.north]]) {
    const result=pointToLonLat(lonLatToPoint(coordinate));
    near(result[0],coordinate[0]);near(result[1],coordinate[1]);
  }
  assert.ok(lonLatToPoint([115.8,-32.2])[0]>lonLatToPoint([115.7,-32.2])[0]);
  assert.ok(lonLatToPoint([115.8,-32.2])[1]<lonLatToPoint([115.8,-32.25])[1]);
});

test('Westport contains seven valid envelopes with explicit scenario evidence',()=>{
  const model=seedScenario();assert.equal(model.scenarioId,'westport');assert.equal(model.footprints.length,7);
  for(const footprint of model.footprints) {
    assert.equal(validPolygon(footprint.points),true,footprint.id);
    assert.equal(footprint.geographicPoints.length,footprint.points.length);
    assert.equal(footprint.basis,'Illustrative envelope — not an approved project boundary');
    assert.equal(footprint.evidence,'scenario');
  }
  assert.ok(model.activities.every(activity=>activity.evidence==='scenario'));
  assert.ok(getScenario().disclaimer.includes('source dates have not been verified'));
});

test('Westport deliberately illustrates overlapping marine, terminal and access works',()=>{
  const conflicts=clashes(seedScenario());assert.ok(conflicts.length>=1);
  assert.ok(conflicts.some(c=>[c.a.id,c.b.id].includes('WP-101')&&[c.a.id,c.b.id].includes('WP-201')));
  assert.ok(conflicts.some(c=>[c.a.id,c.b.id].includes('WP-201')&&[c.a.id,c.b.id].includes('WP-202')));
});

test('scenarios return independent editable model copies while retaining Brisbane',()=>{
  const first=seedScenario('westport'),second=seedScenario('westport');
  first.footprints[0].name='Edited';first.footprints[0].geographicPoints[0][0]=0;first.footprints[0].points[0][0]=0;first.activities[0].start='2045-01-01';
  assert.notEqual(second.footprints[0].name,'Edited');assert.notEqual(second.footprints[0].geographicPoints[0][0],0);assert.notEqual(second.footprints[0].points[0][0],0);assert.equal(second.activities[0].start,'2027-01-01');
  const brisbane=seedScenario('brisbane');assert.deepEqual(brisbane.footprints,seed().footprints);assert.deepEqual(brisbane.activities,seed().activities);assert.equal(clashes(brisbane).length,1);
  assert.equal(getScenario('BRISBANE').id,'brisbane');assert.equal(getScenario().id,'westport');assert.equal(getScenario('unknown').id,'westport');
});

test('programme ranges span every activity and optional bounds without clipping',()=>{
  const model=seedScenario();const range=programmeRange(model.activities);
  assert.deepEqual(range,{start:'2027-01-01',end:'2039-12-31',spanDays:4748,stepDays:90});
  const expanded=programmeRange(model.activities,SCENARIOS.westport.programmeWindow);
  assert.equal(expanded.start,'2026-01-01');assert.equal(expanded.end,'2040-01-01');
  const uncut=programmeRange(model.activities,{start:'2033-01-01',end:'2035-12-31'});
  assert.equal(uncut.start,'2027-01-01');assert.equal(uncut.end,'2039-12-31');
  assert.equal(programmeRange(seed().activities,SCENARIOS.brisbane.programmeWindow).spanDays,35);
  assert.equal(programmeRange([]).start,'2026-01-01');
});

test('UTC date offsets preserve inclusive leap-day and range endpoints',()=>{
  assert.equal(dateAt(1,'2032-02-28'),'2032-02-29');assert.equal(dateAt(2,'2032-02-28'),'2032-03-01');
  assert.equal(dayOffset('2032-03-01','2032-02-28'),2);
  const range=programmeRange(seedScenario().activities);
  assert.equal(dateAt(range.spanDays-1,range.start),range.end);
});

test('timeline ticks include endpoints and meaningful interior years or months',()=>{
  for(const range of [programmeRange(seedScenario().activities),programmeRange([]),programmeRange(seed().activities,SCENARIOS.brisbane.programmeWindow),programmeRange([],{start:'2032-01-01',end:'2032-12-31'})]) {
    const ticks=timelineTicks(range);
    assert.equal(ticks[0],range.start);assert.equal(ticks.at(-1),range.end);assert.deepEqual(ticks,[...new Set(ticks)].sort());assert.ok(ticks.length>=3&&ticks.length<=7);
    assert.ok(ticks.every(value=>value>=range.start&&value<=range.end));
    if(range.spanDays>730)assert.ok(ticks.slice(1,-1).every(value=>value.endsWith('-01-01')));
  }
  assert.deepEqual(timelineTicks({start:'2030-01-01',end:'2030-01-01'}),['2030-01-01']);
});

test('invalid projections and date ranges fail explicitly',()=>{
  assert.throws(()=>lonLatToPoint([115.7,90]),RangeError);assert.throws(()=>pointToLonLat([NaN,1]),RangeError);
  assert.throws(()=>lonLatToPoint([0,0],{west:10,east:0,north:10,south:0}),RangeError);
  assert.throws(()=>dateAt(1,'2030-02-30'),RangeError);assert.throws(()=>dayOffset('bad','2030-01-01'),RangeError);
  assert.throws(()=>programmeRange([],{start:'2035-01-01',end:'2030-01-01'}),RangeError);
});
