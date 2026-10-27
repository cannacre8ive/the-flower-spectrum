import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
const root=process.cwd();
const types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.jpg':'image/jpeg','.png':'image/png','.woff2':'font/woff2','.json':'application/json'};
http.createServer(async(req,res)=>{
 try {let file=decodeURIComponent(new URL(req.url,'http://localhost').pathname); if(file==='/')file='/index.html';
 const base=file.startsWith('/assets/')||file==='/favicon.svg'||file==='/robots.txt'?path.join(root,'public'):root;
 const p=path.resolve(base,'.'+file); if(!p.startsWith(base+path.sep))throw Error();
 if(!(await stat(p)).isFile())throw Error();
 res.writeHead(200,{'Content-Type':types[path.extname(p)]||'application/octet-stream'});res.end(await readFile(p));
 }catch{res.writeHead(404);res.end('Not found');}
}).listen(4173,'0.0.0.0',()=>console.log('http://localhost:4173'));
