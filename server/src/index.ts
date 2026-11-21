import express from "express";
import cors from "cors";
import { locations, orders, vehicles } from "./data.js";
import { optimize, validatePlan } from "./optimizer.js";
const app=express(); app.use(cors()); app.use(express.json());
app.get("/api/health",(_,res)=>res.json({status:"ok"}));
app.get("/api/data",(_,res)=>res.json({locations,orders,vehicles}));
app.post("/api/optimize",(_,res)=>{
  const result=optimize();
  const validation=result.plans.flatMap(p=>validatePlan(p).map(error=>`${p.vehicle.name}: ${error}`));
  res.json({...result,warnings:[...result.warnings,...validation],valid:validation.length===0});
});
const port=Number(process.env.PORT)||4000;
app.listen(port,()=>console.log(`UP RENT API running at http://localhost:${port}`));
