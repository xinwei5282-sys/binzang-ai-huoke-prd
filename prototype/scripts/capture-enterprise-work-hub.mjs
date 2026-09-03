import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
const out=resolve(process.argv.includes('--out-dir')?process.argv[process.argv.indexOf('--out-dir')+1]:'validation/enterprise-work-hub');
mkdirSync(out,{recursive:true});
writeFileSync(resolve(out,'README.txt'),'Browser capture target: workhub, enterprise memory, customer, project conflict, task and PPT routing.\n');
console.log(`enterprise work hub capture manifest written to ${out}`);
