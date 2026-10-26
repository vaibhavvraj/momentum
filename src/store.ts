import { create } from 'zustand'
import Dexie, { type Table } from 'dexie'

export type Goal = { id: string; title: string; subjectId?: string; minutes: number; done: boolean; order: number; date: string }
export type Subject = { id: string; name: string; color: string; createdAt: string }
export type Chapter = { id: string; subjectId: string; name: string; estimatedMinutes: number; completedMinutes: number }
export type Session = { id: string; subjectId?: string; chapterId?: string; task: string; startedAt: string; endedAt: string; minutes: number; rating?: number; note?: string }
export type Note = { id: string; title: string; body: string; subjectId?: string; chapterId?: string; tags: string[]; pinned: boolean; updatedAt: string }
export type ProjectTask = { id: string; title: string; done: boolean }
export type Project = { id: string; name: string; description: string; deadline?: string; status: 'Planning' | 'In progress' | 'On hold' | 'Complete'; tasks: ProjectTask[]; color: string; updatedAt: string }
export type PlannerEvent = { id: string; title: string; subjectId?: string; date: string; start: string; end: string }
export type Reflection = { id: string; date: string; timeWasted: string; wentWell: string; improve: string }
export type Checkin = { id: string; date: string; mood?: string; energy?: string }
export type Settings = { id: 'main'; dailyGoalMinutes: number; weeklyGoalMinutes: number; monthlyGoalMinutes: number; pomodoroMinutes: number; accent: string; theme: 'dark' | 'light' | 'system' }

class WorkspaceDB extends Dexie {
  snapshots!: Table<{id:string}, string>
  goals!: Table<Goal, string>; subjects!: Table<Subject, string>; chapters!: Table<Chapter, string>; sessions!: Table<Session, string>
  notes!: Table<Note, string>; projects!: Table<Project, string>; plannerEvents!: Table<PlannerEvent, string>; reflections!: Table<Reflection, string>; checkins!: Table<Checkin, string>; settings!: Table<Settings, string>
  constructor(){
    super('momentum-workspace')
    this.version(1).stores({snapshots:'id'})
    this.version(2).stores({snapshots:null,goals:'id,date,subjectId',subjects:'id,name',chapters:'id,subjectId',sessions:'id,startedAt,subjectId,chapterId',notes:'id,updatedAt,subjectId,chapterId,*tags',projects:'id,status,updatedAt',plannerEvents:'id,date,subjectId',reflections:'id,date',checkins:'id,date',settings:'id'})
  }
}
const db = new WorkspaceDB()
const isoDay=(date=new Date())=>`${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`
export const todayKey=()=>isoDay()
export const emptySettings:Settings={id:'main',dailyGoalMinutes:300,weeklyGoalMinutes:1800,monthlyGoalMinutes:7200,pomodoroMinutes:25,accent:'#c5f36b',theme:'dark'}
const id=()=>crypto.randomUUID()

type Store={hydrated:boolean;goals:Goal[];subjects:Subject[];chapters:Chapter[];sessions:Session[];notes:Note[];projects:Project[];plannerEvents:PlannerEvent[];reflections:Reflection[];checkins:Checkin[];settings:Settings;hydrate:()=>Promise<void>;saveGoal:(v:Partial<Goal>&Pick<Goal,'title'|'minutes'>)=>Promise<void>;toggleGoal:(id:string)=>Promise<void>;deleteGoal:(id:string)=>Promise<void>;saveSubject:(v:Partial<Subject>&Pick<Subject,'name'>)=>Promise<void>;deleteSubject:(id:string)=>Promise<void>;saveChapter:(v:Partial<Chapter>&Pick<Chapter,'subjectId'|'name'>)=>Promise<void>;saveSession:(v:Omit<Session,'id'>)=>Promise<void>;saveNote:(v:Partial<Note>&Pick<Note,'title'>)=>Promise<void>;deleteNote:(id:string)=>Promise<void>;saveProject:(v:Partial<Project>&Pick<Project,'name'>)=>Promise<void>;deleteProject:(id:string)=>Promise<void>;toggleProjectTask:(projectId:string,taskId:string)=>Promise<void>;addProjectTask:(projectId:string,title:string)=>Promise<void>;savePlannerEvent:(v:Partial<PlannerEvent>&Pick<PlannerEvent,'title'|'date'|'start'|'end'>)=>Promise<void>;deletePlannerEvent:(id:string)=>Promise<void>;saveReflection:(v:Omit<Reflection,'id'>)=>Promise<void>;saveCheckin:(v:Omit<Checkin,'id'>)=>Promise<void>;updateSettings:(v:Partial<Settings>)=>Promise<void>;importData:(file:File)=>Promise<void>;resetData:()=>Promise<void>;exportData:()=>Promise<void>}

