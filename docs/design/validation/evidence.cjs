const fs = require('node:fs');
const path = require('node:path');
const groups=[];
for(const locale of ['en','es']) for(const theme of ['light','dark']) {
  const prefix=`${locale}-${theme}`;
  const cards=[390,1440].flatMap(width=>['full','lab','controls'].map(view=>{
    const file=`${prefix}-${width}-${view}.png`;
    const label=`${locale.toUpperCase()} / ${theme} / ${width}px / ${view}`;
    return `<a class="card" href="${file}"><img loading="lazy" src="${file}" alt="${label}"><span>${label}</span></a>`;
  }));
  const sections=[390,1440].flatMap(width=>['about','experience','skills','education','contact'].map(section=>`<li><a href="${prefix}-${width}-${section}.png">${section} · ${width}px</a></li>`));
  groups.push(`<section id="${prefix}"><h2>${locale.toUpperCase()} · ${theme}</h2><div class="grid">${cards.join('')}</div><details><summary>Capturas por sección</summary><ul>${sections.join('')}</ul></details><p><a href="${prefix}-print.pdf">Impresión PDF</a> · <a href="${prefix}-contrast.json">Mediciones de contraste</a></p></section>`);
}
const html=`<!doctype html><html lang="es"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>AstroCV · Evidencia del rediseño</title><style>body{max-width:1280px;margin:0 auto;padding:24px;font:16px/1.6 system-ui,sans-serif;color:#172033;background:#fff}a{color:#1d4ed8}h1{line-height:1.2}h2{margin-top:48px}nav{display:flex;gap:20px;flex-wrap:wrap}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,300px),1fr));gap:20px}.card{display:block;border:1px solid #858a93;border-radius:8px;overflow:hidden;text-decoration:none}.card img{display:block;width:100%;height:320px;object-fit:cover;object-position:top;border-bottom:1px solid #858a93}.card span{display:block;padding:12px}details{margin-top:20px}ul{columns:2}section{border-bottom:1px solid #d8dadd;padding-bottom:24px}:focus-visible{outline:3px solid #1d4ed8;outline-offset:3px}</style><h1>AstroCV · Evidencia del rediseño</h1><p>Capturas del build de producción en Chrome. Abre una imagen para verla completa. La página completa conserva el header; las capturas por sección usan el header estático y ocultan el enlace de salto fuera de pantalla para evitar artefactos de captura.</p><nav><a href="REPORT.md">Informe</a><a href="#en-light">EN claro</a><a href="#en-dark">EN oscuro</a><a href="#es-light">ES claro</a><a href="#es-dark">ES oscuro</a></nav>${groups.join('')}<p><a href="en-no-js.png">Sin JavaScript EN</a> · <a href="es-no-js.png">Sin JavaScript ES</a> · <a href="browser-results.json">Resultados visuales y de accesibilidad</a> · <a href="interaction-results.json">Resultados de interacción</a></p></html>`;
fs.writeFileSync(path.join(__dirname,'index.html'),html);
const missing=[...html.matchAll(/(?:href|src)="([^"]+)"/g)].map(match=>match[1]).filter(file=>!file.startsWith('#')&&!fs.existsSync(path.join(__dirname,file)));
if(missing.length) throw new Error(`Missing gallery files: ${missing.join(', ')}`);
console.log('All gallery links resolve to existing local files.');
for(const name of ['browser-results.json','interaction-results.json']) {
  const result=JSON.parse(fs.readFileSync(path.join(__dirname,name),'utf8'));
  console.log(name,JSON.stringify({checks:result.checks.length,passed:result.checks.filter(c=>c.pass).length,errors:result.errors,matrix:result.matrix?.length}));
}
