function a(n,t="info",i=4e3){const e=document.createElement("div");e.className="fixed top-4 right-4 z-[99999] transition-all duration-300 ease-out",e.style.transform="translateX(400px)",e.style.opacity="0";const r={success:"✓",error:"✕",warning:"⚠",info:"ℹ"},l={success:"bg-green-500",error:"bg-red-500",warning:"bg-yellow-500",info:"bg-blue-500"};e.innerHTML=`
        <div class="${l[t]} text-white px-6 py-4 rounded-lg shadow-2xl flex items-center gap-3 min-w-[300px] max-w-md">
            <div class="flex-shrink-0 w-8 h-8 rounded-full bg-white/20 flex items-center justify-center font-bold text-xl">
                ${r[t]}
            </div>
            <div class="flex-1">
                <p class="font-semibold text-sm leading-tight">${n}</p>
            </div>
            <button class="flex-shrink-0 text-white/80 hover:text-white transition-colors toast-close">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>
        </div>
    `,document.body.appendChild(e),requestAnimationFrame(()=>{e.style.transform="translateX(0)",e.style.opacity="1"});const s=()=>{e.style.transform="translateX(400px)",e.style.opacity="0",setTimeout(()=>{e.parentNode&&e.parentNode.removeChild(e)},300)},o=e.querySelector(".toast-close");o&&o.addEventListener("click",s),setTimeout(s,i)}export{a as s};
