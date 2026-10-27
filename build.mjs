import { cp, mkdir, rm } from 'node:fs/promises';
await rm('dist', {recursive:true,force:true});
await mkdir('dist',{recursive:true});
for(const f of ['index.html','src']) await cp(f,`dist/${f}`,{recursive:true});
await cp('public','dist',{recursive:true});
console.log('Built static site in dist/');
