// Serve the production build locally, then run isolated browser checks.
// Requires `npm run build` and an existing Playwright installation.
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { spawn } = require('node:child_process');
const root = path.resolve(__dirname, '../../..', 'dist');
const types = { '.html':'text/html; charset=utf-8','.js':'application/javascript','.css':'text/css','.svg':'image/svg+xml','.png':'image/png','.pdf':'application/pdf' };
const server = http.createServer((req,res)=>{
  let pathname;
  try { pathname = decodeURIComponent(new URL(req.url,'http://localhost').pathname); } catch {res.writeHead(400).end();return;}
  const file = path.resolve(root,'.'+(pathname.endsWith('/')?pathname+'index.html':pathname));
  if(!file.startsWith(root+path.sep)) {res.writeHead(403).end();return;}
  fs.readFile(file,(error,data)=>{
    if(error) {res.writeHead(404).end();return;}
    res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream'});res.end(data);
  });
});
server.listen(0,'127.0.0.1',async()=>{
  const base=`http://127.0.0.1:${server.address().port}`;
  console.log('Production build:',base);
  try {
    for(const script of (process.argv.length>2?process.argv.slice(2):['browser.cjs','interactions.cjs'])) {
      const code=await new Promise((resolve,reject)=>{
        const child=spawn(process.execPath,[path.join(__dirname,script)],{stdio:'inherit',env:{...process.env,BASE_URL:base}});
        child.on('error',reject);child.on('exit',resolve);
      });
      if(code!==0) process.exitCode=1;
    }
  } catch(error) {console.error(error);process.exitCode=1;}
  finally { server.close(); }
});
