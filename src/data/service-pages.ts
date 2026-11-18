import source from './service-pages.json' with {type:'json'};
type ServiceBlock =
 | {type:'table';caption:string;headers:string[];rows:string[][];superheading:string}
 | {type:'groups';groups:{title:string;headers:string[];rows:string[][]}[]}
 | {type:'formats'}
 | {type:'heading';text:string}
 | {type:'copy';html:string};
export interface ServicePage {slug:string;title:string;heading:string;node:string;blocks:ServiceBlock[];}
export const servicePages=source as ServicePage[];
