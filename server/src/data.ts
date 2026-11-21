export type LocationId = "L0"|"L1"|"L2"|"L3"|"L4"|"L5"|"L6"|"L7"|"L8"|"L9";
export interface Location { id: LocationId; x: number; y: number; }
export interface Order { id: string; machine: string; weight: number; pickup: LocationId; delivery: LocationId; }
export interface Vehicle { id: "A"|"B"; name: string; capacity: number; maxItems: number; }
export const locations: Location[] = [
  {id:"L0",x:0,y:0},{id:"L1",x:3,y:8},{id:"L2",x:10,y:11},
  {id:"L3",x:17,y:9},{id:"L4",x:9,y:-6},{id:"L5",x:26,y:3},
  {id:"L6",x:-7,y:13},{id:"L7",x:20,y:-8},{id:"L8",x:23,y:15},{id:"L9",x:-8,y:-5}
];
const weights = [800,1300,1800,2400,3100,3900,4800,6100,7500,9400];
const pairs: [LocationId,LocationId][] = [
  ["L1","L3"],["L2","L5"],["L9","L4"],["L3","L0"],["L0","L8"],
  ["L5","L7"],["L8","L2"],["L4","L9"],["L6","L1"],["L7","L3"]
];
export const orders: Order[] = weights.map((weight,i)=>({
  id:`N${String(i+1).padStart(2,"0")}`, machine:`M${String(i+1).padStart(2,"0")}`,
  weight, pickup:pairs[i][0], delivery:pairs[i][1]
}));
export const vehicles: Vehicle[] = [
  {id:"A",name:"Kamion A",capacity:3500,maxItems:2},
  {id:"B",name:"Kamion B",capacity:10000,maxItems:3}
];
export function distance(a: LocationId,b: LocationId): number {
  const p=locations.find(x=>x.id===a)!, q=locations.find(x=>x.id===b)!;
  return Math.round(Math.hypot(p.x-q.x,p.y-q.y)*10)/10;
}