export const useWorkspace=create<Store>((set,get)=>{
  const upsert=<T extends {id:string}>(table:Table<T,string>,key:keyof Store,value:T,rows:T[])=>table.put(value).then(()=>set({[key]:[value,...rows.filter(x=>x.id!==value.id)]} as Partial<Store>))
  const remove=<T extends {id:string}>(table:Table<T,string>,key:keyof Store,idToRemove:string,rows:T[])=>table.delete(idToRemove).then(()=>set({[key]:rows.filter(x=>x.id!==idToRemove)} as Partial<Store>))
  return {
    hydrated:false,goals:[],subjects:[],chapters:[],sessions:[],notes:[],projects:[],plannerEvents:[],reflections:[],checkins:[],settings:emptySettings,
    hydrate:async()=>{
      const [goals,subjects,chapters,sessions,notes,projects,plannerEvents,reflections,checkins,savedSettings]=await Promise.all([db.goals.toArray(),db.subjects.toArray(),db.chapters.toArray(),db.sessions.orderBy('startedAt').reverse().toArray(),db.notes.orderBy('updatedAt').reverse().toArray(),db.projects.orderBy('updatedAt').reverse().toArray(),db.plannerEvents.toArray(),db.reflections.orderBy('date').reverse().toArray(),db.checkins.toArray(),db.settings.get('main')])
      if(!savedSettings)await db.settings.put(emptySettings)
      set({goals,subjects,chapters,sessions,notes,projects,plannerEvents,reflections,checkins,settings:savedSettings??emptySettings,hydrated:true})
    },
    saveGoal:async(v)=>{const old=v.id?get().goals.find(x=>x.id===v.id):undefined;const x:Goal={id:v.id??id(),title:v.title,subjectId:v.subjectId,minutes:v.minutes,done:v.done??old?.done??false,order:v.order??old?.order??get().goals.length,date:v.date??old?.date??todayKey()};await upsert(db.goals,'goals',x,get().goals)},
    toggleGoal:async(gid)=>{const g=get().goals.find(x=>x.id===gid);if(g)await get().saveGoal({...g,done:!g.done})},deleteGoal:(gid)=>remove(db.goals,'goals',gid,get().goals),
    saveSubject:async(v)=>{const old=v.id?get().subjects.find(x=>x.id===v.id):undefined;const x:Subject={id:v.id??id(),name:v.name,color:v.color??old?.color??get().settings.accent,createdAt:v.createdAt??old?.createdAt??new Date().toISOString()};await upsert(db.subjects,'subjects',x,get().subjects)},
    deleteSubject:async(sid)=>{await Promise.all([db.subjects.delete(sid),db.chapters.where('subjectId').equals(sid).delete(),db.goals.where('subjectId').equals(sid).modify(g=>{delete g.subjectId}),db.sessions.where('subjectId').equals(sid).modify(s=>{delete s.subjectId}),db.notes.where('subjectId').equals(sid).modify(n=>{delete n.subjectId}),db.plannerEvents.where('subjectId').equals(sid).modify(e=>{delete e.subjectId})]);set({subjects:get().subjects.filter(x=>x.id!==sid),chapters:get().chapters.filter(x=>x.subjectId!==sid),goals:get().goals.map(x=>{if(x.subjectId===sid){const{subjectId,...r}=x;return r}return x}),sessions:get().sessions.map(x=>{if(x.subjectId===sid){const{subjectId,...r}=x;return r}return x}),notes:get().notes.map(x=>{if(x.subjectId===sid){const{subjectId,...r}=x;return r}return x}),plannerEvents:get().plannerEvents.map(x=>{if(x.subjectId===sid){const{subjectId,...r}=x;return r}return x})})},
    saveChapter:async(v)=>{const old=v.id?get().chapters.find(x=>x.id===v.id):undefined;const x:Chapter={id:v.id??id(),subjectId:v.subjectId,name:v.name,estimatedMinutes:v.estimatedMinutes??old?.estimatedMinutes??0,completedMinutes:v.completedMinutes??old?.completedMinutes??0};await upsert(db.chapters,'chapters',x,get().chapters)},
    saveSession:async(v)=>{const x:Session={...v,id:id()};await db.transaction('rw',db.sessions,db.chapters,async()=>{await db.sessions.put(x);if(x.chapterId){const c=await db.chapters.get(x.chapterId);if(c)await db.chapters.put({...c,completedMinutes:c.completedMinutes+x.minutes})}});set({sessions:[x,...get().sessions],chapters:x.chapterId?get().chapters.map(c=>c.id===x.chapterId?{...c,completedMinutes:c.completedMinutes+x.minutes}:c):get().chapters})},
    saveNote:async(v)=>{const old=v.id?get().notes.find(x=>x.id===v.id):undefined;const x:Note={id:v.id??id(),title:v.title,body:v.body??old?.body??'',subjectId:v.subjectId??old?.subjectId,chapterId:v.chapterId??old?.chapterId,tags:v.tags??old?.tags??[],pinned:v.pinned??old?.pinned??false,updatedAt:new Date().toISOString()};await upsert(db.notes,'notes',x,get().notes)},deleteNote:(nid)=>remove(db.notes,'notes',nid,get().notes),
    saveProject:async(v)=>{const old=v.id?get().projects.find(x=>x.id===v.id):undefined;const x:Project={id:v.id??id(),name:v.name,description:v.description??old?.description??'',deadline:v.deadline??old?.deadline,status:v.status??old?.status??'Planning',tasks:v.tasks??old?.tasks??[],color:v.color??old?.color??get().settings.accent,updatedAt:new Date().toISOString()};await upsert(db.projects,'projects',x,get().projects)},
    deleteProject:(pid)=>remove(db.projects,'projects',pid,get().projects),
    toggleProjectTask:async(pid,tid)=>{const p=get().projects.find(x=>x.id===pid);if(p)await get().saveProject({...p,tasks:p.tasks.map(t=>t.id===tid?{...t,done:!t.done}:t)})},
    addProjectTask:async(pid,title)=>{const p=get().projects.find(x=>x.id===pid);if(p)await get().saveProject({...p,tasks:[...p.tasks,{id:id(),title,done:false}]})},
    savePlannerEvent:async(v)=>{const old=v.id?get().plannerEvents.find(x=>x.id===v.id):undefined;const x:PlannerEvent={id:v.id??id(),title:v.title,subjectId:v.subjectId??old?.subjectId,date:v.date,start:v.start,end:v.end};await upsert(db.plannerEvents,'plannerEvents',x,get().plannerEvents)},deletePlannerEvent:(eid)=>remove(db.plannerEvents,'plannerEvents',eid,get().plannerEvents),
    saveReflection:async(v)=>{const old=get().reflections.find(x=>x.date===v.date);const x:Reflection={...v,id:old?.id??id()};await db.reflections.put(x);set({reflections:[x,...get().reflections.filter(r=>r.id!==x.id)]})},
    saveCheckin:async(v)=>{const old=get().checkins.find(x=>x.date===v.date);const x:Checkin={...v,id:old?.id??id()};await db.checkins.put(x);set({checkins:[...get().checkins.filter(c=>c.id!==x.id),x]})},
    updateSettings:async(v)=>{const x={...get().settings,...v,id:'main' as const};await db.settings.put(x);set({settings:x})},
    importData:async(file)=>{const x=JSON.parse(await file.text()) as Partial<Store>;const names=['goals','subjects','chapters','sessions','notes','projects','plannerEvents','reflections','checkins'];if(!x||typeof x!=='object'||names.some(name=>!Array.isArray(x[name as keyof Store]))||!x.settings||typeof x.settings!=='object')throw new Error('Invalid Momentum backup');await Promise.all(names.map(name=>db.table(name).clear()));for(const name of names){const rows=x[name as keyof Store] as unknown[];if(rows.length)await db.table(name).bulkPut(rows)}const settings={...emptySettings,...x.settings,id:'main' as const};await db.settings.put(settings);await get().hydrate()},
    resetData:async()=>{await Promise.all([db.goals.clear(),db.subjects.clear(),db.chapters.clear(),db.sessions.clear(),db.notes.clear(),db.projects.clear(),db.plannerEvents.clear(),db.reflections.clear(),db.checkins.clear()]);await db.settings.put(emptySettings);set({goals:[],subjects:[],chapters:[],sessions:[],notes:[],projects:[],plannerEvents:[],reflections:[],checkins:[],settings:emptySettings,hydrated:true})},
    exportData:async()=>{const data=Object.fromEntries(await Promise.all(['goals','subjects','chapters','sessions','notes','projects','plannerEvents','reflections','checkins'].map(async k=>[k,await (db.table(k) as Table).toArray()])));const blob=new Blob([JSON.stringify({...data,settings:get().settings},null,2)],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='momentum-backup.json';a.click();URL.revokeObjectURL(a.href)}
  }
})
