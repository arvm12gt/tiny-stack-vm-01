// Tiny stack VM: 32-bit wrapping ints, 256-value stack, 64-deep call stack,
// 256 words of memory, 1M-step and 64K-output limits, ten traps. See ISA.md.
import{mkdirSync,readdirSync,readFileSync,writeFileSync}from'node:fs';
import{join}from'node:path';
export function runVM(p,g){
const s=new Int32Array(256),c=new Int32Array(64),m=new Int32Array(256),o=[],n=p.length;
let sp=0,cp=0,pc=0,q=0,ip=0,e=0,a,b,t;
for(;;){
if(q>=1e6){e=10;break}
if(pc<0||pc>=n){e=9;break}
switch(p[pc]){
case 0:return[Buffer.from(o),0];
case 1:if(pc+1>=n){e=9;break}if(sp>=256){e=3;break}t=p[pc+1];s[sp++]=t<128?t:t-256;pc+=2;break;
case 2:if(pc+4>=n){e=9;break}if(sp>=256){e=3;break}s[sp++]=p[pc+1]|p[pc+2]<<8|p[pc+3]<<16|p[pc+4]<<24;pc+=5;break;
case 3:if(sp<1){e=2;break}sp--;pc++;break;
case 4:if(sp<1){e=2;break}if(sp>=256){e=3;break}s[sp]=s[sp-1];sp++;pc++;break;
case 5:if(sp<2){e=2;break}t=s[sp-1];s[sp-1]=s[sp-2];s[sp-2]=t;pc++;break;
case 6:if(sp<2){e=2;break}if(sp>=256){e=3;break}s[sp]=s[sp-2];sp++;pc++;break;
case 7:if(sp<3){e=2;break}t=s[sp-3];s[sp-3]=s[sp-2];s[sp-2]=s[sp-1];s[sp-1]=t;pc++;break;
case 16:if(sp<2){e=2;break}b=s[--sp];a=s[sp-1];s[sp-1]=(a+b)|0;pc++;break;
case 17:if(sp<2){e=2;break}b=s[--sp];a=s[sp-1];s[sp-1]=(a-b)|0;pc++;break;
case 18:if(sp<2){e=2;break}b=s[--sp];a=s[sp-1];s[sp-1]=Math.imul(a,b);pc++;break;
case 19:if(sp<2){e=2;break}b=s[--sp];a=s[sp-1];if(!b){e=4;break}s[sp-1]=(a/b)|0;pc++;break;
case 20:if(sp<2){e=2;break}b=s[--sp];a=s[sp-1];if(!b){e=4;break}s[sp-1]=(a%b)|0;pc++;break;
case 21:if(sp<2){e=2;break}b=s[--sp];a=s[sp-1];if(!b){e=4;break}s[sp-1]=((a>>>0)/(b>>>0))|0;pc++;break;
case 22:if(sp<2){e=2;break}b=s[--sp];a=s[sp-1];if(!b){e=4;break}s[sp-1]=((a>>>0)%(b>>>0))|0;pc++;break;
case 23:if(sp<1){e=2;break}s[sp-1]=(-s[sp-1])|0;pc++;break;
case 24:if(sp<2){e=2;break}b=s[--sp];a=s[sp-1];s[sp-1]=a&b;pc++;break;
case 25:if(sp<2){e=2;break}b=s[--sp];a=s[sp-1];s[sp-1]=a|b;pc++;break;
case 26:if(sp<2){e=2;break}b=s[--sp];a=s[sp-1];s[sp-1]=a^b;pc++;break;
case 27:if(sp<1){e=2;break}s[sp-1]=~s[sp-1];pc++;break;
case 28:if(sp<2){e=2;break}b=s[--sp];a=s[sp-1];s[sp-1]=a<<(b&31);pc++;break;
case 29:if(sp<2){e=2;break}b=s[--sp];a=s[sp-1];s[sp-1]=a>>(b&31);pc++;break;
case 30:if(sp<2){e=2;break}b=s[--sp];a=s[sp-1];s[sp-1]=(a>>>(b&31))|0;pc++;break;
case 32:if(sp<2){e=2;break}b=s[--sp];a=s[sp-1];s[sp-1]=a===b?1:0;pc++;break;
case 33:if(sp<2){e=2;break}b=s[--sp];a=s[sp-1];s[sp-1]=a<b?1:0;pc++;break;
case 34:if(sp<2){e=2;break}b=s[--sp];a=s[sp-1];s[sp-1]=(a>>>0)<(b>>>0)?1:0;pc++;break;
case 48:if(pc+2>=n){e=9;break}t=p[pc+1]|p[pc+2]<<8;pc=pc+3+((t<<16)>>16);break;
case 49:if(pc+2>=n){e=9;break}if(sp<1){e=2;break}t=p[pc+1]|p[pc+2]<<8;pc=s[--sp]===0?pc+3+((t<<16)>>16):pc+3;break;
case 50:if(pc+2>=n){e=9;break}if(sp<1){e=2;break}t=p[pc+1]|p[pc+2]<<8;pc=s[--sp]!==0?pc+3+((t<<16)>>16):pc+3;break;
case 51:if(pc+2>=n){e=9;break}if(cp>=64){e=7;break}c[cp++]=pc+3;pc=p[pc+1]|p[pc+2]<<8;break;
case 52:if(cp<1){e=8;break}pc=c[--cp];break;
case 64:if(sp<1){e=2;break}a=s[sp-1];if(a<0||a>255){e=6;break}s[sp-1]=m[a];pc++;break;
case 65:if(sp<2){e=2;break}a=s[--sp];b=s[--sp];if(a<0||a>255){e=6;break}m[a]=b;pc++;break;
case 80:if(sp<1){e=2;break}t=String(s[--sp]);if(o.length+t.length>65536){e=11;break}for(let i=0;i<t.length;i++)o.push(t.charCodeAt(i));pc++;break;
case 81:if(sp<1){e=2;break}if(o.length>=65536){e=11;break}o.push(s[--sp]&255);pc++;break;
case 82:if(sp>=256){e=3;break}s[sp++]=ip<g.length?g[ip++]:-1;pc++;break;
case 83:if(sp<1){e=2;break}return[Buffer.from(o),s[--sp]&255];
default:e=5;
}
if(e)break;
q++;
}
return[Buffer.from(o),e];
}
if(process.argv[1]&&process.argv[1].endsWith('main.ts')){
const I=process.env.MAKEFUN_INPUT_DIR??'/input',O=process.env.MAKEFUN_OUTPUT_DIR??'/output';
for(const id of readdirSync(I).sort()){
const[stdout,code]=runVM(readFileSync(join(I,id,'program.bin')),readFileSync(join(I,id,'input.bin')));
mkdirSync(join(O,id),{recursive:true});
writeFileSync(join(O,id,'stdout.bin'),stdout);
writeFileSync(join(O,id,'exit.txt'),String(code)+'\n');
}
}
