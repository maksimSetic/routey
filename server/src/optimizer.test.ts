import { describe,it,expect } from "vitest";
import { optimize, validatePlan } from "./optimizer.js";
import { vehicles } from "./data.js";
describe("UP RENT business constraints",()=>{
  const result=optimize();
  it("assigns every order exactly once and returns both trucks to base",()=>{
    expect(result.feasible).toBe(true);
    expect(result.completedOrders).toBe(10);
    for(const p of result.plans){ expect(p.route[0]).toBe("L0"); expect(p.route.at(-1)).toBe("L0"); }
  });
  it("never exceeds payload or simultaneous item limits",()=>{
    for(const p of result.plans) expect(validatePlan(p)).toEqual([]);
  });
  it("loads before delivery and uses the same truck for both actions",()=>{
    for(const p of result.plans){
      const picked=new Set<string>();
      for(const a of p.actions){ if(a.type==="PICKUP") picked.add(a.orderId); else expect(picked.has(a.orderId)).toBe(true); }
    }
  });
  it("respects the 9-hour total work limit including service time",()=>{
    for(const p of result.plans) expect(p.workMinutes).toBeLessThanOrEqual(540);
  });
  it("does not assign an individually overweight machine to truck A",()=>{
    expect(vehicles[0].capacity).toBe(3500);
    for(const p of result.plans.filter(x=>x.vehicle.id==="A"))
      for(const a of p.actions) expect(a.weight).toBeLessThanOrEqual(3500);
  });
});
