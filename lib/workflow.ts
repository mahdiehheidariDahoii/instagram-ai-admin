export const workflowKey="instagram-ai-admin:workflow:v1";
export type WorkflowStage="planning"|"production"|"quality"|"final";
export type WorkflowState={active:boolean;stage:WorkflowStage;updatedAt:number;error?:string};
export function workflow():WorkflowState|null {
 try{const raw=sessionStorage.getItem(workflowKey);return raw?JSON.parse(raw) as WorkflowState:null;}catch{return null;}
}
export function advance(from:WorkflowStage,to:WorkflowStage){
 const state=workflow();
 if(!state?.active||state.stage!==from)return;
 sessionStorage.setItem(workflowKey,JSON.stringify({active:true,stage:to,updatedAt:Date.now()}));
 window.location.assign("/"+(to==="final"?"final-image-prompt":to));
}
export function pauseWorkflow(stage:WorkflowStage,reason:string){
 const state=workflow();if(!state?.active)return;
 sessionStorage.setItem(workflowKey,JSON.stringify({...state,active:false,stage,error:reason,updatedAt:Date.now()}));
}
