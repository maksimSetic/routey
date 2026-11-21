import { distance, orders, vehicles, type Order, type Vehicle, type LocationId } from "./data.js";

export interface StopAction {
  orderId: string; machine: string; type: "PICKUP"|"DELIVERY";
  location: LocationId; weight: number; loadAfter: number; itemsAfter: number;
  distanceFromPrevious: number; elapsedMinutes: number;
}
export interface VehiclePlan {
  vehicle: Vehicle; actions: StopAction[]; route: LocationId[];
  distanceKm: number; workMinutes: number; orderCount: number;
}
export interface OptimizationResult {
  feasible: boolean; plans: VehiclePlan[]; totalDistanceKm: number;
  completedOrders: number; warnings: string[]; algorithm: string;
}
type Event = { order: Order; type:"PICKUP"|"DELIVERY"; loc:LocationId; bit:number };
type State = {
  mask:number; loc:LocationId; load:number; count:number; dist:number; ops:number;
  actions: StopAction[]; picked:Set<string>; delivered:Set<string>;
  score:number;
};

function eventsFor(subset: Order[]): Event[] {
  return subset.flatMap((o,i)=>[
    {order:o,type:"PICKUP" as const,loc:o.pickup,bit:1<<(2*i)},
    {order:o,type:"DELIVERY" as const,loc:o.delivery,bit:1<<(2*i+1)}
  ]);
}
function routeFor(subset: Order[], vehicle: Vehicle, beamWidth=650): VehiclePlan | null {
  if (!subset.length) return {vehicle,actions:[],route:["L0"],distanceKm:0,workMinutes:0,orderCount:0};
  const events=eventsFor(subset), full=(1<<events.length)-1;
  let beam:State[]=[{mask:0,loc:"L0",load:0,count:0,dist:0,ops:0,actions:[],picked:new Set(),delivered:new Set(),score:0}];
  for(let depth=0;depth<events.length;depth++){
    const next:State[]=[];
    for(const s of beam){
      for(const e of events){
        if(s.mask&e.bit) continue;
        const isPickup=e.type==="PICKUP";
        if(isPickup && s.delivered.has(e.order.id)) continue;
        if(!isPickup && !s.picked.has(e.order.id)) continue;
        const load=s.load+(isPickup?e.order.weight:-e.order.weight);
        const count=s.count+(isPickup?1:-1);
        if(load<0 || load>vehicle.capacity || count<0 || count>vehicle.maxItems) continue;
        const leg=distance(s.loc,e.loc), dist=Math.round((s.dist+leg)*10)/10;
        const ops=s.ops+1, work=dist/60*60+ops*20;
        if(work>540) continue;
        const picked=new Set(s.picked), delivered=new Set(s.delivered);
        if(isPickup) picked.add(e.order.id); else delivered.add(e.order.id);
        const action:StopAction={
          orderId:e.order.id,machine:e.order.machine,type:e.type,location:e.loc,
          weight:e.order.weight,loadAfter:load,itemsAfter:count,
          distanceFromPrevious:leg,elapsedMinutes:Math.round(work*10)/10
        };
        // A mild look-ahead term favors moving toward unfinished pickup/delivery points.
        const remaining=events.filter(x=>!(s.mask&x.bit)&&x.bit!==e.bit);
        const nearest=remaining.length ? Math.min(...remaining.map(x=>distance(e.loc,x.loc))) : distance(e.loc,"L0");
        const score=dist+nearest*0.12+ops*0.0001;
        next.push({mask:s.mask|e.bit,loc:e.loc,load,count,dist,ops,actions:[...s.actions,action],picked,delivered,score});
      }
    }
    if(!next.length) return null;
    next.sort((a,b)=>a.score-b.score);
    // Deduplicate equivalent states to preserve route diversity.
    const seen=new Set<string>(), trimmed:State[]=[];
    for(const s of next){
      const key=`${s.mask}|${s.loc}|${s.load}|${s.count}`;
      if(seen.has(key)) continue;
      seen.add(key); trimmed.push(s);
      if(trimmed.length>=beamWidth) break;
    }
    beam=trimmed;
  }
  let best: {s:State; total:number; work:number}|null=null;
  for(const s of beam){
    if(s.mask!==full || s.load!==0 || s.count!==0 || s.delivered.size!==subset.length) continue;
    const back=distance(s.loc,"L0"), total=Math.round((s.dist+back)*10)/10;
    const work=total+ s.ops*20; // km at 60 km/h means one minute per km
    if(work>540) continue;
    if(!best || total<best.total) best={s,total,work};
  }
  if(!best) return null;
  const finalActions=best.s.actions.map(a=>({...a}));
  return {vehicle,actions:finalActions,route:["L0",...finalActions.map(a=>a.location),"L0"],
    distanceKm:best.total,workMinutes:Math.round(best.work*10)/10,orderCount:subset.length};
}
export function optimize(): OptimizationResult {
  const light=orders.filter(o=>o.weight<=3500);
  const heavy=orders.filter(o=>o.weight>3500);
  let best: {a:VehiclePlan;b:VehiclePlan;total:number}|null=null;
  // Heavy machines can only fit in B. Enumerate all 2^5 assignments of lighter orders.
  for(let mask=0;mask<(1<<light.length);mask++){
    const aOrders=light.filter((_,i)=>(mask&(1<<i))!==0);
    const bOrders=[...heavy,...light.filter((_,i)=>(mask&(1<<i))===0)];
    const a=routeFor(aOrders,vehicles[0]);
    if(!a) continue;
    const b=routeFor(bOrders,vehicles[1]);
    if(!b) continue;
    const total=Math.round((a.distanceKm+b.distanceKm)*10)/10;
    if(!best || total<best.total) best={a,b,total};
  }
  if(!best){
    return {feasible:false,plans:[],totalDistanceKm:0,completedOrders:0,
      warnings:["Nije pronađen izvediv raspored uz zadana ograničenja. Pokušajte provjeriti radno vrijeme ili kapacitete."],
      algorithm:"Enumeracija dodjele + beam search ruta"};
  }
  return {feasible:true,plans:[best.a,best.b],totalDistanceKm:best.total,
    completedOrders:best.a.orderCount+best.b.orderCount,warnings:[],
    algorithm:"Enumeracija 32 raspodjele + beam search pickup/delivery ruta"};
}
export function validatePlan(plan: VehiclePlan): string[] {
  const errors:string[]=[]; let load=0,count=0; const picked=new Set<string>(), done=new Set<string>();
  for(const a of plan.actions){
    if(a.type==="PICKUP"){
      if(picked.has(a.orderId)) errors.push(`${a.orderId}: dvostruko preuzimanje`);
      picked.add(a.orderId); load+=a.weight; count++;
    } else {
      if(!picked.has(a.orderId)) errors.push(`${a.orderId}: isporuka prije preuzimanja`);
      if(done.has(a.orderId)) errors.push(`${a.orderId}: dvostruka isporuka`);
      done.add(a.orderId); load-=a.weight; count--;
    }
    if(load<0 || load>plan.vehicle.capacity) errors.push(`${a.orderId}: prekoračenje nosivosti`);
    if(count<0 || count>plan.vehicle.maxItems) errors.push(`${a.orderId}: prekoračenje broja strojeva`);
  }
  if(load!==0 || count!==0) errors.push("Kamion nije prazan na kraju rute");
  if(plan.route[0]!=="L0" || plan.route.at(-1)!=="L0") errors.push("Ruta mora početi i završiti u bazi");
  if(plan.workMinutes>540) errors.push("Prekoračeno maksimalno radno vrijeme od 9 sati");
  return errors;
}
